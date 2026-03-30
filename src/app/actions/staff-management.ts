"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveStaffContext, isManagerRole } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";
import { DEPARTMENTS, ROLES } from "@/constants/app";
import { logAudit } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Enums (mirror DB enums exactly)
// ---------------------------------------------------------------------------

const INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
type InvitationStatus = (typeof INVITATION_STATUSES)[number];

// Roles that can be invited (guests cannot be invited to staff roles)
const INVITABLE_ROLES = [
  ROLES.STAFF,
  ROLES.FRONT_DESK,
  ROLES.MANAGER,
] as const;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid("Invalid ID");

const staffListFiltersSchema = z.object({
  department: z.enum(DEPARTMENTS).optional(),
  search: z.string().max(200).optional(),
  includeInactive: z.boolean().optional().default(false),
});

const inviteStaffSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  role: z.enum(INVITABLE_ROLES),
  department: z.enum(DEPARTMENTS),
});

const updateDepartmentSchema = z.object({
  department: z.enum(DEPARTMENTS),
});

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  department: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  role: string;
  department: string | null;
  status: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationRecord {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Helper: generate a secure invitation token
// ---------------------------------------------------------------------------

function generateInvitationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Helper: derive expiry timestamp 7 days from now
// ---------------------------------------------------------------------------

function sevenDaysFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// getStaffList
// ---------------------------------------------------------------------------

export async function getStaffList(
  filters?: { department?: string; search?: string; includeInactive?: boolean },
): Promise<ActionResult<StaffMember[]>> {
  const parsed = staffListFiltersSchema.safeParse(filters ?? {});
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid filters" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;
    const { department, search, includeInactive } = parsed.data;

    // Fetch all assignments for this hotel, join to profiles and roles
    let assignmentsQuery = supabase
      .from("staff_assignments")
      .select("id, user_id, department, is_active, created_at")
      .eq("hotel_id", hotelId);

    if (!includeInactive) {
      assignmentsQuery = assignmentsQuery.eq("is_active", true);
    }

    if (department) {
      assignmentsQuery = assignmentsQuery.eq("department", department);
    }

    const { data: assignments, error: assignError } = await assignmentsQuery;

    if (assignError) {
      return { success: false, error: "Unable to load staff list." };
    }

    if (!assignments || assignments.length === 0) {
      return { success: true, data: [] };
    }

    const userIds = assignments.map((a) => a.user_id);

    // Fetch profiles
    let profilesQuery = supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .in("id", userIds);

    if (search) {
      const sanitized = search.replace(/[%_\\,().]/g, "\\$&");
      profilesQuery = profilesQuery.or(
        `full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`,
      );
    }

    const { data: profiles, error: profileError } = await profilesQuery;

    if (profileError) {
      return { success: false, error: "Unable to load staff profiles." };
    }

    // When search is applied, restrict to the matching user IDs
    const matchingUserIds = new Set((profiles ?? []).map((p) => p.id));
    const filteredAssignments = search
      ? assignments.filter((a) => matchingUserIds.has(a.user_id))
      : assignments;

    if (filteredAssignments.length === 0) {
      return { success: true, data: [] };
    }

    const filteredUserIds = filteredAssignments.map((a) => a.user_id);

    // Fetch roles for filtered users only
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", filteredUserIds);

    if (rolesError) {
      return { success: false, error: "Unable to load staff roles." };
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p]),
    );
    const roleMap = new Map(
      (roles ?? []).map((r) => [r.user_id, r.role as string]),
    );

    const result: StaffMember[] = filteredAssignments.map((a) => {
      const profile = profileMap.get(a.user_id);
      return {
        id: a.id as string,
        userId: a.user_id as string,
        name: (profile?.full_name as string | null) ?? "Staff Member",
        email: (profile?.email as string | null) ?? "",
        phone: (profile?.phone as string | null) ?? null,
        avatarUrl: (profile?.avatar_url as string | null) ?? null,
        department: a.department as string,
        role: roleMap.get(a.user_id) ?? "staff",
        isActive: a.is_active as boolean,
        joinedAt: a.created_at as string,
      };
    });

    // Sort by name ascending
    result.sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// inviteStaff
// ---------------------------------------------------------------------------

