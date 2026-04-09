// ---------------------------------------------------------------------------
// Staff analytics pure helpers — NO "use server" here.
// This file exports plain TypeScript: constants, types, and pure functions.
// It is imported by both the server action and the unit test suite.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BUCKET_THRESHOLDS_MINUTES = {
  fast: 15,
  normal: 30,
  slow: 60,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffAnalyticsRequest {
  id: string;
  status: string; // 'new' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  category: string;
  priority: string;
  assigned_staff_id: string | null;
  eta_minutes: number | null;
  created_at: string; // ISO
  completed_at: string | null; // ISO
  room_number: string | null;
}

// ---------------------------------------------------------------------------
// computeResolutionBuckets
// ---------------------------------------------------------------------------

/**
 * Bucket completed requests by resolution time.
 *
 * Boundaries (matching spec §7.4):
 *   < 15 min        → fast
 *   >= 15 && < 30   → normal
 *   >= 30 && <= 60  → slow   (60.0 is slow, NOT critical)
 *   > 60            → critical
 *
 * Non-completed requests are skipped.
 */
export function computeResolutionBuckets(
  requests: StaffAnalyticsRequest[],
): { fast: number; normal: number; slow: number; critical: number } {
  const result = { fast: 0, normal: 0, slow: 0, critical: 0 };

  for (const req of requests) {
    if (req.status !== "completed") continue;
    if (!req.created_at || !req.completed_at) continue;

    const resolutionMinutes =
      (new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()) / 60_000;

    if (resolutionMinutes < BUCKET_THRESHOLDS_MINUTES.fast) {
      result.fast++;
    } else if (resolutionMinutes < BUCKET_THRESHOLDS_MINUTES.normal) {
      result.normal++;
    } else if (resolutionMinutes <= BUCKET_THRESHOLDS_MINUTES.slow) {
      result.slow++;
    } else {
      result.critical++;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// computeSlaCompliance
// ---------------------------------------------------------------------------

/**
 * Compute SLA compliance for completed requests.
 *
 * Logic (mirrors getRequestAnalytics lines 324-367 in analytics.ts):
 *   1. Skip non-completed requests.
 *   2. Look up slaMap.get(`${category}:${priority}`).
 *   3. Fall back to request.eta_minutes if no slaMap entry.
 *   4. Skip (no contribution) if both are null.
 *   5. resolutionMinutes <= effectiveTarget → onTime, else breached.
 *   6. pct = total === 0 ? 0 : Math.round((onTime / total) * 100).
 */
export function computeSlaCompliance(
  requests: StaffAnalyticsRequest[],
  slaMap: Map<string, number>,
): { onTime: number; breached: number; pct: number } {
  let onTime = 0;
  let breached = 0;

  for (const req of requests) {
    if (req.status !== "completed") continue;

    const key = `${req.category}:${req.priority}`;
    const targetMinutes = slaMap.get(key);

    const effectiveTarget: number | null =
      targetMinutes !== undefined ? targetMinutes : req.eta_minutes ?? null;

    if (effectiveTarget === null) continue;
    if (!req.created_at || !req.completed_at) continue;

    const resolutionMinutes =
      (new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()) / 60_000;

    if (resolutionMinutes <= effectiveTarget) {
      onTime++;
    } else {
      breached++;
    }
  }

  const total = onTime + breached;
  const pct = total === 0 ? 0 : Math.round((onTime / total) * 100);

  return { onTime, breached, pct };
}

// ---------------------------------------------------------------------------
// computePeakHours
// ---------------------------------------------------------------------------

/**
 * Distribute all requests (any status) into a 24-element array by UTC hour.
 * Always returns exactly 24 entries: [{ hour: 0, count }, ..., { hour: 23, count }].
 */
export function computePeakHours(
  requests: StaffAnalyticsRequest[],
): Array<{ hour: number; count: number }> {
  const counts = new Array<number>(24).fill(0);

  for (const req of requests) {
    const hour = new Date(req.created_at).getUTCHours();
    counts[hour]++;
  }

  return counts.map((count, hour) => ({ hour, count }));
}

// ---------------------------------------------------------------------------
// aggregateTopStaff
// ---------------------------------------------------------------------------

/**
 * Build the top-3 staff leaderboard from completed requests.
 *
 * Rules:
 *   - Only completed requests count toward requestsHandled and avgResolutionMinutes.
 *   - Sorted by requestsHandled descending; tie-broken by lower avgResolutionMinutes.
 *   - Returns at most 3 entries.
 *   - rating = hotelAvgRating (per-staff rating deferred per spec §13).
 *   - Returns [] if there are no completed requests.
 */
export function aggregateTopStaff(
  requests: StaffAnalyticsRequest[],
  staffNames: Map<string, string>,
  hotelAvgRating: number,
): Array<{
  staffId: string;
  name: string;
  requestsHandled: number;
  avgResolutionMinutes: number;
  rating: number;
}> {
  const metrics = new Map<string, { count: number; totalMinutes: number }>();

  for (const req of requests) {
    if (req.status !== "completed") continue;
    if (!req.assigned_staff_id) continue;

    const staffId = req.assigned_staff_id;
    if (!metrics.has(staffId)) {
      metrics.set(staffId, { count: 0, totalMinutes: 0 });
    }
    const entry = metrics.get(staffId)!;
    entry.count++;

    if (req.created_at && req.completed_at) {
      const diffMinutes =
        (new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()) / 60_000;
      if (diffMinutes >= 0) {
        entry.totalMinutes += diffMinutes;
      }
    }
  }

  if (metrics.size === 0) return [];

  const entries = Array.from(metrics.entries()).map(([staffId, m]) => ({
    staffId,
    name: staffNames.get(staffId) ?? "Unknown",
    requestsHandled: m.count,
    avgResolutionMinutes: m.count > 0 ? m.totalMinutes / m.count : 0,
    rating: hotelAvgRating,
  }));

  entries.sort((a, b) => {
    if (b.requestsHandled !== a.requestsHandled) {
      return b.requestsHandled - a.requestsHandled;
    }
    return a.avgResolutionMinutes - b.avgResolutionMinutes;
  });

  return entries.slice(0, 3);
}

// ---------------------------------------------------------------------------
// assertStaffInDepartment
// ---------------------------------------------------------------------------

/**
 * Guard: verify that staffId belongs to the department.
 *
 * Rules:
 *   - staffId === undefined → true (no individual filter applied, pass through)
 *   - Empty list + undefined → true
 *   - Empty list + provided staffId → false
 *   - Otherwise: deptStaffIds.includes(staffId)
 */
export function assertStaffInDepartment(
  deptStaffIds: string[],
  staffId: string | undefined,
): boolean {
  if (staffId === undefined) return true;
  return deptStaffIds.includes(staffId);
}

// ---------------------------------------------------------------------------
// computeKpis
// ---------------------------------------------------------------------------

/**
 * Compose KPIs from current and previous period request arrays.
 *
 * openRequests:
 *   Count of current requests with status in {new, pending, in_progress}.
 *   Cancelled does NOT count as open.
 *
 * slaCompliancePct / slaCompliancePrevPct:
 *   computeSlaCompliance(current | prev, slaMap).pct
 *
 * avgResolutionMinutes:
 *   Average resolution time of completed current requests; 0 if none.
 *
 * completionRatePct:
 *   completed / (completed + open) from current period; 0 if denominator is 0.
 *   "open" here = new + pending + in_progress (same set as openRequests).
 *
 * completionRatePrevPct:
 *   Same formula for prev period.
 */
export function computeKpis(
  current: StaffAnalyticsRequest[],
  prev: StaffAnalyticsRequest[],
  slaMap: Map<string, number>,
): {
  openRequests: number;
  slaCompliancePct: number;
  slaCompliancePrevPct: number;
  avgResolutionMinutes: number;
  completionRatePct: number;
  completionRatePrevPct: number;
} {
  const openStatuses = new Set(["new", "pending", "in_progress"]);

  // --- current period ---
  const openRequests = current.filter((r) => openStatuses.has(r.status)).length;

  const completedCurrent = current.filter((r) => r.status === "completed");

  let totalResolutionMinutes = 0;
  for (const req of completedCurrent) {
    if (req.created_at && req.completed_at) {
      totalResolutionMinutes +=
        (new Date(req.completed_at).getTime() - new Date(req.created_at).getTime()) / 60_000;
    }
  }
  const avgResolutionMinutes =
    completedCurrent.length > 0 ? totalResolutionMinutes / completedCurrent.length : 0;

  const completionDenom = completedCurrent.length + openRequests;
  const completionRatePct =
    completionDenom > 0 ? Math.round((completedCurrent.length / completionDenom) * 100) : 0;

  const slaCompliancePct = computeSlaCompliance(current, slaMap).pct;

  // --- previous period ---
  const openPrev = prev.filter((r) => openStatuses.has(r.status)).length;
  const completedPrev = prev.filter((r) => r.status === "completed");
  const completionDenomPrev = completedPrev.length + openPrev;
  const completionRatePrevPct =
    completionDenomPrev > 0 ? Math.round((completedPrev.length / completionDenomPrev) * 100) : 0;

  const slaCompliancePrevPct = computeSlaCompliance(prev, slaMap).pct;

  return {
    openRequests,
    slaCompliancePct,
    slaCompliancePrevPct,
    avgResolutionMinutes,
    completionRatePct,
    completionRatePrevPct,
  };
}
