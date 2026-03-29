"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  DEPARTMENT_CATEGORY_MAP,
  DEPARTMENTS,
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  VALID_TRANSITIONS,
} from "@/constants/app";
import { resolveStaffContext } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const staffRequestFiltersSchema = z.object({
  status: z.array(z.enum(REQUEST_STATUSES)).optional(),
  category: z.array(z.enum(REQUEST_CATEGORIES)).optional(),
  priority: z.array(z.enum(REQUEST_PRIORITIES)).optional(),
  assignedToMe: z.boolean().optional(),
  department: z.enum(DEPARTMENTS).optional(),
  myDepartmentOnly: z.boolean().optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const requestIdSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
});

const updateStatusSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  newStatus: z.enum(REQUEST_STATUSES),
  note: z.string().max(1000).optional(),
});

const assignRequestSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  targetStaffId: z.string().uuid("Invalid staff ID"),
});

const setEtaSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  etaMinutes: z.number().int().min(1).max(1440),
});

export type StaffRequestFilters = z.input<typeof staffRequestFiltersSchema>;

// ---------------------------------------------------------------------------
// getStaffProfile
// ---------------------------------------------------------------------------

export async function getStaffProfile(): Promise<
  ActionResult<{
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    hotelId: string;
    isActive: boolean;
    avatarUrl: string | null;
  }>
