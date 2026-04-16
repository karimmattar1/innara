import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDataMode } from '@/data/mode';
import { LoadingState } from '@/components/innara/LoadingState';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

// Enforces role-based access using TenantContext as authority.
// In demo mode the role is inferred from the URL path via TenantContext.
// In pilot mode it redirects unauthorized users.
export function ProtectedRoute({ children, allowedRoles, redirectTo = '/' }: ProtectedRouteProps) {
  const { role } = useTenant();
  const { isLoading } = useAuth();

  // In pilot mode, wait for auth to load before deciding
  if (getDataMode() === 'pilot' && isLoading) {
    return <LoadingState variant="spinner" text="Checking access..." />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['guest']}>{children}</ProtectedRoute>;
}

export function StaffRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['staff']}>{children}</ProtectedRoute>;
}

export function ManagerRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['manager']}>{children}</ProtectedRoute>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={['super_admin']}>{children}</ProtectedRoute>;
}
