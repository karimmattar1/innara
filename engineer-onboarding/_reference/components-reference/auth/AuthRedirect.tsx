import { ReactNode } from 'react';

// No redirect in demo mode — always show auth pages as-is
export function AuthRedirect({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
