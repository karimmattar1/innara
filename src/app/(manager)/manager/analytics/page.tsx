"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  ShieldCheck,
  Package,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  getRequestAnalytics,
  getStaffPerformance,
  getRevenueAnalytics,
  type RequestAnalytics,
  type StaffPerformanceEntry,
  type RevenueAnalytics,
} from "@/app/actions/analytics";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, DEPARTMENT_LABELS, STATUS_CONFIG } from "@/constants/app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = "today" | "week" | "month";

interface AnalyticsData {
  requestAnalytics: RequestAnalytics;
  staffPerformance: StaffPerformanceEntry[];
  revenueAnalytics: RevenueAnalytics;
}

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

const requestTrendConfig: ChartConfig = {
  count: { label: "Requests", color: "#9B7340" },
};

const statusChartConfig: ChartConfig = {
  value: { label: "Count", color: "#9B7340" },
};

const categoryChartConfig: ChartConfig = {
  value: { label: "Count", color: "#7e9ab8" },
};

const revenueChartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#9B7340" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function AnalyticsSkeleton(): React.ReactElement {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-72 mb-8" />
      {/* Section skeletons */}
      <div className="space-y-8">
        <div className="glass-card-dark rounded-2xl p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card-dark rounded-2xl p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-[220px] w-full" />
            </div>
          ))}
        </div>
        <div className="glass-card-dark rounded-2xl p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="glass-card-dark rounded-2xl p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[280px] w-full mb-6" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// SLA Compliance Card
// ---------------------------------------------------------------------------

interface SlaComplianceCardProps {
  slaCompliance: RequestAnalytics["slaCompliance"];
}

function SlaComplianceCard({ slaCompliance }: SlaComplianceCardProps): React.ReactElement {
  const { onTime, breached, percentage } = slaCompliance;
  const total = onTime + breached;

  return (
    <div className="glass-card-dark rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-[#9B7340]" />
        <h3 className="text-sm font-semibold">SLA Compliance</h3>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
          <ShieldCheck className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No completed requests yet</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-5">
          {/* Big percentage */}
          <div className="text-center">
            <p
              className="text-5xl font-bold tabular-nums"
              style={{ color: percentage >= 80 ? "#7aaa8a" : percentage >= 60 ? "#c4a06a" : "#a35060" }}
            >
              {percentage}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">On-time resolution</p>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`SLA compliance: ${percentage}%`}
            className="w-full h-3 rounded-full bg-white/10 overflow-hidden"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                background: percentage >= 80 ? "#7aaa8a" : percentage >= 60 ? "#c4a06a" : "#a35060",
              }}
            />
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-white/5 text-center">
              <p className="text-lg font-semibold text-[#7aaa8a]">{onTime}</p>
              <p className="text-xs text-muted-foreground mt-0.5">On Time</p>
            </div>
            <div className="rounded-xl p-3 bg-white/5 text-center">
              <p className="text-lg font-semibold text-[#a35060]">{breached}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Breached</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Summary Card
// ---------------------------------------------------------------------------

interface RevenueSummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function RevenueSummaryCard({ icon: Icon, label, value }: RevenueSummaryCardProps): React.ReactElement {
  return (
    <div className="glass-card-dark rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-4 h-4 text-[#9B7340]" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ManagerAnalyticsPage(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("week");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [requestResult, staffResult, revenueResult] = await Promise.all([
      getRequestAnalytics(period),
      getStaffPerformance(period),
      getRevenueAnalytics(period),
    ]);

    if (!requestResult.success || !requestResult.data) {
      setError(requestResult.error ?? "Failed to load request analytics.");
      setLoading(false);
      return;
    }

    if (!staffResult.success || !staffResult.data) {
      setError(staffResult.error ?? "Failed to load staff performance.");
      setLoading(false);
      return;
    }

    if (!revenueResult.success || !revenueResult.data) {
      setError(revenueResult.error ?? "Failed to load revenue analytics.");
      setLoading(false);
      return;
    }

    setData({
      requestAnalytics: requestResult.data,
      staffPerformance: staffResult.data,
      revenueAnalytics: revenueResult.data,
    });
    setLoading(false);
  }, [period]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <AnalyticsSkeleton />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Error
  // -------------------------------------------------------------------------

  if (error || !data) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-base font-medium mb-2">Unable to load analytics</p>
              <p className="text-sm text-muted-foreground mb-6">
                {error ?? "Something went wrong. Please try again."}
              </p>
              <button
                onClick={() => void loadData()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9B7340] text-white text-sm font-medium hover:bg-[#b8924f] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  const { requestAnalytics, staffPerformance, revenueAnalytics } = data;

  // Convert Records to chart-compatible arrays
  const statusChartData = Object.entries(requestAnalytics.byStatus).map(
    ([key, value]) => ({
      name: STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]?.label ?? key,
      value,
    })
  );

  const categoryChartData = Object.entries(requestAnalytics.byCategory).map(
    ([key, value]) => ({
      name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] ?? key,
      value,
    })
  );

  // Format dates for chart display
  const dailyTrendData = requestAnalytics.dailyTrend.map((point) => ({
    ...point,
    date: formatDate(point.date),
  }));

