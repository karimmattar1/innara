# INN-43 — Staff Analytics Screen (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/planning/specs/inn-8-staff-analytics.md` — read this first, the plan is implementation-only.
**Design approved:** 2026-04-09 (Karim, desktop layout option)
**Phase:** 4 — Manager Portal + Billing (testing/design tail)

**Goal:** Ship the department-scoped staff analytics screen at `/staff/analytics` — a new server action, a new page, and a pre-written acceptance test that drives the implementation.

**Architecture:** Follows the existing Manager Analytics pattern (INN-83). Single `"use client"` page backed by one server action. Dark glassmorphism, recharts for the peak-hours chart, inline sub-components for cards/panels. No new shared components — everything composes from existing atoms in `src/components/innara/` and `src/components/ui/`.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS v4, shadcn base-nova (@base-ui/react — NO `asChild`), recharts, lucide-react, Vitest, Playwright.

---

## File Map

| Task | Ticket | File | Purpose | Agent |
|------|--------|------|---------|-------|
| 1 | INN-43 | `e2e/acceptance/INN-43.spec.ts` | Pre-written acceptance test from spec §12 (Playwright `testDir` is `./e2e`) | testing |
| 1 | INN-43 | `e2e/helpers/staff-analytics-helpers.ts` | Test seed helpers (hotel + dept + requests + staff) | testing |
| 2 | INN-43 | `src/app/actions/staff-analytics.ts` | `getStaffAnalytics(staffId?)` server action | backend |
| 2 | INN-43 | `tests/unit/staff-analytics.test.ts` | Vitest unit tests for period/bucket boundaries | backend |
| 3 | INN-43 | `src/app/(staff)/staff/analytics/page.tsx` | Page component + inline sub-components | frontend |

## Existing Code to Reuse (do not duplicate)

- **Pattern reference:** `src/app/(manager)/manager/analytics/page.tsx` — shell, skeleton, error state, SlaComplianceCard structure. Copy + adapt, do NOT rewrite from scratch.
- **Shell components:** `StaffHeader`, `PageContainer`, `PageHeader` from `src/components/innara/`.
- **Chart primitives:** `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` from `src/components/ui/chart.tsx`.
- **shadcn UI:** `Skeleton`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`, `Table` (for recent activity mode).
- **Backend helpers:** `resolveStaffContext` from `src/lib/auth-context.ts`; `ActionResult<T>` from `src/app/actions/requests.ts`.
- **Date helpers in analytics.ts:** `getPeriodStart('week')` and `buildDateRange()` — import and reuse, do NOT duplicate the logic.
- **Constants:** `CATEGORY_LABELS`, `CATEGORY_COLORS`, `STATUS_CONFIG`, `DEPARTMENT_LABELS` from `src/constants/app.ts`.
- **Empty state:** `EmptyState` from `src/components/innara/EmptyState.tsx`.
- **StaffAvatar:** `src/components/innara/StaffAvatar.tsx` for the top-performer cards.

## Data-Fetching Pattern

Copy the manager analytics pattern verbatim, then adapt:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StaffHeader } from "@/components/innara/StaffHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { getStaffAnalytics, type StaffAnalyticsResult } from "@/app/actions/staff-analytics";
import { createClient } from "@/lib/supabase/client";

export default function StaffAnalyticsPage(): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<StaffAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const loadData = useCallback(async (staffId: string | null) => {
    setLoading(true);
    setError(null);
    const result = await getStaffAnalytics(staffId ?? undefined);
    if (!result.success || !result.data) {
      setError(result.error ?? "Failed to load analytics.");
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { void loadData(selectedStaffId); }, [loadData, selectedStaffId]);
  // ... render
}
```

---

## Task List

### Task 1 — Pre-written Acceptance Tests (testing agent)

**Spec-first testing rule (Rule 14):** this file MUST be written, committed, and verified RED before Task 2 starts. The test suite encodes spec §12 as executable Playwright assertions.

**Playwright config note:** `playwright.config.ts` has `testDir: "./e2e"`, `baseURL: "http://localhost:3001"`, and two projects: `chromium` and `mobile-chrome`. The staff analytics screen is desktop-only, so run tests with `--project=chromium` to skip the mobile project. Tests live at `e2e/acceptance/INN-43.spec.ts` — **NOT `tests/acceptance/`** (Vitest lives in `tests/`, Playwright lives in `e2e/`).

