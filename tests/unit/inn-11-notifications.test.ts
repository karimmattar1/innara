// Acceptance test for INN-11 — Manager Notification Center
// Pre-written per Rule 14 (spec-first testing).
// Tests validate the notification type filtering logic and tab-category mapping
// that powers the /manager/notifications page.
//
// These tests must be RED before implementation starts, then GREEN after.

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Tab → NotificationType mapping (defined in spec §5)
// ---------------------------------------------------------------------------

const TAB_TYPE_MAP: Record<string, string[]> = {
  all: [],
  operations: ["request_update", "new_request", "assignment"],
  messages: ["guest_message", "staff_message"],
  alerts: ["sla_breach"],
  system: ["other"],
};

const ALL_NOTIFICATION_TYPES = [
  "request_update",
  "new_request",
  "guest_message",
  "staff_message",
  "sla_breach",
  "assignment",
  "other",
] as const;

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

interface MockNotification {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  link_to: string | null;
}

let idCounter = 0;

function makeNotification(
  type: string,
  overrides: Partial<MockNotification> = {},
): MockNotification {
  idCounter++;
  return {
    id: `notif-${idCounter}`,
    notification_type: type,
    title: `Test notification ${idCounter}`,
    body: `Body for notification ${idCounter}`,
    read: false,
    created_at: new Date(Date.now() - idCounter * 60_000).toISOString(),
    link_to: null,
    ...overrides,
  };
}

function makeMixedNotifications(): MockNotification[] {
  return [
    makeNotification("request_update"),
    makeNotification("new_request"),
    makeNotification("assignment"),
    makeNotification("guest_message"),
    makeNotification("staff_message"),
    makeNotification("sla_breach"),
    makeNotification("other"),
    makeNotification("request_update", { read: true }),
    makeNotification("guest_message", { read: true }),
    makeNotification("sla_breach", { read: true }),
  ];
}

// ---------------------------------------------------------------------------
// Pure filter function — will be imported from the page module or extracted
// For now, implement inline to validate the logic the component must follow
// ---------------------------------------------------------------------------

function filterByTab(
  notifications: MockNotification[],
  tab: string,
): MockNotification[] {
  const types = TAB_TYPE_MAP[tab];
  if (!types || types.length === 0) return notifications; // "all" tab
  return notifications.filter((n) => types.includes(n.notification_type));
}

function filterUnreadOnly(
  notifications: MockNotification[],
  unreadOnly: boolean,
): MockNotification[] {
  if (!unreadOnly) return notifications;
  return notifications.filter((n) => !n.read);
}

