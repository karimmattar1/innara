"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./requests";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const sendMessageSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message must be 2000 characters or fewer").trim(),
  isInternal: z.boolean().default(false),
});

const requestIdSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
});

const getStaffConversationsSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type SendMessageInput = z.input<typeof sendMessageSchema>;
export type GetStaffConversationsInput = z.input<typeof getStaffConversationsSchema>;

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface MessageWithSender {
  id: string;
  requestId: string | null;
  senderId: string;
  senderType: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  senderName: string | null;
  senderEmail: string | null;
}

export interface StaffConversation {
  requestId: string;
  guestName: string | null;
  roomNumber: string;
  category: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

export async function sendMessage(
  input: SendMessageInput,
): Promise<ActionResult<MessageWithSender>> {
  // 1. Validate input
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Determine sender type — check staff_assignments
    const { data: staffAssignment } = await supabase
      .from("staff_assignments")
      .select("hotel_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const isStaff = staffAssignment !== null;
    const senderType = isStaff ? "staff" : "guest";

    // 4. Internal messages are staff-only
    if (parsed.data.isInternal && !isStaff) {
      return { success: false, error: "Only staff can send internal messages" };
    }

    // 5. Fetch the request to verify access
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("id, hotel_id, user_id")
      .eq("id", parsed.data.requestId)
      .maybeSingle();

    if (requestError || !request) {
      return { success: false, error: "Request not found." };
    }

    // 6. Authorization check
    if (isStaff) {
      // Staff must belong to the same hotel as the request
      if (request.hotel_id !== staffAssignment.hotel_id) {
        return { success: false, error: "Access denied." };
      }
    } else {
      // Guest must own the request
      if (request.user_id !== user.id) {
        return { success: false, error: "Access denied." };
      }
    }

    // 7. Insert message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        request_id: parsed.data.requestId,
        sender_id: user.id,
        sender_type: senderType,
        content: parsed.data.content,
        is_internal: parsed.data.isInternal,
      })
      .select("id, request_id, sender_id, sender_type, content, is_internal, created_at")
      .single();

    if (insertError) {
      return { success: false, error: "Failed to send message. Please try again." };
    }

