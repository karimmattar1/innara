import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedIntent {
  type: "service_request" | "pending_confirmation" | "faq" | "menu_navigation" | "general_chat";
  confidence: number;
  category?: "housekeeping" | "maintenance" | "room_service" | "concierge" | "valet" | "spa" | "other";
  item?: string;
  quantity?: number;
  timing?: "now" | "30min" | "1hr" | "2hr";
  etaMinutes?: number;
  faqMatch?: { question: string; answer: string };
  navigationTarget?: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  hotelId: string;
  roomNumber?: string;
  guestName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials not configured");

    const { messages, hotelId, roomNumber, guestName } = (await req.json()) as RequestBody;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch FAQs for this hotel
    const { data: faqs } = await supabase
      .from("hotel_faqs")
      .select("question, answer, keywords")
      .eq("hotel_id", hotelId)
      .eq("is_active", true);

    const faqContext = (faqs ?? [])
      .map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`)
      .join("\n\n");

    const systemPrompt = `You are a luxury hotel AI concierge named Innara. Speak warmly and concisely. Today is ${new Date().toDateString()}.

CONTEXT
- Guest: ${guestName ?? "Guest"}
- Room: ${roomNumber ?? "unknown"}

You MUST respond with valid JSON only. No markdown, no explanation outside JSON.

SERVICE CATEGORIES (use these exactly):
- housekeeping: cleaning, towels, linens, toiletries, turn-down service
- maintenance: repairs, AC, plumbing, lights, TV, wifi, safe
  - room_service: food delivery (orders and menu requests)
- concierge: reservations, tickets, tours, transportation
- valet: car parking, car wash
- spa: massage, facial, manicure, pedicure

TIMING KEYWORDS:
- "now", "asap", "immediately", "right away" → "now"
- "30 min", "half hour" → "30min"
- "1 hour", "an hour" → "1hr"
- "2 hours" → "2hr"
- Default to "now" if not specified

HOTEL FAQ:
${faqContext || "No FAQs."}

RESPONSE FORMAT (strict JSON):
{
  "reply": "Your friendly response to the guest",
  "intent": {
    "type": "pending_confirmation" | "service_request" | "faq" | "menu_navigation" | "general_chat",
    "category": "housekeeping" | "maintenance" | "room_service" | "concierge" | "valet" | "spa",
    "item": "Specific item name like 'Room Cleaning' or 'Extra Towels'",
    "timing": "now" | "30min" | "1hr" | "2hr"
  },
  "quickReplies": ["Option 1", "Option 2"]
}

CRITICAL RULES:
1. For ALL service requests (food, cleaning, maintenance, spa, valet), use type="pending_confirmation" to ask for confirmation first
2. For "clean my room" → type="pending_confirmation", category="housekeeping", item="Room Cleaning"
3. For "extra towels" → type="pending_confirmation", category="housekeeping", item="Extra Towels"
4. For food orders (e.g., "Caesar salad") → type="pending_confirmation", category="room_service", item="Caesar Salad"
5. For "menu" or "food menu" → type="menu_navigation", navigationTarget="/guest/room-service"
6. Extract timing from message, default to "now"
7. When type="pending_confirmation", your reply MUST ask for confirmation with ETA. Example: "I can have a Caesar Salad delivered to your room in approximately 25 minutes. Would you like me to place this order?"
8. quickReplies for pending_confirmation should be ["Confirm order", "Cancel"]
9. If user says "yes", "confirm", "place order", "go ahead" after a pending_confirmation, use type="service_request" to finalize
10. If user says "no", "cancel", "never mind", respond politely and set type="general_chat"
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(JSON.stringify({ error: "API key invalid or credits depleted." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      console.error("OpenAI API error:", response.status, txt);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiContent = data?.choices?.[0]?.message?.content ?? "";

    // Try to parse structured JSON, fallback to plain text
    let parsed: { reply?: string; intent?: ParsedIntent; quickReplies?: string[] } = {};
    try {
      // Strip markdown code fences if present
      const cleaned = aiContent.replace(/```json\s?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { reply: aiContent, intent: { type: "general_chat", confidence: 1 } };
    }

    // Fallback detection: if AI didn't classify as service_request but user message contains service keywords
    const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content?.toLowerCase() || "";
    const hasFoodKeywords = /\b(menu|room service|food|breakfast|lunch|dinner|meal|drink|coffee|tea|burger|pizza|salad|sandwich|pasta|steak|soup|dessert)\b/i.test(lastUserMsg);
    const hasFoodItem = /\b(burger|pizza|salad|sandwich|pasta|steak|soup|dessert|coffee|tea|drink|breakfast|lunch|dinner)\b/i.test(lastUserMsg);
    const isMenuRequest = /\bmenu\b/i.test(lastUserMsg) && !hasFoodItem;

    // Check if user is confirming a previous pending request
    const isConfirmation = /\b(yes|yeah|yep|confirm|place.*order|go ahead|please do|sounds good|perfect|ok|okay)\b/i.test(lastUserMsg);
    const isCancellation = /\b(no|nope|cancel|never ?mind|don't|stop|forget it)\b/i.test(lastUserMsg);

    // If this is a confirmation response, convert pending_confirmation to service_request
    if (isConfirmation && parsed.intent?.type === "pending_confirmation") {
      parsed.intent.type = "service_request";
    }
    // If user cancels, just general chat
    if (isCancellation && parsed.intent?.type === "pending_confirmation") {
      parsed.intent = { type: "general_chat", confidence: 1 };
    }

    // If AI routed food to menu navigation, request pending confirmation for direct orders.
    if (parsed.intent?.type === "menu_navigation" && hasFoodKeywords && !isMenuRequest) {
      const item = /caesar.*salad/i.test(lastUserMsg) ? "Caesar Salad"
                 : /salad/i.test(lastUserMsg) ? "Salad"
                 : /pizza/i.test(lastUserMsg) ? "Pizza"
                 : /burger/i.test(lastUserMsg) ? "Burger"
                 : /pasta/i.test(lastUserMsg) ? "Pasta"
                 : /steak/i.test(lastUserMsg) ? "Steak"
                 : /soup/i.test(lastUserMsg) ? "Soup"
                 : /dessert/i.test(lastUserMsg) ? "Dessert"
                 : /coffee|tea|drink/i.test(lastUserMsg) ? "Beverage"
                 : /breakfast/i.test(lastUserMsg) ? "Breakfast"
                 : /lunch/i.test(lastUserMsg) ? "Lunch"
                 : /dinner/i.test(lastUserMsg) ? "Dinner"
                 : "Room Service Order";
      parsed.intent = { type: "pending_confirmation", confidence: 0.85, category: "room_service", item, timing: "now", etaMinutes: 25 };
      parsed.reply = `I can have a ${item} delivered to your room in approximately 25 minutes. Would you like me to place this order?`;
      parsed.quickReplies = ["Confirm order", "Cancel"];
    }

    // Only apply fallback detection if not already a service_request or pending_confirmation
    if (parsed.intent?.type !== "service_request" && parsed.intent?.type !== "pending_confirmation") {
      if (isMenuRequest) {
        parsed.intent = { type: "menu_navigation", confidence: 0.85, navigationTarget: "/guest/room-service" };
      }
      // Room service / food keywords - request confirmation first
      else if (hasFoodKeywords) {
        const item = /caesar.*salad/i.test(lastUserMsg) ? "Caesar Salad"
                   : /salad/i.test(lastUserMsg) ? "Salad"
                   : /pizza/i.test(lastUserMsg) ? "Pizza"
                   : /burger/i.test(lastUserMsg) ? "Burger"
                   : /pasta/i.test(lastUserMsg) ? "Pasta"
                   : /steak/i.test(lastUserMsg) ? "Steak"
                   : /soup/i.test(lastUserMsg) ? "Soup"
                   : /dessert/i.test(lastUserMsg) ? "Dessert"
                   : /coffee|tea|drink/i.test(lastUserMsg) ? "Beverage"
                   : /breakfast/i.test(lastUserMsg) ? "Breakfast"
                   : /lunch/i.test(lastUserMsg) ? "Lunch"
                   : /dinner/i.test(lastUserMsg) ? "Dinner"
                   : "Room Service Order";
        parsed.intent = { type: "pending_confirmation", confidence: 0.8, category: "room_service", item, timing: "now", etaMinutes: 25 };
        parsed.reply = `I can have a ${item} delivered to your room in approximately 25 minutes. Would you like me to place this order?`;
        parsed.quickReplies = ["Confirm order", "Cancel"];
      }
      // Housekeeping keywords - request confirmation first
      else if (/\b(clean|cleaning|towel|linen|toiletries|turn.?down|tidy|housekeep)/i.test(lastUserMsg)) {
        const item = /towel/i.test(lastUserMsg) ? "Extra Towels"
                   : /linen/i.test(lastUserMsg) ? "Fresh Linens"
                   : /toiletries/i.test(lastUserMsg) ? "Toiletries"
                   : /turn.?down/i.test(lastUserMsg) ? "Turn Down Service"
                   : "Room Cleaning";
        parsed.intent = { type: "pending_confirmation", confidence: 0.8, category: "housekeeping", item, timing: "now", etaMinutes: 15 };
        parsed.reply = `I can arrange ${item.toLowerCase()} for your room. A team member will arrive in approximately 15 minutes. Shall I confirm this request?`;
        parsed.quickReplies = ["Confirm", "Cancel"];
      }
      // Maintenance keywords - request confirmation first
      else if (/\b(fix|repair|broken|not working|leak|ac|air.?condition|wifi|tv|light|safe)/i.test(lastUserMsg)) {
        const item = /ac|air.?condition/i.test(lastUserMsg) ? "AC Not Working"
                   : /wifi/i.test(lastUserMsg) ? "WiFi Problems"
                   : /tv/i.test(lastUserMsg) ? "TV Issue"
                   : /light/i.test(lastUserMsg) ? "Light Bulb Replacement"
                   : /leak/i.test(lastUserMsg) ? "Leaky Faucet"
                   : /safe/i.test(lastUserMsg) ? "Safe Not Opening"
                   : "Maintenance Request";
        parsed.intent = { type: "pending_confirmation", confidence: 0.8, category: "maintenance", item, timing: "now", etaMinutes: 20 };
        parsed.reply = `I'll send our maintenance team to look at that right away. They should arrive within 20 minutes. Would you like me to submit this request?`;
        parsed.quickReplies = ["Yes, please", "Cancel"];
      }
      // Spa keywords - request confirmation first
      else if (/\b(massage|spa|facial|manicure|pedicure|aromatherapy)/i.test(lastUserMsg)) {
        const item = /massage/i.test(lastUserMsg) ? "Massage" : "Spa Treatment";
        parsed.intent = { type: "pending_confirmation", confidence: 0.8, category: "spa", item, timing: "now", etaMinutes: 45 };
        parsed.reply = `I can book a ${item.toLowerCase()} for you. Our spa team will contact you shortly to confirm the time. Would you like me to arrange this?`;
        parsed.quickReplies = ["Book it", "Not now"];
      }
      // Valet keywords - request confirmation first
      else if (/\b(car|valet|parking|pick.?up)/i.test(lastUserMsg)) {
        parsed.intent = { type: "pending_confirmation", confidence: 0.8, category: "valet", item: "Car Service", timing: "now", etaMinutes: 10 };
        parsed.reply = `I can have your car brought to the lobby in approximately 10 minutes. Shall I confirm this request?`;
        parsed.quickReplies = ["Yes, bring my car", "Cancel"];
      }
    }

    // Extract timing if present but missing
    if (parsed.intent?.type === "service_request" && !parsed.intent.timing) {
      if (/\b(now|asap|immediate|right away)\b/i.test(lastUserMsg)) {
        parsed.intent.timing = "now";
      } else if (/\b30\s*min/i.test(lastUserMsg)) {
        parsed.intent.timing = "30min";
      } else if (/\b1\s*hour|an hour\b/i.test(lastUserMsg)) {
        parsed.intent.timing = "1hr";
      } else if (/\b2\s*hour/i.test(lastUserMsg)) {
        parsed.intent.timing = "2hr";
      } else {
        parsed.intent.timing = "now";
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("concierge-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
