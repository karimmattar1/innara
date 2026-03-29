"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Search, MessageSquare, Clock, User, Lock, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StaffHeader } from "@/components/innara/StaffHeader";
import { ChatMessage } from "@/components/innara/ChatMessage";
import { ChatInput } from "@/components/innara/ChatInput";
import {
  getStaffConversations,
  getRequestMessages,
  sendMessage,
} from "@/app/actions/messaging";
import { getStaffProfile } from "@/app/actions/staff";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/constants/app";
import type { StaffConversation, MessageWithSender } from "@/app/actions/messaging";

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  if (!dateString) return "";
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Sub-components (local, not exported)
// ---------------------------------------------------------------------------

interface ConversationItemProps {
  conversation: StaffConversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const category = conversation.category as keyof typeof CATEGORY_LABELS;
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
  const label = CATEGORY_LABELS[category] ?? conversation.category;

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-4 transition-colors border-b border-white/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340]/60",
        isSelected
          ? "bg-[#9B7340]/10 border-l-2 border-l-[#9B7340]"
          : "hover:bg-white/5",
      ].join(" ")}
      aria-current={isSelected ? "true" : undefined}
    >
      {/* Avatar + Name row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#252850] border border-white/10 flex items-center justify-center shrink-0 text-sm font-semibold text-white/80">
          {getInitials(conversation.guestName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-white truncate">
              {conversation.guestName ?? "Guest"}
            </span>
            <span className="text-[11px] text-white/40 shrink-0">
              {timeAgo(conversation.lastMessageAt)}
            </span>
          </div>
          {/* Room + Category */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-white/50">Room {conversation.roomNumber}</span>
            <span
              className={[
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                colors.bg,
                colors.text,
              ].join(" ")}
            >
              {label}
            </span>
          </div>
          {/* Last message preview */}
          <p className="text-xs text-white/40 truncate leading-relaxed">
            {conversation.lastMessage || "No messages yet"}
          </p>
        </div>
      </div>
    </button>
  );
}

// Convert a MessageWithSender to the shape ChatMessage expects
function toChatMessageShape(msg: MessageWithSender): {
  id: string;
  sender: "guest" | "ai" | "staff";
  content: string;
  timestamp: Date;
} {
  const senderType = msg.senderType as "guest" | "ai" | "staff";
  const safeSender: "guest" | "ai" | "staff" =
    senderType === "guest" || senderType === "ai" || senderType === "staff"
      ? senderType
      : "staff";

  return {
    id: msg.id,
    sender: safeSender,
    content: msg.content,
    timestamp: new Date(msg.createdAt),
  };
}

// Internal note banner shown above internal messages
function InternalNoteBadge() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-0.5">
      <Lock className="w-3 h-3 text-amber-400/80" />
      <span className="text-[10px] font-medium text-amber-400/80 uppercase tracking-widest">
        Internal note
      </span>
    </div>
  );
}

// Empty state for the right panel when nothing is selected
function NoConversationSelected() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-[#252850] border border-white/10 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-white/20" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/50">No conversation selected</p>
        <p className="text-xs text-white/30 mt-1">
          Select a conversation from the list to start messaging
        </p>
      </div>
    </div>
  );
}

// Empty conversation list state
function NoConversations() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#252850] border border-white/10 flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-white/20" />
      </div>
      <p className="text-sm text-white/40">No conversations yet</p>
    </div>
  );
}

