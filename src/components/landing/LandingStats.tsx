"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Meteors } from "@/components/ui/meteors";

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

function StatItem({ value, suffix, label, delay }: StatItemProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      const duration = 1500;
      const steps = 40;
      const increment = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      className="flex flex-col items-center gap-1 px-6"
    >
      <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
        {count}
        <span className="text-bronze-light">{suffix}</span>
      </span>
      <span className="text-sm text-white/70 tracking-wide uppercase">
        {label}
      </span>
    </motion.div>
  );
}

const stats = [
  { value: 50, suffix: "+", label: "Screens", delay: 0 },
  { value: 5, suffix: "", label: "Role Portals", delay: 100 },
  { value: 24, suffix: "/7", label: "AI Concierge", delay: 200 },
  { value: 634, suffix: "", label: "Tests Passing", delay: 300 },
];

export function LandingStats(): React.ReactElement {
  return (
    <section className="relative py-16 border-y border-white/[0.06] overflow-hidden">
      {/* Glass background */}
      <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-sm" />

      {/* Meteor shower effect */}
      <div className="absolute inset-0 overflow-hidden">
        <Meteors number={12} />
      </div>

      <div className="relative max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}
