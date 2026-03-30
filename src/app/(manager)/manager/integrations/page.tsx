"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  Mail,
  Brain,
  Key,
  Copy,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationCardData {
  id: string;
  icon: React.ElementType;
  title: string;
  statusLabel: string;
  statusVariant: "active" | "configured" | "not-connected";
  description: string;
  metaLabel: string;
  metaValues: string[];
  action: {
    label: string;
    disabled: boolean;
    tooltip?: string;
    href?: string;
  };
}

interface WebhookRow {
  endpoint: string;
  status: "active" | "not-configured";
  lastEvent: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTEGRATIONS: IntegrationCardData[] = [
  {
    id: "pms",
    icon: Building2,
    title: "PMS Integration",
    statusLabel: "Not Connected",
    statusVariant: "not-connected",
    description:
      "Connect your PMS to sync guest bookings, room assignments, and check-in/check-out data automatically.",
    metaLabel: "Supported systems",
    metaValues: ["Mews, Opera, Cloudbeds, Little Hotelier"],
    action: {
      label: "Configure",
      disabled: true,
      tooltip: "Coming Soon",
    },
  },
  {
    id: "stripe",
    icon: CreditCard,
    title: "Stripe Payments",
    statusLabel: "Active",
    statusVariant: "active",
    description:
      "Process payments, manage subscriptions, and handle refunds through Stripe.",
    metaLabel: "Features",
    metaValues: ["Subscription billing", "One-time charges", "Automated invoicing"],
    action: {
      label: "Manage",
      disabled: false,
      href: "/manager/billing",
    },
  },
  {
    id: "email",
    icon: Mail,
    title: "Email & Notifications",
    statusLabel: "Configured",
    statusVariant: "configured",
    description:
      "Send transactional emails, booking confirmations, and marketing communications via Resend.",
    metaLabel: "Features",
    metaValues: ["Guest confirmations", "Staff notifications", "Marketing emails"],
    action: {
      label: "Configure",
      disabled: true,
      tooltip: "Coming Soon",
    },
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI Concierge",
    statusLabel: "Active",
    statusVariant: "active",
    description:
      "AI-powered guest assistant handles requests, recommendations, and common inquiries 24/7.",
    metaLabel: "Features",
    metaValues: [
      "Natural language requests",
      "Smart recommendations",
      "Multi-language support",
    ],
    action: {
      label: "View Analytics",
      disabled: false,
      href: "/manager/analytics",
    },
  },
];

const WEBHOOK_ROWS: WebhookRow[] = [
  {
    endpoint: "/api/webhooks/stripe",
    status: "active",
    lastEvent: "—",
  },
  {
    endpoint: "/api/webhooks/pms",
    status: "not-configured",
    lastEvent: "—",
  },
];

const MASKED_API_KEY = "inn_live_••••••••••••••••••••••••••••••••";

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

interface IntegrationStatusBadgeProps {
  variant: IntegrationCardData["statusVariant"];
  label: string;
}

function IntegrationStatusBadge({
  variant,
  label,
}: IntegrationStatusBadgeProps): React.ReactElement {
  switch (variant) {
    case "active":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          {label}
        </Badge>
      );
    case "configured":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          {label}
        </Badge>
      );
    case "not-connected":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20">
          {label}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// IntegrationCard
// ---------------------------------------------------------------------------

interface IntegrationCardProps {
  data: IntegrationCardData;
  onAction: (href: string) => void;
}

function IntegrationCard({
  data,
  onAction,
}: IntegrationCardProps): React.ReactElement {
  const Icon = data.icon;

  return (
    <article
      aria-labelledby={`integration-${data.id}-title`}
      className="glass-card-dark rounded-2xl p-6 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9B7340]/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[#9B7340]" />
          </div>
          <h2
            id={`integration-${data.id}-title`}
            className="text-base font-semibold"
          >
            {data.title}
          </h2>
        </div>
        <IntegrationStatusBadge
          variant={data.statusVariant}
          label={data.statusLabel}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {data.description}
      </p>

      {/* Meta */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {data.metaLabel}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {data.metaValues.map((value) => (
            <span
              key={value}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-muted-foreground"
            >
              {value}
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="mt-auto pt-2">
        {data.action.disabled ? (
          <div className="relative group inline-block w-full">
            <Button
              variant="outline"
              disabled
              className="w-full"
              aria-label={`${data.action.label} — ${data.action.tooltip ?? ""}`}
            >
              {data.action.label}
            </Button>
            {data.action.tooltip && (
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-popover border border-border text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                {data.action.tooltip}
              </span>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => data.action.href && onAction(data.action.href)}
            className="w-full gap-2"
          >
            {data.action.label}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// WebhookStatusSection
// ---------------------------------------------------------------------------

function WebhookStatusSection(): React.ReactElement {
  return (
    <section aria-labelledby="webhooks-heading" className="glass-card-dark rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#9B7340]/10 flex items-center justify-center shrink-0">
          {/* Inline Webhook icon via SVG path to avoid unused-import linting issues */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#9B7340]"
            aria-hidden="true"
          >
            <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
            <path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" />
            <path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8" />
          </svg>
        </div>
        <h2 id="webhooks-heading" className="text-base font-semibold">
          Webhook Endpoints
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-3 pr-4">
                Endpoint
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-3 pr-4">
                Status
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-3">
                Last Event
              </th>
            </tr>
          </thead>
          <tbody>
            {WEBHOOK_ROWS.map((row) => (
              <tr
                key={row.endpoint}
                className="border-b border-white/5 last:border-0"
              >
                <td className="py-3 pr-4 font-mono text-xs text-foreground">
                  {row.endpoint}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        row.status === "active"
                          ? "bg-emerald-400"
                          : "bg-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className={
                        row.status === "active"
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      }
                    >
                      {row.status === "active" ? "Active" : "Not configured"}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-muted-foreground">{row.lastEvent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
        Webhooks are automatically managed. Contact support for custom webhook
        configuration.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ApiKeysSection
// ---------------------------------------------------------------------------

function ApiKeysSection(): React.ReactElement {
  return (
    <section
      aria-labelledby="api-access-heading"
      className="glass-card-dark rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#9B7340]/10 flex items-center justify-center shrink-0">
          <Key className="w-4 h-4 text-[#9B7340]" />
        </div>
        <h2 id="api-access-heading" className="text-base font-semibold">
          API Access
        </h2>
      </div>

      <p className="text-sm text-muted-foreground mb-5">
        API keys for custom integrations and third-party services.
      </p>

      {/* Masked key field */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 min-w-0">
          <span className="font-mono text-sm text-muted-foreground truncate select-all">
            {MASKED_API_KEY}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="Copy API key (placeholder)"
          className="shrink-0 gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy
        </Button>
      </div>

      {/* Generate new key */}
      <div className="relative group inline-block mb-4">
        <Button
          variant="outline"
          disabled
          aria-label="Generate New Key — Coming Soon"
        >
          Generate New Key
        </Button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-popover border border-border text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          Coming Soon
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        API documentation available at{" "}
        <span className="text-[#9B7340]">docs.innara.com</span>
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerIntegrationsPage(): React.ReactElement {
  const router = useRouter();

  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userInitials, setUserInitials] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth/staff/login");
        return;
      }
      const meta = data.user.user_metadata as Record<string, string> | undefined;
      const name = meta?.full_name ?? data.user.email ?? "";
      setUserName(name);
      const parts = name.trim().split(" ");
      setUserInitials(
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase()
      );
      setLoading(false);
    });
  }, [router]);

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  }, [router]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleAction = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

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
              Loading integrations…
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader
        userName={userName}
        userInitials={userInitials}
        onSignOut={() => void handleSignOut()}
      />

      <PageContainer>
        <PageHeader
          title="Integrations"
          subtitle="Manage connected services and third-party integrations"
        />

        {/* Integration cards grid */}
        <section aria-label="Connected integrations" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATIONS.map((integration) => (
              <IntegrationCard
                key={integration.id}
                data={integration}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>

        {/* Webhook status */}
        <div className="mb-6">
          <WebhookStatusSection />
        </div>

        {/* API keys */}
        <ApiKeysSection />
      </PageContainer>
    </>
  );
}
