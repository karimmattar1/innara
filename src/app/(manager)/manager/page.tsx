"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Star,
  Users,
  Clock,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { MetricCard } from "@/components/innara/MetricCard";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { PriorityBadge } from "@/components/innara/PriorityBadge";
import { EmptyState } from "@/components/innara/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { createClient } from "@/lib/supabase/client";
import { getDashboardStats, type DashboardStats } from "@/app/actions/analytics";
import { getStaffRequests } from "@/app/actions/staff";
import { CATEGORY_LABELS } from "@/constants/app";
import { getTimeAgo } from "@/lib/utils";
import type { RequestStatus, RequestPriority } from "@/constants/app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestRow {
  id: string;
  category: string;
  item: string;
  room_number: string;
  priority: string;
  status: string;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  requests: RequestRow[];
}

// ---------------------------------------------------------------------------
// Manager Dashboard
// ---------------------------------------------------------------------------

export default function ManagerDashboard(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [statsResult, requestsResult] = await Promise.all([
      getDashboardStats(period),
      getStaffRequests({ pageSize: 5 }),
    ]);

    if (!statsResult.success || !statsResult.data) {
      setError(statsResult.error ?? "Failed to load dashboard.");
      setLoading(false);
      return;
    }

    if (!requestsResult.success || !requestsResult.data) {
      setError(requestsResult.error ?? "Failed to load requests.");
      setLoading(false);
      return;
    }

    setData({
      stats: statsResult.data,
      requests: requestsResult.data.requests as RequestRow[],
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
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#9B7340]" />
            <p className="text-sm text-muted-foreground">Loading dashboard…</p>
          </div>
        </PageContainer>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error || !data) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <p className="text-base font-medium mb-2">Unable to load dashboard</p>
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

  const { stats, requests } = data;

  const revenueFormatted = stats.revenueTotal.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Manager Dashboard"
          subtitle="Operations overview and analytics"
          action={
            <button
              onClick={() => void loadData()}
              aria-label="Refresh dashboard"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Period selector                                                      */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-6">
          <Tabs
            value={period}
            onValueChange={(value) =>
              setPeriod(value as "today" | "week" | "month")
            }
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* KPI metric cards                                                    */}
        {/* ------------------------------------------------------------------ */}
        <AnimatedGroup preset="slide" className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title="Total Requests"
            value={stats.totalRequests}
            icon={ClipboardList}
            variant="requests"
          />
          <MetricCard
            title="Completed"
            value={stats.completedRequests}
            icon={CheckCircle2}
            variant="requests"
          />
          <MetricCard
            title="Avg Guest Rating"
            value={`${stats.averageRating.toFixed(1)} / 5`}
            icon={Star}
            variant="happiness"
          />
          <MetricCard
            title="Active Guests"
            value={stats.activeGuests}
            icon={Users}
            variant="guests"
          />
          <MetricCard
            title="Avg Resolution"
            value={`${stats.avgResolutionMinutes}m`}
            icon={Clock}
            variant="time"
          />
          <MetricCard
            title="Revenue"
            value={revenueFormatted}
            icon={DollarSign}
            variant="revenue"
          />
        </AnimatedGroup>

        {/* ------------------------------------------------------------------ */}
        {/* Main content: recent requests + quick actions                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent requests table */}
          <section
            aria-labelledby="recent-requests-heading"
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                id="recent-requests-heading"
                className="text-base font-semibold"
              >
                Recent Requests
              </h2>
              <button
                onClick={() => router.push("/manager/requests")}
                className="text-sm text-[#9B7340] hover:text-[#b8924f] transition-colors flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="glass-card-dark rounded-2xl">
                <EmptyState
                  iconName="clipboard"
                  title="No requests yet"
                  description="When guests submit requests they will appear here."
                  size="md"
                />
              </div>
            ) : (
              <div className="glass-card-dark rounded-2xl overflow-hidden">
                <ul role="list" className="divide-y divide-white/5">
                  {requests.map((request) => (
                    <RecentRequestRow key={request.id} request={request} />
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section aria-labelledby="quick-actions-heading">
            <h2
              id="quick-actions-heading"
              className="text-base font-semibold mb-3"
            >
              Quick Actions
            </h2>
            <div className="glass-card-dark relative rounded-2xl p-4 flex flex-col gap-3">
              <BorderBeam size={140} duration={16} delay={3} />
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/manager/requests")}
              >
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  View All Requests
                </span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/manager/staff")}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Staff
                </span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push("/manager/analytics")}
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Analytics
                </span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </Button>
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// RecentRequestRow
// ---------------------------------------------------------------------------

interface RecentRequestRowProps {
  request: RequestRow;
}

function RecentRequestRow({ request }: RecentRequestRowProps): React.ReactElement {
  const categoryLabel =
    CATEGORY_LABELS[request.category as keyof typeof CATEGORY_LABELS] ??
    request.category;

  return (
    <li className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Room + category */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">
            Room {request.room_number}
          </span>
          <span className="text-xs text-muted-foreground">{categoryLabel}</span>
        </div>

        {/* Item name */}
        <p className="text-sm font-medium leading-snug truncate max-w-xs sm:max-w-sm">
          {request.item}
        </p>

        {/* Time ago */}
        <p className="text-xs text-muted-foreground">
          {getTimeAgo(request.created_at)}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <PriorityBadge priority={request.priority as RequestPriority} />
        <StatusBadge status={request.status as RequestStatus} size="sm" />
      </div>
    </li>
  );
}
