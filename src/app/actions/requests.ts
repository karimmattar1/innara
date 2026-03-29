"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES } from "@/constants/app";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createRequestSchema = z.object({
  category: z.enum(REQUEST_CATEGORIES),
  item: z.string().min(1, "Item is required").max(200).trim(),
  description: z.string().max(1000).trim().default(""),
  roomNumber: z.string().min(1, "Room number is required").max(20).trim(),
  priority: z.enum(REQUEST_PRIORITIES).default("medium"),
  photoUrls: z.array(z.string().url()).max(5).optional(),
});

const requestIdSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
});

export type CreateRequestInput = z.input<typeof createRequestSchema>;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

// ---------------------------------------------------------------------------
// createRequest
// ---------------------------------------------------------------------------

export async function createRequest(
  input: CreateRequestInput,
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate input
  const parsed = createRequestSchema.safeParse(input);
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

    // 3. Get active stay (links user to hotel)
    const { data: stay, error: stayError } = await supabase
      .from("stays")
      .select("id, hotel_id, room_number")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (stayError) {
      return { success: false, error: "Unable to retrieve stay information. Please try again." };
    }

    if (!stay) {
      return { success: false, error: "No active stay found. Please verify your booking." };
    }

    // 4. Insert request
    const { data: created, error: insertError } = await supabase
      .from("requests")
      .insert({
        hotel_id: stay.hotel_id,
        user_id: user.id,
        stay_id: stay.id,
        category: parsed.data.category,
        item: parsed.data.item,
        description: parsed.data.description,
        room_number: parsed.data.roomNumber,
        priority: parsed.data.priority,
        photo_urls: parsed.data.photoUrls ?? [],
        status: "new",
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: "Failed to submit request. Please try again." };
    }

    return { success: true, data: { id: created.id } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getMyRequests
// ---------------------------------------------------------------------------

export async function getMyRequests(): Promise<ActionResult<unknown[]>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Fetch requests for this user
    const { data: requests, error: queryError } = await supabase
      .from("requests")
      .select(
        "id, category, item, description, room_number, priority, status, photo_urls, created_at, updated_at, eta_minutes, assigned_staff_id"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      return { success: false, error: "Unable to retrieve requests. Please try again." };
    }

    return { success: true, data: requests ?? [] };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getRequestById
// ---------------------------------------------------------------------------

export async function getRequestById(requestId: string): Promise<ActionResult<unknown>> {
  // 1. Validate UUID
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

    // 3. Fetch request with related events and messages, filtered by user_id
    const { data: request, error: queryError } = await supabase
      .from("requests")
      .select(
        `
        id, category, item, description, room_number, priority, status,
        photo_urls, created_at, updated_at, eta_minutes, assigned_staff_id,
        request_events (
          id, from_status, to_status, created_at, by_role, by_name, note, visibility
        ),
        messages (
          id, body, from_role, from_name, created_at, is_internal
        )
        `
      )
      .eq("id", parsed.data.requestId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) {
      return { success: false, error: "Unable to retrieve request. Please try again." };
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
// cancelRequest
// ---------------------------------------------------------------------------

export async function cancelRequest(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = requestIdSchema.safeParse({ requestId: id });
  if (!parsed.success) {
    return { success: false, error: "Invalid request ID" };
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

    const { data: existing, error: fetchError } = await supabase
      .from("requests")
      .select("id, status")
      .eq("id", parsed.data.requestId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Request not found." };
    }

    if (existing.status !== "new" && existing.status !== "pending") {
      return {
        success: false,
        error: "Only new or pending requests can be cancelled.",
      };
    }

    const { error: updateError } = await supabase
      .from("requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", parsed.data.requestId)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: "Failed to cancel request. Please try again." };
    }

    return { success: true, data: { id: parsed.data.requestId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// reopenRequest (INN-129)
// ---------------------------------------------------------------------------

export async function reopenRequest(
  requestId: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = requestIdSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: "Invalid request ID" };
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

    const { data: existing, error: fetchError } = await supabase
      .from("requests")
      .select("id, status")
      .eq("id", parsed.data.requestId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: "Request not found." };
    }

    if (existing.status !== "completed") {
      return { success: false, error: "Only completed requests can be reopened." };
    }

    const { error: updateError } = await supabase
      .from("requests")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", parsed.data.requestId)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: "Failed to reopen request. Please try again." };
    }

    // Log the reopen event
    await supabase.from("request_events").insert({
      request_id: parsed.data.requestId,
      from_status: "completed",
      to_status: "pending",
      by_role: "guest",
      by_name: "Guest",
      note: "Guest reopened request",
    });

    return { success: true, data: { id: parsed.data.requestId } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
