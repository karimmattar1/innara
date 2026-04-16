import { RealtimeStatusBanner } from "./RealtimeStatusBanner";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InnaraLogo } from "./Logo";
import { NotificationItem } from "./NotificationItem";
import { InlineBottomSheet } from "./InlineBottomSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { useInnaraStore } from "@/store/InnaraStoreProvider";
import { getTimeAgo } from "@/lib/utils";

interface GuestHeaderProps {
  roomNumber?: string;
}

export function GuestHeader({ roomNumber: propRoomNumber }: GuestHeaderProps) {
  const { profile, user, role } = useAuth();
  const { stay, hotel, refetchStay } = useHotel();
  const { getNotifications, getUnreadCount, dispatch: storeDispatch } = useInnaraStore();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const hotelId = hotel?.id || '';
  const storeNotifications = getNotifications(hotelId, 'guest');
  const notifications = storeNotifications.map(n => ({
    id: n.id,
    message: n.body || n.title,
    time: getTimeAgo(new Date(n.at)),
    unread: !n.read,
    linkTo: n.linkTo,
  }));

  const unreadCount = getUnreadCount(hotelId, 'guest');

  useEffect(() => {
    if (user && role === "guest" && !stay) {
      refetchStay();
    }
  }, [user, role, stay, refetchStay]);

  // Use stay room number, prop override, or fallback
  const roomNumber = stay?.roomNumber || propRoomNumber || '---';

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || 'G';

  return (
    <header className="mobile-header sticky top-0 z-50">
      <RealtimeStatusBanner />
      <div className="flex items-center justify-between px-5 py-4">
        <InnaraLogo size="md" linkTo="/guest" />

        <div className="flex items-center gap-3">
          {roomNumber !== '---' && (
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
                storeDispatch({ type: 'MARK_NOTIFICATION_READ', payload: { notificationId: n.id } });
                if (n.linkTo) {
                  setNotifOpen(false);
                  navigate(n.linkTo);
                }
              }}
            />
          ))}
        </div>
      </InlineBottomSheet>
    </header>
  );
}
