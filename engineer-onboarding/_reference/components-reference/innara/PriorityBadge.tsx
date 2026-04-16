import { PRIORITY_CONFIG, type RequestPriority } from "@/lib/constants";

const PRIORITY_DOT_COLORS: Record<string, string> = {
  urgent: '#a35060',
  high: '#c4a06a',
  medium: '#7e9ab8',
  low: '#9ca3af',
};

export function PriorityBadge({ priority }: { priority: RequestPriority | string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full w-[90px] bg-secondary/50 backdrop-blur-sm border border-border/30 text-foreground/70">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_DOT_COLORS[priority] || '#9ca3af' }} />
      {PRIORITY_CONFIG[priority as RequestPriority]?.label || priority}
    </span>
  );
}
