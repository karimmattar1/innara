"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, LogIn, LogOut, Calendar, Users, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { StaffHeader } from "@/components/innara/StaffHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getTodayShift,
  getMyShifts,
  getShiftSchedule,
  getActiveStaffOnShift,
  checkIn,
  checkOut,
} from "@/app/actions/shifts";
import type { ShiftData, ScheduleDay, ActiveStaffMember } from "@/app/actions/shifts";
import { DEPARTMENT_LABELS, DEPARTMENT_COLORS } from "@/constants/app";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Time formatting helpers — all pure, no browser API reads, no SSR issues
// ---------------------------------------------------------------------------

function formatTime(timeStr: string): string {
  // Expects HH:MM:SS or HH:MM
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}

function formatISOTime(isoStr: string): string {
  const date = new Date(isoStr);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatDuration(startIso: string, endIso?: string): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatShortDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD (UTC)
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDayOfWeek(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDayNumber(dateStr: string): string {
  const [, , day] = dateStr.split("-").map(Number);
  return day.toString();
}

function getISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return getISODateString(date);
}

// ---------------------------------------------------------------------------
// Department badge
// ---------------------------------------------------------------------------

interface DepartmentBadgeProps {
  department: string | null;
  size?: "sm" | "xs";
}

function DepartmentBadge({ department, size = "sm" }: DepartmentBadgeProps): React.ReactElement {
  if (!department) return <></>;
  const colorClasses = DEPARTMENT_COLORS[department] ?? "bg-gray-100 text-gray-700";
  const label = DEPARTMENT_LABELS[department] ?? department;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        colorClasses,
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shift status badge
// ---------------------------------------------------------------------------

interface ShiftStatusBadgeProps {
  status: ShiftData["status"];
}

function ShiftStatusBadge({ status }: ShiftStatusBadgeProps): React.ReactElement {
  const config: Record<ShiftData["status"], { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
    active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
    completed: { label: "Completed", className: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20" },
    absent: { label: "Absent", className: "bg-red-500/15 text-red-400 border border-red-500/20" },
  };
  const { label, className } = config[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Today's shift hero card
// ---------------------------------------------------------------------------

interface TodayShiftCardProps {
  shift: ShiftData | null;
  isLoading: boolean;
  now: Date;
  onCheckIn: (assignmentId: string) => Promise<void>;
  onCheckOutRequest: (assignmentId: string) => void;
  isActionLoading: boolean;
}

function TodayShiftCard({
  shift,
  isLoading,
  now,
  onCheckIn,
  onCheckOutRequest,
  isActionLoading,
}: TodayShiftCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="glass-card-dark rounded-2xl p-6 border border-white/10">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="glass-card-dark rounded-2xl p-6 border border-white/10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-800/60 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">No shift scheduled for today</p>
          <p className="text-sm text-muted-foreground mt-0.5">Check the team schedule for upcoming shifts</p>
        </div>
      </div>
    );
  }

  const timeRange = `${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}`;

  return (
    <div
      className={cn(
        "glass-card-dark relative rounded-2xl p-6 border",
        shift.status === "active"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : shift.status === "completed"
            ? "border-zinc-500/20"
            : "border-[#9B7340]/30 bg-[#9B7340]/5",
      )}
    >
      <BorderBeam size={160} duration={14} />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: shift info */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              shift.status === "active"
                ? "bg-emerald-500/15"
                : shift.status === "completed"
                  ? "bg-zinc-500/15"
                  : "bg-[#9B7340]/15",
            )}
          >
            <Clock
              className={cn(
                "w-5 h-5",
                shift.status === "active"
                  ? "text-emerald-400"
                  : shift.status === "completed"
                    ? "text-zinc-400"
                    : "text-[#9B7340]",
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today's Shift</span>
              <ShiftStatusBadge status={shift.status} />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{shift.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{timeRange}</p>
            {shift.department && (
              <div className="mt-2">
                <DepartmentBadge department={shift.department} />
              </div>
            )}
          </div>
        </div>

        {/* Right: action area */}
        <div className="shrink-0">
          {shift.status === "scheduled" && (
            <Button
              onClick={() => onCheckIn(shift.id)}
              disabled={isActionLoading}
              className="bg-[#9B7340] hover:bg-[#b8924f] text-white border-0 h-9 px-4 gap-2 rounded-xl"
            >
              {isActionLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Check In
            </Button>
          )}

          {shift.status === "active" && (
            <Button
              onClick={() => onCheckOutRequest(shift.id)}
              disabled={isActionLoading}
              variant="destructive"
              className="h-9 px-4 gap-2 rounded-xl"
            >
              {isActionLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Check Out
            </Button>
          )}

          {shift.status === "completed" && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Shift complete
            </div>
          )}
        </div>
      </div>

      {/* Active shift stats */}
      {shift.status === "active" && shift.checkInAt && (
        <div className="mt-4 pt-4 border-t border-emerald-500/15 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Checked in at</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{formatISOTime(shift.checkInAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duration so far</p>
            <p className="text-sm font-medium text-emerald-400 mt-0.5">{formatDuration(shift.checkInAt)}</p>
          </div>
        </div>
      )}

      {/* Completed shift summary */}
      {shift.status === "completed" && shift.checkInAt && shift.checkOutAt && (
        <div className="mt-4 pt-4 border-t border-zinc-500/15 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Checked in</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{formatISOTime(shift.checkInAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Checked out</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{formatISOTime(shift.checkOutAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total hours</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{formatDuration(shift.checkInAt, shift.checkOutAt)}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {shift.notes && (
        <div className="mt-3 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{shift.notes}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming shifts list
// ---------------------------------------------------------------------------

interface UpcomingShiftsProps {
  shifts: ShiftData[];
  isLoading: boolean;
}

function UpcomingShifts({ shifts, isLoading }: UpcomingShiftsProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card-dark rounded-xl p-4 border border-white/10">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="glass-card-dark rounded-2xl p-8 border border-white/10 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-5 h-5 text-zinc-500" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No upcoming shifts scheduled</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Your schedule will appear here when shifts are assigned</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shifts.map((shift) => (
        <div
          key={shift.id}
          className="glass-card-dark rounded-xl p-4 border border-white/10 flex items-center gap-4 group hover:border-[#9B7340]/30 transition-colors"
        >
          {/* Date bubble */}
          <div className="w-12 h-12 rounded-xl bg-[#1a1d3a] border border-white/10 flex flex-col items-center justify-center shrink-0">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
              {formatDayOfWeek(shift.date)}
            </span>
            <span className="text-lg font-bold text-foreground leading-none mt-0.5">
              {formatDayNumber(shift.date)}
            </span>
          </div>

          {/* Shift info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground truncate">{shift.name}</p>
              {shift.department && <DepartmentBadge department={shift.department} size="xs" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{formatShortDate(shift.date)}</p>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-[#9B7340] transition-colors" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week schedule grid
// ---------------------------------------------------------------------------

interface WeekScheduleProps {
  schedule: ScheduleDay[];
  weekDates: string[];
  todayStr: string;
  isLoading: boolean;
}

function WeekSchedule({ schedule, weekDates, todayStr, isLoading }: WeekScheduleProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[640px] grid grid-cols-7 gap-2">
          {weekDates.map((date) => (
            <div key={date} className="space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const scheduleByDate = new Map(schedule.map((day) => [day.date, day]));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] grid grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const isToday = date === todayStr;
          const day = scheduleByDate.get(date);
          return (
            <div key={date} className="space-y-2">
              {/* Day header */}
              <div
                className={cn(
                  "rounded-xl p-2.5 text-center border",
                  isToday
                    ? "bg-[#9B7340]/20 border-[#9B7340]/40"
                    : "bg-zinc-800/30 border-white/5",
                )}
              >
                <p className={cn("text-[10px] font-medium uppercase tracking-wider", isToday ? "text-[#9B7340]" : "text-muted-foreground")}>
                  {formatDayOfWeek(date)}
                </p>
                <p className={cn("text-lg font-bold leading-none mt-0.5", isToday ? "text-[#9B7340]" : "text-foreground")}>
                  {formatDayNumber(date)}
                </p>
                {isToday && (
                  <span className="inline-block w-1 h-1 rounded-full bg-[#9B7340] mt-1" />
                )}
              </div>

              {/* Shifts for this day */}
              <div className="space-y-1.5 min-h-[80px]">
                {!day || day.shifts.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/40 text-center py-2">—</p>
                ) : (
                  day.shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={cn(
                        "rounded-lg p-2 border text-left",
                        isToday ? "bg-[#9B7340]/10 border-[#9B7340]/20" : "bg-zinc-800/30 border-white/5",
                      )}
                    >
                      <p className="text-[10px] font-semibold text-foreground truncate">{shift.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </p>
                      {shift.staff.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {shift.staff.slice(0, 3).map((member) => (
                            <div key={member.id} className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-[#9B7340]/40 flex items-center justify-center shrink-0">
                                <span className="text-[7px] text-[#9B7340] font-bold leading-none">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[9px] text-muted-foreground truncate">{member.name.split(" ")[0]}</span>
                              {member.department && (
                                <span
                                  className="text-[8px] px-1 rounded-full bg-zinc-700/50 text-zinc-400 truncate hidden sm:inline"
                                >
                                  {DEPARTMENT_LABELS[member.department] ?? member.department}
                                </span>
                              )}
                            </div>
                          ))}
                          {shift.staff.length > 3 && (
                            <p className="text-[9px] text-muted-foreground/60">+{shift.staff.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Currently on shift panel
// ---------------------------------------------------------------------------

interface ActiveStaffPanelProps {
  activeStaff: ActiveStaffMember[];
  isLoading: boolean;
}

function ActiveStaffPanel({ activeStaff, isLoading }: ActiveStaffPanelProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeStaff.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">No staff currently on shift</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeStaff.map((member) => (
        <div key={member.staffId} className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#9B7340]/20 border border-[#9B7340]/30 flex items-center justify-center shrink-0 relative">
            <span className="text-xs font-semibold text-[#9B7340]">
              {member.name.charAt(0).toUpperCase()}
            </span>
            {/* Green active dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {member.department && <DepartmentBadge department={member.department} size="xs" />}
              <span className="text-[10px] text-muted-foreground">{formatDuration(member.checkInAt)} ago</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Check Out confirmation dialog
// ---------------------------------------------------------------------------

interface CheckOutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

function CheckOutDialog({ open, onClose, onConfirm, isLoading }: CheckOutDialogProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-[#1a1d3a] border border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>Check Out of Shift</DialogTitle>
          <DialogDescription>
            Are you sure you want to check out? This will end your active shift and log your departure time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Yes, Check Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ShiftPage(): React.ReactElement {
  // ---- Today's shift state
  const [todayShift, setTodayShift] = useState<ShiftData | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);

  // ---- Upcoming shifts state
  const [upcomingShifts, setUpcomingShifts] = useState<ShiftData[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  // ---- Schedule state
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  // ---- Active staff state
  const [activeStaff, setActiveStaff] = useState<ActiveStaffMember[]>([]);
  const [activeStaffLoading, setActiveStaffLoading] = useState(true);

  // ---- Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [checkOutTarget, setCheckOutTarget] = useState<string | null>(null);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);

  // ---- Now ticker (for live duration updates) — safe: initialized to null, set in useEffect
  const [now, setNow] = useState<Date>(new Date());
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Active staff poll interval
  const activeStaffPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Date calculations (computed from stable state, no SSR issues)
  const todayStr = getISODateString(new Date());
  const tomorrowStr = addDays(todayStr, 1);
  const sevenDaysAheadStr = addDays(todayStr, 7);

  // Week start (Monday of current week)
  const weekStartStr = (() => {
    const [y, m, d] = todayStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay(); // 0 = Sun
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    date.setDate(date.getDate() + daysToMonday);
    return getISODateString(date);
  })();

  const weekEndStr = addDays(weekStartStr, 6);

  // Build the 7 dates for the week grid
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => addDays(weekStartStr, i));

  // ---- Data fetchers
  const fetchTodayShift = useCallback(async () => {
    setTodayLoading(true);
    setTodayError(null);
    const result = await getTodayShift();
    if (result.success) {
      setTodayShift(result.data ?? null);
    } else {
      setTodayError(result.error ?? "Failed to load today's shift");
    }
    setTodayLoading(false);
  }, []);

  const fetchUpcomingShifts = useCallback(async () => {
    setUpcomingLoading(true);
    const result = await getMyShifts({ dateFrom: tomorrowStr, dateTo: sevenDaysAheadStr });
    if (result.success) {
      setUpcomingShifts(result.data ?? []);
    }
    setUpcomingLoading(false);
  }, [tomorrowStr, sevenDaysAheadStr]);

  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    const result = await getShiftSchedule(weekStartStr, weekEndStr);
    if (result.success) {
      setSchedule(result.data ?? []);
    }
    setScheduleLoading(false);
  }, [weekStartStr, weekEndStr]);

  const fetchActiveStaff = useCallback(async () => {
    const result = await getActiveStaffOnShift();
    if (result.success) {
      setActiveStaff(result.data ?? []);
    }
    setActiveStaffLoading(false);
  }, []);

  // ---- Initial data load
  useEffect(() => {
    void fetchTodayShift();
    void fetchUpcomingShifts();
    void fetchSchedule();
    void fetchActiveStaff();
  }, [fetchTodayShift, fetchUpcomingShifts, fetchSchedule, fetchActiveStaff]);

  // ---- Live ticker for duration display (every 30s)
  useEffect(() => {
    tickerRef.current = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  // ---- Active staff poll (every 30s)
  useEffect(() => {
    activeStaffPollRef.current = setInterval(() => {
      void fetchActiveStaff();
    }, 30000);
    return () => {
      if (activeStaffPollRef.current) clearInterval(activeStaffPollRef.current);
    };
  }, [fetchActiveStaff]);

  // ---- Check In handler
  const handleCheckIn = useCallback(async (assignmentId: string) => {
    setActionLoading(true);
    const result = await checkIn(assignmentId);
    if (result.success && result.data) {
      // Optimistic update: merge new status + checkInAt into todayShift
      setTodayShift((prev) =>
        prev
          ? {
              ...prev,
              status: result.data!.status,
              checkInAt: result.data!.checkInAt,
            }
          : prev,
      );
      toast.success("You're checked in — have a great shift!");
      // Re-fetch active staff immediately
      void fetchActiveStaff();
    } else {
      toast.error(result.error ?? "Failed to check in. Please try again.");
    }
    setActionLoading(false);
  }, [fetchActiveStaff]);

  // ---- Check Out flow
  const handleCheckOutRequest = useCallback((assignmentId: string) => {
    setCheckOutTarget(assignmentId);
    setCheckOutDialogOpen(true);
  }, []);

  const handleCheckOutConfirm = useCallback(async () => {
    if (!checkOutTarget) return;
    setActionLoading(true);
    const result = await checkOut(checkOutTarget);
    if (result.success && result.data) {
      const checkInAt = todayShift?.checkInAt ?? null;
      const checkOutAt = result.data.checkOutAt ?? new Date().toISOString();
      setTodayShift((prev) =>
        prev
          ? {
              ...prev,
              status: result.data!.status,
              checkOutAt: result.data!.checkOutAt,
            }
          : prev,
      );
      setCheckOutDialogOpen(false);
      setCheckOutTarget(null);
      // Show completion summary in toast
      const duration = checkInAt ? formatDuration(checkInAt, checkOutAt) : null;
      toast.success(
        duration
          ? `Shift complete. You worked ${duration} today.`
          : "Shift complete. See you next time!",
      );
      void fetchActiveStaff();
    } else {
      toast.error(result.error ?? "Failed to check out. Please try again.");
    }
    setActionLoading(false);
  }, [checkOutTarget, todayShift, fetchActiveStaff]);

  const handleCheckOutDialogClose = useCallback(() => {
    if (actionLoading) return;
    setCheckOutDialogOpen(false);
    setCheckOutTarget(null);
  }, [actionLoading]);

  return (
    <>
      <StaffHeader />
      <PageContainer>
        <PageHeader
          title="My Shifts"
          subtitle="Manage your schedule and attendance"
        />

        {/* Error banner for today's shift fetch failure */}
        {todayError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-400">{todayError}</p>
          </div>
        )}

        {/* Main grid layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
          {/* Left column: today card + tabs */}
          <div className="space-y-6 min-w-0">
            {/* Today's shift hero card */}
            <TodayShiftCard
              shift={todayShift}
              isLoading={todayLoading}
              now={now}
              onCheckIn={handleCheckIn}
              onCheckOutRequest={handleCheckOutRequest}
              isActionLoading={actionLoading}
            />

            {/* Upcoming / Team Schedule tabs */}
            <Tabs defaultValue="upcoming">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Schedule</h2>
                <TabsList className="h-8">
                  <TabsTrigger value="upcoming" className="text-xs h-6 px-3">
                    My Shifts
                  </TabsTrigger>
                  <TabsTrigger value="team" className="text-xs h-6 px-3">
                    Team Schedule
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* My upcoming shifts */}
              <TabsContent value="upcoming">
                <UpcomingShifts
                  shifts={upcomingShifts}
                  isLoading={upcomingLoading}
                />
              </TabsContent>

              {/* Team week schedule */}
              <TabsContent value="team">
                <WeekSchedule
                  schedule={schedule}
                  weekDates={weekDates}
                  todayStr={todayStr}
                  isLoading={scheduleLoading}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column: currently on shift sidebar */}
          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="glass-card-dark rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-foreground">Currently On Shift</h2>
                <span className="ml-auto text-[10px] text-muted-foreground">Live</span>
              </div>
              <ActiveStaffPanel
                activeStaff={activeStaff}
                isLoading={activeStaffLoading}
              />
              {!activeStaffLoading && activeStaff.length > 0 && (
                <p className="text-[10px] text-muted-foreground/40 mt-4 text-center">
                  Updates every 30 seconds
                </p>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Check Out confirmation dialog */}
      <CheckOutDialog
        open={checkOutDialogOpen}
        onClose={handleCheckOutDialogClose}
        onConfirm={handleCheckOutConfirm}
        isLoading={actionLoading}
      />
    </>
  );
}
