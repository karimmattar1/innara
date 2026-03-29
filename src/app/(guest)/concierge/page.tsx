"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SquarePen, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { ChatInput } from "@/components/innara/ChatInput";
import { ChatMessage } from "@/components/innara/ChatMessage";
import { QuickReplyButtons } from "@/components/innara/QuickReplyButtons";
import { ConciergeChatHistorySheet } from "@/components/innara/ConciergeChatHistorySheet";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  quickReplies?: string[];
}

// ─────────────────────────────────────────────
// Welcome message shown before any API call
// ─────────────────────────────────────────────

const WELCOME_MESSAGE: ChatEntry = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome! I'm your AI concierge. I can help you with room service, housekeeping requests, local recommendations, and anything else you need during your stay. How can I assist you today?",
  quickReplies: [
    "Order room service",
    "Request housekeeping",
    "What's nearby?",
    "Report an issue",
  ],
};

// ─────────────────────────────────────────────
// Typing indicator bubble
// ─────────────────────────────────────────────

function TypingIndicator(): React.ReactElement {
  return (
    <div className="w-full flex justify-start animate-fade-in">
      <div className="max-w-[90%]">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <div className="w-7 h-7 rounded-full bg-[#1a1d3a] flex items-center justify-center shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#9B7340]" />
          </div>
          <span className="text-xs font-semibold text-[#9B7340] uppercase tracking-wide">
            AI Concierge
          </span>
        </div>
        <div className="chat-bubble-ai">
          <div className="flex gap-1 items-center h-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SSE parsing helper
// ─────────────────────────────────────────────

interface SseTextEvent {
  type: "text";
  text: string;
}

interface SseDoneEvent {
  type: "done";
  conversationId: string;
}

interface SseErrorEvent {
  type: "error";
  error: string;
}

type SseEvent = SseTextEvent | SseDoneEvent | SseErrorEvent;

function parseSseChunk(raw: string): SseEvent[] {
  const events: SseEvent[] = [];
  const blocks = raw.split("\n\n").filter(Boolean);
  for (const block of blocks) {
    if (block.startsWith("data: ")) {
      try {
        const parsed = JSON.parse(block.slice(6)) as SseEvent;
        events.push(parsed);
      } catch {
        // Malformed chunk — skip
      }
    }
  }
  return events;
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────

export default function ConciergeChatPage(): React.ReactElement {
  const [messages, setMessages] = useState<ChatEntry[]>([WELCOME_MESSAGE]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      // ChatInput renders its own input; we query it via DOM
      const input = document.querySelector<HTMLInputElement>(".chat-input");
      if (input) input.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  // ─── sendMessage ──────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return;

      const userEntry: ChatEntry = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
      };

      const aiEntryId = `ai-${Date.now()}`;
      const aiEntry: ChatEntry = {
        id: aiEntryId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userEntry, aiEntry]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, conversationId }),
        });

        if (!response.ok || !response.body) {
          throw new Error(
            `Request failed with status ${response.status}`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE blocks (terminated by \n\n)
          const boundary = buffer.lastIndexOf("\n\n");
          if (boundary === -1) continue;

          const toProcess = buffer.slice(0, boundary + 2);
          buffer = buffer.slice(boundary + 2);

          const events = parseSseChunk(toProcess);

          for (const event of events) {
            if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiEntryId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            } else if (event.type === "done") {
              setConversationId(event.conversationId);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiEntryId ? { ...m, isStreaming: false } : m
                )
              );
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiEntryId
                    ? {
                        ...m,
                        content:
                          event.error ||
                          "Something went wrong. Please try again.",
                        isStreaming: false,
                      }
                    : m
                )
              );
            }
          }
        }

        // Flush remaining buffer after stream ends
        if (buffer.trim()) {
          const remainingEvents = parseSseChunk(buffer);
          for (const event of remainingEvents) {
            if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiEntryId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            } else if (event.type === "done") {
              setConversationId(event.conversationId);
            }
          }
        }

        // Ensure streaming flag is always cleared
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiEntryId && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiEntryId
              ? {
                  ...m,
                  content: `I'm sorry, I couldn't process your request. ${message} Please try again.`,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, conversationId]
  );

  // ─── startNewConversation ─────────────────────
  const startNewConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setConversationId(null);
    setIsLoading(false);
  }, []);

  // ─── Convert ChatEntry to the shape ChatMessage expects ──
  // ChatMessage uses sender: 'guest' | 'ai' | 'staff' with a timestamp.
  // The timestamp is fixed at render time to avoid creating a new object on
  // every render cycle (which would trigger unnecessary re-renders).
  const toChatMessageType = useCallback((entry: ChatEntry) => ({
    id: entry.id,
    sender: (entry.role === "user" ? "guest" : "ai") as "guest" | "ai",
    content: entry.content,
    timestamp: new Date(),
  }), []);

  // ─── Custom header actions ──────────────────────
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full bg-white/20 border border-white/30 text-[#1a1d3a] hover:bg-white/30"
        onClick={() => setHistoryOpen(true)}
        aria-label="View chat history"
      >
        <History className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full bg-white/20 border border-white/30 text-[#1a1d3a] hover:bg-white/30"
        onClick={startNewConversation}
        aria-label="Start new conversation"
      >
        <SquarePen className="w-4 h-4" />
      </Button>
    </div>
  );

  // ─── History sheet rendered inside GuestPageShell via modalSlot ──────────
  // InlineBottomSheet uses absolute positioning relative to its container, so
  // it must be placed inside the shell (which has `relative overflow-hidden`).
  const historySheet = useMemo(
    () => (
      <ConciergeChatHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        sessions={[]}
        onSelect={(_sessionId) => {
          // Session loading will be wired when session persistence is added.
          setHistoryOpen(false);
        }}
        onDelete={(_sessionId) => {
          // Session deletion will be wired when session persistence is added.
        }}
      />
    ),
    [historyOpen]
  );

  return (
    <GuestPageShell
      mainClassName="flex flex-col gap-0 px-0 py-0 overflow-hidden"
      contentClassName="flex flex-col h-full space-y-0"
      footer={
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          placeholder="Ask me anything about your stay..."
        />
      }
      topSlot={
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1a1d3a] flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#9B7340]" />
            </div>
            <span className="text-sm font-semibold text-[#1a1d3a]">
              AI Concierge
            </span>
          </div>
          {headerActions}
        </div>
      }
      modalSlot={historySheet}
    >
      {/* Messages scroll area */}
      <section
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((entry) => (
          <div key={entry.id}>
            <ChatMessage message={toChatMessageType(entry)} />

            {/* Quick replies — shown below AI messages when not streaming */}
            {entry.role === "assistant" &&
              !entry.isStreaming &&
              entry.quickReplies &&
              entry.quickReplies.length > 0 && (
                <div className="ml-9">
                  <QuickReplyButtons
                    options={entry.quickReplies}
                    onSelect={sendMessage}
                  />
                </div>
              )}
          </div>
        ))}

        {/* Typing indicator — shown only while the AI entry is streaming with no content yet */}
        {isLoading &&
          messages[messages.length - 1]?.role === "assistant" &&
          messages[messages.length - 1]?.isStreaming &&
          messages[messages.length - 1]?.content === "" && (
            <TypingIndicator />
          )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </section>
    </GuestPageShell>
  );
}
