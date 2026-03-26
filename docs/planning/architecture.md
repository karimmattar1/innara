# Innara -- Architecture

## High-Level Architecture

```
[Guest Mobile PWA] --> [Next.js App Router] --> [Supabase]
[Staff Desktop]    --> [Next.js App Router] --> [Claude API]
[Manager Desktop]  --> [Next.js App Router] --> [Stripe]
[Admin Desktop]    --> [Next.js App Router] --> [Resend]
```

## Portal Architecture

### 4 Portals, 1 Codebase
All portals share a single Next.js application using route groups:
- `(guest)` -- Mobile PWA, light theme, guest-facing
- `(staff)` -- Desktop, dark theme, sidebar layout
- `(manager)` -- Desktop, dark theme, sidebar layout with expanded navigation
- `(admin)` -- Desktop, dark theme, minimal layout for platform management

### Role-Based Routing
Middleware inspects JWT custom claims to determine user role and redirects to the appropriate portal. Unauthorized access returns 403.

## Database Architecture

### Multi-Tenant Design
- Every data table has a `hotel_id` column
- RLS policies enforce tenant isolation at the database level
- Admin users can query across hotels with elevated permissions
- Guest data is scoped to their active stay

### Key Tables (from existing schema)
- `profiles` -- User profiles with role field
- `hotels` -- Hotel/property information
- `rooms` -- Room inventory
- `stays` -- Guest stays (check-in, check-out, room assignment)
- `requests` -- Service requests (housekeeping, maintenance, etc.)
- `orders` -- Room service orders
- `order_items` -- Order line items
- `messages` -- Guest-staff messaging
- `service_options` -- Available services per hotel
- `ratings` -- Guest feedback and ratings

### New Tables (Phase 1+)
- `ai_conversations` -- AI concierge chat history
- `shifts` -- Staff shift schedules
- `analytics_snapshots` -- Pre-computed analytics data
- `subscriptions` -- Stripe subscription records
- `integrations` -- PMS integration configs
- `branding` -- Hotel branding customization

## AI Architecture

### Concierge
- Model: Claude (Anthropic API)
- Streaming responses via API route
- Context: hotel info, guest stay, available services, recent requests
- Rate limited per guest session (Upstash Redis)
- Conversation history stored in Supabase

## Authentication

### Supabase Auth + JWT Custom Claims
- Roles stored in `profiles.role` and synced to JWT via database trigger
- Auth methods:
  - Guest: email/magic link (booking-based)
  - Staff: email/password (invited by manager)
  - Manager: email/password (invited by admin or self-registered)
  - Admin: email/password (platform admin)

## Deployment

### Vercel
- Preview deployments on PRs
- Production on main branch
- Edge middleware for auth
- ISR for marketing pages
- Server Components for dashboard pages

### Supabase
- Managed PostgreSQL
- Auth service
- Realtime subscriptions
- Storage for media (hotel images, documents)
- Edge Functions for background tasks

## Design System

### Brand
- Primary: Navy #1a1d3a
- Accent: Bronze #9B7340
- Font: DM Sans
- Style: Glassmorphism effects on cards and modals

### Component Library
- shadcn/ui base components
- Custom Innara components in `src/components/innara/`
- 91 components migrated from innara-design-static