> {
  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const { user, assignment } = ctx;

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url")
      .eq("id", user!.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { success: false, error: "Unable to load profile." };
    }

    // Get role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .limit(1)
      .maybeSingle();

    return {
      success: true,
      data: {
        id: user!.id,
        name: profile.full_name ?? "Staff Member",
        email: profile.email ?? user!.email ?? "",
        department: assignment!.department ?? "",
        role: roleRow?.role ?? "staff",
        hotelId: assignment!.hotel_id,
        isActive: assignment!.is_active,
        avatarUrl: profile.avatar_url ?? null,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getStaffRequests
// ---------------------------------------------------------------------------

export async function getStaffRequests(
  filters?: StaffRequestFilters,
): Promise<ActionResult<{ requests: unknown[]; total: number }>> {
  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const parsed = staffRequestFiltersSchema.safeParse(filters ?? {});
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid filters" };
    }

    const { page, pageSize, status, category, priority, assignedToMe, department, myDepartmentOnly, search } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Resolve department-based category filter.
    // myDepartmentOnly takes the staff member's own department from their assignment.
    // An explicit department value overrides myDepartmentOnly if both are provided.
    // front_desk maps to null, meaning no category filter is applied (they see everything).
    let effectiveDepartment = department;
    if (myDepartmentOnly && !department) {
      effectiveDepartment = ctx.assignment!.department as typeof DEPARTMENTS[number];
    }
    const departmentCategory = effectiveDepartment
      ? DEPARTMENT_CATEGORY_MAP[effectiveDepartment]
      : undefined;

    // NOTE: version column is required by claim-request.ts for optimistic locking
    let query = supabase
      .from("requests")
      .select(
        "id, category, item, description, room_number, priority, status, assigned_staff_id, eta_minutes, completed_at, created_at, updated_at, version",
        { count: "exact" },
      )
      .eq("hotel_id", ctx.assignment!.hotel_id);

    if (status && status.length > 0) {
      query = query.in("status", status);
    }
    // Apply category filter: explicit category[] wins; department mapping is additive when no
    // explicit category[] is present and the department does not map to null (front_desk).
    if (category && category.length > 0) {
      query = query.in("category", category);
    } else if (departmentCategory !== undefined && departmentCategory !== null) {
      query = query.eq("category", departmentCategory);
    }
    if (priority && priority.length > 0) {
      query = query.in("priority", priority);
    }
    if (assignedToMe) {
      query = query.eq("assigned_staff_id", ctx.user!.id);
    }
    if (search) {
      // Sanitize PostgREST special characters to prevent filter injection
      const sanitized = search.replace(/[%_\\,().]/g, "\\$&");
      query = query.or(`item.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: requests, error: queryError, count } = await query;

    if (queryError) {
      return { success: false, error: "Unable to load requests. Please try again." };
    }

    return { success: true, data: { requests: requests ?? [], total: count ?? 0 } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getStaffRequestById
// ---------------------------------------------------------------------------

export async function getStaffRequestById(
  requestId: string,
): Promise<ActionResult<unknown>> {
  const parsed = requestIdSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: "Invalid request ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const { data: request, error: queryError } = await supabase
      .from("requests")
      .select(
        `
        id, category, item, description, room_number, priority, status,
        assigned_staff_id, eta_minutes, completed_at, created_at, updated_at, version,
        request_events (
          id, status, notes, created_by, created_at
        ),
        messages (
          id, sender_id, sender_type, content, is_internal, created_at
        )
        `,
      )
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", ctx.assignment!.hotel_id)
      .maybeSingle();

    if (queryError) {
      return { success: false, error: "Unable to load request. Please try again." };
    }

    if (!request) {
      return { success: false, error: "Request not found." };
    }

    return { success: true, data: request };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// claimRequest (simple version — optimistic locking is in claim-request.ts)
// ---------------------------------------------------------------------------

export async function claimRequest(
  requestId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = requestIdSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: "Invalid request ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    // Fetch request to check state
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, status, assigned_staff_id, hotel_id")
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", ctx.assignment!.hotel_id)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "Request not found." };
    }

    if (request.assigned_staff_id) {
      return { success: false, error: "This request has already been claimed." };
    }

    if (request.status !== "new" && request.status !== "pending") {
      return { success: false, error: "Only new or pending requests can be claimed." };
    }

    // Claim it
    const newStatus = request.status === "new" ? "pending" : request.status;
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        assigned_staff_id: ctx.user!.id,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      .eq("assigned_staff_id", null); // Guard against race condition

    if (updateError) {
      return { success: false, error: "Failed to claim request. It may have been claimed by another staff member." };
    }

    // Log event
    await supabase.from("request_events").insert({
      request_id: parsed.data.requestId,
      status: newStatus,
      notes: "Request claimed by staff",
      created_by: ctx.user!.id,
    });

    return { success: true, data: { id: parsed.data.requestId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// updateRequestStatus
// ---------------------------------------------------------------------------

export async function updateRequestStatus(
  input: { requestId: string; newStatus: string; note?: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    // Fetch current request
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, status, assigned_staff_id, hotel_id")
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", ctx.assignment!.hotel_id)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "Request not found." };
    }

    // Check if user is assigned or is a manager
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.user!.id)
      .limit(1)
      .maybeSingle();

    const isManager = roleRow?.role === "manager" || roleRow?.role === "super_admin";
    const isAssigned = request.assigned_staff_id === ctx.user!.id;

    if (!isAssigned && !isManager) {
      return { success: false, error: "You can only update requests assigned to you." };
    }

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[request.status as keyof typeof VALID_TRANSITIONS] ?? [];
    if (!allowedNext.includes(parsed.data.newStatus)) {
      return {
        success: false,
        error: `Cannot transition from "${request.status}" to "${parsed.data.newStatus}".`,
      };
    }

    // Update
    const updateData: Record<string, unknown> = {
      status: parsed.data.newStatus,
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.newStatus === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", ctx.assignment!.hotel_id);

    if (updateError) {
      return { success: false, error: "Failed to update request status." };
    }

    // Log event
    await supabase.from("request_events").insert({
      request_id: parsed.data.requestId,
      status: parsed.data.newStatus,
      notes: parsed.data.note ?? null,
      created_by: ctx.user!.id,
    });

    return { success: true, data: { id: parsed.data.requestId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// assignRequest
// ---------------------------------------------------------------------------

export async function assignRequest(
  input: { requestId: string; targetStaffId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = assignRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    // Verify request belongs to this hotel
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, hotel_id, assigned_staff_id")
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", ctx.assignment!.hotel_id)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "Request not found." };
    }

    // Verify target staff is in the same hotel and active
    const { data: targetAssignment, error: targetError } = await supabase
      .from("staff_assignments")
      .select("id, user_id, hotel_id, is_active")
      .eq("user_id", parsed.data.targetStaffId)
      .eq("hotel_id", ctx.assignment!.hotel_id)
      .eq("is_active", true)
      .maybeSingle();

    if (targetError || !targetAssignment) {
      return { success: false, error: "Target staff member not found or inactive." };
    }

    // Update assignment
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        assigned_staff_id: parsed.data.targetStaffId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", ctx.assignment!.hotel_id);

    if (updateError) {
      return { success: false, error: "Failed to assign request." };
    }

    // Log event
    await supabase.from("request_events").insert({
      request_id: parsed.data.requestId,
      status: "pending",
      notes: `Request reassigned to another staff member`,
      created_by: ctx.user!.id,
    });

    return { success: true, data: { id: parsed.data.requestId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// setRequestEta
// ---------------------------------------------------------------------------

export async function setRequestEta(
  input: { requestId: string; etaMinutes: number },
): Promise<ActionResult> {
  const parsed = setEtaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    // Verify request is assigned to this staff member
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("id, assigned_staff_id")
      .eq("id", parsed.data.requestId)
      .eq("hotel_id", ctx.assignment!.hotel_id)
      .maybeSingle();

    if (fetchError || !request) {
      return { success: false, error: "Request not found." };
    }

    if (request.assigned_staff_id !== ctx.user!.id) {
      return { success: false, error: "You can only set ETA on requests assigned to you." };
    }

    const { error: updateError } = await supabase
      .from("requests")
      .update({
        eta_minutes: parsed.data.etaMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId);

    if (updateError) {
      return { success: false, error: "Failed to update ETA." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getStaffMembers
// ---------------------------------------------------------------------------

const getStaffMembersParamsSchema = z.object({
  department: z.enum(DEPARTMENTS).optional(),
});

export async function getStaffMembers(
  params?: { department?: typeof DEPARTMENTS[number] },
): Promise<
  ActionResult<{ id: string; name: string; department: string; role: string }[]>
> {
  const parsedParams = getStaffMembersParamsSchema.safeParse(params ?? {});
  if (!parsedParams.success) {
    return { success: false, error: parsedParams.error.issues[0]?.message ?? "Invalid parameters" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    // Get all active staff for this hotel, optionally filtered by department
    let assignmentsQuery = supabase
      .from("staff_assignments")
      .select("user_id, department")
      .eq("hotel_id", ctx.assignment!.hotel_id)
      .eq("is_active", true);

    if (parsedParams.data.department) {
      assignmentsQuery = assignmentsQuery.eq("department", parsedParams.data.department);
    }

    const { data: assignments, error: queryError } = await assignmentsQuery;

    if (queryError) {
      return { success: false, error: "Unable to load staff members." };
    }

    if (!assignments || assignments.length === 0) {
      return { success: true, data: [] };
    }

    const staffIds = assignments.map((a) => a.user_id);

    // Get profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    if (profileError) {
      return { success: false, error: "Unable to load staff profiles." };
    }

    // Get roles
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", staffIds);

    if (roleError) {
      return { success: false, error: "Unable to load staff roles." };
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? "Staff Member"]),
    );
    const roleMap = new Map(
      (roles ?? []).map((r) => [r.user_id, r.role]),
    );

    const result = assignments.map((a) => ({
      id: a.user_id,
      name: profileMap.get(a.user_id) ?? "Staff Member",
      department: a.department,
      role: (roleMap.get(a.user_id) as string) ?? "staff",
    }));

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
