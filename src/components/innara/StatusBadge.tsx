import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/constants/app";
import type { RequestStatus } from "@/constants/app";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: RequestStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showDot?: boolean;
  className?: string;
}

const statusIcons = {
  new: Clock,
  pending: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export function StatusBadge({
  status,
  size = "md",
  showIcon = false,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = statusIcons[status];

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs gap-1.5 w-[100px] justify-center",
    md: "px-3 py-1 text-sm gap-1.5 w-[110px] justify-center",
    lg: "px-4 py-1.5 text-base gap-2 w-[120px] justify-center",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        "bg-secondary/50 backdrop-blur-sm border border-border/30 text-foreground/70",
        sizeClasses[size],
        className
      )}
    >
      {showDot && !showIcon && (
        <span
          className={cn("rounded-full shrink-0", dotSizes[size])}
          style={{ backgroundColor: config.dotColor }}
        />
      )}
      {showIcon && Icon && (
        <Icon
          className={cn(
            iconSizes[size],
            "opacity-60",
            status === "in_progress" && "animate-spin"
          )}
        />
      )}
      {config.label}
    </span>
  );
}

export default StatusBadge;
