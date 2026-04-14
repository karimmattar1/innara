"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { GlassButton } from "@/components/ui/glass-button";

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
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden">
      {/* Spotlight effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="rgba(155, 115, 64, 0.15)"
      />

      {/* Animated background paths */}
      <BackgroundPaths className="text-bronze/20" />

      {/* Background gradients */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(155,115,64,0.15)_0%,_transparent_70%)]" />
        <div className="hidden lg:block absolute -top-40 -left-20 w-[500px] h-[800px] -rotate-45 rounded-full bg-[radial-gradient(68%_69%_at_55%_31%,rgba(255,255,255,0.04)_0%,transparent_80%)]" />
        <div className="hidden lg:block absolute -top-40 -right-20 w-[500px] h-[800px] rotate-45 rounded-full bg-[radial-gradient(68%_69%_at_45%_31%,rgba(155,115,64,0.06)_0%,transparent_80%)]" />
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

          {/* Headline with letter animation */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
            {"AI-Powered".split("").map((letter, i) => (
              <motion.span
                key={`l1-${i}`}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 0.4 + i * 0.03,
                  type: "spring" as const,
                  stiffness: 150,
                  damping: 25,
                }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            <br />
            <span className="bg-gradient-to-r from-bronze-light via-gold to-bronze bg-clip-text text-transparent">
              {"Hospitality".split("").map((letter, i) => (
                <motion.span
                  key={`l2-${i}`}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.7 + i * 0.03,
                    type: "spring" as const,
                    stiffness: 150,
                    damping: 25,
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
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
            <Link href="/auth/guest/login">
              <ShimmerButton
                shimmerColor="rgba(155, 115, 64, 0.6)"
                shimmerSize="0.05em"
                background="rgba(155, 115, 64, 0.15)"
                className="border-bronze/40 hover:shadow-[0_0_30px_rgba(155,115,64,0.3)]"
              >
                <span className="relative font-semibold text-white tracking-wide flex items-center gap-3">
                  Guest Portal
                  <span className="w-2.5 h-2.5 rounded-full bg-bronze-light shadow-[0_0_12px_rgba(184,146,79,0.8)] animate-pulse" />
                </span>
              </ShimmerButton>
            </Link>

            <Link href="/auth/staff/login">
              <GlassButton variant="ghost" size="lg" className="group">
                <span className="font-semibold tracking-wide">Staff Login</span>
                <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
              </GlassButton>
            </Link>
          </div>
        </AnimatedGroup>
      </div>
    </section>
  );
}
