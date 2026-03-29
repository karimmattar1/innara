"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveHotelId, isManagerRole } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const escalateRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be 500 characters or fewer").trim(),
});

const requestIdSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
});

const hotelIdSchema = z.object({
  hotelId: z.string().uuid("Invalid hotel ID").optional(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EscalatedRequest {
  id: string;
  hotelId: string;
  status: string;
  priority: string;
  category: string;
  isEscalated: boolean;
  escalatedAt: string;
  escalatedBy: string;
  escalationReason: string | null;
  assignedStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// escalateRequest
//
// Staff escalates a request to management when they cannot resolve it.
// Only the assigned staff member on an active (pending/in_progress) request
// may escalate. Escalation auto-promotes priority to 'urgent'.
// ---------------------------------------------------------------------------

export async function escalateRequest(
  input: { requestId: string; reason: string },
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input
  const parsed = escalateRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
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

    // 3. Resolve hotel (multi-tenant isolation)
    const hotelId = await resolveHotelId(supabase, user.id);
    if (!hotelId) {
      return { success: false, error: "No active staff assignment found." };
    }

    // 4. Fetch request — scoped to this hotel
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, hotel_id, status, assigned_staff_id, is_escalated")
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "Request not found." };
    }

    // 5. Authorization: only the assigned staff member may escalate
    if (request.assigned_staff_id !== user.id) {
      return { success: false, error: "You can only escalate requests assigned to you." };
    }

    // 6. Status guard: can only escalate pending or in_progress requests
    const escalatableStatuses = ["pending", "in_progress"];
    if (!escalatableStatuses.includes(request.status as string)) {
      return {
        success: false,
        error: `Cannot escalate a request with status "${request.status}". Only pending or in-progress requests can be escalated.`,
      };
    }

    // 7. Already escalated?
    if (request.is_escalated) {
      return { success: false, error: "This request is already escalated." };
    }

    // 8. Apply escalation: set flags, auto-promote priority to urgent
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        is_escalated: true,
        escalated_at: new Date().toISOString(),
        escalated_by: user.id,
        escalation_reason: parsed.data.reason,
        priority: "urgent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", hotelId);

    if (updateError) {
      return { success: false, error: "Failed to escalate request. Please try again." };
    }

    // 9. Audit event
    await supabase.from("request_events").insert({
      request_id: parsed.data.requestId,
      status: request.status,
      notes: `Escalated to management: ${parsed.data.reason}`,
      created_by: user.id,
    });

    return { success: true, data: { id: parsed.data.requestId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getEscalatedRequests
//
// Manager-facing: returns all active escalated requests for the hotel.
// Ordered by escalated_at descending so the most recent escalations appear
// first. Excludes completed and cancelled requests.
// ---------------------------------------------------------------------------

export async function getEscalatedRequests(
  hotelId?: string,
): Promise<ActionResult<EscalatedRequest[]>> {
  // 1. Validate optional hotelId
  const parsed = hotelIdSchema.safeParse({ hotelId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid hotel ID" };
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

    // 3. Determine the effective hotel_id
    //    If caller supplied one, use it (managers may specify). Otherwise resolve from assignment.
    let effectiveHotelId = parsed.data.hotelId ?? null;
    if (!effectiveHotelId) {
      effectiveHotelId = await resolveHotelId(supabase, user.id);
    }
    if (!effectiveHotelId) {
      return { success: false, error: "No active staff assignment found." };
    }

    // 4. Authorization: manager or super_admin only
    const managerAccess = await isManagerRole(supabase, user.id);
    if (!managerAccess) {
      return { success: false, error: "Access denied. Manager role required." };
    }

    // 5. Query escalated, active requests
    const { data: requests, error: queryError } = await supabase
      .from("requests")
      .select(
        "id, hotel_id, status, priority, category, is_escalated, escalated_at, escalated_by, escalation_reason, assigned_staff_id, created_at, updated_at",
      )
      .eq("hotel_id", effectiveHotelId)
      .eq("is_escalated", true)
      .not("status", "in", '("completed","cancelled")')
      .order("escalated_at", { ascending: false });

    if (queryError) {
      return { success: false, error: "Unable to load escalated requests. Please try again." };
    }

    const result: EscalatedRequest[] = (requests ?? []).map((r) => ({
      id: r.id as string,
      hotelId: r.hotel_id as string,
      status: r.status as string,
      priority: r.priority as string,
      category: r.category as string,
      isEscalated: r.is_escalated as boolean,
      escalatedAt: r.escalated_at as string,
      escalatedBy: r.escalated_by as string,
      escalationReason: r.escalation_reason as string | null,
      assignedStaffId: r.assigned_staff_id as string | null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// resolveEscalation
//
// Manager clears the escalation flag after they have addressed the issue.
// Only managers and super_admins may call this.
// ---------------------------------------------------------------------------

export async function resolveEscalation(
  requestId: string,
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input
  const parsed = requestIdSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: "Invalid request ID" };
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

    // 3. Authorization: manager or super_admin only
    const managerAccess = await isManagerRole(supabase, user.id);
    if (!managerAccess) {
      return { success: false, error: "Access denied. Manager role required." };
    }

    // 4. Resolve hotel for multi-tenant isolation
    const hotelId = await resolveHotelId(supabase, user.id);
    if (!hotelId) {
      return { success: false, error: "No active staff assignment found." };
    }

    // 5. Fetch request to confirm it is escalated and belongs to this hotel
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, hotel_id, is_escalated, status")
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "Request not found." };
    }

    if (!request.is_escalated) {
      return { success: false, error: "This request is not currently escalated." };
    }

    // 6. Clear escalation flag
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        is_escalated: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", hotelId);

    if (updateError) {
      return { success: false, error: "Failed to resolve escalation. Please try again." };
    }

    // 7. Audit event
    await supabase.from("request_events").insert({
      request_id: parsed.data.requestId,
      status: request.status,
      notes: "Escalation resolved by manager",
      created_by: user.id,
    });

    return { success: true, data: { id: parsed.data.requestId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
