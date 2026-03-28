"use client";

import { useState } from "react";
import { InnaraLogo } from "./Logo";
import { NotificationItem } from "./NotificationItem";
import { InlineBottomSheet } from "./InlineBottomSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

interface GuestHeaderProps {
  roomNumber?: string;
  guestName?: string;
  guestEmail?: string;
  notifications?: Array<{
    id: string;
    message: string;
    time: string;
    unread: boolean;
  }>;
  onNotificationClick?: (id: string) => void;
}

export function GuestHeader({
  roomNumber = "---",
  guestName,
  guestEmail,
  notifications = [],
  onNotificationClick,
}: GuestHeaderProps): React.ReactElement {
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const initials = guestName
    ? guestName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : guestEmail?.charAt(0).toUpperCase() || "G";

  return (
    <header className="mobile-header sticky top-0 z-50">
      <div className="flex items-center justify-between px-5 py-4">
        <InnaraLogo size="md" linkTo="/" />

        <div className="flex items-center gap-3">
          {roomNumber !== "---" && (
            <span className="room-badge bg-white/40 border border-white/50 px-3 py-1.5 rounded-lg text-[#1a1d3a] text-sm font-semibold">
              Room {roomNumber}
            </span>
          )}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-white/20 border border-white/30"
          >
            <Bell className="w-5 h-5 text-[#1a1d3a]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#a35060] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <Avatar className="w-10 h-10 ring-2 ring-[#9B7340]/50 border-2 border-[#9B7340]">
            <AvatarFallback className="bg-gradient-to-br from-[#1a1d3a] to-[#14182d] text-white text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <InlineBottomSheet open={notifOpen} onOpenChange={setNotifOpen} title="Notifications">
        <div className="space-y-1">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              message={n.message}
              time={n.time}
              unread={n.unread}
              onClick={() => {
                onNotificationClick?.(n.id);
                setNotifOpen(false);
              }}
            />
          ))}
          {notifications.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No notifications yet
            </p>
          )}
        </div>
      </InlineBottomSheet>
    </header>
  );
}
