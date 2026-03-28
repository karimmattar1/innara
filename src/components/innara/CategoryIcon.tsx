import { cn } from "@/lib/utils";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/constants/app";
import type { RequestCategory } from "@/constants/app";
import {
  Bed,
  Wrench,
  Utensils,
  Phone,
  Car,
  Flower2,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

interface CategoryIconProps {
  category: RequestCategory;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "filled" | "outline";
  className?: string;
  showLabel?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Bed,
  Wrench,
  Utensils,
  Phone,
  Car,
  Flower2,
  ClipboardList,
};

const categoryLabels: Record<RequestCategory, string> = {
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  room_service: "Room Service",
  concierge: "Concierge",
  valet: "Valet",
  spa: "Spa",
  other: "Other",
};

export function CategoryIcon({
  category,
  size = "md",
  variant = "default",
  className,
  showLabel = false,
}: CategoryIconProps) {
  const iconName = CATEGORY_ICONS[category];
  const Icon = iconMap[iconName] || ClipboardList;
  const colors = CATEGORY_COLORS[category];

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const containerSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  if (variant === "default") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon className={cn(sizeClasses[size], colors.text)} />
        {showLabel && (
          <span className={cn("text-sm font-medium", colors.text)}>
            {categoryLabels[category]}
          </span>
        )}
      </div>
    );
  }

  if (variant === "filled") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div
          className={cn(
            "rounded-xl flex items-center justify-center",
            containerSizes[size],
            colors.iconBg
          )}
        >
          <Icon className={cn(sizeClasses[size], colors.text)} />
        </div>
        {showLabel && (
          <span className={cn("text-sm font-medium", colors.text)}>
            {categoryLabels[category]}
          </span>
        )}
      </div>
    );
  }

  // outline variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-xl flex items-center justify-center border",
          containerSizes[size],
          colors.bg,
          colors.border
        )}
      >
        <Icon className={cn(sizeClasses[size], colors.text)} />
      </div>
      {showLabel && (
        <span className={cn("text-sm font-medium", colors.text)}>
          {categoryLabels[category]}
        </span>
      )}
    </div>
  );
}

export function getCategoryIcon(category: RequestCategory): LucideIcon {
  const iconName = CATEGORY_ICONS[category];
  return iconMap[iconName] || ClipboardList;
}

export default CategoryIcon;
