"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Users,
  CheckCircle2,
  XCircle,
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
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Status + plan badges
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
    active: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    inactive: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      dot: "bg-red-400",
    },
  };

const PLAN_COLORS: Record<string, string> = {
  starter: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  pro: "text-[#9B7340] bg-[#9B7340]/10 border-[#9B7340]/20",
  enterprise: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

function TenantStatusBadge({ isActive }: { isActive: boolean }): React.ReactElement {
  const key = isActive ? "active" : "inactive";
  const style = STATUS_STYLES[key];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        style.bg,
        style.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string | null }): React.ReactElement {
  if (!plan) {
    return (
      <span className="text-xs text-muted-foreground/50 italic">No plan</span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        PLAN_COLORS[plan] ?? "text-muted-foreground bg-secondary/50 border-border/30",
      )}
    >
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminTenantsPage(): React.ReactElement {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [filtered, setFiltered] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const loadTenants = useCallback(async () => {
    setLoading(true);
    const result = await getAdminTenants();
    if (result.success && result.data) {
      setTenants(result.data);
    } else {
      setError(result.error ?? "Failed to load tenants.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    let result = tenants;
    if (statusFilter !== "all") {
      result = result.filter((t) =>
        statusFilter === "active" ? t.isActive : !t.isActive,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [tenants, search, statusFilter]);

  const activeTenants = tenants.filter((t) => t.isActive).length;
  const totalStaff = tenants.reduce((sum, t) => sum + t.staffCount, 0);

  return (
    <>
      <AdminHeader />
      <PageContainer>
        <PageHeader
          title="Tenants"
          subtitle="Manage all hotel tenants on the platform"
        />

        {/* KPI summary */}
        <div className="grid gap-4 grid-cols-3 mb-6">
          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-[#9B7340]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Tenants
              </p>
            </div>
            <p className="text-2xl font-semibold font-serif">
              {loading ? "..." : tenants.length}
            </p>
          </div>
          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active
              </p>
            </div>
            <p className="text-2xl font-semibold font-serif">
              {loading ? "..." : activeTenants}
            </p>
          </div>
          <div className="glass-card-dark p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-[#7e9ab8]" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Staff
              </p>
            </div>
            <p className="text-2xl font-semibold font-serif">
              {loading ? "..." : totalStaff}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, location, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-secondary/30 border border-border/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9B7340]/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary/30 rounded-xl p-1 border border-border/30">
            {(["all", "active", "inactive"] as const).map((val) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  statusFilter === val
                    ? "bg-[#9B7340] text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#9B7340]" />
          </div>
        ) : error ? (
          <div className="glass-card-dark p-8 rounded-2xl text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card-dark p-12 rounded-2xl text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No tenants match your filters."
                : "No tenants found."}
            </p>
          </div>
        ) : (
          <div className="glass-card-dark rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Hotel
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Location
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Status
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Plan
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                    Staff
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((tenant) => (
                  <tr
                    key={tenant.id}
                    onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                    className="border-b border-border/10 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#9B7340]/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-[#9B7340]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {tenant.name}
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            {tenant.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {tenant.location}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <TenantStatusBadge isActive={tenant.isActive} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <PlanBadge plan={tenant.plan} />
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-muted-foreground">
                      {tenant.staffCount}
                    </td>
                    <td className="px-5 py-4">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageContainer>
    </>
  );
}
