"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceOptionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ServiceOptionCard({ icon: Icon, title, description, selected = false, onClick, className }: ServiceOptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card p-4 text-left transition-all",
        selected
          ? "ring-2 ring-primary shadow-md"
          : "hover:shadow-card-hover",
        className,
      )}
    >
      <Icon className="w-6 h-6 text-accent-gold mb-2" />
      <p className="font-medium text-sm">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </button>
  );
}
