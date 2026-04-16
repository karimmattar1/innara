import { ReactNode } from "react";
import { GuestHeader } from "@/components/innara/GuestHeader";
import { GuestBottomNav } from "@/components/innara/GuestBottomNav";
import { cn } from "@/lib/utils";

interface GuestPageShellProps {
  children: ReactNode;
  header?: ReactNode;
  topSlot?: ReactNode;
  footer?: ReactNode;
  /** Slot for modals/sheets that need to render above content but within the phone frame */
  modalSlot?: ReactNode;
  roomNumber?: string;
  mainClassName?: string;
  contentClassName?: string;
}

export function GuestPageShell({
  children,
  header,
  topSlot,
  footer,
  modalSlot,
  roomNumber,
  mainClassName,
  contentClassName,
}: GuestPageShellProps) {
  return (
    <div className="flex flex-col h-full max-h-full max-w-md mx-auto bg-transparent relative overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0">
        {header ?? <GuestHeader roomNumber={roomNumber} />}
      </div>

      {topSlot ? <div className="flex-shrink-0 px-4 pt-2">{topSlot}</div> : null}

      {/* Scrollable main content */}
      <main className={cn("flex-1 min-h-0 overflow-y-auto px-4 py-3", mainClassName)}>
        <div className={cn("space-y-6", contentClassName)}>{children}</div>
      </main>

      {/* Fixed footer */}
      {footer ? (
        <div className="flex-shrink-0 px-4 pb-2 pt-1.5">
          {footer}
        </div>
      ) : null}

      {/* Fixed bottom nav */}
      <div className="flex-shrink-0">
        <GuestBottomNav />
      </div>

      {/* Modal slot - renders above everything but within the phone frame */}
      {modalSlot}
    </div>
  );
}
