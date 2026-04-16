import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96]",
  {
    variants: {
      variant: {
        // Primary - Deep navy blue (main CTA)
        default: "bg-[#1a1d3a] text-white border-none rounded-full shadow-lg hover:bg-[#252a4a] hover:-translate-y-0.5 hover:shadow-xl",
        // Destructive - keep red but pill-shaped
        destructive: "bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90",
        // Outline - Icy blue glass with visible blue border (secondary CTA)
        outline: "bg-[#ebf0fa]/40 backdrop-blur-[20px] border-[1.5px] border-[#3b82f6]/35 text-[#1a1d3a] rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:bg-[#e1ebfa]/55 hover:border-[#3b82f6]/50 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(59,130,246,0.15)]",
        // Secondary - Light greyish-blue (supporting actions)
        secondary: "bg-[#6b7280]/15 backdrop-blur-[16px] border border-[#6b7280]/30 text-[#1a1d3a] rounded-full hover:bg-[#6b7280]/25 hover:border-[#6b7280]/50 hover:-translate-y-0.5",
        // Ghost - Transparent with hover
        ghost: "rounded-full hover:bg-[#1a1d3a]/10 hover:text-foreground",
        // Link - Text only with slate accent
        link: "text-[#9B7340] underline-offset-4 hover:underline",
        // Tertiary - Navy outline
        tertiary: "bg-transparent border-[1.5px] border-[#1a1d3a]/40 text-[#1a1d3a] rounded-full hover:bg-[#1a1d3a]/10 hover:border-[#1a1d3a]",
        // Success - Glass with sage accent
        success: "bg-[#7aaa8a]/10 backdrop-blur-sm border-[1.5px] border-[#7aaa8a] text-foreground/80 rounded-full hover:bg-[#7aaa8a]/20 hover:-translate-y-0.5",
        // Info - Glass with steel blue accent
        info: "bg-[#7e9ab8]/10 backdrop-blur-sm border-[1.5px] border-[#7e9ab8] text-foreground/80 rounded-full hover:bg-[#7e9ab8]/20 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-8 py-2",
        sm: "h-9 px-6 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-11 w-11 rounded-full bg-[#1a1d3a]/8 backdrop-blur-[10px] border border-[#1a1d3a]/10 hover:bg-[#1a1d3a]/15 hover:border-[#1a1d3a]/30",
        "icon-sm": "h-8 w-8 rounded-full",
        "icon-lg": "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
