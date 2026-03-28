import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: "card" | "premium" | "panel";
  hover?: boolean;
  selected?: boolean;
}

const tierClasses = {
  card: "glass-card",
  premium: "glass-premium",
  panel: "glass-panel",
} as const;

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, tier = "card", hover = true, selected = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          tierClasses[tier],
          !hover && "[&]:hover:transform-none [&]:hover:shadow-none",
          selected && "ring-2 ring-[#9B7340]/25 border-[#9B7340]/20",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
