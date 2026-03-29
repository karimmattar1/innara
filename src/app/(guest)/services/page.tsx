"use client";

import Link from "next/link";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { CategoryIcon } from "@/components/innara/CategoryIcon";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/constants/app";
import type { RequestCategory } from "@/constants/app";
import { ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Service entries
// ---------------------------------------------------------------------------

interface ServiceEntry {
  category: RequestCategory;
  href: string;
  description: string;
}

const SERVICES: ServiceEntry[] = [
  {
    category: "housekeeping",
    href: "/guest/services/housekeeping",
    description: "Towels, cleaning, amenities",
  },
  {
    category: "maintenance",
    href: "/guest/services/maintenance",
    description: "Repairs, AC, plumbing",
  },
  {
    category: "room_service",
    href: "/guest/room-service",
    description: "Food & beverages to your room",
  },
  {
    category: "concierge",
    href: "/guest/services/concierge",
    description: "Reservations, directions, info",
  },
  {
    category: "valet",
    href: "/guest/services/valet",
    description: "Parking, car service",
  },
  {
    category: "spa",
    href: "/guest/services/spa",
    description: "Wellness, massage, treatments",
  },
];

// ---------------------------------------------------------------------------
// Service card component
// ---------------------------------------------------------------------------

interface ServiceCardProps {
  entry: ServiceEntry;
}

function ServiceCard({ entry }: ServiceCardProps): React.ReactElement {
  const { category, href, description } = entry;
  const colors = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  return (
    <Link
      href={href}
      className="glass-card px-4 py-4 flex items-center gap-4 group active:scale-[0.98] transition-transform"
      aria-label={`${label}: ${description}`}
    >
      <CategoryIcon
        category={category}
        size="lg"
        variant="filled"
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${colors.text}`}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
      </div>
      <div className="flex-shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors">
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ServicesPage(): React.ReactElement {
  return (
    <GuestPageShell>
      {/* Heading */}
      <section aria-labelledby="services-heading">
        <h1
          id="services-heading"
          className="text-2xl font-semibold text-[var(--color-navy)] mb-0.5"
        >
          Services
        </h1>
        <p className="text-sm text-muted-foreground">
          What can we help you with?
        </p>
      </section>

      {/* Service list */}
      <section aria-label="Available services">
        <ul className="space-y-3" role="list">
          {SERVICES.map((entry) => (
            <li key={entry.href} role="listitem">
              <ServiceCard entry={entry} />
            </li>
          ))}
        </ul>
      </section>
    </GuestPageShell>
  );
}
