"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Clock,
  X,
  CheckCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { cn, getTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationType } from "@/types/domain";
import type { NotificationRow } from "@/app/actions/notifications";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/app/actions/notifications";

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
// NotificationDrawerItem
// ---------------------------------------------------------------------------

interface NotificationDrawerItemProps {
  notification: NotificationRow;
  variant: "light" | "dark";
  onMarkRead: (id: string) => void;
}

function NotificationDrawerItem({
  notification,
  variant,
  onMarkRead,
}: NotificationDrawerItemProps) {
  const router = useRouter();
  const Icon = getNotificationIcon(notification.notification_type);
  const isDark = variant === "dark";

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
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${notification.read ? "" : "Unread: "}${notification.title}`}
      className={cn(
        "group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150 min-h-[44px] outline-none",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9B7340]/50",
        isDark
          ? "hover:bg-white/5 border-b border-white/[0.08]"
          : "hover:bg-black/[0.04] border-b border-black/[0.06]",
        !notification.read && (isDark ? "bg-white/[0.03]" : "bg-[#9B7340]/[0.05]"),
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5",
          isDark ? "bg-white/10" : "bg-black/[0.06]",
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
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
            "text-sm leading-snug",
            isDark ? "text-white" : "text-[#1a1d3a]",
            !notification.read ? "font-semibold" : "font-normal",
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p
            className={cn(
              "text-xs mt-0.5 line-clamp-2 leading-relaxed",
              isDark ? "text-white/55" : "text-black/50",
            )}
          >
            {notification.body}
          </p>
        )}
        <p
          className={cn(
            "text-[11px] mt-1",
            isDark ? "text-white/35" : "text-black/35",
          )}
        >
          {getTimeAgo(notification.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div
          aria-label="Unread"
          className="flex-shrink-0 w-2 h-2 rounded-full bg-[#9B7340] mt-2"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader items
// ---------------------------------------------------------------------------

function NotificationSkeletonItem({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <Skeleton
        className={cn("w-8 h-8 rounded-lg flex-shrink-0", isDark && "bg-white/10")}
      />
      <div className="flex-1 space-y-1.5">
        <Skeleton className={cn("h-3.5 w-3/4 rounded", isDark && "bg-white/10")} />
        <Skeleton className={cn("h-3 w-full rounded", isDark && "bg-white/[0.08]")} />
        <Skeleton className={cn("h-3 w-1/2 rounded", isDark && "bg-white/[0.08]")} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationDrawer
// ---------------------------------------------------------------------------

export interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "light" | "dark";
}

type DrawerState = "loading" | "loaded" | "error" | "empty";

const PAGE_SIZE = 20;

export function NotificationDrawer({
  open,
  onOpenChange,
  variant,
}: NotificationDrawerProps) {
  const isDark = variant === "dark";

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [state, setState] = useState<DrawerState>("loading");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ---------------------------------------------------------------------------
  // Fetch initial notifications when drawer opens
  // ---------------------------------------------------------------------------
  const fetchNotifications = useCallback(async (reset: boolean) => {
    if (reset) {
      setState("loading");
      setPage(1);
    }

    const targetPage = reset ? 1 : page;
    const result = await getMyNotifications({ pageSize: PAGE_SIZE, page: targetPage });

    if (!result.success || !result.data) {
      setState("error");
      return;
    }

    const { notifications: fetched, unreadCount: freshCount } = result.data;

    if (reset) {
      setNotifications(fetched);
    } else {
      setNotifications((prev) => [...prev, ...fetched]);
    }

    setHasMore(fetched.length === PAGE_SIZE);
    setUnreadCount(freshCount);
    setState(fetched.length === 0 && reset ? "empty" : "loaded");
  }, [page]);

  useEffect(() => {
    if (open) {
      void fetchNotifications(true);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Focus close button when drawer opens
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ---------------------------------------------------------------------------
  // Close on Escape
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // ---------------------------------------------------------------------------
  // Body scroll lock while drawer is open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ---------------------------------------------------------------------------
  // Optimistic mark-as-read
  // ---------------------------------------------------------------------------
  const handleMarkRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const result = await markAsRead(id);

    if (!result.success) {
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Optimistic mark-all-read
  // ---------------------------------------------------------------------------
  const handleMarkAllRead = useCallback(async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);

    const previousNotifications = notifications;
    const previousCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    const result = await markAllAsRead();

    if (!result.success) {
      // Rollback
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
    }

    setIsMarkingAll(false);
  }, [isMarkingAll, notifications, unreadCount]);

  // ---------------------------------------------------------------------------
  // Load more
  // ---------------------------------------------------------------------------
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    const nextPage = page + 1;
    setPage(nextPage);

    const result = await getMyNotifications({ pageSize: PAGE_SIZE, page: nextPage });

    if (result.success && result.data) {
      const { notifications: more } = result.data;
      setNotifications((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, page]);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------
  const drawerBg = isDark
    ? "bg-[#1a1d3a] border-white/10"
    : "bg-white/95 backdrop-blur-xl border-black/[0.08]";

  const headerBorderClass = isDark ? "border-white/10" : "border-black/[0.08]";
  const titleColor = isDark ? "text-white" : "text-[#1a1d3a]";
  const subtitleColor = isDark ? "text-white/50" : "text-black/40";
  const ghostClass = isDark
    ? "text-white/60 hover:text-white hover:bg-white/10"
    : "text-black/50 hover:text-[#1a1d3a] hover:bg-black/[0.06]";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-sm border-l shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          drawerBg,
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-5 py-4 border-b flex-shrink-0",
            headerBorderClass,
          )}
        >
          <div className="flex items-center gap-2.5">
            <h2 className={cn("text-base font-semibold", titleColor)}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} unread`}
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#9B7340] text-white text-[11px] font-bold leading-none"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Mark all read */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleMarkAllRead()}
                disabled={isMarkingAll}
                aria-label="Mark all notifications as read"
                className={cn("text-xs gap-1.5 h-7 px-2.5", ghostClass)}
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}

            {/* Close */}
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close notifications"
              className={cn("w-8 h-8", ghostClass)}
            >
              <X className="w-4 h-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto" role="feed" aria-label="Notification list">
          {/* Loading state */}
          {state === "loading" && (
            <div aria-label="Loading notifications" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <NotificationSkeletonItem key={i} isDark={isDark} />
              ))}
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center"
            >
              <AlertTriangle
                className={cn("w-8 h-8", isDark ? "text-white/30" : "text-black/25")}
                aria-hidden
              />
              <p className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-black/50")}>
                Failed to load notifications
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchNotifications(true)}
                className={cn(
                  "gap-2",
                  isDark
                    ? "border-white/20 text-white/70 hover:bg-white/10"
                    : "border-black/15 text-black/60",
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden />
                Try again
              </Button>
            </div>
          )}

          {/* Empty state */}
          {state === "empty" && (
            <div
              aria-live="polite"
              className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center"
            >
              <CheckCircle2
                className={cn("w-10 h-10", isDark ? "text-white/25" : "text-black/20")}
                aria-hidden
              />
              <p className={cn("text-sm font-semibold", isDark ? "text-white/60" : "text-black/50")}>
                You&apos;re all caught up!
              </p>
              <p className={cn("text-xs", isDark ? "text-white/35" : "text-black/35")}>
                No new notifications right now.
              </p>
            </div>
          )}

          {/* Loaded state */}
          {state === "loaded" && (
            <>
              <div aria-live="polite" aria-atomic="false">
                {notifications.map((notification) => (
                  <NotificationDrawerItem
                    key={notification.id}
                    notification={notification}
                    variant={variant}
                    onMarkRead={(id) => void handleMarkRead(id)}
                  />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleLoadMore()}
                    disabled={isLoadingMore}
                    className={cn(
                      "w-full text-xs",
                      isDark
                        ? "text-white/50 hover:text-white hover:bg-white/[0.08]"
                        : "text-black/45 hover:text-[#1a1d3a] hover:bg-black/[0.05]",
                    )}
                  >
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — count + view all link when content is loaded */}
        {state === "loaded" && (
          <div className={cn("flex-shrink-0 px-5 py-3 border-t", headerBorderClass)}>
            <p className={cn("text-[11px] text-center", subtitleColor)}>
              Showing {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </p>
            {isDark && (
              <Link
                href="/manager/notifications"
                onClick={() => onOpenChange(false)}
                className={cn(
                  "block text-center text-xs font-medium mt-2 transition-colors",
                  "text-[#9B7340] hover:text-[#b8924f]",
                )}
              >
                View all notifications
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
