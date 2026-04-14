"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Bot, BedDouble, BarChart3, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  meta: string;
  gradient: string;
  span: string;
  beamDelay: number;
}

const features: Feature[] = [
  {
    icon: Bot,
    title: "AI Concierge",
    description:
      "24/7 intelligent guest assistant. Handles requests, recommendations, room service, and local tips in natural language — powered by Claude.",
    meta: "Intelligence",
    gradient: "from-bronze/20 via-transparent to-transparent",
    span: "md:col-span-4 md:row-span-2",
    beamDelay: 0,
  },
  {
    icon: BedDouble,
    title: "Guest Experience",
    description:
      "Mobile-first PWA. Service requests, room service ordering, and real-time status tracking — no app download required.",
    meta: "Mobile",
    gradient: "from-gold/15 via-transparent to-transparent",
    span: "md:col-span-4",
    beamDelay: 3,
  },
  {
    icon: BarChart3,
    title: "Operations & Analytics",
    description:
      "Staff dashboards, request routing, SLA compliance, and revenue analytics. One platform replacing 5-15 disconnected tools.",
    meta: "Insights",
    gradient: "from-white/[0.06] via-transparent to-transparent",
    span: "md:col-span-4",
    beamDelay: 6,
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Multi-tenant isolation with RLS on every table. Role-based access across 5 user types. GDPR compliance with data export and anonymization.",
    meta: "Trust",
    gradient: "from-bronze/10 via-transparent to-transparent",
    span: "md:col-span-8",
    beamDelay: 9,
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className={feature.span}
    >
      <MagicCard
        gradientColor="rgba(155, 115, 64, 0.12)"
        gradientSize={250}
        className="relative h-full border-white/15 hover:-translate-y-1 hover:border-white/25 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
      >
        {/* Border beam glow */}
        <BorderBeam
          size={150}
          duration={12}
          delay={feature.beamDelay}
          colorFrom="#9B7340"
          colorTo="#C4A265"
          borderWidth={1}
        />

        {/* Gradient accent on hover */}
        <div
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`}
        />

        {/* Dotted grid texture */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 rounded-xl"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="flex items-start gap-4 p-6 sm:p-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] group-hover:border-bronze/30 group-hover:bg-bronze/10 transition-all duration-300">
            <feature.icon
              className="h-6 w-6 text-white/70 group-hover:text-bronze-light transition-colors duration-300"
              strokeWidth={1.5}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-semibold text-white tracking-tight">
                {feature.title}
              </h3>
              <span className="hidden sm:inline-flex shrink-0 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/40 group-hover:border-bronze/20 group-hover:text-bronze-light/60 transition-all duration-300">
                {feature.meta}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/70 group-hover:text-white/80 transition-colors duration-300">
              {feature.description}
            </p>
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}

export function LandingFeatures(): React.ReactElement {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section className="relative px-6 py-24 bg-navy-dark" ref={sectionRef}>
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-bronze-light/60 mb-4 block">
          Platform
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Everything your hotel needs.
          <br />
          <span className="text-white/40">Nothing it doesn&apos;t.</span>
        </h2>
        <p className="text-white/70 text-lg max-w-xl mx-auto">
          A unified system built for modern hospitality — from guest check-in to
          revenue analytics.
        </p>
      </motion.div>

      {/* Bento grid with MagicCards + BorderBeam */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-8 gap-4">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