    // 8. Fetch sender profile for return value
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    return {
      success: true,
      data: {
        id: message.id,
        requestId: message.request_id,
        senderId: message.sender_id,
        senderType: message.sender_type,
        content: message.content,
        isInternal: message.is_internal,
        createdAt: message.created_at,
        senderName: profile?.full_name ?? null,
        senderEmail: profile?.email ?? null,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getRequestMessages
// ---------------------------------------------------------------------------

export async function getRequestMessages(
  requestId: string,
): Promise<ActionResult<MessageWithSender[]>> {
  // 1. Validate input
  const parsed = requestIdSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: "Invalid request ID" };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Determine role
    const { data: staffAssignment } = await supabase
      .from("staff_assignments")
      .select("hotel_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const isStaff = staffAssignment !== null;

    // 4. Fetch the request to verify access
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("id, hotel_id, user_id")
      .eq("id", parsed.data.requestId)
      .maybeSingle();

    if (requestError || !request) {
      return { success: false, error: "Request not found." };
    }

    // 5. Authorization check
    if (isStaff) {
      if (request.hotel_id !== staffAssignment.hotel_id) {
        return { success: false, error: "Access denied." };
      }
    } else {
      if (request.user_id !== user.id) {
        return { success: false, error: "Access denied." };
      }
    }

    // 6. Build message query — guests never see internal messages
    let query = supabase
      .from("messages")
      .select(
        `
        id,
        request_id,
        sender_id,
        sender_type,
        content,
        is_internal,
        created_at,
        profiles!messages_sender_id_fkey (
          full_name,
          email
        )
        `
      )
      .eq("request_id", parsed.data.requestId)
      .order("created_at", { ascending: true });

    if (!isStaff) {
      query = query.eq("is_internal", false);
    }

    const { data: messages, error: queryError } = await query;

    if (queryError) {
      return { success: false, error: "Unable to retrieve messages. Please try again." };
    }

    const result: MessageWithSender[] = (messages ?? []).map((msg) => {
      const profileRaw = msg.profiles as unknown;
      const profile = Array.isArray(profileRaw) ? (profileRaw[0] as { full_name: string | null; email: string | null } | undefined) ?? null : (profileRaw as { full_name: string | null; email: string | null } | null);
      return {
        id: msg.id,
        requestId: msg.request_id,
        senderId: msg.sender_id,
        senderType: msg.sender_type,
        content: msg.content,
        isInternal: msg.is_internal,
        createdAt: msg.created_at,
        senderName: profile?.full_name ?? null,
        senderEmail: profile?.email ?? null,
      };
    });

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getStaffConversations
// ---------------------------------------------------------------------------

export async function getStaffConversations(
  input: GetStaffConversationsInput = {},
): Promise<ActionResult<{ conversations: StaffConversation[]; total: number; page: number; pageSize: number }>> {
  // 1. Validate input
  const parsed = getStaffConversationsSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Verify staff and get hotel_id
    const { data: staffAssignment, error: staffError } = await supabase
      .from("staff_assignments")
      .select("hotel_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (staffError || !staffAssignment) {
      return { success: false, error: "Staff assignment not found." };
    }

    const { page, pageSize } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 4. Get requests for this hotel that have at least one message,
    //    ordered by the most recent message timestamp descending.
    //    We use a subquery via RPC alternative: fetch requests then join messages in one query.
    //    Supabase supports this via select with inner join semantics using !inner.
    const { data: rows, error: queryError, count } = await supabase
      .from("requests")
      .select(
        `
        id,
        room_number,
        category,
        user_id,
        messages!inner (
          id,
          content,
          created_at,
          sender_type
        ),
        profiles!requests_user_id_fkey (
          full_name
        )
        `,
        { count: "exact" }
      )
      .eq("hotel_id", staffAssignment.hotel_id)
      .order("created_at", { referencedTable: "messages", ascending: false })
      .range(from, to);

    if (queryError) {
      return { success: false, error: "Unable to retrieve conversations. Please try again." };
    }

    const conversations: StaffConversation[] = (rows ?? []).map((row) => {
      const msgs = row.messages as Array<{ id: string; content: string; created_at: string; sender_type: string }>;
      const profileRaw = row.profiles as unknown;
      const profile = Array.isArray(profileRaw) ? (profileRaw[0] as { full_name: string | null } | undefined) ?? null : (profileRaw as { full_name: string | null } | null);

      // Latest message is first (ordered desc above)
      const latest = msgs[0];

      return {
        requestId: row.id,
        guestName: profile?.full_name ?? null,
        roomNumber: row.room_number,
        category: row.category,
        lastMessage: latest?.content ?? "",
        lastMessageAt: latest?.created_at ?? "",
        messageCount: msgs.length,
      };
    });

    return {
      success: true,
      data: {
        conversations,
        total: count ?? 0,
        page,
        pageSize,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// markMessagesRead
// ---------------------------------------------------------------------------

export async function markMessagesRead(
  requestId: string,
): Promise<ActionResult<undefined>> {
  // 1. Validate input
  const parsed = requestIdSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: "Invalid request ID" };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Determine role
    const { data: staffAssignment } = await supabase
      .from("staff_assignments")
      .select("hotel_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const isStaff = staffAssignment !== null;

    // 4. Verify access to the request
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("id, hotel_id, user_id")
      .eq("id", parsed.data.requestId)
      .maybeSingle();

    if (requestError || !request) {
      return { success: false, error: "Request not found." };
    }

    if (isStaff) {
      if (request.hotel_id !== staffAssignment.hotel_id) {
        return { success: false, error: "Access denied." };
      }
    } else {
      if (request.user_id !== user.id) {
        return { success: false, error: "Access denied." };
      }
    }

    // Read tracking will be added in Wave 3 with the notification system.
    // Access is verified above so callers can rely on this being a valid request.
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
