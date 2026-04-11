"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#1a1d3a]/5 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8 text-[#1a1d3a]/60" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1a1d3a] font-serif mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          It looks like your internet connection is unavailable. Your pending
          requests will be sent automatically when you&apos;re back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 text-sm font-medium bg-[#1a1d3a] text-white rounded-xl hover:bg-[#1a1d3a]/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
