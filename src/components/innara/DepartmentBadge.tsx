import { cn } from "@/lib/utils";

const DEPARTMENT_LABELS: Record<string, string> = {
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  fb: "F&B",
  room_service: "Room Service",
  concierge: "Concierge",
  valet: "Valet",
  spa: "Spa",
  front_desk: "Front Desk",
};

const DEPARTMENT_DOT_COLORS: Record<string, string> = {
  housekeeping: '#7e9ab8',
  maintenance: '#c4a06a',
  fb: '#C9A96E',
  room_service: '#C9A96E',
  concierge: '#7aaa8a',
  valet: '#8b7d6b',
  spa: '#a35060',
  front_desk: '#9ca3af',
};

interface DepartmentBadgeProps {
  department: string;
  className?: string;
}

export function DepartmentBadge({ department, className }: DepartmentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full w-[110px] whitespace-nowrap",
        "bg-secondary/50 backdrop-blur-sm border border-border/30 text-foreground/70",
        className,
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: DEPARTMENT_DOT_COLORS[department] || '#9ca3af' }}
      />
      {DEPARTMENT_LABELS[department] || department}
    </span>
  );
}
