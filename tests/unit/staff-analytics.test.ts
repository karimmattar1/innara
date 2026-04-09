// Acceptance test for INN-43
// Tests for pure helpers exported from @/lib/staff-analytics-compute.
// This file is intentionally RED before Task 2 completes — the module does not exist yet.
// All tests must fail with "Cannot find module '@/lib/staff-analytics-compute'" at first run.

import { describe, it, expect } from "vitest";
import {
  computeResolutionBuckets,
  computeSlaCompliance,
  computePeakHours,
  aggregateTopStaff,
  computeKpis,
  assertStaffInDepartment,
  BUCKET_THRESHOLDS_MINUTES,
  type StaffAnalyticsRequest,
} from "@/lib/staff-analytics-compute";

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/**
 * Build a completed request with a given resolution time in minutes.
 * created_at is anchored to a fixed base, completed_at is offset by durationMinutes.
 */
function makeCompleted(
  id: string,
  durationMinutes: number,
  overrides: Partial<StaffAnalyticsRequest> = {},
): StaffAnalyticsRequest {
  const createdAt = new Date("2026-04-02T10:00:00.000Z");
  const completedAt = new Date(createdAt.getTime() + durationMinutes * 60_000);
  return {
    id,
    status: "completed",
    category: "housekeeping",
    priority: "medium",
    assigned_staff_id: "staff-001",
    eta_minutes: null,
    created_at: createdAt.toISOString(),
    completed_at: completedAt.toISOString(),
    room_number: "101",
    ...overrides,
  };
}

/**
 * Build an open (non-completed) request.
 */
function makeOpen(
  id: string,
  status: "new" | "pending" | "in_progress" = "in_progress",
  overrides: Partial<StaffAnalyticsRequest> = {},
): StaffAnalyticsRequest {
  const createdAt = new Date("2026-04-02T14:00:00.000Z");
  return {
    id,
    status,
    category: "maintenance",
    priority: "high",
    assigned_staff_id: "staff-001",
    eta_minutes: 30,
    created_at: createdAt.toISOString(),
    completed_at: null,
    room_number: "202",
    ...overrides,
  };
}

/**
 * Build a request created at a specific UTC hour on a fixed date.
 */
function makeAtHour(id: string, hour: number): StaffAnalyticsRequest {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    id,
    status: "new",
    category: "concierge",
    priority: "low",
    assigned_staff_id: "staff-002",
    eta_minutes: 15,
    created_at: `2026-04-03T${pad(hour)}:30:00.000Z`,
    completed_at: null,
    room_number: null,
  };
}

// ---------------------------------------------------------------------------
// BUCKET_THRESHOLDS_MINUTES
// ---------------------------------------------------------------------------

