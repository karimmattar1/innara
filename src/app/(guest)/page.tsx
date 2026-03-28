"use client";

import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { Sparkles } from "lucide-react";

export default function GuestHome(): React.ReactElement {
  return (
    <GuestPageShell>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="glass-card p-8 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1a1d3a]">
            Welcome to Innara
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your AI concierge is ready to help. Ask anything about your stay,
            request services, or explore what&apos;s nearby.
          </p>
        </div>
      </div>
    </GuestPageShell>
  );
}
