import { Suspense } from "react";
import { AppBackground } from "@/components/innara/AppBackground";
import { Loader2 } from "lucide-react";

function GuestLoading(): React.ReactElement {
  return (
    <div className="h-full flex items-center justify-center p-5">
      <div className="glass-card px-6 py-5 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1a1d3a]" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function GuestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen relative">
      <AppBackground />
      <div className="relative z-10 min-h-screen flex flex-col max-w-md mx-auto">
        <Suspense fallback={<GuestLoading />}>{children}</Suspense>
      </div>
    </div>
  );
}
