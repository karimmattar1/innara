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
| 1 | INN-43 | `tests/acceptance/INN-43.spec.ts` | Pre-written acceptance test from spec §12 | testing |
| 2 | INN-43 | `src/app/actions/staff-analytics.ts` | `getStaffAnalytics(staffId?)` server action | backend |
| 3 | INN-43 | `src/app/(staff)/staff/analytics/page.tsx` | Page component + inline sub-components | frontend |
| 4 | INN-43 | `tests/helpers/staff-analytics-helpers.ts` | Test seed helpers (hotel + dept + requests + staff) | testing |

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

- [ ] Create `tests/helpers/staff-analytics-helpers.ts` with:
  - `seedStaffAnalyticsFixtures(hotelId, department)` — creates N requests across categories, statuses, and timestamps to cover KPI + panel assertions deterministically.
  - `createTestStaffUser(hotelId, department, role)` — returns `{ userId, email, password }` for logging in via the UI.
  - `cleanupStaffAnalyticsFixtures(hotelId)` — truncates the test data.
  - Uses the Supabase admin client (service role) — test-only, never in prod code.
- [ ] Create `tests/acceptance/INN-43.spec.ts` with one `test.describe('INN-43 staff analytics', ...)` block containing one `test(...)` per criterion in spec §12 (9 tests total).
- [ ] Each test must verify a **behavior**: perform a user action (log in, click, select) and assert a **visible outcome** (rendered value, page title, pill text, table rows). Do NOT assert element presence alone — that's structure, not behavior.
- [ ] Test #2 (KPI values match server-side truth) requires a helper that queries Supabase directly and compares to the rendered value.
- [ ] Test #6 (cross-department isolation) must call `getStaffAnalytics({staffIdFromOtherDept})` via a server-action test helper and assert `{success: false}`.
- [ ] Test #7 (unauthorized role) logs in as a guest user and expects the page to either redirect or return an error state — match whatever the middleware already does for other staff-only routes.
- [ ] Run the suite: `npx playwright test tests/acceptance/INN-43.spec.ts`. Expected: ALL tests FAIL (red), because the page and action do not exist yet.
- [ ] Commit the test file with message: `test(INN-43): pre-written acceptance tests for staff analytics (spec-first)`. Do NOT bundle with the implementation commit.

**Verification:** `npx playwright test tests/acceptance/INN-43.spec.ts` exits nonzero with failures reported for every test. Paste the output into the task report.

### Task 2 — Server Action `getStaffAnalytics` (backend agent)

- [ ] Create `src/app/actions/staff-analytics.ts` starting with `"use server"`.
- [ ] Copy imports from `src/app/actions/analytics.ts` (`resolveStaffContext`, `ActionResult`, `createClient`, `z`, `getPeriodStart`, `buildDateRange`).
- [ ] Export the `StaffAnalyticsResult` interface exactly as defined in spec §8.
- [ ] Implement `getStaffAnalytics(staffId?: string)`:
  - [ ] Resolve auth context; if `ctx.error`, return `{ success: false, error: ctx.error }`.
  - [ ] Do NOT gate on `isManagerRole` — staff, front_desk, AND manager roles are allowed (per spec §8).
  - [ ] Extract `hotelId = ctx.assignment.hotel_id` and `department = ctx.assignment.department`.
  - [ ] If `staffId` is provided: query `staff_assignments` to verify the staffId belongs to the same `hotelId` + `department`. If not, return `{ success: false, error: "Staff member not found in your department." }`.
  - [ ] Compute `periodStart = getPeriodStart("week")` and `prevPeriodStart` (14 days ago).
  - [ ] Fetch current-window requests: `SELECT id, category, status, assigned_staff_id, created_at, acknowledged_at, completed_at FROM requests WHERE hotel_id = $1 AND department = $2 AND created_at >= $3` (+ `assigned_staff_id = $4` if staffId provided).
  - [ ] Fetch previous-window requests with the same filter but `created_at BETWEEN prevPeriodStart AND periodStart` — aggregated only (just completed count + SLA on-time count).
  - [ ] Fetch `staff_assignments` for department staff list (the filter dropdown).
  - [ ] Fetch `profiles` for names.
  - [ ] Fetch `ratings` for hotel average (same caveat as existing `getStaffPerformance`).
  - [ ] Compute:
    - `kpis.openRequests` — count where `status IN ('new','acknowledged','in_progress')`
    - `kpis.slaCompliancePct` — from `sla_breached_at` column or a computed compare (follow Manager Analytics logic)
    - `kpis.avgResponseMinutes` — average of `(acknowledged_at - created_at)` for acknowledged requests, or `(completed_at - created_at)` if no ack, in minutes
    - `kpis.completionRatePct` — `completed / total * 100`
    - `kpis.slaCompliancePrevPct`, `kpis.completionRatePrevPct` — same from prev window
    - `taskBreakdown` — group by `category`, sorted desc
    - `workload` — group by `status`, compute completion rate
    - `peakHours` — array of 24 `{ hour, count }`, hour extracted from `created_at` UTC hour. Always length 24.
    - `responseTimeBuckets` — bucket each request's response time; skip requests still in `new` status
    - `topStaff` — aggregate per assigned_staff_id, join with profiles, top 3 by requestsHandled desc
    - `recentActivity` — null in all-department mode; array of 10 most recent requests in individual mode
    - `department` — the scoped department label
    - `staffFilter` — `options: [...departmentStaff]`, `selected: staffId ?? null`
  - [ ] Return `{ success: true, data: result }`.
  - [ ] Wrap everything in `try/catch` — log via `console.error("[staff-analytics]", err)`, return `{ success: false, error: "Something went wrong." }` on uncaught.