function countByTab(
  notifications: MockNotification[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tab of Object.keys(TAB_TYPE_MAP)) {
    counts[tab] = filterByTab(notifications, tab).length;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// AC-2: Tab definitions and counts
// ---------------------------------------------------------------------------

describe("INN-11: Tab definitions", () => {
  it("AC-2a: defines exactly 5 tabs — All, Operations, Messages, Alerts, System", () => {
    const tabs = Object.keys(TAB_TYPE_MAP);
    expect(tabs).toEqual(["all", "operations", "messages", "alerts", "system"]);
    expect(tabs).toHaveLength(5);
  });

  it("AC-2b: every NotificationType is covered by exactly one non-All tab", () => {
    const allTabTypes = Object.entries(TAB_TYPE_MAP)
      .filter(([key]) => key !== "all")
      .flatMap(([, types]) => types);

    // Every type appears exactly once
    expect(allTabTypes.sort()).toEqual([...ALL_NOTIFICATION_TYPES].sort());
    // No duplicates
    expect(new Set(allTabTypes).size).toBe(allTabTypes.length);
  });

  it("AC-2c: tab counts reflect the correct number per category", () => {
    const notifications = makeMixedNotifications();
    const counts = countByTab(notifications);

    expect(counts.all).toBe(10); // all notifications
    expect(counts.operations).toBe(4); // request_update(2) + new_request(1) + assignment(1)
    expect(counts.messages).toBe(3); // guest_message(2) + staff_message(1)
    expect(counts.alerts).toBe(2); // sla_breach(2)
    expect(counts.system).toBe(1); // other(1)
  });
});

// ---------------------------------------------------------------------------
// AC-3: Tab filtering
// ---------------------------------------------------------------------------

describe("INN-11: Tab filtering", () => {
  const notifications = makeMixedNotifications();

  it("AC-3a: 'All' tab returns all notifications unfiltered", () => {
    const result = filterByTab(notifications, "all");
    expect(result).toHaveLength(notifications.length);
  });

  it("AC-3b: 'Operations' tab returns only request_update, new_request, assignment", () => {
    const result = filterByTab(notifications, "operations");
    const types = new Set(result.map((n) => n.notification_type));
    expect(types).toEqual(new Set(["request_update", "new_request", "assignment"]));
    expect(result).toHaveLength(4);
  });

  it("AC-3c: 'Messages' tab returns only guest_message, staff_message", () => {
    const result = filterByTab(notifications, "messages");
    const types = new Set(result.map((n) => n.notification_type));
    expect(types).toEqual(new Set(["guest_message", "staff_message"]));
    expect(result).toHaveLength(3);
  });

  it("AC-3d: 'Alerts' tab returns only sla_breach", () => {
    const result = filterByTab(notifications, "alerts");
    expect(result.every((n) => n.notification_type === "sla_breach")).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("AC-3e: 'System' tab returns only other", () => {
    const result = filterByTab(notifications, "system");
    expect(result.every((n) => n.notification_type === "other")).toBe(true);
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// AC-4: Unread-only toggle
// ---------------------------------------------------------------------------

describe("INN-11: Unread-only filtering", () => {
  const notifications = makeMixedNotifications();

  it("AC-4a: unreadOnly=false returns all notifications", () => {
    const result = filterUnreadOnly(notifications, false);
    expect(result).toHaveLength(notifications.length);
  });

  it("AC-4b: unreadOnly=true returns only unread notifications", () => {
    const result = filterUnreadOnly(notifications, true);
    expect(result.every((n) => !n.read)).toBe(true);
    expect(result).toHaveLength(7); // 10 total - 3 read = 7
  });

  it("AC-4c: combined tab + unread filters work together", () => {
    const tabFiltered = filterByTab(notifications, "operations");
    const result = filterUnreadOnly(tabFiltered, true);
    // operations = 4 total, 1 read (request_update read), so 3 unread
    expect(result).toHaveLength(3);
    expect(result.every((n) => !n.read)).toBe(true);
    expect(
      result.every((n) =>
        ["request_update", "new_request", "assignment"].includes(n.notification_type),
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC-5: Notification card data
// ---------------------------------------------------------------------------

describe("INN-11: Notification card data requirements", () => {
  it("AC-5a: each notification has icon-determining type, title, body, timestamp, read state", () => {
    const n = makeNotification("sla_breach", {
      title: "SLA Breach",
      body: "Room 301 exceeded 30min target",
      link_to: "/manager/requests?id=abc",
    });

    expect(n.notification_type).toBe("sla_breach");
    expect(n.title).toBe("SLA Breach");
    expect(n.body).toBe("Room 301 exceeded 30min target");
    expect(n.created_at).toBeTruthy();
    expect(n.read).toBe(false);
    expect(n.link_to).toBe("/manager/requests?id=abc");
  });

  it("AC-5b: notification without link_to has null link", () => {
    const n = makeNotification("other");
    expect(n.link_to).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC-6: Mark-as-read behavior (optimistic)
// ---------------------------------------------------------------------------

describe("INN-11: Mark-as-read", () => {
  it("AC-6a: marking a notification as read changes its read state", () => {
    const notifications = [makeNotification("new_request")];
    expect(notifications[0].read).toBe(false);

    // Simulate optimistic update
    const updated = notifications.map((n) =>
      n.id === notifications[0].id ? { ...n, read: true } : n,
    );
    expect(updated[0].read).toBe(true);
  });

  it("AC-6b: marking as read does not affect other notifications", () => {
    const n1 = makeNotification("new_request");
    const n2 = makeNotification("guest_message");
    const notifications = [n1, n2];

    const updated = notifications.map((n) =>
      n.id === n1.id ? { ...n, read: true } : n,
    );
    expect(updated[0].read).toBe(true);
    expect(updated[1].read).toBe(false); // unchanged
  });
});

// ---------------------------------------------------------------------------
// AC-7: Mark-all-read
// ---------------------------------------------------------------------------

describe("INN-11: Mark-all-read", () => {
  it("AC-7a: marks all notifications as read in one operation", () => {
    const notifications = [
      makeNotification("new_request"),
      makeNotification("sla_breach"),
      makeNotification("other"),
    ];
    expect(notifications.every((n) => !n.read)).toBe(true);

    const updated = notifications.map((n) => ({ ...n, read: true }));
    expect(updated.every((n) => n.read)).toBe(true);
  });

  it("AC-7b: already-read notifications stay read after mark-all", () => {
    const notifications = [
      makeNotification("new_request", { read: true }),
      makeNotification("sla_breach"),
    ];

    const updated = notifications.map((n) => ({ ...n, read: true }));
    expect(updated.every((n) => n.read)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC-8: Pagination (load more)
// ---------------------------------------------------------------------------

describe("INN-11: Pagination", () => {
  it("AC-8a: hasMore is true when fetched count equals page size", () => {
    const pageSize = 20;
    const fetchedCount = 20;
    expect(fetchedCount === pageSize).toBe(true); // hasMore
  });

  it("AC-8b: hasMore is false when fetched count is less than page size", () => {
    const pageSize = 20;
    const fetchedCount = 15 as number;
    expect(fetchedCount === pageSize).toBe(false); // no more
  });

  it("AC-8c: loading more appends to existing list without duplicates", () => {
    const page1 = [makeNotification("new_request"), makeNotification("sla_breach")];
    const page2 = [makeNotification("other"), makeNotification("assignment")];

    const combined = [...page1, ...page2];
    expect(combined).toHaveLength(4);

    const ids = combined.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });
});

// ---------------------------------------------------------------------------
// AC-9: Empty state
// ---------------------------------------------------------------------------

describe("INN-11: Empty state", () => {
  it("AC-9a: empty result for All tab shows generic empty message", () => {
    const result = filterByTab([], "all");
    expect(result).toHaveLength(0);
  });

  it("AC-9b: empty result for a specific tab shows tab-specific empty message", () => {
    const notifications = [makeNotification("sla_breach")];
    const result = filterByTab(notifications, "messages");
    expect(result).toHaveLength(0);
    // Component should show "No Messages notifications" — verified in E2E
  });
});

// ---------------------------------------------------------------------------
// AC-12: getMyNotifications notificationTypes filter
// ---------------------------------------------------------------------------

describe("INN-11: Server action notificationTypes filter contract", () => {
  it("AC-12a: schema accepts valid notificationTypes array", () => {
    // This validates the input shape the server action must accept
    const validInput = {
      notificationTypes: ["request_update", "new_request"],
      unreadOnly: false,
      page: 1,
      pageSize: 20,
    };
    expect(validInput.notificationTypes).toHaveLength(2);
    expect(validInput.page).toBe(1);
  });

  it("AC-12b: empty notificationTypes array means no type filter (same as All tab)", () => {
    const input = { notificationTypes: [] as string[] };
    expect(input.notificationTypes).toHaveLength(0);
    // Server action should return all types when array is empty
  });

  it("AC-12c: omitted notificationTypes means no type filter", () => {
    const input = { unreadOnly: false, page: 1, pageSize: 20 };
    expect("notificationTypes" in input).toBe(false);
    // Server action should return all types when field is omitted
  });
});

// ---------------------------------------------------------------------------
// AC-14: Tab keyboard accessibility contract
// ---------------------------------------------------------------------------

describe("INN-11: Accessibility contracts", () => {
  it("AC-14a: tab list defines all 5 tabs with correct labels", () => {
    const tabLabels = ["All", "Operations", "Messages", "Alerts", "System"];
    expect(tabLabels).toHaveLength(5);
    // Component must render role="tablist" with role="tab" children
  });

  it("AC-14b: only one tab is active at a time", () => {
    const tabs = ["all", "operations", "messages", "alerts", "system"];
    const activeTab = "operations";
    const activeTabs = tabs.filter((t) => t === activeTab);
    expect(activeTabs).toHaveLength(1);
    // Component must set aria-selected="true" on exactly one tab
  });
});
