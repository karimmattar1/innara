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
import { createRequest } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChain(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createRequest — validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when category is empty string", async () => {
    const result = await createRequest({
      category: "" as never,
      item: "Extra towels",
      description: "",
      roomNumber: "101",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when category is not in the allowed enum", async () => {
    const result = await createRequest({
      category: "laundry" as never,
      item: "Extra towels",
      description: "",
      roomNumber: "101",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when item is empty", async () => {
    const result = await createRequest({
      category: "housekeeping",
      item: "",
      description: "",
      roomNumber: "101",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/item is required/i);
  });

  it("rejects when item exceeds max length (200 chars)", async () => {
    const result = await createRequest({
      category: "housekeeping",
      item: "A".repeat(201),
      description: "",
      roomNumber: "101",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when roomNumber is empty", async () => {
    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "",
      roomNumber: "",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/room number is required/i);
  });

  it("rejects when priority is not in the allowed enum", async () => {
    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "",
      roomNumber: "101",
      priority: "critical" as never,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when description exceeds 1000 chars", async () => {
    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "A".repeat(1001),
      roomNumber: "101",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when photoUrls contains a non-URL string", async () => {
    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "",
      roomNumber: "101",
      priority: "medium",
      photoUrls: ["not-a-url"],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects when photoUrls has more than 5 entries", async () => {
    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "",
      roomNumber: "101",
      priority: "medium",
      photoUrls: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
        "https://example.com/5.jpg",
        "https://example.com/6.jpg",
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns Unauthorized when user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    mockFrom.mockReturnValue(makeChain());

    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "",
      roomNumber: "101",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
  });

  it("returns error when no active stay exists", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-uuid-1234" } },
      error: null,
    });

    // stay query returns null
    const stayChain = makeChain({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mockFrom.mockReturnValue(stayChain);

    const result = await createRequest({
      category: "housekeeping",
      item: "Extra towels",
      description: "",
      roomNumber: "101",
      priority: "medium",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no active stay/i);
  });
});