- [ ] Run: `npx tsc --noEmit` — must pass with zero errors in this file.
- [ ] Write a Vitest unit test at `tests/unit/staff-analytics.test.ts` covering:
  - [ ] Period boundaries (today / week / 7d window)
  - [ ] Bucket boundaries (4.99 min → fast, 5.0 min → normal, 14.99 min → normal, 15.0 min → slow, etc.)
  - [ ] Peak hours always length 24
  - [ ] Empty department returns zeroed result
- [ ] Run: `npx vitest run tests/unit/staff-analytics.test.ts` — all pass.

**Verification:** `npx tsc --noEmit` exits 0; `npx vitest run tests/unit/staff-analytics.test.ts` exits 0; paste counts into task report.

### Task 3 — Page Component (frontend agent)

- [ ] Create `src/app/(staff)/staff/analytics/page.tsx` starting with `"use client"`.
- [ ] Copy the shell (imports, page function signature, data-fetching pattern) from Manager Analytics page — adapt `ManagerHeader` → `StaffHeader`, `getRequestAnalytics` → `getStaffAnalytics`, etc.
- [ ] Implement the skeleton component `StaffAnalyticsSkeleton` matching the final layout (4 KPI rectangles, 2 panel rows, 1 recognition strip).
- [ ] Implement the error state card — copy Manager Analytics error state verbatim, swap icon if needed.
- [ ] Implement inline sub-components:
  - [ ] `KpiCard({ label, value, icon, trendDelta?, trendPrev? })` — 4 instances.
  - [ ] `TaskBreakdownCard({ data })` — horizontal bar list by category.
  - [ ] `WorkloadOverviewCard({ data })` — completion rate + status pills (reuse SLA card structure).
  - [ ] `PeakHoursCard({ data })` — recharts `BarChart` wrapped in `ChartContainer`.
  - [ ] `ResponseTimeCard({ data })` — horizontal bar list with color buckets.
  - [ ] `TopStaffCard({ staff })` — 3-col grid of rank badges + StaffAvatar.
  - [ ] `RecentActivityCard({ activity })` — table of last 10 requests.
  - [ ] `StaffFilterDropdown({ options, selected, onChange })` — shadcn `Select` (NO `asChild`).
- [ ] Wire up the layout exactly as spec §4.
- [ ] Title logic (spec §5):
  - All-department: `` `${DEPARTMENT_LABELS[data.department]} Analytics` ``
  - Individual: `` `${selectedStaff.name} — ${DEPARTMENT_LABELS[data.department]}` ``
- [ ] Recognition panel mode switch: if `selectedStaffId === null`, render `TopStaffCard`; else render `RecentActivityCard`.
- [ ] Empty-state handling: if `kpis.openRequests === 0 && taskBreakdown.length === 0`, render the overall `EmptyState` card INSTEAD of the KPI row + panels. Keep the header + filter dropdown visible.
- [ ] Accessibility (spec §11):
  - [ ] `role="img"` + `aria-label` on each chart wrapper.
  - [ ] `role="progressbar"` + aria attrs on the completion-rate bar.
  - [ ] `prefers-reduced-motion` check → pass `isAnimationActive={!prefersReducedMotion}` to recharts components.
- [ ] Add a left-nav / breadcrumb entry to `StaffHeader` if the header has a nav prop — otherwise the page is linked from the staff home dashboard (check `src/app/(staff)/staff/page.tsx` quick-actions and add a link).
- [ ] Run the Task 1 acceptance tests: `npx playwright test tests/acceptance/INN-43.spec.ts`. Expected: ALL PASS now.
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
4. `npx playwright test tests/acceptance/INN-43.spec.ts` → all 9 pass
5. `npx playwright test` (full suite, if under 5 min) → 0 failures, or document which pre-existing failures are unrelated
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

## Related

- **Spec:** `docs/planning/specs/inn-8-staff-analytics.md`
- **Ticket parent:** `docs/planning/phases.md` — Phase 4
- **Approval record:** primer.md line 61, 2026-04-09 AskUserQuestion interaction
- **Reference pattern:** `src/app/(manager)/manager/analytics/page.tsx`
- **Similar backend action:** `src/app/actions/analytics.ts` → `getStaffPerformance`
- **Test harness pattern:** (any existing `tests/acceptance/*.spec.ts` from Phase 3)
