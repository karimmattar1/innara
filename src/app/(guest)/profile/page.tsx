"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  CalendarDays,
  BedDouble,
  ClipboardList,
  ShoppingBag,
  MessageSquare,
  Bell,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import type { GuestNotificationPrefs } from "@/types/domain";

// ---------------------------------------------------------------------------
// Placeholder guest context — real data comes from auth/stay context server action
// ---------------------------------------------------------------------------

const PLACEHOLDER_GUEST = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  roomNumber: "412",
  checkIn: "Mar 27, 2026",
  checkOut: "Mar 31, 2026",
  roomType: "Deluxe King Suite",
} as const;

// ---------------------------------------------------------------------------
// Quick links config
// ---------------------------------------------------------------------------

interface QuickLink {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    icon: ClipboardList,
    label: "My Requests",
    description: "View and track your service requests",
    href: "/guest/requests",
  },
  {
    icon: ShoppingBag,
    label: "Order History",
    description: "Previous room service orders",
    href: "/guest/room-service",
  },
  {
    icon: MessageSquare,
    label: "Share Feedback",
    description: "Rate your experience",
    href: "/guest/feedback",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GuestProfilePage(): React.ReactElement {
  const router = useRouter();

  const [notifPrefs, setNotifPrefs] = useState<GuestNotificationPrefs>({
    requestUpdates: true,
    staffMessages: true,
    promotions: false,
    emailNotifications: true,
  });

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Sign out
  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setSignOutError("Failed to sign out. Please try again.");
        setIsSigningOut(false);
        return;
      }

      router.push("/auth/guest/login");
    } catch {
      setSignOutError("Something went wrong. Please try again.");
      setIsSigningOut(false);
    }
  }

  // Toggle notification preference (visual only — real persistence comes later)
  function togglePref(key: keyof GuestNotificationPrefs) {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const initials = PLACEHOLDER_GUEST.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <GuestPageShell
      header={
        <div className="px-5 pt-2 pb-1">
          <h1 className="text-2xl font-semibold text-[#1a1d3a]">Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your stay details and preferences</p>
        </div>
      }
    >
      {/* Guest info card */}
      <section>
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1a1d3a] to-[#14182d] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-semibold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-[#1a1d3a]">{PLACEHOLDER_GUEST.name}</h2>
              <p className="text-sm text-muted-foreground truncate">{PLACEHOLDER_GUEST.email}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-[#1a1d3a]/5 border border-[#1a1d3a]/10 px-3 py-1.5 rounded-lg">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                  Room
                </p>
                <p className="text-sm font-bold text-[#1a1d3a]">{PLACEHOLDER_GUEST.roomNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stay summary */}
      <section>
        <SectionHeader title="Your Stay" />
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9B7340]/10 flex items-center justify-center flex-shrink-0">
              <BedDouble className="w-4 h-4 text-[#9B7340]" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                Room Type
              </p>
              <p className="text-sm font-medium text-foreground">{PLACEHOLDER_GUEST.roomType}</p>
            </div>
          </div>
          <div className="border-t border-border/20 pt-3 grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-[#9B7340] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                  Check-in
                </p>
                <p className="text-sm font-medium text-[#1a1d3a]">{PLACEHOLDER_GUEST.checkIn}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-[#9B7340] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                  Check-out
                </p>
                <p className="text-sm font-medium text-[#1a1d3a]">{PLACEHOLDER_GUEST.checkOut}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section>
        <SectionHeader title="Quick Links" />
        <div className="space-y-2">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className="w-full glass-card p-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1a1d3a]/5 flex items-center justify-center flex-shrink-0">
                <link.icon className="w-5 h-5 text-[#1a1d3a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Notification preferences */}
      <section>
        <SectionHeader title="Notifications" />
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#9B7340]" />
              <div>
                <p className="text-sm font-medium text-foreground">Request Updates</p>
                <p className="text-xs text-muted-foreground">When your requests are updated</p>
              </div>
            </div>
            <Switch
              checked={notifPrefs.requestUpdates}
              onCheckedChange={() => togglePref("requestUpdates")}
              aria-label="Toggle request update notifications"
            />
          </div>

          <div className="border-t border-border/20" aria-hidden="true" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-[#9B7340]" />
              <div>
                <p className="text-sm font-medium text-foreground">Staff Messages</p>
                <p className="text-xs text-muted-foreground">Direct messages from hotel staff</p>
              </div>
            </div>
            <Switch
              checked={notifPrefs.staffMessages}
              onCheckedChange={() => togglePref("staffMessages")}
              aria-label="Toggle staff message notifications"
            />
          </div>

          <div className="border-t border-border/20" aria-hidden="true" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[#9B7340]" />
              <div>
                <p className="text-sm font-medium text-foreground">Promotions</p>
                <p className="text-xs text-muted-foreground">Special offers and hotel news</p>
              </div>
            </div>
            <Switch
              checked={notifPrefs.promotions}
              onCheckedChange={() => togglePref("promotions")}
              aria-label="Toggle promotion notifications"
            />
          </div>

          <div className="border-t border-border/20" aria-hidden="true" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#9B7340]" />
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Summaries sent to your email</p>
              </div>
            </div>
            <Switch
              checked={notifPrefs.emailNotifications}
              onCheckedChange={() => togglePref("emailNotifications")}
              aria-label="Toggle email notifications"
            />
          </div>
        </div>
      </section>

      {/* Sign out */}
      <section className="pb-2">
        {signOutError && (
          <p className="text-sm text-destructive text-center mb-2">{signOutError}</p>
        )}
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/50"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing out...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </span>
          )}
        </Button>
      </section>
    </GuestPageShell>
  );
}
