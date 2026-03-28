import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ========================================
// Icon Wrapper — standardized icon rendering
// ========================================

const sizeClasses = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
} as const;

const colorClasses = {
  default: "text-foreground",
  accent: "text-accent-gold",
  muted: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  pending: "text-pending",
  destructive: "text-destructive",
  info: "text-info",
} as const;

interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof sizeClasses;
  color?: keyof typeof colorClasses;
  className?: string;
}

function Icon({ icon: LucideIcon, size = "md", color = "default", className }: IconProps) {
  return (
    <LucideIcon
      className={cn(sizeClasses[size], colorClasses[color], className)}
      strokeWidth={1.75}
    />
  );
}

// ========================================
// Icon Container — icon with background box
// ========================================

const containerSizeClasses = {
  sm: "w-8 h-8 rounded-lg",
  md: "w-10 h-10 rounded-xl",
  lg: "w-12 h-12 rounded-xl",
  xl: "w-14 h-14 rounded-xl",
} as const;

const containerIconSizes: Record<keyof typeof containerSizeClasses, keyof typeof sizeClasses> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "lg",
};

const containerVariantClasses = {
  accent: "bg-[#9B7340]/10 text-[#9B7340]",
  navy: "bg-[#1a1d3a]/8 text-[#1a1d3a]",
  muted: "bg-secondary text-muted-foreground",
} as const;

interface IconContainerProps {
  icon: LucideIcon;
  size?: keyof typeof containerSizeClasses;
  variant?: keyof typeof containerVariantClasses;
  className?: string;
}

function IconContainer({ icon: LucideIcon, size = "md", variant = "accent", className }: IconContainerProps) {
  const iconSize = containerIconSizes[size];
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        containerSizeClasses[size],
        containerVariantClasses[variant],
        className,
      )}
    >
      <LucideIcon className={sizeClasses[iconSize]} strokeWidth={1.75} />
    </div>
  );
}

export { Icon, IconContainer };
