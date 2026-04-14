"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  CreditCard,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { EmptyState } from "@/components/innara/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  getSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  type SubscriptionData,
} from "@/app/actions/billing";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: 49,
    features: [
      "Up to 50 rooms",
      "Basic analytics",
      "Email support",
      "1 staff account",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 149,
    features: [
      "Up to 200 rooms",
      "Advanced analytics",
      "Priority support",
      "Unlimited staff",
      "AI concierge",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 499,
    features: [
      "Unlimited rooms",
      "Custom analytics",
      "Dedicated support",
      "Unlimited staff",
      "AI concierge",
      "API access",
      "Custom branding",
    ],
  },
] as const;

type PlanKey = (typeof PLANS)[number]["key"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function planIndex(plan: PlanKey): number {
  return PLANS.findIndex((p) => p.key === plan);
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

interface SubscriptionStatusBadgeProps {
  status: SubscriptionData["status"];
}

function SubscriptionStatusBadge({
  status,
}: SubscriptionStatusBadgeProps): React.ReactElement {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          Active
        </Badge>
      );
    case "trialing":
      return (
        <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/20">
          Trialing
        </Badge>
      );
    case "past_due":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20">
          Past Due
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-muted/50 text-muted-foreground border border-border/30">
          Cancelled
        </Badge>
      );
    case "unpaid":
      return (
        <Badge className="bg-destructive/10 text-destructive border border-destructive/20">
          Unpaid
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// CurrentPlanCard
// ---------------------------------------------------------------------------

interface CurrentPlanCardProps {
  subscription: SubscriptionData;
  onManageBilling: () => void;
  onCancel: () => void;
  billingPortalLoading: boolean;
}

function CurrentPlanCard({
  subscription,
  onManageBilling,
  onCancel,
  billingPortalLoading,
}: CurrentPlanCardProps): React.ReactElement {
  const currentPlan = PLANS.find((p) => p.key === subscription.plan);

  return (
    <section
      aria-labelledby="current-plan-heading"
      className="glass-card-dark relative rounded-2xl p-6"
    >
      <BorderBeam size={200} duration={14} />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Plan info */}
        <div className="flex flex-col gap-3">
          <h2
            id="current-plan-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Current Plan
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-bold">
              {currentPlan?.name ?? subscription.plan}
            </span>
            <SubscriptionStatusBadge status={subscription.status} />
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {currentPlan && (
              <span>
                <span className="text-foreground font-semibold text-base">
                  ${currentPlan.price}
                </span>
                <span className="text-muted-foreground">/month</span>
              </span>
            )}

            {subscription.roomCount !== null && (
              <span>
                {subscription.roomCount}{" "}
                {subscription.roomCount === 1 ? "room" : "rooms"} provisioned
              </span>
            )}

            {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
              <span>
                Billing period:{" "}
                {formatDate(subscription.currentPeriodStart)} —{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            )}
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-amber-400 mt-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Cancels on {formatDate(subscription.currentPeriodEnd)}. You
                retain access until then.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:items-end shrink-0">
          <Button
            variant="outline"
            onClick={onManageBilling}
            disabled={billingPortalLoading}
            className="gap-2 min-w-[160px]"
          >
            {billingPortalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Manage Billing
          </Button>

          {!subscription.cancelAtPeriodEnd &&
            subscription.status !== "cancelled" &&
            subscription.status !== "unpaid" && (
              <button
                onClick={onCancel}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors text-right"
              >
                Cancel subscription
              </button>
            )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PlanCard
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: (typeof PLANS)[number];
  currentPlan: PlanKey | null;
  onSelect: (key: PlanKey) => void;
  upgradeLoading: PlanKey | null;
}

function PlanCard({
  plan,
  currentPlan,
  onSelect,
  upgradeLoading,
}: PlanCardProps): React.ReactElement {
  const isCurrent = currentPlan === plan.key;
  const isLoading = upgradeLoading === plan.key;
  const isUpgrade =
    currentPlan !== null && planIndex(plan.key) > planIndex(currentPlan);
  const isDowngrade =
    currentPlan !== null && planIndex(plan.key) < planIndex(currentPlan);

  let actionLabel = "Select plan";
  if (isCurrent) {
    actionLabel = "Current plan";
  } else if (isUpgrade) {
    actionLabel = "Upgrade";
  } else if (isDowngrade) {
    actionLabel = "Downgrade";
  }

  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col gap-4 transition-colors ${
        isCurrent
          ? "border-[#9B7340] bg-[#9B7340]/5"
          : "border-border/30 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      {isCurrent && (
        <span className="absolute top-4 right-4 text-xs font-semibold text-[#9B7340] uppercase tracking-wider">
          Current
        </span>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{plan.name}</h3>
        <div>
          <span className="text-3xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2 flex-1" role="list">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-[#9B7340] mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isCurrent ? "outline" : "default"}
        disabled={isCurrent || isLoading || upgradeLoading !== null}
        onClick={() => !isCurrent && onSelect(plan.key)}
        className={`w-full mt-auto gap-2 ${
          !isCurrent && !upgradeLoading
            ? "bg-[#9B7340] hover:bg-[#b8924f] text-white border-0"
            : ""
        }`}
        aria-label={`${actionLabel} — ${plan.name} at $${plan.price}/month`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          actionLabel
        )}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerBillingPage(): React.ReactElement {
  const router = useRouter();

  // Auth display
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userInitials, setUserInitials] = useState<string | undefined>(
    undefined
  );

  // Data
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const [upgradeLoading, setUpgradeLoading] = useState<PlanKey | null>(null);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/manager/login");
        return;
      }
      const meta = data.user.user_metadata as
        | Record<string, string>
        | undefined;
      const name = meta?.full_name ?? data.user.email ?? "";
      setUserName(name);
      const parts = name.trim().split(" ");
      setUserInitials(
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase()
      );
    });
  }, [router]);

  // ---------------------------------------------------------------------------
  // Load subscription
  // ---------------------------------------------------------------------------

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getSubscription();
    if (!result.success) {
      setError(result.error ?? "Failed to load subscription.");
      setLoading(false);
      return;
    }
    setSubscription(result.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/manager/login");
  }, [router]);

  // ---------------------------------------------------------------------------
  // Upgrade / Downgrade → Stripe Checkout
  // ---------------------------------------------------------------------------

  const handlePlanSelect = useCallback(
    async (plan: PlanKey) => {
      setUpgradeLoading(plan);
      const result = await createCheckoutSession(plan);
      setUpgradeLoading(null);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Failed to start checkout.");
        return;
      }
      window.location.href = result.data.url;
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Manage billing → Stripe Portal
  // ---------------------------------------------------------------------------

  const handleManageBilling = useCallback(async () => {
    setBillingPortalLoading(true);
    const result = await createBillingPortalSession();
    setBillingPortalLoading(false);
    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to open billing portal.");
      return;
    }
    window.location.href = result.data.url;
  }, []);

  // ---------------------------------------------------------------------------
  // Cancel subscription
  // ---------------------------------------------------------------------------

  const handleCancel = useCallback(async () => {
    setCancelLoading(true);
    const result = await cancelSubscription();
    setCancelLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to cancel subscription.");
      setCancelOpen(false);
      return;
    }
    toast.success("Subscription will cancel at the end of the billing period.");
    setCancelOpen(false);
    // Optimistic update
    setSubscription((prev) =>
      prev ? { ...prev, cancelAtPeriodEnd: true } : prev
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader
          userName={userName}
          userInitials={userInitials}
          onSignOut={() => void handleSignOut()}
        />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#9B7340]" />
            <p className="text-sm text-muted-foreground">
              Loading billing info…
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <>
        <ManagerHeader
          userName={userName}
          userInitials={userInitials}
          onSignOut={() => void handleSignOut()}
        />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <p className="text-base font-medium mb-2">
                Unable to load billing
              </p>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => void loadSubscription()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9B7340] text-white text-sm font-medium hover:bg-[#b8924f] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state — no subscription yet
  // ---------------------------------------------------------------------------

  if (!subscription) {
    return (
      <>
        <ManagerHeader
          userName={userName}
          userInitials={userInitials}
          onSignOut={() => void handleSignOut()}
        />
        <PageContainer>
          <PageHeader
            title="Billing"
            subtitle="Manage your subscription and payment details"
            action={
              <button
                onClick={() => void loadSubscription()}
                aria-label="Refresh billing"
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            }
          />

          <div className="glass-card-dark rounded-2xl mb-6">
            <EmptyState
              icon={CreditCard}
              title="No active subscription"
              description="Choose a plan below to get started with Innara."
              size="md"
            />
          </div>

          {/* Plan selector — no current plan */}
          <section aria-labelledby="plans-heading">
            <h2
              id="plans-heading"
              className="text-base font-semibold mb-4"
            >
              Choose a Plan
            </h2>
            <AnimatedGroup preset="slide" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  currentPlan={null}
                  onSelect={handlePlanSelect}
                  upgradeLoading={upgradeLoading}
                />
              ))}
            </AnimatedGroup>
          </section>
        </PageContainer>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render — active subscription
  // ---------------------------------------------------------------------------

  const currentPlanKey = subscription.plan;

  return (
    <>
      <ManagerHeader
        userName={userName}
        userInitials={userInitials}
        onSignOut={() => void handleSignOut()}
      />

      <PageContainer>
        <PageHeader
          title="Billing"
          subtitle="Manage your subscription and payment details"
          action={
            <button
              onClick={() => void loadSubscription()}
              aria-label="Refresh billing"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Current plan card                                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="mb-8">
          <CurrentPlanCard
            subscription={subscription}
            onManageBilling={() => void handleManageBilling()}
            onCancel={() => setCancelOpen(true)}
            billingPortalLoading={billingPortalLoading}
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Plan selector                                                        */}
        {/* ------------------------------------------------------------------ */}
        <section aria-labelledby="change-plan-heading">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-4 h-4 text-[#9B7340]" />
            <h2 id="change-plan-heading" className="text-base font-semibold">
              Change Plan
            </h2>
          </div>

          <AnimatedGroup preset="slide" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                currentPlan={currentPlanKey}
                onSelect={handlePlanSelect}
                upgradeLoading={upgradeLoading}
              />
            ))}
          </AnimatedGroup>
        </section>
      </PageContainer>

      {/* -------------------------------------------------------------------- */}
      {/* Cancel confirmation AlertDialog                                        */}
      {/* -------------------------------------------------------------------- */}
      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open) setCancelOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until{" "}
              <strong>{formatDate(subscription.currentPeriodEnd)}</strong>. After
              that, you will lose access to all manager and staff features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setCancelOpen(false)}
              disabled={cancelLoading}
            >
              Keep subscription
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
