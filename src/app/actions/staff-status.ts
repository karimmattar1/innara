"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveStaffContext } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";
import { DEPARTMENTS } from "@/constants/app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvailabilityStatus = "available" | "on_break" | "away";

export type Department = (typeof DEPARTMENTS)[number];

export interface AvailabilityStatusData {
  status: AvailabilityStatus;
  changedAt: string | null;
}

export interface AvailableStaffMember {
  staffId: string;
  name: string;
  department: Department;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const AVAILABILITY_STATUSES = ["available", "on_break", "away"] as const;

const setAvailabilityStatusSchema = z.object({
  newStatus: z.enum(AVAILABILITY_STATUSES),
});

const getAvailableStaffSchema = z.object({
  hotelId: z.string().uuid("Invalid hotel ID").optional(),
});

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/**
 * Resolves the authenticated user's active staff assignment, including the
 * availability_status and status_changed_at fields that are specific to this
 * module. Uses resolveStaffContext for core auth + assignment lookup, then
 * fetches the extra availability fields in a second targeted query.
 */
async function resolveAssignment(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{
  user: { id: string } | null;
  assignment: {
    id: string;
    hotel_id: string;
    department: string;
    availability_status: string;
    status_changed_at: string | null;
  } | null;
  error: string | null;
}> {
  const ctx = await resolveStaffContext(supabase);
  if (ctx.error) {
    return { user: ctx.user, assignment: null, error: ctx.error };
  }

  // Fetch the extra availability fields not included in the shared context
  const { data: extra, error: extraError } = await supabase
    .from("staff_assignments")
    .select("availability_status, status_changed_at")
    .eq("id", ctx.assignment!.id)
    .single();

  if (extraError || !extra) {
    return { user: ctx.user, assignment: null, error: "No active staff assignment found." };
  }

  return {
    user: ctx.user,
    assignment: {
      id: ctx.assignment!.id,
      hotel_id: ctx.assignment!.hotel_id,
      department: ctx.assignment!.department as string,
      availability_status: extra.availability_status as string,
      status_changed_at: extra.status_changed_at as string | null,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getMyAvailabilityStatus
// ---------------------------------------------------------------------------

/**
 * Returns the current availability status for the authenticated staff member.
 */
export async function getMyAvailabilityStatus(): Promise<
  ActionResult<AvailabilityStatusData>
> {
  try {
    const supabase = await createClient();
    const { assignment, error } = await resolveAssignment(supabase);

    if (error) {
      return { success: false, error };
    }

    return {
      success: true,
      data: {
        status: assignment!.availability_status as AvailabilityStatus,
        changedAt: assignment!.status_changed_at,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// setAvailabilityStatus
// ---------------------------------------------------------------------------

/**
 * Updates the availability status of the authenticated staff member.
 * Sets status_changed_at to the current timestamp on every change.
 */
export async function setAvailabilityStatus(
  newStatus: AvailabilityStatus,
): Promise<ActionResult<AvailabilityStatusData>> {
  // 1. Validate input
  const parsed = setAvailabilityStatusSchema.safeParse({ newStatus });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid status";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate + verify assignment
    const { user, assignment, error } = await resolveAssignment(supabase);
    if (error) {
      return { success: false, error };
    }

    const now = new Date().toISOString();

    // 3. Update availability_status and status_changed_at
    const { data: updated, error: updateError } = await supabase
      .from("staff_assignments")
      .update({
        availability_status: parsed.data.newStatus,
        status_changed_at: now,
      })
      .eq("id", assignment!.id)
      .eq("user_id", user!.id)
      .select("availability_status, status_changed_at")
      .single();

    if (updateError || !updated) {
      return { success: false, error: "Failed to update status. Please try again." };
    }

    return {
      success: true,
      data: {
        status: updated.availability_status as AvailabilityStatus,
        changedAt: updated.status_changed_at as string | null,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getAvailableStaff
// ---------------------------------------------------------------------------

/**
 * Returns all active staff members with availability_status = 'available'
 * for the given hotel. If hotelId is omitted, it is resolved from the
 * authenticated user's own staff assignment.
 *
 * NOTE: getActiveStaffOnShift() in shifts.ts returns staff who are currently
 * checked in to a shift. A future integration pass should also filter those
 * results by availability_status = 'available' so that staff on break/away
 * are excluded from auto-assignment candidates even when they are shift-active.
 * See INN-121 for context.
 */
export async function getAvailableStaff(
  hotelId?: string,
): Promise<ActionResult<AvailableStaffMember[]>> {
  // 1. Validate optional hotelId if provided
  const parsed = getAvailableStaffSchema.safeParse({ hotelId });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid hotel ID";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Resolve hotel_id — use provided value or fall back to the user's own assignment
    let resolvedHotelId = parsed.data.hotelId;
    if (!resolvedHotelId) {
      const { data: ownAssignment, error: assignError } = await supabase
        .from("staff_assignments")
        .select("hotel_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (assignError || !ownAssignment) {
        return { success: false, error: "No active staff assignment found." };
      }
      resolvedHotelId = ownAssignment.hotel_id as string;
    }

    // 4. Query all available active staff for this hotel
    const { data: assignments, error: queryError } = await supabase
      .from("staff_assignments")
      .select("user_id, department")
      .eq("hotel_id", resolvedHotelId)
      .eq("is_active", true)
      .eq("availability_status", "available");

    if (queryError) {
      return { success: false, error: "Unable to retrieve available staff. Please try again." };
    }

    if (!assignments || assignments.length === 0) {
      return { success: true, data: [] };
    }

    const staffIds = assignments.map((a) => a.user_id as string);

    // 5. Fetch names from profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    if (profileError) {
      return { success: false, error: "Unable to retrieve staff profiles. Please try again." };
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "Staff Member"]),
    );

    // 6. Build response
    const availableStaff: AvailableStaffMember[] = assignments.map((a) => ({
      staffId: a.user_id as string,
      department: a.department as Department,
      name: profileMap.get(a.user_id as string) ?? "Staff Member",
    }));

    return { success: true, data: availableStaff };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
