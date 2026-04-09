# INN-8 — Staff Analytics Screen (Design Spec)

**Ticket:** INN-8
**Implementation ticket:** INN-43 (blocked on this spec)
**Phase:** 4 — Manager Portal + Billing (testing/design tail)
**Author:** frontend agent
**Approved by:** Karim (2026-04-09 — desktop layout option)
**Status:** Approved, ready to implement

---

## 1. Goal

Give housekeeping / F&B / maintenance / front-desk staff a **department-scoped analytics view** of their team's performance: how many requests are open, how well they're meeting SLA, where the bottlenecks are, and who the top performers are.

Staff open this screen from the staff portal left nav (or bottom tab) to:
- See their department's current load at a glance (KPI row)
- Spot time-of-day bottlenecks (peak hours chart)
- Identify slow responders (response-time breakdown)
- Recognize top performers (recognition panel)
- Drill into an individual staff member's recent activity when needed

This is **not** a personal performance dashboard — staff users don't all have individual logins today, so all metrics are department-aggregated by default. An individual-mode toggle exists but only re-scopes the same metrics to a single selected team member.

## 2. Architectural Context

**Why desktop, not mobile.** The original INN-8 ticket (written 2026-04-05) said "mobile-first per Stitch MCP." That wording is outdated:

- Innara CLAUDE.md (canonical) states the staff portal is **desktop**, while only the guest portal is the mobile PWA.
- The existing staff portal screens (`src/app/(staff)/staff/page.tsx`, `.../requests/`, `.../messages/`, `.../shift/`) are all dark-themed, desktop-layout React pages.
- The completed Manager Analytics screen (INN-83, `src/app/(manager)/manager/analytics/page.tsx`) uses the desktop pattern — same tech stack, same recharts, same `glass-card-dark` shell.
- Karim approved the desktop layout on 2026-04-09.

The ticket's "mobile-first" clause is therefore superseded by this spec. The screen does not need a mobile-optimized variant; the desktop layout uses standard Tailwind breakpoints so it collapses gracefully on narrow viewports without a separate mobile design.

**Why department-scoped, not personal.** Not every staff member has an individual Supabase account — small hotels often share a single "housekeeping" staff login. Personal stats would either be empty or misleading. Department-scoped aggregates are always correct and useful regardless of how the hotel runs logins. An individual filter is offered as an opt-in override for hotels that do have per-person accounts.

## 3. Route + Files

| Role | Path |
|------|------|
| Page route | `/staff/analytics` |
| Page component | `src/app/(staff)/staff/analytics/page.tsx` |
| Server action file | `src/app/actions/staff-analytics.ts` (NEW) |
| Acceptance test | `tests/acceptance/INN-43.spec.ts` (NEW — written before the page) |
| Shared components reused | `StaffHeader`, `PageContainer`, `PageHeader` from `src/components/innara/` |
| Shared constants | `CATEGORY_LABELS`, `CATEGORY_COLORS`, `STATUS_CONFIG`, `DEPARTMENT_LABELS` from `src/constants/app.ts` |

No new components needed beyond the page itself — everything is composed from existing atoms + inline sub-components following the Manager Analytics pattern.

## 4. Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  StaffHeader                                                        │
├────────────────────────────────────────────────────────────────────┤
│  PageHeader: "{Department} Analytics"     [All Department  ▼]      │
│  subtitle: "Team performance and workload for the last 7 days"     │
├────────────────────────────────────────────────────────────────────┤
│  ┌─ KPI Card ─┐ ┌─ KPI Card ─┐ ┌─ KPI Card ─┐ ┌─ KPI Card ─┐        │
│  │ Open Reqs  │ │ SLA %   ↗  │ │ Avg Resp   │ │ Comp %  ↗  │        │
│  │    24      │ │   94 %     │ │  4.2 min   │ │    87 %    │        │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
├────────────────────────────────────────────────────────────────────┤
│  ┌─ Task Breakdown ────────┐  ┌─ Workload Overview ──────────────┐ │
│  │ horizontal bar list      │  │ completion rate progress bar     │ │
│  │ by request category     │  │ status distribution (new / in-   │ │
│  │                         │  │ progress / completed)            │ │
│  └─────────────────────────┘  └──────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│  ┌─ Peak Hours ────────────┐  ┌─ Response Time Breakdown ────────┐ │
│  │ recharts BarChart        │  │ horizontal bars:                 │ │
│  │ x=hour (0-23)           │  │   <5m / 5-15m / 15-30m / >30m    │ │
│  │ y=request count         │  │   color: green → red             │ │
│  │ single Bronze color     │  │                                  │ │
│  └─────────────────────────┘  └──────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│  ┌─ Recognition Panel (full-width) ─────────────────────────────┐ │
│  │  default mode = Top Performing Staff (3-col grid)            │ │
│  │  individual mode = Recent Activity (last 10 requests)        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

