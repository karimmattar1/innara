"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glassButtonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center rounded-full font-semibold tracking-wide transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "border border-white/20 bg-white/[0.08] text-white backdrop-blur-xl hover:bg-white/[0.15] hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
        bronze:
          "border border-bronze/40 bg-bronze/[0.12] text-white backdrop-blur-xl hover:bg-bronze/[0.22] hover:border-bronze/60 hover:shadow-[0_0_30px_rgba(155,115,64,0.3)]",
        ghost:
          "border border-white/10 bg-white/[0.03] text-white/80 backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/20 hover:text-white",
        solid:
          "border-0 bg-gradient-to-r from-bronze to-bronze-light text-white shadow-lg hover:shadow-[0_0_30px_rgba(155,115,64,0.4)] hover:brightness-110",
      },
      size: {
        sm: "px-4 py-2 text-sm gap-2",
        default: "px-6 py-3 text-base gap-2.5",
        lg: "px-8 py-4 text-lg gap-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  glow?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, glow, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          glassButtonVariants({ variant, size }),
          glow && "shadow-[0_0_20px_rgba(155,115,64,0.2)]",
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Shine sweep on hover */}
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </span>
        <span className="relative flex items-center gap-inherit">{children}</span>
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };
