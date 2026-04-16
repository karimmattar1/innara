# Innara -- Primer

## Current State
- **Phase:** Post-Phase 6 — premium landing + platform-wide UI unification (shipped to production)
- **Last Updated:** 2026-04-14
- **Notion:** INN project (migrated from Linear)

## What's Done
- Phase 1: Foundation — completed 2026-03-28, passed phase review
- Phase 2: Core Features — completed 2026-03-29, passed phase review
- Phase 3: Supporting Features — completed 2026-03-29, review passed (score 71/100)

## Phase 4 Progress
**Wave 0 — Debt Cleanup (DONE):** Shared helpers, dead code removal, -469 lines

**Wave 1 — Backend Actions (DONE):** analytics.ts, staff-management.ts, billing.ts, branding.ts, email.ts, Stripe webhook

**Wave 2 — Manager Portal Core Screens (6 tickets, DONE):**
- INN-80: Manager Dashboard — KPI MetricCards, period selector, recent requests, quick actions
- INN-82: Manager Requests — filters, bulk ops, status transitions, pagination, staff assignment
- INN-83: Manager Analytics — recharts line/bar/area charts, staff performance table, revenue, SLA compliance
- INN-85: Manager Catalog — Menu items tab (category filter + grid), Services tab (CRUD dialog + inline Switch toggle)
- INN-87: Manager Staff — roster table, invite dialog, invitation management, department change, deactivate/reactivate
- INN-88: Manager Ops — SLA config with inline editing, color-coded target times, grouped by category

**Wave 3 — Manager Portal Additional Screens (7 tickets, DONE):**
- INN-95: Manager Billing — Stripe subscription management, plan selector, cancel with AlertDialog
- INN-96: Manager Branding — white-label config (logos, colors, fonts, CSS, welcome message, live preview)
- INN-98: Manager Permissions — static role-based permissions matrix, role description cards
- INN-100: Manager Go-Live Checklist — auto-verified + manual toggle items, progress bar, localStorage
- INN-102: Manager Settings + Health — hotel settings form, system health status cards
- INN-93: Manager Integrations — PMS, Stripe, Email, AI concierge cards + webhook status + API keys
- INN-120: Manager Profile — profile editing, password change, account info, danger zone

**Wave 4 — Cross-Cutting Features (6 tickets, DONE):**
- INN-139: Service hours server actions (schedule management, time-based availability)
- INN-140: Stripe webhook resilience (idempotency via audit_logs, failure alerting, retry-safe upserts)
- INN-143: Audit trail expansion (shared logAudit utility, staff/requests/orders audit logging)
- INN-105: Dynamic branding CSS injection (BrandingStyles server component, sanitized CSS vars, guest layout integration)
- INN-141: Invitation lifecycle (expiry checking, resend cooldown, duplicate prevention, manual expire)
- INN-145: Role change workflow (changeStaffRole, getStaffRole, JWT refresh note)

**Remaining Phase 4 tickets (testing/design) — ALL DONE:**
- INN-108: Manager portal E2E suite — **✅ DONE 2026-04-11** — 59 Playwright tests covering 14 manager routes (auth guards, URL param bypass, screenshots, navigation, authenticated content)
- INN-94: Cross-portal integration E2E tests — **✅ DONE 2026-04-11** — 13 Playwright tests (auth isolation, route separation, dual context independence, API health, cross-portal routing)
- INN-11: Manager notification center — **✅ DONE 2026-04-10** — full page + enhanced drawer, 14 ACs, spec at `docs/planning/specs/inn-11-manager-notification-center.md`
- INN-8: Staff analytics design — **✅ DONE 2026-04-09** — desktop layout approved, spec at `docs/planning/specs/inn-8-staff-analytics.md`
- INN-43: Staff analytics screen — **✅ DONE 2026-04-10** — built spec-first, 37/37 acceptance tests pass, visually verified at 1440×900 desktop (week + month views) and 768×1024 tablet

**INN-8 Resolution Summary (2026-04-09):**
Karim approved the desktop layout via AskUserQuestion. Key architectural decision: the staff portal is **desktop** per Innara CLAUDE.md (only Guest is mobile PWA), so the original ticket's "mobile-first per Stitch" wording is superseded. Final layout follows the Manager Analytics pattern: PageHeader + 4 KPI cards + 2-col panel rows + full-width recognition panel. Department-scoped only (no per-staff rating, no personal stats — deferred per spec §13).

