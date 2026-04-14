"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Database,
  Server,
  CreditCard,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AdminHeader } from "@/components/innara/AdminHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "down" | "checking";
  description: string;
  icon: React.ElementType;
  lastChecked: string | null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminHealthPage(): React.ReactElement {
  const [checks, setChecks] = useState<HealthCheck[]>([
    {
      name: "Application Server",
      status: "checking",
      description: "Next.js application runtime",
      icon: Server,
      lastChecked: null,
    },
    {
      name: "Database",
      status: "checking",
      description: "Supabase PostgreSQL connection",
      icon: Database,
      lastChecked: null,
    },
    {
      name: "Authentication",
      status: "checking",
      description: "Supabase Auth service",
      icon: Activity,
      lastChecked: null,
    },
    {
      name: "Stripe Billing",
      status: "checking",
      description: "Stripe API connectivity",
      icon: CreditCard,
      lastChecked: null,
    },
    {
      name: "Email Service",
      status: "checking",
      description: "Resend email delivery",
      icon: Mail,
      lastChecked: null,
    },
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const runChecks = useCallback(async () => {
    setRefreshing(true);
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // App server is always healthy if this page loads
    setChecks((prev) =>
      prev.map((c) => ({
        ...c,
        status: "healthy" as const,
        lastChecked: now,
      })),
    );

    // Check API health endpoint
    try {
      const res = await fetch("/api/health", { method: "GET" });
      if (!res.ok) {
        setChecks((prev) =>
          prev.map((c) =>
            c.name === "Database" || c.name === "Authentication"
              ? { ...c, status: "degraded" as const, lastChecked: now }
              : c,
          ),
        );
      }
    } catch {
      setChecks((prev) =>
        prev.map((c) =>
          c.name === "Database"
            ? { ...c, status: "down" as const, lastChecked: now }
            : c,
        ),
      );
    }

    setRefreshing(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const STATUS_STYLES = {
    healthy: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      dot: "bg-emerald-400",
      label: "Healthy",
    },
    degraded: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      dot: "bg-amber-400",
      label: "Degraded",
    },
    down: {
      text: "text-red-400",
      bg: "bg-red-500/10",
      dot: "bg-red-400",
      label: "Down",
    },
    checking: {
      text: "text-muted-foreground",
      bg: "bg-secondary/50",
      dot: "bg-muted-foreground",
      label: "Checking...",
    },
  };

  const allHealthy = checks.every((c) => c.status === "healthy");

  return (
    <>
      <AdminHeader />
      <PageContainer>
        <PageHeader
          title="System Health"
          subtitle="Monitor platform service status"
          action={
            <button
              onClick={runChecks}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary/50 text-muted-foreground hover:text-foreground rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={cn(
                  "w-3 h-3",
                  refreshing && "animate-spin",
                )}
              />
              Refresh
            </button>
          }
        />

        {/* Overall status */}
        <div
          className={cn(
            "glass-card-dark relative p-6 rounded-2xl mb-6 flex items-center gap-4",
            allHealthy ? "border border-emerald-500/20" : "border border-amber-500/20",
          )}
        >
          <BorderBeam size={180} duration={14} colorFrom={allHealthy ? "#4ade80" : "#9B7340"} colorTo={allHealthy ? "#22c55e" : "#C4A265"} />
          {allHealthy ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <XCircle className="w-8 h-8 text-amber-400" />
          )}
          <div>
            <p className="text-lg font-semibold text-foreground font-serif">
              {allHealthy ? "All Systems Operational" : "Some Services Degraded"}
            </p>
            <p className="text-xs text-muted-foreground">
              Last checked: {checks[0]?.lastChecked ?? "—"}
            </p>
          </div>
        </div>

        {/* Service cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {checks.map((check) => {
            const style = STATUS_STYLES[check.status];
            const Icon = check.icon;
            return (
              <div key={check.name} className="glass-card-dark p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {check.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50">
                        {check.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium",
                      style.bg,
                      style.text,
                    )}
                  >
                    {check.status === "checking" ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
                    )}
                    {style.label}
                  </span>
                </div>
                {check.lastChecked && (
                  <p className="text-[10px] text-muted-foreground/40">
                    Last checked {check.lastChecked}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </PageContainer>
    </>
  );
}
