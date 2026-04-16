import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "dots" | "pulse";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingState({
  variant = "spinner",
  size = "md",
  text,
  className,
  fullPage = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: { spinner: "w-4 h-4", text: "text-sm" },
    md: { spinner: "w-6 h-6", text: "text-base" },
    lg: { spinner: "w-10 h-10", text: "text-lg" },
  };

  const containerClass = fullPage
    ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    : "flex items-center justify-center";

  if (variant === "spinner") {
    return (
      <div className={cn(containerClass, "gap-3", className)}>
        <Loader2
          className={cn(
            sizeClasses[size].spinner,
            "animate-spin text-primary"
          )}
        />
        {text && (
          <span className={cn(sizeClasses[size].text, "text-muted-foreground")}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn(containerClass, "gap-1", className)}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-primary",
                size === "sm" ? "w-1.5 h-1.5" : size === "md" ? "w-2 h-2" : "w-3 h-3",
                "animate-bounce"
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {text && (
          <span className={cn(sizeClasses[size].text, "text-muted-foreground ml-2")}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn(containerClass, className)}>
        <div
          className={cn(
            "rounded-full bg-primary/20 animate-pulse",
            size === "sm" ? "w-8 h-8" : size === "md" ? "w-12 h-12" : "w-16 h-16"
          )}
        />
      </div>
    );
  }

  // skeleton variant
  return (
    <div className={cn("space-y-3", className)}>
      <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
      <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
    </div>
  );
}

export function LoadingSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted/50 rounded animate-pulse"
          style={{ width: `${65 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted/50 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-muted/50 rounded animate-pulse w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted/50 rounded animate-pulse w-full" />
        <div className="h-3 bg-muted/50 rounded animate-pulse w-4/5" />
      </div>
    </div>
  );
}

export default LoadingState;
