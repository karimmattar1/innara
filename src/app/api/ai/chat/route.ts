// ============================================
// AI CONCIERGE CHAT API ROUTE
// POST /api/ai/chat
//
// Streams a response from Claude on behalf of the authenticated guest.
// Persists conversation turns to ai_conversations / ai_messages.
//
// TODO (Wave 3 — INN-xx): Add per-user rate limiting via Upstash to
// prevent cost overruns and abuse. Current endpoint is auth-only.
// ============================================

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/ai/concierge-system-prompt";
import { conciergeTools } from "@/lib/ai/concierge-tools";

// Anthropic client — reads ANTHROPIC_API_KEY from env automatically
const anthropic = new Anthropic();

// ============================================
// INPUT SCHEMA
// ============================================

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

// ============================================
// STAY / HOTEL CONTEXT QUERY
// ============================================

interface StayRow {
  id: string;
  hotel_id: string;
  room_number: string;
  check_in: string;
  check_out: string;
  hotels: {
    name: string;
    amenities: string[] | null;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest): Promise<Response> {
  // ------------------------------------------
  // 1. Authentication
  // ------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // ------------------------------------------
  // 2. Input validation
  // ------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { message: userMessage, conversationId } = parsed.data;

  // ------------------------------------------
  // 3. Get active stay with hotel context
  // ------------------------------------------
  const { data: stay, error: stayError } = await supabase
    .from("stays")
    .select(
      "id, hotel_id, room_number, check_in, check_out, hotels(name, amenities), profiles!inner(full_name)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("check_in", { ascending: false })
    .limit(1)
    .maybeSingle<StayRow>();

  if (stayError) {
    return new Response(
      JSON.stringify({ error: "AI service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!stay) {
    return new Response(
      JSON.stringify({ error: "No active stay found. Please check in before using the concierge." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  // ------------------------------------------
  // 4. Get hotel FAQs
  // ------------------------------------------
  const { data: faqs } = await supabase
    .from("hotel_faqs")
    .select("question, answer")
    .eq("hotel_id", stay.hotel_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  // ------------------------------------------
  // 5. Build system prompt
  // ------------------------------------------
  const systemPrompt = buildSystemPrompt({
    hotelName: stay.hotels?.name ?? "the hotel",
    guestName: stay.profiles?.full_name ?? "Guest",
    roomNumber: stay.room_number,
    checkIn: stay.check_in,
    checkOut: stay.check_out,
    amenities: stay.hotels?.amenities ?? [],
    faqs: faqs ?? [],
  });

  // ------------------------------------------
  // 6. Get or create conversation
  // ------------------------------------------
  let resolvedConversationId: string;

  if (conversationId) {
    // Verify this conversation belongs to the authenticated user
    const { data: existingConversation, error: convError } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (convError || !existingConversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    resolvedConversationId = conversationId;
  } else {
    // Create a new conversation — title derived from first message
    const title = userMessage.slice(0, 60) + (userMessage.length > 60 ? "…" : "");
    const { data: newConversation, error: createError } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        hotel_id: stay.hotel_id,
        title,
      })
      .select("id")
      .single();

    if (createError || !newConversation) {
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    resolvedConversationId = newConversation.id as string;
  }

  // ------------------------------------------
  // 7. Save user message
  // ------------------------------------------
  const { error: userMsgError } = await supabase.from("ai_messages").insert({
    conversation_id: resolvedConversationId,
    role: "user",
    content: userMessage,
  });

  if (userMsgError) {
    return new Response(
      JSON.stringify({ error: "AI service unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // ------------------------------------------
  // 8. Load conversation history (last 20 messages)
  // ------------------------------------------
  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", resolvedConversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const conversationMessages: Anthropic.MessageParam[] = (history ?? []).map(
    (msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content as string,
    }),
  );

  // ------------------------------------------
  // 9. Stream response from Claude
  // ------------------------------------------
  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          system: systemPrompt,
          tools: conciergeTools,
          messages: conversationMessages,
        });

        stream.on("text", (delta: string) => {
          fullResponse += delta;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", text: delta })}\n\n`),
          );
        });

        await stream.finalMessage();

        // ------------------------------------------
        // 10. Save assistant response
        // ------------------------------------------
        if (fullResponse.length > 0) {
          await supabase.from("ai_messages").insert({
            conversation_id: resolvedConversationId,
            role: "assistant",
            content: fullResponse,
          });
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", conversationId: resolvedConversationId })}\n\n`,
          ),
        );
        controller.close();
      } catch (error) {
        // Do not expose raw error details to the client
        const isAnthropicError = error instanceof Anthropic.APIError;
        const clientMessage = isAnthropicError
          ? "AI service temporarily unavailable. Please try again."
          : "An unexpected error occurred. Please try again.";

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: clientMessage })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
