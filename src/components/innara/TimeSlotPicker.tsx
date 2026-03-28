"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  label: string;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  title?: string;
  className?: string;
}

export function TimeSlotPicker({ slots, selectedId, onSelect, title = "When do you need it?", className }: TimeSlotPickerProps) {
  return (
    <section className={cn("animate-fade-in", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        <Clock className="w-4 h-4 inline mr-1" />
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => onSelect(slot.id)}
            className={cn(
              "glass-card p-4 text-center transition-all",
              selectedId === slot.id
                ? "ring-2 ring-primary shadow-md"
                : "hover:shadow-card-hover",
            )}
          >
            <p className="font-medium text-sm">{slot.label}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
