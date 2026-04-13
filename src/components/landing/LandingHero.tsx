"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { type: "spring" as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

export function LandingHero(): React.ReactElement {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20">
      {/* Background gradients */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
      >
        {/* Top bronze glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(155,115,64,0.2)_0%,_transparent_70%)]" />
        {/* Side light streaks */}
        <div className="hidden lg:block absolute -top-40 -left-20 w-[500px] h-[800px] -rotate-45 rounded-full bg-[radial-gradient(68%_69%_at_55%_31%,rgba(255,255,255,0.04)_0%,transparent_80%)]" />
        <div className="hidden lg:block absolute -top-40 -right-20 w-[500px] h-[800px] rotate-45 rounded-full bg-[radial-gradient(68%_69%_at_45%_31%,rgba(155,115,64,0.06)_0%,transparent_80%)]" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-navy-dark to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl mx-auto text-center">
        <AnimatedGroup
          variants={{
            container: {
              visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
            },
            ...transitionVariants,
          }}
          className="flex flex-col items-center gap-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Image
              src="/innaralightlogo2.png"
              alt="Innara logo"
              width={80}
              height={80}
              priority
              className="drop-shadow-[0_0_30px_rgba(155,115,64,0.3)]"
            />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
            AI-Powered
            <br />
            <span className="bg-gradient-to-r from-bronze-light via-gold to-bronze bg-clip-text text-transparent">
              Hospitality
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/75 max-w-2xl leading-relaxed">
            Replace your fragmented hotel tech stack with a single intelligent
            platform. Guest experience, staff operations, analytics, and AI
            concierge — unified.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            {/* Primary CTA — bronze glass */}
            <Link
              href="/auth/guest/login"
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full overflow-hidden border-2 border-bronze/40 hover:border-bronze transition-all duration-500 hover:shadow-[0_0_30px_rgba(155,115,64,0.3)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-bronze/20 via-bronze/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative font-semibold text-white tracking-wide">
                Guest Portal
              </span>
              <span className="relative w-2.5 h-2.5 rounded-full bg-bronze-light shadow-[0_0_12px_rgba(184,146,79,0.8)] animate-pulse" />
            </Link>

            {/* Secondary CTA — ghost glass */}
            <Link
              href="/auth/staff/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/15 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-sm"
            >
              <span className="font-semibold text-white/80 group-hover:text-white tracking-wide transition-colors">
                Staff Login
              </span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </AnimatedGroup>
      </div>
    </section>
  );
}
