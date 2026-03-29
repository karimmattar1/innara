"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RequestEntity } from "@/types/domain";

// ─────────────────────────────────────────────────────────────────────────────
// use-realtime-requests
//
// Subscribes to INSERT and UPDATE events on the `requests` table for the
// currently authenticated user. Returns the current list of requests and a
// connection status flag.
//
// The hook fetches the initial list on mount, then keeps it in sync via
// Supabase Realtime. Subscription is cleaned up on unmount.
// ─────────────────────────────────────────────────────────────────────────────

export interface UseRealtimeRequestsResult {
  requests: RequestEntity[];
  isConnected: boolean;
}

export interface UseRealtimeRequestsOptions {
  /** Called whenever a request is inserted or updated. */
  onUpdate?: (request: RequestEntity) => void;
}

export function useRealtimeRequests(
  options: UseRealtimeRequestsOptions = {}
): UseRealtimeRequestsResult {
  const { onUpdate } = options;

  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Stable ref so the subscription callback always sees the latest onUpdate
  // without needing to re-subscribe on every render.
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let userId: string | null = null;

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;
      userId = user.id;

      // ── Fetch initial data ──────────────────────────────────────────────
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // Non-fatal: the realtime channel will still deliver future events
        return;
      }

      if (isMounted && data) {
        setRequests(mapRows(data));
      }

      // ── Realtime subscription ───────────────────────────────────────────
      const channel = supabase
        .channel(`requests:user:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "requests",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!isMounted) return;
            const next = mapRow(payload.new as Record<string, unknown>);
            setRequests((prev) => [next, ...prev]);
            onUpdateRef.current?.(next);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "requests",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!isMounted) return;
            const next = mapRow(payload.new as Record<string, unknown>);
            setRequests((prev) =>
              prev.map((r) => (r.id === next.id ? next : r))
            );
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
  }, []);

  return { requests, isConnected };
}

// ─────────────────────────────────────────────────────────────────────────────
// Row mappers — translate snake_case DB columns to camelCase domain types
// ─────────────────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): RequestEntity {
  return {
    id: row.id as string,
    hotelId: row.hotel_id as string,
    userId: row.user_id as string,
    guestName: (row.guest_name as string | null) ?? "",
    roomNumber: (row.room_number as string | null) ?? "",
    category: row.category as RequestEntity["category"],
    item: (row.item as string | null) ?? "",
    description: (row.description as string | null) ?? "",
    priority: row.priority as RequestEntity["priority"],
    status: row.status as RequestEntity["status"],
    etaMinutes: (row.eta_minutes as number | null) ?? null,
    assignedStaffId: (row.assigned_staff_id as string | null) ?? null,
    assignedStaffName: (row.assigned_staff_name as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    confirmationNumber: (row.confirmation_number as string | null) ?? null,
    paymentMethod: (row.payment_method as string | null) ?? null,
    chargeStatus: (row.charge_status as string | null) ?? null,
    chargeAmountCents: (row.charge_amount_cents as number | undefined) ?? undefined,
    slaBreachedNotified:
      (row.sla_breached_notified as boolean | undefined) ?? undefined,
    photoUrls: (row.photo_urls as string[] | null) ?? undefined,
    internalNotes: (row.internal_notes as string[] | null) ?? undefined,
    guestUpdates: (row.guest_updates as string[] | null) ?? undefined,
  };
}

function mapRows(rows: Record<string, unknown>[]): RequestEntity[] {
  return rows.map(mapRow);
}
