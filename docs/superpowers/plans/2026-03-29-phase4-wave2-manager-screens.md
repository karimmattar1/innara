# Phase 4 Wave 2 — Manager Portal Core Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 6 core manager portal screens that consume the Wave 1 backend actions — dashboard, requests, analytics, catalog, staff management, and ops.

**Architecture:** Each screen is a `"use client"` page under `src/app/(manager)/manager/`. They follow the same data-fetching pattern as the staff portal: `useCallback` + `useEffect` for initial load, `useState` for data/loading/error, `ManagerHeader` + `PageContainer` + `PageHeader` shell. All screens are dark-themed (inherits from manager layout's `dark` class).

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, shadcn base-nova (@base-ui/react), recharts (via shadcn chart component), lucide-react icons.

---

## File Map

| Task | Ticket | File | Purpose |
|------|--------|------|---------|
| 1 | INN-80 | `src/app/(manager)/manager/page.tsx` | Manager dashboard — KPI cards + recent requests + quick actions |
| 2 | INN-82 | `src/app/(manager)/manager/requests/page.tsx` | Request list with filters, bulk ops, status transitions |
| 3 | INN-83 | `src/app/(manager)/manager/analytics/page.tsx` | Charts: request trends, staff performance, revenue, SLA |
| 4 | INN-85 | `src/app/(manager)/manager/catalog/page.tsx` | Menu items + service options management |
| 5 | INN-87 | `src/app/(manager)/manager/staff/page.tsx` | Staff list + invite flow + invitation management |
| 6 | INN-88 | `src/app/(manager)/manager/ops/page.tsx` | SLA config per category/priority |

## Existing Components to Reuse

- `ManagerHeader` — portal header (src/components/innara/ManagerHeader.tsx)
- `PageContainer` — content wrapper (src/components/innara/PageContainer.tsx)
- `PageHeader` — title + subtitle (src/components/innara/PageHeader.tsx)
- `MetricCard` — KPI stat card with trend (src/components/innara/MetricCard.tsx)
- `EmptyState` / `EmptySearchState` — empty states (src/components/innara/EmptyState.tsx)
- `StatusBadge` — request status pill (src/components/innara/StatusBadge.tsx)
- `PriorityBadge` — priority pill (src/components/innara/PriorityBadge.tsx)
- `StaffAvatar` — avatar with initials (src/components/innara/StaffAvatar.tsx)
- `GlassCard` — glassmorphism card (src/components/ui/glass-card.tsx)
- `Button`, `Input`, `Select`, `Tabs`, `Table`, `Dialog`, `Badge`, `Skeleton`, `Switch` — shadcn UI
- `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` — shadcn chart (recharts)
- Constants: `STATUS_CONFIG`, `CATEGORY_LABELS`, `CATEGORY_COLORS`, `PRIORITY_CONFIG`, `DEPARTMENT_LABELS`, `REQUEST_CATEGORIES`, `REQUEST_STATUSES`, `REQUEST_PRIORITIES`, `VALID_TRANSITIONS` from `src/constants/app.ts`
- Utils: `getTimeAgo`, `getInitials` from `src/lib/utils.ts`
- Auth: `resolveStaffContext`, `isManagerRole` from `src/lib/auth-context.ts` (used in actions, not pages)

## Backend Actions Available (Wave 1)

**analytics.ts:** `getDashboardStats(period?)`, `getRequestAnalytics(period?)`, `getStaffPerformance(period?)`, `getRevenueAnalytics(period?)`

**staff-management.ts:** `getStaffList()`, `inviteStaff(data)`, `revokeInvitation(id)`, `resendInvitation(id)`, `getInvitations()`, `deactivateStaff(id)`, `reactivateStaff(id)`, `updateStaffDepartment(id, dept)`

**billing.ts:** `getSubscription()`, `createCheckoutSession(plan)`, `createBillingPortalSession()`, `cancelSubscription()`

**branding.ts:** `getBranding()`, `updateBranding(data)`, `getHotelSettings()`, `updateHotelSettings(data)`, `getSlaConfigs()`, `updateSlaConfig(id, data)`, `getServiceOptions()`, `updateServiceOption(id, data)`, `createServiceOption(data)`

**menu.ts:** `getMenuCategories()`, `getMenuItems(categoryId?)`

**staff.ts:** `getStaffRequests(opts)`, `updateRequestStatus(id, status, version)`, `assignRequest(id, staffId, version)`

**requests.ts:** `ActionResult<T>` type

## Data-Fetching Pattern (follow staff portal)

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";

export default function ManagerXxxPage(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await someAction();
    if (!result.success || !result.data) {
      setError(result.error ?? "Failed to load data.");
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  // Loading state
  if (loading) return (
    <>
      <ManagerHeader onSignOut={handleSignOut} />
      <PageContainer>
        <PageHeader title="..." subtitle="..." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    </>
  );

  // Error state
  if (error || !data) return (
    <>
      <ManagerHeader onSignOut={handleSignOut} />
      <PageContainer>
        <PageHeader title="..." subtitle="..." />
        <div className="glass-card-dark rounded-2xl p-8 text-center">
          <p className="text-destructive">{error ?? "Something went wrong."}</p>
          <Button onClick={loadData} className="mt-4">Retry</Button>
        </div>
      </PageContainer>
    </>
  );

  // Render data
  return (...);
}
```

---

## Task 1: Manager Dashboard (INN-80)

**Files:**
- Modify: `src/app/(manager)/manager/page.tsx` (replace placeholder)

**What it does:** Shows 6 KPI MetricCards (total requests, completed, avg rating, active guests, avg resolution time, revenue), a recent requests table (last 5), and quick-action buttons.

- [ ] **Step 1: Move INN-80 to In Progress in Linear**

- [ ] **Step 2: Write the dashboard page**

Replace the entire content of `src/app/(manager)/manager/page.tsx`. The page should:

1. Import and call `getDashboardStats("today")` and `getStaffRequests({ pageSize: 5 })` in parallel via `Promise.all`
2. Show 6 `MetricCard` components in a responsive grid (`grid-cols-2 lg:grid-cols-3`):
   - Total Requests (variant: `requests`, icon: `ClipboardList`)
   - Completed (variant: `requests`, icon: `CheckCircle2`)
   - Avg Rating (variant: `happiness`, icon: `Star`, format as `X.X / 5`)
   - Active Guests (variant: `guests`, icon: `Users`)
   - Avg Resolution (variant: `time`, icon: `Clock`, format as `Xm`)
   - Revenue Today (variant: `revenue`, icon: `DollarSign`, format as `$X,XXX`)
3. Below the cards, show a "Recent Requests" section with a glass-card-dark table showing: room, category, priority, status, time ago. Each row links to `/manager/requests`.
4. If no requests, show `EmptyState` with clipboard icon.
5. Add a period selector (Today / This Week / This Month) using `Tabs` component at the top. When changed, re-fetch with the new period.
6. Quick actions row: buttons for "View All Requests", "Staff Management", "Analytics" linking to respective routes.

**Imports needed:**
```tsx
import { getDashboardStats, type DashboardStats } from "@/app/actions/analytics";
import { getStaffRequests } from "@/app/actions/staff";
import { MetricCard } from "@/components/innara/MetricCard";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { PriorityBadge } from "@/components/innara/PriorityBadge";
import { EmptyState } from "@/components/innara/EmptyState";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, CheckCircle2, Star, Users, Clock, DollarSign, Loader2, ChevronRight, RefreshCw } from "lucide-react";
import { CATEGORY_LABELS } from "@/constants/app";
import { getTimeAgo } from "@/lib/utils";
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v "qrcode"`
Expected: 0 errors (ignore the pre-existing qrcode one)

- [ ] **Step 4: Visual verify with Playwright screenshot**

Write a quick Playwright script that navigates to `/manager` and screenshots. Review the screenshot.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(manager\)/manager/page.tsx
git commit -m "feat(INN-80): manager dashboard with KPI cards, recent requests, period selector"
```

- [ ] **Step 6: Move INN-80 to Done in Linear**

---

## Task 2: Manager Requests (INN-82)

**Files:**
- Create: `src/app/(manager)/manager/requests/page.tsx`

**What it does:** Full request list with search, filters (status, category, priority), bulk status updates, individual status transitions, and staff assignment.

- [ ] **Step 1: Move INN-82 to In Progress in Linear**

- [ ] **Step 2: Write the requests page**

Create `src/app/(manager)/manager/requests/page.tsx`. The page should:

1. Fetch all requests via `getStaffRequests({ pageSize: 50 })` and staff list via `getStaffMembers()` on mount
2. **Filters bar:** Search input + dropdown selects for Status, Category, Priority. All filter client-side.
3. **Bulk operations:** Checkbox column on each row. When items selected, show a bulk action bar with "Mark Complete", "Assign To..." dropdown. Use `updateRequestStatus` and `assignRequest` actions.
4. **Request table** in a `glass-card-dark` with columns: checkbox, room, category (with `CATEGORY_LABELS`), item, priority (`PriorityBadge`), status (`StatusBadge`), assigned to (`StaffAvatar` or "Unassigned"), time, actions.
5. **Row actions:** Click status badge to cycle through valid transitions (use `VALID_TRANSITIONS`). Click "Assign" to open a dropdown of staff members.
6. **Pagination:** Show 20 per page with prev/next buttons and "Showing X-Y of Z" text.
7. Loading: skeleton rows. Empty: `EmptySearchState` if filtered, `EmptyState` if truly empty.

**Imports needed:**
```tsx
import { getStaffRequests, getStaffMembers, updateRequestStatus, assignRequest } from "@/app/actions/staff";
import { StatusBadge } from "@/components/innara/StatusBadge";
import { PriorityBadge } from "@/components/innara/PriorityBadge";
import { StaffAvatar } from "@/components/innara/StaffAvatar";
import { EmptyState, EmptySearchState } from "@/components/innara/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, ChevronLeft, ChevronRight, Loader2, Filter, MoreHorizontal, UserPlus, CheckCircle2, RefreshCw } from "lucide-react";
import { STATUS_CONFIG, CATEGORY_LABELS, PRIORITY_CONFIG, REQUEST_CATEGORIES, REQUEST_STATUSES, REQUEST_PRIORITIES, VALID_TRANSITIONS, type RequestStatus, type RequestCategory, type RequestPriority } from "@/constants/app";
import { getTimeAgo, getInitials } from "@/lib/utils";
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v "qrcode"`

- [ ] **Step 4: Visual verify with Playwright screenshot**

- [ ] **Step 5: Commit**

```bash
git add src/app/\(manager\)/manager/requests/page.tsx
git commit -m "feat(INN-82): manager requests with filters, bulk ops, status transitions"
```

- [ ] **Step 6: Move INN-82 to Done in Linear**

---

## Task 3: Manager Analytics (INN-83)

**Files:**
- Create: `src/app/(manager)/manager/analytics/page.tsx`

**What it does:** Analytics dashboard with 4 chart sections: request trends (line), requests by status/category/priority (bar/pie), staff performance (table), and revenue analytics (area chart + top items).

- [ ] **Step 1: Move INN-83 to In Progress in Linear**

- [ ] **Step 2: Write the analytics page**

Create `src/app/(manager)/manager/analytics/page.tsx`. The page should:

1. Fetch all 3 analytics endpoints in parallel: `getRequestAnalytics(period)`, `getStaffPerformance(period)`, `getRevenueAnalytics(period)`
2. **Period selector** at top using `Tabs` (Today / Week / Month) — re-fetches on change.
3. **Section 1 — Request Trends:** Line chart showing daily request count using recharts `LineChart` via the shadcn `ChartContainer`. Data from `requestAnalytics.dailyTrend`.
4. **Section 2 — Request Breakdown:** Three small charts side by side:
   - By Status: horizontal bar chart (`BarChart` layout vertical) from `requestAnalytics.byStatus`
   - By Category: bar chart from `requestAnalytics.byCategory`
   - SLA Compliance: single donut/radial showing on-time vs breached percentage from `requestAnalytics.slaCompliance`
5. **Section 3 — Staff Performance:** Table in glass-card-dark with columns: name, department, requests handled, avg resolution (minutes), rating (star display). Data from `staffPerformance[]`.
6. **Section 4 — Revenue:** Area chart for daily revenue from `revenueAnalytics.dailyRevenue`. Below it, summary cards (total revenue, order count, avg order value) and a top items list from `revenueAnalytics.topItems`.

**Chart config pattern (shadcn recharts):**
```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area, ResponsiveContainer } from "recharts";

const chartConfig: ChartConfig = {
  requests: { label: "Requests", color: "#9B7340" },
};

// Usage:
<ChartContainer config={chartConfig} className="h-[300px] w-full">
  <LineChart data={dailyTrend}>
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line type="monotone" dataKey="count" stroke="var(--color-requests)" strokeWidth={2} dot={false} />
  </LineChart>
</ChartContainer>
```

**Imports needed:**
```tsx
import { getRequestAnalytics, getStaffPerformance, getRevenueAnalytics, type RequestAnalytics, type StaffPerformanceEntry, type RevenueAnalytics } from "@/app/actions/analytics";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area, Cell, PieChart, Pie } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Loader2, RefreshCw } from "lucide-react";
import { CATEGORY_LABELS, DEPARTMENT_LABELS, STATUS_CONFIG } from "@/constants/app";
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v "qrcode"`

- [ ] **Step 4: Visual verify with Playwright screenshot**

- [ ] **Step 5: Commit**

```bash
git add src/app/\(manager\)/manager/analytics/page.tsx
git commit -m "feat(INN-83): manager analytics with request trends, staff performance, revenue charts"
```

- [ ] **Step 6: Move INN-83 to Done in Linear**

---

## Task 4: Manager Catalog (INN-85)

**Files:**
- Create: `src/app/(manager)/manager/catalog/page.tsx`

**What it does:** Two-tab view (Menu Items / Service Options) for managing the hotel catalog. Menu tab shows categories and items. Service options tab shows configurable services with edit/create dialogs.

- [ ] **Step 1: Move INN-85 to In Progress in Linear**

- [ ] **Step 2: Write the catalog page**

Create `src/app/(manager)/manager/catalog/page.tsx`. The page should:

1. Use `Tabs` with two tabs: "Menu" and "Services"
2. **Menu tab:**
   - Fetch `getMenuCategories()` on mount, show as sidebar/filter chips
   - Fetch `getMenuItems(categoryId)` when a category is selected
   - Show items in a grid of glass-card-dark cards: name, description, price, availability toggle
   - Empty state if no items
3. **Services tab:**
   - Fetch `getServiceOptions()` on mount
   - Show as a list/table in glass-card-dark: service type, name, description, price, ETA, active toggle, sort order
   - "Add Service" button opens a `Dialog` with form fields: serviceType (select), name, description, price, etaMinutes, isActive (switch)
   - Click a row to edit — same dialog pre-filled. Uses `updateServiceOption(id, data)`.
   - Create uses `createServiceOption(data)`.
   - Toggle active/inactive inline with `Switch` component calling `updateServiceOption`.

**Imports needed:**
```tsx
import { getMenuCategories, getMenuItems } from "@/app/actions/menu";
import { getServiceOptions, updateServiceOption, createServiceOption, type ServiceOption } from "@/app/actions/branding";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/innara/EmptyState";
import { Plus, Pencil, Loader2, RefreshCw, DollarSign, Clock } from "lucide-react";
import { CATEGORY_LABELS } from "@/constants/app";
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v "qrcode"`

- [ ] **Step 4: Visual verify with Playwright screenshot**

- [ ] **Step 5: Commit**

```bash
git add src/app/\(manager\)/manager/catalog/page.tsx
git commit -m "feat(INN-85): manager catalog with menu items and service options management"
```

- [ ] **Step 6: Move INN-85 to Done in Linear**

---

## Task 5: Manager Staff (INN-87)

**Files:**
- Create: `src/app/(manager)/manager/staff/page.tsx`

**What it does:** Staff roster with invite flow, invitation management, department assignment, and deactivation.

- [ ] **Step 1: Move INN-87 to In Progress in Linear**

- [ ] **Step 2: Write the staff page**

Create `src/app/(manager)/manager/staff/page.tsx`. The page should:

1. Fetch `getStaffList()` and `getInvitations()` in parallel on mount.
2. **Tabs:** "Active Staff" / "Invitations"
3. **Active Staff tab:**
   - Table in glass-card-dark: avatar (StaffAvatar), name, email, department (DepartmentBadge or text), role, status indicator (green dot = active).
   - Search filter by name/email.
   - Row actions via `DropdownMenu`: Change Department (submenu with department options calling `updateStaffDepartment`), Deactivate (calls `deactivateStaff` with confirmation dialog).
   - Show deactivated staff with visual dimming and a "Reactivate" action.
4. **Invitations tab:**
   - Table: email, department, role, status (pending/accepted/expired), sent date.
   - Row actions: Resend (calls `resendInvitation`), Revoke (calls `revokeInvitation` with confirmation).
5. **Invite button:** "Invite Staff" button in page header area. Opens a `Dialog` with: email, department (Select from `DEPARTMENT_LABELS`), role (Select: staff / front_desk / manager). Submit calls `inviteStaff(data)`.
6. Toast notifications on success/error for all mutations using sonner `toast`.

**Imports needed:**
```tsx
import { getStaffList, getInvitations, inviteStaff, revokeInvitation, resendInvitation, deactivateStaff, reactivateStaff, updateStaffDepartment } from "@/app/actions/staff-management";
import { StaffAvatar } from "@/components/innara/StaffAvatar";
import { EmptyState } from "@/components/innara/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserPlus, MoreHorizontal, Search, Mail, Loader2, RefreshCw, Shield, X } from "lucide-react";
import { DEPARTMENT_LABELS } from "@/constants/app";
import { getInitials } from "@/lib/utils";
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v "qrcode"`

- [ ] **Step 4: Visual verify with Playwright screenshot**

- [ ] **Step 5: Commit**

```bash
git add src/app/\(manager\)/manager/staff/page.tsx
git commit -m "feat(INN-87): manager staff with roster, invite flow, department management"
```

- [ ] **Step 6: Move INN-87 to Done in Linear**

---

## Task 6: Manager Ops (INN-88)

**Files:**
- Create: `src/app/(manager)/manager/ops/page.tsx`

**What it does:** SLA configuration screen — edit target resolution times per category/priority combination.

- [ ] **Step 1: Move INN-88 to In Progress in Linear**

- [ ] **Step 2: Write the ops page**

Create `src/app/(manager)/manager/ops/page.tsx`. The page should:

1. Fetch `getSlaConfigs()` on mount.
2. Show a table/grid of SLA configs grouped by category. Each row shows: category label, priority label, target minutes with an inline editable input.
3. **Inline editing:** Click the target minutes value to turn it into an `Input`. On blur or Enter, call `updateSlaConfig(id, { targetMinutes })`. Show a small loading spinner during save.
4. If no SLA configs exist, show an `EmptyState` with a message like "No SLA rules configured yet."
5. Visual indicator: color-code target times (green < 30min, yellow 30-60min, red > 60min).
6. Group by category using section headers with `CATEGORY_LABELS`.
7. Show `PRIORITY_CONFIG` labels and colors for priority column.

**Imports needed:**
```tsx
import { getSlaConfigs, updateSlaConfig, type SlaConfig } from "@/app/actions/branding";
import { EmptyState } from "@/components/innara/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, RefreshCw, Clock, Settings } from "lucide-react";
import { CATEGORY_LABELS, PRIORITY_CONFIG } from "@/constants/app";
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v "qrcode"`

- [ ] **Step 4: Visual verify with Playwright screenshot**

- [ ] **Step 5: Commit**

```bash
git add src/app/\(manager\)/manager/ops/page.tsx
git commit -m "feat(INN-88): manager ops with SLA config editing per category/priority"
```

- [ ] **Step 6: Move INN-88 to Done in Linear**

---

## Post-Wave Verification

After all 6 tasks are complete:

- [ ] **Run full type check:** `npx tsc --noEmit` — should be 0 errors (except pre-existing qrcode)
- [ ] **Run build:** `npm run build` — should pass
- [ ] **Run tests:** `npx vitest run` — should be 73 tests, 69 pass, 4 skipped (same as before)
- [ ] **Update primer.md** with Wave 2 completion status
- [ ] **Verify all 6 Linear tickets are marked Done**
