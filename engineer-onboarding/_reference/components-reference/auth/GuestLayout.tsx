import { ReactNode, Suspense } from 'react';
import { PhoneFrame } from '../innara/PhoneFrame';
import { Loader2 } from 'lucide-react';

interface GuestLayoutProps {
  children: ReactNode;
}

function GuestRouteLoader() {
  return (
    <div className="h-full flex items-center justify-center p-5">
      <div className="glass-card px-6 py-5 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1a1d3a]" />
        <p className="mt-2 text-sm text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}

// No auth check — just the phone frame wrapper
export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <PhoneFrame>
      <Suspense fallback={<GuestRouteLoader />}>
        {children}
      </Suspense>
    </PhoneFrame>
  );
}
