"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveStaffContext, isManagerRole } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const periodSchema = z
  .enum(["today", "week", "month"])
  .default("week");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalRequests: number;
  completedRequests: number;
  averageRating: number;
  activeGuests: number;
  avgResolutionMinutes: number;
  revenueTotal: number;
}

export interface RequestAnalytics {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  dailyTrend: Array<{ date: string; count: number }>;
  slaCompliance: { onTime: number; breached: number; percentage: number };
}

export interface StaffPerformanceEntry {
  staffId: string;
  name: string;
  department: string;
  requestsHandled: number;
  avgResolutionMinutes: number;
  rating: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Period = "today" | "week" | "month";

function getPeriodStart(period: Period): string {
  const now = new Date();
  if (period === "today") {
    // Start of today in UTC
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
 * Generate an array of date strings (YYYY-MM-DD) from startDate to today (inclusive).
 * Used to fill in missing days in daily trend queries.
 */
function buildDateRange(startIso: string): string[] {
  const result: string[] = [];
  const start = new Date(startIso);
  const end = new Date();
  // Normalise both to midnight UTC
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

export async function getDashboardStats(
  period?: "today" | "week" | "month",
): Promise<ActionResult<DashboardStats>> {
  const parsedPeriod = periodSchema.safeParse(period);
  if (!parsedPeriod.success) {
    return { success: false, error: "Invalid period. Use 'today', 'week', or 'month'." };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const managerCheck = await isManagerRole(supabase, ctx.user!.id);
    if (!managerCheck) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;
    const periodStart = getPeriodStart(parsedPeriod.data);

    // ---- Total requests in period ----
    const { count: totalRequests, error: totalErr } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart);

    if (totalErr) return { success: false, error: "Failed to load request totals." };

    // ---- Completed requests in period ----
    const { count: completedRequests, error: completedErr } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId)
      .eq("status", "completed")
      .gte("created_at", periodStart);

    if (completedErr) return { success: false, error: "Failed to load completed request count." };

    // ---- Average rating in period ----
    const { data: ratingsData, error: ratingsErr } = await supabase
      .from("ratings")
      .select("rating")
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart);

    if (ratingsErr) return { success: false, error: "Failed to load ratings." };

    const averageRating =
      ratingsData && ratingsData.length > 0
        ? Math.round(
            (ratingsData.reduce((sum, r) => sum + (r.rating as number), 0) /
              ratingsData.length) *
              10,
          ) / 10
        : 0;

    // ---- Active guests (stays with status='active', not filtered by period) ----
    const { count: activeGuests, error: activeGuestsErr } = await supabase
      .from("stays")
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId)
      .eq("status", "active");

    if (activeGuestsErr) return { success: false, error: "Failed to load active guest count." };

    // ---- Average resolution time (minutes) ----
    // Strategy: for each completed request in the period, compute the delta between
    // the earliest 'new' event and the earliest 'completed' event in request_events.
    // We pull the raw events and compute in JS to avoid requiring DB functions.
    const { data: completedReqIds, error: completedIdsErr } = await supabase
      .from("requests")
      .select("id")
      .eq("hotel_id", hotelId)
      .eq("status", "completed")
      .gte("created_at", periodStart);

    if (completedIdsErr) return { success: false, error: "Failed to load completed requests." };

    let avgResolutionMinutes = 0;

    if (completedReqIds && completedReqIds.length > 0) {
      const requestIds = completedReqIds.map((r) => r.id as string);

      const { data: events, error: eventsErr } = await supabase
        .from("request_events")
        .select("request_id, status, created_at")
        .in("request_id", requestIds)
        .in("status", ["new", "completed"]);

      if (eventsErr) return { success: false, error: "Failed to load request events." };

      if (events && events.length > 0) {
        // Group by request_id
        const byRequest = new Map<string, { newAt?: number; completedAt?: number }>();

        for (const event of events) {
          const reqId = event.request_id as string;
          if (!byRequest.has(reqId)) byRequest.set(reqId, {});
          const entry = byRequest.get(reqId)!;
          const ts = new Date(event.created_at as string).getTime();

          if (event.status === "new") {
            if (entry.newAt === undefined || ts < entry.newAt) entry.newAt = ts;
          } else if (event.status === "completed") {
            if (entry.completedAt === undefined || ts < entry.completedAt) entry.completedAt = ts;
          }
        }

        let totalMinutes = 0;
        let sampleCount = 0;
        for (const entry of byRequest.values()) {
          if (entry.newAt !== undefined && entry.completedAt !== undefined) {
            const diffMinutes = (entry.completedAt - entry.newAt) / 60_000;
            if (diffMinutes >= 0) {
              totalMinutes += diffMinutes;
              sampleCount++;
            }
          }
        }
        if (sampleCount > 0) {
          avgResolutionMinutes = Math.round(totalMinutes / sampleCount);
        }
      }
    }

    // ---- Revenue total ----
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("total")
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart)
      .neq("status", "cancelled");

