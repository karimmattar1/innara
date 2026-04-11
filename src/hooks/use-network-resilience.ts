"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Network resilience hook — monitors connectivity and provides retry logic
// with exponential backoff for failed requests
// ---------------------------------------------------------------------------

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
};

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  reconnectedAt: Date | null;
}

export function useNetworkResilience(config: Partial<RetryConfig> = {}): {
  network: NetworkState;
  fetchWithRetry: <T>(
    url: string,
    options?: RequestInit,
  ) => Promise<T>;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const [network, setNetwork] = useState<NetworkState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
    reconnectedAt: null,
  });

  const wasOfflineRef = useRef(false);

  useEffect(() => {
    function handleOnline(): void {
      const now = new Date();
      setNetwork((prev) => ({
        isOnline: true,
        wasOffline: wasOfflineRef.current,
        lastOnlineAt: now,
        reconnectedAt: wasOfflineRef.current ? now : prev.reconnectedAt,
      }));
      wasOfflineRef.current = false;
    }

    function handleOffline(): void {
      wasOfflineRef.current = true;
      setNetwork((prev) => ({
        ...prev,
        isOnline: false,
      }));
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchWithRetry = useCallback(
    async <T>(url: string, options?: RequestInit): Promise<T> => {
      let attempt = 0;
      let lastError: Error | null = null;

      while (attempt <= mergedConfig.maxRetries) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return (await response.json()) as T;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          attempt++;

          if (attempt > mergedConfig.maxRetries) break;

          // Exponential backoff with jitter
          const delay = Math.min(
            mergedConfig.baseDelay * Math.pow(2, attempt - 1) +
              Math.random() * 1000,
            mergedConfig.maxDelay,
          );

          // Wait for delay or until we come back online
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, delay);

            // If we're offline, wait for online event instead
            if (!navigator.onLine) {
              const onOnline = (): void => {
                clearTimeout(timer);
                window.removeEventListener("online", onOnline);
                resolve();
              };
              window.addEventListener("online", onOnline);
            }
          });
        }
      }

      throw lastError ?? new Error("Max retries exceeded");
    },
    [mergedConfig.maxRetries, mergedConfig.baseDelay, mergedConfig.maxDelay],
  );

  return { network, fetchWithRetry };
}
