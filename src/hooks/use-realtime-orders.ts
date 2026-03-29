"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// use-realtime-orders
//
// Subscribes to UPDATE events on the `orders` table for the currently
// authenticated user. Primarily surfaces order status changes in real time.
//
// Returns the current list of orders (newest-first) and a connection status
// flag. Fetches the initial set on mount, then keeps it live via Supabase
// Realtime. Subscription is cleaned up on unmount.
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderEntity {
  id: string;
  userId: string;
  hotelId: string;
  roomNumber: string;
  status: string;
  totalCents: number;
  tip: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseRealtimeOrdersResult {
  orders: OrderEntity[];
  isConnected: boolean;
}

export interface UseRealtimeOrdersOptions {
  /** Called whenever an order is updated (e.g. status changes). */
  onUpdate?: (order: OrderEntity) => void;
}

export function useRealtimeOrders(
  options: UseRealtimeOrdersOptions = {}
): UseRealtimeOrdersResult {
  const { onUpdate } = options;

  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Stable ref so the subscription callback always sees the latest onUpdate
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

      // ── Fetch initial orders ────────────────────────────────────────────
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // Non-fatal: realtime will still deliver updates
        return;
      }

      if (isMounted && data) {
        setOrders(mapRows(data));
      }

      // ── Realtime subscription ───────────────────────────────────────────
      const channel = supabase
        .channel(`orders:user:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (!isMounted) return;
            const next = mapRow(payload.new as Record<string, unknown>);
            setOrders((prev) =>
              prev.map((o) => (o.id === next.id ? next : o))
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

  return { orders, isConnected };
}

// ─────────────────────────────────────────────────────────────────────────────
// Row mapper — translate snake_case DB columns to camelCase domain types
// ─────────────────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): OrderEntity {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    hotelId: row.hotel_id as string,
    roomNumber: (row.room_number as string | null) ?? "",
    status: (row.status as string | null) ?? "pending",
    totalCents: (row.total_cents as number | null) ?? 0,
    tip: (row.tip as number | null) ?? 0,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapRows(rows: Record<string, unknown>[]): OrderEntity[] {
  return rows.map(mapRow);
}
