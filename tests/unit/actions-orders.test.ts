import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/server before importing the action module
// vi.mock is hoisted — use vi.hoisted to declare mocks that the factory captures
// ---------------------------------------------------------------------------

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// Import after mock is registered
import { createOrder, cancelOrder } from "@/app/actions/orders";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createOrder — validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when items array is empty", async () => {
    const result = await createOrder({
      items: [],
      paymentMethod: "room_charge",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/at least one item/i);
  });

  it("rejects when items is missing entirely", async () => {
    const result = await createOrder({
      items: undefined as never,
      paymentMethod: "room_charge",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when paymentMethod is invalid", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 1,
        },
      ],
      paymentMethod: "bitcoin" as never,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when paymentMethod is empty string", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 1,
        },
      ],
      paymentMethod: "" as never,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when tip is negative", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 1,
        },
      ],
      paymentMethod: "room_charge",
      tip: -5,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when tip exceeds 10000", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 1,
        },
      ],
      paymentMethod: "room_charge",
      tip: 10001,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when an item has quantity 0", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 0,
        },
      ],
      paymentMethod: "room_charge",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when an item has quantity above 20", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 21,
        },
      ],
      paymentMethod: "room_charge",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when an item menuItemId is not a UUID", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "not-a-uuid",
          quantity: 1,
        },
      ],
      paymentMethod: "room_charge",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when specialInstructions on an item exceed 500 chars", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 1,
          specialInstructions: "A".repeat(501),
        },
      ],
      paymentMethod: "room_charge",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when order-level specialInstructions exceed 1000 chars", async () => {
    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 1,
        },
      ],
      paymentMethod: "room_charge",
      specialInstructions: "A".repeat(1001),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns Unauthorized when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const result = await createOrder({
      items: [
        {
          menuItemId: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234",
          quantity: 1,
        },
      ],
      paymentMethod: "room_charge",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });
});

describe("cancelOrder — validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when orderId is not a UUID", async () => {
    const result = await cancelOrder("not-a-uuid");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid order ID");
  });

  it("rejects when orderId is empty string", async () => {
    const result = await cancelOrder("");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid order ID");
  });

  it("returns Unauthorized when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const result = await cancelOrder("3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("returns error when order is not in pending status", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-uuid-1234" } },
      error: null,
    });

    // Return an order with status !== pending
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234", status: "in_progress", user_id: "user-uuid-1234" },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const result = await cancelOrder("3f1ac9e2-b46e-4c89-9d60-2b2e5f7a1234");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/pending/i);
  });
});
