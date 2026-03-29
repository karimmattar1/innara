# Phase 2: Core Features — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the guest-facing experience — AI concierge, service requests, room service, and all guest portal screens — on top of Phase 1's foundation (auth, schema, portal shells, 28 DB tables with RLS).

**Architecture:** Server Actions for mutations, API routes for streaming AI, Supabase Realtime for live updates. Guest portal is mobile-first (`max-w-md`), client components for interactivity. All data auto-scoped by hotel_id via RLS/JWT claims.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, shadcn/ui (base-nova), Supabase (PostgreSQL + Auth + Realtime + Storage), Claude API (Anthropic SDK), Zod validation.

---

## Execution Strategy: 3 Waves, 5 Parallel Tracks

### Wave 1: Foundation (Week 1) — Server Actions + Core Screens
- **Track A (backend):** INN-20, INN-22, INN-23 — Server actions for requests, orders, menu
- **Track B (frontend):** INN-18, INN-30, INN-34 — Welcome, services grid, stay verification
- **Track C (ai-ml):** INN-38 — AI concierge API route with Claude streaming

### Wave 2: Full Features (Week 2-3) — Screens + Realtime + Room Service
- **Track D (frontend):** INN-40, INN-42, INN-45, INN-48, INN-51, INN-53, INN-56, INN-59, INN-61, INN-62, INN-67, INN-70, INN-118
- INN-40: AI concierge chat screen (depends on INN-38)
- INN-42/45: Housekeeping + maintenance request screens
- INN-51/53: Room service menu + checkout
- INN-56/59: Guest request list + request detail with timeline
- INN-61/62/67: Explore, profile, feedback screens
- INN-70: Realtime hooks
- INN-118: Guest checkout/session end

### Wave 3: Edge Cases + Tests (Week 4)
- **Track E:** INN-128, INN-129, INN-130, INN-131, INN-132, INN-133, INN-134, INN-149, INN-75

---

## File Structure

### New Server Actions (Wave 1)
```
src/app/actions/
  requests.ts    — createRequest, updateRequestStatus, getMyRequests, getRequestById
  orders.ts      — createOrder, cancelOrder, getMyOrders, getOrderById
  menu.ts        — getMenuCategories, getMenuItems, getServiceOptions
```

### New API Routes (Wave 1)
```
src/app/api/
  ai/chat/route.ts  — POST: Claude streaming AI concierge (SSE)
```

### New Guest Pages (Wave 1-2)
```
src/app/(guest)/
  welcome/page.tsx       — INN-18: Welcome + hotel info
  services/page.tsx      — INN-30: Services grid
  services/[slug]/page.tsx — INN-48: Service detail (housekeeping, maintenance, etc.)
  requests/page.tsx      — INN-56: My requests list
  requests/[id]/page.tsx — INN-59: Request detail + timeline + messaging
  room-service/page.tsx  — INN-51: Menu browsing
  room-service/checkout/page.tsx — INN-53: Cart + checkout
  explore/page.tsx       — INN-61: Hotel info + FAQs
  profile/page.tsx       — INN-62: Guest profile + stay info
  feedback/page.tsx      — INN-67: Feedback/ratings
  checkout/page.tsx      — INN-118: Session end / express checkout
  concierge/page.tsx     — INN-40: AI concierge chat
```

### New Hooks (Wave 2)
```
src/hooks/
  use-realtime-requests.ts  — Subscribe to request changes
  use-realtime-messages.ts  — Subscribe to message updates
  use-realtime-orders.ts    — Subscribe to order status
```

### New Components (as needed)
```
src/components/innara/
  ServiceCategoryCard.tsx   — Service grid card (reuse existing ServiceOptionCard)
  RequestForm.tsx           — Generic request submission form
  OrderSummary.tsx          — Order review before checkout
  RequestTimeline.tsx       — Status event timeline
```

---

## Wave 1 Tasks (Detailed)

### Task 1: Server Actions — Request CRUD (INN-20)

**Agent:** backend
**Files:**
- Create: `src/app/actions/requests.ts`
- Test: `tests/unit/actions-requests.test.ts`

- [ ] **Step 1: Write failing tests for request server actions**