- [ ] Create `e2e/helpers/staff-analytics-helpers.ts` with:
  - `seedStaffAnalyticsFixtures(hotelId, department)` — creates N requests across categories, statuses, priorities, and timestamps (via `assigned_staff_id` so the department scoping works). Include at least one `completed` request per category so the SLA pattern has data. Returns the seeded IDs for cleanup.
  - `createTestStaffUser(hotelId, department, role)` — returns `{ userId, email, password }` for logging in via the UI. Creates an entry in `staff_assignments` linking the user to the department.
  - `countOpenRequestsForDepartment(hotelId, department)` — helper that mirrors the server action's filter: joins `requests` → `staff_assignments` via `assigned_staff_id = user_id` and counts `status IN ('new','pending','in_progress')`. Used by test #2 to assert rendered value equals server truth.
  - `cleanupStaffAnalyticsFixtures(hotelId)` — deletes the test data (requests, staff_assignments, user_roles rows, auth users).
  - Uses the Supabase admin client (service role via `@supabase/supabase-js` + `SUPABASE_SERVICE_ROLE_KEY` env var) — test-only, never in prod code.
- [ ] Create `e2e/acceptance/INN-43.spec.ts` with one `test.describe('INN-43 staff analytics', ...)` block containing one `test(...)` per criterion in spec §12 (9 tests total).
- [ ] Each test must verify a **behavior**: perform a user action (log in, click, select) and assert a **visible outcome** (rendered value, page title, pill text, table rows). Do NOT assert element presence alone — that's structure, not behavior.
- [ ] Test #2 (KPI values match server-side truth) uses `countOpenRequestsForDepartment` and compares to the rendered `Open Requests` KPI value.
- [ ] Test #6 (cross-department isolation) calls `getStaffAnalytics({staffIdFromOtherDept})` via a server-action test helper (import from `@/app/actions/staff-analytics` or fetch through an API route) and asserts `{success: false, error: "Staff member not found in your department."}`.
- [ ] Test #7 (unauthorized role) logs in as a guest user and expects the page to redirect to `/auth/staff/login` (match the `e2e/staff-portal.spec.ts` redirect pattern).
- [ ] Run the suite: `npx playwright test e2e/acceptance/INN-43.spec.ts --project=chromium`. Expected: ALL tests FAIL (red), because the page and action do not exist yet.
- [ ] Commit the test file and helpers with message: `test(INN-43): pre-written acceptance tests for staff analytics (spec-first)`. Do NOT bundle with the implementation commit.

**Verification:** `npx playwright test e2e/acceptance/INN-43.spec.ts --project=chromium` exits nonzero with failures reported for every test. Paste the output into the task report.

### Task 2 — Server Action `getStaffAnalytics` (backend agent)

**Schema reality check (MUST read spec §8 first):** The `requests` table has NO `department`, NO `acknowledged_at`, and NO `sla_breached_at` columns. The `request_status` enum has NO `acknowledged` value. Department scoping is done via `staff_assignments.user_id` → `requests.assigned_staff_id`. SLA compliance is computed at query time via `sla_configs`.

