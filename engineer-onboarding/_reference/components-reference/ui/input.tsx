import * as React from "react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "glass";
  icon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", icon: Icon, ...props }, ref) => {
    const variantClasses = {
      default: "bg-white border-border/60",
      glass: "bg-white/90 backdrop-blur-sm border-white/60",
    };

    if (Icon) {
      return (
        <div className="relative">
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-xl border px-5 pl-11 py-3 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340]/30 focus-visible:border-[#9B7340]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 md:text-sm",
              variantClasses[variant],
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border px-5 py-3 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340]/30 focus-visible:border-[#9B7340]/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 md:text-sm",
          variantClasses[variant],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