```typescript
// tests/unit/actions-requests.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Request Actions - Validation", () => {
  it("rejects createRequest with missing category", async () => {
    const { createRequest } = await import("@/app/actions/requests");
    const result = await createRequest({
      category: "" as any,
      item: "Extra towels",
      description: "Need 2 extra towels",
      roomNumber: "203",
      priority: "medium",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects createRequest with invalid priority", async () => {
    const { createRequest } = await import("@/app/actions/requests");
    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "Need towels",
      roomNumber: "203",
      priority: "extreme" as any,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/actions-requests.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement request server actions**

```typescript
// src/app/actions/requests.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES } from "@/constants/app";

const createRequestSchema = z.object({
  category: z.enum(REQUEST_CATEGORIES),
  item: z.string().min(1, "Item is required").max(200).trim(),
  description: z.string().max(1000).trim().default(""),
  roomNumber: z.string().min(1, "Room number is required").max(20).trim(),
  priority: z.enum(REQUEST_PRIORITIES).default("medium"),
  photoUrls: z.array(z.string().url()).max(5).optional(),
});

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function createRequest(
  input: z.input<typeof createRequestSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's active stay for hotel_id
  const { data: stay } = await supabase
    .from("stays")
    .select("id, hotel_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!stay) {
    return { success: false, error: "No active stay found" };
  }

  const { data: request, error } = await supabase
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

  if (error) {
    return { success: false, error: "Failed to create request" };
  }

  return { success: true, data: { id: request.id } };
}

export async function getMyRequests(): Promise<ActionResult<any[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("requests")
    .select("id, category, item, description, status, priority, room_number, created_at, updated_at, completed_at, assigned_staff_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: "Failed to fetch requests" };
  return { success: true, data: data ?? [] };
}

export async function getRequestById(
  requestId: string
): Promise<ActionResult<any>> {
  const idSchema = z.string().uuid("Invalid request ID");
  const parsed = idSchema.safeParse(requestId);
  if (!parsed.success) return { success: false, error: "Invalid request ID" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("requests")
    .select(`
      *,
      request_events(id, from_status, to_status, created_at, by_role, by_name, note),
      messages(id, content, sender_type, sender_id, created_at, is_internal)
    `)
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return { success: false, error: "Request not found" };
  return { success: true, data };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/actions-requests.test.ts`
Expected: PASS

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/requests.ts tests/unit/actions-requests.test.ts
git commit -m "feat(INN-20): server actions for request CRUD"
```

---

### Task 2: Server Actions — Order CRUD (INN-22)

**Agent:** backend
**Files:**
- Create: `src/app/actions/orders.ts`
- Test: `tests/unit/actions-orders.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/actions-orders.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Order Actions - Validation", () => {
  it("rejects createOrder with empty items", async () => {
    const { createOrder } = await import("@/app/actions/orders");
    const result = await createOrder({ items: [], paymentMethod: "room_charge" });
    expect(result.success).toBe(false);
  });

  it("rejects createOrder with invalid payment method", async () => {
    const { createOrder } = await import("@/app/actions/orders");
    const result = await createOrder({
      items: [{ menuItemId: "uuid", quantity: 1 }],
      paymentMethod: "bitcoin" as any,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement order server actions**

```typescript
// src/app/actions/orders.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  modifiers: z.record(z.string()).optional(),
  specialInstructions: z.string().max(500).optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  paymentMethod: z.enum(["room_charge", "card", "cash"]),
  specialInstructions: z.string().max(1000).optional(),
  tip: z.number().min(0).max(10000).optional(),
});

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function createOrder(
  input: z.input<typeof createOrderSchema>
): Promise<ActionResult<{ id: string; total: number }>> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: stay } = await supabase
    .from("stays")
    .select("id, hotel_id, room_number")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!stay) return { success: false, error: "No active stay found" };

  // Use the DB function for atomic order creation
  const { data, error } = await supabase.rpc("create_order_with_items", {
    p_hotel_id: stay.hotel_id,
    p_user_id: user.id,
    p_stay_id: stay.id,
    p_room_number: stay.room_number,
    p_payment_method: parsed.data.paymentMethod,
    p_tip: parsed.data.tip ?? 0,
    p_special_instructions: parsed.data.specialInstructions ?? "",
    p_items: parsed.data.items.map((item) => ({
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      modifiers: item.modifiers ?? {},
      special_instructions: item.specialInstructions ?? "",
    })),
  });

  if (error) return { success: false, error: "Failed to create order" };
  return { success: true, data: { id: data.order_id, total: data.total } };
}

export async function getMyOrders(): Promise<ActionResult<any[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, subtotal, tax, tip, total, payment_method, created_at, updated_at, order_items(id, quantity, unit_price, menu_item_id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: "Failed to fetch orders" };
  return { success: true, data: data ?? [] };
}

