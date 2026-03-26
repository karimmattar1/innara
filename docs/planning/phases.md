# Innara -- Phase Plan

## Overview
- **Total Phases:** 6
- **Total Tickets:** 102
- **Estimated Timeline:** ~15 weeks

---

## Phase 1: Foundation (~2.5 weeks, 18 tickets)
**Goal:** Project infrastructure, database schema, auth, middleware, component migration, portal shells, CI/CD.

Key deliverables:
- Supabase schema (baseline from existing migrations + new tables)
- Auth system (4 roles: guest, staff, manager, admin with JWT custom claims)
- Middleware (role-based routing to correct portal)
- Component migration (91 components from innara-design-static to Next.js)
- Portal shell layouts (guest mobile, staff desktop, manager desktop, admin desktop)
- CI/CD pipeline (GitHub Actions + Vercel preview deployments)

## Phase 2: Core Features (~3 weeks, 22 tickets)
**Goal:** AI concierge, service requests, room service, messaging, staff dashboard.

Key deliverables:
- AI concierge (Claude API streaming, context-aware responses)
- Service request system (create, track, assign, resolve)
- Room service ordering (menu, cart, order tracking)
- Real-time messaging (guest-staff, staff-staff via Supabase Realtime)
- Staff dashboard (task queue, request management, shift view)

## Phase 3: Management & Analytics (~3 weeks, 20 tickets)
**Goal:** Manager dashboard, analytics, catalog management, staff management, reporting.

Key deliverables:
- Manager dashboard (operations overview, KPIs, alerts)
- Analytics suite (occupancy, revenue, satisfaction, response times)
- Service catalog management (room service menus, amenities, experiences)
- Staff management (schedules, assignments, performance)
- Reporting and exports (PDF/CSV)

## Phase 4: Advanced Features (~2.5 weeks, 18 tickets)
**Goal:** Admin portal, billing/Stripe, integrations, branding, go-live wizard.

Key deliverables:
- Admin portal (tenant management, user management, plan management)
- Stripe integration (subscriptions, usage-based billing, invoices)
- PMS integrations (Opera, Cloudbeds, etc. via webhooks)
- Hotel branding customization (logo, colors, custom domains)
- Go-live wizard (onboarding flow for new properties)

## Phase 5: Polish & Edge Cases (~2 weeks, 14 tickets)
**Goal:** Error handling, loading states, accessibility, responsive fixes, performance.

Key deliverables:
- Comprehensive error boundaries and fallbacks
- Loading skeletons and optimistic updates
- WCAG 2.1 AA accessibility compliance
- Responsive design fixes across all breakpoints
- Performance optimization (bundle splitting, image optimization, caching)

## Phase 6: Testing & Launch (~2 weeks, 10 tickets)
**Goal:** E2E test suites, security audit, performance testing, launch checklist.

Key deliverables:
- Full E2E test suites for all critical flows
- Security audit (RLS policies, API authorization, input validation)
- Performance benchmarks (Lighthouse, Core Web Vitals)
- Launch checklist completion
- Staging environment validation
- Production deployment
