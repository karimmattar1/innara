"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  CreditCard,
  Activity,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { AdminHeader } from "@/components/innara/AdminHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import {
  getAdminTenants,
  type TenantListItem,
} from "@/app/actions/admin-tenants";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGroup } from "@/components/ui/animated-group";

export default function AdminDashboard(): React.ReactElement {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await getAdminTenants();
    if (result.success && result.data) {
      setTenants(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeTenants = tenants.filter((t) => t.isActive).length;
  const totalStaff = tenants.reduce((sum, t) => sum + t.staffCount, 0);
  const subscribedTenants = tenants.filter(
    (t) => t.subscriptionStatus === "active" || t.subscriptionStatus === "trialing",
  ).length;

  return (
    <>
      <AdminHeader />
      <PageContainer>
        <PageHeader
          title="Admin Dashboard"
          subtitle="Platform management and tenant oversight"
        />

        {/* KPI cards */}
        <AnimatedGroup preset="slide" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MagicCard className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-[#9B7340]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Tenants
              </p>
            </div>
            <p className="text-3xl font-bold mt-1 font-serif">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#9B7340] inline" />
              ) : (
                activeTenants
              )}
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              of {tenants.length} total
            </p>
          </MagicCard>
          <MagicCard className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#7e9ab8]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Staff
              </p>
            </div>
            <p className="text-3xl font-bold mt-1 font-serif">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#9B7340] inline" />
              ) : (
                totalStaff
              )}
            </p>
          </MagicCard>
          <MagicCard className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Subscribed
              </p>
            </div>
            <p className="text-3xl font-bold mt-1 font-serif">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#9B7340] inline" />
              ) : (
                subscribedTenants
              )}
            </p>
          </MagicCard>
          <MagicCard className="p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                System Health
              </p>
            </div>
            <p className="text-3xl font-bold mt-1 font-serif text-emerald-400">OK</p>
          </MagicCard>
        </AnimatedGroup>

        {/* Quick actions */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid gap-3 md:grid-cols-3 mb-8 relative">
          {[
            {
              label: "Manage Tenants",
              desc: "View and manage all hotel tenants",
              icon: Building2,
              href: "/admin/tenants",
            },
            {
              label: "User Management",
              desc: "Search and manage platform users",
              icon: Users,
              href: "/admin/users",
            },
            {
              label: "Plan Management",
              desc: "Configure subscription plans",
              icon: CreditCard,
              href: "/admin/plans",
            },
          ].map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="glass-card-dark p-5 rounded-2xl text-left hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#9B7340]/10 flex items-center justify-center">
                    <action.icon className="w-4 h-4 text-[#9B7340]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {action.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {/* Recent tenants */}
        {!loading && tenants.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Recent Tenants
            </h2>
            <div className="glass-card-dark relative rounded-2xl overflow-hidden">
              <BorderBeam size={200} duration={18} delay={4} />
              {tenants.slice(0, 5).map((tenant, idx) => (
                <button
                  key={tenant.id}
                  onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02] transition-colors ${
                    idx < Math.min(tenants.length, 5) - 1
                      ? "border-b border-border/10"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#9B7340]/10 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-[#9B7340]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {tenant.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tenant.isActive ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
