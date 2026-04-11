"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Check,
  Users,
  Building2,
  Loader2,
  XCircle,
} from "lucide-react";
import { AdminHeader } from "@/components/innara/AdminHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { getPlans, type PlanTier } from "@/app/actions/admin-plans";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Plan card
// ---------------------------------------------------------------------------

const PLAN_ACCENTS: Record<string, { border: string; icon: string; bg: string }> = {
  starter: {
    border: "border-blue-500/20",
    icon: "text-blue-400",
    bg: "bg-blue-500/5",
  },
  pro: {
    border: "border-[#9B7340]/30",
    icon: "text-[#9B7340]",
    bg: "bg-[#9B7340]/5",
  },
  enterprise: {
    border: "border-purple-500/20",
    icon: "text-purple-400",
    bg: "bg-purple-500/5",
  },
};

function PlanCard({ plan }: { plan: PlanTier }): React.ReactElement {
  const accent = PLAN_ACCENTS[plan.name] ?? PLAN_ACCENTS.starter;

  return (
    <div
      className={cn(
        "glass-card-dark rounded-2xl p-6 border",
        accent.border,
        plan.name === "pro" && "ring-1 ring-[#9B7340]/30",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground font-serif">
            {plan.displayName}
          </h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-foreground font-serif">
              ${plan.monthlyPrice}
            </span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            accent.bg,
          )}
        >
          <CreditCard className={cn("w-5 h-5", accent.icon)} />
        </div>
      </div>

      {/* Limits */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/20">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">
            {plan.maxRooms ? `${plan.maxRooms} rooms` : "Unlimited rooms"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">
            {plan.maxStaff ? `${plan.maxStaff} staff` : "Unlimited staff"}
          </span>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", accent.icon)}
            />
            <span className="text-xs text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Hotel count */}
      <div className="pt-4 border-t border-border/20">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">
            Active hotels
          </span>
          <span className="text-sm font-semibold text-foreground">
            {plan.hotelCount}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPlansPage(): React.ReactElement {
  const [plans, setPlans] = useState<PlanTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getPlans();
    if (result.success && result.data) {
      setPlans(result.data);
    } else {
      setError(result.error ?? "Failed to load plans.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <AdminHeader />
      <PageContainer>
        <PageHeader
          title="Plan Management"
          subtitle="Configure and manage subscription plan tiers"
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#9B7340]" />
          </div>
        ) : error ? (
          <div className="glass-card-dark p-8 rounded-2xl text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