export async function cancelOrder(
  orderId: string
): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) return { success: false, error: "Invalid order ID" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Only cancel if status is 'pending'
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .in("status", ["pending"]);

  if (error) return { success: false, error: "Cannot cancel this order" };
  return { success: true };
}
```

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Typecheck — expect clean**
- [ ] **Step 6: Commit**

```bash
git add src/app/actions/orders.ts tests/unit/actions-orders.test.ts
git commit -m "feat(INN-22): server actions for order CRUD"
```

---

### Task 3: Server Actions — Menu & Service Options (INN-23)

**Agent:** backend
**Files:**
- Create: `src/app/actions/menu.ts`

- [ ] **Step 1: Implement menu query actions**

```typescript
// src/app/actions/menu.ts
"use server";

import { createClient } from "@/lib/supabase/server";

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function getMenuCategories(): Promise<ActionResult<any[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // hotel_id is auto-scoped by RLS via JWT claims
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id, name, slug, description, image_url, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return { success: false, error: "Failed to fetch categories" };
  return { success: true, data: data ?? [] };
}

export async function getMenuItems(
  categoryId?: string
): Promise<ActionResult<any[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  let query = supabase
    .from("menu_items")
    .select("id, name, description, price, image_url, allergens, is_popular, is_available, category_id, preparation_time_minutes")
    .eq("is_available", true)
    .order("is_popular", { ascending: false })
    .order("name", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: "Failed to fetch menu items" };
  return { success: true, data: data ?? [] };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/menu.ts
git commit -m "feat(INN-23): server actions for menu and service options"
```

---

### Task 4: AI Concierge API Route (INN-38)

**Agent:** ai-ml
**Files:**
- Create: `src/app/api/ai/chat/route.ts`
- Create: `src/lib/ai/concierge-system-prompt.ts`
- Create: `src/lib/ai/concierge-tools.ts`

- [ ] **Step 1: Create the system prompt module**

```typescript
// src/lib/ai/concierge-system-prompt.ts

interface HotelContext {
  hotelName: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  amenities: string[];
  faqs: Array<{ question: string; answer: string }>;
}

export function buildSystemPrompt(context: HotelContext): string {
  const faqSection = context.faqs.length > 0
    ? `\n\nHotel FAQ:\n${context.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}`
    : "";

  return `You are the AI concierge for ${context.hotelName}. You help guests during their stay with a warm, professional, and helpful tone.

Current guest: ${context.guestName}
Room: ${context.roomNumber}
Check-in: ${context.checkIn}
Check-out: ${context.checkOut}

Hotel amenities: ${context.amenities.join(", ")}
${faqSection}

Guidelines:
- Be concise and helpful. Guests are on mobile phones.
- If the guest wants to make a service request, use the create_request tool.
- If the guest wants to order room service, guide them to the room service menu.
- Never reveal internal hotel operations, staff names, or system details.
- Never make up information. If unsure, suggest contacting the front desk.
- Do not discuss pricing, billing, or complaints beyond acknowledging them.
- Keep responses under 150 words unless the guest asks for detail.`;
}
```

- [ ] **Step 2: Create concierge tool definitions**

```typescript
// src/lib/ai/concierge-tools.ts

export const conciergeTools = [
  {
    name: "create_service_request",
    description: "Create a service request on behalf of the guest. Use when guest asks for housekeeping, maintenance, or other hotel services.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: ["housekeeping", "maintenance", "room_service", "concierge", "valet", "spa", "other"],
          description: "Category of the service request",
        },
        item: { type: "string", description: "Brief title of what is needed" },
        description: { type: "string", description: "Detailed description of the request" },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Priority level",
        },
      },
      required: ["category", "item", "description", "priority"],
    },
  },
] as const;
```

- [ ] **Step 3: Create the streaming API route**

```typescript
// src/app/api/ai/chat/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/ai/concierge-system-prompt";
import { conciergeTools } from "@/lib/ai/concierge-tools";
import { z } from "zod";