export async function inviteStaff(
  input: { email: string; role: string; department: string },
): Promise<ActionResult<InvitationRecord>> {
  const parsed = inviteStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, role, department } = parsed.data;

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    // Check for an existing PENDING invitation for this email + hotel
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from("staff_invitations")
      .select("id, status, expires_at")
      .eq("hotel_id", hotelId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (inviteCheckError) {
      return { success: false, error: "Unable to check existing invitations." };
    }

    if (existingInvite) {
      const isExpired = new Date(existingInvite.expires_at as string) < new Date();

      if (!isExpired) {
        return {
          success: false,
          error: "An invitation is already pending for this email.",
        };
      }

      // Expired pending invitation — delete it so we can create a fresh one
      const { error: deleteError } = await supabase
        .from("staff_invitations")
        .delete()
        .eq("id", existingInvite.id);

      if (deleteError) {
        return { success: false, error: "Unable to replace expired invitation." };
      }
    }

    // Check if the email already belongs to an active staff member at this hotel
    const { data: profileRow, error: profileLookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileLookupError) {
      return { success: false, error: "Unable to check existing staff." };
    }

    if (profileRow) {
      const { data: activeAssignment, error: assignmentCheckError } = await supabase
        .from("staff_assignments")
        .select("id")
        .eq("user_id", profileRow.id)
        .eq("hotel_id", hotelId)
        .eq("is_active", true)
        .maybeSingle();

      if (assignmentCheckError) {
        return { success: false, error: "Unable to check existing staff assignments." };
      }

      if (activeAssignment) {
        return {
          success: false,
          error: "This person is already an active staff member at this hotel.",
        };
      }
    }

    const token = generateInvitationToken();
    const expiresAt = sevenDaysFromNow();

    const { data: invitation, error: insertError } = await supabase
      .from("staff_invitations")
      .insert({
        hotel_id: hotelId,
        email,
        role,
        department,
        invited_by: ctx.user!.id,
        token,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, email, token, expires_at, updated_at")
      .single();

    if (insertError) {
      return { success: false, error: "Failed to create invitation." };
    }

    void logAudit(supabase, {
      hotelId: hotelId,
      actorId: ctx.user!.id,
      action: "staff.invite",
      tableName: "staff_invitations",
      recordId: invitation.id as string,
      newData: { email, role, department },
    });

    return {
      success: true,
      data: {
        id: invitation.id as string,
        email: invitation.email as string,
        token: invitation.token as string,
        expiresAt: invitation.expires_at as string,
        updatedAt: invitation.updated_at as string,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// revokeInvitation
// ---------------------------------------------------------------------------

export async function revokeInvitation(
  invitationId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(invitationId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid invitation ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    const { data: updated, error: updateError } = await supabase
      .from("staff_invitations")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      return { success: false, error: "Failed to revoke invitation." };
    }

    if (!updated) {
      return {
        success: false,
        error: "Invitation not found or is no longer pending.",
      };
    }

    void logAudit(supabase, {
      hotelId: hotelId,
      actorId: ctx.user!.id,
      action: "staff.revoke_invitation",
      tableName: "staff_invitations",
      recordId: updated.id as string,
      oldData: { status: "pending" },
      newData: { status: "revoked" },
    });

    return { success: true, data: { id: updated.id as string } };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// expireInvitation
// ---------------------------------------------------------------------------

export async function expireInvitation(
  invitationId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(invitationId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid invitation ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    const { data: updated, error: updateError } = await supabase
      .from("staff_invitations")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      return { success: false, error: "Failed to expire invitation." };
    }

    if (!updated) {
      return {
        success: false,
        error: "Invitation not found or is no longer pending.",
      };
    }

    void logAudit(supabase, {
      hotelId: hotelId,
      actorId: ctx.user!.id,
      action: "staff.expire_invitation",
      tableName: "staff_invitations",
      recordId: updated.id as string,
      oldData: { status: "pending" },
      newData: { status: "expired" },
    });

    return { success: true, data: { id: updated.id as string } };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// resendInvitation
// ---------------------------------------------------------------------------

export async function resendInvitation(
  invitationId: string,
): Promise<ActionResult<InvitationRecord>> {
  const parsedId = uuidSchema.safeParse(invitationId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid invitation ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    // Fetch the invitation to check cooldown before updating
    const { data: invitation, error: fetchError } = await supabase
      .from("staff_invitations")
      .select("id, updated_at")
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId)
      .eq("status", "pending")
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: "Failed to refresh invitation." };
    }

    if (!invitation) {
      return {
        success: false,
        error: "Invitation not found or is no longer pending.",
      };
    }

    // Enforce 5-minute resend cooldown based on last updated_at
    const lastSent = new Date(invitation.updated_at as string);
    const cooldownMs = 5 * 60 * 1000;
    const elapsed = Date.now() - lastSent.getTime();
    if (elapsed < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return { success: false, error: `Please wait ${remainingSeconds}s before resending.` };
    }

    const newToken = generateInvitationToken();
    const newExpiresAt = sevenDaysFromNow();
    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("staff_invitations")
      .update({
        token: newToken,
        expires_at: newExpiresAt,
        updated_at: now,
      })
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId)
      .eq("status", "pending")
      .select("id, email, token, expires_at, updated_at")
      .maybeSingle();

    if (updateError) {
      return { success: false, error: "Failed to refresh invitation." };
    }

    if (!updated) {
      return {
        success: false,
        error: "Invitation not found or is no longer pending.",
      };
    }

    return {
      success: true,
      data: {
        id: updated.id as string,
        email: updated.email as string,
        token: updated.token as string,
        expiresAt: updated.expires_at as string,
        updatedAt: updated.updated_at as string,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getInvitations
// ---------------------------------------------------------------------------

export async function getInvitations(
  status?: InvitationStatus,
): Promise<ActionResult<StaffInvitation[]>> {
  if (status !== undefined) {
    const parsedStatus = z.enum(INVITATION_STATUSES).safeParse(status);
    if (!parsedStatus.success) {
      return { success: false, error: "Invalid invitation status" };
    }
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    let query = supabase
      .from("staff_invitations")
      .select("id, email, role, department, status, invited_by, expires_at, created_at, updated_at")
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: invitations, error: queryError } = await query;

    if (queryError) {
      return { success: false, error: "Unable to load invitations." };
    }

    if (!invitations || invitations.length === 0) {
      return { success: true, data: [] };
    }

    // Auto-expire any pending invitations whose expires_at has passed
    const now = new Date();
    const expiredIds: string[] = [];
    for (const inv of invitations) {
      if (inv.status === "pending" && new Date(inv.expires_at as string) < now) {
        expiredIds.push(inv.id as string);
      }
    }

    if (expiredIds.length > 0) {
      await supabase
        .from("staff_invitations")
        .update({ status: "expired", updated_at: now.toISOString() })
        .in("id", expiredIds);

      // Update the in-memory data so the returned list reflects the new status
      for (const inv of invitations) {
        if (expiredIds.includes(inv.id as string)) {
          inv.status = "expired";
        }
      }
    }

    // Resolve invited_by names from profiles
    const inviterIds = [
      ...new Set(
        invitations
          .map((inv) => inv.invited_by as string | null)
          .filter((id): id is string => id !== null),
      ),
    ];

    const { data: inviterProfiles, error: inviterError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", inviterIds);

    if (inviterError) {
      return { success: false, error: "Unable to load inviter information." };
    }

    const inviterMap = new Map(
      (inviterProfiles ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "Unknown"]),
    );

    const result: StaffInvitation[] = invitations.map((inv) => ({
      id: inv.id as string,
      email: inv.email as string,
      role: inv.role as string,
      department: (inv.department as string | null) ?? null,
      status: inv.status as string,
      invitedBy: inviterMap.get(inv.invited_by as string) ?? "Unknown",
      expiresAt: inv.expires_at as string,
      createdAt: inv.created_at as string,
    }));

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// deactivateStaff
// ---------------------------------------------------------------------------

export async function deactivateStaff(
  staffAssignmentId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(staffAssignmentId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid staff assignment ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    // Resolve the target assignment's user_id to prevent self-deactivation
    const { data: target, error: fetchError } = await supabase
      .from("staff_assignments")
      .select("id, user_id")
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (fetchError || !target) {
      return { success: false, error: "Staff member not found." };
    }

    if ((target.user_id as string) === ctx.user!.id) {
      return { success: false, error: "You cannot deactivate your own account." };
    }

    const { error: updateError } = await supabase
      .from("staff_assignments")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId);

    if (updateError) {
      return { success: false, error: "Failed to deactivate staff member." };
    }

    void logAudit(supabase, {
      hotelId: hotelId,
      actorId: ctx.user!.id,
      action: "staff.deactivate",
      tableName: "staff_assignments",
      recordId: parsedId.data,
      newData: { is_active: false },
    });

    return { success: true, data: { id: parsedId.data } };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// reactivateStaff
// ---------------------------------------------------------------------------

export async function reactivateStaff(
  staffAssignmentId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(staffAssignmentId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid staff assignment ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    const { error: updateError } = await supabase
      .from("staff_assignments")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId);

    if (updateError) {
      return { success: false, error: "Failed to reactivate staff member." };
    }

    void logAudit(supabase, {
      hotelId: hotelId,
      actorId: ctx.user!.id,
      action: "staff.reactivate",
      tableName: "staff_assignments",
      recordId: parsedId.data,
      newData: { is_active: true },
    });

    return { success: true, data: { id: parsedId.data } };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// changeStaffRole
// ---------------------------------------------------------------------------

const CHANGEABLE_ROLES = [
  ROLES.STAFF,
  ROLES.FRONT_DESK,
  ROLES.MANAGER,
] as const;

type ChangeableRole = (typeof CHANGEABLE_ROLES)[number];

const changeRoleSchema = z.object({
  staffId: uuidSchema,
  newRole: z.enum(CHANGEABLE_ROLES),
});

export async function changeStaffRole(
  staffId: string,
  newRole: ChangeableRole,
): Promise<ActionResult> {
  const parsed = changeRoleSchema.safeParse({ staffId, newRole });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const userId = ctx.user!.id;
    const hotelId = ctx.assignment!.hotel_id;

    // Prevent manager from changing their own role
    if (parsed.data.staffId === userId) {
      return { success: false, error: "Cannot change your own role" };
    }

    // Fetch current role for this staff member at this hotel
    const { data: currentRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", parsed.data.staffId)
      .eq("hotel_id", hotelId)
      .single();

    if (roleError || !currentRole) {
      return { success: false, error: "Staff member not found at this hotel." };
    }

    if (parsed.data.newRole === currentRole.role) {
      return { success: false, error: "Staff member already has this role" };
    }

    // Update the role in user_roles
    const { error: updateError } = await supabase
      .from("user_roles")
      .update({ role: parsed.data.newRole })
      .eq("user_id", parsed.data.staffId)
      .eq("hotel_id", hotelId);

    if (updateError) {
      return { success: false, error: "Failed to update staff role." };
    }

    // Note: The user's JWT claims (app_role) will update on next token refresh.
    // The custom_access_token_hook reads from user_roles at token generation time.
    // For immediate effect, the user should sign out and back in.

    void logAudit(supabase, {
      hotelId,
      actorId: userId,
      action: "staff.role_change",
      tableName: "user_roles",
      recordId: parsed.data.staffId,
      oldData: { role: currentRole.role },
      newData: { role: parsed.data.newRole },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getStaffRole
// ---------------------------------------------------------------------------

export async function getStaffRole(
  staffId: string,
): Promise<ActionResult<{ role: string; department: string | null }>> {
  const parsedId = uuidSchema.safeParse(staffId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid staff ID" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    // Fetch role from user_roles for this staff member at this hotel
    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", parsedId.data)
      .eq("hotel_id", hotelId)
      .single();

    if (roleError || !roleRow) {
      return { success: false, error: "Staff member not found at this hotel." };
    }

    // Fetch department from staff_assignments
    const { data: assignment, error: assignError } = await supabase
      .from("staff_assignments")
      .select("department")
      .eq("user_id", parsedId.data)
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .maybeSingle();

    if (assignError) {
      return { success: false, error: "Unable to load staff assignment." };
    }

    return {
      success: true,
      data: {
        role: roleRow.role as string,
        department: (assignment?.department as string | null) ?? null,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// updateStaffDepartment
// ---------------------------------------------------------------------------

export async function updateStaffDepartment(
  staffAssignmentId: string,
  department: string,
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(staffAssignmentId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid staff assignment ID" };
  }

  const parsedDept = updateDepartmentSchema.safeParse({ department });
  if (!parsedDept.success) {
    return { success: false, error: parsedDept.error.issues[0]?.message ?? "Invalid department" };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const isManager = await isManagerRole(supabase, ctx.user!.id);
    if (!isManager) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;

    // Fetch current department for audit old_data
    const { data: currentAssignment } = await supabase
      .from("staff_assignments")
      .select("department")
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId)
      .maybeSingle();

    const previousDept = (currentAssignment?.department as string | null) ?? null;

    const { error: updateError } = await supabase
      .from("staff_assignments")
      .update({
        department: parsedDept.data.department,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsedId.data)
      .eq("hotel_id", hotelId);

    if (updateError) {
      return { success: false, error: "Failed to update department." };
    }

    void logAudit(supabase, {
      hotelId: hotelId,
      actorId: ctx.user!.id,
      action: "staff.change_department",
      tableName: "staff_assignments",
      recordId: parsedId.data,
      oldData: { department: previousDept },
      newData: { department: parsedDept.data.department },
    });

    return { success: true, data: { id: parsedId.data } };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
