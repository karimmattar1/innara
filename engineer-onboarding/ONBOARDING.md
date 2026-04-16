# Innara — Engineer Onboarding

> **Last updated:** 2026-04-15
> **Author:** Karim Mattar (founder) + Claude (audit)
> **Status:** Honest assessment — read this before touching code.

---

## 1. What is Innara?

Innara is an AI-powered hospitality operations platform (B2B SaaS). It replaces the 5-15 disconnected tools hotels use for guest communication, service requests, housekeeping, room service, analytics, and billing.

**4 portals:**
- **Guest** — Mobile PWA. AI concierge, room service, service requests, explore nearby.
- **Staff** — Desktop. Claim requests, messaging, shift management, analytics.
- **Manager** — Desktop. Dashboard, analytics, catalog, staff, billing, branding, integrations.
- **Admin** — Desktop. Multi-tenant management, user admin, subscription plans.

**Target market:** Small-to-mid-size hotels (10-200 rooms) priced out of enterprise solutions like Oracle Opera.

**Figma (source of truth for all UI):** https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- Pages with `-fix` suffix = final approved designs
- `auth` pages = standard authentication screens

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript (strict) | 5.x |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS v4 + shadcn base-nova | v4 |
| Database | Supabase (PostgreSQL + Auth + Realtime + Storage) | — |
| AI | Claude API (Anthropic) | ^0.80.0 |
| Payments | Stripe | ^21.0.1 |
| Email | Resend | ^6.9.4 |
| Rate Limiting | Upstash Redis | ^2.0.8 |
| Monitoring | Sentry | ^10.46.0 |
| Testing | Vitest (unit) + Playwright (E2E) | 4.x / 1.58.x |
| Animations | Framer Motion | ^12.38.0 |
| Charts | Recharts | ^3.8.0 |
| i18n | next-intl | ^4.9.1 |

**Important:** shadcn uses `base-nova` style with `@base-ui/react` — there is NO `asChild` prop.

---

## 3. Honest State of the Codebase

This project was built by Claude Code agents across 4 phases (~101 tickets). **It has never been manually tested or debugged by a human.** Here's what an independent audit found:

### What's solid (keep and build on)

- **Build:** Clean — zero TypeScript errors, zero build errors, all deps installed.
- **Server actions (25 files, ~8,500 lines):** 88% production-grade. Every action has Zod validation, auth checks (`supabase.auth.getUser()`), role verification, and try/catch error handling. No raw SQL, no string interpolation.
- **Stripe integration:** Real — signature verification on webhooks, idempotent upserts via audit_logs, lazy client init.
- **AI concierge:** Real streaming via `anthropic.messages.stream()` with adversarial input detection, conversation history, dynamic system prompts.
- **Resend email:** Real — 2 templated emails with HTML escaping and validation.
- **Component architecture:** 47 custom Innara components + 62 shadcn primitives. Well-structured, mirrors the design system.

### What's broken (must fix)

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | **Auth is silently broken.** The `custom_access_token_hook` that injects `app_role` into JWTs doesn't exist in version control. Everyone defaults to "guest" role. Portal routing is non-functional. | CRITICAL | `src/lib/supabase/middleware.ts` (reads `payload.app_role`), no hook file exists |
| 2 | **Frontend doesn't match Figma.** Wrong fonts loaded (Inter/Playfair instead of DM Sans/Cormorant Garamond). ~50 CSS utility classes that components reference are undefined in `globals.css`. | HIGH | `src/app/layout.tsx` (fonts), `src/app/globals.css` (missing classes) |
| 3 | **Supabase migrations were not in this repo.** 47 migration files have been copied in from a separate project (now at `supabase/migrations/`). 9 production tables have no migration files at all. The schema cannot be fully reproduced from scratch. | HIGH | `supabase/migrations/` |
| 4 | **RLS policy gaps.** `hotel_faqs`: any authenticated user can CRUD any hotel's FAQs. `service_options`/`service_time_options`: manager write policies don't enforce `hotel_id`. `profiles`: all authenticated users can read all profiles (PII leak). `menu_categories`/`menu_items`/`sla_configs`: no write policies. | HIGH | See migrations in `supabase/migrations/` |
| 5 | **PMS webhook doesn't verify signatures.** The Mews adapter accepts `signature` parameter but ignores it. Any caller with the right payload schema can inject fake events. | HIGH | `src/lib/integrations/pms/mews-adapter.ts:80-86` |
| 6 | **No rate limiting on AI endpoint.** The most expensive route has no Upstash protection. A single user could exhaust the Anthropic budget. | MEDIUM | `src/app/api/ai/chat/route.ts` (TODO at line 9) |
| 7 | **10/14 env vars empty.** Stripe, Anthropic, Resend, Upstash, Sentry keys are all blank. The app builds but most features will throw at runtime. | MEDIUM | `.env.local` |
| 8 | **`markMessagesRead` is a no-op.** Returns `{ success: true }` without writing anything. "Read tracking will be added in Wave 3." | LOW | `src/app/actions/messaging.ts:426` |
| 9 | **Staff analytics shows same rating for everyone.** Hotel-wide average is attributed to individual staff. Documented as known limitation. | LOW | `src/app/actions/analytics.ts:489` |
| 10 | **Escalation query doesn't verify hotel ownership.** A manager could pass any `hotelId` to `getEscalatedRequests`. RLS should catch it, but app-level guard is missing. | LOW | `src/app/actions/escalation.ts` |
| 11 | **Next.js 16 deprecation.** `middleware.ts` should be renamed to `proxy.ts` per new convention. Non-fatal today, will break in future versions. | LOW | `src/middleware.ts` |

