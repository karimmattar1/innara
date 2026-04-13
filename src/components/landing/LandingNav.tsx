"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingNav(): React.ReactElement {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full px-4">
      <nav
        className={cn(
          "mx-auto mt-3 max-w-6xl px-6 transition-all duration-500 rounded-2xl",
          scrolled
            ? "bg-navy/60 border border-white/10 backdrop-blur-xl shadow-lg shadow-black/20 max-w-4xl lg:px-5"
            : "bg-transparent"
        )}
      >
        <div className="flex items-center justify-between py-3 lg:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/innaralightlogo2.png"
              alt="Innara"
              width={32}
              height={32}
              priority
            />
            <Image
              src="/innaralightword.png"
              alt="Innara"
              width={100}
              height={28}
              priority
              className="h-auto"
            />
          </Link>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/auth/staff/login"
              className={cn(
                "px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors",
                scrolled && "hidden"
              )}
            >
              Staff Login
            </Link>
            <Link
              href="/auth/guest/login"
              className="group relative px-5 py-2.5 text-sm font-semibold text-white rounded-full overflow-hidden border border-bronze/50 hover:border-bronze transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-bronze/20 via-bronze/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-2">
                Guest Portal
                <span className="w-2 h-2 rounded-full bg-bronze-light animate-pulse" />
              </span>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 text-white/70 hover:text-white"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 flex flex-col gap-3">
            <Link
              href="/auth/guest/login"
              className="px-4 py-3 text-sm font-semibold bg-bronze/20 border border-bronze/30 rounded-xl text-center hover:bg-bronze/30 transition-colors"
            >
              Guest Portal
            </Link>
            <Link
              href="/auth/staff/login"
              className="px-4 py-3 text-sm font-medium text-white/70 border border-white/10 rounded-xl text-center hover:bg-white/5 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