**Breakpoints:**
- `md:` (≥ 768 px) and up: full 4-col KPI row + 2-col panel rows as shown above.
- `< md`: KPI row collapses to 2×2 grid; panel rows stack to single column. Recognition panel stays full-width. No other layout changes needed.

**Visual system:**
- Background: inherits dark from staff layout (`bg-[#0c0f1d]`-style navy, already set globally).
- Cards: `glass-card-dark rounded-2xl p-5` (existing pattern from INN-83).
- Accent: Bronze `#9B7340` for bars, icons, and primary interactive states.
- Text: default white / muted-foreground grays.
- Sparklines / trend arrows: green `#7aaa8a` (positive), amber `#c4a06a` (warn), red `#a35060` (negative) — same palette as INN-83 SlaComplianceCard.

## 5. Top Bar — Title + Staff Filter

**Title:** Dynamic, department-aware.
- All-department mode: `"{DEPARTMENT_LABELS[ctx.department]} Analytics"` (e.g. "Housekeeping Analytics").
- Individual mode: `"{staffName} — {DEPARTMENT_LABELS[ctx.department]}"` (e.g. "Anna Lee — Housekeeping").
- Subtitle always: `"Team performance and workload for the last 7 days"`. Period is fixed at 7d for v1 (see §14).

**Staff filter dropdown** (right-aligned, under the PageHeader action slot):
- Default value: `"All Department"` — sentinel, shows aggregate.
- Options: `"All Department"` + every staff member in the user's department returned by the action.
- Selecting an individual re-scopes ALL metrics below to that person via a refetch with `{ staffId }` param.
- Selecting "All Department" clears the filter and refetches aggregate.
- Options rendered via shadcn `Select` from `@base-ui/react` (no `asChild` per base-nova rules).

## 6. KPI Cards (4)

Each card is a `glass-card-dark rounded-2xl p-5` block with icon, label, big value, optional trend delta.

| # | Label | Value format | Icon | Trend indicator |
|---|-------|--------------|------|-----------------|
| 1 | Open Requests | integer, tabular-nums | `ClipboardList` | none |
| 2 | SLA Compliance | `{pct} %` (0 decimals) | `ShieldCheck` | vs previous 7-day window, shown as `↗ +3.2%` (green) or `↘ -1.1%` (red) |
| 3 | Avg Response Time | `{min} min` (1 decimal), or `{sec}s` when < 60 s | `Clock` | none |
| 4 | Completion Rate | `{pct} %` (0 decimals) | `CheckCircle2` | vs previous 7-day window, same arrow pattern as #2 |

**Empty-state rule:** if the department has zero requests in the window, all cards render `—` (em dash) and the trend indicators are omitted.

**Trend calc:**
```
previousWindow = [now - 14d, now - 7d]
currentWindow  = [now - 7d,  now]
delta = currentPct - previousPct
```
If `previousPct === 0` (no prior data), the arrow is omitted.

## 7. Panel Specs

### 7.1 Task Breakdown (Row 1, left)

**What it shows:** total request count per category for the current window, sorted descending.

**Format:** horizontal bar list. Each row:
```
Cleaning      ████████████  18
Maintenance   █████████      12
Towels        ██████         8
...
```
- Bar width is `(count / maxCount) * 100%` of available track.
- Bar background = `CATEGORY_COLORS[category]` from `src/constants/app.ts` (existing constant — do not invent new colors).
- Label uses `CATEGORY_LABELS[category]`.
- Right-aligned count with `tabular-nums`.
- Only include categories with count > 0. Sort by count descending.

**Empty state:** `EmptyState` icon + `"No requests in this window"` copy.

### 7.2 Workload Overview (Row 1, right)

**What it shows:** completion rate + distribution by status.

**Layout:**
1. Big completion rate at top: `{pct}% completed` with a horizontal progress bar beneath (same Bronze → green color ramp as INN-83 SlaComplianceCard).
2. Status pills below, each row `{StatusIcon} {label} {count}`:
   - New (`status = 'new'`)
   - Acknowledged (`status = 'acknowledged'`)
   - In Progress (`status = 'in_progress'`)
   - Completed (`status = 'completed'`)
   - Omit `cancelled` and `rejected` — they're rare and noise here.