**INN-43 Resolution Summary (2026-04-10):**
Built spec-first per Rule 14: 37 pre-written acceptance tests → `src/lib/staff-analytics-compute.ts` pure helpers → `src/app/actions/staff-analytics.ts` server action → `src/app/(staff)/staff/analytics/page.tsx` component. Pure-helper pattern enables full unit test coverage without Supabase mocks. Visual verification captured 3 authenticated screenshots (desktop week, desktop month, tablet) after enabling the JWT custom_access_token_hook in Supabase Dashboard. Discovered and fixed a pre-existing dark-mode text bug: `.dark` wrapper div in `(staff)/layout.tsx` and `(manager)/layout.tsx` was redefining `--foreground` but not applying `color: var(--foreground)`, so children inherited the body's light-theme color. Single-word fix: added `text-foreground` to both layout wrappers. Also discovered pre-existing responsive nav overlap in shared `PortalHeader.tsx:68` at exactly 768px (hidden md:flex absolute left-1/2) — filed as separate ticket, out of scope for INN-43.

**INN-11 Resolution Summary (2026-04-10):**
Karim approved "Full page + enhanced drawer" design. Reused existing notification infrastructure (table, 6 server actions, NotificationDrawer, useNotifications hook). Added `notificationTypes` array filter to `getMyNotifications` schema+query. Built `/manager/notifications` page with 5 tabs (All, Operations, Messages, Alerts, System), unread toggle, optimistic mark-as-read, load-more pagination, and glass-card-dark styling. Added "View all notifications" Link to NotificationDrawer footer (dark variant only). 27 pre-written acceptance tests, 14 ACs. `createNotification` event triggers deferred to Phase 5.

**INN-108 + INN-94 Resolution Summary (2026-04-11):**
Manager portal E2E suite: 59 Playwright tests across 7 test groups — auth guards for all 14 manager routes, URL param bypass protection, desktop (1440×900) and tablet (768×1024) screenshots, navigation flow consistency, login page interaction, and authenticated screen content verification (dual-path: works with or without test credentials). Cross-portal integration: 13 tests verifying auth isolation (guest/staff/manager redirects are independent), route separation (all three portal roots routable), dual browser context independence, API route health (health endpoint + Stripe webhook signature rejection), and cross-portal notification path routing.

**Phase 4 Review (2026-04-11):** PASS 85/100. GPT-4o: PASS, Gemini: FAIL (false positives — diff-limited review), Claude: CONDITIONAL PASS. Consensus FAIL overridden — all PLAN_GAP items verified to exist in codebase. Fixes applied: extracted shared `resolveManagerContext` to `auth-context.ts` (-3 duplicates), removed TODO comment from `staff-analytics.ts`. Pre-existing lint warnings (react-hooks/set-state-in-effect) deferred — codebase-wide pattern, not Phase 4 regression.

## Phase 5 Progress
**All 8 tickets DONE — 2026-04-11:**
- INN-113: Admin tenant management — CRUD UI, deactivate/activate cascade, tenant detail page
- INN-114: Admin user/plan/health management — user search, plan tiers, system health dashboard
- INN-115: PWA — service worker (cache-first/network-first), offline page, install prompt, background sync
- INN-116: PMS Mews integration — IPMSAdapter interface, webhook handler, reservation sync
- INN-117: i18n EN/AR — next-intl, cookie-based locale, RTL support, LanguageToggle component
- INN-118: GDPR compliance — data export (Article 20), anonymization (Article 17), hotel deactivation cascade
- INN-119: PMS sync recovery — conflict resolver, data validator, network resilience hook (exponential backoff)
- INN-121: Phase 5 E2E tests — 46 Playwright tests (admin auth guards, PMS webhook, PWA offline, API health)

**New files:** `src/lib/supabase/admin.ts` (service role client), `src/lib/auth-context.ts` (added resolveAdminContext), `src/app/actions/admin-*.ts` (3 action files), `src/app/actions/privacy.ts` (GDPR), `src/app/(admin)/admin/**` (5 admin routes), `public/manifest.json`, `public/sw.js`, `src/app/offline/page.tsx`, `src/components/guest/InstallPrompt.tsx`, `src/components/guest/ServiceWorkerRegistration.tsx`, `src/hooks/use-offline-queue.ts`, `src/hooks/use-network-resilience.ts`, `src/lib/integrations/pms/**` (types, mews-adapter, validator, conflict-resolver), `src/app/api/webhooks/pms/route.ts`, `src/i18n/**` (config, request, en.json, ar.json), `src/components/guest/LanguageToggle.tsx`, `e2e/admin-portal.spec.ts`

**Verification:** tsc 0 errors, build success, Vitest 133 passed, Playwright 404 passed (55.5s)