- [ ] Create `src/app/actions/staff-analytics.ts` starting with `"use server"`.
- [ ] Copy imports from `src/app/actions/analytics.ts` (`resolveStaffContext`, `ActionResult`, `createClient`, `z`, `getPeriodStart`, `buildDateRange`). If `getPeriodStart` / `buildDateRange` are not exported, export them from `analytics.ts` in this task (do not duplicate the logic — single source of truth).
- [ ] Export the `StaffAnalyticsResult` interface exactly as defined in spec §8.
- [ ] Implement `getStaffAnalytics(staffId?: string)`:
  - [ ] Resolve auth context; if `ctx.error`, return `{ success: false, error: ctx.error }`.
  - [ ] Do NOT gate on `isManagerRole` — staff, front_desk, AND manager roles are allowed (per spec §8).
  - [ ] Extract `hotelId = ctx.assignment.hotel_id` and `department = ctx.assignment.department`.
  - [ ] **Fetch department staff IDs first:** `SELECT user_id FROM staff_assignments WHERE hotel_id = $1 AND department = $2 AND is_active = true`. Store as `deptStaffIds: string[]`. If empty, short-circuit: return a zeroed `StaffAnalyticsResult` with `staffFilter.options = []`.
  - [ ] If `staffId` is provided AND `staffId NOT IN deptStaffIds`: return `{ success: false, error: "Staff member not found in your department." }`.
  - [ ] Compute `periodStart = getPeriodStart("week")` (7 days ago ISO). Compute `prevPeriodStart` as a Date 14 days ago, `prevPeriodEnd = periodStart`.
  - [ ] Build `filterIds = staffId ? [staffId] : deptStaffIds`.
  - [ ] Fetch current-window requests: `.from("requests").select("id, category, priority, status, assigned_staff_id, eta_minutes, created_at, completed_at, room_number").eq("hotel_id", hotelId).in("assigned_staff_id", filterIds).gte("created_at", periodStart)`.
  - [ ] Fetch previous-window requests with the same filter but `.gte("created_at", prevPeriodStart).lt("created_at", periodStart)`. Only needed for slaCompliancePrevPct and completionRatePrevPct.
  - [ ] Fetch `sla_configs` (hotel-scoped) for the SLA compliance calculation. Build the `category:priority → target_minutes` map exactly as in `getRequestAnalytics` lines 324-340.
  - [ ] Fetch `profiles` for all `deptStaffIds` to get names for the filter dropdown + top staff cards.
  - [ ] Fetch `ratings` aggregate for hotel (same caveat as existing `getStaffPerformance` — hotel average, not per-staff).
  - [ ] Compute:
    - `kpis.openRequests` — count where `status IN ('new','pending','in_progress')`
    - `kpis.slaCompliancePct` — copy SLA logic from `getRequestAnalytics` lines 342-370: iterate completed requests, compare `(completed_at - created_at)/60000` to target from slaMap (or `eta_minutes` fallback), count on-time/breached, compute pct
    - `kpis.slaCompliancePrevPct` — same calc against previous-window requests
    - `kpis.avgResolutionMinutes` — average of `(completed_at - created_at)/60000` for completed requests only; 0 if none
    - `kpis.completionRatePct` — `completed / total * 100` (round to int)
    - `kpis.completionRatePrevPct` — same against previous-window
    - `taskBreakdown` — group by `category`, sorted desc, filter count > 0
    - `workload.byStatus` — group current-window by status, ensure keys `{new, pending, in_progress, completed}` are always present (even zero)
    - `workload.completionRatePct` — same as kpis.completionRatePct
    - `peakHours` — array of 24 `{ hour, count }`, hour extracted from `new Date(r.created_at).getUTCHours()`. Always length 24 (fill zeros for empty hours).
    - `resolutionTimeBuckets` — bucket each completed request's resolution time into `fast` (<15min), `normal` (15-30), `slow` (30-60), `critical` (>60). Skip non-completed requests.
    - `topStaff` — group completed requests by `assigned_staff_id`, aggregate count + avg resolution, join with profiles, sort by count desc, take top 3. Set `rating = hotelAvgRating` per the caveat.
    - `recentActivity` — null in all-department mode; in individual mode, sort requests by `created_at desc`, take 10, map to the shape in spec §8.
    - `department` — the raw department string from `ctx.assignment.department`
    - `staffFilter.options` — `[{id, name}]` for every row in deptStaffIds (joined with profiles)
    - `staffFilter.selected` — `staffId ?? null`
  - [ ] Return `{ success: true, data: result }`.
  - [ ] Wrap everything in `try/catch` — log via `console.error("[staff-analytics]", err)`, return `{ success: false, error: "Something went wrong." }` on uncaught.
- [ ] Run: `npx tsc --noEmit` — must pass with zero errors in this file.
- [ ] Write a Vitest unit test at `tests/unit/staff-analytics.test.ts` covering:
  - [ ] Period boundaries (week = 7 days ago, sanity check using fake timers)
  - [ ] Bucket boundaries (14.99 min → fast, 15.0 min → normal, 29.99 → normal, 30.0 → slow, 59.99 → slow, 60.0 → critical)
  - [ ] Peak hours always length 24, sum equals request count
  - [ ] Empty department returns zeroed result with `staffFilter.options = []`
  - [ ] SLA compliance uses `sla_configs` entry first, falls back to `eta_minutes`
  - Use mocked Supabase client responses so tests run in isolation (no DB).
- [ ] Run: `npx vitest run tests/unit/staff-analytics.test.ts` — all pass.

**Verification:** `npx tsc --noEmit` exits 0; `npx vitest run tests/unit/staff-analytics.test.ts` exits 0; paste counts into task report.

