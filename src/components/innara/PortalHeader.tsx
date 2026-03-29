"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { InnaraLogo } from "./Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationDrawer } from "@/components/innara/NotificationDrawer";

interface NavItem {
  label: string;
  path: string;
}

interface PortalHeaderProps {
  portal: "staff" | "manager" | "admin";
  navItems: NavItem[];
  userName?: string;
  userInitials?: string;
  userSubtitle?: string;
  notificationCount?: number;
  onSignOut?: () => void;
  settingsPath?: string;
}

export function PortalHeader({
  portal,
  navItems,
  userName,
  userInitials,
  userSubtitle,
  notificationCount = 0,
  onSignOut,
  settingsPath,
}: PortalHeaderProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const notifications = useNotifications();

  const basePath = `/${portal === "admin" ? "admin" : portal}`;
  const defaultInitials = portal === "manager" ? "MG" : portal === "admin" ? "AD" : "ST";
  const defaultName = portal.charAt(0).toUpperCase() + portal.slice(1);
  const effectiveNotificationCount = notifications.unreadCount > 0 ? notifications.unreadCount : (notificationCount ?? 0);

  const handleSignOut = () => {
    onSignOut?.();
    router.push("/auth/staff/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <InnaraLogo size="md" variant="light" linkTo={basePath} />
          </div>

          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map(({ label, path }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  href={path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={notifications.toggle}
              className="relative p-2.5 rounded-xl hover:bg-secondary/50 transition-colors"
              aria-label={`Notifications${effectiveNotificationCount > 0 ? ` (${effectiveNotificationCount} unread)` : ""}`}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {effectiveNotificationCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {effectiveNotificationCount}
                </Badge>
              )}
            </button>
            <NotificationDrawer
              open={notifications.isOpen}
              onOpenChange={(isOpen) => { if (!isOpen) notifications.close(); }}
              variant={portal === "staff" || portal === "manager" ? "dark" : "light"}
            />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-secondary/30 rounded-xl px-2 py-1.5 transition-colors">
                  <Avatar className="w-10 h-10 ring-2 ring-primary/25">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {userInitials || defaultInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{userName || defaultName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {userSubtitle || portal}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {settingsPath && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push(settingsPath)}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(settingsPath)}
                      className="cursor-pointer"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
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