### What was never built (Phase 5 & 6 scope)

- Admin portal (partially built but untested)
- PWA features (service worker, offline support, install prompt)
- PMS integration (adapter exists but webhook auth is a stub)
- i18n (next-intl installed but no translations)
- GDPR data export
- Network resilience patterns
- Full E2E test suites
- Security audit, performance testing, load testing

---

## 4. Prioritized Fix List

Work in this order. Each item unblocks the next.

### Priority 1: Make it runnable

**1a. Fill environment variables**
```
# .env.local — get these from Karim
SUPABASE_SERVICE_ROLE_KEY=      # Supabase Dashboard → Settings → API
ANTHROPIC_API_KEY=              # console.anthropic.com
STRIPE_SECRET_KEY=              # dashboard.stripe.com → Developers → API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=          # stripe listen --forward-to localhost:3000/api/webhooks/stripe
RESEND_API_KEY=                 # resend.com/api-keys
UPSTASH_REDIS_REST_URL=         # console.upstash.com
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=         # sentry.io → Project → Settings → Client Keys
SENTRY_AUTH_TOKEN=
```

**1b. Fix auth — implement custom_access_token_hook**
- The middleware reads `app_role`, `hotel_id`, `department` from JWT claims
- These claims must be injected by a Postgres function registered as a custom access token hook
- Reference: `src/lib/supabase/middleware.ts` (reads claims), `docs/planning/database-schema.md` (documents the hook)
- Must create the function, register it in Supabase Dashboard → Authentication → Hooks
- **Acceptance:** Log in as a manager → JWT contains `app_role: "manager"` → middleware routes to `/manager/dashboard`

### Priority 2: Make it match Figma

**2a. Fix fonts**
- File: `src/app/layout.tsx`
- Replace `Inter` + `Playfair_Display` with `DM_Sans` + `Cormorant_Garamond` (from `next/font/google`)
- Update CSS variables in `globals.css`: `--font-sans` → DM Sans, `--font-heading` → Cormorant Garamond
- **Acceptance:** All body text renders in DM Sans. All headings render in Cormorant Garamond.

**2b. Add missing CSS classes (~50 classes, ~300 lines)**
- File: `src/app/globals.css`
- Source of truth: `engineer-onboarding/_reference/design-system-source.css` (lines 401-1023)
- Missing: `.metric-card` variants, `.glass-premium`, `.chat-bubble-ai/user`, `.request-row`, `.table-container`, `.room-badge`, `.eta-badge`, `.nav-active`, `.section-header`, `.accent-*`, animations
- **Acceptance:** Dashboard metric cards have gradient glassmorphism. Chat bubbles have distinct AI/user styling. Request tables have glass styling.

**2c. Visual QA pass against Figma**
- Open each of the 50 screens side-by-side with Figma `-fix` pages
- Fix any remaining discrepancies (spacing, colors, component-level issues)
- Capture screenshots at 1440px (desktop), 768px (tablet), 375px (mobile for guest portal)

### Priority 3: Fix security gaps

**3a. Fix RLS policies**
- `hotel_faqs`: Restrict write to managers of that hotel
- `service_options` / `service_time_options`: Add `hotel_id` check to manager write policies
- `profiles`: Restrict guest PII visibility (allow staff to see staff, guests only see own)
- `menu_categories` / `menu_items` / `sla_configs`: Add INSERT/UPDATE/DELETE policies with manager + hotel_id check
- Write as new migration files in `supabase/migrations/`

**3b. Implement Mews webhook signature verification**
- File: `src/lib/integrations/pms/mews-adapter.ts:80-86`
- Compute HMAC-SHA256 of the raw payload body using the webhook secret
- Compare with the provided signature header
- Reject on mismatch

**3c. Add Upstash rate limiting to AI chat endpoint**
- File: `src/app/api/ai/chat/route.ts`
- Use `@upstash/ratelimit` with sliding window (e.g., 20 requests/minute per user)
- Return 429 with retry-after header when exceeded

### Priority 4: Schema reproducibility

**4a. Write migration files for 9 missing production tables**
- Tables that exist in prod but have no migration: `ai_conversations`, `ai_messages`, `subscriptions`, `audit_logs`, `hotel_branding`, `notification_preferences`, `shifts`, `shift_assignments`, `integration_configs`
- Reverse-engineer from `src/types/database.ts` and `docs/planning/database-schema.md`
- Include RLS policies as documented in schema doc

