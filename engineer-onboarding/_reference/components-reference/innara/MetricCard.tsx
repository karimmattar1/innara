import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  subtext?: string;
  icon: LucideIcon;
  variant: 'happiness' | 'revenue' | 'time' | 'requests' | 'guests';
}

const variantClasses = {
  happiness: 'metric-happiness',
  revenue: 'metric-revenue',
  time: 'metric-time',
  requests: 'metric-requests',
  guests: 'metric-guests',
};

const iconColors = {
  happiness: 'text-[#9B7340]',
  revenue: 'text-[#7aaa8a]',
  time: 'text-[#1a1d3a]',
  requests: 'text-[#7e9ab8]',
  guests: 'text-[#7e9ab8]',
};

export function MetricCard({ title, value, change, changeLabel, subtext, icon: Icon, variant }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  // Format change value to avoid ugly decimals
  const formattedChange = change !== undefined
    ? (Number.isInteger(change) ? change : Math.round(change * 10) / 10)
    : undefined;

  return (
    <div className={`metric-card ${variantClasses[variant]} rounded-2xl p-6 relative overflow-hidden`}>
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#9B7340]/10 rounded-full transform translate-x-8 -translate-y-8 opacity-30" />
      
      <div className={`metric-icon ${iconColors[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider mb-1">
        {title}
      </p>
      
      <p className="text-3xl font-semibold text-foreground tracking-tight font-serif">
        {value}
      </p>
      
      {formattedChange !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {variant === 'time' ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-[#7aaa8a]" />
              <span className="text-xs text-[#7aaa8a] font-semibold">
                {Math.abs(formattedChange)} min vs yesterday
              </span>
            </>
          ) : isPositive ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-[#7aaa8a]" />
              <span className="text-xs text-[#7aaa8a] font-semibold">
                +{formattedChange}{changeLabel || ''} {subtext || ''}
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-[#a35060]" />
              <span className="text-xs text-[#a35060] font-semibold">
                {formattedChange}{changeLabel || ''} {subtext || ''}
              </span>
            </>
          )}
        </div>
      )}
      
      {subtext && formattedChange === undefined && (
        <p className="text-[10px] text-foreground/40 mt-2">{subtext}</p>
      )}
    </div>
  );
}