### Task 3 — Page Component (frontend agent)

- [ ] Create `src/app/(staff)/staff/analytics/page.tsx` starting with `"use client"`.
- [ ] Copy the shell (imports, page function signature, data-fetching pattern) from Manager Analytics page — adapt `ManagerHeader` → `StaffHeader`, `getRequestAnalytics` → `getStaffAnalytics`, etc.
- [ ] Implement the skeleton component `StaffAnalyticsSkeleton` matching the final layout (4 KPI rectangles, 2 panel rows, 1 recognition strip).
- [ ] Implement the error state card — copy Manager Analytics error state verbatim, swap icon if needed.
- [ ] Implement inline sub-components:
  - [ ] `KpiCard({ label, value, icon, trendDelta?, trendPrev? })` — 4 instances. KPI #3 is `Avg Resolution Time` (not Response Time).
  - [ ] `TaskBreakdownCard({ data })` — horizontal bar list by category.
  - [ ] `WorkloadOverviewCard({ data })` — completion rate + status pills (reuse SLA card structure). Use `STATUS_CONFIG.pending.label` for the pending pill ("Accepted").
  - [ ] `PeakHoursCard({ data })` — recharts `BarChart` wrapped in `ChartContainer`.
  - [ ] `ResolutionTimeCard({ data })` — horizontal bar list with color buckets (fast/normal/slow/critical; thresholds 15/30/60 min).
  - [ ] `TopStaffCard({ staff })` — 3-col grid of rank badges + StaffAvatar.
  - [ ] `RecentActivityCard({ activity })` — table of last 10 requests.
  - [ ] `StaffFilterDropdown({ options, selected, onChange })` — shadcn `Select` (NO `asChild`).
- [ ] Wire up the layout exactly as spec §4.
- [ ] Title logic (spec §5):
  - All-department: `` `${DEPARTMENT_LABELS[data.department] ?? data.department} Analytics` ``
  - Individual: `` `${selectedStaff.name} — ${DEPARTMENT_LABELS[data.department] ?? data.department}` ``
- [ ] Recognition panel mode switch: if `selectedStaffId === null`, render `TopStaffCard`; else render `RecentActivityCard`.
- [ ] Empty-state handling: if `kpis.openRequests === 0 && taskBreakdown.length === 0`, render the overall `EmptyState` card INSTEAD of the KPI row + panels. Keep the header + filter dropdown visible.
- [ ] Accessibility (spec §11):
  - [ ] `role="img"` + `aria-label` on each chart wrapper.
  - [ ] `role="progressbar"` + aria attrs on the completion-rate bar.
  - [ ] `prefers-reduced-motion` check → pass `isAnimationActive={!prefersReducedMotion}` to recharts components.
- [ ] Add a left-nav / breadcrumb entry to `StaffHeader` if the header has a nav prop — otherwise the page is linked from the staff home dashboard (check `src/app/(staff)/staff/page.tsx` quick-actions and add a link).
- [ ] Run the Task 1 acceptance tests: `npx playwright test e2e/acceptance/INN-43.spec.ts --project=chromium`. Expected: ALL 9 PASS now.
- [ ] Run: `npm run build` — must exit 0.
- [ ] Run: `npx tsc --noEmit` — must exit 0.

**Verification:** all 3 commands pass; paste output into task report. All 9 acceptance tests green.

### Task 4 — Visual Verification (frontend agent, Stage 2 of Visual Pipeline)

- [ ] Write a one-off Playwright script at `tests/visual/inn-43-screenshot.ts` that:
  - Logs in as a test staff user (housekeeping, seeded)
  - Navigates to `/staff/analytics`
  - Waits for `loading === false`
  - Screenshots at 1440×900: `screenshots/inn-43-all-dept.png`
  - Opens the staff dropdown, selects an individual, waits for refetch
  - Screenshots at 1440×900: `screenshots/inn-43-individual.png`
  - Resizes to 768×1024, screenshots: `screenshots/inn-43-tablet.png`
- [ ] Read each screenshot via the Read tool and self-review against spec §4 (layout) + §6–§7 (panel specs).
- [ ] If anything looks wrong: fix, re-screenshot, re-review. Loop until both checks pass:
  - **Layout check** — matches spec §4 ASCII.
  - **Design quality check** — glass cards are actually glassmorphic (not flat), Bronze accent is visible, spacing is tight, no scaffolding vibe.