**4b. Clean up migration chain**
- Remove/archive seed and demo-data migrations (~24 files) — they shouldn't be in the schema migration chain
- Ensure remaining migrations are idempotent (`IF NOT EXISTS`)

### Priority 5: End-to-end testing

- Fill all env vars, start dev server, and walk through every portal manually
- Run existing Playwright tests: `npm run test:e2e`
- Fix any runtime errors
- Test multi-tenant isolation (User A cannot see User B's data)

---

## 5. Folder Map — Where to Find Things

```
~/SwampStudios/ventures/innara/          ← THE REPO. This is what you work in.
├── src/
│   ├── app/                             ← Next.js App Router (routes + layouts)
│   │   ├── (admin)/admin/               ← Admin portal pages
│   │   ├── (guest)/                     ← Guest portal pages (17 screens)
│   │   ├── (staff)/staff/               ← Staff portal pages (5 screens)
│   │   ├── (manager)/manager/           ← Manager portal pages (19 screens)
│   │   ├── auth/                        ← Auth pages (login, register, verify)
│   │   ├── api/                         ← API routes (AI chat, webhooks, health)
│   │   ├── actions/                     ← Server actions (25 files, all business logic)
│   │   ├── layout.tsx                   ← Root layout (FONTS ARE WRONG — fix here)
│   │   └── globals.css                  ← Design system CSS (INCOMPLETE — fix here)
│   ├── components/
│   │   ├── innara/                      ← 47 custom components (the app's UI)
│   │   ├── ui/                          ← 62 shadcn primitives
│   │   ├── guest/                       ← Guest-specific components
│   │   └── landing/                     ← Marketing page components
│   ├── hooks/                           ← 10 custom hooks
│   ├── lib/                             ← Utilities, integrations, Supabase client
│   │   ├── supabase/                    ← DB client (client, server, middleware, admin)
│   │   ├── integrations/                ← Stripe, PMS (Mews), Resend wrappers
│   │   └── ai/                          ← Claude API prompts, context builders, safety
│   ├── types/                           ← TypeScript types (database.ts is auto-generated)
│   ├── constants/                       ← App constants, routes, business rules
│   └── middleware.ts                    ← Auth + role-based routing
├── supabase/
│   ├── migrations/                      ← 47 SQL migration files (recently consolidated)
│   └── functions/                       ← Edge functions
├── e2e/                                 ← Playwright E2E tests
├── docs/
│   ├── planning/                        ← Architecture, schema, phases, user flows, specs
│   ├── research/                        ← Market research, competitive analysis, GTM
│   ├── launch/                          ← Launch checklist
│   └── security/                        ← Security operations guide
├── .env.local                           ← Environment variables (MOSTLY EMPTY)
├── .env.local.example                   ← Template with all required vars
├── CLAUDE.md                            ← AI assistant configuration (read for context)
├── primer.md                            ← Current project state (read for context)
└── package.json                         ← Dependencies and scripts
```

### Reference materials (in-repo)

The `engineer-onboarding/_reference/` folder contains snapshots of the original design prototype, preserved for reference:

| File | What it is | When to use |
|------|-----------|-------------|
| `_reference/design-system-source.css` | The full 1,023-line CSS from the design prototype | Source of truth for Priority 2b. Copy lines 401-1023 into `src/app/globals.css` |
| `_reference/design-static-tailwind.config.ts` | Original Tailwind config (v3) | Reference only — the repo uses Tailwind v4 now. Useful for checking color tokens, shadows, radii |
| `_reference/components-reference/` | The original React components (~43 Innara components + 47 shadcn primitives) | Compare implementation details when Figma isn't specific enough (animation timings, hover states, micro-interactions) |

These are **read-only reference** — do not import from them, do not modify them. They exist so you don't need to dig through external folders.

### Folders you can IGNORE

| Folder | Why |
|--------|-----|
| `engineer-onboarding/_archive/` | Outdated Claude-generated onboarding docs (project-overview, current-state, launch-checklist). Superseded by this ONBOARDING.md. |
| `docs/superpowers/` | AI build system plans. Historical reference only. |

---

## 6. Development Setup

```bash
# Clone
git clone https://github.com/karimmattar1/innara.git
cd innara

# Install
npm install

# Environment
cp .env.local.example .env.local
# Fill in all keys (get from Karim)

# Run
npm run dev          # http://localhost:3000

# Test
npm run build        # Should pass clean
npx tsc --noEmit     # Should pass clean (zero errors today)
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright (port 3001)
```

### Key URLs
- **Supabase:** Project `hbqcujxpphwgkgrqpjmo` (ap-south-1 region)
- **Figma:** https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- **GitHub:** https://github.com/karimmattar1/innara
- **Notion:** INN project (ticket prefix: INN-)

---

## 7. Working Agreements

- **Figma is the source of truth** for all UI decisions. When in doubt, match Figma.
- **Test after every change.** Run `npm run build` and check the browser.
- **Ask Karim** when requirements are unclear. Don't guess at business logic.
- **One thing at a time.** Fix auth first, then CSS, then security. Don't parallelize.
- Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`).
- Branch naming: `fix/INN-xxx-description` or `feat/INN-xxx-description`.
