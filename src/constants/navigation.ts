// ============================================
// PORTAL NAVIGATION ITEMS
// Single source of truth — never define navItems inline.
// ============================================

export interface NavItem {
  label: string;
  path: string;
}

export const MANAGER_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", path: "/manager" },
  { label: "Requests", path: "/manager/requests" },
  { label: "Analytics", path: "/manager/analytics" },
  { label: "Catalog", path: "/manager/catalog" },
  { label: "Staff", path: "/manager/staff" },
  { label: "Ops", path: "/manager/ops" },
  { label: "Reports", path: "/manager/reports" },
  { label: "Exports", path: "/manager/exports" },
  { label: "Audit", path: "/manager/audit" },
  { label: "Integrations", path: "/manager/integrations" },
  { label: "Billing", path: "/manager/billing" },
  { label: "Branding", path: "/manager/branding" },
  { label: "Permissions", path: "/manager/permissions" },
  { label: "Go-Live", path: "/manager/go-live" },
  { label: "Settings", path: "/manager/settings" },
  { label: "Health", path: "/manager/health" },
] as const;

export const STAFF_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", path: "/staff" },
  { label: "Requests", path: "/staff/requests" },
  { label: "Messages", path: "/staff/messages" },
  { label: "Shift", path: "/staff/shift" },
  { label: "Analytics", path: "/staff/analytics" },
] as const;

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", path: "/admin" },
  { label: "Tenants", path: "/admin/tenants" },
  { label: "Users", path: "/admin/users" },
  { label: "Plans", path: "/admin/plans" },
  { label: "Health", path: "/admin/health" },
] as const;