- [ ] Show screenshots to Karim for final approval via AskUserQuestion.
- [ ] On approval: run `~/SwampStudios/scripts/lock-visual-baseline.sh innara "staff-analytics" http://localhost:3001/staff/analytics` to lock the baseline.

**Verification:** both screenshots exist, self-review passes both checks, Karim approves, baseline lock script exits 0.

### Task 5 — Ticket + Primer Updates (pm-agent)

- [ ] Update Notion INN-43 page: status → Done. Add "Done (2026-04-09)" comment with link to the commit SHA.
- [ ] Update Notion INN-8 page: status → Done. Add "Approved spec at docs/planning/specs/inn-8-staff-analytics.md" comment.
- [ ] Update `primer.md` — move INN-8 and INN-43 from "Remaining" to "Wave 4 Cross-Cutting" DONE list. Update "Next session" line to reflect INN-11 as next.
- [ ] Update the Phase 4 — Remaining Work Notion page: cross off INN-8 and INN-43 from the Ticket Sequence table.

**Verification:** Notion pages refetched and show "Done" status. primer.md grep for `INN-43` shows it in the DONE section.

---

## Global Verification (before closing the plan)

Run ALL of these fresh in the same turn you claim completion (Rule: The Done Moment):

1. `npm run build` → exit 0
2. `npx tsc --noEmit` → exit 0
3. `npx vitest run` → 0 failures (full suite, not just new tests — Rule 6 regression check)
4. `npx playwright test e2e/acceptance/INN-43.spec.ts --project=chromium` → all 9 pass
5. `npx playwright test --project=chromium` (full suite, if under 5 min) → 0 failures, or document which pre-existing failures are unrelated
6. `git status` → clean working tree after commit
7. `git log --oneline -3` → shows the test commit separate from the implementation commit

Then invoke `/verification-before-completion` and ONLY THEN write the completion summary.

## Rollback

If anything breaks production after merge: revert the single merge commit. All changes are additive (1 new action file, 1 new page, 1 new test file, 1 new helper file) — no migrations, no edits to existing paths except the optional nav link in `src/app/(staff)/staff/page.tsx`, which can be left in place without harm.

## Risk Notes

1. **Rating caveat persists.** Per-staff rating is not in the schema. Top-performer cards show hotel-average rating (same as Manager Analytics). Surface this to Karim during Stage 2 review if the design reads as misleading.
2. **Peak-hours UTC vs local time.** The hour field uses UTC — if Karim wants the x-axis in the hotel's local time zone, that's a follow-up ticket (the hotels table has `timezone` — we just aren't using it yet).
3. **Individual mode with no activity.** If the selected staff has zero requests in the window, the Recent Activity table is empty and all KPI cards read "—". This is correct, not a bug.
4. **Department label mismatch.** If a hotel has a custom department name not in `DEPARTMENT_LABELS`, the title falls back to the raw column value. Follow the Manager Analytics pattern for this (it has the same edge case).
5. **No `acknowledged_at` column.** The schema has no first-response timestamp, so "Avg Response Time" is not computable. We use "Avg Resolution Time" (`completed_at - created_at` on completed rows) instead. If a schema migration later adds `acknowledged_at`, this panel can be upgraded.
6. **`requests` has no `department` column.** Department scoping goes through `staff_assignments.user_id = requests.assigned_staff_id`. Every query filter in the action must include `.in("assigned_staff_id", deptStaffIds)`.
7. **Unassigned requests are invisible to this view.** Any request with `assigned_staff_id = null` will NOT appear in staff analytics because the filter excludes them. This is by design — the trigger `trg_assign_request_to_staff` auto-assigns new requests, so unassigned rows should be rare. Document this in the QA note when reviewing with Karim.

## Related

- **Spec:** `docs/planning/specs/inn-8-staff-analytics.md`
- **Ticket parent:** `docs/planning/phases.md` — Phase 4
- **Approval record:** primer.md line 61, 2026-04-09 AskUserQuestion interaction
- **Reference pattern:** `src/app/(manager)/manager/analytics/page.tsx`
- **Similar backend action:** `src/app/actions/analytics.ts` → `getRequestAnalytics` (SLA compliance pattern), `getStaffPerformance` (dept staff aggregation pattern)
- **Test harness pattern:** `e2e/staff-portal.spec.ts` (auth-guard redirect pattern), `e2e/auth.spec.ts` (login helpers)
