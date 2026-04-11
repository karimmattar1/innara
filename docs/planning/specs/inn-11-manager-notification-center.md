# INN-11 — Manager Notification Center (Design Spec)

**Ticket:** INN-11
**Phase:** 4 — Manager Portal + Billing (testing/design tail)
**Author:** orchestrator
**Approved by:** Karim (2026-04-10 — full page + enhanced drawer option)
**Status:** Approved, ready to implement

---

## 1. Goal

Give hotel managers a **dedicated full-page notification center** where they can browse, filter, and act on all notifications — operational alerts, guest/staff messages, SLA breaches, and system events. The existing `NotificationDrawer` remains the quick-access surface (bell icon in header); the full page is the deep-dive view linked from the drawer.

Managers open this screen to:
- See all notifications at a glance, not limited to the drawer's small viewport
- Filter by category (Operations, Messages, Alerts, System) via tabs
- Toggle between all vs. unread-only
- Mark individual or all notifications as read
- Navigate to the source item via action links on each card

## 2. Architectural Context

**Existing infrastructure (reuse, don't rebuild):**
- `notifications` table in Supabase — already has all required columns (id, hotel_id, user_id, audience, notification_type, title, body, link_to, read, created_at)
- `src/app/actions/notifications.ts` — 6 server actions: `getMyNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `createNotification`, `deleteOldNotifications`
- `src/components/innara/NotificationDrawer.tsx` — full-featured drawer with card rendering, optimistic updates, loading/error/empty states, skeleton loaders
- `src/hooks/use-notifications.ts` — drawer state + 30s unread count polling
- `src/types/domain.ts` — `NotificationType` union: `request_update | new_request | guest_message | staff_message | sla_breach | assignment | other`

**What needs to change:**
- `getMyNotifications` needs a `notificationTypes` filter parameter (array of `NotificationType` values) to support tab filtering
- New page component at `/manager/notifications`
- `NotificationDrawer` gets a "View all notifications" link in its footer pointing to `/manager/notifications`

**What stays untouched:**
- `createNotification` is implemented but not yet wired to event triggers — that's Phase 5 scope, not this ticket
- The notification polling interval (30s) and `useNotifications` hook remain unchanged

## 3. Route + Files

| Role | Path |
|------|------|
| Page route | `/manager/notifications` |
| Page component | `src/app/(manager)/manager/notifications/page.tsx` (NEW) |
| Server action change | `src/app/actions/notifications.ts` (MODIFY — add `notificationTypes` filter) |
| Drawer change | `src/components/innara/NotificationDrawer.tsx` (MODIFY — add "View all" footer link) |
| Acceptance tests | `tests/unit/inn-11-notifications.test.ts` (NEW — Vitest) |
| Shared components reused | `ManagerHeader`, `PageHeader` from `src/components/innara/` |

## 4. Layout

```
+--------------------------------------------------------------------+
|  ManagerHeader (existing)                                           |
+--------------------------------------------------------------------+
|  PageHeader: "Notifications"          [ Mark all read (CheckCheck)] |
+--------------------------------------------------------------------+
|  [ All (12) | Operations (5) | Messages (4) | Alerts (2) | System (1) ] |
|                                               [ ] Show unread only  |
+--------------------------------------------------------------------+
|                                                                      |
|  +----------------------------------------------------------------+ |
|  | [icon] Title text (bold if unread)               [unread dot]  | |
|  |        Body preview (2 lines max, muted)         [View ->]     | |
|  |        2 hours ago                                             | |
|  +----------------------------------------------------------------+ |
|  | [icon] Another notification title                              | |
|  |        Body text here...                                       | |
|  |        Yesterday                                               | |
|  +----------------------------------------------------------------+ |
|  | ...                                                            | |
|  +----------------------------------------------------------------+ |
|                                                                      |
|  [ Load more ]  (or "No more notifications" text)                   |
|                                                                      |
+--------------------------------------------------------------------+
```

## 5. Tab Definitions

| Tab | Label | Notification Types | Icon |
|-----|-------|--------------------|------|
| All | "All" | (no filter) | — |
| Operations | "Operations" | `request_update`, `new_request`, `assignment` | `Clock` |
| Messages | "Messages" | `guest_message`, `staff_message` | `MessageSquare` |
| Alerts | "Alerts" | `sla_breach` | `AlertTriangle` |
| System | "System" | `other` | `Bell` |

Tab counts are derived from the total results per category returned from the server. The active tab is stored in component state (default: "All"). Changing tabs resets pagination to page 1.

## 6. Server Action Changes

### `getMyNotifications` — add `notificationTypes` filter

Current schema:
```typescript
const getMyNotificationsSchema = z.object({
  unreadOnly: z.boolean().optional().default(false),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});
```

Updated schema:
```typescript
const getMyNotificationsSchema = z.object({
  unreadOnly: z.boolean().optional().default(false),
  notificationTypes: z.array(
    z.enum(["request_update", "new_request", "guest_message", "staff_message", "sla_breach", "assignment", "other"])
  ).optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});
```

When `notificationTypes` is provided and non-empty, add `.in("notification_type", notificationTypes)` to both the list query and the unread count query. When omitted or empty, no type filter is applied (current behavior preserved).

## 7. NotificationDrawer Enhancement

Add a "View all notifications" link in the footer section (after the count text):

```tsx
<Link href="/manager/notifications" className="...">
  View all notifications
</Link>
```

This only appears when the drawer `variant` is `"dark"` (manager/staff portals). The link closes the drawer on click via `onOpenChange(false)`.

The `variant` prop already exists and distinguishes light (guest) from dark (staff/manager). Use it to conditionally render the link — only manager portal users need a full notifications page in this phase.

## 8. Notification Card Design

Reuse the same visual pattern from `NotificationDrawerItem` but adapted for full-page width:

- **Icon:** Type-specific icon in a rounded container (same `getNotificationIcon` mapping)
- **Title:** Bold if unread, normal weight if read. `text-sm`.
- **Body:** Muted, `line-clamp-2`, `text-xs`
- **Timestamp:** `getTimeAgo()` from `@/lib/utils`. `text-[11px]`, muted.
- **Unread dot:** Bronze (` bg-[#9B7340]`) 2px dot on the right side
- **Action link:** If `link_to` is set, show "View" link/button. Clicking marks as read + navigates.
- **Click behavior:** Entire card is clickable. Click marks as read (optimistic) + navigates to `link_to` if present.

Dark mode styling matches the manager portal: `glass-card-dark` container, white text, `white/` opacity modifiers for muted text.

## 9. States

| State | Display |
|-------|---------|
| Loading | 6 skeleton cards (reuse `NotificationSkeletonItem` pattern) |
| Error | Alert icon + "Failed to load notifications" + "Try again" button |
| Empty (all tabs) | CheckCircle icon + "You're all caught up!" + "No new notifications right now." |
| Empty (filtered tab) | "No [tab name] notifications" message |
| Loaded | Notification cards + optional "Load more" button |

## 10. Interactions

1. **Tab switching:** Changes active tab, resets to page 1, re-fetches with new `notificationTypes` filter
2. **Unread toggle:** Toggles `unreadOnly` filter, resets to page 1, re-fetches
3. **Mark all read:** Calls `markAllAsRead()` with optimistic update (same pattern as drawer)
4. **Card click:** Marks as read (optimistic) + navigates to `link_to`
5. **Load more:** Increments page, appends results to existing list
6. **Tab counts:** Fetched once on page load (one query per tab's type filter), updated after mark-all-read

## 11. Pagination

- Page size: 20 (matches drawer)
- "Load more" button at bottom (not infinite scroll — consistent with drawer pattern)
- `hasMore` = `fetched.length === pageSize`
- Loading state on button while fetching

## 12. Accessibility

- Tab bar uses `role="tablist"` / `role="tab"` / `aria-selected`
- Notification list uses `role="feed"` / `aria-label="Notification list"`
- Each card: `role="article"`, `aria-label` includes unread status + title
- Mark-all-read button: `aria-label="Mark all notifications as read"`
- Unread toggle: accessible checkbox with label
- Keyboard: Tab through tabs, Enter/Space to select, Tab to cards, Enter to activate

## 13. Acceptance Criteria

1. **AC-1:** Page renders at `/manager/notifications` with "Notifications" heading and mark-all-read button
2. **AC-2:** Five tabs displayed (All, Operations, Messages, Alerts, System) with counts
3. **AC-3:** Clicking a tab filters notifications to that category's types
4. **AC-4:** Unread-only toggle filters to only unread notifications
5. **AC-5:** Notification cards display icon, title, body preview, timestamp, and unread indicator
6. **AC-6:** Clicking a notification card marks it as read (optimistic update — unread dot disappears immediately)
7. **AC-7:** "Mark all read" button marks all notifications as read (optimistic update)
8. **AC-8:** "Load more" button fetches next page and appends results
9. **AC-9:** Empty state displays when no notifications match current filters
10. **AC-10:** Loading state shows skeleton cards while fetching
11. **AC-11:** Error state shows retry button when fetch fails
12. **AC-12:** `getMyNotifications` accepts optional `notificationTypes` array filter
13. **AC-13:** NotificationDrawer shows "View all notifications" link that navigates to `/manager/notifications`
14. **AC-14:** Tabs, cards, and toggle are keyboard-accessible with proper ARIA roles

## 14. Out of Scope

- Event trigger wiring (`createNotification` calls) — Phase 5
- Real-time push via Supabase Realtime — deferred
- Notification preferences/settings UI — deferred
- Guest portal notification page — guest uses drawer only
- Email notification delivery — Phase 5
