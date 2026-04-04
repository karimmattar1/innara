# Innara -- Claude Configuration

## What This Is
Innara is an AI-powered hospitality operations platform. It provides a guest mobile app with an AI concierge, staff and manager desktop dashboards, and a multi-tenant admin portal. The platform replaces fragmented hotel tech stacks with a single unified solution covering guest experience, staff operations, analytics, and AI-driven upselling.

## Problem
Hotels use 5-15 disconnected tools for guest communication, service requests, housekeeping, room service, analytics, and billing. This creates data silos, poor guest experiences, and operational inefficiency. Small and mid-sized hotels are priced out of enterprise solutions like Oracle Opera.

## Target Users
- **Guests:** Hotel guests who want digital-first service (AI concierge, room service, requests, explore nearby)
- **Staff:** Housekeepers, front desk, maintenance, F&B teams managing daily tasks
- **Managers:** Hotel GMs and department heads tracking operations, analytics, staff
- **Admins:** Innara platform admins managing tenants, billing, onboarding

## Tech Stack
- **Framework:** Next.js 16 (App Router, Server Components, React 19)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn base-nova style (@base-ui/react — NO `asChild` prop)
- **Database:** Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **AI:** Claude API (Anthropic) for AI concierge
- **Payments:** Stripe (subscription billing per property)
- **Email:** Resend
- **Rate Limiting:** Upstash (Redis + QStash)
- **Monitoring:** Sentry
- **Testing:** Vitest (unit) + Playwright (E2E)
- **CI/CD:** GitHub Actions + Vercel
- **Deployment:** Vercel

## Design System
- **Primary Navy:** #1a1d3a
- **Bronze Accent:** #9B7340
- **Font:** DM Sans
- **Style:** Glassmorphism, dark mode by default for staff/manager portals
- **Guest Portal:** Light/airy mobile-first PWA design
- **Figma:** https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
  - Pages with `-fix` suffix = final designs
  - `auth` pages = standard auth pages

## Existing Assets
- **Design Static:** ~/Desktop/innara-design-static (React/Vite components — reference only, migration complete)
- **Schema:** ~/Desktop/innara-service-hub-main/supabase/migrations/ (baseline migrations — already applied)
- These were REFERENCE material. Component migration is complete.

## Architecture
- **4 Portals:** Guest (mobile PWA), Staff (desktop), Manager (desktop), Admin (desktop)
- **50 screens** across all portals
- **Multi-tenant:** Every table has hotel_id, RLS enforced everywhere
- **5 Roles:** guest, staff, front_desk, manager, super_admin (JWT custom claims via custom_access_token_hook)
- **Middleware:** Role-based routing, redirect unauthorized users
- **Audit logging:** `src/lib/audit.ts` — shared `logAudit()` utility, fire-and-forget
- **Dynamic branding:** `src/lib/branding.ts` + `BrandingStyles.tsx` — CSS var injection for guest portal

## Current Phase
Phase 4: Manager Portal + Billing (feature work complete, testing/design tickets remaining)

## Phase Plan (6 phases, ~155 tickets total)
1. **Foundation** (22 tickets) -- Project setup, schema, auth (booking ref verification, magic link, password reset, email verification), middleware, component migration, portal shells, CI/CD, RLS verification
2. **Core Features** (29 tickets) -- AI concierge, service requests, room service, guest checkout, messaging, QR codes, AI security, image upload, order cancellation, form idempotency, adversarial AI testing
3. **Supporting Features** (20 tickets) -- Staff portal screens, staff profile, notification center, break/away status, request escalation, shift handoff, optimistic locking, department scoping, concurrency stress testing
4. **Manager Portal + Billing** (30 tickets) -- Manager dashboard, analytics, catalog, staff management, billing, branding, manager profile, service hours, Stripe resilience, invite lifecycle, audit expansion
5. **Admin + PWA + PMS** (23 tickets) -- Admin portal, PWA, PMS integration, i18n, GDPR export, admin audit, PWA install prompt, hotel deactivation cascade, role change workflow, PMS sync recovery, network resilience, PMS malformed data
6. **Testing & Launch** (18 tickets) -- E2E test suites, security audit, performance testing, launch checklist, empty state designs, external pentest, OWASP Top 10 audit, PII data protection audit

## Linear Team
- **Team Key:** INN
- **Ticket Prefix:** INN-

## Development Rules
- All rules auto-load from `~/.claude/CLAUDE.md` (global). Detailed reference: `~/SwampStudios/CLAUDE.md`.
- Phase-based development -- one phase at a time
- Codex review after every phase
- QA testing after every phase
- No feature ships without tests
- primer.md must stay current
- Visual verification (screenshot) for every UI change
- Multi-tenant isolation must be verified at every step

## Context Recovery
If you're starting a new session:
1. Read this file (CLAUDE.md)
2. Read primer.md
3. Read the current phase plan in docs/planning/
4. Check Linear for active tasks (team: INN)
5. Resume work
