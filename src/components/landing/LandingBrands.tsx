"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";
import { MagicCard } from "@/components/ui/magic-card";

const testimonials = [
  {
    quote: "Innara replaced 8 different tools we were using. Our staff response time dropped by 40%.",
    name: "Sarah Chen",
    title: "GM, The Meridian Hotel",
  },
  {
    quote: "The AI concierge handles 70% of guest requests automatically. Our front desk team can finally focus on high-touch interactions.",
    name: "Marcus Webb",
    title: "Operations Director, Coastal Resorts",
  },
  {
    quote: "We went from 15-minute average response time to under 3 minutes. Guests notice the difference immediately.",
    name: "Elena Rodriguez",
    title: "Guest Experience Lead, Urban Stays",
  },
  {
    quote: "The analytics dashboard alone pays for itself. We identified $200K in revenue leaks within the first quarter.",
    name: "James Okafor",
    title: "CFO, Heritage Hotels Group",
  },
  {
    quote: "Finally, a platform that understands hospitality. Not another generic SaaS trying to fit our workflow.",
    name: "Priya Patel",
    title: "CTO, Luxe Hospitality",
  },
  {
    quote: "Multi-property management used to be a nightmare. Now I oversee 12 hotels from a single dashboard.",
    name: "David Kim",
    title: "VP Operations, Pacific Coast Hotels",
  },
];

function TestimonialCard({
  quote,
  name,
  title,
}: {
  quote: string;
  name: string;
  title: string;
}): React.ReactElement {
  return (
    <MagicCard
      gradientColor="rgba(155, 115, 64, 0.08)"
      className="w-[350px] max-w-full border-white/10"
    >
      <div className="p-6">
        <p className="text-sm leading-relaxed text-white/70 mb-4">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bronze/30 to-bronze-dark/20 border border-bronze/20 flex items-center justify-center text-xs font-semibold text-bronze-light">
            {name[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-white/50">{title}</p>
          </div>
        </div>
      </div>
    </MagicCard>
  );
}

export function LandingBrands(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="brands" className="relative py-24 overflow-hidden" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="max-w-3xl mx-auto text-center mb-12 px-6"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-bronze-light/60 mb-4 block">
          Trusted By
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Hotels that chose
          <br />
          <span className="text-white/40">to modernize.</span>
        </h2>
      </motion.div>

      {/* Marquee testimonials */}
      <div className="relative">
        <Marquee pauseOnHover className="[--duration:60s]">
          {testimonials.slice(0, 3).map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:55s] mt-4">
          {testimonials.slice(3).map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </Marquee>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-navy to-transparent" />
      </div>
    </section>
  );
}