  const dailyRevenueData = revenueAnalytics.dailyRevenue.map((point) => ({
    ...point,
    date: formatDate(point.date),
  }));

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Analytics"
          subtitle="Request trends, staff performance, and revenue insights"
          action={
            <button
              onClick={() => void loadData()}
              aria-label="Refresh analytics"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Period selector                                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-8">
          <Tabs
            value={period}
            onValueChange={(value) => setPeriod(value as Period)}
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-8">
          {/* ---------------------------------------------------------------- */}
          {/* Section 1: Request Trends                                         */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="request-trends-heading">
            <div className="glass-card-dark rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-[#9B7340]" />
                <h2 id="request-trends-heading" className="text-sm font-semibold">
                  Request Trends
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  Daily request volume
                </span>
              </div>

              {dailyTrendData.length === 0 || dailyTrendData.every((d) => d.count === 0) ? (
                <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No request data for this period</p>
                </div>
              ) : (
                <ChartContainer config={requestTrendConfig} className="h-[300px] w-full">
                  <LineChart data={dailyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-count)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Section 2: Request Breakdown                                      */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="request-breakdown-heading">
            <h2 id="request-breakdown-heading" className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#9B7340]" />
              Request Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* By Status */}
              <div className="glass-card-dark rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  By Status
                </h3>
                {statusChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-center">
                    <p className="text-sm text-muted-foreground">No data</p>
                  </div>
                ) : (
                  <ChartContainer config={statusChartConfig} className="h-[220px] w-full">
                    <BarChart
                      data={statusChartData}
                      layout="vertical"
                      margin={{ left: 8, right: 16, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={72}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="value"
                        fill="var(--color-value)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={20}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* By Category */}
              <div className="glass-card-dark rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  By Category
                </h3>
                {categoryChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-center">
                    <p className="text-sm text-muted-foreground">No data</p>
                  </div>
                ) : (
                  <ChartContainer config={categoryChartConfig} className="h-[220px] w-full">
                    <BarChart
                      data={categoryChartData}
                      margin={{ left: 0, right: 8, top: 0, bottom: 24 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="value"
                        fill="var(--color-value)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* SLA Compliance */}
              <SlaComplianceCard slaCompliance={requestAnalytics.slaCompliance} />
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Section 3: Staff Performance                                      */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="staff-performance-heading">
            <div className="glass-card-dark rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9B7340]" />
                <h2 id="staff-performance-heading" className="text-sm font-semibold">
                  Staff Performance
                </h2>
              </div>

              {staffPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No staff performance data for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Staff performance table">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Staff Member
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell"
                        >
                          Department
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Requests
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell"
                        >
                          Avg Resolution
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {staffPerformance.map((entry) => (
                        <StaffPerformanceRow key={entry.staffId} entry={entry} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Section 4: Revenue                                                */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="revenue-heading">
            <div className="glass-card-dark rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-4 h-4 text-[#9B7340]" />
                <h2 id="revenue-heading" className="text-sm font-semibold">
                  Revenue
                </h2>
              </div>

              {/* Area chart */}
              {dailyRevenueData.length === 0 || dailyRevenueData.every((d) => d.revenue === 0) ? (
                <div className="flex flex-col items-center justify-center h-[280px] gap-3 text-center">
                  <DollarSign className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No revenue data for this period</p>
                </div>
              ) : (
                <ChartContainer config={revenueChartConfig} className="h-[280px] w-full mb-6">
                  <AreaChart data={dailyRevenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9B7340" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9B7340" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ChartContainer>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <RevenueSummaryCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={formatCurrency(revenueAnalytics.totalRevenue)}
                />
                <RevenueSummaryCard
                  icon={Package}
                  label="Order Count"
                  value={revenueAnalytics.orderCount.toLocaleString()}
                />
                <RevenueSummaryCard
                  icon={TrendingUp}
                  label="Avg Order Value"
                  value={formatCurrency(revenueAnalytics.avgOrderValue)}
                />
              </div>

              {/* Top items */}
              {revenueAnalytics.topItems.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Top Items
                  </h3>
                  <ul role="list" className="space-y-2">
                    {revenueAnalytics.topItems.map((item, index) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground w-5 text-right flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            x{item.quantity}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-[#9B7340] ml-4 flex-shrink-0 tabular-nums">
                          {formatCurrency(item.revenue)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// StaffPerformanceRow
// ---------------------------------------------------------------------------

interface StaffPerformanceRowProps {
  entry: StaffPerformanceEntry;
}

function StaffPerformanceRow({ entry }: StaffPerformanceRowProps): React.ReactElement {
  const deptLabel = DEPARTMENT_LABELS[entry.department] ?? entry.department;

  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      {/* Name */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
            style={{ background: "#9B7340", color: "#fff" }}
            aria-hidden="true"
          >
            {entry.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span className="font-medium">{entry.name}</span>
        </div>
      </td>

      {/* Department */}
      <td className="px-6 py-4 hidden sm:table-cell">
        <span className="text-sm text-muted-foreground">{deptLabel || "—"}</span>
      </td>

      {/* Requests handled */}
      <td className="px-6 py-4 text-right">
        <span className="font-semibold tabular-nums">{entry.requestsHandled}</span>
      </td>

      {/* Avg resolution */}
      <td className="px-6 py-4 text-right hidden md:table-cell">
        <div className="flex items-center justify-end gap-1">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="tabular-nums">
            {entry.avgResolutionMinutes > 0 ? `${entry.avgResolutionMinutes}m` : "—"}
          </span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-6 py-4 text-right">
        {entry.rating > 0 ? (
          <div className="inline-flex items-center gap-1">
            <Star className="w-3 h-3 text-[#9B7340] fill-[#9B7340]" />
            <span className="tabular-nums text-sm">{entry.rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
    </tr>
  );
}
