"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  ClipboardList,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { StaffHeader } from "@/components/innara/StaffHeader";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  getStaffAnalytics,
  type StaffAnalyticsData,
} from "@/app/actions/staff-analytics";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, CATEGORY_COLORS, DEPARTMENT_LABELS, STATUS_CONFIG } from "@/constants/app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = "today" | "week" | "month";

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

const peakHoursChartConfig: ChartConfig = {
  count: { label: "Requests", color: "#9B7340" },
};

const resolutionBucketsChartConfig: ChartConfig = {
  value: { label: "Count", color: "#9B7340" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12a";
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return "12p";
  return `${hour - 12}p`;
}

function slaColor(percentage: number): string {
  return percentage >= 80 ? "#7aaa8a" : percentage >= 60 ? "#c4a06a" : "#a35060";
}

function formatChangeSign(change: number): string {
  return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
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
      <div className="space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card-dark rounded-2xl p-5">
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-10 w-20 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        {/* Panel row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card-dark rounded-2xl p-6">
              <Skeleton className="h-5 w-36 mb-4" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ))}
        </div>
        {/* Panel row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card-dark rounded-2xl p-6">
              <Skeleton className="h-5 w-36 mb-4" />
              <Skeleton className="h-[240px] w-full" />
            </div>
          ))}
        </div>
        {/* Team recognition */}
        <div className="glass-card-dark rounded-2xl p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  iconColor?: string;
  change?: number;
  changeLabel?: string;
  subtext?: string;
}

function KpiCard({
  icon: Icon,
  title,
  value,
  iconColor = "text-[#9B7340]",
  change,
  changeLabel,
  subtext,
}: KpiCardProps): React.ReactElement {
  const showChange = change !== undefined && change !== 0;
  const changePositive = change !== undefined && change >= 0;

  return (
    <div className="glass-card-dark rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums leading-tight">{value}</p>
        {showChange && (
          <p
            className={`text-xs font-medium mt-1 ${changePositive ? "text-[#7aaa8a]" : "text-[#a35060]"}`}
          >
            {changePositive ? "↗" : "↘"} {formatChangeSign(change!)}
            {changeLabel} {subtext ?? ""}
          </p>
        )}
        {!showChange && subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskBreakdownPanel (§7.1)
// ---------------------------------------------------------------------------

interface TaskBreakdownPanelProps {
  categoryBreakdown: Array<{ category: string; count: number }>;
}

function TaskBreakdownPanel({ categoryBreakdown }: TaskBreakdownPanelProps): React.ReactElement {
  const maxCount = categoryBreakdown.length > 0 ? categoryBreakdown[0].count : 1;
  const hasData = categoryBreakdown.some((entry) => entry.count > 0);

  return (
    <div
      className="glass-card-dark rounded-2xl p-5 flex flex-col h-full"
      aria-labelledby="task-breakdown-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[#9B7340]" aria-hidden="true" />
        <h3 id="task-breakdown-heading" className="text-sm font-semibold">
          Task Breakdown
        </h3>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
          <BarChart3 className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No requests in this window</p>
        </div>
      ) : (
        <ul role="list" className="flex flex-col gap-3">
          {categoryBreakdown.map(({ category, count }) => {
            const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
            const colors = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
            const widthPct = Math.round((count / maxCount) * 100);

            return (
              <li key={category} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 flex-shrink-0 truncate">
                  {label}
                </span>
                <div
                  className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden"
                  role="presentation"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${colors?.bg ?? "bg-[#9B7340]/30"}`}
                    style={{ width: `${widthPct}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums w-8 text-right flex-shrink-0 ${colors?.text ?? "text-[#9B7340]"}`}
                >
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkloadOverviewPanel (§7.2)
// ---------------------------------------------------------------------------

interface WorkloadOverviewPanelProps {
  kpis: StaffAnalyticsData["kpis"];
  statusCounts: StaffAnalyticsData["statusCounts"];
}

const WORKLOAD_STATUSES: Array<keyof typeof STATUS_CONFIG> = [
  "new",
  "pending",
  "in_progress",
  "completed",
];

function WorkloadOverviewPanel({ kpis, statusCounts }: WorkloadOverviewPanelProps): React.ReactElement {
  const completionPct = kpis.completionRatePct;
  const barColor = slaColor(completionPct);

  return (
    <div
      className="glass-card-dark rounded-2xl p-5 flex flex-col h-full"
      aria-labelledby="workload-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-[#9B7340]" aria-hidden="true" />
        <h3 id="workload-heading" className="text-sm font-semibold">
          Workload Overview
        </h3>
      </div>

      {/* Completion rate big number + progress bar */}
      <div className="mb-5">
        <p
          className="text-4xl font-bold tabular-nums mb-1"
          style={{ color: barColor }}
        >
          {completionPct}%
        </p>
        <p className="text-xs text-muted-foreground mb-3">Completion rate</p>
        <div
          role="progressbar"
          aria-valuenow={completionPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Completion rate: ${completionPct}%`}
          className="w-full h-3 rounded-full bg-white/10 overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionPct}%`,
              background: barColor,
            }}
          />
        </div>
      </div>

      {/* Status distribution */}
      <ul role="list" className="flex flex-col gap-2">
        {WORKLOAD_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          const count = statusCounts[status] ?? 0;
          return (
            <li
              key={status}
              className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cfg.dotColor }}
                  aria-hidden="true"
                />
                <span className="text-sm">{cfg.label}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SlaCompliancePanel (§7, copied from manager pattern)
// ---------------------------------------------------------------------------

interface SlaCompliancePanelProps {
  data: StaffAnalyticsData["slaCompliance"];
}

function SlaCompliancePanel({ data }: SlaCompliancePanelProps): React.ReactElement {
  const { onTime, breached, pct } = data;
  const total = onTime + breached;

  return (
    <div
      className="glass-card-dark rounded-2xl p-5 flex flex-col h-full"
      aria-labelledby="sla-compliance-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-[#9B7340]" aria-hidden="true" />
        <h3 id="sla-compliance-heading" className="text-sm font-semibold">
          SLA Compliance
        </h3>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
          <ShieldCheck className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No completed requests yet</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-5">
          {/* Big percentage */}
          <div className="text-center">
            <p
              className="text-5xl font-bold tabular-nums"
              style={{ color: slaColor(pct) }}
            >
              {pct}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">On-time resolution</p>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`SLA compliance: ${pct}%`}
            className="w-full h-3 rounded-full bg-white/10 overflow-hidden"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: slaColor(pct),
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
// PeakHoursPanel (§7.3)
// ---------------------------------------------------------------------------

interface PeakHoursPanelProps {
  data: StaffAnalyticsData["peakHours"];
}

function PeakHoursPanel({ data }: PeakHoursPanelProps): React.ReactElement {
  const allZero = data.every((d) => d.count === 0);

  // Show every 3rd hour tick label
  const chartData = data.map((d) => ({
    ...d,
    label: d.hour % 3 === 0 ? formatHourLabel(d.hour) : "",
  }));

  return (
    <div
      className="glass-card-dark rounded-2xl p-5 flex flex-col h-full"
      aria-labelledby="peak-hours-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#9B7340]" aria-hidden="true" />
        <h3 id="peak-hours-heading" className="text-sm font-semibold">
          Peak Hours
        </h3>
      </div>

      {allZero ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
          <TrendingUp className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No request data for this period</p>
        </div>
      ) : (
        <div
          role="img"
          aria-label="Peak hours bar chart showing request volume by hour of day"
        >
          <ChartContainer config={peakHoursChartConfig} className="h-[240px] w-full">
            <BarChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => [
                      `${item.payload.hour}:00 — ${value as number} requests`,
                      "",
                    ]}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[3, 3, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResolutionBucketsPanel (§7.4)
// ---------------------------------------------------------------------------

interface ResolutionBucketsPanelProps {
  data: StaffAnalyticsData["resolutionBuckets"];
}

const BUCKET_CONFIG = [
  { key: "fast" as const, label: "Fast", color: "#7aaa8a", threshold: "< 15m" },
  { key: "normal" as const, label: "Normal", color: "#9B7340", threshold: "15–30m" },
  { key: "slow" as const, label: "Slow", color: "#c4a06a", threshold: "30–60m" },
  { key: "critical" as const, label: "Critical", color: "#a35060", threshold: "> 60m" },
] as const;

function ResolutionBucketsPanel({ data }: ResolutionBucketsPanelProps): React.ReactElement {
  const total = data.fast + data.normal + data.slow + data.critical;
  const allZero = total === 0;

  const chartData = BUCKET_CONFIG.map((cfg) => ({
    name: cfg.label,
    value: data[cfg.key],
    fill: cfg.color,
  }));

  return (
    <div
      className="glass-card-dark rounded-2xl p-5 flex flex-col h-full"
      aria-labelledby="resolution-buckets-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#9B7340]" aria-hidden="true" />
        <h3 id="resolution-buckets-heading" className="text-sm font-semibold">
          Resolution Time
        </h3>
      </div>

      {allZero ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-8">
          <Clock className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No completed requests in this window</p>
        </div>
      ) : (
        <>
          <div
            role="img"
            aria-label="Resolution time distribution bar chart"
          >
            <ChartContainer config={resolutionBucketsChartConfig} className="h-[200px] w-full">
              <BarChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  fill="#9B7340"
                  // Each bar has its own fill set via cell
                  isAnimationActive={true}
                >
                  {chartData.map((entry) => (
                    <rect key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {BUCKET_CONFIG.map((cfg) => {
              const count = data[cfg.key];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cfg.key} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground">
                    {cfg.label} ({cfg.threshold}): {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TeamRecognitionPanel (§7.5 — Mode A only per plan)
// ---------------------------------------------------------------------------

interface TeamRecognitionPanelProps {
  data: StaffAnalyticsData["topStaff"];
}

const RANK_STYLES = [
  { label: "#1", color: "#9B7340", bg: "bg-[#9B7340]/20 border-[#9B7340]/30" },
  { label: "#2", color: "#9ca3af", bg: "bg-[#9ca3af]/20 border-[#9ca3af]/30" },
  { label: "#3", color: "#a06a4a", bg: "bg-[#a06a4a]/20 border-[#a06a4a]/30" },
] as const;

function TeamRecognitionPanel({ data }: TeamRecognitionPanelProps): React.ReactElement {
  const isEmpty = data.length === 0;

  return (
    <div
      className="glass-card-dark rounded-2xl p-5"
      aria-labelledby="team-recognition-heading"
    >
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-4 h-4 text-[#9B7340]" aria-hidden="true" />
        <h3 id="team-recognition-heading" className="text-sm font-semibold">
          Team Recognition
        </h3>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Not enough data yet to recognize top performers
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((index) => {
            const staff = data[index];
            const rankStyle = RANK_STYLES[index];

            if (!staff) {
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col items-center justify-center text-center gap-2"
                >
                  <p className="text-xs text-muted-foreground font-semibold">
                    {rankStyle.label}
                  </p>
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </div>
              );
            }

            const initials = staff.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const avgMin = Math.round(staff.avgResolutionMinutes);

            return (
              <div
                key={staff.staffId}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col items-center text-center gap-3"
              >
                {/* Rank badge */}
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ${rankStyle.bg}`}
                  style={{ color: rankStyle.color }}
                >
                  {rankStyle.label}
                </span>

                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "#9B7340" }}
                  aria-hidden="true"
                >
                  {initials}
                </div>

                {/* Name */}
                <p className="text-sm font-semibold leading-tight">{staff.name}</p>

                {/* Stats */}
                <p className="text-xs text-muted-foreground">
                  {staff.requestsHandled} requests
                  {avgMin > 0 ? ` · ${avgMin}m avg` : ""}
                </p>

                {/* Rating */}
                {staff.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[#9B7340] text-sm" aria-hidden="true">★</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {staff.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StaffAnalyticsPage(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<StaffAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("week");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getStaffAnalytics(period);

    if (!result.success || !result.data) {
      setError(result.error ?? "Failed to load analytics.");
      setLoading(false);
      return;
    }

    setData(result.data);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    void loadData(); // eslint-disable-line react-hooks/set-state-in-effect
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
        <StaffHeader onSignOut={() => void handleSignOut()} />
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
        <StaffHeader onSignOut={() => void handleSignOut()} />
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
                aria-label="Retry loading analytics"
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

  const { kpis, slaCompliance, peakHours, resolutionBuckets, topStaff, totalRequestsThisPeriod, statusCounts, categoryBreakdown } = data;

  const departmentLabel =
    DEPARTMENT_LABELS[data.department ?? ""] ?? data.department ?? "All Departments";

  const slaChange = kpis.slaCompliancePct - kpis.slaCompliancePrevPct;
  const completionChange = kpis.completionRatePct - kpis.completionRatePrevPct;

  // -------------------------------------------------------------------------
  // Top-level empty state (no requests in period)
  // -------------------------------------------------------------------------

  if (totalRequestsThisPeriod === 0) {
    return (
      <>
        <StaffHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <PageHeader
            title="Analytics"
            subtitle={`Department-level insights · ${departmentLabel}`}
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

          <div className="glass-card-dark rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground/40 mb-4" aria-hidden="true" />
            <p className="text-base font-medium mb-1">No analytics data yet</p>
            <p className="text-sm text-muted-foreground">
              Analytics will appear once your department starts receiving and handling requests.
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <StaffHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Analytics"
          subtitle={`Department-level insights · ${departmentLabel}`}
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
          {/* KPI Row                                                            */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="kpis-heading">
            <h2 id="kpis-heading" className="sr-only">
              Key metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={ClipboardList}
                title="Open Requests"
                value={kpis.openRequests}
                iconColor="text-[#7e9ab8]"
              />
              <KpiCard
                icon={ShieldCheck}
                title="SLA Compliance"
                value={`${kpis.slaCompliancePct}%`}
                change={kpis.slaCompliancePrevPct > 0 ? slaChange : undefined}
                changeLabel="%"
                subtext="vs previous period"
              />
              <KpiCard
                icon={Clock}
                title="Avg Resolution"
                value={
                  kpis.avgResolutionMinutes > 0
                    ? kpis.avgResolutionMinutes < 1
                      ? `${Math.round(kpis.avgResolutionMinutes * 60)}s`
                      : `${Math.round(kpis.avgResolutionMinutes)}m`
                    : "—"
                }
                iconColor="text-[#c4a06a]"
              />
              <KpiCard
                icon={CheckCircle2}
                title="Completion Rate"
                value={`${kpis.completionRatePct}%`}
                iconColor="text-[#7aaa8a]"
                change={kpis.completionRatePrevPct > 0 ? completionChange : undefined}
                changeLabel="%"
                subtext="vs previous period"
              />
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Row 1: Task Breakdown (full-width, by category)                   */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="task-breakdown-section-heading">
            <h2 id="task-breakdown-section-heading" className="sr-only">
              Task breakdown by category
            </h2>
            <TaskBreakdownPanel categoryBreakdown={categoryBreakdown} />
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Row 2: Workload Overview + SLA Compliance                          */}
          {/* ---------------------------------------------------------------- */}
          <section
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            aria-labelledby="workload-row-heading"
          >
            <h2 id="workload-row-heading" className="sr-only">
              Workload overview and SLA compliance
            </h2>
            <WorkloadOverviewPanel kpis={kpis} statusCounts={statusCounts} />
            <SlaCompliancePanel data={slaCompliance} />
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Row 2: Peak Hours + Resolution Buckets                            */}
          {/* ---------------------------------------------------------------- */}
          <section
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            aria-labelledby="timing-row-heading"
          >
            <h2 id="timing-row-heading" className="sr-only">
              Peak hours and resolution time breakdown
            </h2>
            <PeakHoursPanel data={peakHours} />
            <ResolutionBucketsPanel data={resolutionBuckets} />
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Team Recognition (full-width)                                     */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="team-recognition-section-heading">
            <h2 id="team-recognition-section-heading" className="sr-only">
              Team recognition
            </h2>
            <TeamRecognitionPanel data={topStaff} />
          </section>
        </div>
      </PageContainer>
    </>
  );
}
