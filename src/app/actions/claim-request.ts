"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const claimRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  expectedVersion: z.number().int().positive("Expected version must be a positive integer"),
});

const releaseRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  expectedVersion: z.number().int().positive("Expected version must be a positive integer"),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClaimResult {
  id: string;
  version: number;
  assignedStaffId: string;
}

// ---------------------------------------------------------------------------
// claimRequest
//
// Atomically claims an unassigned request for the authenticated staff member
// using optimistic locking. The WHERE clause enforces that:
//   1. The request belongs to the staff's hotel
//   2. The request is currently unassigned (assigned_staff_id IS NULL)
//   3. The version matches what the caller observed (no concurrent modification)
//
// NOTE: getStaffRequests (in staff.ts) MUST include the `version` field in its
// SELECT so callers always have a fresh version to pass here. If version is
// omitted from that query, claims will fail with stale-version errors.
// ---------------------------------------------------------------------------

export async function claimRequest(
  requestId: string,
  expectedVersion: number,
): Promise<ActionResult<ClaimResult>> {
  // 1. Validate input
  const parsed = claimRequestSchema.safeParse({ requestId, expectedVersion });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
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

    // 3. Get staff's hotel_id from an active staff assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("staff_assignments")
      .select("hotel_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (assignmentError) {
      return { success: false, error: "Unable to retrieve staff assignment. Please try again." };
    }
    if (!assignment) {
      return { success: false, error: "No active staff assignment found for your account." };
    }

    const hotelId = assignment.hotel_id;

    // 4. Atomic optimistic-lock claim:
    //    - hotel_id scopes the update to this tenant
    //    - assigned_staff_id IS NULL ensures the request is unclaimed
    //    - version = expectedVersion detects any concurrent modification
    //
    //    The trigger trg_increment_request_version will fire and set
    //    version = OLD.version + 1 because assigned_staff_id is changing.
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update({
        assigned_staff_id: user.id,
        // Transition 'new' → 'pending' on first claim; leave other statuses intact
        status: "pending" as const,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", hotelId)
      .is("assigned_staff_id", null)
      .eq("version", parsed.data.expectedVersion)
      // Limit status transition: only claim when status is 'new' or 'pending'
      .in("status", ["new", "pending"])
      .select("id, version, assigned_staff_id, status")
      .maybeSingle();

    if (updateError) {
      return { success: false, error: "Failed to claim request. Please try again." };
    }

    // 5. If 0 rows affected, diagnose why
    if (!updated) {
      const { data: current, error: fetchError } = await supabase
        .from("requests")
        .select("id, assigned_staff_id, version, hotel_id")
        .eq("id", parsed.data.requestId)
        .eq("hotel_id", hotelId)
        .maybeSingle();

      if (fetchError || !current) {
        return { success: false, error: "Request not found." };
      }

      if (current.assigned_staff_id !== null) {
        return {
          success: false,
          error: "This request has already been claimed by another staff member.",
        };
      }

      if (current.version !== parsed.data.expectedVersion) {
        return {
          success: false,
          error: "This request was modified. Please refresh and try again.",
        };
      }

      // Request exists but status is not claimable (e.g. in_progress, completed, cancelled)
      return {
        success: false,
        error: "This request cannot be claimed in its current state.",
      };
    }

    // 6. Insert audit event
    await supabase.from("request_events").insert({
      request_id: updated.id,
      status: updated.status,
      notes: "Request claimed by staff",
      created_by: user.id,
    });

    return {
      success: true,
      data: {
        id: updated.id,
        version: updated.version,
        assignedStaffId: updated.assigned_staff_id as string,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// releaseRequest
//
// Releases a claimed request back to unassigned state. Only the assigned
// staff member or a manager may release. Uses optimistic locking on version.
//
// NOTE: getStaffRequests (in staff.ts) MUST include `version` in its SELECT
// so callers always pass a fresh version when calling this function.
// ---------------------------------------------------------------------------

export async function releaseRequest(
  requestId: string,
  expectedVersion: number,
): Promise<ActionResult<ClaimResult>> {
  // 1. Validate input
  const parsed = releaseRequestSchema.safeParse({ requestId, expectedVersion });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
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

    // 3. Get staff's hotel_id from active staff assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("staff_assignments")
      .select("hotel_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return { success: false, error: "No active staff assignment found for your account." };
    }

    const hotelId = assignment.hotel_id;

    // 4. Check manager role from user_roles table (not JWT claims)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const isManager = roleData?.role === "manager" || roleData?.role === "super_admin";

    // 5. Fetch current request scoped to hotel_id (multi-tenant isolation)
    const { data: current, error: fetchError } = await supabase
      .from("requests")
      .select("id, assigned_staff_id, version, hotel_id, status")
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (fetchError || !current) {
      return { success: false, error: "Request not found." };
    }

    // 6. Authorization: only the assigned staff or a manager can release
    const isAssigned = current.assigned_staff_id === user.id;
    if (!isAssigned && !isManager) {
      return {
        success: false,
        error: "You are not authorized to release this request.",
      };
    }

    if (current.assigned_staff_id === null) {
      return { success: false, error: "This request is not currently claimed." };
    }

    // 7. Atomic optimistic-lock release:
    //    - version check prevents clobbering a concurrent modification
    //    - Transition 'pending' → 'new' on release; leave other statuses intact
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update({
        assigned_staff_id: null,
        status: current.status === "pending" ? ("new" as const) : current.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", current.hotel_id)
      .eq("version", parsed.data.expectedVersion)
      .select("id, version, assigned_staff_id, status")
      .maybeSingle();

    if (updateError) {
      return { success: false, error: "Failed to release request. Please try again." };
    }

    // 8. If 0 rows affected, the version was stale — a concurrent update occurred
    if (!updated) {
      return {
        success: false,
        error: "This request was modified. Please refresh and try again.",
      };
    }

    // 9. Insert audit event
    await supabase.from("request_events").insert({
      request_id: updated.id,
      status: updated.status,
      notes: "Request released by staff",
      created_by: user.id,
    });

    return {
      success: true,
      data: {
        id: updated.id,
        version: updated.version,
        // assigned_staff_id is null after release; cast to empty string for type compat
        assignedStaffId: updated.assigned_staff_id ?? "",
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
