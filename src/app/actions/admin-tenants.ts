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

const hotelIdSchema = z.string().uuid("Invalid hotel ID");

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  location: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  plan: string | null;
  subscriptionStatus: string | null;
  staffCount: number;
}

export interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  location: string;
  type: string;
  isActive: boolean;
  address: string | null;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  staffCount: number;
  activeStaffCount: number;
  recentActivity: Array<{
    id: string;
    action: string;
    tableName: string;
    createdAt: string;
  }>;
}

// ---------------------------------------------------------------------------
// getAdminTenants — list all hotels with subscription + active staff count
// ---------------------------------------------------------------------------

export async function getAdminTenants(): Promise<
  ActionResult<TenantListItem[]>
> {
  try {
    // Auth: user-scoped client — resolveAdminContext verifies super_admin role
    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    const adminClient = createAdminClient();

    // Query 1: all hotels with their subscription row (one-to-one)
    const { data: hotels, error: hotelsError } = await adminClient
      .from("hotels")
      .select(
        "id, name, slug, location, type, is_active, created_at, subscriptions(plan, status)",
      )
      .order("created_at", { ascending: false });

    if (hotelsError) {
      Sentry.captureException(hotelsError, {
        tags: { action: "getAdminTenants", stage: "hotels-query" },
        extra: { actorId: ctx.userId },
      });
      return { success: false, error: "Failed to load tenants." };
    }

    if (!hotels || hotels.length === 0) {
      return { success: true, data: [] };
    }

    // Query 2: active staff counts per hotel
    const hotelIds = hotels.map((h) => h.id);
    const { data: staffRows, error: staffError } = await adminClient
      .from("staff_assignments")
      .select("hotel_id")
      .in("hotel_id", hotelIds)
      .eq("is_active", true);

    if (staffError) {
      Sentry.captureException(staffError, {
        tags: { action: "getAdminTenants", stage: "staff-count-query" },
        extra: { actorId: ctx.userId },
      });
      return { success: false, error: "Failed to load staff counts." };
    }

    // Build count map: hotel_id → active staff count
    const staffCountMap = new Map<string, number>();
    for (const row of staffRows ?? []) {
      const current = staffCountMap.get(row.hotel_id) ?? 0;
      staffCountMap.set(row.hotel_id, current + 1);
    }

    const data: TenantListItem[] = hotels.map((hotel) => {
      // Supabase returns the related row as an object or array depending on the
      // join cardinality. subscriptions is one-to-one (unique hotel_id), so it
      // comes back as a single object or null.
      const sub = Array.isArray(hotel.subscriptions)
        ? (hotel.subscriptions[0] ?? null)
        : hotel.subscriptions;

      return {
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        location: hotel.location,
        type: hotel.type,
        isActive: hotel.is_active,
        createdAt: hotel.created_at,
        plan: sub?.plan ?? null,
        subscriptionStatus: sub?.status ?? null,
        staffCount: staffCountMap.get(hotel.id) ?? 0,
      };
    });

    return { success: true, data };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "getAdminTenants" },
    });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// getAdminTenantDetail — full detail for a single hotel
// ---------------------------------------------------------------------------