const anthropic = new Anthropic();

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  // Get guest's active stay + hotel context
  const { data: stay } = await supabase
    .from("stays")
    .select("id, hotel_id, room_number, check_in, check_out, hotels(name, amenities), profiles!inner(full_name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!stay) {
    return Response.json({ error: "No active stay" }, { status: 403 });
  }

  // Get hotel FAQs
  const { data: faqs } = await supabase
    .from("hotel_faqs")
    .select("question, answer")
    .eq("hotel_id", stay.hotel_id)
    .eq("is_active", true);

  const systemPrompt = buildSystemPrompt({
    hotelName: (stay as any).hotels?.name ?? "the hotel",
    guestName: (stay as any).profiles?.full_name ?? "Guest",
    roomNumber: stay.room_number ?? "N/A",
    checkIn: stay.check_in,
    checkOut: stay.check_out,
    amenities: (stay as any).hotels?.amenities ?? [],
    faqs: faqs ?? [],
  });

  // Get or create conversation
  let conversationId = parsed.data.conversationId;
  if (!conversationId) {
    const { data: conv } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, hotel_id: stay.hotel_id, title: "Concierge Chat" })
      .select("id")
      .single();
    conversationId = conv?.id;
  }

  // Save user message
  if (conversationId) {
    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: parsed.data.message,
    });
  }

  // Get conversation history (last 20 messages)
  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = (history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Stream response from Claude
  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools: conciergeTools as any,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      stream.on("text", (text) => {
        fullResponse += text;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`));
      });

      stream.on("end", async () => {
        // Save assistant response
        if (conversationId && fullResponse) {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: fullResponse,
          });
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", conversationId })}\n\n`));
        controller.close();
      });

      stream.on("error", (err) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "AI service unavailable" })}\n\n`));
        controller.close();
      });
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
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Install Anthropic SDK if needed**

Run: `npm ls @anthropic-ai/sdk || npm install @anthropic-ai/sdk`

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/chat/route.ts src/lib/ai/concierge-system-prompt.ts src/lib/ai/concierge-tools.ts
git commit -m "feat(INN-38): AI concierge API route with Claude streaming"
```

---

### Task 5: Guest Welcome Screen (INN-18)

**Agent:** frontend
**Files:**
- Create: `src/app/(guest)/welcome/page.tsx`
- Reference: `~/Desktop/innara-design-static/src/pages/guest/GuestWelcome.tsx`

- [ ] **Step 1: Create welcome page**

```typescript
// src/app/(guest)/welcome/page.tsx
"use client";

import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Clock, Utensils, Phone, Bed } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { icon: Sparkles, label: "AI Concierge", href: "/guest/concierge", color: "text-violet-600" },
  { icon: Utensils, label: "Room Service", href: "/guest/room-service", color: "text-rose-600" },
  { icon: Bed, label: "Housekeeping", href: "/guest/services/housekeeping", color: "text-blue-600" },
  { icon: Phone, label: "Concierge", href: "/guest/services/concierge", color: "text-emerald-600" },
  { icon: MapPin, label: "Explore", href: "/guest/explore", color: "text-amber-600" },
  { icon: Clock, label: "My Requests", href: "/guest/requests", color: "text-slate-600" },
];

export default function GuestWelcomePage(): React.ReactElement {
  return (
    <GuestPageShell>
      <div className="px-4 py-6 space-y-6">
        {/* Welcome header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-navy">
            Welcome to your stay
          </h1>
          <p className="text-sm text-muted-foreground">
            Your AI concierge is ready to help with anything you need.
          </p>
        </div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="glass-card p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-xs font-medium text-navy">
                {action.label}
              </span>
            </Link>
          ))}
        </div>

        {/* AI Concierge CTA */}
        <div className="glass-card p-5 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-bronze mx-auto" />
          <h2 className="font-semibold text-navy">Ask me anything</h2>
          <p className="text-sm text-muted-foreground">
            I can help with room service, local recommendations, hotel info, and more.
          </p>
          <Button asChild className="w-full">
            <Link href="/guest/concierge">Start chatting</Link>
          </Button>
        </div>
      </div>
    </GuestPageShell>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`

- [ ] **Step 3: Write Playwright smoke test**

```typescript
// Add to e2e/smoke.spec.ts
test("guest welcome page loads", async ({ page }) => {
  await page.goto("/guest/welcome");
  await expect(page.getByText("Welcome to your stay")).toBeVisible();
  await expect(page.getByText("AI Concierge")).toBeVisible();
  await expect(page.getByText("Room Service")).toBeVisible();
});
```

- [ ] **Step 4: Screenshot verification**

