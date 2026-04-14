"use client";

import {
  Bot,
  Utensils,
  Bed,
  Wrench,
  Sparkles,
  BarChart3,
  Car,
  MapPin,
  Shield,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";

interface ServiceChip {
  icon: LucideIcon;
  label: string;
}

const services: ServiceChip[] = [
  { icon: Bot, label: "AI Concierge" },
  { icon: Utensils, label: "Room Service" },
  { icon: Bed, label: "Housekeeping" },
  { icon: Wrench, label: "Maintenance" },
  { icon: Car, label: "Valet" },
  { icon: Sparkles, label: "Spa & Wellness" },
  { icon: BarChart3, label: "Guest Insights" },
  { icon: MapPin, label: "Local Guides" },
  { icon: Shield, label: "Security" },
  { icon: MessageSquare, label: "Messaging" },
];

function Chip({ icon: Icon, label }: ServiceChip): React.ReactElement {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-default whitespace-nowrap">
      <Icon className="w-3.5 h-3.5 text-bronze-light" strokeWidth={1.5} />
      <span className="text-xs font-medium text-white/70">{label}</span>
    </div>
  );
}

export function LandingServices(): React.ReactElement {
  return (
    <section className="relative py-6 overflow-hidden">
      <Marquee pauseOnHover className="[--duration:30s] [--gap:0.75rem]">
        {services.map((s) => (
          <Chip key={s.label} {...s} />
        ))}
      </Marquee>
    </section>
  );
}
