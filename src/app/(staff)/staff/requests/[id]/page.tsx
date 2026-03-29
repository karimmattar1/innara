"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Users,
  Timer,
  Image as ImageIcon,
  MessageSquare,
  Activity,
  Info,
  Lock,
  Unlock,
  ChevronDown,
} from "lucide-react";

import { StaffHeader } from "@/components/innara/StaffHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { CategoryIcon } from "@/components/innara/CategoryIcon";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { PriorityBadge } from "@/components/innara/PriorityBadge";
import { StaffAvatar } from "@/components/innara/StaffAvatar";
import { ChatMessage } from "@/components/innara/ChatMessage";
import { ChatInput } from "@/components/innara/ChatInput";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getStaffProfile,
  getStaffRequestById,
  updateRequestStatus,
  assignRequest,
  setRequestEta,
  getStaffMembers,
} from "@/app/actions/staff";
import {
  claimRequest,
  releaseRequest,
} from "@/app/actions/claim-request";
import {
  sendMessage,
  getRequestMessages,
  type MessageWithSender,
} from "@/app/actions/messaging";

import {
  STATUS_CONFIG,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  DEPARTMENT_LABELS,
  VALID_TRANSITIONS,
  type RequestStatus,
  type RequestPriority,
  type RequestCategory,
} from "@/constants/app";
import { getTimeAgo, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestEvent {
  id: string;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
}

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
  photo_urls?: string[] | null;
  request_events?: RequestEvent[];
  messages?: MessageWithSender[];
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

interface StaffMember {
  id: string;
  name: string;
  department: string;
  role: string;
}

const STATUS_ACTION_LABELS: Record<RequestStatus, string> = {
  new: "New",
  pending: "Accept",
  in_progress: "Start Work",
  completed: "Complete",
  cancelled: "Cancel",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAbsoluteTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatEta(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Skeleton for the full page
// ---------------------------------------------------------------------------

function RequestDetailSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column */}
      <div className="flex-1 min-w-0 space-y-4">
        <GlassCard className="p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-16 w-full" />
        </GlassCard>
        <GlassCard className="p-5">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-3 h-3 rounded-full mt-1 shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
      {/* Right column */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-4">
        <GlassCard className="p-5">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-10 w-full rounded-lg mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </GlassCard>
        <GlassCard className="p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </GlassCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline Section
// ---------------------------------------------------------------------------

interface TimelineSectionProps {
  events: RequestEvent[];
  createdAt: string;
}

function TimelineSection({ events, createdAt }: TimelineSectionProps) {
  // Build timeline entries from request_events
  const allEntries = [
    {
      id: "created",
      status: "new",
      notes: "Request submitted",
      created_by: null as string | null,
      created_at: createdAt,
    },
    ...events,
  ].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#9B7340]" />
        <h3 className="font-semibold text-sm">Activity Timeline</h3>
      </div>
      <div className="relative">
        {/* Vertical connector line */}
        {allEntries.length > 1 && (
          <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-border/40 rounded-full" />
        )}
        <div className="space-y-4">
          {allEntries.map((entry, index) => {
            const isLast = index === allEntries.length - 1;
            const statusCfg =
              STATUS_CONFIG[entry.status as RequestStatus] ??
              STATUS_CONFIG["new"];
            const dotColor =
              entry.status === "completed"
                ? "#7aaa8a"
                : entry.status === "cancelled"
                ? "#9ca3af"
                : entry.id === "created"
                ? "#7e9ab8"
                : statusCfg.dotColor;

            return (
              <div key={entry.id} className="flex gap-3 relative">
                <div
                  className="w-3 h-3 rounded-full border-2 border-background shrink-0 mt-0.5 z-10"
                  style={{ backgroundColor: dotColor }}
                />
                <div className={isLast ? "" : "pb-0"}>
                  <p className="text-sm font-medium leading-tight">
                    {entry.id === "created"
                      ? "Request Created"
                      : statusCfg.label}
                  </p>
                  {entry.notes && entry.id !== "created" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatAbsoluteTime(entry.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Messages Section
// ---------------------------------------------------------------------------

interface MessagesSectionProps {
  requestId: string;
  currentUserId: string;
  initialMessages: MessageWithSender[];
}

function MessagesSection({
  requestId,
  currentUserId,
  initialMessages,
}: MessagesSectionProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(content: string) {
    setSendError(null);
    setIsSending(true);

    // Optimistic: add message immediately
    const optimisticMsg: MessageWithSender = {
      id: `optimistic-${Date.now()}`,
      requestId,
      senderId: currentUserId,
      senderType: "staff",
      content,
      isInternal,
      createdAt: new Date().toISOString(),
      senderName: "You",
      senderEmail: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const result = await sendMessage({ requestId, content, isInternal });

    if (result.success && result.data) {
      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMsg.id ? (result.data as MessageWithSender) : m
        )
      );
    } else {
      // Rollback optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setSendError(result.error ?? "Failed to send message.");
    }

    setIsSending(false);
  }

  // Convert MessageWithSender to ChatMessage's expected format
  function toChatMessageFormat(msg: MessageWithSender) {
    const sender: "guest" | "ai" | "staff" =
      msg.senderType === "guest" ? "guest" : "staff";
    return {
      id: msg.id,
      sender,
      content: msg.content,
      timestamp: new Date(msg.createdAt),
    };
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-[#9B7340]" />
        <h3 className="font-semibold text-sm">Messages</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Message list */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Send a message to the guest or add an internal note
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isInternal) {
              return (
                <div key={msg.id} className="relative">
                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wide">
                        Internal Note
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {getTimeAgo(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.senderName && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {msg.senderName}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <ChatMessage
                key={msg.id}
                message={toChatMessageFormat(msg)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Internal toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setIsInternal(false)}
          className={[
            "px-3 py-1 rounded-full text-xs font-medium transition-all border",
            !isInternal
              ? "bg-[#9B7340]/20 border-[#9B7340]/40 text-[#C4A265]"
              : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50",
          ].join(" ")}
          aria-pressed={!isInternal}
        >
          To Guest
        </button>
        <button
          onClick={() => setIsInternal(true)}
          className={[
            "px-3 py-1 rounded-full text-xs font-medium transition-all border",
            isInternal
              ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
              : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50",
          ].join(" ")}
          aria-pressed={isInternal}
        >
          Internal Note
        </button>
      </div>

      {sendError && (
        <p className="text-xs text-destructive mb-2" role="alert">
          {sendError}
        </p>
      )}

      <ChatInput
        onSend={handleSend}
        placeholder={
          isInternal
            ? "Add an internal note (staff only)..."
            : "Send a message to the guest..."
        }
        disabled={isSending}
      />
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Action Sidebar
// ---------------------------------------------------------------------------

interface ActionSidebarProps {
  request: StaffRequest;
  currentProfile: StaffProfile;
  staffMembers: StaffMember[];
  onRequestUpdate: (updated: Partial<StaffRequest>) => void;
}

function ActionSidebar({
  request,
  currentProfile,
  staffMembers,
  onRequestUpdate,
}: ActionSidebarProps) {
  const [isPending, startTransition] = useTransition();
  const [statusNote, setStatusNote] = useState("");
  const [statusNoteOpen, setStatusNoteOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<RequestStatus | null>(null);
  const [customEta, setCustomEta] = useState("");
  const [etaError, setEtaError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [claimPending, setClaimPending] = useState(false);
  const [etaPending, setEtaPending] = useState(false);
  const [reassignPending, setReassignPending] = useState(false);

  const allowedTransitions = VALID_TRANSITIONS[request.status];
  const isAssignedToMe = request.assigned_staff_id === currentProfile.id;
  const isUnassigned = !request.assigned_staff_id;
  const assignedMember = staffMembers.find(
    (m) => m.id === request.assigned_staff_id
  );

  // ---------------------------------------------------------------------------
  // Status update
  // ---------------------------------------------------------------------------

  async function handleStatusUpdate(newStatus: RequestStatus) {
    setActionError(null);
    startTransition(async () => {
      // Optimistic
      onRequestUpdate({ status: newStatus });

      const result = await updateRequestStatus({
        requestId: request.id,
        newStatus,
        note: statusNote.trim() || undefined,
      });

      if (!result.success) {
        // Rollback
        onRequestUpdate({ status: request.status });
        setActionError(result.error ?? "Failed to update status.");
      } else {
        setStatusNote("");
        setStatusNoteOpen(false);
        setPendingTransition(null);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Claim / Release
  // ---------------------------------------------------------------------------

  async function handleClaim() {
    setActionError(null);
    setClaimPending(true);

    // Optimistic
    onRequestUpdate({
      assigned_staff_id: currentProfile.id,
      status: request.status === "new" ? "pending" : request.status,
    });

    const result = await claimRequest(request.id, request.version);

    if (!result.success) {
      // Rollback
      onRequestUpdate({
        assigned_staff_id: request.assigned_staff_id,
        status: request.status,
      });
      setActionError(result.error ?? "Failed to claim request.");
    } else if (result.data) {
      onRequestUpdate({ version: result.data.version });
    }

    setClaimPending(false);
  }

  async function handleRelease() {
    setActionError(null);
    setClaimPending(true);

    const prevAssigned = request.assigned_staff_id;
    const prevStatus = request.status;

    // Optimistic
    onRequestUpdate({
      assigned_staff_id: null,
      status: request.status === "pending" ? "new" : request.status,
    });

    const result = await releaseRequest(request.id, request.version);

    if (!result.success) {
      onRequestUpdate({
        assigned_staff_id: prevAssigned,
        status: prevStatus,
      });
      setActionError(result.error ?? "Failed to release request.");
    } else if (result.data) {
      onRequestUpdate({ version: result.data.version });
    }

    setClaimPending(false);
  }

  // ---------------------------------------------------------------------------
  // Reassign
  // ---------------------------------------------------------------------------

  async function handleReassign(targetStaffId: string) {
    if (targetStaffId === request.assigned_staff_id) return;
    setActionError(null);
    setReassignPending(true);

    const prevAssigned = request.assigned_staff_id;
    onRequestUpdate({ assigned_staff_id: targetStaffId });

    const result = await assignRequest({
      requestId: request.id,
      targetStaffId,
    });

    if (!result.success) {
      onRequestUpdate({ assigned_staff_id: prevAssigned });
      setActionError(result.error ?? "Failed to reassign request.");
    }

    setReassignPending(false);
  }

  // ---------------------------------------------------------------------------
  // ETA
  // ---------------------------------------------------------------------------

  async function handleSetEta(minutes: number) {
    setEtaError(null);
    setEtaPending(true);

    const prevEta = request.eta_minutes;
    onRequestUpdate({ eta_minutes: minutes });

    const result = await setRequestEta({ requestId: request.id, etaMinutes: minutes });

    if (!result.success) {
      onRequestUpdate({ eta_minutes: prevEta });
      setEtaError(result.error ?? "Failed to set ETA.");
    }

    setEtaPending(false);
  }

  async function handleCustomEta() {
    const parsed = parseInt(customEta, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 1440) {
      setEtaError("Enter a value between 1 and 1440 minutes.");
      return;
    }
    setCustomEta("");
    await handleSetEta(parsed);
  }

  const ETA_PRESETS = [15, 30, 45, 60] as const;

  return (
    <aside className="w-full lg:w-[320px] shrink-0 space-y-4">
      {/* Action error */}
      {actionError && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-2.5 rounded-xl"
          role="alert"
        >
          {actionError}
          <button
            className="ml-2 underline opacity-70 hover:opacity-100"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Actions */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#9B7340]" />
          <h3 className="font-semibold text-sm">Status</h3>
        </div>

        {/* Current status */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Current:</span>
          <StatusBadge status={request.status} size="sm" />
        </div>

        {allowedTransitions.length > 0 ? (
          <div className="space-y-2">
            {allowedTransitions.map((nextStatus) => {
              const isCancelAction = nextStatus === "cancelled";
              return (
                <Button
                  key={nextStatus}
                  variant={isCancelAction ? "outline" : "secondary"}
                  size="sm"
                  className={[
                    "w-full gap-2 border-[1.5px] text-xs",
                    isCancelAction
                      ? "border-destructive/30 text-destructive/80 hover:bg-destructive/10"
                      : nextStatus === "completed"
                      ? "border-[#7aaa8a]/40 bg-[#7aaa8a]/10 hover:bg-[#7aaa8a]/20"
                      : nextStatus === "in_progress"
                      ? "border-[#c4a06a]/40 bg-[#c4a06a]/10 hover:bg-[#c4a06a]/20"
                      : "border-[#7e9ab8]/40 bg-[#7e9ab8]/10 hover:bg-[#7e9ab8]/20",
                  ].join(" ")}
                  disabled={isPending}
                  onClick={() => {
                    if (statusNoteOpen && pendingTransition === nextStatus) {
                      void handleStatusUpdate(nextStatus);
                    } else {
                      setPendingTransition(nextStatus);
                      setStatusNoteOpen(true);
                    }
                  }}
                  aria-label={`Transition to ${STATUS_CONFIG[nextStatus]?.label ?? nextStatus}`}
                >
                  {isPending && pendingTransition === nextStatus ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : nextStatus === "completed" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : nextStatus === "cancelled" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {STATUS_ACTION_LABELS[nextStatus]}
                </Button>
              );
            })}

            {/* Optional note before transitioning */}
            {statusNoteOpen && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  className="min-h-[64px] text-xs bg-secondary/30 border-border/40 resize-none"
                  aria-label="Status change note"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    disabled={!pendingTransition || isPending}
                    onClick={() => {
                      if (pendingTransition) {
                        void handleStatusUpdate(pendingTransition);
                      }
                    }}
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      setStatusNoteOpen(false);
                      setPendingTransition(null);
                      setStatusNote("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No further transitions available.
          </p>
        )}
      </GlassCard>

      {/* Assignment */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#9B7340]" />
          <h3 className="font-semibold text-sm">Assignment</h3>
        </div>

        {/* Assigned to */}
        <div className="flex items-center gap-2 mb-4">
          {isUnassigned ? (
            <span className="text-xs text-muted-foreground italic">
              Unassigned
            </span>
          ) : (
            <>
              <StaffAvatar
                name={assignedMember?.name ?? "Staff"}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium leading-tight">
                  {assignedMember?.name ?? "Staff Member"}
                </p>
                {assignedMember?.department && (
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {DEPARTMENT_LABELS[assignedMember.department] ??
                      assignedMember.department}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Claim / Release */}
        <div className="flex gap-2 mb-4">
          {isUnassigned && (
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 gap-1.5 text-xs border border-[#9B7340]/30 bg-[#9B7340]/10 hover:bg-[#9B7340]/20"
              disabled={claimPending}
              onClick={() => void handleClaim()}
            >
              {claimPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
              Claim
            </Button>
          )}
          {isAssignedToMe && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-xs border-border/40"
              disabled={claimPending}
              onClick={() => void handleRelease()}
            >
              {claimPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
              Release
            </Button>
          )}
        </div>

        {/* Reassign */}
        {staffMembers.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
              Reassign to
            </p>
            <Select
              value={request.assigned_staff_id ?? ""}
              onValueChange={(val) => { if (val) void handleReassign(val); }}
              disabled={reassignPending}
            >
              <SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/40">
                <SelectValue placeholder="Select staff member..." />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <span className="text-xs">
                      {member.name}
                      <span className="text-muted-foreground ml-1">
                        — {DEPARTMENT_LABELS[member.department] ?? member.department}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </GlassCard>

      {/* ETA */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-[#9B7340]" />
          <h3 className="font-semibold text-sm">Estimated Time</h3>
        </div>

        {request.eta_minutes ? (
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#c4a06a]" />
            <span className="text-sm font-semibold text-[#C4A265]">
              {formatEta(request.eta_minutes)}
            </span>
            <span className="text-xs text-muted-foreground">remaining</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">No ETA set</p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {ETA_PRESETS.map((mins) => (
            <button
              key={mins}
              onClick={() => void handleSetEta(mins)}
              disabled={etaPending}
              className={[
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                request.eta_minutes === mins
                  ? "bg-[#9B7340]/20 border-[#9B7340]/40 text-[#C4A265]"
                  : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              ].join(" ")}
              aria-label={`Set ETA to ${formatEta(mins)}`}
            >
              {formatEta(mins)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={customEta}
            onChange={(e) => {
              setCustomEta(e.target.value);
              setEtaError(null);
            }}
            placeholder="Custom (min)"
            min={1}
            max={1440}
            className="flex-1 h-8 rounded-lg bg-secondary/30 border border-border/40 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B7340]/40 placeholder:text-muted-foreground"
            aria-label="Custom ETA in minutes"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCustomEta();
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            className="text-xs border border-border/30 h-8"
            disabled={!customEta.trim() || etaPending}
            onClick={() => void handleCustomEta()}
          >
            {etaPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Set"
            )}
          </Button>
        </div>
        {etaError && (
          <p className="text-xs text-destructive mt-1.5" role="alert">
            {etaError}
          </p>
        )}
      </GlassCard>

      {/* Quick Info */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-[#9B7340]" />
          <h3 className="font-semibold text-sm">Quick Info</h3>
        </div>
        <dl className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Room</dt>
            <dd className="font-medium">{request.room_number}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Category</dt>
            <dd className="font-medium">
              {CATEGORY_LABELS[request.category]}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Priority</dt>
            <dd>
              <PriorityBadge priority={request.priority} />
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium text-right">
              {formatAbsoluteTime(request.created_at)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-2">
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="font-medium text-right">
              {formatAbsoluteTime(request.updated_at)}
            </dd>
          </div>
        </dl>
      </GlassCard>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [request, setRequest] = useState<StaffRequest | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [profileResult, requestResult, staffResult] = await Promise.all([
      getStaffProfile(),
      getStaffRequestById(requestId),
      getStaffMembers(),
    ]);

    if (!profileResult.success) {
      setError(profileResult.error ?? "Failed to load profile.");
      setLoading(false);
      return;
    }

    if (!requestResult.success) {
      setError(requestResult.error ?? "Failed to load request.");
      setLoading(false);
      return;
    }

    const rawRequest = requestResult.data as StaffRequest;

    // Load messages separately so we get the enriched format from getRequestMessages
    const messagesResult = await getRequestMessages(requestId);

    setProfile(profileResult.data as StaffProfile);
    setRequest(rawRequest);
    setStaffMembers(staffResult.success ? (staffResult.data as StaffMember[]) : []);
    setMessages(messagesResult.success ? (messagesResult.data as MessageWithSender[]) : []);
    setLoading(false);
  };

  useEffect(() => {
    if (requestId) {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // Partial optimistic update handler
  function handleRequestUpdate(patch: Partial<StaffRequest>) {
    setRequest((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col">
      <StaffHeader
        userName={profile?.name}
        userInitials={
          profile?.name ? getInitials(profile.name) : undefined
        }
        department={profile?.department}
      />

      <main className="flex-1">
        <PageContainer>
          <PageHeader
            title={loading ? "Request Details" : (request?.item ?? "Request Details")}
            subtitle={
              !loading && request
                ? `Room ${request.room_number} · ${getTimeAgo(request.created_at)}`
                : undefined
            }
            backTo="/staff/requests"
            action={
              !loading && (
                <button
                  onClick={() => void loadData()}
                  className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
                  aria-label="Refresh request"
                >
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </button>
              )
            }
          />

          {loading && <RequestDetailSkeleton />}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <XCircle className="w-12 h-12 text-destructive/40 mb-4" />
              <p className="text-lg font-semibold mb-2">Unable to load request</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                {error}
              </p>
              <Button
                variant="secondary"
                onClick={() => void loadData()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && request && profile && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column — main content */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Request header card */}
                <GlassCard className="p-5">
                  <div className="flex items-start gap-4">
                    <CategoryIcon
                      category={request.category}
                      size="xl"
                      variant="outline"
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold leading-tight truncate">
                        {request.item}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Room {request.room_number}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <StatusBadge status={request.status} showDot />
                        <PriorityBadge priority={request.priority} />
                        {request.eta_minutes && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-secondary/50 border border-border/30 text-[#C4A265]">
                            <Timer className="w-3 h-3" />
                            ETA {formatEta(request.eta_minutes)}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Time info — desktop */}
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-medium">
                        {getTimeAgo(request.created_at)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatAbsoluteTime(request.created_at)}
                      </span>
                    </div>
                  </div>
                  {/* Time info — mobile */}
                  <div className="flex sm:hidden items-center gap-1.5 mt-3 pt-3 border-t border-border/20">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(request.created_at)} · {formatAbsoluteTime(request.created_at)}
                    </span>
                  </div>
                </GlassCard>

                {/* Description */}
                {(request.description || (request.photo_urls && request.photo_urls.length > 0)) && (
                  <GlassCard className="p-5">
                    {request.description && (
                      <>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Description
                        </h3>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {request.description}
                        </p>
                      </>
                    )}
                    {request.photo_urls && request.photo_urls.length > 0 && (
                      <div className={request.description ? "mt-4 pt-4 border-t border-border/20" : ""}>
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Photos
                          </h3>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {request.photo_urls.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={url}
                              alt={`Request photo ${i + 1}`}
                              className="w-20 h-20 object-cover rounded-xl border border-border/30 shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                )}

                {/* Timeline */}
                {request.request_events && (
                  <TimelineSection
                    events={request.request_events}
                    createdAt={request.created_at}
                  />
                )}

                {/* Messages */}
                <MessagesSection
                  requestId={request.id}
                  currentUserId={profile.id}
                  initialMessages={messages}
                />
              </div>

              {/* Right column — action sidebar */}
              <ActionSidebar
                request={request}
                currentProfile={profile}
                staffMembers={staffMembers}
                onRequestUpdate={handleRequestUpdate}
              />
            </div>
          )}
        </PageContainer>
      </main>
    </div>
  );
}