**Status colors** come from `STATUS_CONFIG` (existing).

### 7.3 Peak Hours (Row 2, left)

**What it shows:** request volume by hour-of-day over the 7-day window.

**Chart:** recharts `BarChart` via `ChartContainer` (shadcn chart component).
- X axis: `hour` (0–23, labeled `"12a"`, `"3a"`, `"6a"`, ..., `"9p"` on every 3rd tick).
- Y axis: `count` (integer, auto-scale).
- Single bar series, Bronze `#9B7340`, rounded top corners.
- Tooltip: `ChartTooltip` + `ChartTooltipContent` showing `{hour}: {count} requests`.

**Data shape:** `Array<{ hour: number; count: number }>` — always exactly 24 entries, zeros for empty hours.

**Empty state:** if all 24 hours are zero, swap the chart for the standard `EmptyState` block.

### 7.4 Response Time Breakdown (Row 2, right)

**What it shows:** distribution of response times for requests in the window, bucketed.

**Buckets:**
| Bucket | Range | Color |
|--------|-------|-------|
| Fast | `< 5 min` | green `#7aaa8a` |
| Normal | `5–15 min` | lime `#a8c07f` |
| Slow | `15–30 min` | amber `#c4a06a` |
| Critical | `> 30 min` | red `#a35060` |

**Layout:** horizontal bar list (same visual pattern as Task Breakdown), each row shows bucket label, bar, and `{count} ({pct}%)` on the right.

