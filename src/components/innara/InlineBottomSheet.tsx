"use client";

import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * A bottom sheet component that renders inline (no portal) to stay within
 * the PhoneFrame container. Use this for guest pages instead of the
 * shadcn Sheet which portals to body.
 */
export function InlineBottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: InlineBottomSheetProps) {
  // Close on escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop - absolute within parent container */}
      <div
        className="absolute inset-0 z-40 bg-black/60 animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet content - slides up from bottom */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl",
          "animate-in slide-in-from-bottom duration-300",
          "max-h-[75%] flex flex-col",
          className
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="px-4 pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              {title && (
                <h3 className="text-lg font-semibold">{title}</h3>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="ml-auto -mr-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        )}

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </>
  );
}
