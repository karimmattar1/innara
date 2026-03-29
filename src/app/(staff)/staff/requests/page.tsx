"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
  Filter,
  UserCheck,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from "lucide-react";

import { StaffHeader } from "@/components/innara/StaffHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { EmptyState } from "@/components/innara/EmptyState";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { PriorityBadge } from "@/components/innara/PriorityBadge";
import { StaffAvatar } from "@/components/innara/StaffAvatar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getStaffRequests,
  getStaffProfile,
  getStaffMembers,
  updateRequestStatus,
  assignRequest,
} from "@/app/actions/staff";
import {
  claimRequest,
  releaseRequest,
} from "@/app/actions/claim-request";

import {
  STATUS_CONFIG,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  PRIORITY_CONFIG,
  DEPARTMENT_LABELS,
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  REQUEST_PRIORITIES,
  VALID_TRANSITIONS,
  type RequestStatus,
  type RequestPriority,
  type RequestCategory,
} from "@/constants/app";
import { getTimeAgo, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffRequest {
  id: string;
  category: RequestCategory;
  item: string;
  description: string | null;
  room_number: string;
  priority: RequestPriority;
  status: RequestStatus;
  assigned_staff_id: string | null;
  eta_minutes: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

interface StaffMember {
  id: string;
  name: string;
  department: string;
  role: string;
}

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components (inline, no new files)
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  active,
  dotColor,
  onClick,
}: {
  label: string;
  active: boolean;
  dotColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
        active
          ? "bg-[#9B7340]/20 border-[#9B7340]/40 text-[#C4A265]"
          : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
      ].join(" ")}
      aria-pressed={active}
    >
      {dotColor && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: active ? dotColor : undefined }}
        />
      )}
      {label}
    </button>
  );
}