describe("BUCKET_THRESHOLDS_MINUTES", () => {
  it("matches spec §7.4: fast=15, normal=30, slow=60", () => {
    expect(BUCKET_THRESHOLDS_MINUTES.fast).toBe(15);
    expect(BUCKET_THRESHOLDS_MINUTES.normal).toBe(30);
    expect(BUCKET_THRESHOLDS_MINUTES.slow).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// computeResolutionBuckets
// ---------------------------------------------------------------------------

describe("computeResolutionBuckets", () => {
  it("classifies boundary values into the correct buckets", () => {
    // Spec §7.4 boundary table:
    //   < 15 min → fast
    //   15–30 min → normal  (>= 15 AND <= 30 — or < 30 depending on impl; test both edges)
    //   30–60 min → slow    (> 30 AND <= 60)
    //   > 60 min → critical
    //
    // Feed: 14.99 (fast), 15.0 (normal), 29.99 (normal), 30.0 (slow), 59.99 (slow), 60.0 (slow or critical — spec says ≤60→slow), 60.01 (critical)
    // The plan says "60.0 is still slow because <= 60". Use that rule.
    const requests = [
      makeCompleted("r1", 14.99),   // fast
      makeCompleted("r2", 15.0),    // normal (>= 15)
      makeCompleted("r3", 29.99),   // normal (<= 30? — plan: 15–30 bucket includes both edges: >= 15 AND < 30, OR >= 15 AND <= 30)
      makeCompleted("r4", 30.0),    // slow (the plan groups 30 into slow: >= 30 AND <= 60)
      makeCompleted("r5", 59.99),   // slow
      makeCompleted("r6", 60.0),    // slow (≤ 60 per plan comment)
      makeCompleted("r7", 60.01),   // critical (> 60)
    ];

    const result = computeResolutionBuckets(requests);

    // fast: r1 (14.99)
    expect(result.fast).toBe(1);
    // normal: r2 (15.0), r3 (29.99) — assuming normal is [15, 30)
    expect(result.normal).toBe(2);
    // slow: r4 (30.0), r5 (59.99), r6 (60.0) — [30, 60]
    expect(result.slow).toBe(3);
    // critical: r7 (60.01)
    expect(result.critical).toBe(1);
  });

  it("ignores non-completed requests", () => {
    const requests: StaffAnalyticsRequest[] = [
      makeCompleted("r1", 10),   // fast — should count
      makeOpen("r2", "new"),
      makeOpen("r3", "pending"),
      makeOpen("r4", "in_progress"),
    ];

    const result = computeResolutionBuckets(requests);

    expect(result.fast).toBe(1);
    expect(result.normal).toBe(0);
    expect(result.slow).toBe(0);
    expect(result.critical).toBe(0);
  });

  it("returns all-zero buckets when no completed requests", () => {
    const result = computeResolutionBuckets([
      makeOpen("r1", "new"),
      makeOpen("r2", "in_progress"),
    ]);

    expect(result).toEqual({ fast: 0, normal: 0, slow: 0, critical: 0 });
  });

  it("returns all-zero buckets for an empty array", () => {
    const result = computeResolutionBuckets([]);
    expect(result).toEqual({ fast: 0, normal: 0, slow: 0, critical: 0 });
  });
});

// ---------------------------------------------------------------------------
// computeSlaCompliance
// ---------------------------------------------------------------------------

describe("computeSlaCompliance", () => {
  it("uses slaMap lookup first: 25-min resolution against 30-min target → on-time", () => {
    const slaMap = new Map([["housekeeping:medium", 30]]);
    const req = makeCompleted("r1", 25, { category: "housekeeping", priority: "medium" });

    const result = computeSlaCompliance([req], slaMap);

    expect(result.onTime).toBe(1);
    expect(result.breached).toBe(0);
    expect(result.pct).toBe(100);
  });

  it("uses slaMap lookup first: 35-min resolution against 30-min target → breached", () => {
    const slaMap = new Map([["housekeeping:medium", 30]]);
    const req = makeCompleted("r2", 35, { category: "housekeeping", priority: "medium" });

    const result = computeSlaCompliance([req], slaMap);

    expect(result.onTime).toBe(0);
    expect(result.breached).toBe(1);
    expect(result.pct).toBe(0);
  });

  it("falls back to eta_minutes when no slaMap entry — 15-min resolution against eta=20 → on-time", () => {
    const slaMap = new Map<string, number>(); // empty — no matching entry
    const req = makeCompleted("r3", 15, {
      category: "spa",
      priority: "low",
      eta_minutes: 20,
    });

    const result = computeSlaCompliance([req], slaMap);

    expect(result.onTime).toBe(1);
    expect(result.breached).toBe(0);
    expect(result.pct).toBe(100);
  });

  it("falls back to eta_minutes when no slaMap entry — 25-min resolution against eta=20 → breached", () => {
    const slaMap = new Map<string, number>();
    const req = makeCompleted("r4", 25, {
      category: "spa",
      priority: "low",
      eta_minutes: 20,
    });

    const result = computeSlaCompliance([req], slaMap);

    expect(result.onTime).toBe(0);
    expect(result.breached).toBe(1);
    expect(result.pct).toBe(0);
  });

  it("skips a request when slaMap has no entry AND eta_minutes is null", () => {
    const slaMap = new Map<string, number>();
    const req = makeCompleted("r5", 45, {
      category: "valet",
      priority: "urgent",
      eta_minutes: null,
    });

    const result = computeSlaCompliance([req], slaMap);

    // No denominator — should not count either way
    expect(result.onTime).toBe(0);
    expect(result.breached).toBe(0);
    expect(result.pct).toBe(0);
  });

  it("skips non-completed requests", () => {
    const slaMap = new Map([["maintenance:high", 60]]);
    const requests: StaffAnalyticsRequest[] = [
      makeCompleted("r1", 30, { category: "maintenance", priority: "high" }),
      makeOpen("r2", "in_progress", { category: "maintenance", priority: "high" }),
      makeOpen("r3", "new"),
    ];

    const result = computeSlaCompliance(requests, slaMap);

    // Only the completed one should contribute
    expect(result.onTime + result.breached).toBe(1);
  });

  it("returns {onTime:0, breached:0, pct:0} for zero completed requests", () => {
    const slaMap = new Map([["housekeeping:medium", 30]]);
    const result = computeSlaCompliance([], slaMap);

    expect(result).toEqual({ onTime: 0, breached: 0, pct: 0 });
  });

  it("computes correct mixed on-time/breached pct: 3 on-time, 1 breached → 75%", () => {
    const slaMap = new Map([["housekeeping:medium", 30]]);
    const requests = [
      makeCompleted("r1", 10, { category: "housekeeping", priority: "medium" }),
      makeCompleted("r2", 20, { category: "housekeeping", priority: "medium" }),
      makeCompleted("r3", 29, { category: "housekeeping", priority: "medium" }),
      makeCompleted("r4", 45, { category: "housekeeping", priority: "medium" }),
    ];

    const result = computeSlaCompliance(requests, slaMap);

    expect(result.onTime).toBe(3);
    expect(result.breached).toBe(1);
    expect(result.pct).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// computePeakHours
// ---------------------------------------------------------------------------

describe("computePeakHours", () => {
  it("always returns an array of exactly 24 entries", () => {
    const result = computePeakHours([]);
    expect(result).toHaveLength(24);
  });

  it("returns length 24 even with many requests", () => {
    const requests = Array.from({ length: 50 }, (_, i) =>
      makeAtHour(`r${i}`, i % 24),
    );
    expect(computePeakHours(requests)).toHaveLength(24);
  });

  it("hours are 0-23 in order", () => {
    const result = computePeakHours([]);
    result.forEach((entry, index) => {
      expect(entry.hour).toBe(index);
    });
  });

  it("counts a single request at hour 3 correctly", () => {
    const result = computePeakHours([makeAtHour("r1", 3)]);

    expect(result[3].count).toBe(1);
    expect(result[0].count).toBe(0);
    expect(result[23].count).toBe(0);
  });

  it("sums total counts to equal the total number of requests", () => {
    const requests = [
      makeAtHour("r1", 0),
      makeAtHour("r2", 6),
      makeAtHour("r3", 6),
      makeAtHour("r4", 12),
      makeAtHour("r5", 12),
      makeAtHour("r6", 12),
      makeAtHour("r7", 18),
      makeAtHour("r8", 22),
      makeAtHour("r9", 22),
      makeAtHour("r10", 23),
    ];

    const result = computePeakHours(requests);
    const total = result.reduce((sum, h) => sum + h.count, 0);

    expect(total).toBe(10);
  });

  it("returns all-zero counts for an empty request array", () => {
    const result = computePeakHours([]);
    const allZero = result.every((h) => h.count === 0);
    expect(allZero).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// aggregateTopStaff
// ---------------------------------------------------------------------------

describe("aggregateTopStaff", () => {
  const staffNames = new Map([
    ["staff-a", "Anna Lee"],
    ["staff-b", "Ben Cruz"],
    ["staff-c", "Cleo Tam"],
    ["staff-d", "Dev Patel"],
  ]);
  const hotelAvgRating = 4.3;

  it("returns top 3 sorted by requestsHandled descending", () => {
    // staff-a: 5 completed, staff-b: 3, staff-c: 7, staff-d: 2
    const requests: StaffAnalyticsRequest[] = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeCompleted(`a${i}`, 20, { assigned_staff_id: "staff-a" }),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeCompleted(`b${i}`, 20, { assigned_staff_id: "staff-b" }),
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        makeCompleted(`c${i}`, 20, { assigned_staff_id: "staff-c" }),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeCompleted(`d${i}`, 20, { assigned_staff_id: "staff-d" }),
      ),
    ];

    const result = aggregateTopStaff(requests, staffNames, hotelAvgRating);

    expect(result).toHaveLength(3);
    expect(result[0].staffId).toBe("staff-c"); // 7
    expect(result[0].requestsHandled).toBe(7);
    expect(result[1].staffId).toBe("staff-a"); // 5
    expect(result[1].requestsHandled).toBe(5);
    expect(result[2].staffId).toBe("staff-b"); // 3
    expect(result[2].requestsHandled).toBe(3);
  });

  it("breaks ties by lower avgResolutionMinutes", () => {
    // staff-a and staff-b both have 4 completed, but staff-a resolves faster
    const requests: StaffAnalyticsRequest[] = [
      ...Array.from({ length: 4 }, (_, i) =>
        makeCompleted(`a${i}`, 15, { assigned_staff_id: "staff-a" }),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeCompleted(`b${i}`, 45, { assigned_staff_id: "staff-b" }),
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeCompleted(`c${i}`, 25, { assigned_staff_id: "staff-c" }),
      ),
    ];

    const result = aggregateTopStaff(requests, staffNames, hotelAvgRating);

    // Tie on count (4 each) → staff-a wins because 15 min avg < 45 min avg
    expect(result[0].staffId).toBe("staff-a");
    expect(result[1].staffId).toBe("staff-b");
    expect(result[2].staffId).toBe("staff-c");
  });

  it("only counts completed requests toward avg resolution — open requests are excluded", () => {
    const requests: StaffAnalyticsRequest[] = [
      makeCompleted("c1", 10, { assigned_staff_id: "staff-a" }),
      makeCompleted("c2", 20, { assigned_staff_id: "staff-a" }),
      // These open ones must NOT inflate the average
      makeOpen("o1", "new", { assigned_staff_id: "staff-a" }),
      makeOpen("o2", "in_progress", { assigned_staff_id: "staff-a" }),
    ];

    const result = aggregateTopStaff(requests, staffNames, hotelAvgRating);

    expect(result[0].staffId).toBe("staff-a");
    expect(result[0].requestsHandled).toBe(2); // only completed count
    expect(result[0].avgResolutionMinutes).toBe(15); // (10 + 20) / 2
  });

  it("attaches the hotel average rating to each top-staff entry", () => {
    const requests = [
      makeCompleted("r1", 10, { assigned_staff_id: "staff-a" }),
    ];

    const result = aggregateTopStaff(requests, staffNames, hotelAvgRating);

    expect(result[0].rating).toBe(hotelAvgRating);
  });

  it("returns at most 3 entries even when more staff are present", () => {
    const requests: StaffAnalyticsRequest[] = Array.from(
      { length: 8 },
      (_, i) =>
        makeCompleted(`r${i}`, 20, {
          assigned_staff_id: `staff-${["a", "b", "c", "d"][i % 4]}`,
        }),
    );

    const result = aggregateTopStaff(requests, staffNames, hotelAvgRating);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("returns an empty array when there are no completed requests", () => {
    const requests = [
      makeOpen("o1", "new", { assigned_staff_id: "staff-a" }),
    ];

    const result = aggregateTopStaff(requests, staffNames, hotelAvgRating);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// assertStaffInDepartment  (AC #6)
// ---------------------------------------------------------------------------

describe("assertStaffInDepartment", () => {
  const deptStaffIds = ["staff-aaa", "staff-bbb"];

  it("returns true when staffId is in the department list", () => {
    expect(assertStaffInDepartment(deptStaffIds, "staff-aaa")).toBe(true);
  });

  it("returns true for the second member of the department", () => {
    expect(assertStaffInDepartment(deptStaffIds, "staff-bbb")).toBe(true);
  });

  it("returns false when staffId is NOT in the department list — cross-dept isolation guard (AC #6)", () => {
    expect(assertStaffInDepartment(deptStaffIds, "staff-ccc")).toBe(false);
  });

  it("returns true when staffId is undefined — no individual filter applied", () => {
    expect(assertStaffInDepartment(deptStaffIds, undefined)).toBe(true);
  });

  it("returns true for an empty department list with no staffId filter", () => {
    expect(assertStaffInDepartment([], undefined)).toBe(true);
  });

  it("returns false for an empty department list when staffId is provided", () => {
    expect(assertStaffInDepartment([], "staff-aaa")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeKpis
// ---------------------------------------------------------------------------

describe("computeKpis", () => {
  it("returns all zeroed out when both request arrays are empty", () => {
    const result = computeKpis([], [], new Map());

    expect(result.openRequests).toBe(0);
    expect(result.slaCompliancePct).toBe(0);
    expect(result.slaCompliancePrevPct).toBe(0);
    expect(result.avgResolutionMinutes).toBe(0);
    expect(result.completionRatePct).toBe(0);
    expect(result.completionRatePrevPct).toBe(0);
  });

  it("counts open requests correctly — only new, pending, in_progress", () => {
    const requests: StaffAnalyticsRequest[] = [
      makeOpen("r1", "new"),
      makeOpen("r2", "pending"),
      makeOpen("r3", "in_progress"),
      makeCompleted("r4", 20),
      makeOpen("r5", "new", { status: "cancelled" } as Partial<StaffAnalyticsRequest>),
    ];

    const result = computeKpis(requests, [], new Map());

    // cancelled does not count as open
    expect(result.openRequests).toBe(3);
  });

  it("computes avgResolutionMinutes as average of completed-only requests", () => {
    const requests: StaffAnalyticsRequest[] = [
      makeCompleted("r1", 10),
      makeCompleted("r2", 20),
      makeCompleted("r3", 30),
      makeOpen("r4", "in_progress"), // must not affect average
    ];

    const result = computeKpis(requests, [], new Map());

    // (10 + 20 + 30) / 3 = 20
    expect(result.avgResolutionMinutes).toBe(20);
  });

  it("returns avgResolutionMinutes=0 when no completed requests exist", () => {
    const requests = [makeOpen("r1", "new"), makeOpen("r2", "in_progress")];

    const result = computeKpis(requests, [], new Map());

    expect(result.avgResolutionMinutes).toBe(0);
  });

  it("computes completionRatePct as pct of completed over total (excluding cancelled)", () => {
    // 2 completed, 2 open = 2/4 = 50%
    const requests: StaffAnalyticsRequest[] = [
      makeCompleted("r1", 10),
      makeCompleted("r2", 20),
      makeOpen("r3", "new"),
      makeOpen("r4", "in_progress"),
    ];

    const result = computeKpis(requests, [], new Map());

    expect(result.completionRatePct).toBe(50);
  });

  it("computes trend pcts against prev window requests", () => {
    const slaMap = new Map([["housekeeping:medium", 30]]);

    // Current: 2 on-time, 0 breached → 100%
    const current = [
      makeCompleted("c1", 10, { category: "housekeeping", priority: "medium" }),
      makeCompleted("c2", 20, { category: "housekeeping", priority: "medium" }),
    ];

    // Previous: 1 on-time, 1 breached → 50%
    const prev = [
      makeCompleted("p1", 10, { category: "housekeeping", priority: "medium" }),
      makeCompleted("p2", 45, { category: "housekeeping", priority: "medium" }),
    ];

    const result = computeKpis(current, prev, slaMap);

    expect(result.slaCompliancePct).toBe(100);
    expect(result.slaCompliancePrevPct).toBe(50);
  });
});
