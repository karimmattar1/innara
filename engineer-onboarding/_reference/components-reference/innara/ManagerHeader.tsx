import { InnaraLogo } from "./Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useStaffProfile } from "@/hooks/useStaffProfile";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: 'Dashboard', path: '/manager' },
  { label: 'Analytics', path: '/manager/analytics' },
  { label: 'Catalog', path: '/manager/catalog' },
  { label: 'Staff', path: '/manager/staff' },
];

export function ManagerHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffProfile } = useStaffProfile();
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  // Mock notifications for now
  const notifications = [
    { id: '1', message: 'New staff member registered', time: '5m ago' },
    { id: '2', message: 'SLA threshold breached - Housekeeping', time: '12m ago' },
  ];

  return (
    <header className="sticky top-0 z-50 mobile-header">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center">
            <InnaraLogo size="md" linkTo="/manager" />
          </div>

          {/* Nav - Center */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map(({ label, path }) => {
              const isActive = location.pathname === path;

              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-accent-slate font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {notifications.length}
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-card border-border z-50">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start py-3 cursor-pointer">
                      <span className="text-sm">{notif.message}</span>
                      <span className="text-xs text-muted-foreground">{notif.time}</span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-secondary/30 rounded-xl px-2 py-1.5 transition-colors">
                  <Avatar className="w-10 h-10 ring-2 ring-accent-slate/25">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {staffProfile?.initials || 'MG'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{staffProfile?.fullName || profile?.full_name || 'Manager'}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {staffProfile?.role || 'Manager'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/manager/settings')} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/manager/settings')} className="cursor-pointer">
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