```typescript
// Run in Playwright
await page.setViewportSize({ width: 375, height: 812 });
await page.goto("/guest/welcome");
await page.screenshot({ path: "screenshots/welcome-mobile.png", fullPage: true });
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(guest)/welcome/page.tsx e2e/smoke.spec.ts
git commit -m "feat(INN-18): guest welcome screen with quick actions grid"
```

---

### Task 6: Concierge Services Grid (INN-30)

**Agent:** frontend
**Files:**
- Create: `src/app/(guest)/services/page.tsx`
- Reference: `~/Desktop/innara-design-static/src/pages/guest/GuestConciergeServices.tsx`

- [ ] **Step 1: Create services grid page**

```typescript
// src/app/(guest)/services/page.tsx
"use client";

import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from "@/constants/app";
import type { RequestCategory } from "@/constants/app";
import Link from "next/link";
import {
  Bed, Wrench, Utensils, Phone, Car, Flower2, ClipboardList,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Bed, Wrench, Utensils, Phone, Car, Flower2, ClipboardList,
};

const services: Array<{ category: RequestCategory; description: string; href: string }> = [
  { category: "housekeeping", description: "Towels, cleaning, amenities", href: "/guest/services/housekeeping" },
  { category: "maintenance", description: "Repairs, AC, plumbing", href: "/guest/services/maintenance" },
  { category: "room_service", description: "Food & beverages to your room", href: "/guest/room-service" },
  { category: "concierge", description: "Reservations, directions, info", href: "/guest/services/concierge" },
  { category: "valet", description: "Parking, car service", href: "/guest/services/valet" },
  { category: "spa", description: "Wellness, massage, treatments", href: "/guest/services/spa" },
];

export default function ServicesPage(): React.ReactElement {
  return (
    <GuestPageShell>
      <div className="px-4 py-6 space-y-4">
        <h1 className="text-xl font-semibold text-navy">Services</h1>
        <p className="text-sm text-muted-foreground">
          What can we help you with?
        </p>

        <div className="space-y-3">
          {services.map((svc) => {
            const colors = CATEGORY_COLORS[svc.category];
            const IconName = CATEGORY_ICONS[svc.category];
            const Icon = iconMap[IconName] ?? ClipboardList;

            return (
              <Link
                key={svc.category}
                href={svc.href}
                className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy">
                    {CATEGORY_LABELS[svc.category]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {svc.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </GuestPageShell>
  );
}
```

- [ ] **Step 2: Typecheck + build**
- [ ] **Step 3: Smoke test + screenshot**
- [ ] **Step 4: Commit**

```bash
git add src/app/(guest)/services/page.tsx
git commit -m "feat(INN-30): concierge services grid screen"
```

---

## Wave 2 Tasks (Summary — detailed plan written per-wave)

Wave 2 builds on Wave 1's server actions and page structure:

| Task | Ticket | Description | Agent | Depends On |
|------|--------|-------------|-------|------------|
| 7 | INN-40 | AI concierge chat screen | frontend | Task 4 (API route) |
| 8 | INN-42 | Housekeeping request screen | frontend | Task 1 (request actions) |
| 9 | INN-45 | Maintenance request screen | frontend | Task 1 |
| 10 | INN-48 | Service detail screen | frontend | Task 6 |
| 11 | INN-51 | Room service menu screen | frontend | Task 3 (menu actions) |
| 12 | INN-53 | Room service checkout | frontend | Task 2 (order actions) + Task 11 |
| 13 | INN-56 | Guest requests list | frontend | Task 1 |
| 14 | INN-59 | Request detail + timeline | frontend | Task 1 |
| 15 | INN-61 | Guest explore screen | frontend | — |
| 16 | INN-62 | Guest profile screen | frontend | — |
| 17 | INN-67 | Guest feedback/ratings | frontend | Task 1 |
| 18 | INN-70 | Realtime hooks | frontend | — |
| 19 | INN-118 | Guest checkout/session end | frontend | — |

## Wave 3 Tasks (Summary)

| Task | Ticket | Description | Agent |
|------|--------|-------------|-------|
| 20 | INN-128 | QR codes + deep links | frontend |
| 21 | INN-129 | Request reopen flow | backend |
| 22 | INN-130 | AI fallback handling | ai-ml |
| 23 | INN-131 | Order cancellation guards | backend |
| 24 | INN-132 | AI prompt injection protection | security |
| 25 | INN-133 | Image upload pipeline | backend |
| 26 | INN-134 | Form idempotency | frontend |
| 27 | INN-149 | Adversarial AI testing | security |
| 28 | INN-75 | E2E test suite | test-engineer |
