import { Suspense } from "react";
import { AppBackground } from "@/components/innara/AppBackground";
import { BrandingStyles } from "@/components/innara/BrandingStyles";
import { InstallPrompt } from "@/components/guest/InstallPrompt";
import { ServiceWorkerRegistration } from "@/components/guest/ServiceWorkerRegistration";
import { resolveGuestHotelId } from "@/lib/branding";
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

export default async function GuestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.ReactElement> {
  // Resolve hotel ID from the guest's active stay so we can inject
  // hotel-specific branding. Null-safe: if unauthenticated or no active stay,
  // BrandingStyles is simply omitted and the portal falls back to defaults.
  const hotelId = await resolveGuestHotelId();

  return (
    <div className="min-h-screen relative">
      {hotelId && <BrandingStyles hotelId={hotelId} />}
      <AppBackground />
      <div className="relative z-10 min-h-screen flex flex-col max-w-md mx-auto">
        <Suspense fallback={<GuestLoading />}>{children}</Suspense>
        <InstallPrompt />
        <ServiceWorkerRegistration />
      </div>
    </div>
  );
}
