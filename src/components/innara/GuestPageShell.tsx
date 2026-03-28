import { type ReactNode } from "react";
import { GuestHeader } from "@/components/innara/GuestHeader";
import { GuestBottomNav } from "@/components/innara/GuestBottomNav";
import { cn } from "@/lib/utils";

interface GuestPageShellProps {
  children: ReactNode;
  header?: ReactNode;
  topSlot?: ReactNode;
  footer?: ReactNode;
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
}: GuestPageShellProps): React.ReactElement {
  return (
    <div className="flex flex-col h-full max-h-full max-w-md mx-auto bg-transparent relative overflow-hidden">
      <div className="flex-shrink-0">
        {header ?? <GuestHeader roomNumber={roomNumber} />}
      </div>

      {topSlot ? <div className="flex-shrink-0 px-4 pt-2">{topSlot}</div> : null}

      <main className={cn("flex-1 min-h-0 overflow-y-auto px-4 py-3", mainClassName)}>
        <div className={cn("space-y-6", contentClassName)}>{children}</div>
      </main>

      {footer ? (
        <div className="flex-shrink-0 px-4 pb-2 pt-1.5">{footer}</div>
      ) : null}

      <div className="flex-shrink-0">
        <GuestBottomNav />
      </div>

      {modalSlot}
    </div>
  );
}
