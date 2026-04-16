import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceGridItem {
  icon: LucideIcon;
  title: string;
  to: string;
  id?: string;
  color: 'slate' | 'blue' | 'green' | 'purple' | 'rose' | 'teal';
  subtitle?: string;
}

interface ServiceGridProps {
  items: ServiceGridItem[];
  onItemClick?: (to: string) => void;
}

// Luxury standard: keep icon accent consistent (slate) and avoid rainbow UI.
// We keep the keys to avoid refactors elsewhere, but they intentionally map to the same styling.
const colorClasses = {
    slate: 'from-accent/70 to-accent/30 text-accent-gold',
  blue: 'from-accent/70 to-accent/30 text-accent-gold',
  green: 'from-accent/70 to-accent/30 text-accent-gold',
  purple: 'from-accent/70 to-accent/30 text-accent-gold',
  rose: 'from-accent/70 to-accent/30 text-accent-gold',
  teal: 'from-accent/70 to-accent/30 text-accent-gold',
};

export function ServiceGrid({ items, onItemClick }: ServiceGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map(({ icon: Icon, title, to, color, id, subtitle }) => {
        const content = (
          <div className="glass-card p-5 flex flex-col items-center gap-3 text-center h-full group">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <Icon className="w-6 h-6" />
            </div>
            <span className="font-medium text-sm text-foreground">{title}</span>
            {subtitle && <span className="text-[10px] text-muted-foreground -mt-1.5">{subtitle}</span>}
          </div>
        );

        if (onItemClick) {
          return (
            <button
              key={to}
              data-service-id={id}
              onClick={() => onItemClick(to)}
              className="text-left"
            >
              {content}
            </button>
          );
        }

        return (
          <Link key={to} to={to} data-service-id={id}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