**Response time definition (v1):** `acknowledged_at - created_at` when the request has been acknowledged, otherwise `completed_at - created_at` for direct-to-complete requests. Requests still in `new` status at query time are **excluded** from this chart (they haven't been responded to yet).

**Empty state:** same `EmptyState` block.

### 7.5 Recognition Panel (full-width)

**Two modes, controlled by the staff filter dropdown:**

**Mode A: All-department (default)** — "Top Performing Staff"
- 3-col grid (lg+), 2-col (md), 1-col (sm).
- Top 3 staff members in the department, sorted by `requestsHandled desc`, tie-break on lower `avgResolutionMinutes`.
- Each card shows:
  - Rank badge (`#1`, `#2`, `#3` — use bronze for #1, silver for #2, copper for #3).
  - `StaffAvatar` (existing component) + full name + department label.
  - Stats: `{requestsHandled} tasks · {avgResolutionMinutes} min avg · ★ {rating}`.
  - Rating uses the hotel average (per `getStaffPerformance` comment — per-staff ratings are not in the schema; see §13 for the deferred work).
- If fewer than 3 staff have any completed requests in the window: show whoever's there, pad remaining slots with an "—" placeholder card labeled "No data yet".

**Mode B: Individual selected** — "Recent Activity"
- Table with columns: `Time`, `Category`, `Room`, `Status`, `Duration`.
- Last 10 completed or in-progress requests assigned to the selected staff member, in the window, sorted by `created_at desc`.
- Status column uses `STATUS_CONFIG` pills (existing).
- Duration = `completed_at - created_at` if completed, else `"—"`.

**Empty state (Mode B):** `"No recent activity for this staff member in the last 7 days"` inside an `EmptyState` block.

## 8. Backend — `staff-analytics.ts` Server Action

**New file:** `src/app/actions/staff-analytics.ts`

**Single exported action:**

```typescript
"use server";

export interface StaffAnalyticsResult {
  kpis: {
    openRequests: number;
    slaCompliancePct: number;          // 0-100
    slaCompliancePrevPct: number;      // 0-100 (for trend)
    avgResponseMinutes: number;        // 0 = no data
    completionRatePct: number;         // 0-100
    completionRatePrevPct: number;     // 0-100 (for trend)
  };
  taskBreakdown: Array<{ category: string; count: number }>;
  workload: {
    byStatus: Record<"new" | "acknowledged" | "in_progress" | "completed", number>;
    completionRatePct: number;
  };
  peakHours: Array<{ hour: number; count: number }>;   // length 24
  responseTimeBuckets: {
    fast: number;      // < 5 min
    normal: number;    // 5-15 min
    slow: number;      // 15-30 min
    critical: number;  // > 30 min
  };
  topStaff: Array<{
    staffId: string;
    name: string;
    requestsHandled: number;
    avgResolutionMinutes: number;
    rating: number;   // hotel avg (per existing getStaffPerformance limitation)
  }>;
  recentActivity: Array<{
    id: string;
    createdAt: string;    // ISO
    category: string;
    roomNumber: string | null;
    status: string;
    durationMinutes: number | null;  // null if not completed
  }> | null;  // null when not in individual mode
  department: string;   // the department this data was scoped to
  staffFilter: {
    options: Array<{ id: string; name: string }>;    // all staff in department
    selected: string | null;                          // null = all department
  };
}

export async function getStaffAnalytics(
  staffId?: string,
): Promise<ActionResult<StaffAnalyticsResult>>;
```

**Auth & scoping rules:**
1. Use `resolveStaffContext(supabase)` — same pattern as every existing staff action.
2. **No manager gate.** Staff, front_desk, AND manager roles can call this (managers get the same view of their department as staff do — no special behavior).
3. Scope every query to `hotel_id = ctx.assignment.hotel_id` AND `department = ctx.assignment.department`.
4. RLS must enforce this independently — the action double-scopes defense-in-depth.
5. If `staffId` param is provided AND the staffId is not in the caller's department, return `{ success: false, error: "Staff member not found in your department." }` — do NOT leak data from other departments.

**Period:** hardcoded to 7 days for v1. No period selector in the UI for this iteration (see §14).

**Performance:**
- Single round-trip where possible. At minimum:
  - 1 query for requests in the window (pulls rows for KPIs, task breakdown, workload, peak hours, response time buckets, top staff).
  - 1 query for `staff_assignments` to get department staff list (for the filter dropdown + top staff names).
  - 1 query for `profiles` for staff names (joined or separate).
  - 1 query for previous-window SLA + completion rate (for trend deltas) — limited to aggregate columns only.
- Target: p95 < 400 ms on a hotel with 1000 requests in the window.

**Error handling:** follow the existing `ActionResult<T>` pattern — no exceptions leak to the caller. Log internal errors via `console.error` (existing staff portal pattern; Sentry wiring is already global).

## 9. Interaction Model

1. **Initial load:** page mounts → `loadData()` calls `getStaffAnalytics()` with no staffId → full department aggregate → render.
2. **Staff filter change (individual):** dropdown `onValueChange(staffId)` → `loadData(staffId)` → full refetch → re-render. Show a small `Loader2` spinner in the top bar while loading.
3. **Staff filter change (back to all):** dropdown → "All Department" → `loadData()` → same as initial load.
4. **Refresh button** (top right): re-runs current `loadData(currentStaffId)`.
5. **No URL state** in v1 — filter selection is not persisted in the query string. (Deferred to v2 if Karim wants deep-linking.)
6. **No realtime updates** in v1 — the user refreshes manually or navigates away/back. (Deferred.)

## 10. Loading & Error States

**Skeleton** (while loading):
- Matches the final layout: KPI row (4 rectangles), 2 panel rows (2 rectangles each), recognition strip (3 rectangles).
- Use `Skeleton` from shadcn (existing).
- Show even on filter changes (replaces content briefly, ≤ 400 ms in the happy path).

**Error state:**
- Same pattern as Manager Analytics: dark glass card, `BarChart3` icon, error message from the server action, Retry button.
- Do NOT show stale data on error — replace with the error card so there's no confusion.

## 11. Accessibility

- All recharts charts wrap in a `div` with `role="img"` and an `aria-label` summarizing the data (e.g. `"Peak hours bar chart: highest volume at 10 AM with 14 requests"`).
- Progress bars use `role="progressbar"` + `aria-valuenow/min/max/label` (copy the INN-83 SlaComplianceCard pattern).
- Staff filter dropdown uses the shadcn `Select` which already has correct ARIA.
- Color is never the only information — every trend indicator also has an arrow icon; every status pill also has a label.
- Honor `prefers-reduced-motion`: the recharts bars should not animate on mount when reduced motion is preferred. (recharts supports this via `isAnimationActive={!prefersReducedMotion}`.)

## 12. Acceptance Criteria (behavioral)

These criteria are what the INN-43 acceptance test (`tests/acceptance/INN-43.spec.ts`) must verify BEFORE implementation begins (Rule 14, spec-first testing). Every criterion must verify a user-visible **behavior**, not just structure.

1. **Page loads with department-scoped data.** Logged in as a staff user in "housekeeping", navigating to `/staff/analytics` shows a page titled `"Housekeeping Analytics"` and 4 KPI cards with non-placeholder values (if seed data exists).
2. **KPI values match server-side truth.** The Open Requests count displayed equals the count returned by a direct Supabase query `SELECT count(*) FROM requests WHERE hotel_id = $1 AND department = $2 AND status IN ('new','acknowledged','in_progress')`. Fetched via a test helper and asserted equal.
3. **Staff filter dropdown re-scopes the data.** Selecting an individual staff member from the dropdown triggers a refetch, the page title updates to `"{Name} — Housekeeping"`, and at least one KPI card value changes vs the aggregate view (unless the selected staff handled 100% of department traffic, in which case document and assert that).
4. **Recognition panel mode-switches correctly.** In all-department mode the panel shows a 3-col `"Top Performing Staff"` header. After selecting an individual it shows `"Recent Activity"` header and a table, not cards.
5. **Empty department shows empty state, not a broken page.** Logged in as a staff user whose department has zero requests, the page renders without errors, KPI cards show `"—"`, and every panel shows its EmptyState block.
6. **Cross-department isolation.** A staff user from housekeeping cannot see front-desk data. Assertion: attempt to call `getStaffAnalytics("{frontDeskStaffId}")` as a housekeeping user → returns `{ success: false }`.
7. **Unauthorized role rejected.** A guest user calling the action directly (simulated via a test client) gets `{ success: false, error: "Unauthorized" }` — never gets department data.
8. **Build + typecheck pass.** `npm run build` exits 0 and `npx tsc --noEmit` exits 0 after the implementation.
9. **The Playwright test file `tests/acceptance/INN-43.spec.ts` exists, was committed BEFORE the page.tsx implementation, and passes against the final build.**

## 13. Out of Scope (Explicitly Deferred)

These are real needs but not in INN-43. Document here so they can become their own tickets later.

| Deferred | Why |
|----------|-----|
| Per-staff rating | `ratings` table has no `staff_id` column. Schema migration required. Ticket: future INN-###. |
| Period selector (today / week / month) | v1 is fixed at 7 days to keep the server action simple. Add a `Tabs` selector like Manager Analytics once the base screen ships. |
| Realtime updates via Supabase channels | Adds complexity; the manual refresh button is acceptable for v1. |
| URL query-string state for the staff filter | No deep-link use case today. |
| CSV export of top performers | Manager Analytics doesn't have this either; add to both screens together later. |
| Personal (login-user) stats card | Only valuable if all staff have individual accounts. Revisit post-launch. |
| Mobile-optimized PWA variant | Architecturally staff portal is desktop. Guest PWA covers mobile use cases. |

## 14. Dependencies & References

**Existing code this spec builds on:**
- `src/app/(manager)/manager/analytics/page.tsx` — closest pattern; copy the shell, SLA card, skeleton structure, error state.
- `src/app/actions/analytics.ts` — copy the date-range helpers (`getPeriodStart`, `buildDateRange`), the `getStaffPerformance` rating caveat, the `ActionResult<T>` pattern.
- `src/lib/auth-context.ts` — `resolveStaffContext` (re-used, not changed).
- `src/components/innara/StaffHeader.tsx` — header shell.
- `src/components/innara/PageContainer.tsx`, `PageHeader.tsx` — layout shell.
- `src/constants/app.ts` — `CATEGORY_LABELS`, `CATEGORY_COLORS`, `DEPARTMENT_LABELS`, `STATUS_CONFIG`.
- `src/components/ui/chart.tsx` — `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`.
- `src/components/ui/skeleton.tsx`, `src/components/ui/select.tsx` — shadcn primitives.

**Database tables touched (read-only):**
- `requests` (hotel_id, department, status, category, created_at, acknowledged_at, completed_at, assigned_staff_id)
- `staff_assignments` (user_id, hotel_id, department)
- `profiles` (id, full_name)
- `ratings` (hotel_id, rating) — hotel-level only

**RLS expectations:** all four tables already have RLS policies from Phase 1. The action layer adds explicit `hotel_id` + `department` filters as defense-in-depth; it does not depend on RLS alone.

## 15. Implementation Order

See the separate INN-43 implementation plan at `docs/superpowers/plans/2026-04-09-inn-43-staff-analytics.md`. Brief summary:

1. Write `tests/acceptance/INN-43.spec.ts` from §12 criteria — tests MUST be red before step 2.
2. Build `src/app/actions/staff-analytics.ts` (backend agent).
3. Build `src/app/(staff)/staff/analytics/page.tsx` (frontend agent).
4. Run the Playwright test — it must go green.
5. Visual pipeline Stage 2: screenshot at 1440 px, review against the layout in §4.
6. Run `npm run build` and `npx tsc --noEmit`.
7. Visual baseline lock via `lock-visual-baseline.sh`.
8. Update primer.md, move INN-8 + INN-43 to Done in Notion.
