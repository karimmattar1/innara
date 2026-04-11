"use server";

import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAdminContext } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GDPRExportData {
  profile: Record<string, unknown> | null;
  requests: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  conversations: Record<string, unknown>[];
  ratings: Record<string, unknown>[];
  stays: Record<string, unknown>[];
  exportedAt: string;
}

// ---------------------------------------------------------------------------
// exportUserData — GDPR Article 20: data portability
// Collects all personal data for a user across all tables
// ---------------------------------------------------------------------------

export async function exportUserData(
  userId: string,
): Promise<ActionResult<GDPRExportData>> {
  try {
    const parsed = z.string().uuid().safeParse(userId);
    if (!parsed.success) {
      return { success: false, error: "Invalid user ID" };
    }

    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();
    const uid = parsed.data;

    // Fetch all user data in parallel
    const [
      profileResult,
      requestsResult,
      ordersResult,
      messagesResult,
      conversationsResult,
      ratingsResult,
      staysResult,
    ] = await Promise.all([
      adminClient.from("profiles").select("*").eq("id", uid).maybeSingle(),
      adminClient
        .from("requests")
        .select("id, hotel_id, category, priority, status, description, created_at, updated_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      adminClient
        .from("orders")
        .select("id, hotel_id, status, total_amount, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      adminClient
        .from("messages")
        .select("id, content, created_at")
        .eq("sender_id", uid)
        .order("created_at", { ascending: false }),
      adminClient
        .from("ai_conversations")
        .select("id, title, status, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      adminClient
        .from("ratings")
        .select("id, rating, comment, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      adminClient
        .from("stays")
        .select("id, hotel_id, room_number, check_in_date, check_out_date, status, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
    ]);

    const data: GDPRExportData = {
      profile: profileResult.data as Record<string, unknown> | null,
      requests: (requestsResult.data ?? []) as Record<string, unknown>[],
      orders: (ordersResult.data ?? []) as Record<string, unknown>[],
      messages: (messagesResult.data ?? []) as Record<string, unknown>[],
      conversations: (conversationsResult.data ?? []) as Record<string, unknown>[],
      ratings: (ratingsResult.data ?? []) as Record<string, unknown>[],
      stays: (staysResult.data ?? []) as Record<string, unknown>[],
      exportedAt: new Date().toISOString(),
    };

    await logAudit(adminClient, {
      hotelId: null,
      actorId: ctx.userId,
      action: "gdpr.data_exported",
      tableName: "profiles",
      recordId: uid,
      newData: {
        tables: ["profiles", "requests", "orders", "messages", "ai_conversations", "ratings", "stays"],
      },
    });

    return { success: true, data };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "exportUserData" } });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// anonymizeUser — GDPR Article 17: right to erasure
// Anonymizes personal data while preserving records for hotel operations
// ---------------------------------------------------------------------------

export async function anonymizeUser(
  userId: string,
): Promise<ActionResult<void>> {
  try {
    const parsed = z.string().uuid().safeParse(userId);
    if (!parsed.success) {
      return { success: false, error: "Invalid user ID" };
    }

    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();
    const uid = parsed.data;

    // Anonymize profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: "Deleted Guest",
        email: null,
        phone: null,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", uid);

    if (profileError) {
      Sentry.captureException(profileError, {
        tags: { action: "anonymizeUser", stage: "profile" },
      });
      return { success: false, error: "Failed to anonymize profile." };
    }

    // Deactivate all staff assignments
    const { error: staffError } = await adminClient
      .from("staff_assignments")
      .update({ is_active: false })
      .eq("user_id", uid);

    if (staffError) {
      Sentry.captureException(staffError, {
        tags: { action: "anonymizeUser", stage: "staff-deactivate" },
      });
      return { success: false, error: "Profile anonymized but failed to deactivate staff assignments. Manual cleanup required." };
    }

    // Anonymize messages content
    const { error: messagesError } = await adminClient
      .from("messages")
      .update({ content: "[deleted]" })
      .eq("sender_id", uid);

    if (messagesError) {
      Sentry.captureException(messagesError, {
        tags: { action: "anonymizeUser", stage: "messages-anonymize" },
      });
      return { success: false, error: "Profile and staff anonymized but failed to redact messages. Manual cleanup required." };
    }

    await logAudit(adminClient, {
      hotelId: null,
      actorId: ctx.userId,
      action: "gdpr.user_anonymized",
      tableName: "profiles",
      recordId: uid,
      newData: { anonymized: true },
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "anonymizeUser" } });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// deactivateHotelCascade — full hotel deactivation with cascade
// Deactivates hotel, all staff, cancels subscription, archives data
// ---------------------------------------------------------------------------

export async function deactivateHotelCascade(
  hotelId: string,
): Promise<ActionResult<{ staffDeactivated: number }>> {
  try {
    const parsed = z.string().uuid().safeParse(hotelId);
    if (!parsed.success) {
      return { success: false, error: "Invalid hotel ID" };
    }

    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();
    const hid = parsed.data;

    // Verify hotel exists
    const { data: hotel, error: hotelFetchError } = await adminClient
      .from("hotels")
      .select("id, name, is_active")
      .eq("id", hid)
      .single();

    if (hotelFetchError || !hotel) {
      return { success: false, error: "Hotel not found." };
    }

    if (!hotel.is_active) {
      return { success: false, error: "Hotel is already inactive." };
    }

    // 1. Deactivate hotel
    const { error: hotelUpdateError } = await adminClient
      .from("hotels")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", hid);

    if (hotelUpdateError) {
      Sentry.captureException(hotelUpdateError, {
        tags: { action: "deactivateHotelCascade", stage: "hotel-update" },
      });
      return { success: false, error: "Failed to deactivate hotel." };
    }

    // 2. Count then deactivate all staff assignments
    const { data: staffRows } = await adminClient
      .from("staff_assignments")
      .select("id")
      .eq("hotel_id", hid)
      .eq("is_active", true);

    const staffCount = staffRows?.length ?? 0;

    const { error: staffUpdateError } = await adminClient
      .from("staff_assignments")
      .update({ is_active: false })
      .eq("hotel_id", hid)
      .eq("is_active", true);

    if (staffUpdateError) {
      Sentry.captureException(staffUpdateError, {
        tags: { action: "deactivateHotelCascade", stage: "staff-deactivate" },
      });
      return { success: false, error: "Hotel deactivated but failed to deactivate staff. Manual cleanup required." };
    }

    // 3. Mark subscription as cancelled
    const { error: subError } = await adminClient
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("hotel_id", hid);

    if (subError) {
      Sentry.captureException(subError, {
        tags: { action: "deactivateHotelCascade", stage: "subscription-cancel" },
      });
      return { success: false, error: "Hotel and staff deactivated but failed to cancel subscription. Manual cleanup required." };
    }

    // 4. Audit log
    await logAudit(adminClient, {
      hotelId: hid,
      actorId: ctx.userId,
      action: "hotel.deactivation_cascade",
      tableName: "hotels",
      recordId: hid,
      oldData: { is_active: true, name: hotel.name },
      newData: {
        is_active: false,
        staffDeactivated: staffCount,
        subscriptionCancelled: true,
      },
    });

    return { success: true, data: { staffDeactivated: staffCount } };
  } catch (err) {
    Sentry.captureException(err, {
      tags: { action: "deactivateHotelCascade" },
    });
    return { success: false, error: "Internal server error." };
  }
}