// Skeleton loader for conversation list
function ConversationSkeleton() {
  return (
    <div className="animate-pulse space-y-px">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-white/10 rounded" />
              <div className="h-3 w-12 bg-white/10 rounded" />
            </div>
            <div className="h-2.5 w-20 bg-white/10 rounded" />
            <div className="h-2.5 w-40 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loader for message thread
function MessagesSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
          <div className={`h-12 rounded-2xl bg-white/10 ${i % 2 === 0 ? "w-48" : "w-64"}`} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function StaffMessagesPage(): React.ReactElement {
  // Staff profile (for header display)
  const [staffName, setStaffName] = useState<string | undefined>(undefined);
  const [staffDepartment, setStaffDepartment] = useState<string | undefined>(undefined);

  // Conversations state
  const [conversations, setConversations] = useState<StaffConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected conversation + messages
  const [selectedConversation, setSelectedConversation] = useState<StaffConversation | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Compose state
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Mobile view state: 'list' | 'thread'
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedRequestIdRef = useRef<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load staff profile on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    getStaffProfile().then((result) => {
      if (result.success && result.data) {
        setStaffName(result.data.name);
        setStaffDepartment(result.data.department);
      }
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Load conversations on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setConversationsLoading(true);
    getStaffConversations({ page: 1, pageSize: 50 })
      .then((result) => {
        if (result.success && result.data) {
          setConversations(result.data.conversations);
          setConversationsError(null);
        } else {
          setConversationsError(result.error ?? "Failed to load conversations.");
        }
      })
      .finally(() => setConversationsLoading(false));
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-scroll to bottom on new messages
  // ---------------------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Load messages for selected conversation
  // ---------------------------------------------------------------------------
  const loadMessages = useCallback(async (requestId: string, isBackground = false) => {
    if (!isBackground) setMessagesLoading(true);
    setMessagesError(null);

    const result = await getRequestMessages(requestId);

    if (result.success && result.data) {
      setMessages(result.data);
    } else {
      if (!isBackground) setMessagesError(result.error ?? "Failed to load messages.");
    }

    if (!isBackground) setMessagesLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Polling: refresh messages every 10s when a conversation is active
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!selectedConversation) return;

    selectedRequestIdRef.current = selectedConversation.requestId;

    pollingRef.current = setInterval(() => {
      const rid = selectedRequestIdRef.current;
      if (rid) loadMessages(rid, true);
    }, 10_000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedConversation, loadMessages]);

  // ---------------------------------------------------------------------------
  // Select conversation handler
  // ---------------------------------------------------------------------------
  const handleSelectConversation = (conversation: StaffConversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setSendError(null);
    setIsInternal(false);
    setMobileView("thread");
    loadMessages(conversation.requestId);
  };

  // ---------------------------------------------------------------------------
  // Send message handler
  // ---------------------------------------------------------------------------
  const handleSend = async (content: string) => {
    if (!selectedConversation || sending) return;

    setSending(true);
    setSendError(null);

    // Optimistic message
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: MessageWithSender = {
      id: optimisticId,
      requestId: selectedConversation.requestId,
      senderId: "me",
      senderType: "staff",
      content,
      isInternal,
      createdAt: new Date().toISOString(),
      senderName: staffName ?? "Staff",
      senderEmail: null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const result = await sendMessage({
      requestId: selectedConversation.requestId,
      content,
      isInternal,
    });

    if (result.success && result.data) {
      // Replace optimistic message with real one
      const real = result.data;
      setMessages((prev) =>
        prev.map((m): MessageWithSender => (m.id === optimisticId ? real : m))
      );
    } else {
      // Roll back optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setSendError(result.error ?? "Failed to send message.");
    }

    setSending(false);
  };

  // ---------------------------------------------------------------------------
  // Filtered conversations
  // ---------------------------------------------------------------------------
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.guestName ?? "").toLowerCase().includes(q) ||
      c.roomNumber.toLowerCase().includes(q)
    );
  });

  // ---------------------------------------------------------------------------
  // Derived: currently selected conversation's category colors
  // ---------------------------------------------------------------------------
  const selectedCategory = selectedConversation?.category as keyof typeof CATEGORY_LABELS | undefined;
  const selectedColors = selectedCategory ? (CATEGORY_COLORS[selectedCategory] ?? CATEGORY_COLORS.other) : CATEGORY_COLORS.other;
  const selectedLabel = selectedCategory ? (CATEGORY_LABELS[selectedCategory] ?? selectedConversation?.category ?? "") : "";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <StaffHeader
        userName={staffName}
        userInitials={staffName ? getInitials(staffName) : undefined}
        department={staffDepartment}
      />

      {/* Full-height split layout below header */}
      <div
        className="flex overflow-hidden bg-[#12142a]"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* ================================================================
            LEFT PANEL — Conversation list
            Desktop: always visible (w-1/3)
            Mobile: visible when mobileView === 'list'
        ================================================================ */}
        <aside
          className={[
            "flex flex-col border-r border-white/10 bg-[#1a1d3a]",
            // Desktop: always 1/3 width
            "md:w-1/3 md:flex",
            // Mobile: full width, toggle visibility
            "w-full",
            mobileView === "list" ? "flex" : "hidden",
          ].join(" ")}
          aria-label="Conversations"
        >
          {/* Panel header */}
          <div className="px-4 pt-5 pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-base font-semibold text-white">Messages</h1>
              {conversations.length > 0 && (
                <span className="text-[11px] font-medium bg-[#9B7340]/20 text-[#9B7340] px-2 py-0.5 rounded-full">
                  {conversations.length}
                </span>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by guest or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={[
                  "w-full bg-[#252850] border border-white/10 rounded-xl",
                  "pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30",
                  "focus:outline-none focus:ring-2 focus:ring-[#9B7340]/40 focus:border-[#9B7340]/40",
                  "transition-colors",
                ].join(" ")}
                aria-label="Search conversations"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto" role="list" aria-label="Conversation list">
            {conversationsLoading ? (
              <ConversationSkeleton />
            ) : conversationsError ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-red-400/80">{conversationsError}</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <NoConversations />
            ) : (
              filteredConversations.map((conv) => (
                <div key={conv.requestId} role="listitem">
                  <ConversationItem
                    conversation={conv}
                    isSelected={selectedConversation?.requestId === conv.requestId}
                    onClick={() => handleSelectConversation(conv)}
                  />
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ================================================================
            RIGHT PANEL — Message thread
            Desktop: always visible (flex-1)
            Mobile: visible when mobileView === 'thread'
        ================================================================ */}
        <main
          className={[
            "flex flex-col flex-1 min-w-0",
            // Mobile: toggle visibility
            "w-full",
            mobileView === "thread" ? "flex" : "hidden md:flex",
          ].join(" ")}
          aria-label="Message thread"
        >
          {selectedConversation ? (
            <>
              {/* Thread header */}
              <header className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[#1a1d3a] shrink-0">
                {/* Mobile back button */}
                <button
                  onClick={() => setMobileView("list")}
                  className={[
                    "md:hidden p-2 -ml-1 rounded-xl hover:bg-white/5 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340]/60",
                  ].join(" ")}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-4 h-4 text-white/70" />
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#252850] border border-white/10 flex items-center justify-center text-sm font-semibold text-white/80 shrink-0">
                  {getInitials(selectedConversation.guestName)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">
                      {selectedConversation.guestName ?? "Guest"}
                    </span>
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Room {selectedConversation.roomNumber}
                    </span>
                    <span
                      className={[
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        selectedColors.bg,
                        selectedColors.text,
                      ].join(" ")}
                    >
                      {selectedLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span className="text-[11px] text-white/30">
                      {messages.length} message{messages.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Link to request */}
                <a
                  href={`/staff/requests/${selectedConversation.requestId}`}
                  className={[
                    "flex items-center gap-1 text-xs text-[#9B7340] hover:text-[#b8924f] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340]/60 rounded",
                    "shrink-0",
                  ].join(" ")}
                  aria-label="View request details"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Request</span>
                </a>
              </header>

              {/* Messages area */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                role="log"
                aria-live="polite"
                aria-label="Message history"
              >
                {messagesLoading ? (
                  <MessagesSkeleton />
                ) : messagesError ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-red-400/80">{messagesError}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <MessageSquare className="w-8 h-8 text-white/10" />
                    <p className="text-sm text-white/30">No messages yet. Start the conversation.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.isInternal && <InternalNoteBadge />}
                        <div
                          className={
                            msg.isInternal
                              ? "border-l-2 border-amber-400/40 pl-3 ml-1"
                              : undefined
                          }
                        >
                          <ChatMessage message={toChatMessageShape(msg)} />
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} aria-hidden="true" />
                  </>
                )}
              </div>

              {/* Compose area */}
              <div className="border-t border-white/10 bg-[#1a1d3a] px-4 pt-3 pb-4 shrink-0">
                {/* Internal toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <Switch
                    id="internal-toggle"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                    disabled={sending}
                    aria-describedby="internal-toggle-description"
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <Label
                    htmlFor="internal-toggle"
                    className="text-xs text-white/50 cursor-pointer select-none flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    Internal note
                    <span id="internal-toggle-description" className="sr-only">
                      Internal notes are only visible to staff members
                    </span>
                  </Label>
                  {isInternal && (
                    <span className="text-[10px] text-amber-400/80 font-medium">
                      Only staff can see this
                    </span>
                  )}
                </div>

                {/* Error banner */}
                {sendError && (
                  <div
                    className="text-xs text-red-400/90 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-2"
                    role="alert"
                  >
                    {sendError}
                  </div>
                )}

                <ChatInput
                  onSend={handleSend}
                  placeholder={isInternal ? "Add an internal note..." : "Reply to guest..."}
                  disabled={sending}
                />
              </div>
            </>
          ) : (
            <NoConversationSelected />
          )}
        </main>
      </div>
    </>
  );
}
