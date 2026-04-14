"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Users,
  Clock,
  ChevronRight,
  CalendarDays,
  LogIn,
} from "lucide-react";
import { StaffHeader } from "@/components/innara/StaffHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { getStaffProfile, getStaffRequests } from "@/app/actions/staff";
import { getTodayShift, getActiveStaffOnShift } from "@/app/actions/shifts";
import { claimRequest } from "@/app/actions/claim-request";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_CONFIG,
  CATEGORY_LABELS,
  PRIORITY_CONFIG,
  DEPARTMENT_LABELS,
  CATEGORY_COLORS,
} from "@/constants/app";
import { getTimeAgo, getInitials } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGroup } from "@/components/ui/animated-group";
import type { ShiftData, ActiveStaffMember } from "@/app/actions/shifts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  hotelId: string;
  isActive: boolean;
  avatarUrl: string | null;
}

interface RequestRow {
  id: string;
  category: string;
  item: string;
  description: string;
  room_number: string;
  priority: string;
  status: string;
  assigned_staff_id: string | null;
  eta_minutes: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

interface DashboardData {
  profile: StaffProfile;
  requests: RequestRow[];
  totalRequests: number;
  todayShift: ShiftData | null;
  activeStaff: ActiveStaffMember[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function durationOnShift(checkInAt: string): string {
  const diffMs = Date.now() - new Date(checkInAt).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatShiftTime(time: string): string {
  // time is HH:MM:SS or HH:MM
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function StaffDashboard(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [profileResult, requestsResult, shiftResult, activeStaffResult] =
      await Promise.all([
        getStaffProfile(),
        getStaffRequests({ pageSize: 5 }),
        getTodayShift(),
        getActiveStaffOnShift(),
      ]);

    if (!profileResult.success || !profileResult.data) {
      setError(profileResult.error ?? "Unable to load your profile.");
      setLoading(false);
      return;
    }

    if (!requestsResult.success || !requestsResult.data) {
      setError(requestsResult.error ?? "Unable to load requests.");
      setLoading(false);
      return;
    }

    if (!shiftResult.success) {
      setError(shiftResult.error ?? "Unable to load shift data.");
      setLoading(false);
      return;
    }

    if (!activeStaffResult.success || !activeStaffResult.data) {
      setError(activeStaffResult.error ?? "Unable to load active staff.");
      setLoading(false);
      return;
    }

    setData({
      profile: profileResult.data,
      requests: requestsResult.data.requests as RequestRow[],
      totalRequests: requestsResult.data.total,
      todayShift: shiftResult.data ?? null,
      activeStaff: activeStaffResult.data,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  const handleClaim = async (requestId: string, version: number) => {
    setClaimingId(requestId);
    setClaimError(null);
    const result = await claimRequest(requestId, version);
    if (!result.success) {
      setClaimError(result.error ?? "Failed to claim request.");
    } else {
      // Optimistically update the local request row to show claimed state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          requests: prev.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  assigned_staff_id: prev.profile.id,
                  status: "pending",
                  version: result.data?.version ?? r.version + 1,
                }
              : r,
          ),
        };
      });
    }
    setClaimingId(null);
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <StaffHeader />
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
        <StaffHeader />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <p className="text-base font-medium mb-2">Unable to load dashboard</p>
              <p className="text-sm text-muted-foreground mb-6">
                {error ?? "Something went wrong. Please try again."}
              </p>
              <button
                onClick={() => void loadDashboard()}
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

  const { profile, requests, totalRequests, todayShift, activeStaff } = data;
  const today = todayDateString();

  // -------------------------------------------------------------------------
  // Derived metrics — computed from real request data
  // -------------------------------------------------------------------------

  const activeCount = requests.filter((r) =>
    ["new", "pending", "in_progress"].includes(r.status),
  ).length;

  const myAssignedCount = requests.filter(
    (r) => r.assigned_staff_id === profile.id,
  ).length;

  const completedTodayCount = requests.filter(
    (r) => r.status === "completed" && r.completed_at?.slice(0, 10) === today,
  ).length;

  const onShiftCount = activeStaff.length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <StaffHeader
        userName={profile.name}
        userInitials={getInitials(profile.name)}
        department={profile.department}
        onSignOut={() => void handleSignOut()}
      />

      <PageContainer>
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${profile.name.split(" ")[0]}. Here's what's happening today.`}
          action={
            <button
              onClick={() => void loadDashboard()}
              aria-label="Refresh dashboard"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Metric cards                                                         */}
        {/* ------------------------------------------------------------------ */}
        <AnimatedGroup preset="slide" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<ClipboardList className="w-5 h-5" />}
            value={activeCount}
            label="Active Requests"
            iconColor="text-[#7e9ab8]"
            iconBg="bg-[#7e9ab8]/10"
          />
          <MetricCard
            icon={<UserCheck className="w-5 h-5" />}
            value={myAssignedCount}
            label="My Assigned"
            iconColor="text-[#9B7340]"
            iconBg="bg-[#9B7340]/10"
          />
          <MetricCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            value={completedTodayCount}
            label="Completed Today"
            iconColor="text-[#7aaa8a]"
            iconBg="bg-[#7aaa8a]/10"
          />
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            value={onShiftCount}
            label="On Shift Now"
            iconColor="text-[#c4a06a]"
            iconBg="bg-[#c4a06a]/10"
          />
        </AnimatedGroup>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---------------------------------------------------------------- */}
          {/* Left column: shift + requests                                     */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Today's shift */}
            <TodayShiftCard shift={todayShift} />

            {/* Recent requests */}
            <section aria-labelledby="recent-requests-heading">
              <div className="flex items-center justify-between mb-3">
                <h2
                  id="recent-requests-heading"
                  className="text-base font-semibold"
                >
                  Recent Requests
                  {totalRequests > 5 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (showing 5 of {totalRequests})
                    </span>
                  )}
                </h2>
                <Link
                  href="/staff/requests"
                  className="text-sm text-[#9B7340] hover:text-[#b8924f] transition-colors flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {claimError && (
                <div
                  role="alert"
                  className="mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                >
                  {claimError}
                </div>
              )}

              {requests.length === 0 ? (
                <div className="glass-card-dark rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                  <ClipboardList className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    New guest requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="glass-card-dark rounded-2xl overflow-hidden">
                  <ul role="list" className="divide-y divide-white/5">
                    {requests.map((request) => (
                      <RequestRow
                        key={request.id}
                        request={request}
                        currentUserId={profile.id}
                        claimingId={claimingId}
                        onClaim={handleClaim}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right column: active staff                                        */}
          {/* ---------------------------------------------------------------- */}
          <div>
            <section aria-labelledby="active-staff-heading">
              <h2
                id="active-staff-heading"
                className="text-base font-semibold mb-3"
              >
                Active Staff
              </h2>

              {activeStaff.length === 0 ? (
                <div className="glass-card-dark rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <Users className="w-7 h-7 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No staff on shift</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Staff who check in will appear here.
                  </p>
                </div>
              ) : (
                <div className="glass-card-dark rounded-2xl overflow-hidden">
                  <ul role="list" className="divide-y divide-white/5">
                    {activeStaff.map((member) => (
                      <ActiveStaffRow key={member.staffId} member={member} />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------

interface MetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  iconColor: string;
  iconBg: string;
}

function MetricCard({
  icon,
  value,
  label,
  iconColor,
  iconBg,
}: MetricCardProps): React.ReactElement {
  return (
    <MagicCard className="p-5 rounded-2xl flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </MagicCard>
  );
}

// ---------------------------------------------------------------------------
// TodayShiftCard
// ---------------------------------------------------------------------------

interface TodayShiftCardProps {
  shift: ShiftData | null;
}

const SHIFT_STATUS_STYLES: Record<
  string,
  { dot: string; label: string; badge: string }
> = {
  scheduled: {
    dot: "bg-[#7e9ab8]",
    label: "Scheduled",
    badge: "bg-[#7e9ab8]/10 text-[#7e9ab8] border-[#7e9ab8]/20",
  },
  active: {
    dot: "bg-[#7aaa8a]",
    label: "Active",
    badge: "bg-[#7aaa8a]/10 text-[#7aaa8a] border-[#7aaa8a]/20",
  },
  completed: {
    dot: "bg-[#9ca3af]",
    label: "Completed",
    badge: "bg-[#9ca3af]/10 text-[#9ca3af] border-[#9ca3af]/20",
  },
  absent: {
    dot: "bg-[#a35060]",
    label: "Absent",
    badge: "bg-[#a35060]/10 text-[#a35060] border-[#a35060]/20",
  },
};

function TodayShiftCard({ shift }: TodayShiftCardProps): React.ReactElement {
  const statusStyle =
    shift ? (SHIFT_STATUS_STYLES[shift.status] ?? SHIFT_STATUS_STYLES.scheduled) : null;

  return (
    <section
      aria-labelledby="today-shift-heading"
      className="glass-card-dark relative rounded-2xl p-5"
    >
      <BorderBeam size={160} duration={14} delay={2} />
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-[#9B7340]" />
        <h2 id="today-shift-heading" className="text-base font-semibold">
          Today&apos;s Shift
        </h2>
      </div>

      {!shift ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Clock className="w-7 h-7 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No shift scheduled today</p>
          <p className="text-xs text-muted-foreground mt-1">
            Check back when your schedule is updated.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-base">{shift.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatShiftTime(shift.startTime)} – {formatShiftTime(shift.endTime)}
            </p>
            {shift.checkInAt && (
              <p className="text-xs text-muted-foreground">
                Checked in at {formatShiftTime(shift.checkInAt.slice(11, 16))}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {statusStyle && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} aria-hidden="true" />
                {statusStyle.label}
              </span>
            )}

            {shift.status === "scheduled" && (
              <Link
                href="/staff/shift"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9B7340] text-white text-xs font-medium hover:bg-[#b8924f] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Check In
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// RequestRow
// ---------------------------------------------------------------------------

interface RequestRowProps {
  request: RequestRow;
  currentUserId: string;
  claimingId: string | null;
  onClaim: (requestId: string, version: number) => Promise<void>;
}

function RequestRow({
  request,
  currentUserId,
  claimingId,
  onClaim,
}: RequestRowProps): React.ReactElement {
  const category = request.category as keyof typeof CATEGORY_LABELS;
  const priority = request.priority as keyof typeof PRIORITY_CONFIG;
  const status = request.status as keyof typeof STATUS_CONFIG;

  const categoryLabel = CATEGORY_LABELS[category] ?? request.category;
  const categoryColor = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
  const priorityConfig = PRIORITY_CONFIG[priority];
  const statusConfig = STATUS_CONFIG[status];

  const isUnassigned = !request.assigned_staff_id;
  const isClaimable =
    isUnassigned && ["new", "pending"].includes(request.status);
  const isClaiming = claimingId === request.id;

  return (
    <li className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Top row: room + category + priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">
            Room {request.room_number}
          </span>
          {categoryColor && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${categoryColor.bg} ${categoryColor.text}`}
            >
              {categoryLabel}
            </span>
          )}
          {priorityConfig && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${priorityConfig.bgClass} ${priorityConfig.textClass}`}
            >
              {priorityConfig.label}
            </span>
          )}
        </div>

        {/* Item name */}
        <p className="text-sm font-medium leading-snug truncate max-w-xs sm:max-w-sm">
          {request.item}
        </p>

        {/* Status + time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {statusConfig && (
            <span className="inline-flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusConfig.dotColor }}
                aria-hidden="true"
              />
              {statusConfig.label}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span>{getTimeAgo(request.created_at)}</span>
        </div>
      </div>

      {/* Claim button */}
      {isClaimable && (
        <button
          onClick={() => void onClaim(request.id, request.version)}
          disabled={isClaiming || claimingId !== null}
          aria-label={`Claim request for room ${request.room_number}: ${request.item}`}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9B7340]/15 border border-[#9B7340]/30 text-[#9B7340] text-xs font-medium hover:bg-[#9B7340]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClaiming ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <UserCheck className="w-3 h-3" />
          )}
          {isClaiming ? "Claiming…" : "Claim"}
        </button>
      )}

      {/* Assigned to me badge */}
      {!isUnassigned && request.assigned_staff_id === currentUserId && (
        <span className="flex-shrink-0 text-xs text-[#9B7340] font-medium">
          Assigned to me
        </span>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// ActiveStaffRow
// ---------------------------------------------------------------------------

interface ActiveStaffRowProps {
  member: ActiveStaffMember;
}

function ActiveStaffRow({ member }: ActiveStaffRowProps): React.ReactElement {
  const deptLabel =
    member.department
      ? (DEPARTMENT_LABELS[member.department] ?? member.department)
      : "Staff";

  const initials = getInitials(member.name);
  const duration = durationOnShift(member.checkInAt);

  return (
    <li className="px-4 py-3.5 flex items-center gap-3">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full bg-[#9B7340]/20 border border-[#9B7340]/30 flex items-center justify-center text-xs font-semibold text-[#9B7340] flex-shrink-0"
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Name + dept */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{deptLabel}</p>
      </div>

      {/* Duration */}
      <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        {duration}
      </div>
    </li>
  );
}
