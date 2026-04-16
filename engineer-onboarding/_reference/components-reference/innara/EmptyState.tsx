import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Search,
  FileQuestion,
  Users,
  ShoppingBag,
  ClipboardList,
  LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  iconName?: "inbox" | "search" | "question" | "users" | "cart" | "clipboard";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "secondary" | "outline";
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconMap: Record<string, LucideIcon> = {
  inbox: Inbox,
  search: Search,
  question: FileQuestion,
  users: Users,
  cart: ShoppingBag,
  clipboard: ClipboardList,
};

export function EmptyState({
  icon: CustomIcon,
  iconName = "inbox",
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const Icon = CustomIcon || iconMap[iconName] || Inbox;

  const sizeClasses = {
    sm: {
      container: "py-6 px-4",
      icon: "w-10 h-10",
      iconWrapper: "w-16 h-16",
      title: "text-base",
      description: "text-sm",
    },
    md: {
      container: "py-12 px-6",
      icon: "w-12 h-12",
      iconWrapper: "w-20 h-20",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16 px-8",
      icon: "w-16 h-16",
      iconWrapper: "w-24 h-24",
      title: "text-xl",
      description: "text-base",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        classes.container,
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted/50 flex items-center justify-center mb-4",
          classes.iconWrapper
        )}
      >
        <Icon className={cn(classes.icon, "text-muted-foreground/60")} />
      </div>

      <h3
        className={cn(
          "font-semibold text-foreground mb-1",
          classes.title
        )}
      >
        {title}
      </h3>

      {description && (
        <p className={cn("text-muted-foreground max-w-sm", classes.description)}>
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function EmptyRequestsState({
  onCreateRequest,
}: {
  onCreateRequest?: () => void;
}) {
  return (
    <EmptyState
      iconName="clipboard"
      title="No requests yet"
      description="When you make a request, it will appear here."
      action={
        onCreateRequest
          ? {
              label: "Make a Request",
              onClick: onCreateRequest,
            }
          : undefined
      }
    />
  );
}

export function EmptySearchState({ query }: { query?: string }) {
  return (
    <EmptyState
      iconName="search"
      title="No results found"
      description={
        query
          ? `No results found for "${query}". Try adjusting your search.`
          : "No matching results. Try adjusting your filters."
      }
    />
  );
}

export function EmptyCartState({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      iconName="cart"
      title="Your cart is empty"
      description="Browse our menu and add items to your cart."
      action={
        onBrowse
          ? {
              label: "Browse Menu",
              onClick: onBrowse,
              variant: "default",
            }
          : undefined
      }
    />
  );
}

export default EmptyState;
