"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Iphone15Pro } from "@/components/ui/iphone-15-pro";
import { BorderBeam } from "@/components/ui/border-beam";

export function LandingDemo(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="demo" className="relative px-6 py-24 overflow-hidden" ref={ref}>
      {/* Background accent */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(155,115,64,0.08)_0%,_transparent_70%)]" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="max-w-3xl mx-auto text-center mb-16"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-bronze-light/60 mb-4 block">
          See It Live
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Your guests&apos; new
          <br />
          <span className="text-white/40">favorite concierge.</span>
        </h2>
        <p className="text-white/70 text-lg max-w-xl mx-auto">
          A native-feeling mobile experience — AI chat, service requests,
          room service, and local recommendations. No app download required.
        </p>
      </motion.div>

      {/* Floating phones */}
      <div className="relative max-w-5xl mx-auto flex items-center justify-center">
        {/* Left phone (tilted) */}
        <motion.div
          initial={{ opacity: 0, x: -60, rotateY: 15 }}
          animate={isInView ? { opacity: 0.6, x: 0, rotateY: 15 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden md:block absolute -left-8 lg:left-8 -rotate-6 scale-75"
          style={{ perspective: "1000px" }}
        >
          <Iphone15Pro
            width={280}
            height={570}
            src="/screenshots/guest-services.png"
            className="drop-shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          />
        </motion.div>

        {/* Center phone (hero) */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative z-10"
        >
          <div className="relative rounded-[40px] overflow-hidden">
            <Iphone15Pro
              width={320}
              height={652}
              src="/screenshots/guest-concierge.png"
              className="drop-shadow-[0_30px_80px_rgba(155,115,64,0.2)]"
            />
            <BorderBeam
              size={200}
              duration={10}
              colorFrom="#9B7340"
              colorTo="#C4A265"
              borderWidth={2}
            />
          </div>

          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute -right-12 top-20 glass-card-dark px-4 py-3 flex items-center gap-3 rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-bronze/20 flex items-center justify-center border border-bronze/30">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">AI Concierge</p>
              <p className="text-white/50 text-[10px]">Online 24/7</p>
            </div>
          </motion.div>

          {/* Floating badge left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute -left-16 bottom-32 glass-card-dark px-4 py-3 flex items-center gap-3 rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-400/30">
              <span className="text-sm">✓</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Request Fulfilled</p>
              <p className="text-white/50 text-[10px]">Extra towels delivered</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right phone (tilted) */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -15 }}
          animate={isInView ? { opacity: 0.6, x: 0, rotateY: -15 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden md:block absolute -right-8 lg:right-8 rotate-6 scale-75"
          style={{ perspective: "1000px" }}
        >
          <Iphone15Pro
            width={280}
            height={570}
            src="/screenshots/guest-roomservice.png"
            className="drop-shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
          />
        </motion.div>
      </div>
    </section>
  );
}
