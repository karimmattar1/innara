"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageEntity } from "@/types/domain";

// ─────────────────────────────────────────────────────────────────────────────
// use-realtime-messages
//
// Subscribes to INSERT events on the `messages` table for a specific request.
// Only surfaces guest-visible messages (is_internal = false).
//
// Returns the current list of messages sorted oldest-first and a connection
// status flag. Fetches the initial set on mount, then keeps it live via
// Supabase Realtime. Subscription is cleaned up on unmount or when
// `requestId` changes.
// ─────────────────────────────────────────────────────────────────────────────

export interface UseRealtimeMessagesResult {
  messages: MessageEntity[];
  isConnected: boolean;
}

export interface UseRealtimeMessagesOptions {
  /** Called whenever a new message arrives. */
  onUpdate?: (message: MessageEntity) => void;
}

export function useRealtimeMessages(
  requestId: string,
  options: UseRealtimeMessagesOptions = {}
): UseRealtimeMessagesResult {
  const { onUpdate } = options;

  const [messages, setMessages] = useState<MessageEntity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Stable ref so the subscription callback always sees the latest onUpdate
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!requestId) return;

    const supabase = createClient();
    let isMounted = true;

    async function bootstrap() {
      // ── Fetch initial messages for this request ─────────────────────────
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("request_id", requestId)
        .eq("is_internal", false)
        .order("at", { ascending: true });

      if (error) {
        // Non-fatal: realtime will still deliver new messages
        return;
      }

      if (isMounted && data) {
        setMessages(mapRows(data));
      }

      // ── Realtime subscription ───────────────────────────────────────────
      const channel = supabase
        .channel(`messages:request:${requestId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `request_id=eq.${requestId}`,
          },
          (payload) => {
            if (!isMounted) return;
            const row = payload.new as Record<string, unknown>;

            // Filter internal messages on the client as a safety layer
            if (row.is_internal === true) return;

            const next = mapRow(row);
            setMessages((prev) => [...prev, next]);
            onUpdateRef.current?.(next);
          }
        )
        .subscribe((status) => {
          if (!isMounted) return;
          setIsConnected(status === "SUBSCRIBED");
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const cleanup = bootstrap();

    return () => {
      isMounted = false;
      cleanup.then((fn) => fn?.());
    };
  }, [requestId]);

  return { messages, isConnected };
}

// ─────────────────────────────────────────────────────────────────────────────
// Row mappers — translate snake_case DB columns to camelCase domain types
// ─────────────────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): MessageEntity {
  return {
    id: row.id as string,
    requestId: (row.request_id as string | null) ?? null,
    conversationId: (row.conversation_id as string | null) ?? null,
    threadType: row.thread_type as MessageEntity["threadType"],
    fromRole: row.from_role as MessageEntity["fromRole"],
    fromName: (row.from_name as string | null) ?? "",
    fromId: row.from_id as string,
    fromInitials: (row.from_initials as string | null) ?? "",
    body: row.body as string,
    at: row.at as string,
    isInternal: (row.is_internal as boolean | null) ?? false,
  };
}

function mapRows(rows: Record<string, unknown>[]): MessageEntity[] {
  return rows.map(mapRow);
}
