"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const orderItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().min(1).max(20),
  modifiers: z.record(z.string(), z.string()).optional(),
  specialInstructions: z.string().max(500).optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  paymentMethod: z.enum(["room_charge", "card", "cash"]),
  specialInstructions: z.string().max(1000).optional(),
  tip: z.number().min(0).max(10000).optional(),
});

const orderIdSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export type CreateOrderInput = z.input<typeof createOrderSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAX_RATE = 0.1;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

// ---------------------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------------------

export async function createOrder(
  input: CreateOrderInput,
): Promise<ActionResult<{ id: string; total: number }>> {
  // 1. Validate input
  const parsed = createOrderSchema.safeParse(input);
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

    // 3. Get active stay
    const { data: stay, error: stayError } = await supabase
      .from("stays")
      .select("id, hotel_id, room_number")
      .eq("guest_id", user.id)
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

    // 4. Look up prices for all menu items
    const menuItemIds = parsed.data.items.map((item) => item.menuItemId);
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, price, is_available")
      .in("id", menuItemIds)
      .eq("hotel_id", stay.hotel_id);

    if (menuError) {
      return { success: false, error: "Unable to retrieve menu information. Please try again." };
    }

    // Verify all requested items exist and are available
    const menuItemMap = new Map(menuItems?.map((mi) => [mi.id, mi]) ?? []);
    for (const item of parsed.data.items) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        return { success: false, error: `Menu item not found.` };
      }
      if (!menuItem.is_available) {
        return { success: false, error: `One or more items are currently unavailable.` };
      }
    }

    // 5. Calculate subtotal, tax, total
    let subtotal = 0;
    for (const item of parsed.data.items) {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      subtotal += menuItem.price * item.quantity;
    }
    const tipAmount = parsed.data.tip ?? 0;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax + tipAmount) * 100) / 100;

    // 6. Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        hotel_id: stay.hotel_id,
        user_id: user.id,
        stay_id: stay.id,
        room_number: stay.room_number,
        payment_method: parsed.data.paymentMethod,
        special_instructions: parsed.data.specialInstructions ?? null,
        subtotal,
        tax,
        tip: tipAmount,
        total,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError) {
      return { success: false, error: "Failed to place order. Please try again." };
    }

    // 7. Insert order items
    const orderItems = parsed.data.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: menuItemMap.get(item.menuItemId)!.price,
      modifiers: item.modifiers ?? null,
      special_instructions: item.specialInstructions ?? null,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      // Order was created but items failed — attempt cleanup
      await supabase.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Failed to place order. Please try again." };
    }

    return { success: true, data: { id: order.id, total } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getMyOrders
// ---------------------------------------------------------------------------

export async function getMyOrders(): Promise<ActionResult<unknown[]>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Fetch orders with items
    const { data: orders, error: queryError } = await supabase
      .from("orders")
      .select(
        `
        id, status, payment_method, special_instructions, subtotal, tax, tip, total,
        room_number, created_at, updated_at,
        order_items (
          id, menu_item_id, quantity, unit_price, modifiers, special_instructions
        )
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      return { success: false, error: "Unable to retrieve orders. Please try again." };
    }

    return { success: true, data: orders ?? [] };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// cancelOrder
// ---------------------------------------------------------------------------

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  // 1. Validate UUID
  const parsed = orderIdSchema.safeParse({ orderId });
  if (!parsed.success) {
    return { success: false, error: "Invalid order ID" };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Fetch order to verify ownership, status, and time window
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, user_id, created_at")
      .eq("id", parsed.data.orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: "Unable to retrieve order. Please try again." };
    }

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (order.status !== "pending") {
      return { success: false, error: "Only pending orders can be cancelled." };
    }

    // Time guard: orders can only be cancelled within 5 minutes of creation (INN-131)
    const CANCEL_WINDOW_MS = 5 * 60 * 1000;
    const createdAt = new Date(order.created_at).getTime();
    if (Date.now() - createdAt > CANCEL_WINDOW_MS) {
      return { success: false, error: "Orders can only be cancelled within 5 minutes of placement." };
    }

    // 4. Cancel order
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", parsed.data.orderId)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: "Failed to cancel order. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getOrderById
// ---------------------------------------------------------------------------

export async function getOrderById(orderId: string): Promise<ActionResult<unknown>> {
  // 1. Validate UUID
  const parsed = orderIdSchema.safeParse({ orderId });
  if (!parsed.success) {
    return { success: false, error: "Invalid order ID" };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Fetch order with items, filtered by user_id
    const { data: order, error: queryError } = await supabase
      .from("orders")
      .select(
        `
        id, status, payment_method, special_instructions, subtotal, tax, tip, total,
        room_number, created_at, updated_at,
        order_items (
          id, menu_item_id, quantity, unit_price, modifiers, special_instructions
        )
        `
      )
      .eq("id", parsed.data.orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) {
      return { success: false, error: "Unable to retrieve order. Please try again." };
    }

    if (!order) {
      return { success: false, error: "Order not found." };
    }

    return { success: true, data: order };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getOrderStatus (INN-131 — lightweight polling endpoint)
// ---------------------------------------------------------------------------

export async function getOrderStatus(
  orderId: string,
): Promise<ActionResult<{ id: string; status: string }>> {
  const parsed = orderIdSchema.safeParse({ orderId });
  if (!parsed.success) {
    return { success: false, error: "Invalid order ID" };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", parsed.data.orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "Order not found." };
    }

    return { success: true, data: { id: data.id, status: data.status } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
