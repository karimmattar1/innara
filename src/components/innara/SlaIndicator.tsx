"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/constants/app";

interface SlaIndicatorProps {
  createdAt: Date;
  slaMinutes: number;
  status?: RequestStatus;
  size?: "sm" | "md";
}

export function SlaIndicator({ createdAt, slaMinutes, status, size = "sm" }: SlaIndicatorProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Resolved states -- no timer needed
  if (status === "completed" || status === "cancelled") {
    return (
      <span className={cn("text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs")}>
        {status === "completed" ? "Resolved" : "Cancelled"}
      </span>
    );
  }

  const elapsedMs = now - createdAt.getTime();
  const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
  const remainingMin = slaMinutes - elapsedMin;
  const pct = Math.min((elapsedMin / slaMinutes) * 100, 100);
  const overdue = remainingMin < 0;

  // Color based on percentage
  const barColor = overdue || pct > 80 ? "#a35060" : pct > 50 ? "#c4a06a" : "#7aaa8a";

  const label = overdue
    ? `OVERDUE ${Math.abs(remainingMin)}m`
    : `${elapsedMin}m / ${slaMinutes}m`;

  return (
    <div className={cn("flex flex-col gap-1", size === "sm" ? "w-[100px]" : "w-[140px]")}>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
        />
      </div>
      {/* Label */}
      <span
        className={cn(
          "font-medium leading-none",
          size === "sm" ? "text-[10px]" : "text-xs",
          overdue && "font-semibold"
        )}
        style={{ color: barColor }}
      >
        {label}
      </span>
    </div>
  );
}
