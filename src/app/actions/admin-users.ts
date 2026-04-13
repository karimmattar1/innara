"use server";

import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAdminContext } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(200),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().min(1).max(50).optional().default(20),
});

const userIdSchema = z.string().uuid("Invalid user ID");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string | null;
  hotelId: string | null;
  hotelName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserSearchResult {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// searchUsers — find users by email across all hotels
// ---------------------------------------------------------------------------

export async function searchUsers(
  query: string,
  page?: number,
  pageSize?: number,
): Promise<ActionResult<AdminUserSearchResult>> {
  try {
    const parsed = searchSchema.safeParse({ query, page, pageSize });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();
    const { query: q, page: pg, pageSize: ps } = parsed.data;
    const offset = (pg - 1) * ps;

    // Sanitize ilike wildcards to prevent pattern injection
    const sanitized = q.replace(/[%_\\,().]/g, (ch) => `\\${ch}`);
    const searchPattern = `%${sanitized}%`;

    const { data: profiles, error: profileError, count } = await adminClient
      .from("profiles")
      .select("id, email, full_name, created_at", { count: "exact" })
      .or(`email.ilike.${searchPattern},full_name.ilike.${searchPattern}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + ps - 1);

    if (profileError) {
      Sentry.captureException(profileError, {
        tags: { action: "searchUsers", stage: "profiles-query" },
      });
      return { success: false, error: "Failed to search users." };
    }

    if (!profiles || profiles.length === 0) {
      return {
        success: true,
        data: { users: [], total: 0, page: pg, pageSize: ps },
      };
    }

    const userIds = profiles.map((p) => p.id);

    // Fetch roles and staff assignments in parallel
    const [rolesResult, assignmentsResult] = await Promise.all([
      adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds),
      adminClient
        .from("staff_assignments")
        .select("user_id, hotel_id, is_active, hotels(name)")
        .in("user_id", userIds),
    ]);

    const roleMap = new Map<string, string>();
    for (const r of rolesResult.data ?? []) {
      roleMap.set(r.user_id, r.role);
    }

    const assignmentMap = new Map<
      string,
      { hotelId: string; hotelName: string | null; isActive: boolean }
    >();
    for (const a of assignmentsResult.data ?? []) {
      const hotelData = Array.isArray(a.hotels) ? a.hotels[0] : a.hotels;
      assignmentMap.set(a.user_id, {
        hotelId: a.hotel_id,
        hotelName: hotelData?.name ?? null,
        isActive: a.is_active,
      });
    }

    const users: AdminUser[] = profiles.map((p) => {
      const assignment = assignmentMap.get(p.id);
      return {
        id: p.id,
        email: p.email ?? "",
        fullName: p.full_name,
        role: roleMap.get(p.id) ?? null,
        hotelId: assignment?.hotelId ?? null,
        hotelName: assignment?.hotelName ?? null,
        isActive: assignment?.isActive ?? true,
        createdAt: p.created_at,
      };
    });

    return {
      success: true,
      data: { users, total: count ?? 0, page: pg, pageSize: ps },
    };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "searchUsers" } });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// deactivateUser — disable a user's staff assignment
// ---------------------------------------------------------------------------

export async function deactivateUser(
  userId: string,
): Promise<ActionResult<void>> {
  try {
    const parsed = userIdSchema.safeParse(userId);
    if (!parsed.success) {
      return { success: false, error: "Invalid user ID" };
    }

    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();

    // Get the user's active assignment
    const { data: assignment, error: fetchError } = await adminClient
      .from("staff_assignments")
      .select("id, hotel_id, is_active")
      .eq("user_id", parsed.data)
      .eq("is_active", true)
      .maybeSingle();

    if (fetchError) {
      Sentry.captureException(fetchError, {
        tags: { action: "deactivateUser", stage: "fetch" },
      });
      return { success: false, error: "Failed to load user." };
    }

    if (!assignment) {
      return { success: false, error: "User has no active assignment." };
    }

    const { error: updateError } = await adminClient
      .from("staff_assignments")
      .update({ is_active: false })
      .eq("id", assignment.id);

    if (updateError) {
      Sentry.captureException(updateError, {
        tags: { action: "deactivateUser", stage: "update" },
      });
      return { success: false, error: "Failed to deactivate user." };
    }

    await logAudit(adminClient, {
      hotelId: assignment.hotel_id,
      actorId: ctx.userId,
      action: "user.deactivated",
      tableName: "staff_assignments",
      recordId: assignment.id,
      oldData: { is_active: true, user_id: parsed.data },
      newData: { is_active: false },
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "deactivateUser" } });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// reactivateUser — re-enable a user's staff assignment
// ---------------------------------------------------------------------------

export async function reactivateUser(
  userId: string,
): Promise<ActionResult<void>> {
  try {
    const parsed = userIdSchema.safeParse(userId);
    if (!parsed.success) {
      return { success: false, error: "Invalid user ID" };
    }

    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();

    const { data: assignment, error: fetchError } = await adminClient
      .from("staff_assignments")
      .select("id, hotel_id, is_active")
      .eq("user_id", parsed.data)
      .eq("is_active", false)
      .maybeSingle();

    if (fetchError) {
      Sentry.captureException(fetchError, {
        tags: { action: "reactivateUser", stage: "fetch" },
      });
      return { success: false, error: "Failed to load user." };
    }

    if (!assignment) {
      return { success: false, error: "No inactive assignment found for user." };
    }

    const { error: updateError } = await adminClient
      .from("staff_assignments")
      .update({ is_active: true })
      .eq("id", assignment.id);

    if (updateError) {
      Sentry.captureException(updateError, {
        tags: { action: "reactivateUser", stage: "update" },
      });
      return { success: false, error: "Failed to reactivate user." };
    }

    await logAudit(adminClient, {
      hotelId: assignment.hotel_id,
      actorId: ctx.userId,
      action: "user.reactivated",
      tableName: "staff_assignments",
      recordId: assignment.id,
      oldData: { is_active: false, user_id: parsed.data },
      newData: { is_active: true },
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "reactivateUser" } });
    return { success: false, error: "Internal server error." };
  }
}
