# Innara -- Phase Plan

## Overview
- **Total Phases:** 6
- **Total Tickets:** ~155
- **Status:** Phase 4 feature work complete, testing remaining

---

## Phase 1: Foundation (22 tickets) -- COMPLETED 2026-03-28
**Goal:** Project infrastructure, database schema, auth, middleware, component migration, portal shells, CI/CD.

Key deliverables:
- Supabase schema (33 tables with RLS on every table)
- Auth system (5 roles: guest, staff, front_desk, manager, super_admin with JWT custom claims)
- Custom access token hook for JWT claim injection (app_role, hotel_id, department)
- Middleware (role-based routing: guest → /auth/guest/login, staff/manager/admin → /auth/staff/login)
- Component library (shared components: MetricCard, StatusBadge, PriorityBadge, StaffAvatar, EmptyState, GlassCard, PortalHeader)
- Portal shell layouts (guest mobile, staff desktop, manager desktop, admin desktop)
- CI/CD pipeline (GitHub Actions + Vercel)

## Phase 2: Core Features (29 tickets) -- COMPLETED 2026-03-29
**Goal:** AI concierge, service requests, room service, messaging, staff dashboard.

Key deliverables:
- AI concierge (Claude API streaming, context-aware responses, adversarial testing)
- Service request system (create, track, assign, resolve, escalate)
- Room service ordering (menu browsing, cart, order tracking, cancellation)
- QR code generation for rooms
- Staff dashboard (task queue, request management, claim/release)
- Guest checkout and ratings
- Image upload for requests
- Form idempotency protection

## Phase 3: Supporting Features (20 tickets) -- COMPLETED 2026-03-29
**Goal:** Staff portal screens, profile, notifications, shift management, department scoping.

Key deliverables:
- Staff portal screens (requests, profile, notifications, break/away status)
- Request escalation workflow
- Shift handoff system
- Optimistic locking for concurrent request updates
- Department-scoped request filtering
- Concurrency stress testing

## Phase 4: Manager Portal + Billing (30 tickets) -- FEATURE WORK COMPLETE 2026-03-29
**Goal:** Full manager portal with 13 screens, billing, branding, integrations, cross-cutting features.

Key deliverables:
- **Wave 0:** Technical debt cleanup (-469 lines), shared helpers
- **Wave 1:** 6 server action files (analytics, staff-management, billing, branding, email, Stripe webhook)
- **Wave 2:** 6 manager screens (dashboard, requests, analytics, catalog, staff, ops/SLA)
- **Wave 3:** 7 manager screens (billing, branding, permissions, go-live checklist, settings/health, integrations, profile)
- **Wave 4:** 6 cross-cutting features:
  - Service hours configuration (time-based schedule management)
  - Stripe webhook resilience (idempotency via audit_logs, failure alerting)
  - Audit trail expansion (shared logAudit utility for staff/requests/orders)
  - Dynamic branding CSS injection (BrandingStyles server component for guest portal)
  - Invitation lifecycle (expiry checking, resend cooldown, duplicate prevention)
  - Role change workflow (promotion/demotion with audit logging)

**Remaining (testing/design):**
- INN-108: Manager portal E2E suite (19 screens)
- INN-94: Cross-portal integration E2E tests
- INN-43: Staff analytics screen
- INN-11: Manager notification center design
- INN-8: Staff analytics design

## Phase 5: Admin + PWA + PMS (23 tickets)
**Goal:** Admin portal, PWA, PMS integration, i18n, GDPR.

Key deliverables:
- Admin portal (tenant management, user management, plan management)
- PWA (service worker, offline support, install prompt)
- PMS integration (Mews adapter, sync recovery, malformed data handling)
- i18n (multi-language support)
- GDPR data export
- Hotel deactivation cascade
- Network resilience

## Phase 6: Testing & Launch (18 tickets)
**Goal:** E2E test suites, security audit, performance testing, launch checklist.

Key deliverables:
- Full E2E test suites for all critical flows
- Security audit (OWASP Top 10, RLS policies, API authorization)
- PII data protection audit
- Performance benchmarks (Lighthouse, Core Web Vitals)
- External pentest
- Launch checklist completion
- Production deployment
