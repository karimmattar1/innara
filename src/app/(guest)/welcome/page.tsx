"use client";

import Link from "next/link";
import {
  Sparkles,
  Utensils,
  Bed,
  Phone,
  MapPin,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickActionCard {
  icon: LucideIcon;
  label: string;
  href: string;
  iconBg: string;
  iconColor: string;
}

// ---------------------------------------------------------------------------
// Quick actions config
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: QuickActionCard[] = [
  {
    icon: Sparkles,
    label: "AI Concierge",
    href: "/guest/concierge",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    icon: Utensils,
    label: "Room Service",
    href: "/guest/room-service",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    icon: Bed,
    label: "Housekeeping",
    href: "/guest/services/housekeeping",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Phone,
    label: "Concierge",
    href: "/guest/services/concierge",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: MapPin,
    label: "Explore",
    href: "/guest/explore",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Clock,
    label: "My Requests",
    href: "/guest/requests",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
];

// ---------------------------------------------------------------------------
// Quick action card component
// ---------------------------------------------------------------------------

function ActionCard({ icon: Icon, label, href, iconBg, iconColor }: QuickActionCard): React.ReactElement {
  return (
    <Link
      href={href}
      className="glass-card p-4 flex flex-col items-center gap-2.5 text-center group active:scale-95 transition-transform"
      aria-label={label}
    >
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
      </div>
      <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GuestWelcomePage(): React.ReactElement {
  return (
    <GuestPageShell>
      {/* Greeting */}
      <section aria-labelledby="welcome-heading">
        <h1
          id="welcome-heading"
          className="text-2xl font-semibold text-[var(--color-navy)] mb-0.5"
        >
          Welcome to your stay
        </h1>
        <p className="text-sm text-muted-foreground">
          How can we make your stay exceptional?
        </p>
      </section>

      {/* Quick actions grid */}
      <section aria-label="Quick actions">
        <div
          className="grid grid-cols-3 gap-3"
          role="list"
        >
          {QUICK_ACTIONS.map((action) => (
            <div key={action.href} role="listitem">
              <ActionCard {...action} />
            </div>
          ))}
        </div>
      </section>

      {/* AI Concierge CTA */}
      <section aria-labelledby="concierge-cta-heading">
        <Link
          href="/guest/concierge"
          className="glass-card p-5 flex items-center gap-4 group active:scale-[0.98] transition-transform block"
          aria-label="Open AI Concierge"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
            <Sparkles className="w-6 h-6 text-violet-600" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="concierge-cta-heading"
              className="text-base font-semibold text-[var(--color-navy)] leading-tight"
            >
              Ask me anything
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Your AI concierge is ready to help with recommendations, requests, and more.
            </p>
          </div>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-navy)]/10 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-[var(--color-navy)]"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>
      </section>
    </GuestPageShell>
  );
}
