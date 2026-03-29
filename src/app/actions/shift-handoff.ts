"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveStaffContext } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HandoffResult {
  reassigned: number;
  unhandled: number;
}

export interface HandoffPreview {
  openRequestCount: number;
  availableStaff: Array<{
    staffId: string;
    name: string;
    department: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the user IDs of all staff currently checked in (shift_assignments.status = 'active')
 * for the given hotel, excluding the departing staff member.
 * Prefers same-department staff but falls back to any department.
 *
 * Returns an empty array when no eligible staff are found.
 */
async function findAvailableStaff(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hotelId: string,
  excludeUserId: string,
  preferredDepartment: string | null,
): Promise<Array<{ staffId: string; department: string | null }>> {
  // Active shift_assignments joined with staff_assignments (for hotel + department scoping)
  const { data, error } = await supabase
    .from("shift_assignments")
    .select(
      `
      staff_id,
      staff_assignments!inner (
        hotel_id,
        department,
        is_active
      )
      `,
    )
    .eq("status", "active")
    .eq("staff_assignments.hotel_id", hotelId)
    .eq("staff_assignments.is_active", true)
    .neq("staff_id", excludeUserId);

  if (error || !data || data.length === 0) return [];

  const staff = data.map((row) => {
    const sa = (row.staff_assignments as unknown) as {
      hotel_id: string;
      department: string | null;
      is_active: boolean;
    };
    return {
      staffId: row.staff_id as string,
      department: sa.department ?? null,
    };
  });

  if (!preferredDepartment) return staff;

  // Sort preferred department first; others remain as fallback
  const preferred = staff.filter((s) => s.department === preferredDepartment);
  const fallback = staff.filter((s) => s.department !== preferredDepartment);
  return [...preferred, ...fallback];
}

// ---------------------------------------------------------------------------
// handoffMyRequests
//
// Called when staff checks out of their shift. Reassigns all open requests
// assigned to the departing staff member to available on-shift colleagues.
//
// Strategy:
//   - Find all requests in ('new', 'pending', 'in_progress') assigned to this staff
//   - For each: attempt to reassign to an active colleague (same dept first, any dept fallback)
//   - If no available staff: leave assigned, insert a handoff-failed event
//
// Returns: count of reassigned and count of unhandled requests.
// ---------------------------------------------------------------------------

export async function handoffMyRequests(): Promise<ActionResult<HandoffResult>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate + resolve assignment (multi-tenant isolation + department)
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) {
      return { success: false, error: ctx.error };
    }

    const user = ctx.user!;
    const hotelId = ctx.assignment!.hotel_id;
    const department = ctx.assignment!.department;

    // 3. Find all open requests assigned to this staff member
    const { data: openRequests, error: fetchError } = await supabase
      .from("requests")
      .select("id, status")
      .eq("hotel_id", hotelId)
      .eq("assigned_staff_id", user.id)
      .in("status", ["new", "pending", "in_progress"]);

    if (fetchError) {
      return { success: false, error: "Unable to load open requests. Please try again." };
    }

    if (!openRequests || openRequests.length === 0) {
      return { success: true, data: { reassigned: 0, unhandled: 0 } };
    }

    // 4. Find available colleagues on active shifts
    const availableStaff = await findAvailableStaff(supabase, hotelId, user.id, department);

    let reassigned = 0;
    let unhandled = 0;

    // 5. Process each open request
    for (const request of openRequests) {
      if (availableStaff.length === 0) {
        // No available staff: log handoff failure event but leave the assignment unchanged
        await supabase.from("request_events").insert({
          request_id: request.id,
          status: request.status,
          notes: "Shift ended — no available staff for handoff",
          created_by: user.id,
        });
        unhandled++;
        continue;
      }

      // Pick the first available staff member (preferred dept first per findAvailableStaff sort)
      // Round-robin across requests: use index modulo so requests are spread across colleagues
      const target = availableStaff[reassigned % availableStaff.length];

      const { error: updateError } = await supabase
        .from("requests")
        .update({
          assigned_staff_id: target.staffId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("hotel_id", hotelId);

      if (updateError) {
        // Log the failure but continue processing remaining requests
        await supabase.from("request_events").insert({
          request_id: request.id,
          status: request.status,
          notes: "Shift ended — handoff failed, please reassign manually",
          created_by: user.id,
        });
        unhandled++;
        continue;
      }

      await supabase.from("request_events").insert({
        request_id: request.id,
        status: request.status,
        notes: "Auto-reassigned during shift handoff",
        created_by: user.id,
      });

      reassigned++;
    }

    return { success: true, data: { reassigned, unhandled } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getHandoffPreview
//
// Returns a dry-run preview of what would happen if the authenticated staff
// member checks out now. Shows the count of open requests and available
// colleagues. Helps staff understand the impact before actually checking out.
// ---------------------------------------------------------------------------

export async function getHandoffPreview(): Promise<ActionResult<HandoffPreview>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate + resolve assignment (multi-tenant isolation + department)
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) {
      return { success: false, error: ctx.error };
    }

    const user = ctx.user!;
    const hotelId = ctx.assignment!.hotel_id;
    const department = ctx.assignment!.department;

    // 3. Count open requests assigned to this staff member
    const { count, error: countError } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId)
      .eq("assigned_staff_id", user.id)
      .in("status", ["new", "pending", "in_progress"]);

    if (countError) {
      return { success: false, error: "Unable to count open requests. Please try again." };
    }

    const openRequestCount = count ?? 0;

    // 4. Find available colleagues
    const availableStaffRaw = await findAvailableStaff(supabase, hotelId, user.id, department);

    // Enrich with names from profiles
    const staffIds = availableStaffRaw.map((s) => s.staffId);
    let nameMap = new Map<string, string>();

    if (staffIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIds);

      nameMap = new Map(
        (profiles ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "Staff Member"]),
      );
    }

    const availableStaff = availableStaffRaw.map((s) => ({
      staffId: s.staffId,
      name: nameMap.get(s.staffId) ?? "Staff Member",
      department: s.department,
    }));

    return {
      success: true,
      data: { openRequestCount, availableStaff },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