    if (ordersErr) return { success: false, error: "Failed to load revenue data." };

    const revenueTotal =
      ordersData && ordersData.length > 0
        ? Math.round(
            ordersData.reduce((sum, o) => sum + ((o.total as number) ?? 0), 0) * 100,
          ) / 100
        : 0;

    return {
      success: true,
      data: {
        totalRequests: totalRequests ?? 0,
        completedRequests: completedRequests ?? 0,
        averageRating,
        activeGuests: activeGuests ?? 0,
        avgResolutionMinutes,
        revenueTotal,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getRequestAnalytics
// ---------------------------------------------------------------------------

export async function getRequestAnalytics(
  period?: "today" | "week" | "month",
): Promise<ActionResult<RequestAnalytics>> {
  const parsedPeriod = periodSchema.safeParse(period);
  if (!parsedPeriod.success) {
    return { success: false, error: "Invalid period. Use 'today', 'week', or 'month'." };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const managerCheck = await isManagerRole(supabase, ctx.user!.id);
    if (!managerCheck) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;
    const periodStart = getPeriodStart(parsedPeriod.data);

    // ---- Fetch all requests in period for breakdown ----
    const { data: requests, error: requestsErr } = await supabase
      .from("requests")
      .select("id, status, category, priority, created_at, completed_at, eta_minutes")
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart);

    if (requestsErr) return { success: false, error: "Failed to load request data." };

    const allRequests = requests ?? [];

    // ---- byStatus ----
    const byStatus: Record<string, number> = {};
    for (const req of allRequests) {
      const status = (req.status as string) ?? "unknown";
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }

    // ---- byCategory ----
    const byCategory: Record<string, number> = {};
    for (const req of allRequests) {
      const category = (req.category as string) ?? "unknown";
      byCategory[category] = (byCategory[category] ?? 0) + 1;
    }

    // ---- byPriority ----
    const byPriority: Record<string, number> = {};
    for (const req of allRequests) {
      const priority = (req.priority as string) ?? "unknown";
      byPriority[priority] = (byPriority[priority] ?? 0) + 1;
    }

    // ---- dailyTrend ----
    const dateCounts = new Map<string, number>();
    for (const req of allRequests) {
      const day = (req.created_at as string).slice(0, 10);
      dateCounts.set(day, (dateCounts.get(day) ?? 0) + 1);
    }
    const allDates = buildDateRange(periodStart);
    const dailyTrend = allDates.map((date) => ({
      date,
      count: dateCounts.get(date) ?? 0,
    }));

    // ---- SLA compliance ----
    // Fetch SLA configs for this hotel to determine target_minutes per category/priority
    const { data: slaConfigs, error: slaErr } = await supabase
      .from("sla_configs")
      .select("category, priority, target_minutes")
      .eq("hotel_id", hotelId);

    if (slaErr) return { success: false, error: "Failed to load SLA configuration." };

    // Build a lookup map: "category:priority" -> target_minutes
    const slaMap = new Map<string, number>();
    for (const cfg of slaConfigs ?? []) {
      slaMap.set(
        `${cfg.category as string}:${cfg.priority as string}`,
        cfg.target_minutes as number,
      );
    }

    // Only evaluate completed requests — they have a definitive resolution time
    let onTime = 0;
    let breached = 0;

    for (const req of allRequests) {
      if (req.status !== "completed") continue;

      const key = `${req.category as string}:${req.priority as string}`;
      const targetMinutes = slaMap.get(key);

      // Fall back to eta_minutes on the request itself if no SLA config entry exists
      const effectiveTarget = targetMinutes ?? (req.eta_minutes as number | null) ?? null;
      if (effectiveTarget === null) continue;

      if (!req.created_at || !req.completed_at) continue;
      const resolutionMinutes =
        (new Date(req.completed_at as string).getTime() -
          new Date(req.created_at as string).getTime()) /
        60_000;

      if (resolutionMinutes <= effectiveTarget) {
        onTime++;
      } else {
        breached++;
      }
    }

    const total = onTime + breached;
    const percentage = total > 0 ? Math.round((onTime / total) * 100) : 0;

    return {
      success: true,
      data: {
        byStatus,
        byCategory,
        byPriority,
        dailyTrend,
        slaCompliance: { onTime, breached, percentage },
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getStaffPerformance
// ---------------------------------------------------------------------------

export async function getStaffPerformance(
  period?: "today" | "week" | "month",
): Promise<ActionResult<StaffPerformanceEntry[]>> {
  const parsedPeriod = periodSchema.safeParse(period);
  if (!parsedPeriod.success) {
    return { success: false, error: "Invalid period. Use 'today', 'week', or 'month'." };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const managerCheck = await isManagerRole(supabase, ctx.user!.id);
    if (!managerCheck) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;
    const periodStart = getPeriodStart(parsedPeriod.data);

    // ---- Fetch completed requests with assignment info ----
    const { data: completedRequests, error: reqErr } = await supabase
      .from("requests")
      .select("id, assigned_staff_id, created_at, completed_at")
      .eq("hotel_id", hotelId)
      .eq("status", "completed")
      .gte("created_at", periodStart)
      .not("assigned_staff_id", "is", null);

    if (reqErr) return { success: false, error: "Failed to load staff request data." };

    const allCompleted = completedRequests ?? [];

    // ---- Compute per-staff metrics ----
    const staffMetrics = new Map<
      string,
      { count: number; totalMinutes: number; resolvedCount: number }
    >();

    for (const req of allCompleted) {
      const staffId = req.assigned_staff_id as string;
      if (!staffMetrics.has(staffId)) {
        staffMetrics.set(staffId, { count: 0, totalMinutes: 0, resolvedCount: 0 });
      }
      const entry = staffMetrics.get(staffId)!;
      entry.count++;

      if (req.created_at && req.completed_at) {
        const diffMinutes =
          (new Date(req.completed_at as string).getTime() -
            new Date(req.created_at as string).getTime()) /
          60_000;
        if (diffMinutes >= 0) {
          entry.totalMinutes += diffMinutes;
          entry.resolvedCount++;
        }
      }
    }

    if (staffMetrics.size === 0) {
      return { success: true, data: [] };
    }

    const staffIds = Array.from(staffMetrics.keys());

    // ---- Fetch profiles ----
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    if (profileErr) return { success: false, error: "Failed to load staff profiles." };

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "Staff Member"]),
    );

    // ---- Fetch departments ----
    const { data: assignments, error: assignErr } = await supabase
      .from("staff_assignments")
      .select("user_id, department")
      .eq("hotel_id", hotelId)
      .in("user_id", staffIds);

    if (assignErr) return { success: false, error: "Failed to load staff assignments." };

    const deptMap = new Map(
      (assignments ?? []).map((a) => [a.user_id as string, (a.department as string) ?? ""]),
    );

    // ---- Fetch per-staff ratings in period ----
    // ratings table doesn't have staff_id — ratings are hotel-level, so we attribute the
    // hotel average to each staff member as a neutral default.
    // Individual staff rating is not directly supported by the schema; use hotel avg.
    const { data: ratingsData, error: ratingsErr } = await supabase
      .from("ratings")
      .select("rating")
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart);

    if (ratingsErr) return { success: false, error: "Failed to load ratings." };

    const hotelAvgRating =
      ratingsData && ratingsData.length > 0
        ? Math.round(
            (ratingsData.reduce((sum, r) => sum + ((r.rating as number) ?? 0), 0) /
              ratingsData.length) *
              10,
          ) / 10
        : 0;

    // ---- Assemble result ----
    const result: StaffPerformanceEntry[] = [];

    for (const [staffId, metrics] of staffMetrics.entries()) {
      result.push({
        staffId,
        name: profileMap.get(staffId) ?? "Staff Member",
        department: deptMap.get(staffId) ?? "",
        requestsHandled: metrics.count,
        avgResolutionMinutes:
          metrics.resolvedCount > 0
            ? Math.round(metrics.totalMinutes / metrics.resolvedCount)
            : 0,
        rating: hotelAvgRating,
      });
    }

    // Sort by requestsHandled descending
    result.sort((a, b) => b.requestsHandled - a.requestsHandled);

    return { success: true, data: result };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getRevenueAnalytics
// ---------------------------------------------------------------------------

export async function getRevenueAnalytics(
  period?: "today" | "week" | "month",
): Promise<ActionResult<RevenueAnalytics>> {
  const parsedPeriod = periodSchema.safeParse(period);
  if (!parsedPeriod.success) {
    return { success: false, error: "Invalid period. Use 'today', 'week', or 'month'." };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveStaffContext(supabase);
    if (ctx.error) return { success: false, error: ctx.error };

    const managerCheck = await isManagerRole(supabase, ctx.user!.id);
    if (!managerCheck) return { success: false, error: "Unauthorized" };

    const hotelId = ctx.assignment!.hotel_id;
    const periodStart = getPeriodStart(parsedPeriod.data);

    // ---- Fetch orders in period (exclude cancelled) ----
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id, total, created_at")
      .eq("hotel_id", hotelId)
      .gte("created_at", periodStart)
      .neq("status", "cancelled");

    if (ordersErr) return { success: false, error: "Failed to load order data." };

    const allOrders = orders ?? [];

    // ---- Aggregate totals ----
    const orderCount = allOrders.length;
    const totalRevenue =
      orderCount > 0
        ? Math.round(
            allOrders.reduce((sum, o) => sum + ((o.total as number) ?? 0), 0) * 100,
          ) / 100
        : 0;
    const avgOrderValue =
      orderCount > 0 ? Math.round((totalRevenue / orderCount) * 100) / 100 : 0;

    // ---- Daily revenue ----
    const dailyMap = new Map<string, number>();
    for (const order of allOrders) {
      const day = (order.created_at as string).slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + ((order.total as number) ?? 0));
    }
    const allDates = buildDateRange(periodStart);
    const dailyRevenue = allDates.map((date) => ({
      date,
      revenue: Math.round((dailyMap.get(date) ?? 0) * 100) / 100,
    }));

    // ---- Top items ----
    if (orderCount === 0) {
      return {
        success: true,
        data: {
          totalRevenue,
          orderCount,
          avgOrderValue,
          dailyRevenue,
          topItems: [],
        },
      };
    }

    const orderIds = allOrders.map((o) => o.id as string);

    // Fetch order_items with joined menu_items name and price
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("menu_item_id, quantity, unit_price, menu_items(name)")
      .in("order_id", orderIds);

    if (itemsErr) return { success: false, error: "Failed to load order item data." };

    // Aggregate by menu_item_id
    const itemAgg = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    for (const item of orderItems ?? []) {
      const menuItemId = item.menu_item_id as string;
      const qty = (item.quantity as number) ?? 0;
      const price = (item.unit_price as number) ?? 0;
      // Supabase returns nested relation as object or array
      const menuItem = item.menu_items as { name?: string } | null;
      const name = menuItem?.name ?? "Unknown item";

      if (!itemAgg.has(menuItemId)) {
        itemAgg.set(menuItemId, { name, quantity: 0, revenue: 0 });
      }
      const agg = itemAgg.get(menuItemId)!;
      agg.quantity += qty;
      agg.revenue = Math.round((agg.revenue + qty * price) * 100) / 100;
    }

    const topItems = Array.from(itemAgg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      success: true,
      data: {
        totalRevenue,
        orderCount,
        avgOrderValue,
        dailyRevenue,
        topItems,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}
