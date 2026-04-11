"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "innara-pwa-install-dismissed";
const MIN_PAGE_VIEWS = 2;
const PAGE_VIEW_KEY = "innara-pwa-page-views";

export function InstallPrompt(): React.ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Track page views
    const views = parseInt(localStorage.getItem(PAGE_VIEW_KEY) ?? "0", 10) + 1;
    localStorage.setItem(PAGE_VIEW_KEY, String(views));

    function handleBeforeInstall(e: Event): void {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show after minimum page views
      if (views >= MIN_PAGE_VIEWS) {
        setShow(true);
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
    setInstalling(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#1a1d3a] rounded-2xl p-4 shadow-xl border border-[#9B7340]/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9B7340]/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-[#9B7340]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Install Innara</p>
            <p className="text-xs text-white/60 mt-0.5">
              Add to your home screen for quick access and offline support.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="px-4 py-1.5 text-xs font-medium bg-[#9B7340] text-white rounded-lg hover:bg-[#b8924f] transition-colors disabled:opacity-50"
              >
                {installing ? "Installing..." : "Install"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-white/30 hover:text-white/60 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
