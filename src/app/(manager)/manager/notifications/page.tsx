"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Clock,
  CheckCheck,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getTimeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { NotificationType } from "@/types/domain";
import type { NotificationRow } from "@/app/actions/notifications";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "@/app/actions/notifications";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = "all" | "operations" | "messages" | "alerts" | "system";

const TAB_TYPE_MAP: Record<TabKey, NotificationType[]> = {
  all: [],
  operations: ["request_update", "new_request", "assignment"],
  messages: ["guest_message", "staff_message"],
  alerts: ["sla_breach"],
  system: ["other"],
};

const TAB_LABELS: Record<TabKey, string> = {
  all: "All",
  operations: "Operations",
  messages: "Messages",
  alerts: "Alerts",
  system: "System",
};

const TAB_ORDER: TabKey[] = ["all", "operations", "messages", "alerts", "system"];

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNotificationIcon(type: NotificationType | undefined) {
  switch (type) {
    case "guest_message":
    case "staff_message":
      return MessageSquare;
    case "sla_breach":
      return AlertTriangle;
    case "assignment":
      return UserCheck;
    case "new_request":
    case "request_update":
      return Clock;
    default:
      return Bell;
  }
}

// ---------------------------------------------------------------------------
// NotificationCard
// ---------------------------------------------------------------------------

interface NotificationCardProps {
  notification: NotificationRow;
  onMarkRead: (id: string) => void;
}

