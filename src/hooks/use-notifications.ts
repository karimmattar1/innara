"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// use-notifications
//
// Manages notification drawer open/close state and polls for the unread count
// every 30 seconds. Designed to be consumed by portal headers (StaffHeader,
// ManagerHeader, GuestHeader) to display the bell-icon badge.
//
// Usage:
//   const { unreadCount, isOpen, open, close, toggle } = useNotifications();
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000;

async function fetchUnreadCount(): Promise<number> {
  try {
    const mod = await import("@/app/actions/notifications");
    const result = await mod.getUnreadCount();
    // getUnreadCount returns ActionResult<{ count: number }>
    if (result.success && result.data && typeof result.data.count === "number") {
      return result.data.count;
    }
    return 0;
  } catch {
    return 0;
  }
}

export interface UseNotificationsResult {
  /** Number of unread notifications. Polled every 30 seconds. */
  unreadCount: number;
  /** Whether the notification drawer is currently open. */
  isOpen: boolean;
  /** Open the notification drawer. */
  open: () => void;
  /** Close the notification drawer. */
  close: () => void;
  /** Toggle the notification drawer open/closed. */
  toggle: () => void;
  /** Force an immediate refresh of the unread count. */
  refreshCount: () => void;
}

export function useNotifications(): UseNotificationsResult {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshCount = useCallback(() => {
    fetchUnreadCount().then((count) => {
      setUnreadCount(count);
    });
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    // Fetch immediately on mount
    refreshCount();

    // Poll every 30 seconds
    intervalRef.current = setInterval(() => {
      refreshCount();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshCount]);

  // Refresh count when drawer closes (user may have read notifications)
  useEffect(() => {
    if (!isOpen) {
      refreshCount();
    }
  }, [isOpen, refreshCount]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { unreadCount, isOpen, open, close, toggle, refreshCount };
}
