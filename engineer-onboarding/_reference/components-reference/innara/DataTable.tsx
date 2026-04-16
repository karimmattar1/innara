import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T, index: number) => void;
  highlightFirst?: boolean;
  highlightCondition?: (item: T, index: number) => boolean;
  gridTemplate?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  skeletonRows = 5,
  emptyState,
  onRowClick,
  highlightFirst = false,
  highlightCondition,
  gridTemplate,
  className,
}: DataTableProps<T>) {
  const gridCols = gridTemplate || `repeat(${columns.length}, 1fr)`;
  if (loading) {
    return (
      <div className={cn("table-container", className)}>
        <div className="table-header">
          <div className="grid" style={{ gridTemplateColumns: gridCols }}>
            {columns.map((col) => (
              <div key={col.key} className={cn("table-header-text", col.className)}>
                {col.header}
              </div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border/20">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="px-6 py-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("table-container", className)}>
      <div className="hidden sm:block">
        <div className="table-header">
          <div className="grid px-6" style={{ gridTemplateColumns: gridCols }}>
            {columns.map((col) => (
              <div key={col.key} className={cn("table-header-text", col.className)}>
                {col.header}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="divide-y divide-border/20">
        {data.map((item, idx) => {
          const isHighlighted = highlightCondition
            ? highlightCondition(item, idx)
            : highlightFirst && idx === 0;

          return (
            <div
              key={idx}
              onClick={onRowClick ? () => onRowClick(item, idx) : undefined}
              className={cn(
                "request-row border-b border-border/20 last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-secondary/30",
                isHighlighted && "bg-accent-gold/5",
              )}
            >
              <div className="grid px-6" style={{ gridTemplateColumns: gridCols }}>
                {columns.map((col) => (
                  <div key={col.key} className={cn("py-4", col.className)}>
                    {col.render(item, idx)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
