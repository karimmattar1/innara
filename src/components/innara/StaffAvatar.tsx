import { cn } from "@/lib/utils";

interface StaffAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const sizeClasses = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

export function StaffAvatar({
  name,
  size = "md",
  showName = false,
  className,
}: StaffAvatarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full bg-secondary/60 backdrop-blur-sm border border-border/30 flex items-center justify-center font-semibold text-foreground shrink-0",
          sizeClasses[size]
        )}
      >
        {getInitials(name)}
      </div>
      {showName && <span className="text-sm font-medium">{name}</span>}
    </div>
  );
}
