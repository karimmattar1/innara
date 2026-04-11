"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageToggle(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const getCurrentLocale = useCallback((): Locale => {
    if (typeof document === "undefined") return "en";
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("innara-locale="));
    const value = match?.split("=")[1];
    return locales.includes(value as Locale) ? (value as Locale) : "en";
  }, []);

  const [current, setCurrent] = useState<Locale>(getCurrentLocale);

  function switchLocale(locale: Locale): void {
    document.cookie = `innara-locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    setCurrent(locale);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-[#1a1d3a] hover:bg-white/20 transition-colors"
        aria-label="Switch language"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{localeNames[current]}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[120px]">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  current === locale
                    ? "bg-[#1a1d3a]/5 text-[#1a1d3a] font-medium"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