function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const router = useRouter();
  const Icon = getNotificationIcon(notification.notification_type);

  const handleClick = useCallback(() => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (notification.link_to) {
      router.push(notification.link_to);
    }
  }, [notification.id, notification.read, notification.link_to, onMarkRead, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${notification.read ? "" : "Unread: "}${notification.title}`}
      className={cn(
        "group flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors duration-150 rounded-xl",
        "hover:bg-white/5 outline-none",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9B7340]/50",
        !notification.read && "bg-white/[0.03]",
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white/10 mt-0.5">
        <Icon
          className={cn(
            "w-4.5 h-4.5",
            notification.notification_type === "sla_breach"
              ? "text-destructive"
              : "text-[#9B7340]",
          )}
          aria-hidden
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug text-white",
            !notification.read ? "font-semibold" : "font-normal",
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed text-white/55">
            {notification.body}
          </p>
        )}
        <p className="text-[11px] mt-1 text-white/35">
          {getTimeAgo(notification.created_at)}
        </p>
      </div>

      {/* Right side — action link + unread dot */}
      <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
        {notification.link_to && (
          <span className="text-xs text-[#9B7340] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            View
          </span>
        )}
        {!notification.read && (
          <div
            aria-label="Unread"
            className="w-2 h-2 rounded-full bg-[#9B7340]"
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function NotificationsSkeleton(): React.ReactElement {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-44 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-96 mb-6" />
      <div className="glass-card-dark rounded-2xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-white/[0.06]">
            <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0 bg-white/10" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4 rounded bg-white/10" />
              <Skeleton className="h-3 w-full rounded bg-white/[0.08]" />
              <Skeleton className="h-3 w-1/3 rounded bg-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

type PageState = "loading" | "loaded" | "error";

export default function ManagerNotificationsPage(): React.ReactElement {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [state, setState] = useState<PageState>("loading");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<TabKey, number>>({
    all: 0,
    operations: 0,
    messages: 0,
    alerts: 0,
    system: 0,
  });

  // -------------------------------------------------------------------------
  // Fetch notifications
  // -------------------------------------------------------------------------

  const fetchNotifications = useCallback(
    async (reset: boolean, tab: TabKey, showUnreadOnly: boolean) => {
      if (reset) {
        setState("loading");
        setPage(1);
      }

      const types = TAB_TYPE_MAP[tab];
      const targetPage = reset ? 1 : page;

      const result = await getMyNotifications({
        pageSize: PAGE_SIZE,
        page: targetPage,
        unreadOnly: showUnreadOnly,
        ...(types.length > 0 ? { notificationTypes: types } : {}),
      });

      if (!result.success || !result.data) {
        setState("error");
        return;
      }

      const { notifications: fetched, total: fetchedTotal, unreadCount: fetchedUnread } = result.data;

      if (reset) {
        setNotifications(fetched);
      } else {
        setNotifications((prev) => [...prev, ...fetched]);
      }

      setTotal(fetchedTotal);
      setUnreadCount(fetchedUnread);
      setHasMore(fetched.length === PAGE_SIZE);
      setState("loaded");
    },
    [page],
  );

  // -------------------------------------------------------------------------
  // Fetch tab counts on mount
  // -------------------------------------------------------------------------

  const fetchTabCounts = useCallback(async () => {
    const counts: Record<string, number> = {};

    // Fetch total for "All" tab
    const allResult = await getMyNotifications({ pageSize: 1, page: 1 });
    counts.all = allResult.success && allResult.data ? allResult.data.total : 0;

    // Fetch totals for each category tab in parallel
    const tabEntries = TAB_ORDER.filter((t) => t !== "all");
    const results = await Promise.all(
      tabEntries.map((tab) =>
        getMyNotifications({
          pageSize: 1,
          page: 1,
          notificationTypes: TAB_TYPE_MAP[tab],
        }),
      ),
    );

    tabEntries.forEach((tab, i) => {
      const r = results[i];
      counts[tab] = r.success && r.data ? r.data.total : 0;
    });

    setTabCounts(counts as Record<TabKey, number>);
  }, []);

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    void fetchNotifications(true, activeTab, unreadOnly);
    void fetchTabCounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Tab change
  // -------------------------------------------------------------------------

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = value as TabKey;
      setActiveTab(tab);
      setPage(1);
      void fetchNotifications(true, tab, unreadOnly);
    },
    [fetchNotifications, unreadOnly],
  );

  // -------------------------------------------------------------------------
  // Unread toggle
  // -------------------------------------------------------------------------

  const handleUnreadToggle = useCallback(() => {
    const next = !unreadOnly;
    setUnreadOnly(next);
    setPage(1);
    void fetchNotifications(true, activeTab, next);
  }, [unreadOnly, activeTab, fetchNotifications]);

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  // -------------------------------------------------------------------------
  // Mark as read (optimistic)
  // -------------------------------------------------------------------------

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const result = await markAsRead(id);
    if (!result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Mark all as read (optimistic)
  // -------------------------------------------------------------------------

  const handleMarkAllRead = useCallback(async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);

    const prevNotifications = notifications;
    const prevUnread = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    const result = await markAllAsRead();
    if (!result.success) {
      setNotifications(prevNotifications);
      setUnreadCount(prevUnread);
    } else {
      void fetchTabCounts();
    }

    setIsMarkingAll(false);
  }, [isMarkingAll, notifications, unreadCount, fetchTabCounts]);

  // -------------------------------------------------------------------------
  // Load more
  // -------------------------------------------------------------------------

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    setPage(nextPage);

    const types = TAB_TYPE_MAP[activeTab];
    const result = await getMyNotifications({
      pageSize: PAGE_SIZE,
      page: nextPage,
      unreadOnly,
      ...(types.length > 0 ? { notificationTypes: types } : {}),
    });

    if (result.success && result.data) {
      setNotifications((prev) => [...prev, ...result.data!.notifications]);
      setHasMore(result.data.notifications.length === PAGE_SIZE);
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, page, activeTab, unreadOnly]);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (state === "loading") {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <NotificationsSkeleton />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (state === "error") {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <PageHeader title="Notifications" />
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-base font-medium mb-2">Failed to load notifications</p>
              <p className="text-sm text-muted-foreground mb-6">
                Something went wrong. Please try again.
              </p>
              <Button
                onClick={() => void fetchNotifications(true, activeTab, unreadOnly)}
                className="gap-2 bg-[#9B7340] text-white hover:bg-[#b8924f]"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Empty tab message
  // -------------------------------------------------------------------------

  const emptyMessage =
    activeTab === "all"
      ? "You're all caught up!"
      : `No ${TAB_LABELS[activeTab].toLowerCase()} notifications`;

  const emptySubtext =
    activeTab === "all"
      ? "No new notifications right now."
      : `There are no ${TAB_LABELS[activeTab].toLowerCase()} notifications to display.`;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader
        notificationCount={unreadCount}
        onSignOut={() => void handleSignOut()}
      />
      <PageContainer>
        {/* Header with mark-all action */}
        <PageHeader
          title="Notifications"
          subtitle={`${total} notification${total !== 1 ? "s" : ""}${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
          action={
            unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleMarkAllRead()}
                disabled={isMarkingAll}
                aria-label="Mark all notifications as read"
                className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
              >
                <CheckCheck className="w-4 h-4" aria-hidden />
                Mark all read
              </Button>
            ) : undefined
          }
        />

        {/* Tabs + unread toggle row */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              {TAB_ORDER.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {TAB_LABELS[tab]}
                  {tabCounts[tab] > 0 && (
                    <span className="ml-1.5 text-[11px] opacity-60">
                      ({tabCounts[tab]})
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Unread only toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={handleUnreadToggle}
              className="w-3.5 h-3.5 rounded border-white/20 bg-white/10 text-[#9B7340] focus:ring-[#9B7340]/50"
            />
            <span className="text-xs text-white/50">Show unread only</span>
          </label>
        </div>

        {/* Notification list */}
        <div className="glass-card-dark rounded-2xl overflow-hidden">
          {notifications.length === 0 ? (
            /* Empty state */
            <div
              aria-live="polite"
              className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center"
            >
              <CheckCircle2
                className="w-10 h-10 text-white/25"
                aria-hidden
              />
              <p className="text-sm font-semibold text-white/60">
                {emptyMessage}
              </p>
              <p className="text-xs text-white/35">
                {emptySubtext}
              </p>
            </div>
          ) : (
            /* Loaded list */
            <div role="feed" aria-label="Notification list">
              {notifications.map((notification, i) => (
                <div
                  key={notification.id}
                  className={cn(
                    i < notifications.length - 1 && "border-b border-white/[0.06]",
                  )}
                >
                  <NotificationCard
                    notification={notification}
                    onMarkRead={(id) => void handleMarkRead(id)}
                  />
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="px-5 py-4 border-t border-white/[0.06]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleLoadMore()}
                    disabled={isLoadingMore}
                    className="w-full text-xs text-white/50 hover:text-white hover:bg-white/[0.08] gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer count */}
        {notifications.length > 0 && (
          <p className="text-[11px] text-center text-white/35 mt-4">
            Showing {notifications.length} of {total} notification{total !== 1 ? "s" : ""}
          </p>
        )}
      </PageContainer>
    </>
  );
}