function StatusTransitionMenu({
  requestId,
  currentStatus,
  onUpdate,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  onUpdate: (requestId: string, newStatus: RequestStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const allowed = VALID_TRANSITIONS[currentStatus];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (allowed.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        disabled={pending}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/40 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
        aria-label="Update status"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ArrowUpDown className="w-3 h-3" />
        )}
        <span className="hidden sm:inline">Status</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-xl bg-popover border border-border/40 shadow-xl shadow-black/30 py-1 overflow-hidden"
        >
          {allowed.map((status) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                role="option"
                aria-selected={false}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/50 transition-colors text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  startTransition(async () => {
                    await onUpdate(requestId, status);
                  });
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.dotColor }}
                />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignMenu({
  requestId,
  staffMembers,
  currentAssigneeId,
  onAssign,
}: {
  requestId: string;
  staffMembers: StaffMember[];
  currentAssigneeId: string | null;
  onAssign: (requestId: string, staffId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (staffMembers.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        disabled={pending}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/40 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
        aria-label="Assign to staff member"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <UserCheck className="w-3 h-3" />
        )}
        <span className="hidden sm:inline">Assign</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1 z-50 min-w-[180px] max-h-56 overflow-y-auto rounded-xl bg-popover border border-border/40 shadow-xl shadow-black/30 py-1"
        >
          {staffMembers.map((member) => {
            const isAssigned = member.id === currentAssigneeId;
            return (
              <button
                key={member.id}
                role="option"
                aria-selected={isAssigned}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-secondary/50 transition-colors text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  startTransition(async () => {
                    await onAssign(requestId, member.id);
                  });
                }}
              >
                <div className="w-6 h-6 rounded-full bg-secondary/60 border border-border/30 flex items-center justify-center text-[9px] font-semibold shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{member.name}</p>
                  <p className="text-muted-foreground capitalize">
                    {DEPARTMENT_LABELS[member.department] ?? member.department}
                  </p>
                </div>
                {isAssigned && (
                  <CheckCircle2 className="w-3 h-3 text-[#9B7340] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category badge (inline, uses constants)
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: RequestCategory }) {
  const colors = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        colors.bg,
        colors.text,
        colors.border,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton rows for loading state
// ---------------------------------------------------------------------------

function TableSkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-border/15 last:border-0">
          <td className="py-3.5 px-4">
            <Skeleton className="h-5 w-12 rounded-lg" />
          </td>
          <td className="py-3.5 px-4">
            <Skeleton className="h-5 w-24 rounded-full" />
          </td>
          <td className="py-3.5 px-4">
            <Skeleton className="h-5 w-32" />
          </td>
          <td className="py-3.5 px-4">
            <Skeleton className="h-5 w-20 rounded-full" />
          </td>
          <td className="py-3.5 px-4">
            <Skeleton className="h-5 w-[100px] rounded-full" />
          </td>
          <td className="py-3.5 px-4">
            <Skeleton className="h-7 w-24 rounded-lg" />
          </td>
          <td className="py-3.5 px-4">
            <Skeleton className="h-5 w-16" />
          </td>
          <td className="py-3.5 px-5 text-right">
            <div className="flex items-center justify-end gap-2">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function MobileCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card-dark rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-5 w-8 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-[90px] rounded-full" />
            <Skeleton className="h-5 w-[100px] rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-14 rounded-lg" />
              <Skeleton className="h-7 w-14 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StaffRequestsPage(): React.ReactElement {
  const router = useRouter();

  // ---- Profile & staff members ----
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  // ---- Requests data ----
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- Filters ----
  const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RequestCategory | "">("");
  const [selectedPriority, setSelectedPriority] = useState<RequestPriority | "">("");
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ---- Pagination ----
  const [page, setPage] = useState(1);

  // ---- Sort ----
  const [sortBy, setSortBy] = useState<"created_at" | "priority">("created_at");

  // ---- Action feedback ----
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<Record<string, boolean>>({});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ---- Load profile & staff members on mount ----
  useEffect(() => {
    async function loadInitial() {
      const [profileResult, staffResult] = await Promise.all([
        getStaffProfile(),
        getStaffMembers(),
      ]);
      if (profileResult.success && profileResult.data) {
        setProfile(profileResult.data);
      }
      if (staffResult.success && staffResult.data) {
        setStaffMembers(staffResult.data);
      }
    }
    loadInitial();
  }, []);

  // ---- Debounce search ----
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---- Fetch requests ----
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStaffRequests({
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        category: selectedCategory ? [selectedCategory] : undefined,
        priority: selectedPriority ? [selectedPriority] : undefined,
        assignedToMe: assignedToMe || undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      });

      if (result.success && result.data) {
        // Sort client-side by priority if needed (server returns by created_at)
        let sorted = result.data.requests as StaffRequest[];
        if (sortBy === "priority") {
          const priorityOrder: Record<string, number> = {
            urgent: 0,
            high: 1,
            medium: 2,
            low: 3,
          };
          sorted = [...sorted].sort(
            (a, b) =>
              (priorityOrder[a.priority] ?? 99) -
              (priorityOrder[b.priority] ?? 99),
          );
        }
        setRequests(sorted);
        setTotal(result.data.total);
      } else {
        setError(result.error ?? "Failed to load requests.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    selectedStatuses,
    selectedCategory,
    selectedPriority,
    assignedToMe,
    debouncedSearch,
    page,
    sortBy,
  ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ---- Reset page when filters change ----
  useEffect(() => {
    setPage(1);
  }, [selectedStatuses, selectedCategory, selectedPriority, assignedToMe]);

  // ---- Actions ----

  const setRequestPending = (id: string, pending: boolean) => {
    setActionPending((prev) => ({ ...prev, [id]: pending }));
  };

  const handleClaim = useCallback(
    async (request: StaffRequest) => {
      if (!profile) return;
      setActionError(null);
      setRequestPending(request.id, true);

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                assigned_staff_id: profile.id,
                status: r.status === "new" ? "pending" : r.status,
              }
            : r,
        ),
      );

      const result = await claimRequest(request.id, request.version);

      if (!result.success) {
        // Rollback
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id
              ? { ...r, assigned_staff_id: request.assigned_staff_id, status: request.status }
              : r,
          ),
        );
        setActionError(result.error ?? "Failed to claim request.");
      } else if (result.data) {
        // Update with server version
        setRequests((prev) =>
          prev.map((r) =>
            r.id === request.id
              ? {
                  ...r,
                  assigned_staff_id: result.data!.assignedStaffId,
                  version: result.data!.version,
                }
              : r,
          ),
        );
      }
      setRequestPending(request.id, false);
    },
    [profile],
  );

  const handleRelease = useCallback(async (request: StaffRequest) => {
    if (!profile) return;
    setActionError(null);
    setRequestPending(request.id, true);

    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === request.id
          ? {
              ...r,
              assigned_staff_id: null,
              status: r.status === "pending" ? "new" : r.status,
            }
          : r,
      ),
    );

    const result = await releaseRequest(request.id, request.version);

    if (!result.success) {
      // Rollback
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, assigned_staff_id: request.assigned_staff_id, status: request.status }
            : r,
        ),
      );
      setActionError(result.error ?? "Failed to release request.");
    } else if (result.data) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                assigned_staff_id: result.data!.assignedStaffId || null,
                version: result.data!.version,
              }
            : r,
        ),
      );
    }
    setRequestPending(request.id, false);
  }, [profile]);

  const handleStatusUpdate = useCallback(
    async (requestId: string, newStatus: RequestStatus) => {
      setActionError(null);
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      setRequestPending(requestId, true);

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r)),
      );

      const result = await updateRequestStatus({ requestId, newStatus });

      if (!result.success) {
        // Rollback
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: request.status } : r)),
        );
        setActionError(result.error ?? "Failed to update status.");
      }
      setRequestPending(requestId, false);
    },
    [requests],
  );

  const handleAssign = useCallback(
    async (requestId: string, targetStaffId: string) => {
      setActionError(null);
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      setRequestPending(requestId, true);

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, assigned_staff_id: targetStaffId } : r,
        ),
      );

      const result = await assignRequest({ requestId, targetStaffId });

      if (!result.success) {
        // Rollback
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, assigned_staff_id: request.assigned_staff_id }
              : r,
          ),
        );
        setActionError(result.error ?? "Failed to assign request.");
      }
      setRequestPending(requestId, false);
    },
    [requests],
  );

  // ---- Filter helpers ----

  const toggleStatus = (status: RequestStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const activeFilterCount =
    selectedStatuses.length +
    (selectedCategory ? 1 : 0) +
    (selectedPriority ? 1 : 0) +
    (assignedToMe ? 1 : 0) +
    (debouncedSearch ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedCategory("");
    setSelectedPriority("");
    setAssignedToMe(false);
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  };

  // ---- Resolve assignee name ----
  const getAssigneeName = (assignedStaffId: string | null): string | null => {
    if (!assignedStaffId) return null;
    if (assignedStaffId === profile?.id) return profile.name;
    return staffMembers.find((m) => m.id === assignedStaffId)?.name ?? "Staff Member";
  };

  // ---- Row click ----
  const handleRowClick = (id: string) => {
    router.push(`/staff/requests/${id}`);
  };

  return (
    <>
      <StaffHeader
        userName={profile?.name}
        userInitials={profile?.name ? getInitials(profile.name) : undefined}
        department={profile?.department}
      />
      <PageContainer>
        <PageHeader
          title="Request Queue"
          subtitle={`${total} total request${total !== 1 ? "s" : ""}`}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchRequests()}
              disabled={loading}
              className="gap-1.5 text-muted-foreground"
              aria-label="Refresh requests"
            >
              <RefreshCw className={["w-4 h-4", loading ? "animate-spin" : ""].join(" ")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          }
        />

        {/* ---- Action error banner ---- */}
        {actionError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive"
          >
            <span className="flex-1">{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="shrink-0 hover:opacity-70 transition-opacity"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ---- Filter bar ---- */}
        <GlassCard tier="panel" hover={false} className="p-4 mb-5">
          {/* Top row: search + active filter count + clear */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Search item or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                aria-label="Search requests"
              />
            </div>

            {/* Filter count + clear */}
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#9B7340]/20 border border-[#9B7340]/30 text-xs font-medium text-[#C4A265]">
                  <Filter className="w-3 h-3" />
                  {activeFilterCount} active
                </span>
              )}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}

              {/* Sort toggle */}
              <button
                onClick={() =>
                  setSortBy((s) => (s === "created_at" ? "priority" : "created_at"))
                }
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  sortBy === "priority"
                    ? "bg-[#9B7340]/20 border-[#9B7340]/40 text-[#C4A265]"
                    : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50",
                ].join(" ")}
                aria-label={`Sort by ${sortBy === "created_at" ? "priority" : "date"}`}
                aria-pressed={sortBy === "priority"}
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortBy === "priority" ? "Priority" : "Date"}
              </button>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3" role="group" aria-label="Filter by status">
            <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
            {REQUEST_STATUSES.map((status) => (
              <FilterChip
                key={status}
                label={STATUS_CONFIG[status].label}
                active={selectedStatuses.includes(status)}
                dotColor={STATUS_CONFIG[status].dotColor}
                onClick={() => toggleStatus(status)}
              />
            ))}
          </div>

          {/* Category + Priority dropdowns + My Assigned toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as RequestCategory | "");
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors cursor-pointer"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {REQUEST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value as RequestPriority | "");
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors cursor-pointer"
                aria-label="Filter by priority"
              >
                <option value="">All Priorities</option>
                {REQUEST_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>

            {/* My Assigned toggle */}
            <button
              onClick={() => setAssignedToMe((v) => !v)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                assignedToMe
                  ? "bg-[#9B7340]/20 border-[#9B7340]/40 text-[#C4A265]"
                  : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              ].join(" ")}
              aria-pressed={assignedToMe}
            >
              <UserCheck className="w-3 h-3" />
              My Assigned
            </button>
          </div>
        </GlassCard>

        {/* ---- Error state ---- */}
        {error && !loading && (
          <GlassCard tier="panel" hover={false} className="p-6 mb-5 text-center">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchRequests()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </GlassCard>
        )}

        {/* ---- Desktop Table ---- */}
        <div className="hidden md:block">
          <GlassCard tier="premium" hover={false} className="overflow-hidden mb-5">
            <table className="w-full" aria-label="Staff request queue">
              <thead>
                <tr className="border-b border-border/30">
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16"
                  >
                    Room
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-32"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Item
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24"
                  >
                    Priority
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-28"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-36"
                  >
                    Assigned To
                  </th>
                  <th
                    scope="col"
                    className="text-left py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-24"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="text-right py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-52"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows count={5} />
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-2">
                      <EmptyState
                        iconName="clipboard"
                        title="No requests found"
                        description={
                          activeFilterCount > 0
                            ? "No requests match the current filters. Try adjusting or clearing your filters."
                            : "There are no requests in the queue right now."
                        }
                        action={
                          activeFilterCount > 0
                            ? { label: "Clear Filters", onClick: clearAllFilters }
                            : undefined
                        }
                        size="md"
                      />
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => {
                    const isAssignedToMe = request.assigned_staff_id === profile?.id;
                    const isUnassigned = !request.assigned_staff_id;
                    const isClaimable =
                      isUnassigned &&
                      (request.status === "new" || request.status === "pending");
                    const isReleasable = isAssignedToMe;
                    const isPending = actionPending[request.id] ?? false;
                    const assigneeName = getAssigneeName(request.assigned_staff_id);

                    return (
                      <tr
                        key={request.id}
                        onClick={() => handleRowClick(request.id)}
                        className={[
                          "border-b border-border/15 last:border-0 cursor-pointer hover:bg-secondary/20 transition-colors",
                          request.priority === "urgent" ? "bg-red-500/3" : "",
                        ].join(" ")}
                      >
                        {/* Room */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center justify-center w-12 h-7 rounded-lg bg-secondary/80 text-xs font-semibold">
                            {request.room_number}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <CategoryBadge category={request.category} />
                        </td>

                        {/* Item */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {request.item}
                            </p>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4">
                          <PriorityBadge priority={request.priority} />
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={request.status} size="sm" />
                        </td>

                        {/* Assigned To */}
                        <td className="py-3.5 px-4">
                          {assigneeName ? (
                            <StaffAvatar
                              name={assigneeName}
                              size="sm"
                              showName
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground/50 italic">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {getTimeAgo(request.created_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Claim / Release */}
                            {isClaimable && (
                              <button
                                onClick={() => handleClaim(request)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#7e9ab8]/10 border border-[#7e9ab8]/40 text-[#7e9ab8] hover:bg-[#7e9ab8]/20 transition-colors disabled:opacity-50"
                                aria-label="Claim this request"
                              >
                                {isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3 h-3" />
                                )}
                                Claim
                              </button>
                            )}
                            {isReleasable && (
                              <button
                                onClick={() => handleRelease(request)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/40 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
                                aria-label="Release this request"
                              >
                                {isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                Release
                              </button>
                            )}

                            {/* Status transition */}
                            <StatusTransitionMenu
                              requestId={request.id}
                              currentStatus={request.status}
                              onUpdate={handleStatusUpdate}
                            />

                            {/* Assign menu */}
                            <AssignMenu
                              requestId={request.id}
                              staffMembers={staffMembers}
                              currentAssigneeId={request.assigned_staff_id}
                              onAssign={handleAssign}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </GlassCard>
        </div>

        {/* ---- Mobile Card Stack ---- */}
        <div className="md:hidden space-y-3 mb-5" aria-label="Staff request queue">
          {loading ? (
            <MobileCardSkeleton count={4} />
          ) : requests.length === 0 ? (
            <GlassCard tier="panel" hover={false} className="p-6">
              <EmptyState
                iconName="clipboard"
                title="No requests found"
                description={
                  activeFilterCount > 0
                    ? "No requests match the current filters."
                    : "There are no requests in the queue right now."
                }
                action={
                  activeFilterCount > 0
                    ? { label: "Clear Filters", onClick: clearAllFilters }
                    : undefined
                }
                size="sm"
              />
            </GlassCard>
          ) : (
            requests.map((request) => {
              const isAssignedToMe = request.assigned_staff_id === profile?.id;
              const isUnassigned = !request.assigned_staff_id;
              const isClaimable =
                isUnassigned &&
                (request.status === "new" || request.status === "pending");
              const isReleasable = isAssignedToMe;
              const isPending = actionPending[request.id] ?? false;
              const assigneeName = getAssigneeName(request.assigned_staff_id);

              return (
                <div
                  key={request.id}
                  onClick={() => handleRowClick(request.id)}
                  className={[
                    "glass-card-dark rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-transform",
                    request.priority === "urgent" ? "border-red-500/20" : "",
                  ].join(" ")}
                  role="article"
                  aria-label={`Request: ${request.item}, Room ${request.room_number}`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <CategoryBadge category={request.category} />
                        <span className="text-xs text-muted-foreground">
                          Room{" "}
                          <span className="font-semibold text-foreground">
                            {request.room_number}
                          </span>
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">{request.item}</p>
                    </div>
                    <StatusBadge status={request.status} size="sm" />
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-3">
                    <PriorityBadge priority={request.priority} />
                    {assigneeName && (
                      <StaffAvatar name={assigneeName} size="sm" showName />
                    )}
                    {!assigneeName && (
                      <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div
                    className="flex items-center justify-between pt-2.5 border-t border-border/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {getTimeAgo(request.created_at)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isClaimable && (
                        <button
                          onClick={() => handleClaim(request)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#7e9ab8]/10 border border-[#7e9ab8]/40 text-[#7e9ab8] hover:bg-[#7e9ab8]/20 transition-colors disabled:opacity-50"
                          aria-label="Claim this request"
                        >
                          {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          Claim
                        </button>
                      )}
                      {isReleasable && (
                        <button
                          onClick={() => handleRelease(request)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/40 border border-border/40 text-muted-foreground transition-colors disabled:opacity-50"
                          aria-label="Release this request"
                        >
                          {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          Release
                        </button>
                      )}
                      <StatusTransitionMenu
                        requestId={request.id}
                        currentStatus={request.status}
                        onUpdate={handleStatusUpdate}
                      />
                      <AssignMenu
                        requestId={request.id}
                        staffMembers={staffMembers}
                        currentAssigneeId={request.assigned_staff_id}
                        onAssign={handleAssign}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ---- Pagination ---- */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min((page - 1) * PAGE_SIZE + 1, total)}–
                {Math.min(page * PAGE_SIZE, total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{total}</span>{" "}
              request{total !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/30 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page number pills */}
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = idx + 1;
                } else if (page <= 4) {
                  pageNum = idx + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + idx;
                } else {
                  pageNum = page - 3 + idx;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={[
                      "w-8 h-8 rounded-lg text-xs font-medium transition-colors border",
                      page === pageNum
                        ? "bg-[#9B7340]/20 border-[#9B7340]/40 text-[#C4A265]"
                        : "border-border/30 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    ].join(" ")}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={page === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/30 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground hidden sm:block">
              Page{" "}
              <span className="font-medium text-foreground">{page}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
