"use client";

interface NotificationItemProps {
  message: string;
  time: string;
  unread?: boolean;
  onClick?: () => void;
}

export function NotificationItem({ message, time, unread = false, onClick }: NotificationItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
    >
      <div
        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          unread ? "bg-[#C9A96E]" : "bg-transparent"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${unread ? "font-medium" : "text-muted-foreground"}`}>
          {message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </button>
  );
}
