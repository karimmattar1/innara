import { RealtimeStatusBanner } from "./RealtimeStatusBanner";
import { InnaraLogo } from "./Logo";
import { NotificationItem } from "./NotificationItem";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronDown, User, Settings, LogOut, Building2, Check } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useStaffProfile } from "@/hooks/useStaffProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { useInnaraStore } from "@/store/InnaraStoreProvider";
import { getTimeAgo } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  path: string;
}

interface AdminHeaderProps {
  portal: "staff" | "manager" | "admin";
  navItems: NavItem[];
}

export function AdminHeader({ portal, navItems }: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffProfile } = useStaffProfile();
  const { signOut, profile } = useAuth();
  const { hotel, hotels, switchHotel } = useHotel();
  const { getNotifications, getUnreadCount, dispatch: storeDispatch } = useInnaraStore();

  const basePath = portal === "manager" ? "/manager" : "/staff";
  const defaultInitials = portal === "manager" ? "MG" : "ST";
  const defaultName = portal === "manager" ? "Manager" : "Staff";
  const settingsPath = portal === "manager" ? "/manager/settings" : undefined;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/login");
  };

  // Notifications from store
  const audience = portal === "manager" ? "manager" : "staff";
  const hotelId = hotel?.id || '';
  const storeNotifications = getNotifications(hotelId, audience as 'manager' | 'staff');
  const notifications = storeNotifications.map(n => ({
    id: n.id,
    message: n.body || n.title,
    time: getTimeAgo(new Date(n.at)),
    unread: !n.read,
    linkTo: n.linkTo,
  }));
  const unreadCount = getUnreadCount(hotelId, audience as 'manager' | 'staff');

  const markAllRead = () => {
    storeDispatch({
      type: 'MARK_ALL_NOTIFICATIONS_READ',
      payload: { hotelId, audience: audience as 'manager' | 'staff' },
    });
  };

  const displayName = staffProfile?.fullName || profile?.full_name || defaultName;
  const subtitle = portal === "manager"
    ? (staffProfile?.role || "Manager")
    : (staffProfile?.department?.replace("_", " ") || staffProfile?.role || "Staff");

  return (
    <header className="sticky top-0 z-50 mobile-header">
      <RealtimeStatusBanner />
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InnaraLogo size="md" linkTo={basePath} />
            {portal === "manager" && hotels.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-secondary/50 transition-colors text-left">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate max-w-[160px]">{hotel?.name || 'Select Property'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-72 border-none shadow-lg z-50 rounded-2xl"
                  style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.45)' }}
                >
                  <DropdownMenuLabel>Properties</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hotels.map((h) => (
                    <DropdownMenuItem
                      key={h.id}
                      onClick={() => switchHotel(h.id)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.location}</p>
                      </div>
                      {hotel?.id === h.id && (
                        <Check className="w-4 h-4 text-accent-gold shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-accent-gold font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-[#C9A96E] text-white text-[10px] font-bold shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 border-none shadow-lg z-50 rounded-2xl p-0 overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.45)' }}
              >
                <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-accent-gold hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length > 0 ? (
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        message={notif.message}
                        time={notif.time}
                        unread={notif.unread}
                        onClick={() => {
                          storeDispatch({ type: 'MARK_NOTIFICATION_READ', payload: { notificationId: notif.id } });
                          if (notif.linkTo) navigate(notif.linkTo);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-secondary/30 rounded-xl px-2 py-1.5 transition-colors">
                  <Avatar className="w-10 h-10 ring-2 ring-accent-gold/25">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {staffProfile?.initials || defaultInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{subtitle}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-none shadow-lg z-50 rounded-2xl"
                style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.45)' }}
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={settingsPath ? () => navigate(settingsPath) : undefined} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={settingsPath ? () => navigate(settingsPath) : undefined} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
