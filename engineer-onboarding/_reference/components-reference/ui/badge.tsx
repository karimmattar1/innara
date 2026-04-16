import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-2xl px-4 py-1.5 text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default - Slate accent for NEW/Featured
        default: "bg-gradient-to-br from-[#9B7340] to-[#94A3B8] text-[#1a1d3a] border-none",
        // Completed/Confirmed - Green
        success: "bg-[#4CAF50]/15 border border-[#4CAF50]/30 text-[#4CAF50]",
        // In Progress - Orange
        warning: "bg-[#FF5722]/15 border border-[#FF5722]/30 text-[#FF5722]",
        // Pending/New - Yellow
        pending: "bg-[#FFC107]/15 border border-[#FFC107]/30 text-[#FFC107]",
        // Secondary - Subtle glass
        secondary: "bg-white/10 backdrop-blur-sm border border-white/20 text-foreground",
        // Destructive
        destructive: "bg-destructive/15 border border-destructive/30 text-destructive",
        // Outline - Simple border
        outline: "border border-foreground/20 text-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
