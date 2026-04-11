"use client";

import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Offline queue — stores failed requests in localStorage, replays on reconnect
// ---------------------------------------------------------------------------

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: string;
  timestamp: number;
}

const QUEUE_KEY = "innara-offline-queue";

function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineQueue(): {
  isOnline: boolean;
  queueSize: number;
  enqueue: (url: string, method: string, body: string) => void;
} {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queueSize, setQueueSize] = useState(0);

  // Sync queue from storage on mount
  useEffect(() => {
    setQueueSize(getQueue().length);
  }, []);

  // Online/offline listeners
  useEffect(() => {
    function handleOnline(): void {
      setIsOnline(true);
      replayQueue();
    }
    function handleOffline(): void {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for SW sync messages
    function handleMessage(event: MessageEvent): void {
      if (event.data?.type === "SYNC_OFFLINE_REQUESTS") {
        replayQueue();
      }
    }
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  async function replayQueue(): Promise<void> {
    const queue = getQueue();
    if (queue.length === 0) return;

    const remaining: QueuedRequest[] = [];

    for (const req of queue) {
      try {
        await fetch(req.url, {
          method: req.method,
          headers: { "Content-Type": "application/json" },
          body: req.body,
        });
      } catch {
        remaining.push(req);
      }
    }

    saveQueue(remaining);
    setQueueSize(remaining.length);
  }

  const enqueue = useCallback(
    (url: string, method: string, body: string) => {
      const queue = getQueue();
      const entry: QueuedRequest = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        method,
        body,
        timestamp: Date.now(),
      };
      queue.push(entry);
      saveQueue(queue);
      setQueueSize(queue.length);

      // Request background sync if available
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((reg) => {
          (reg as unknown as { sync: { register(tag: string): Promise<void> } }).sync
            .register("innara-offline-requests")
            .catch(() => {
              // Sync registration failed — will replay on next online event
            });
        });
      }
    },
    [],
  );

  return { isOnline, queueSize, enqueue };
}
