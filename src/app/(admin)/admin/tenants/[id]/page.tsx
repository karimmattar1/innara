"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  MapPin,
  Users,
  UserCheck,
  Calendar,
  CreditCard,
  Activity,
  Power,
  PowerOff,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { AdminHeader } from "@/components/innara/AdminHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import {
  getAdminTenantDetail,
  deactivateHotel,
  activateHotel,
  type TenantDetail,
} from "@/app/actions/admin-tenants";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SUB_STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/10",
  trialing: "text-blue-400 bg-blue-500/10",
  past_due: "text-amber-400 bg-amber-500/10",
  cancelled: "text-red-400 bg-red-500/10",
  unpaid: "text-red-400 bg-red-500/10",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminTenantDetailPage(): React.ReactElement {
  const params = useParams();
  const hotelId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAdminTenantDetail(hotelId);
    if (result.success && result.data) {
      setTenant(result.data);
    } else {
      setError(result.error ?? "Failed to load hotel.");
    }
    setLoading(false);
  }, [hotelId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function handleToggleStatus(): Promise<void> {
    if (!tenant) return;
    setActionPending(true);
    const result = tenant.isActive
      ? await deactivateHotel(hotelId)
      : await activateHotel(hotelId);

    if (result.success) {
      setConfirmDeactivate(false);
      await loadDetail();
    } else {
      setError(result.error ?? "Action failed.");
    }
    setActionPending(false);
  }

  if (loading) {
    return (
      <>
        <AdminHeader />
        <PageContainer>
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#9B7340]" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !tenant) {
    return (
      <>
        <AdminHeader />
        <PageContainer>
          <PageHeader title="Tenant Detail" backTo="/admin/tenants" />
          <div className="glass-card-dark p-8 rounded-2xl text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">{error ?? "Hotel not found."}</p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <PageContainer>
        <PageHeader
          title={tenant.name}
          subtitle={tenant.slug}
          backTo="/admin/tenants"
          action={
            tenant.isActive ? (
              confirmDeactivate ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 mr-1">
                    This will block all staff access.
                  </span>
                  <button
                    onClick={handleToggleStatus}
                    disabled={actionPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {actionPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <PowerOff className="w-3 h-3" />
                    )}
                    Confirm Deactivate
                  </button>
                  <button
                    onClick={() => setConfirmDeactivate(false)}
                    className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeactivate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <PowerOff className="w-3 h-3" />
                  Deactivate
                </button>
              )
            ) : (
              <button
                onClick={handleToggleStatus}
                disabled={actionPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {actionPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Power className="w-3 h-3" />
                )}
                Activate
              </button>
            )
          }
        />

        {/* Status banner for inactive hotels */}
        {!tenant.isActive && (
          <div className="flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">
              This hotel is inactive. All staff access is blocked.
            </p>
          </div>
        )}

        {/* Info grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#9B7340]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Location
              </p>
            </div>
            <p className="text-sm text-foreground">{tenant.location}</p>
            {tenant.address && (
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {tenant.address}
              </p>
            )}
          </div>

          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#7e9ab8]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Staff
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold font-serif">
                {tenant.activeStaffCount}
              </p>
              <p className="text-xs text-muted-foreground/60">
                active / {tenant.staffCount} total
              </p>
            </div>
          </div>

          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-[#9B7340]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Subscription
              </p>
            </div>
            {tenant.subscription ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {PLAN_LABELS[tenant.subscription.plan] ??
                      tenant.subscription.plan}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      SUB_STATUS_STYLES[tenant.subscription.status] ??
                        "text-muted-foreground bg-secondary/50",
                    )}
                  >
                    {tenant.subscription.status}
                  </span>
                </div>
                {tenant.subscription.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {tenant.subscription.cancelAtPeriodEnd
                      ? "Cancels"
                      : "Renews"}{" "}
                    {formatDate(tenant.subscription.currentPeriodEnd)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">
                No subscription
              </p>
            )}
          </div>

          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Created
              </p>
            </div>
            <p className="text-sm text-foreground">
              {formatDate(tenant.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Last updated {formatDate(tenant.updatedAt)}
            </p>
          </div>
        </div>

        {/* Description + details */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[#9B7340]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hotel Details
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground capitalize">{tenant.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={
                    tenant.isActive ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {tenant.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {tenant.description && (
                <div className="pt-2 border-t border-border/20">
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    {tenant.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-[#7e9ab8]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Activity
              </p>
            </div>
            {tenant.recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic">
                No recent activity
              </p>
            ) : (
              <div className="space-y-2">
                {tenant.recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-foreground/80">
                        {entry.action}
                      </span>
                      <span className="text-muted-foreground/40">
                        on {entry.tableName}
                      </span>
                    </div>
                    <span className="text-muted-foreground/40 shrink-0">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
