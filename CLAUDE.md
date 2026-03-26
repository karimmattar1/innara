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
- **Framework:** Next.js 14+ (App Router, Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui
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
- **Design Static:** ~/Desktop/innara-design-static (React/Vite components to migrate)
- **Schema:** ~/Desktop/innara-service-hub-main/supabase/migrations/ (existing migration files)
- These are REFERENCE material. We are building fresh in Next.js, not copying code wholesale.

## Architecture
- **4 Portals:** Guest (mobile PWA), Staff (desktop), Manager (desktop), Admin (desktop)
- **50 screens** across all portals
- **91 components** to migrate from design static
- **Multi-tenant:** Every table has hotel_id, RLS enforced everywhere
- **Roles:** guest, staff, manager, admin (JWT custom claims)
- **Middleware:** Role-based routing, redirect unauthorized users

## Current Phase
Phase 1: Foundation (18 tickets, ~2.5 weeks)

## Phase Plan (6 phases, 102 tickets total)
1. **Foundation** (18 tickets) -- Project setup, schema, auth, middleware, component migration, portal shells, CI/CD
2. **Core Features** (22 tickets) -- AI concierge, service requests, room service, messaging, staff dashboard
3. **Management & Analytics** (20 tickets) -- Manager dashboard, analytics, catalog management, staff management, reporting
4. **Advanced Features** (18 tickets) -- Admin portal, billing/Stripe, integrations, branding, go-live wizard
5. **Polish & Edge Cases** (14 tickets) -- Error handling, loading states, accessibility, responsive fixes, performance
6. **Testing & Launch** (10 tickets) -- E2E test suites, security audit, performance testing, launch checklist

## Linear Team
- **Team Key:** INN
- **Ticket Prefix:** INN-

## Development Rules
- Follow all SwampStudios quality standards (see ~/SwampStudios/CLAUDE.md)
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
