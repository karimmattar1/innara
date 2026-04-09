"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveStaffContext } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";
import {
  computeResolutionBuckets,
  computeSlaCompliance,
  computePeakHours,
  aggregateTopStaff,
  computeKpis,
  type StaffAnalyticsRequest,
} from "@/lib/staff-analytics-compute";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const periodSchema = z.enum(["today", "week", "month"]).default("week");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StaffAnalyticsData {
  period: "today" | "week" | "month";
  department: string | null;
  kpis: ReturnType<typeof computeKpis>;
  resolutionBuckets: ReturnType<typeof computeResolutionBuckets>;
  peakHours: ReturnType<typeof computePeakHours>;
  topStaff: ReturnType<typeof aggregateTopStaff>;
  slaCompliance: ReturnType<typeof computeSlaCompliance>;
  totalRequestsThisPeriod: number;
}

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

type Period = "today" | "week" | "month";

function getPeriodStart(period: Period): string {
  const now = new Date();
  if (period === "today") {
    now.setUTCHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (period === "week") {
    now.setUTCDate(now.getUTCDate() - 7);
    return now.toISOString();
  }
  // month
  now.setUTCDate(now.getUTCDate() - 30);
  return now.toISOString();
}

/**
 * Returns [prevStart, prevEnd] for the window immediately before the current period.
 *   today  → yesterday (UTC midnight to end of yesterday)
 *   week   → 14 days ago to 7 days ago
 *   month  → 60 days ago to 30 days ago
 */
function getPrevPeriodBounds(period: Period): { start: string; end: string } {
  const now = new Date();
  if (period === "today") {
    const end = new Date(now);
    end.setUTCHours(0, 0, 0, 0); // start of today = end of yesterday
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (period === "week") {
    const end = new Date(now);
    end.setUTCDate(end.getUTCDate() - 7);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  // month
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 30);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 30);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ---------------------------------------------------------------------------
// getStaffAnalytics
// ---------------------------------------------------------------------------

export async function getStaffAnalytics(
  period?: "today" | "week" | "month",
): Promise<ActionResult<StaffAnalyticsData>> {
  const parsedPeriod = periodSchema.safeParse(period ?? "week");
  if (!parsedPeriod.success) {
    return { success: false, error: "Invalid period. Use 'today', 'week', or 'month'." };
  }

  const resolvedPeriod = parsedPeriod.data;

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    // Role check — must be staff/front_desk/manager/super_admin, NOT guest.
    // isManagerRole returns true for manager | super_admin.
    // Staff and front_desk are covered by having a valid staff_assignments row (resolveStaffContext).
    // We explicitly reject if somehow a guest reaches this action.
    const userId = ctx.user!.id;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (roleRow?.role === "guest") {
      return { success: false, error: "Unauthorized" };
    }

    const hotelId = ctx.assignment!.hotel_id;
    const department = ctx.assignment!.department ?? null;
    const periodStart = getPeriodStart(resolvedPeriod);
    const prevBounds = getPrevPeriodBounds(resolvedPeriod);

    // ---- Step 1: Resolve department staff IDs ----
    let deptStaffIds: string[] = [];
    if (department) {
      const { data: deptStaff } = await supabase
        .from("staff_assignments")
        .select("user_id")
        .eq("hotel_id", hotelId)
        .eq("department", department);

      deptStaffIds = (deptStaff ?? []).map((r) => r.user_id as string);
    }

    // ---- Step 2: Fetch current period requests ----
    let currentQuery = supabase
      .from("requests")
      .select(
        "id, status, category, priority, assigned_staff_id, eta_minutes, created_at, completed_at, room_number",
      )
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart);

    if (department && deptStaffIds.length > 0) {
      currentQuery = currentQuery.in("assigned_staff_id", deptStaffIds);
    }

    const { data: currentData, error: currentErr } = await currentQuery;
    if (currentErr) return { success: false, error: "Failed to load request data." };

    const currentRequests = (currentData ?? []) as StaffAnalyticsRequest[];

    // ---- Step 3: Fetch previous period requests ----
    let prevQuery = supabase
      .from("requests")
      .select(
        "id, status, category, priority, assigned_staff_id, eta_minutes, created_at, completed_at, room_number",
      )
      .eq("hotel_id", hotelId)
      .gte("created_at", prevBounds.start)
      .lt("created_at", prevBounds.end);

    if (department && deptStaffIds.length > 0) {
      prevQuery = prevQuery.in("assigned_staff_id", deptStaffIds);
    }

    const { data: prevData, error: prevErr } = await prevQuery;
    if (prevErr) return { success: false, error: "Failed to load previous period request data." };

    const prevRequests = (prevData ?? []) as StaffAnalyticsRequest[];

    // ---- Step 4: Fetch SLA configs ----
    const { data: slaConfigs } = await supabase
      .from("sla_configs")
      .select("category, priority, target_minutes")
      .eq("hotel_id", hotelId);

    const slaMap = new Map<string, number>();
    for (const cfg of slaConfigs ?? []) {
      slaMap.set(
        `${cfg.category as string}:${cfg.priority as string}`,
        cfg.target_minutes as number,
      );
    }

    // ---- Step 5: Fetch staff names ----
    // If department-scoped, use deptStaffIds; otherwise derive from current requests.
    const staffIdsToFetch = department
      ? deptStaffIds
      : [
          ...new Set(
            currentRequests
              .map((r) => r.assigned_staff_id)
              .filter((id): id is string => id !== null),
          ),
        ];

    const staffNames = new Map<string, string>();
    if (staffIdsToFetch.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIdsToFetch);

      for (const p of profiles ?? []) {
        staffNames.set(p.id as string, (p.full_name as string) ?? "Unknown");
      }
    }

    // ---- Step 6: Hotel average rating ----
    // ratings table is hotel-level; per-staff rating deferred per spec §13.
    // TODO: hook up ratings once table is confirmed
    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("rating")
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart);

    const hotelAvgRating =
      ratingsData && ratingsData.length > 0
        ? Math.round(
            (ratingsData.reduce((sum, r) => sum + ((r.rating as number) ?? 0), 0) /
              ratingsData.length) *
              10,
          ) / 10
        : 0;

    // ---- Step 7: Compose and return ----
    return {
      success: true,
      data: {
        period: resolvedPeriod,
        department,
        kpis: computeKpis(currentRequests, prevRequests, slaMap),
        resolutionBuckets: computeResolutionBuckets(currentRequests),
        peakHours: computePeakHours(currentRequests),
        topStaff: aggregateTopStaff(currentRequests, staffNames, hotelAvgRating),
        slaCompliance: computeSlaCompliance(currentRequests, slaMap),
        totalRequestsThisPeriod: currentRequests.length,
      },
    };
  } catch (err) {
    // Do not expose internals — log to Sentry in production
    void err;
    return { success: false, error: "Internal server error." };
  }
}
