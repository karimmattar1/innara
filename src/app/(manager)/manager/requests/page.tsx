"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  UserPlus,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { PriorityBadge } from "@/components/innara/PriorityBadge";
import { StaffAvatar } from "@/components/innara/StaffAvatar";
import { EmptyState, EmptySearchState } from "@/components/innara/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStaffRequests,
  getStaffMembers,
  updateRequestStatus,
  assignRequest,
} from "@/app/actions/staff";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_CONFIG,
  CATEGORY_LABELS,
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
  REQUEST_PRIORITIES,
  VALID_TRANSITIONS,
  type RequestStatus,
  type RequestCategory,
  type RequestPriority,
} from "@/constants/app";
import { getTimeAgo } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffRequest {
  id: string;
  category: string;
  item: string;
  description: string | null;
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

interface StaffMember {
  id: string;
  name: string;
  department: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<RequestStatus, string> = Object.fromEntries(
  REQUEST_STATUSES.map((s) => [s, STATUS_CONFIG[s].label]),
) as Record<RequestStatus, string>;

// ---------------------------------------------------------------------------
// ManagerRequestsPage
// ---------------------------------------------------------------------------

export default function ManagerRequestsPage(): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Data
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | RequestCategory>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | RequestPriority>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);

  // Mutation in-flight
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set());
  const [bulkMutating, setBulkMutating] = useState(false);

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [requestsResult, staffResult] = await Promise.all([
      getStaffRequests({ pageSize: 50 }),
      getStaffMembers(),
    ]);

    if (!requestsResult.success || !requestsResult.data) {
      setError(requestsResult.error ?? "Failed to load requests.");
      setLoading(false);
      return;
    }

    if (!staffResult.success || !staffResult.data) {
      // Non-fatal: staff list can fail; just empty it
      setStaffMembers([]);
    } else {
      setStaffMembers(staffResult.data as StaffMember[]);
    }

    setRequests(requestsResult.data.requests as StaffRequest[]);
    setSelectedIds(new Set());
    setPage(1);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  // -------------------------------------------------------------------------
  // Client-side filtering
  // -------------------------------------------------------------------------

  const filteredRequests = requests.filter((req) => {
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    if (categoryFilter !== "all" && req.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && req.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchesRoom = req.room_number.toLowerCase().includes(q);
      const matchesItem = req.item.toLowerCase().includes(q);
      const matchesDesc = req.description?.toLowerCase().includes(q) ?? false;
      if (!matchesRoom && !matchesItem && !matchesDesc) return false;
    }
    return true;
  });

  const totalFiltered = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, totalFiltered);
  const pageRows = filteredRequests.slice(pageStart, pageEnd);

  const isFiltered =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all";

  // -------------------------------------------------------------------------
  // Selection helpers
  // -------------------------------------------------------------------------

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));
  const somePageSelected =
    pageRows.some((r) => selectedIds.has(r.id)) && !allPageSelected;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageRows.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageRows.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // -------------------------------------------------------------------------
  // Row action: status transition
  // -------------------------------------------------------------------------

  const handleStatusTransition = (requestId: string, newStatus: RequestStatus) => {
    setMutatingIds((prev) => new Set(prev).add(requestId));
    startTransition(async () => {
      const result = await updateRequestStatus({ requestId, newStatus });
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status: newStatus } : r,
          ),
        );
      }
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    });
  };

  // -------------------------------------------------------------------------
  // Row action: assign
  // -------------------------------------------------------------------------

  const handleAssign = (requestId: string, staffId: string) => {
    setMutatingIds((prev) => new Set(prev).add(requestId));
    startTransition(async () => {
      const result = await assignRequest({ requestId, targetStaffId: staffId });
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, assigned_staff_id: staffId } : r,
          ),
        );
      }
      setMutatingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    });
  };

  // -------------------------------------------------------------------------
  // Bulk: mark complete
  // -------------------------------------------------------------------------

  const handleBulkComplete = async () => {
    if (selectedIds.size === 0) return;
    setBulkMutating(true);

    const ids = Array.from(selectedIds);
    const eligible = requests.filter(
      (r) =>
        ids.includes(r.id) &&
        (VALID_TRANSITIONS[r.status as RequestStatus] ?? []).includes("completed"),
    );

    await Promise.allSettled(
      eligible.map((r) =>
        updateRequestStatus({ requestId: r.id, newStatus: "completed" }),
      ),
    );

    setRequests((prev) =>
      prev.map((r) => {
        if (eligible.some((e) => e.id === r.id)) {
          return { ...r, status: "completed" };
        }
        return r;
      }),
    );
    clearSelection();
    setBulkMutating(false);
  };

  // -------------------------------------------------------------------------
  // Bulk: assign
  // -------------------------------------------------------------------------

  const handleBulkAssign = async (staffId: string) => {
    if (selectedIds.size === 0) return;
    setBulkMutating(true);

    const ids = Array.from(selectedIds);
    await Promise.allSettled(
      ids.map((id) => assignRequest({ requestId: id, targetStaffId: staffId })),
    );

    setRequests((prev) =>
      prev.map((r) => {
        if (ids.includes(r.id)) {
          return { ...r, assigned_staff_id: staffId };
        }
        return r;
      }),
    );
    clearSelection();
    setBulkMutating(false);
  };

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const getAssignedName = (staffId: string | null): string | null => {
    if (!staffId) return null;
    return staffMembers.find((s) => s.id === staffId)?.name ?? null;
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <PageHeader
            title="Requests"
            subtitle="Manage all guest service requests"
          />
          <div className="glass-card-dark rounded-2xl overflow-hidden">
            <SkeletonTable />
          </div>
        </PageContainer>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <PageHeader
            title="Requests"
            subtitle="Manage all guest service requests"
          />
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <p className="text-base font-medium mb-2">Unable to load requests</p>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Requests"
          subtitle="Manage all guest service requests"
          action={
            <button
              onClick={() => void loadData()}
              aria-label="Refresh requests"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Filters bar                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search room, item, description…"
              className="pl-9 pr-9"
              aria-label="Search requests"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as "all" | RequestStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {REQUEST_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category filter */}
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v as "all" | RequestCategory);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]" aria-label="Filter by category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {REQUEST_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority filter */}
            <Select
              value={priorityFilter}
              onValueChange={(v) => {
                setPriorityFilter(v as "all" | RequestPriority);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]" aria-label="Filter by priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {REQUEST_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Bulk action bar                                                      */}
        {/* ------------------------------------------------------------------ */}
        {selectedIds.size > 0 && (
          <div
            role="toolbar"
            aria-label="Bulk actions"
            className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#9B7340]/15 border border-[#9B7340]/30"
          >
            <span className="text-sm font-medium text-[#9B7340]">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleBulkComplete()}
                disabled={bulkMutating}
                className="gap-1.5"
              >
                {bulkMutating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Mark Complete
              </Button>

              {staffMembers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={bulkMutating}
                    className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign To…
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {staffMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => void handleBulkAssign(member.id)}
                      >
                        <StaffAvatar name={member.name} size="sm" className="mr-2" />
                        <span className="truncate">{member.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <button
                onClick={clearSelection}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-1"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Requests table                                                       */}
        {/* ------------------------------------------------------------------ */}
        <div className="glass-card-dark rounded-2xl overflow-hidden">
          {pageRows.length === 0 ? (
            <div>
              {isFiltered ? (
                <EmptySearchState query={search.trim() || undefined} />
              ) : (
                <EmptyState
                  iconName="clipboard"
                  title="No requests yet"
                  description="When guests submit requests they will appear here."
                  size="md"
                />
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b border-white/5">
                    {/* Select all */}
                    <th className="w-10 pl-4 py-3 text-left" scope="col">
                      <Checkbox
                        checked={allPageSelected}
                        indeterminate={somePageSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label={
                          allPageSelected ? "Deselect all" : "Select all"
                        }
                      />
                    </th>
                    <th
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Room
                    </th>
                    <th
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Category
                    </th>
                    <th
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Item
                    </th>
                    <th
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Priority
                    </th>
                    <th
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Status
                    </th>
                    <th
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Assigned To
                    </th>
                    <th
                      className="px-3 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Time
                    </th>
                    <th
                      className="px-3 pr-4 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wide"
                      scope="col"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((request) => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      assignedName={getAssignedName(request.assigned_staff_id)}
                      staffMembers={staffMembers}
                      isSelected={selectedIds.has(request.id)}
                      isMutating={mutatingIds.has(request.id)}
                      onToggleSelect={() => toggleSelect(request.id)}
                      onStatusTransition={handleStatusTransition}
                      onAssign={handleAssign}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Pagination                                                           */}
        {/* ------------------------------------------------------------------ */}
        {totalFiltered > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              Showing {pageStart + 1}–{pageEnd} of {totalFiltered}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevPage}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              <span className="text-xs">
                {safePage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextPage}
                disabled={safePage >= totalPages}
                aria-label="Next page"
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// RequestRow
// ---------------------------------------------------------------------------

interface RequestRowProps {
  request: StaffRequest;
  assignedName: string | null;
  staffMembers: StaffMember[];
  isSelected: boolean;
  isMutating: boolean;
  onToggleSelect: () => void;
  onStatusTransition: (requestId: string, newStatus: RequestStatus) => void;
  onAssign: (requestId: string, staffId: string) => void;
}

function RequestRow({
  request,
  assignedName,
  staffMembers,
  isSelected,
  isMutating,
  onToggleSelect,
  onStatusTransition,
  onAssign,
}: RequestRowProps): React.ReactElement {
  const currentStatus = request.status as RequestStatus;
  const validNext = VALID_TRANSITIONS[currentStatus] ?? [];
  const categoryLabel =
    CATEGORY_LABELS[request.category as keyof typeof CATEGORY_LABELS] ??
    request.category;

  return (
    <tr
      className={`border-b border-white/5 last:border-0 transition-colors ${
        isSelected ? "bg-[#9B7340]/8" : "hover:bg-white/3"
      }`}
      aria-selected={isSelected}
    >
      {/* Checkbox */}
      <td className="pl-4 py-3.5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select request for room ${request.room_number}`}
          disabled={isMutating}
        />
      </td>

      {/* Room */}
      <td className="px-3 py-3.5">
        <span className="font-semibold text-foreground">{request.room_number}</span>
      </td>

      {/* Category */}
      <td className="px-3 py-3.5">
        <span className="text-xs text-muted-foreground">{categoryLabel}</span>
      </td>

      {/* Item */}
      <td className="px-3 py-3.5 max-w-[200px]">
        <span
          className="text-sm font-medium truncate block max-w-[180px]"
          title={request.item}
        >
          {request.item}
        </span>
        {request.description && (
          <span
            className="text-xs text-muted-foreground truncate block max-w-[180px]"
            title={request.description}
          >
            {request.description}
          </span>
        )}
      </td>

      {/* Priority */}
      <td className="px-3 py-3.5">
        <PriorityBadge priority={request.priority as RequestPriority} />
      </td>

      {/* Status */}
      <td className="px-3 py-3.5">
        <StatusBadge status={currentStatus} size="sm" />
      </td>

      {/* Assigned to */}
      <td className="px-3 py-3.5">
        {assignedName ? (
          <StaffAvatar name={assignedName} size="sm" showName />
        ) : (
          <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
        )}
      </td>

      {/* Time ago */}
      <td className="px-3 py-3.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {getTimeAgo(request.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 pr-4 py-3.5 text-right">
        {isMutating ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              aria-label={`Actions for room ${request.room_number} request`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {/* Status transitions */}
              {validNext.length > 0 &&
                validNext.map((nextStatus) => (
                  <DropdownMenuItem
                    key={nextStatus}
                    onClick={() =>
                      onStatusTransition(request.id, nextStatus as RequestStatus)
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full mr-2 shrink-0"
                      style={{
                        backgroundColor:
                          STATUS_CONFIG[nextStatus as RequestStatus]?.dotColor ??
                          "#9ca3af",
                      }}
                      aria-hidden
                    />
                    {STATUS_CONFIG[nextStatus as RequestStatus]?.label ?? nextStatus}
                  </DropdownMenuItem>
                ))}

              {/* Assign submenu */}
              {staffMembers.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                    Assign
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {staffMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => onAssign(request.id, member.id)}
                      >
                        <StaffAvatar name={member.name} size="sm" className="mr-2" />
                        <span className="truncate">{member.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {/* Fallback when no actions are available */}
              {validNext.length === 0 && staffMembers.length === 0 && (
                <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// SkeletonTable
// ---------------------------------------------------------------------------

function SkeletonTable(): React.ReactElement {
  return (
    <div className="p-4 space-y-3" aria-label="Loading requests">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="w-12 h-4 rounded" />
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="flex-1 h-4 rounded" />
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-20 h-5 rounded-full" />
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-16 h-4 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
      ))}
    </div>
  );
}
