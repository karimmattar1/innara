"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Meteors } from "@/components/ui/meteors";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

const stats: Stat[] = [
  { value: 50, suffix: "+", label: "Screens", delay: 0 },
  { value: 5, suffix: "", label: "Role Portals", delay: 0.1 },
  { value: 24, suffix: "/7", label: "AI Concierge", delay: 0.2 },
  { value: 634, suffix: "", label: "Tests Passing", delay: 0.3 },
];

export function LandingStats(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="relative py-16 border-y border-white/[0.06] overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-sm" />
      <div className="absolute inset-0 overflow-hidden">
        <Meteors number={12} />
      </div>

      <div className="relative max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: stat.delay }}
            className="flex flex-col items-center gap-1 px-6"
          >
            <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              <NumberTicker
                value={stat.value}
                delay={stat.delay + 0.3}
                className="text-white"
              />
              <span className="text-bronze-light">{stat.suffix}</span>
            </span>
            <span className="text-sm text-white/70 tracking-wide uppercase">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