## Phase 6 Progress
**All 5 tickets DONE — 2026-04-13:**
- INN-122: E2E test suites — guest-flows (55 tests), staff-flows (55 tests), enhanced GitHub Actions workflow
- INN-123: Security audit — OWASP Top 10, RLS audit (33 tables), input validation audit, auth boundary tests
- INN-124: Performance benchmarks — Lighthouse CI config, Core Web Vitals tests (FCP, CLS, page load budgets)
- INN-125: PII data protection — cross-tenant isolation tests (26 tests), pentest scope doc, PII audit doc
- INN-126: Launch checklist — 31/45 items complete (69%), .env.production.example, status summary

**New files:** `e2e/guest-flows.spec.ts`, `e2e/staff-flows.spec.ts`, `e2e/performance.spec.ts`, `e2e/cross-tenant-isolation.spec.ts`, `e2e/security-auth-boundaries.spec.ts`, `lighthouserc.json`, `.env.production.example`, `tests/security/rls-audit.ts`, `tests/security/input-validation-audit.ts`, `docs/security/pii-audit.md`, `docs/security/pentest-scope.md`, `docs/launch/checklist.md`

**Phase 5 review fixes (pre-Phase 6):** UUID validation on PMS webhook, Sentry logging in Mews adapter, ilike pattern sanitization, GDPR cascade error handling, hotel deactivation cascade error handling

**Verification:** tsc 0 errors, build success, Vitest 133 passed, Playwright 634 passed (1.2m)

## Post-Phase 6: Landing + Platform UI Unification (2026-04-13 → 2026-04-14)

