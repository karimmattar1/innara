# User Flow Analysis: Innara Hospitality Platform

## Date: 2026-03-26
## Venture: Innara
## Analyst: SwampStudios User Flow Analyst

---

## Table of Contents

1. [Personas Considered](#1-personas-considered)
2. [Guest Portal Flows](#2-guest-portal-flows)
3. [Staff Portal Flows](#3-staff-portal-flows)
4. [Manager Portal Flows](#4-manager-portal-flows)
5. [Admin Portal Flows](#5-admin-portal-flows)
6. [Cross-Portal Flows](#6-cross-portal-flows)
7. [Edge Cases and Failure Modes](#7-edge-cases-and-failure-modes)
8. [State Transition Diagrams](#8-state-transition-diagrams)
9. [Accessibility Notes](#9-accessibility-notes)
10. [Gap Analysis](#10-gap-analysis---missing-from-102-ticket-plan)
11. [Playwright Test Specs](#11-playwright-test-specs)
12. [Recommendations for Development](#12-recommendations-for-development)

---

## 1. Personas Considered

| Persona | Portal | Context | Device | Mental State | Frequency |
|---------|--------|---------|--------|-------------|-----------|
| First-time hotel guest | Guest | Just checked in, given QR code | Mobile (personal phone) | Curious, wants to see what it does | Once per stay |
| Returning hotel guest | Guest | Stayed at this hotel before | Mobile | Efficient, knows what to expect | Per stay |
| Impatient guest | Guest | Needs something urgently (broken AC, late checkout) | Mobile | Frustrated, wants fast resolution | Sporadic |
| Non-technical guest (elderly) | Guest | Receptionist helped them scan QR | Mobile (might be unfamiliar) | Confused, needs simplicity | Rare |
| Guest with accessibility needs | Guest | Uses screen reader or voice control | Mobile | Needs clear labeling and structure | Per stay |
| New staff member | Staff | Just hired, manager sent invite email | Desktop (hotel workstation) | Nervous, learning the system | Daily once onboarded |
| Experienced housekeeper | Staff | Uses the system daily for task queue | Desktop or tablet | Efficient, wants speed | Multiple daily |
| Front desk staff | Staff | Multitasking, handling walk-ins and digital requests | Desktop | Busy, context-switching often | Continuous |
| New hotel manager | Manager | Just signed up for Innara, onboarding hotel | Desktop | Methodical, evaluating the product | During setup |
| Active hotel manager | Manager | Running daily operations | Desktop | Focused on metrics and exceptions | Daily |
| IT-savvy manager | Manager | Configuring integrations, PMS sync | Desktop | Technical, wants control | Weekly |
| Platform admin (Innara team) | Admin | Managing all tenants, monitoring health | Desktop | Expert, systematic | Daily |
| Walk-in guest (no reservation) | Guest | Arrived at hotel, no booking in system | Mobile | Confused why they cannot access features | Once |

---

## 2. Guest Portal Flows

### 2.1 Guest Onboarding -- How Does a Guest Get Access?

**This is the single most critical flow and has the most ambiguity in the current plan.**

The plan includes P2-01 (welcome/onboarding screen) and P2-02 (stay verification flow), but does not specify the ENTRY MECHANISM. How does a guest first arrive at the app?

#### Scenario A: QR Code at Check-In
```
Guest checks in at front desk
  --> Receptionist hands card/tent with QR code
  --> Guest scans QR with phone camera
  --> Opens app.innara.app/{hotel-slug}?room=203&stay=abc123
  --> Guest sees welcome screen with hotel branding
  --> Prompted to enter last name + booking reference OR email
  --> Stay verified against PMS/stays table
  --> Guest account created (magic link to email) OR session token issued
  --> Guest lands on concierge home screen
```

#### Scenario B: Email/SMS Before Arrival
```
Hotel sends pre-arrival email via PMS integration
  --> Email contains personalized link: app.innara.app/welcome?token=xyz
  --> Guest clicks link on phone
  --> Token validates stay, auto-creates guest profile
  --> Guest sets optional PIN or uses magic link for re-auth
  --> Guest can browse hotel info before arrival
```

#### Scenario C: In-Room Tablet/QR
```
Guest enters room, sees QR on nightstand card
  --> Same flow as Scenario A but with room pre-populated
```

#### Scenario D: Walk-In (No Reservation)
```
Guest scans QR but has no reservation in system
  --> Stay verification fails
  --> Guest sees: "We couldn't find your booking. Please check with the front desk."
  --> Option to try again or enter booking reference manually
  --> NO access to ordering or requests without verified stay
```

**Key questions the plan does not answer:**
- Is guest authentication magic link (email), SMS code, or booking-reference-based?
- Can a guest use the app without creating an account (anonymous session)?
- What happens if two guests are in the same room (e.g., couple)?
- Does the guest need to re-authenticate on each visit to the PWA?
- Can the guest access the app BEFORE arriving (pre-arrival experience)?

#### Interaction Detail: Stay Verification

| Step | User Action | System Response | Loading State | Error State | Time |
|------|-------------|-----------------|---------------|-------------|------|
| 1 | Scans QR code | Browser opens PWA at hotel URL | Splash screen with hotel logo | - | 0-1s |
| 2 | Sees welcome screen | Displays hotel name, image, "Verify your stay" form | - | - | - |
| 3 | Enters last name + booking ref | Spinner on submit button | "Verifying your stay..." | - | 0s |
| 4a | (Match found) | Redirect to concierge home | Brief "Welcome, {name}!" | - | 1-2s |
| 4b | (No match) | Inline error: "Booking not found" | Form re-enabled | Retry or "Contact front desk" link | 1-2s |
| 4c | (Multiple matches) | "Select your room" picker | - | - | 1-2s |
| 4d | (Stay expired) | "Your stay has ended" message | - | Option to view past requests/receipts | 1-2s |
| 5 | (On 4a) Magic link sent to email | "Check your email for a login link" | Waiting animation | "Didn't receive? Resend" after 30s | - |

### 2.2 AI Concierge Chat Flow

```
Guest opens concierge tab
  --> Sees greeting: "Hi {name}, how can I help you during your stay at {hotel}?"
  --> Types: "Can I get extra towels?"
  --> AI streams response: "I'll arrange extra towels for room {room}. Want me to submit a housekeeping request?"
  --> Guest taps "Yes" (quick action button)
  --> AI creates request via tool use, confirms: "Done! Housekeeping request submitted. Track it in your requests."
  --> Request appears in guest's request list with "Pending" status
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 2.2.1 | Guest types in a language the AI does not support | AI responds: "I can help best in English. Let me try..." Falls back gracefully | Medium |
| 2.2.2 | Guest asks something unrelated to the hotel ("What's the weather?") | AI answers helpfully using general knowledge but stays in hospitality context | Low |
| 2.2.3 | Guest asks for something the hotel does not offer | AI: "Unfortunately {hotel} doesn't offer {service}. Here's what's available..." | High |
| 2.2.4 | Guest sends abusive/inappropriate message | AI maintains professional tone, does not engage. Flags conversation for staff review | High |
| 2.2.5 | AI tool call fails (e.g., cannot create request) | AI: "I had trouble submitting that. Let me try again..." Retry once, then: "Please use the request form directly" with link | High |
| 2.2.6 | Guest hits rate limit on AI concierge | Toast: "You've sent many messages. Please wait a moment." Disable input for 30s | Medium |
| 2.2.7 | AI response takes more than 10 seconds | Show typing indicator, then after 10s: "Taking longer than usual..." After 30s: timeout message | High |
| 2.2.8 | Guest has 50+ messages in conversation | Pagination or conversation reset. Performance must not degrade | Medium |
| 2.2.9 | Guest opens AI chat while offline (PWA) | Show cached conversation history. Input disabled: "You're offline. Connect to send messages." | High |
| 2.2.10 | Two guests in same room both chatting with AI | Each guest has independent conversation tied to their profile, not the room | Medium |

### 2.3 Room Service Ordering Flow

```
Guest opens Room Service
  --> Sees categorized menu (Breakfast, Lunch, etc.) with images and prices
  --> Taps item --> sees detail (description, allergens, customization options)
  --> Adds to cart with quantity and notes ("no onions")
  --> Reviews cart --> adjusts quantities or removes items
  --> Taps "Place Order" --> confirmation screen with estimated delivery time
  --> Order appears in request list with real-time status updates
  --> Guest gets push notification when order is being delivered
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 2.3.1 | Menu is empty (hotel hasn't configured room service) | Show: "Room service is not available at this time." No dead-end | High |
| 2.3.2 | Item becomes unavailable after guest adds to cart | On checkout: "Sorry, {item} is no longer available. It has been removed from your cart." | High |
| 2.3.3 | Guest places order outside service hours | Before cart: "Room service is available 6am-11pm. You can browse the menu now." Block checkout | High |
| 2.3.4 | Network fails during order submission | Preserve cart locally. Show: "Order couldn't be sent. Your cart is saved. Tap to retry." | Critical |
| 2.3.5 | Guest double-taps "Place Order" | Idempotent submission. Button disabled after first tap. Only one order created | Critical |
| 2.3.6 | Guest wants to cancel order after placing | If status is still "pending": allow cancel. If "preparing": show "Contact front desk to modify" | High |
| 2.3.7 | Guest places order, then checks out before delivery | Order still fulfilled (charge to room). Guest access may expire but order is in system | Medium |
| 2.3.8 | Dietary restrictions / allergen filtering | Filter menu by allergens. Show allergen badges on items | Medium |
| 2.3.9 | Guest places very large order (20+ items) | Allow it, but maybe show confirmation: "Large order -- estimated delivery 45 min" | Low |
| 2.3.10 | Currency display for international guests | Show prices in hotel's local currency. No conversion needed -- charge to room | Low |

### 2.4 Service Request Flow (Housekeeping / Maintenance)

```
Guest navigates to Housekeeping or Maintenance
  --> Sees service options (e.g., "Extra towels", "Room cleaning", "Fix plumbing")
  --> Selects option, adds notes and optional photo
  --> Submits request
  --> Sees confirmation with estimated response time
  --> Request appears in list with real-time status: Pending --> In Progress --> Completed
  --> Gets push notification on status changes
  --> After completion, prompted to rate the service
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 2.4.1 | Guest submits duplicate request (same type within 10 min) | Warning: "You already have a pending {type} request. Submit anyway?" | Medium |
| 2.4.2 | Guest uploads 10MB photo with request | Client-side compression. Max file size enforced (5MB). Show progress bar | Medium |
| 2.4.3 | Guest submits urgent maintenance (water leak) | Urgent flag option. Staff gets high-priority notification. Manager alerted if not claimed in 5 min | Critical |
| 2.4.4 | All staff are offline/busy | Request stays in queue. Guest sees "We've received your request. Our team will respond as soon as possible." | High |
| 2.4.5 | Request is assigned but staff member's shift ends | Auto-reassign or flag for shift handoff (see staff flows) | High |

### 2.5 Guest Session Lifecycle

```
Check-in day:
  Guest verifies stay --> session created --> full access to all guest features

During stay:
  Session persists via auth token. Auto-refresh. PWA installed on home screen.

Check-out day:
  Stay status changes to "checked_out"
  Guest can still view past requests and receipts for 24 hours
  After 24 hours: read-only access to stay history (receipts, conversations)
  AI concierge disabled
  New requests/orders blocked

30 days post-checkout:
  Guest profile retained (for returning guests)
  Conversation history retained (for hotel analytics)
  Personal data subject to retention policy
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 2.5.1 | Guest's stay is extended (late checkout) | Stay record updated via PMS sync or manually by staff. Access continues | High |
| 2.5.2 | Guest checks out but stay record not updated | Cron job checks PMS daily. Manual override by staff. Grace period of 24h | Medium |
| 2.5.3 | Guest returns to same hotel months later | Recognized by email. New stay created. Past history visible. Personalized greeting | Medium |
| 2.5.4 | Guest tries to access app after stay expires | Friendly message: "Your stay at {hotel} has ended. Thanks for staying with us!" with receipt link | High |
| 2.5.5 | Guest deletes their account (GDPR) | All personal data deleted. Anonymized records kept for hotel analytics | High |

### 2.6 Guest Tries to Access Other Portals

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 2.6.1 | Guest navigates to /staff/ | Middleware redirects to guest portal. No error page -- just redirect | Must-have |
| 2.6.2 | Guest navigates to /manager/ | Same redirect behavior | Must-have |
| 2.6.3 | Guest navigates to /admin/ | Same redirect behavior | Must-have |
| 2.6.4 | Guest with expired stay navigates to guest portal | Checkout screen or "stay ended" message | High |

---

## 3. Staff Portal Flows

### 3.1 Staff Onboarding

```
Manager sends invite from staff management screen
  --> Staff receives email: "You've been invited to join {hotel} on Innara"
  --> Clicks link --> lands on invite acceptance page
  --> Creates password, sets display name
  --> Sees brief onboarding: "Here's your dashboard. Requests will appear here."
  --> Dashboard loads with current request queue
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 3.1.1 | Invite link expires (e.g., after 7 days) | "This invite has expired. Please ask your manager to resend." | High |
| 3.1.2 | Staff clicks invite link twice | Second click: if already registered, redirect to login. If not, show registration form | Medium |
| 3.1.3 | Staff uses invite link on mobile | Staff portal is desktop-optimized. Show warning: "For the best experience, use a desktop browser." Allow access anyway | Medium |
| 3.1.4 | Manager revokes invite before acceptance | Link shows: "This invitation is no longer valid." | Medium |
| 3.1.5 | Staff email already exists in another hotel | Multi-hotel staff support? Or error: "This email is already registered." Decision needed | High |

### 3.2 Request Queue Management

```
Staff opens dashboard
  --> Sees request queue: sorted by priority then age
  --> Filters by type (housekeeping, maintenance, room service)
  --> Clicks "Claim" on a request
  --> Request moves to "In Progress", assigned to this staff member
  --> Staff completes work, updates status to "Completed"
  --> Guest receives notification
```

#### Interaction Detail: Claiming a Request

| Step | User Action | System Response | Loading State | Error State | Time |
|------|-------------|-----------------|---------------|-------------|------|
| 1 | Clicks "Claim" button | Optimistic UI: button becomes "Claimed by you" | Brief spinner | - | 0s |
| 2 | - | API call to assign request | - | - | 0-1s |
| 3a | (Success) | Request moves to "My Tasks" section | - | - | 1s |
| 3b | (Already claimed by another) | Toast: "{Name} already claimed this request" | Button reverts | Request refreshes to show new assignee | 1s |
| 3c | (Network failure) | Toast: "Couldn't claim request. Try again." | Button reverts | Retry button | 1s |

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 3.2.1 | Two staff members click "Claim" simultaneously | Database-level locking. First write wins. Second gets "already claimed" | Critical |
| 3.2.2 | Staff claims request but forgets to update status | SLA timer continues. After threshold, manager gets alert. Request can be reassigned | High |
| 3.2.3 | Staff marks request complete but guest disputes | Guest can reopen via feedback. New request created or original reopened | Medium |
| 3.2.4 | 100+ pending requests (large hotel, busy day) | Paginated list. Filters and sort working. No performance degradation | High |
| 3.2.5 | Request queue is empty | Friendly empty state: "No pending requests. Great job!" | Medium |
| 3.2.6 | Staff assigned to wrong department sees irrelevant requests | Requests filtered by staff department. Housekeeping staff sees housekeeping requests only | High |

### 3.3 Shift Handoff

```
Staff A's shift ends at 3pm
  --> Staff A has 2 in-progress requests
  --> System behavior options:
    Option A: Requests remain assigned to Staff A. Next shift staff can reassign.
    Option B: Requests auto-unassign and return to queue at shift end.
    Option C: Manager configures handoff behavior per hotel.
```

**The current plan has P3-07 (shift management screen) but does not specify handoff logic. This is a gap.**

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 3.3.1 | Staff forgets to clock out | Auto-end shift after configurable period (e.g., 2 hours past scheduled end) | Medium |
| 3.3.2 | No staff on next shift for a department | Manager alert: "No {department} coverage for {time period}" | High |
| 3.3.3 | Staff tries to claim request outside their shift | Allow it (they might be covering), but log it for manager visibility | Low |

### 3.4 Staff-to-Guest Messaging

```
Staff opens request detail
  --> Sees message thread with guest
  --> Types message: "On my way to your room now"
  --> Message appears in guest's request detail in real-time
  --> Guest replies: "Thank you!"
  --> Staff sees reply immediately (Supabase Realtime)
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 3.4.1 | Guest is offline when staff sends message | Message stored. Guest sees it when they reopen the app | High |
| 3.4.2 | Staff sends message to checked-out guest | Message sent (guest may still have access for 24h). Staff warned if stay is expired | Medium |
| 3.4.3 | Long message thread (50+ messages) | Paginated or virtualized list. Auto-scroll to latest | Medium |
| 3.4.4 | Staff sends message with link/attachment | Support rich text or at minimum URL auto-linking. Attachments: images only for now | Low |

### 3.5 Staff Escalation to Manager

**This flow is NOT in the current plan. There is no escalation mechanism.**

```
Staff encounters a request they cannot resolve
  --> Clicks "Escalate" on request detail
  --> Selects reason (needs approval, out of scope, guest complaint)
  --> Manager receives notification with escalation context
  --> Manager can reassign, respond, or resolve
```

---

## 4. Manager Portal Flows

### 4.1 Hotel Onboarding (First-Time Setup)

```
Manager receives account from admin (or self-registers on trial)
  --> Logs in, sees go-live checklist (P4-20)
  --> Steps:
    1. Complete hotel profile (name, address, logo, description)
    2. Configure services (room service menu, housekeeping options, amenities)
    3. Set operating hours per service
    4. Invite staff members (email invitations)
    5. Configure branding (logo, colors for guest app)
    6. Set up billing (Stripe payment method)
    7. Optional: Connect PMS integration
    8. Review and go live
  --> Each step tracked with progress indicator
  --> Can save and resume at any point
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 4.1.1 | Manager starts setup, leaves, returns next day | All progress saved. Resume from where they left off | Critical |
| 4.1.2 | Manager tries to go live without completing required steps | Block go-live. Show: "Complete these required steps first: {list}" | Critical |
| 4.1.3 | Manager configures everything but has no staff invited | Warning on go-live: "No staff members yet. Requests won't be handled." Allow override | High |
| 4.1.4 | Manager uploads very large logo (20MB PNG) | Client-side resize/compress. Max 2MB enforced. Show preview | Medium |
| 4.1.5 | Manager changes hotel timezone after setup | All timestamps adjusted. Historical data not retroactively changed | Medium |

### 4.2 Daily Operations Review

```
Manager opens dashboard
  --> Sees today's KPIs: active requests, avg response time, guest satisfaction
  --> Sees alert section: SLA breaches, unassigned urgent requests, staff shortages
  --> Clicks into specific metric for drill-down
  --> Can take action: reassign request, message staff, adjust priorities
```

### 4.3 Catalog Management (Menus and Services)

```
Manager opens Catalog
  --> Sees categories: Room Service, Housekeeping, Spa, etc.
  --> Can add/edit/delete items within each category
  --> Each item: name, description, price, image, availability schedule, allergens
  --> Changes go live immediately (or with toggle for draft/published)
  --> Can bulk import from CSV
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 4.3.1 | Manager deletes a menu item that has pending orders | Soft delete. Pending orders not affected. Item hidden from new orders | Critical |
| 4.3.2 | Manager changes price of item in guest's cart | Guest sees updated price on checkout. Or: preserve cart price with note | High |
| 4.3.3 | Manager uploads menu with 500 items via CSV | Batch import with progress bar. Validation errors reported per row | Medium |
| 4.3.4 | Two managers edit the same menu simultaneously | Last save wins with conflict warning if content changed since load | Medium |

### 4.4 SLA Configuration and Monitoring

```
Manager opens Operations
  --> Sets SLA thresholds per request type:
    - Housekeeping: respond in 15 min, complete in 45 min
    - Maintenance: respond in 30 min, complete in 4 hours
    - Room service: respond in 5 min, deliver in 30 min
  --> Dashboard shows SLA compliance percentage
  --> Alerts when SLA is about to breach (warning) or has breached (critical)
```

### 4.5 Billing and Subscription

```
Manager opens Billing
  --> Sees current plan, usage (number of rooms), next invoice date
  --> Can upgrade/downgrade plan
  --> Can update payment method (Stripe elements)
  --> Can view and download past invoices
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 4.5.1 | Payment fails on renewal | Email notification. Grace period (7 days). Portal shows "Update payment method" banner | Critical |
| 4.5.2 | Manager downgrades below current usage | Warning: "You have 100 rooms but are downgrading to 50-room plan. Some features may be limited." | High |
| 4.5.3 | Manager disputes invoice | Show "Contact support" link. No self-service dispute | Low |
| 4.5.4 | Manager cancels subscription | Confirmation flow. Show what happens: "Your hotel will be deactivated on {date}. Guest access will end." | Critical |
| 4.5.5 | Stripe webhook fails to deliver | Retry logic. Manual sync button in admin portal. Alert admin | High |

### 4.6 PMS Integration Configuration

```
Manager opens Integrations
  --> Selects PMS provider (Mews, Opera, Cloudbeds)
  --> Enters API credentials
  --> Tests connection
  --> Configures sync options: guest data, room status, reservations
  --> Enables sync
  --> Sees sync status and last sync time
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 4.6.1 | PMS credentials are wrong | "Connection failed. Check your API key and try again." Clear error | High |
| 4.6.2 | PMS sync pulls 10,000 reservations | Background job with progress. Dashboard shows "Syncing... 45% complete" | High |
| 4.6.3 | PMS sync creates duplicate guest records | Dedup by email. Merge strategy needed (newest wins? manual review?) | High |
| 4.6.4 | PMS goes down after integration is configured | Graceful degradation. Manual guest entry still works. Alert: "PMS sync failing since {time}" | Critical |
| 4.6.5 | PMS data conflicts with manual data | PMS is source of truth for reservations. Manual overrides flagged | Medium |

---

## 5. Admin Portal Flows

### 5.1 Tenant Creation

```
Admin opens Tenants
  --> Clicks "Create Tenant"
  --> Fills: hotel name, contact email, plan, room count
  --> Submits --> Supabase creates hotel record + initial admin user
  --> Email sent to manager with login credentials
  --> Tenant appears in list with "Pending Setup" status
```

#### Edge Cases:

| # | Scenario | Expected Behavior | Priority |
|---|----------|-------------------|----------|
| 5.1.1 | Admin creates tenant with duplicate hotel name | Allow it (different hotels can have same name). Slug must be unique | Medium |
| 5.1.2 | Manager never activates account | Admin can resend invite. Tenant shows "Pending" with age | Medium |
| 5.1.3 | Admin deletes tenant with active guests | Confirmation: "This hotel has {n} active guests. Deactivation will end all guest sessions." Soft delete with grace period | Critical |

### 5.2 Platform Health Monitoring

```
Admin opens Health dashboard
  --> Sees: total tenants, active users, API response times, error rates
  --> Sees per-tenant health: response times, error counts, storage usage
  --> Alerts for: high error rates, approaching storage limits, subscription issues
```

### 5.3 Plan Management

```
Admin opens Plans
  --> Sees plan tiers with limits (rooms, AI messages, storage)
  --> Can create/edit plans
  --> Changes propagate to Stripe product catalog
  --> Existing subscribers on changed plan: grandfathered or notified
```

---

## 6. Cross-Portal Flows

### 6.1 Full Request Lifecycle (Guest -> Staff -> Guest)

```
[Guest] Creates housekeeping request for extra pillows
  --> [Staff] Real-time notification: "New housekeeping request from Room 203"
  --> [Staff] Claims request, status changes to "In Progress"
  --> [Guest] Sees status update in real-time: "In Progress -- {Staff Name} is handling your request"
  --> [Staff] Messages guest: "On my way!"
  --> [Guest] Receives message notification, reads message
  --> [Staff] Marks complete
  --> [Guest] Sees "Completed" status, prompted to rate
  --> [Guest] Rates 5 stars with comment "Fast service!"
  --> [Manager] Sees rating in analytics dashboard
```

**Critical requirement: every status change must propagate in real-time across portals. The plan has P2-19 (Realtime hooks) but cross-portal E2E testing for this specific flow is only in P6-01.**

### 6.2 Staff Invitation Lifecycle (Manager -> Staff)

```
[Manager] Invites staff via email from staff management screen
  --> [System] Sends invite email via Resend (P4-22)
  --> [Staff] Clicks link, creates account
  --> [Manager] Sees staff member appear in staff list with "Active" status
  --> [Staff] Sees dashboard with request queue
```

### 6.3 Tenant Onboarding Lifecycle (Admin -> Manager -> Staff -> Guest)

```
[Admin] Creates tenant, sets up hotel record
  --> [Manager] Receives invite, logs in, sees go-live checklist
  --> [Manager] Configures hotel: services, menu, branding, staff
  --> [Manager] Invites staff members
  --> [Staff] Accept invites, accounts activated
  --> [Manager] Clicks "Go Live"
  --> [Guest] Scans QR code, verifies stay, uses concierge
```

**This end-to-end flow spans ALL 4 portals and is the most critical integration test. P6-01 must cover this.**

### 6.4 AI Concierge Creates Request (Guest -> AI -> Staff)

```
[Guest] Asks AI: "My AC is broken"
  --> [AI] Creates maintenance request via tool use
  --> [Staff] Receives real-time notification for new maintenance request
  --> [Staff] Claims and resolves
  --> [Guest] Notified via AI chat AND request list
```

### 6.5 Role Change (Staff -> Manager)

**Not covered in current plan.**

```
[Admin/Manager] Promotes staff member to manager role
  --> Staff's JWT claims updated on next token refresh
  --> Staff sees manager portal on next login (or after forced re-auth)
  --> Staff's existing work history preserved
  --> Staff no longer appears in staff queue
```

---

## 7. Edge Cases and Failure Modes

### 7.1 Network and Connectivity

| # | Scenario | Portal | Expected Behavior | Priority |
|---|----------|--------|-------------------|----------|
| 7.1.1 | Guest loses internet while placing order | Guest | Cart preserved in localStorage. Retry on reconnect. PWA offline indicator | Critical |
| 7.1.2 | Staff loses internet while updating request | Staff | Optimistic update reverted. Toast: "Update failed. Reconnecting..." | High |
| 7.1.3 | Supabase Realtime connection drops | All | Auto-reconnect with exponential backoff. Show "Reconnecting..." indicator | High |
| 7.1.4 | Slow 3G connection on guest mobile | Guest | Skeleton loaders. Images lazy-loaded. Critical actions still work | High |
| 7.1.5 | Vercel edge goes down | All | Supabase still accessible. Show maintenance page | Medium |

### 7.2 Authentication and Sessions

| # | Scenario | Portal | Expected Behavior | Priority |
|---|----------|--------|-------------------|----------|
| 7.2.1 | JWT token expires during form submission | All | Silent refresh. If refresh fails: save form state, redirect to login, restore after | Critical |
| 7.2.2 | User opens app in two tabs | All | Both tabs work. Realtime updates in both. Logout in one logs out both | High |
| 7.2.3 | Admin disables user account while user is logged in | All | On next API call: 403. Redirect to "Account disabled" page | High |
| 7.2.4 | Password reset while logged in elsewhere | Staff/Manager | Other sessions invalidated. Force re-login | Medium |
| 7.2.5 | Magic link used on different device than requested | Guest | Works (by design). Token is single-use | Medium |

### 7.3 Data Integrity

| # | Scenario | Portal | Expected Behavior | Priority |
|---|----------|--------|-------------------|----------|
| 7.3.1 | Guest from Hotel A somehow accesses Hotel B data | All | RLS prevents it at DB level. API returns empty/403. Never leak cross-tenant data | Critical |
| 7.3.2 | SQL injection via AI concierge input | Guest | All inputs parameterized. AI context injection sanitized | Critical |
| 7.3.3 | XSS via guest message content | All | All user content sanitized/escaped on render. CSP headers | Critical |
| 7.3.4 | Guest submits request with emoji, unicode, RTL text | Guest | Stored and displayed correctly. No truncation or encoding errors | Medium |
| 7.3.5 | Manager bulk-deletes 1000 catalog items | Manager | Batch operation with confirmation. Soft delete. Reversible for 30 days | Medium |

### 7.4 Concurrency

| # | Scenario | Portal | Expected Behavior | Priority |
|---|----------|--------|-------------------|----------|
| 7.4.1 | Two staff claim same request at exact same time | Staff | DB constraint: only one assignee. Optimistic locking or SELECT FOR UPDATE | Critical |
| 7.4.2 | Manager edits menu while guest is ordering | Guest/Manager | Guest's cart items validated at checkout time. Stale items flagged | High |
| 7.4.3 | PMS sync updates stay while guest is active | Guest | Session continues. Stay data refreshes on next page load | Medium |
| 7.4.4 | Admin changes plan limits while manager is at limit | Manager | Grace period. No immediate disruption. Warning on next login | Medium |

### 7.5 Hotel Deactivation

```
[Admin] Deactivates hotel (subscription cancelled, trial ended, or policy violation)
  --> All active guest sessions terminated with message: "This service is currently unavailable."
  --> Staff/Manager login returns: "Your hotel's account has been suspended. Contact your administrator."
  --> Data preserved for 90 days (regulatory)
  --> After 90 days: data permanently deleted (with GDPR compliance)
  --> Manager can reactivate by updating payment within grace period
```

**This flow is not explicitly covered in the plan. P5-01 (tenant management) should include activation/deactivation logic.**

### 7.6 GDPR and Data Privacy

| # | Scenario | Portal | Expected Behavior | Priority |
|---|----------|--------|-------------------|----------|
| 7.6.1 | Guest requests data export (GDPR Article 15) | Guest/Admin | Export all guest data as JSON/CSV within 30 days. Automated if possible | High |
| 7.6.2 | Guest requests deletion (GDPR Article 17) | Guest/Admin | Delete personal data. Anonymize analytics records. Confirm deletion | High |
| 7.6.3 | Hotel data retention after tenant deletion | Admin | 90-day retention, then permanent deletion. Configurable per jurisdiction | High |
| 7.6.4 | AI conversation data contains personal info | Guest | Conversation data subject to same retention policy as other guest data | Medium |

---

## 8. State Transition Diagrams

### 8.1 Request States

```
[Created/Pending] --claim--> [In Progress] --complete--> [Completed]
       |                          |                            |
       |--cancel-->  [Cancelled]  |--escalate--> [Escalated]   |--reopen--> [Reopened] --claim--> [In Progress]
       |                          |
       |                          |--reassign--> [In Progress (new assignee)]
       |
       |--auto-expire (guest checkout)--> [Expired]
```

**Transitions:**
- Created -> In Progress: Staff claims (staff, auto-assign)
- Created -> Cancelled: Guest cancels (guest), Staff cancels (staff)
- In Progress -> Completed: Staff marks done (staff)
- In Progress -> Escalated: Staff escalates (staff) -- NOT IN PLAN
- In Progress -> In Progress: Reassigned (manager, system on shift change)
- Completed -> Reopened: Guest disputes or new issue (guest, manager) -- NOT IN PLAN
- Created -> Expired: Stay ends with pending request (system)

### 8.2 Order States

```
[Pending] --accept--> [Preparing] --ready--> [Delivering] --deliver--> [Delivered]
    |                       |
    |--cancel--> [Cancelled] |--cancel--> [Cancelled] (with refund logic)
```

### 8.3 Stay States

```
[Reserved] --check_in--> [Active] --check_out--> [Checked Out]
     |                       |
     |--cancel--> [Cancelled] |--extend--> [Active (new check_out)]
```

### 8.4 Staff Account States

```
[Invited] --accept--> [Active] --deactivate--> [Deactivated]
    |                      |                         |
    |--expire--> [Expired]  |--promote--> [Manager]   |--reactivate--> [Active]
```

### 8.5 Hotel/Tenant States

```
[Created] --setup_complete--> [Active] --suspend--> [Suspended]
    |                              |                      |
    |                              |--deactivate--> [Deactivated] --reactivate--> [Active]
    |                              |
    |--trial_expire--> [Suspended]  |--go_live--> [Live]
```

---

## 9. Accessibility Notes

### Guest Portal (highest priority -- public-facing)

- **Keyboard navigation:** Every action in the concierge, menu, and request forms must be completable via keyboard alone. Tab order must be logical.
- **Screen reader:** All images (menu items, hotel photos) need descriptive alt text. Chat messages must be announced. Status changes must be ARIA-live announced.
- **Color contrast:** Bronze on navy must meet WCAG AA (4.5:1 ratio). Test bronze (#9B7340) on white and dark backgrounds.
- **Touch targets:** Minimum 44x44px for all interactive elements (mobile PWA).
- **Toast notifications:** Must persist long enough to read (minimum 5 seconds). Must be dismissible. Must not block interaction.
- **Forms:** All inputs labeled. Error messages associated with fields via aria-describedby. Focus moves to first error on validation failure.
- **Chat interface:** Messages marked up as a list. New messages announced via aria-live="polite". Input has clear label.

### Staff/Manager Portals

- **Complex tables:** Request queues and analytics tables need proper th/td markup, scope attributes, and keyboard-navigable rows.
- **Filters and dropdowns:** Must be operable via keyboard. Custom selects need ARIA roles.
- **Charts (analytics):** Must have text alternative (data table below chart or aria-label with summary).
- **Drag-and-drop (if any):** Must have keyboard alternative.

---

## 10. Gap Analysis -- Missing from 102-Ticket Plan

### Critical Gaps

| # | What's Missing | Portal(s) | Suggested Ticket Title | Priority | Phase |
|---|---------------|-----------|----------------------|----------|-------|
| GAP-01 | **Guest entry mechanism** -- QR code generation, distribution, deep link handling. How does the guest physically get to the app? The plan has "welcome/onboarding" but not the QR/link generation or the hotel-side setup for distributing access | Guest + Manager | [FEAT] Guest entry: QR code generation, deep links, and hotel-side distribution setup | Critical | P2 |
| GAP-02 | **Guest authentication method** -- Plan says "magic link" in architecture but P1-10 just says "login and registration pages." No detail on booking-reference verification, anonymous sessions, or multi-guest-per-room | Guest | [FEAT] Guest auth: booking reference verification + magic link + multi-guest support | Critical | P1 |
| GAP-03 | **Request escalation workflow** -- No mechanism for staff to escalate to manager. No escalation states in request lifecycle | Staff + Manager | [FEAT] Request escalation: staff-to-manager with notification and reassignment | High | P3 |
| GAP-04 | **Request reopening/dispute** -- Guest cannot reopen a completed request if unsatisfied. No "reopened" state | Guest + Staff | [FEAT] Request reopen flow for guest disputes after completion | High | P2 |
| GAP-05 | **Shift handoff logic** -- P3-07 has shift management screen but no handoff behavior for in-progress requests when shifts change | Staff | [FEAT] Shift handoff: auto-reassignment or queue return for in-progress requests | High | P3 |
| GAP-06 | **Hotel deactivation cascade** -- What happens to active guest sessions, staff accounts, and data when a hotel is suspended or deactivated? | All | [FEAT] Hotel deactivation: session termination, access revocation, data retention | Critical | P5 |
| GAP-07 | **AI concierge failure handling** -- No ticket for what happens when Claude API is down, rate-limited, or returns errors. No fallback UI | Guest | [FEAT] AI concierge fallback: error handling, retry logic, and manual request fallback | High | P2 |
| GAP-08 | **Concurrent request claiming (optimistic locking)** -- Two staff claiming same request simultaneously. No ticket for race condition handling | Staff | [FEAT] Optimistic locking for request claim to prevent double-assignment | Critical | P3 |
| GAP-09 | **Order cancellation flow** -- Guest can place orders but no cancel/modify flow documented | Guest + Staff | [FEAT] Order cancellation: guest-initiated and staff-initiated with status guards | High | P2 |
| GAP-10 | **GDPR data export and deletion** -- No ticket for right to access, right to erasure, or data retention policies | Guest + Admin | [FEAT] GDPR compliance: guest data export, deletion, and retention policies | High | P5 |

### High-Priority Gaps

| # | What's Missing | Portal(s) | Suggested Ticket Title | Priority | Phase |
|---|---------------|-----------|----------------------|----------|-------|
| GAP-11 | **Guest session expiry on checkout** -- What happens when stay ends? Read-only access? Full lockout? Gradual degradation? | Guest | [FEAT] Guest post-checkout experience: read-only access, receipt viewing, session cleanup | High | P2 |
| GAP-12 | **Room service availability hours** -- No mechanism for time-based menu availability (breakfast vs dinner, service hours) | Guest + Manager | [FEAT] Service hours configuration and time-based menu availability | High | P4 |
| GAP-13 | **Duplicate request detection** -- Guest submits same request type within minutes. No dedup or warning | Guest | [FEAT] Duplicate request warning for same-type requests within time window | Medium | P2 |
| GAP-14 | **Staff department filtering** -- Housekeeping staff should only see housekeeping requests. Plan has filters but no department-scoped defaults | Staff | [FEAT] Department-based request queue scoping for staff members | High | P3 |
| GAP-15 | **Role promotion/demotion** -- Staff promoted to manager, or manager demoted. JWT claim update, portal access change, data migration | All | [FEAT] Role change workflow: promotion/demotion with JWT refresh and access update | High | P5 |
| GAP-16 | **Stripe webhook failure handling** -- Plan has Stripe setup (P4-04) but no resilience for failed webhooks, missed events, or payment failures | Manager + Admin | [FEAT] Stripe webhook resilience: retry logic, manual sync, failure alerting | High | P4 |
| GAP-17 | **PMS sync failure recovery** -- What happens when PMS sync fails mid-batch? Partial data? Rollback? | Manager | [FEAT] PMS sync error recovery: partial failure handling, retry, and alerting | High | P5 |
| GAP-18 | **Notification preferences** -- Plan mentions notification_preferences table but no UI for configuring them. Guests/staff should control what notifications they receive | Guest + Staff | [FEAT] Notification preferences UI for guests and staff | Medium | P3 (staff) / P2 (guest) |
| GAP-19 | **Empty state handling across all screens** -- No dedicated ticket for empty states (no requests, no orders, no staff, no analytics data) | All | [CHORE] Empty state designs and copy for all list/dashboard screens | Medium | P6 |
| GAP-20 | **Multi-language support** -- Hotels serve international guests. No i18n mentioned anywhere | Guest | [FEAT] i18n foundation: language detection, translation framework, RTL support | Medium | P5 or post-launch |

### Medium-Priority Gaps

| # | What's Missing | Portal(s) | Suggested Ticket Title | Priority | Phase |
|---|---------------|-----------|----------------------|----------|-------|
| GAP-21 | **AI concierge context injection security** -- Prompt injection via guest messages. Guest could manipulate AI to reveal system prompts or hotel data from other tenants | Guest | [SECURITY] AI concierge prompt injection protection and context isolation | High | P2 |
| GAP-22 | **Image upload and compression** -- Guests attach photos to maintenance requests. No upload pipeline, compression, or size limits specified | Guest | [FEAT] Image upload pipeline: compression, size limits, storage in Supabase Storage | Medium | P2 |
| GAP-23 | **Invite expiry and resend** -- Staff/manager invites. What's the expiry? Can manager resend? Can expired invite be renewed? | Manager | [FEAT] Invitation lifecycle: expiry timer, resend capability, revocation | Medium | P4 |
| GAP-24 | **Browser back button after form submission** -- Guest submits order, hits back, submits again. Duplicate prevention at UI and API level | Guest | [FEAT] Form submission idempotency and back-button duplicate prevention | Medium | P2 |
| GAP-25 | **Manager reporting date ranges and exports** -- P4-14 says "reports + exports" but no detail on date range picker, export formats (PDF/CSV), or email scheduling | Manager | [FEAT] Report configuration: date ranges, export formats (PDF/CSV), scheduled emails | Medium | P4 |
| GAP-26 | **AI concierge conversation history management** -- Can guest clear chat? Is there a limit? What happens with very long conversations? | Guest | [FEAT] AI conversation management: clear history, conversation limits, performance | Medium | P2 |
| GAP-27 | **Multi-hotel staff** -- Can a staff member work at two hotels? The schema ties profile to one hotel_id. This blocks hotel chains | Staff + Admin | [DESIGN] Multi-hotel staff support: schema design for hotel chain use case | Medium | Post-launch |
| GAP-28 | **Catalog item scheduling** -- Menu items available only certain days/times (e.g., Sunday brunch). No scheduling mechanism | Manager | [FEAT] Catalog item scheduling: day-of-week and time-range availability | Medium | P4 |
| GAP-29 | **Guest pre-arrival access** -- Can guest use the app before check-in? Browse hotel info, plan activities? | Guest | [FEAT] Pre-arrival guest experience: browse-only access before check-in | Low | Post-launch |
| GAP-30 | **Audit trail for guest-facing actions** -- P4-05 has audit trail triggers but scope unclear. Should guest actions (orders, requests) be audited? | Manager | [FEAT] Audit trail scope expansion: include guest orders and request lifecycle | Medium | P4 |

### Low-Priority Gaps

| # | What's Missing | Portal(s) | Suggested Ticket Title | Priority | Phase |
|---|---------------|-----------|----------------------|----------|-------|
| GAP-31 | **Guest feedback on specific staff member** -- Rating is per-request but not tied to staff performance metrics | Manager | [FEAT] Staff performance metrics derived from guest ratings | Low | P4 |
| GAP-32 | **Bulk CSV import for catalog** -- Manager should be able to import menu from spreadsheet | Manager | [FEAT] CSV import for catalog items with validation and error reporting | Low | P4 |
| GAP-33 | **Offline PWA capability scope** -- P5-09 says "offline" but what works offline? Cached menu? Cached requests? Just a "you're offline" page? | Guest | [DESIGN] Define PWA offline capability scope: cache-first vs network-first per route | Medium | P5 |
| GAP-34 | **Dark mode for guest app** -- Guest portal is described as "light/airy" but no dark mode option. Guests browsing at night | Guest | [FEAT] Guest portal dark mode with system preference detection | Low | Post-launch |
| GAP-35 | **Webhook for external integrations** -- Hotels may want to connect Innara to other tools (Slack notifications, custom PMS). No outbound webhook system | Manager | [FEAT] Outbound webhook system for third-party integrations | Low | Post-launch |

---

## 11. Playwright Test Specs

These test descriptions are ready for the QA tester to implement.

### Guest Portal Tests

```
TEST: Guest onboarding via QR code scan
  - Navigate to /{hotel-slug}?room=203
  - Verify welcome screen shows hotel name and branding
  - Enter valid booking reference -> verify redirect to concierge
  - Enter invalid booking reference -> verify error message
  - Enter expired booking reference -> verify "stay ended" message

TEST: AI concierge basic conversation
  - Open concierge chat
  - Verify greeting includes guest name and hotel name
  - Send "I need extra towels" -> verify AI responds with action suggestion
  - Confirm action -> verify request created in requests list
  - Verify request appears with "Pending" status

TEST: AI concierge error handling
  - Mock Claude API failure
  - Send message -> verify fallback error message displayed
  - Verify "try again" or "submit request manually" link works
  - Mock rate limit -> verify rate limit message after threshold

TEST: Room service ordering happy path
  - Navigate to room service menu
  - Verify categories displayed with items
  - Add item to cart -> verify cart badge updates
  - Open cart -> verify item details correct
  - Place order -> verify confirmation screen with estimated time
  - Verify order appears in requests list

TEST: Room service edge cases
  - Attempt order outside service hours -> verify block message
  - Double-click "Place Order" -> verify only one order created
  - Add item, go back, add same item -> verify quantities merge
  - Empty menu (no items configured) -> verify "not available" message

TEST: Service request submission
  - Navigate to housekeeping -> select "Extra towels"
  - Add notes -> submit
  - Verify confirmation with estimated time
  - Verify request appears in list with "Pending" status
  - Verify push notification permission prompt (first time)

TEST: Request real-time status updates
  - Create request as guest
  - In separate context, log in as staff and claim request
  - Verify guest sees status change to "In Progress" without page refresh
  - Staff marks complete -> verify guest sees "Completed"
  - Verify rating prompt appears

TEST: Guest post-checkout access
  - Set stay status to "checked_out"
  - Navigate to guest portal -> verify read-only state
  - Verify cannot create new requests or orders
  - Verify can view past requests and receipts
  - Verify AI concierge is disabled

TEST: Guest offline behavior (PWA)
  - Install PWA
  - Go offline (network throttling)
  - Verify offline indicator displayed
  - Verify cached menu/hotel info still viewable
  - Attempt to place order -> verify "offline" message with retry
  - Go online -> verify retry succeeds

TEST: Guest portal accessibility
  - Tab through all interactive elements -> verify logical order
  - Verify all images have alt text
  - Verify form inputs have labels
  - Verify error messages associated with fields
  - Verify toast notifications announced to screen reader
  - Verify color contrast meets WCAG AA
```

### Staff Portal Tests

```
TEST: Staff invitation and onboarding
  - Admin/Manager creates staff invitation
  - Navigate to invite link -> verify registration form
  - Complete registration -> verify redirect to staff dashboard
  - Verify dashboard shows request queue

TEST: Staff claims request (happy path)
  - Create request as guest
  - Log in as staff -> verify request in queue
  - Click "Claim" -> verify assigned to current user
  - Verify request moves to "My Tasks"
  - Mark complete -> verify status update

TEST: Staff concurrent claim (race condition)
  - Create request as guest
  - Open two staff sessions simultaneously
  - Both click "Claim" at same time
  - Verify only one succeeds
  - Verify other sees "already claimed" message

TEST: Staff-guest messaging
  - Staff opens claimed request
  - Sends message to guest
  - In guest session, verify message appears in real-time
  - Guest replies -> verify staff sees reply in real-time

TEST: Staff request queue filters
  - Create requests of different types and priorities
  - Apply type filter -> verify only matching requests shown
  - Apply priority filter -> verify correct filtering
  - Combine filters -> verify intersection

TEST: Staff shift management
  - View current shift schedule
  - Clock in -> verify status changes
  - Verify request notifications start arriving
  - Clock out -> verify status changes

TEST: Staff empty queue
  - Log in with no pending requests
  - Verify friendly empty state message displayed
  - Create request as guest -> verify it appears in real-time
```

### Manager Portal Tests

```
TEST: Manager onboarding / go-live checklist
  - Log in as new manager
  - Verify go-live checklist displayed with incomplete steps
  - Complete each step -> verify progress updates
  - Attempt go-live with incomplete steps -> verify block message
  - Complete all steps -> verify go-live succeeds

TEST: Manager catalog management
  - Add new menu item with name, price, description, image
  - Verify item appears in catalog
  - Edit item -> verify changes saved
  - Delete item -> verify soft delete (not available to guests)
  - Verify item with pending orders cannot be hard-deleted

TEST: Manager staff invitation
  - Navigate to staff management
  - Send invitation via email
  - Verify invitation appears in "Pending" list
  - Accept invitation in separate session
  - Verify staff appears as "Active" in manager's list

TEST: Manager analytics dashboard
  - Verify KPIs displayed: response time, satisfaction, request volume
  - Click metric for drill-down -> verify detailed view
  - Change date range -> verify data updates
  - Verify empty state for new hotel with no data

TEST: Manager billing
  - View current plan and usage
  - Update payment method via Stripe elements
  - View invoice history
  - Download invoice as PDF
  - Attempt downgrade below usage -> verify warning

TEST: Manager branding
  - Upload custom logo -> verify preview
  - Change primary color -> verify preview
  - Save branding -> verify guest portal reflects changes
  - Reset to defaults -> verify restoration

TEST: Manager PMS integration
  - Select PMS provider
  - Enter credentials -> test connection
  - Verify successful connection indicator
  - Enter wrong credentials -> verify error message
  - Enable sync -> verify sync status updates
```

### Admin Portal Tests

```
TEST: Admin tenant creation
  - Create new tenant with hotel details
  - Verify hotel record created in database
  - Verify invite email sent to manager
  - Verify tenant appears in tenant list with "Pending" status

TEST: Admin tenant deactivation
  - Deactivate hotel with active guests
  - Verify confirmation prompt with impact summary
  - Confirm -> verify guest sessions terminated
  - Verify staff/manager login blocked
  - Reactivate -> verify access restored

TEST: Admin health monitoring
  - Verify dashboard shows system metrics
  - Verify per-tenant health visible
  - Simulate high error rate -> verify alert appears

TEST: Admin plan management
  - Create new plan with limits
  - Edit existing plan -> verify changes propagated
  - Verify existing subscribers notified of changes
```

### Cross-Portal Tests

```
TEST: Full request lifecycle across portals
  - Guest creates request
  - Staff receives notification and claims
  - Staff updates status -> guest sees update
  - Staff completes -> guest rates
  - Manager sees rating in analytics

TEST: Full onboarding lifecycle
  - Admin creates tenant
  - Manager receives invite, logs in, completes setup
  - Manager invites staff
  - Staff accepts, sees dashboard
  - Guest scans QR, verifies stay, uses concierge

TEST: Multi-tenant isolation
  - Create data in Hotel A
  - Log in as Hotel B user
  - Verify zero data leakage (requests, orders, guests, messages, analytics)
  - Attempt direct API call with Hotel A IDs from Hotel B session -> verify 403/empty
```

---

## 12. Recommendations for Development

### For Phase 1 (Foundation)
1. **Decide guest auth method NOW.** Magic link? Booking reference? Anonymous? This affects P1-10, P2-01, P2-02, and the entire guest onboarding experience. Recommendation: booking reference + magic link for persistent access.
2. **Add `department` field to profiles table** for staff department-based filtering. Without it, all staff see all requests regardless of role.
3. **Add `status` field to hotels table** (created, active, suspended, deactivated) for tenant lifecycle management.
4. **Add `expires_at` field to invitations** (if not already in the schema) for invite expiry handling.

### For Phase 2 (Guest Portal)
5. **Design the QR code generation and distribution system.** Manager needs a screen to generate and download QR codes (per-room or general). This feeds into guest onboarding.
6. **Implement idempotency keys on order submission** to prevent double-orders from double-taps or back-button.
7. **Build AI concierge with circuit breaker pattern.** When Claude API is down, fall back to a simplified menu-driven request system.
8. **Handle order cancellation states** -- guests will want to cancel. Define the time window and who can cancel at each stage.

### For Phase 3 (Staff Portal)
9. **Implement optimistic locking on request claims** using a version column or updated_at check. This is a concurrency requirement, not optional.
10. **Define shift handoff behavior** before building P3-07. Consult with hotel operators if possible. Default recommendation: requests return to queue at shift end unless manually kept.
11. **Add escalation button and escalation state** to request management. Staff need a way to say "I can't handle this."

### For Phase 4 (Manager Portal)
12. **Service hours are a first-class entity.** Menu items and services need `available_from`, `available_to`, and `available_days` fields. Without this, guests can order breakfast at midnight.
13. **Stripe webhook handler must be idempotent** and handle out-of-order delivery. Store event IDs to deduplicate.
14. **Catalog soft-delete must check for pending orders** before removing items. Never hard-delete catalog items.

### For Phase 5 (Admin + PWA + PMS)
15. **Define PWA offline scope explicitly.** Not everything can work offline. Recommendation: cache hotel info, menu, and past requests. Block new submissions offline with clear messaging.
16. **PMS sync must be resumable.** If sync fails at record 500 of 1000, it should resume from 500, not restart.
17. **Add GDPR endpoints** -- data export and deletion. Even if the UI is basic, the API must exist for compliance.

### For Phase 6 (Testing + Launch)
18. **Cross-portal E2E tests (P6-01) must include the full lifecycle test** described in section 6.3. This is the most critical integration test for the entire platform.
19. **Load test the Realtime subscriptions** specifically. 200 guests at a busy hotel all subscribed to request updates simultaneously is a realistic scenario.
20. **Test with real mobile devices**, not just browser emulation. PWA install prompts, push notifications, and offline behavior differ significantly on actual phones.

---

## Scenario Count Summary

| Category | Scenarios Documented |
|----------|---------------------|
| Guest onboarding | 8 |
| AI concierge | 10 |
| Room service ordering | 10 |
| Service requests | 5 |
| Guest session lifecycle | 5 |
| Guest portal boundary | 4 |
| Staff onboarding | 5 |
| Staff request management | 6 |
| Staff shift handoff | 3 |
| Staff messaging | 4 |
| Manager onboarding | 5 |
| Manager catalog | 4 |
| Manager billing | 5 |
| Manager PMS | 5 |
| Admin tenant management | 3 |
| Cross-portal flows | 5 |
| Network/connectivity | 5 |
| Auth/sessions | 5 |
| Data integrity | 5 |
| Concurrency | 4 |
| Hotel deactivation | 1 |
| GDPR | 4 |
| **Total** | **121 scenarios** |

---

## Gap Summary

| Priority | Count | Examples |
|----------|-------|---------|
| Critical | 4 | Guest entry mechanism, guest auth, concurrent claiming, hotel deactivation cascade |
| High | 12 | Escalation, order cancellation, shift handoff, Stripe resilience, GDPR, department filtering |
| Medium | 11 | Duplicate detection, notification preferences, empty states, i18n, image upload |
| Low | 8 | Staff performance metrics, CSV import, dark mode, outbound webhooks |
| **Total gaps** | **35** | |

These 35 gaps represent flows, states, and scenarios not covered by the current 102 tickets. Addressing the Critical and High gaps (16 tickets) before or during their respective phases will prevent the most impactful bugs and user experience failures.
