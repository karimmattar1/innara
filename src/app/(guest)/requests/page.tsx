"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ClipboardList, ChevronRight, RefreshCw } from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { CategoryIcon } from "@/components/innara/CategoryIcon";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { EmptyState } from "@/components/innara/EmptyState";
import { LoadingCard } from "@/components/innara/LoadingState";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { getMyRequests } from "@/app/actions/requests";
import type { RequestEntity, RequestStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

type Tab = "all" | "active" | "completed";

const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  active: "Active",
  completed: "Completed",
};

const ACTIVE_STATUSES: RequestStatus[] = ["new", "pending", "in_progress"];
const COMPLETED_STATUSES: RequestStatus[] = ["completed", "cancelled"];

function filterRequests(requests: RequestEntity[], tab: Tab): RequestEntity[] {
  if (tab === "active") {
    return requests.filter((r) => ACTIVE_STATUSES.includes(r.status));
  }
  if (tab === "completed") {
    return requests.filter((r) => COMPLETED_STATUSES.includes(r.status));
  }
  return requests;
}

function countByTab(requests: RequestEntity[]): Record<Tab, number> {
  return {
    all: requests.length,
    active: requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
    completed: requests.filter((r) => COMPLETED_STATUSES.includes(r.status)).length,
  };
}

interface RequestCardProps {
  request: RequestEntity;
  onClick: () => void;
}

function RequestCard({ request, onClick }: RequestCardProps): React.ReactElement {
  const timeAgo = formatDistanceToNow(new Date(request.createdAt), {
    addSuffix: true,
  });

  return (
    <button
      onClick={onClick}
      className="glass-card p-4 w-full text-left flex items-center gap-3 group"
      aria-label={`View request: ${request.item}`}
    >
      <CategoryIcon category={request.category} variant="filled" size="lg" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[#1a1d3a] truncate">{request.item}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusBadge status={request.status} size="sm" />
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-foreground/70 transition-colors" />
    </button>
  );
}

export default function GuestRequestsPage(): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  function loadRequests(): void {
    setLoading(true);
    setFetchError(null);

    startTransition(async () => {
      const result = await getMyRequests();

      if (!result.success) {
        setFetchError(result.error ?? "Failed to load requests");
        setLoading(false);
        return;
      }

      setRequests((result.data as RequestEntity[]) ?? []);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = countByTab(requests);
  const filtered = filterRequests(requests, activeTab);

  return (
    <GuestPageShell>
      <SectionHeader
        title="My Requests"
        action={
          !loading && (
            <button
              onClick={loadRequests}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
              aria-label="Refresh requests"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )
        }
      />

      {/* Tab filter */}
      <div
        className="flex gap-1.5 glass-card p-1 rounded-2xl"
        role="tablist"
        aria-label="Filter requests"
      >
        {(["all", "active", "completed"] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
              activeTab === tab
                ? "bg-[#1a1d3a] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {TAB_LABELS[tab]}
            {counts[tab] > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  activeTab === tab
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      )}

      {/* Error state */}
      {!loading && fetchError !== null && (
        <div className="glass-card p-6 text-center space-y-3">
          <p className="text-sm text-destructive">{fetchError}</p>
          <button
            onClick={loadRequests}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && fetchError === null && filtered.length === 0 && (
        <EmptyState
          iconName="clipboard"
          title={
            activeTab === "all"
              ? "No requests yet"
              : activeTab === "active"
              ? "No active requests"
              : "No completed requests"
          }
          description={
            activeTab === "all"
              ? "When you make a request, it will appear here."
              : activeTab === "active"
              ? "All your requests have been completed."
              : "Your completed requests will appear here."
          }
          action={
            activeTab === "all"
              ? {
                  label: "Browse Services",
                  onClick: () => router.push("/guest"),
                }
              : undefined
          }
        />
      )}

      {/* Request list */}
      {!loading && fetchError === null && filtered.length > 0 && (
        <div className="space-y-2.5" role="list" aria-label="Your requests">
          {filtered.map((request) => (
            <div key={request.id} role="listitem">
              <RequestCard
                request={request}
                onClick={() => router.push(`/guest/requests/${request.id}`)}
              />
            </div>
          ))}
        </div>
      )}

      {/* CTA to create new request */}
      {!loading && fetchError === null && (
        <div className="pt-2">
          <button
            onClick={() => router.push("/guest")}
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-sm font-medium text-[#9B7340] hover:text-[#7d5c33] transition-colors"
            aria-label="Make a new request"
          >
            <ClipboardList className="w-4 h-4" />
            Make a new request
          </button>
        </div>
      )}
    </GuestPageShell>
  );
}
