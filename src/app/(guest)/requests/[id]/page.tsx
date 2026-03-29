"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { CategoryIcon } from "@/components/innara/CategoryIcon";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { PriorityBadge } from "@/components/innara/PriorityBadge";
import { LoadingCard } from "@/components/innara/LoadingState";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { ChatMessage } from "@/components/innara/ChatMessage";
import { Button } from "@/components/ui/button";
import { getRequestById, cancelRequest } from "@/app/actions/requests";
import { CATEGORY_LABELS } from "@/constants/app";
import type { RequestEntity, StatusEvent, MessageEntity } from "@/types/domain";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Timeline event icon helpers
// ---------------------------------------------------------------------------

function EventIcon({ toStatus }: { toStatus: string }): React.ReactElement {
  const className = "w-4 h-4";
  switch (toStatus) {
    case "completed":
      return <CheckCircle2 className={className} />;
    case "cancelled":
      return <XCircle className={className} />;
    case "in_progress":
      return <Clock className={className} />;
    default:
      return <User className={className} />;
  }
}

function getEventColor(toStatus: string): string {
  switch (toStatus) {
    case "completed":
      return "text-green-600 bg-green-100";
    case "cancelled":
      return "text-gray-500 bg-gray-100";
    case "in_progress":
      return "text-amber-600 bg-amber-100";
    case "pending":
      return "text-blue-600 bg-blue-100";
    default:
      return "text-[#9B7340] bg-amber-50";
  }
}

// ---------------------------------------------------------------------------
// Timeline entry
// ---------------------------------------------------------------------------

interface TimelineEntryProps {
  event: StatusEvent;
  isLast: boolean;
}

function TimelineEntry({ event, isLast }: TimelineEntryProps): React.ReactElement {
  const colorClass = getEventColor(event.toStatus);

  const timeLabel = (() => {
    try {
      return format(new Date(event.at), "MMM d, h:mm a");
    } catch {
      return event.at;
    }
  })();

  const statusLabel =
    event.toStatus === "new"
      ? "Request created"
      : event.toStatus === "pending"
      ? "Request accepted"
      : event.toStatus === "in_progress"
      ? "In progress"
      : event.toStatus === "completed"
      ? "Completed"
      : event.toStatus === "cancelled"
      ? "Cancelled"
      : event.toStatus;

  return (
    <div className="flex gap-3">
      {/* Icon + line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            colorClass,
          )}
        >
          <EventIcon toStatus={event.toStatus} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border/60 mt-1 mb-0 min-h-[20px]" />
        )}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{statusLabel}</p>
            {event.byName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                by {event.byName}
              </p>
            )}
            {event.note && (
              <p className="text-xs text-foreground/70 mt-1 bg-muted/40 rounded-lg px-2.5 py-1.5">
                {event.note}
              </p>
            )}
          </div>
          <time
            className="text-xs text-muted-foreground shrink-0 mt-0.5"
            dateTime={event.at}
          >
            {timeLabel}
          </time>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground/80">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [request, setRequest] = useState<RequestEntity | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [messages, setMessages] = useState<MessageEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);

    startTransition(async () => {
      const result = await getRequestById(id);

      if (!result.success) {
        setFetchError(result.error ?? "Failed to load request");
        setLoading(false);
        return;
      }

      const raw = result.data as Record<string, unknown>;
      setRequest(raw as unknown as RequestEntity);
      setEvents((raw.request_events as StatusEvent[]) ?? []);
      setMessages((raw.messages as MessageEntity[]) ?? []);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleCancelClick(): void {
    setShowCancelConfirm(true);
  }

  function handleCancelConfirm(): void {
    setCancelling(true);
    setCancelError(null);

    startTransition(async () => {
      const result = await cancelRequest(id);

      if (!result.success) {
        setCancelError(result.error ?? "Failed to cancel request");
        setCancelling(false);
        setShowCancelConfirm(false);
        return;
      }

      // Update local state immediately
      setRequest((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      setShowCancelConfirm(false);
      setCancelling(false);
    });
  }

  const canCancel =
    request !== null &&
    (request.status === "new" || request.status === "pending");

  const submittedTimeAgo = request
    ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })
    : "";

  const etaText =
    request?.etaMinutes != null
      ? `~${request.etaMinutes} min`
      : "Not set";

  return (
    <GuestPageShell>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2 -ml-1 hover:text-foreground transition-colors"
        aria-label="Go back to requests"
      >
        <ChevronLeft className="w-4 h-4" />
        My Requests
      </button>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <LoadingCard />
          <LoadingCard />
        </div>
      )}

      {/* Error */}
      {!loading && fetchError !== null && (
        <div className="glass-card p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive">{fetchError}</p>
          <button
            onClick={() => router.push("/guest/requests")}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Back to requests
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && fetchError === null && request !== null && (
        <>
          {/* Request header card */}
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CategoryIcon
                category={request.category}
                variant="filled"
                size="xl"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-[#1a1d3a] leading-snug">
                  {request.item}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {CATEGORY_LABELS[request.category]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={request.status} showDot />
              <PriorityBadge priority={request.priority} />
            </div>

            {request.description && (
              <p className="text-sm text-foreground/70 bg-muted/30 rounded-xl px-3 py-2.5">
                {request.description}
              </p>
            )}

            <div className="space-y-2 border-t border-border/40 pt-3">
              {request.roomNumber && (
                <InfoRow label="Room" value={request.roomNumber} />
              )}
              <InfoRow label="Submitted" value={submittedTimeAgo} />
              <InfoRow label="ETA" value={etaText} />
              {request.assignedStaffName && (
                <InfoRow label="Assigned to" value={request.assignedStaffName} />
              )}
            </div>
          </div>

          {/* Timeline */}
          {events.length > 0 && (
            <div>
              <SectionHeader title="Timeline" />
              <div className="glass-card p-4">
                {events.map((event, idx) => (
                  <TimelineEntry
                    key={event.id}
                    event={event}
                    isLast={idx === events.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div>
              <SectionHeader title="Messages" />
              <div className="glass-card p-4 space-y-3">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={{
                      id: msg.id,
                      sender: msg.fromRole === "ai" ? "ai" : msg.fromRole === "guest" ? "guest" : "staff",
                      content: msg.body,
                      timestamp: new Date(msg.at),
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No messages placeholder */}
          {messages.length === 0 && (
            <div className="glass-card p-5 flex items-center gap-3 text-muted-foreground">
              <MessageSquare className="w-5 h-5 shrink-0" />
              <p className="text-sm">
                Staff will send you updates here as your request progresses.
              </p>
            </div>
          )}

          {/* Cancel error */}
          {cancelError !== null && (
            <div
              className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2.5"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          {/* Cancel confirm dialog */}
          {showCancelConfirm && (
            <div className="glass-card p-4 space-y-3 border border-destructive/20">
              <p className="text-sm font-medium text-foreground">
                Cancel this request?
              </p>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                >
                  Keep it
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleCancelConfirm}
                  disabled={cancelling}
                  aria-busy={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Yes, cancel"}
                </Button>
              </div>
            </div>
          )}

          {/* Cancel trigger */}
          {canCancel && !showCancelConfirm && (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleCancelClick}
            >
              Cancel Request
            </Button>
          )}
        </>
      )}
    </GuestPageShell>
  );
}