**Premium landing page rebuild (shipped to production https://innara-two.vercel.app):**
- Public root `/` — no auth required (middleware updated to bypass for landing)
- Composition: `LandingNav` → `LandingHero` → `LandingStats` → `LandingServices` → `LandingFeatures` → `LandingDemo` → `LandingBrands` → `LandingContact` → `LandingFooter`
- Typography: Inter (body) + Playfair Display (headings) via `next/font/google`, CSS vars `--font-inter`, `--font-playfair`
- Smooth-scroll nav with section anchors (#features, #demo, #brands, #contact)
- Sliding service category chips marquee (AI Concierge, Room Service, Housekeeping, Valet, Spa & Wellness, etc.)
- Floating iPhone 15 Pro demo section with three-phone composition and floating badges (Bot + CheckCircle Lucide icons, no emojis)
- Dual-row testimonial marquee (forward + reverse) with MagicCard mouse-tracking glow
- Contact CTA with ShimmerButton + BorderBeam

**Component library (`src/components/ui/`, 13 new premium components):**
- `glass-button.tsx` — CVA button (default, bronze, ghost, solid variants)
- `shimmer-button.tsx` — animated shimmer sweep
- `border-beam.tsx` — CSS offset-path orbiting border glow (bronze gradient)
- `magic-card.tsx` — mouse-tracking radial gradient glow
- `spotlight.tsx` — SVG ellipse illumination effect
- `progressive-blur.tsx` — multi-layer gradient mask backdrop-blur
- `number-ticker.tsx` — spring-animated counter via `useMotionValue` + `useSpring` + `useInView`
- `marquee.tsx` — infinite horizontal/vertical scroll with pause-on-hover
- `meteors.tsx` — particle shower decoration (bronze)
- `text-generate-effect.tsx` — staggered blur-to-clear word animation
- `animated-group.tsx` — staggered reveal wrapper (blur-slide, slide presets)
- `iphone-15-pro.tsx` — SVG iPhone frame with `src` prop for screen content
- `background-paths.tsx` — 36 animated SVG paths
- `container-scroll.tsx` — scroll-driven perspective transform

**Platform-wide rollout (2026-04-14, 20 files):**
- **Auth pages** (staff login, forgot-password, reset-password, invite/accept, guest login, guest register) — Spotlight backgrounds, BorderBeam on form cards, GlassButton CTAs, Playfair headings
- **Staff portal** (page, profile, shift) — MagicCard metric tiles, BorderBeam on shift/profile cards, AnimatedGroup staggered reveals
- **Manager portal** (page, analytics, billing, branding, settings, staff) — BorderBeam on panels, AnimatedGroup on KPI grids, MagicCard KPIs
- **Admin portal** (page, health) — MagicCard KPI cards, BorderBeam on recent tenants, dynamic color BorderBeam on health status
- **Guest portal** (page, welcome) — AnimatedGroup entrance animations, Playfair headings

**Key commits:**
- `aa6bb9c` public landing root
- `1f7e429` premium landing with glassmorphism + bento grid
- `1f50f62` 21st.dev component library integration
- `e834389` complete landing with fonts, demo, testimonials, contact
- `7fb2357` fix phone clipping + emojis→icons + service chips
- `4ac9313` platform-wide component rollout + phone mockup fix
- `f8e2bb0` visual baseline lock (6 screenshots)

**Verification:** tsc 0 errors, build success (all 55+ routes), Playwright 634/634 passed, visual baselines locked

## Key Technical Notes
- **Next.js 16** (not 14) with React 19
- **Tailwind CSS v4** with shadcn base-nova style (@base-ui/react — NO `asChild` prop)
- **Shared PortalHeader** component with thin wrappers (StaffHeader, ManagerHeader, AdminHeader)
- **Shared helpers:** `src/lib/auth-context.ts` (auth), `src/lib/utils.ts` (formatting), `src/constants/app.ts` (transitions)
- **Shared audit:** `src/lib/audit.ts` (logAudit utility — fire-and-forget)
- **Dynamic branding:** `src/lib/branding.ts` + `src/components/innara/BrandingStyles.tsx` (guest portal CSS injection)
- **Admin client:** `src/lib/supabase/admin.ts` (service role, bypasses RLS for cross-tenant queries)
- **PMS integration:** `src/lib/integrations/pms/` (IPMSAdapter interface, Mews adapter, conflict resolver, validator)
- **i18n:** next-intl with cookie-based locale (`innara-locale`), EN + AR, RTL support
- **PWA:** service worker (`public/sw.js`), manifest, offline page, install prompt, background sync
- Guest paths: /guest/*, Staff: /staff/*, Manager: /manager/*, Admin: /admin/*
- JWT claims inject app_role, hotel_id, department via custom_access_token_hook
- Middleware redirects: guest portal → /auth/guest/login, staff/manager/admin → /auth/staff/login
- Supabase project: hbqcujxpphwgkgrqpjmo (ap-south-1, ai-solutions org)
- RLS uses `is_manager_of_hotel()` SECURITY DEFINER function
- ROLES constant: GUEST, STAFF, FRONT_DESK, MANAGER, SUPER_ADMIN
- Playwright: port 3001 (avoid conflict with other ventures)

## Manual Steps Needed
- ~~Enable JWT hook in Supabase Dashboard → Authentication → Hooks → Custom Access Token~~ — **DONE 2026-04-09**, custom_access_token_hook now injecting app_role/hotel_id/department claims
- Set GitHub Secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Configure Supabase email templates for verification + password reset

## Phase Progress
- [x] Phase 1: Foundation (22 tickets — completed 2026-03-28, review passed)
- [x] Phase 2: Core Features (29 tickets — completed 2026-03-29, review passed)
- [x] Phase 3: Supporting Features (20 tickets — completed 2026-03-29, review passed)
- [x] Phase 4: Manager Portal + Billing (30 tickets — completed 2026-04-11, review passed 85/100)
- [x] Phase 5: Admin + PWA + PMS (8 tickets — completed 2026-04-11, review passed)
- [x] Phase 6: Testing & Launch (5 tickets — completed 2026-04-13, pending phase review)
- [x] Post-Phase 6: Landing + Platform UI Unification (2026-04-14, shipped to production)

## Links
- Notion: https://www.notion.so/338364b9014781ff92fdeba0e8cf7bbe (INN project, migrated from Linear)
- GitHub: https://github.com/karimmattar1/innara
- Supabase: innara (ref: hbqcujxpphwgkgrqpjmo, region: ap-south-1, ai-solutions org)
- Figma: https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- Staging: https://innara-ai-platforms.vercel.app (preview deployments via PR)
- Production: https://innara-two.vercel.app (ai-platforms team, iad1 region)

## Venture Docs

### Planning
- [[ventures/innara/docs/planning/architecture|architecture.md]]
- [[ventures/innara/docs/planning/database-schema|database-schema.md]]
- [[ventures/innara/docs/planning/phases|phases.md]]
- [[ventures/innara/docs/planning/user-flows|user-flows.md]]
- [[ventures/innara/docs/planning/specs/inn-8-staff-analytics|INN-8 staff analytics spec]]
- [[ventures/innara/docs/planning/specs/inn-11-manager-notification-center|INN-11 manager notification center spec]]

### Research
- [[ventures/innara/docs/research/market-research|market-research.md]]
- [[ventures/innara/docs/research/competitive-analysis|competitive-analysis.md]]
- [[ventures/innara/docs/research/gtm-strategy|gtm-strategy.md]]

### Launch
- [[ventures/innara/docs/launch/checklist|checklist.md]]

### Plans
- [[ventures/innara/docs/superpowers/plans/2026-03-28-phase2-core-features|Phase 2 plan]]
- [[ventures/innara/docs/superpowers/plans/2026-03-29-phase4-wave2-manager-screens|Phase 4 wave 2 plan]]
- [[ventures/innara/docs/superpowers/plans/2026-04-09-inn-43-staff-analytics|INN-43 staff analytics plan]]

### Other
- [[ventures/innara/CLAUDE|CLAUDE.md]]
- [[ventures/innara/AGENTS|AGENTS.md]]
