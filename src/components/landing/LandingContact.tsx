"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, ArrowRight } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BorderBeam } from "@/components/ui/border-beam";

export function LandingContact(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="relative px-6 py-24" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="relative max-w-3xl mx-auto"
      >
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12 text-center overflow-hidden">
          <BorderBeam
            size={250}
            duration={15}
            colorFrom="#9B7340"
            colorTo="#C4A265"
            borderWidth={1.5}
          />

          {/* Background glow */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(155,115,64,0.1)_0%,_transparent_70%)]" />
          </div>

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-bronze/10 border border-bronze/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-6 h-6 text-bronze-light" strokeWidth={1.5} />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to modernize
              <br />
              your hotel?
            </h2>

            <p className="text-white/60 text-lg max-w-lg mx-auto mb-8">
              Get a personalized demo of Innara for your property. See how AI can
              transform your guest experience and operations in 30 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:hello@innara.io">
                <ShimmerButton
                  shimmerColor="rgba(155, 115, 64, 0.6)"
                  background="rgba(155, 115, 64, 0.15)"
                  className="border-bronze/40 text-base px-8 py-4"
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    Request a Demo
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </ShimmerButton>
              </a>
              <a
                href="mailto:hello@innara.io"
                className="text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                hello@innara.io
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
