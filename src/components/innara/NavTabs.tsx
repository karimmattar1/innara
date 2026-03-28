"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavTab {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface NavTabsProps {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function NavTabs({ tabs, activeTab, onTabChange, variant = "pill", className }: NavTabsProps) {
  if (variant === "underline") {
    return (
      <div className={cn("flex gap-6 border-b border-border", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "pb-3 text-sm font-medium transition-all relative flex items-center gap-2",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-xs ml-1">({tab.count})</span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex gap-1 bg-secondary/30 backdrop-blur-sm rounded-2xl p-1 border border-border/20 overflow-x-auto",
      className,
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              isActive
                ? "bg-white/70 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/30",
            )}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn("text-xs", isActive ? "text-foreground/60" : "text-muted-foreground/70")}>
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