export async function getAdminTenantDetail(
  hotelId: string,
): Promise<ActionResult<TenantDetail>> {
  try {
    // Input validation
    const parsed = hotelIdSchema.safeParse(hotelId);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid hotel ID" };
    }

    // Auth
    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    const adminClient = createAdminClient();

    // Hotel + subscription (parallel)
    const [hotelResult, subResult, staffResult, activityResult] =
      await Promise.all([
        adminClient
          .from("hotels")
          .select(
            "id, name, slug, location, type, is_active, address, description, logo_url, created_at, updated_at",
          )
          .eq("id", parsed.data)
          .single(),

        adminClient
          .from("subscriptions")
          .select("plan, status, current_period_end, cancel_at_period_end")
          .eq("hotel_id", parsed.data)
          .maybeSingle(),

        adminClient
          .from("staff_assignments")
          .select("is_active")
          .eq("hotel_id", parsed.data),

        adminClient
          .from("audit_logs")
          .select("id, action, table_name, created_at")
          .eq("hotel_id", parsed.data)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    if (hotelResult.error) {
      if (hotelResult.error.code === "PGRST116") {
        return { success: false, error: "Hotel not found." };
      }
      Sentry.captureException(hotelResult.error, {
        tags: { action: "getAdminTenantDetail", stage: "hotel-query" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return { success: false, error: "Failed to load hotel." };
    }

    if (staffResult.error) {
      Sentry.captureException(staffResult.error, {
        tags: { action: "getAdminTenantDetail", stage: "staff-query" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return { success: false, error: "Failed to load staff data." };
    }

    if (activityResult.error) {
      Sentry.captureException(activityResult.error, {
        tags: { action: "getAdminTenantDetail", stage: "activity-query" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return { success: false, error: "Failed to load recent activity." };
    }

    const hotel = hotelResult.data;
    const sub = subResult.data ?? null;
    const staffRows = staffResult.data ?? [];
    const activityRows = activityResult.data ?? [];

    const staffCount = staffRows.length;
    const activeStaffCount = staffRows.filter((r) => r.is_active).length;

    const data: TenantDetail = {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      location: hotel.location,
      type: hotel.type,
      isActive: hotel.is_active,
      address: hotel.address,
      description: hotel.description,
      logoUrl: hotel.logo_url,
      createdAt: hotel.created_at,
      updatedAt: hotel.updated_at,
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          }
        : null,
      staffCount,
      activeStaffCount,
      recentActivity: activityRows.map((row) => ({
        id: row.id,
        action: row.action,
        tableName: row.table_name,
        createdAt: row.created_at,
      })),
    };

    return { success: true, data };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "getAdminTenantDetail" },
    });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// deactivateHotel — set hotel + all active staff assignments to inactive
// ---------------------------------------------------------------------------

export async function deactivateHotel(
  hotelId: string,
): Promise<ActionResult<void>> {
  try {
    // Input validation
    const parsed = hotelIdSchema.safeParse(hotelId);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid hotel ID" };
    }

    // Auth
    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    const adminClient = createAdminClient();

    // Validate hotel exists and is currently active
    const { data: hotel, error: fetchError } = await adminClient
      .from("hotels")
      .select("id, name, is_active")
      .eq("id", parsed.data)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return { success: false, error: "Hotel not found." };
      }
      Sentry.captureException(fetchError, {
        tags: { action: "deactivateHotel", stage: "fetch" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return { success: false, error: "Failed to load hotel." };
    }

    if (!hotel.is_active) {
      return { success: false, error: "Hotel is already inactive." };
    }

    // Deactivate hotel
    const { error: hotelUpdateError } = await adminClient
      .from("hotels")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parsed.data);

    if (hotelUpdateError) {
      Sentry.captureException(hotelUpdateError, {
        tags: { action: "deactivateHotel", stage: "hotel-update" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return { success: false, error: "Failed to deactivate hotel." };
    }

    // Deactivate all active staff assignments for this hotel
    const { error: staffUpdateError } = await adminClient
      .from("staff_assignments")
      .update({ is_active: false })
      .eq("hotel_id", parsed.data)
      .eq("is_active", true);

    if (staffUpdateError) {
      // The hotel row is already deactivated — log and surface the partial failure
      // rather than silently swallowing it. The admin can retry.
      Sentry.captureException(staffUpdateError, {
        tags: { action: "deactivateHotel", stage: "staff-update" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return {
        success: false,
        error:
          "Hotel deactivated but staff assignments could not be updated. Please retry.",
      };
    }

    // Audit log — fire-and-forget, uses service role client
    await logAudit(adminClient, {
      hotelId: parsed.data,
      actorId: ctx.userId,
      action: "hotel.deactivated",
      tableName: "hotels",
      recordId: parsed.data,
      oldData: { is_active: true, name: hotel.name },
      newData: { is_active: false },
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "deactivateHotel" },
    });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// activateHotel — reactivate a previously deactivated hotel
// (does NOT reactivate individual staff — they were individually deactivated)
// ---------------------------------------------------------------------------

export async function activateHotel(
  hotelId: string,
): Promise<ActionResult<void>> {
  try {
    // Input validation
    const parsed = hotelIdSchema.safeParse(hotelId);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid hotel ID" };
    }

    // Auth
    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) {
      return { success: false, error: ctx.error };
    }

    const adminClient = createAdminClient();

    // Validate hotel exists and is currently inactive
    const { data: hotel, error: fetchError } = await adminClient
      .from("hotels")
      .select("id, name, is_active")
      .eq("id", parsed.data)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return { success: false, error: "Hotel not found." };
      }
      Sentry.captureException(fetchError, {
        tags: { action: "activateHotel", stage: "fetch" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return { success: false, error: "Failed to load hotel." };
    }

    if (hotel.is_active) {
      return { success: false, error: "Hotel is already active." };
    }

    // Activate hotel only — staff must be re-enabled individually
    const { error: hotelUpdateError } = await adminClient
      .from("hotels")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", parsed.data);

    if (hotelUpdateError) {
      Sentry.captureException(hotelUpdateError, {
        tags: { action: "activateHotel", stage: "hotel-update" },
        extra: { actorId: ctx.userId, hotelId: parsed.data },
      });
      return { success: false, error: "Failed to activate hotel." };
    }

    // Audit log — fire-and-forget, uses service role client
    await logAudit(adminClient, {
      hotelId: parsed.data,
      actorId: ctx.userId,
      action: "hotel.activated",
      tableName: "hotels",
      recordId: parsed.data,
      oldData: { is_active: false, name: hotel.name },
      newData: { is_active: true },
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "activateHotel" },
    });
    return { success: false, error: "Internal server error." };
  }
}
