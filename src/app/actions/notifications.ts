"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types/domain";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const notificationIdSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID"),
});

const getMyNotificationsSchema = z.object({
  unreadOnly: z.boolean().optional().default(false),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

const createNotificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  hotelId: z.string().uuid("Invalid hotel ID"),
  audience: z.enum(["guest", "staff", "manager"]),
  notificationType: z
    .enum([
      "request_update",
      "new_request",
      "guest_message",
      "staff_message",
      "sla_breach",
      "assignment",
      "other",
    ])
    .default("other"),
  title: z.string().min(1, "Title is required").max(255).trim(),
  body: z.string().min(1, "Body is required").max(1000).trim(),
  linkTo: z.string().max(500).trim().nullable().optional(),
});

export type GetMyNotificationsInput = z.input<typeof getMyNotificationsSchema>;
export type CreateNotificationInput = z.input<typeof createNotificationSchema>;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface NotificationRow {
  id: string;
  hotel_id: string;
  user_id: string;
  audience: "guest" | "staff" | "manager";
  notification_type: NotificationType;
  title: string;
  body: string;
  link_to: string | null;
  read: boolean;
  created_at: string;
}

export interface GetMyNotificationsResult {
  notifications: NotificationRow[];
  total: number;
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// getMyNotifications
// ---------------------------------------------------------------------------

export async function getMyNotifications(
  filters?: GetMyNotificationsInput,
): Promise<ActionResult<GetMyNotificationsResult>> {
  const parsed = getMyNotificationsSchema.safeParse(filters ?? {});
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid filters";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { unreadOnly, page, pageSize } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build list query
    let listQuery = supabase
      .from("notifications")
      .select("id, hotel_id, user_id, audience, notification_type, title, body, link_to, read, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (unreadOnly) {
      listQuery = listQuery.eq("read", false);
    }

    const { data: notifications, error: listError, count } = await listQuery;

    if (listError) {
      return { success: false, error: "Unable to retrieve notifications. Please try again." };
    }

    // Separate count query for unread (always needed regardless of unreadOnly filter)
    const { count: unreadCount, error: unreadError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (unreadError) {
      return { success: false, error: "Unable to retrieve unread count. Please try again." };
    }

    return {
      success: true,
      data: {
        notifications: (notifications ?? []) as NotificationRow[],
        total: count ?? 0,
        unreadCount: unreadCount ?? 0,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

export async function getUnreadCount(): Promise<ActionResult<{ count: number }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { count, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (countError) {
      return { success: false, error: "Unable to retrieve unread count. Please try again." };
    }

    return { success: true, data: { count: count ?? 0 } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// markAsRead
// ---------------------------------------------------------------------------

export async function markAsRead(
  notificationId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = notificationIdSchema.safeParse({ notificationId });
  if (!parsed.success) {
    return { success: false, error: "Invalid notification ID" };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify ownership before updating
    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("id, read")
      .eq("id", parsed.data.notificationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Notification not found." };
    }

    if (existing.read) {
      // Already read — return success without a redundant write
      return { success: true, data: { id: existing.id } };
    }

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", parsed.data.notificationId)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: "Failed to mark notification as read. Please try again." };
    }

    return { success: true, data: { id: parsed.data.notificationId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// markAllAsRead
// ---------------------------------------------------------------------------

export async function markAllAsRead(): Promise<ActionResult<{ updatedCount: number }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Count unread first so we can return how many were updated
    const { count: unreadCount, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (countError) {
      return { success: false, error: "Unable to retrieve notifications. Please try again." };
    }

    if ((unreadCount ?? 0) === 0) {
      return { success: true, data: { updatedCount: 0 } };
    }

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (updateError) {
      return { success: false, error: "Failed to mark notifications as read. Please try again." };
    }

    return { success: true, data: { updatedCount: unreadCount ?? 0 } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// createNotification
// Called server-side by other actions (e.g., request status changes).
// Does NOT require the calling user to be the recipient.
// ---------------------------------------------------------------------------

export async function createNotification(
  input: CreateNotificationInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createNotificationSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // Caller must be authenticated (enforced by INSERT RLS policy)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: created, error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id: parsed.data.userId,
        hotel_id: parsed.data.hotelId,
        audience: parsed.data.audience,
        notification_type: parsed.data.notificationType,
        title: parsed.data.title,
        body: parsed.data.body,
        link_to: parsed.data.linkTo ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: "Failed to create notification. Please try again." };
    }

    return { success: true, data: { id: created.id } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// deleteOldNotifications
// Deletes notifications older than 30 days for the authenticated user.
// Intended for cron usage — when invoked by a cron, authenticate via
// a service role token; otherwise restricts to the calling user's rows.
// ---------------------------------------------------------------------------

export async function deleteOldNotifications(): Promise<ActionResult<{ deletedCount: number }>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    // Count rows to be deleted so the caller can log the result
    const { count: deleteCount, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lt("created_at", cutoff.toISOString());

    if (countError) {
      return { success: false, error: "Unable to count old notifications. Please try again." };
    }

    if ((deleteCount ?? 0) === 0) {
      return { success: true, data: { deletedCount: 0 } };
    }

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .lt("created_at", cutoff.toISOString());

    if (deleteError) {
      return { success: false, error: "Failed to delete old notifications. Please try again." };
    }

    return { success: true, data: { deletedCount: deleteCount ?? 0 } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
