"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  Circle,
  Rocket,
  ExternalLink,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  getHotelSettings,
  getBranding,
  getSlaConfigs,
  getServiceOptions,
} from "@/app/actions/branding";
import { getStaffList } from "@/app/actions/staff-management";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChecklistItemId =
  | "hotel-name"
  | "hotel-description"
  | "hotel-address"
  | "hotel-image"
  | "logo-uploaded"
  | "brand-colors"
  | "welcome-message"
  | "staff-added"
  | "sla-configured"
  | "service-options"
  | "menu-items"
  | "stripe-billing"
  | "email-notifications"
  | "pms-integration"
  | "test-booking-flow"
  | "staff-onboarding"
  | "manager-walkthrough";

interface ChecklistItem {
  id: ChecklistItemId;
  label: string;
  auto: boolean;
  optional?: boolean;
  checked: boolean;
}

type ChecklistSection = {
  title: string;
  items: ChecklistItem[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCALSTORAGE_KEY = "innara-go-live-checklist";

const MANUAL_ITEM_IDS: ChecklistItemId[] = [
  "menu-items",
  "stripe-billing",
  "email-notifications",
  "pms-integration",
  "test-booking-flow",
  "staff-onboarding",
  "manager-walkthrough",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadManualState(): Partial<Record<ChecklistItemId, boolean>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<ChecklistItemId, boolean>>) : {};
  } catch {
    return {};
  }
}

function saveManualState(state: Partial<Record<ChecklistItemId, boolean>>): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore storage errors (private browsing, quota exceeded)
  }
}

function buildInitialSections(
  manual: Partial<Record<ChecklistItemId, boolean>>
): ChecklistSection[] {
  const m = (id: ChecklistItemId): boolean => manual[id] ?? false;

  return [
    {
      title: "Hotel Setup",
      items: [
        { id: "hotel-name", label: "Hotel name configured", auto: true, checked: false },
        { id: "hotel-description", label: "Hotel description set", auto: true, checked: false },
        { id: "hotel-address", label: "Address configured", auto: true, checked: false },
        { id: "hotel-image", label: "Hotel image uploaded", auto: true, checked: false },
      ],
    },
    {
      title: "Branding",
      items: [
        { id: "logo-uploaded", label: "Logo uploaded", auto: true, checked: false },
        { id: "brand-colors", label: "Brand colors configured", auto: true, checked: false },
        { id: "welcome-message", label: "Welcome message set", auto: true, checked: false },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          id: "staff-added",
          label: "At least 1 staff member added",
          auto: true,
          checked: false,
        },
        { id: "sla-configured", label: "SLA targets configured", auto: true, checked: false },
        {
          id: "service-options",
          label: "Service options published",
          auto: true,
          checked: false,
        },
        {
          id: "menu-items",
          label: "Menu items available",
          auto: false,
          checked: m("menu-items"),
        },
      ],
    },
    {
      title: "Integrations",
      items: [
        {
          id: "stripe-billing",
          label: "Stripe billing configured",
          auto: false,
          checked: m("stripe-billing"),
        },
        {
          id: "email-notifications",
          label: "Email notifications tested",
          auto: false,
          checked: m("email-notifications"),
        },
        {
          id: "pms-integration",
          label: "PMS integration connected",
          auto: false,
          optional: true,
          checked: m("pms-integration"),
        },
      ],
    },
    {
      title: "Final Checks",
      items: [
        {
          id: "test-booking-flow",
          label: "Test guest booking flow",
          auto: false,
          checked: m("test-booking-flow"),
        },
        {
          id: "staff-onboarding",
          label: "Staff onboarding completed",
          auto: false,
          checked: m("staff-onboarding"),
        },
        {
          id: "manager-walkthrough",
          label: "Manager walkthrough done",
          auto: false,
          checked: m("manager-walkthrough"),
        },
      ],
    },
  ];
}

function applyAutoChecks(
  sections: ChecklistSection[],
  autoChecks: Partial<Record<ChecklistItemId, boolean>>
): ChecklistSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.auto && autoChecks[item.id] !== undefined
        ? { ...item, checked: autoChecks[item.id]! }
        : item
    ),
  }));
}

function flatItems(sections: ChecklistSection[]): ChecklistItem[] {
  return sections.flatMap((s) => s.items);
}

function countProgress(sections: ChecklistSection[]): { completed: number; required: number } {
  const all = flatItems(sections);
  const required = all.filter((i) => !i.optional);
  const completed = all.filter((i) => i.checked);
  return { completed: completed.length, required: required.length };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BadgeTagProps {
  variant: "auto" | "manual" | "optional";
}

function BadgeTag({ variant }: BadgeTagProps): React.ReactElement {
  if (variant === "auto") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/20">
        Auto-verified
      </span>
    );
  }
  if (variant === "optional") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
        Optional
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/10 text-white/50 border border-white/10">
      Manual
    </span>
  );
}

interface ChecklistRowProps {
  item: ChecklistItem;
  onToggle: (id: ChecklistItemId) => void;
}

function ChecklistRow({ item, onToggle }: ChecklistRowProps): React.ReactElement {
  const isToggleable = !item.auto;

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
      role="listitem"
    >
      <button
        type="button"
        onClick={() => isToggleable && onToggle(item.id)}
        disabled={!isToggleable}
        aria-label={
          isToggleable
            ? `${item.checked ? "Uncheck" : "Check"} ${item.label}`
            : `${item.label} — auto-verified`
        }
        className={[
          "flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7340]",
          isToggleable ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
      >
        {item.checked ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        ) : (
          <Circle className="w-5 h-5 text-white/25" aria-hidden="true" />
        )}
      </button>

      <span
        className={[
          "flex-1 text-sm",
          item.checked ? "text-foreground" : "text-muted-foreground",
        ].join(" ")}
      >
        {item.label}
      </span>

      <div className="flex items-center gap-1.5">
        {item.optional && <BadgeTag variant="optional" />}
        <BadgeTag variant={item.auto ? "auto" : "manual"} />
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  items: ChecklistItem[];
  onToggle: (id: ChecklistItemId) => void;
}

function SectionCard({ title, items, onToggle }: SectionCardProps): React.ReactElement {
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="glass-card-dark rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {checkedCount}/{items.length}
        </span>
      </div>
      <div role="list" aria-label={`${title} checklist items`}>
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  completed: number;
  total: number;
}

function ProgressBar({ completed, total }: ProgressBarProps): React.ReactElement {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="glass-card-dark rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">Overall Readiness</span>
        <span className="text-sm font-semibold text-[#9B7340]">
          {completed}/{total} required items
        </span>
      </div>
      <div
        className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Go-live readiness: ${pct}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct === 100
                ? "linear-gradient(90deg, #22c55e, #16a34a)"
                : "linear-gradient(90deg, #9B7340, #b8924f)",
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {pct === 100
          ? "All required items complete — you're ready to go live!"
          : `${100 - pct}% remaining — complete all required items to enable Go Live.`}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GoLivePage
// ---------------------------------------------------------------------------

export default function GoLivePage(): React.ReactElement {
  const router = useRouter();

  const [sections, setSections] = useState<ChecklistSection[]>(() =>
    buildInitialSections({})
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------

  const handleSignOut = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  // -------------------------------------------------------------------------
  // Data loading & auto-check resolution
  // -------------------------------------------------------------------------

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);

    const [settingsResult, brandingResult, staffResult, serviceResult, slaResult] =
      await Promise.all([
        getHotelSettings(),
        getBranding(),
        getStaffList(),
        getServiceOptions(),
        getSlaConfigs(),
      ]);

    if (
      !settingsResult.success ||
      !brandingResult.success ||
      !staffResult.success ||
      !serviceResult.success ||
      !slaResult.success
    ) {
      setLoadError(
        settingsResult.error ??
          brandingResult.error ??
          staffResult.error ??
          serviceResult.error ??
          slaResult.error ??
          "Failed to load go-live status."
      );
      setLoading(false);
      return;
    }

    const settings = settingsResult.data!;
    const branding = brandingResult.data!;
    const staffList = staffResult.data!;
    const serviceOptions = serviceResult.data!;
    const slaConfigs = slaResult.data!;

    const autoChecks: Partial<Record<ChecklistItemId, boolean>> = {
      "hotel-name": Boolean(settings.name?.trim()),
      "hotel-description": Boolean(settings.description?.trim()),
      "hotel-address": Boolean(settings.address?.trim()),
      "hotel-image": Boolean(settings.imageUrl?.trim()),
      "logo-uploaded": Boolean(branding.logoUrl?.trim()),
      "brand-colors": Boolean(branding.primaryColor?.trim()),
      "welcome-message": Boolean(branding.welcomeMessage?.trim()),
      "staff-added": staffList.length > 0,
      "sla-configured": slaConfigs.length > 0,
      "service-options": serviceOptions.some((o) => o.isActive),
    };

    const manual = loadManualState();

    setSections((prev) => {
      const base = buildInitialSections(manual);
      return applyAutoChecks(base, autoChecks);
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // -------------------------------------------------------------------------
  // Manual toggle
  // -------------------------------------------------------------------------

  const handleToggle = useCallback((id: ChecklistItemId): void => {
    if (!MANUAL_ITEM_IDS.includes(id)) return;

    setSections((prev) => {
      const updated = prev.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        ),
      }));

      // Persist manual state
      const newManual: Partial<Record<ChecklistItemId, boolean>> = {};
      for (const id of MANUAL_ITEM_IDS) {
        const item = updated.flatMap((s) => s.items).find((i) => i.id === id);
        if (item) newManual[id] = item.checked;
      }
      saveManualState(newManual);

      return updated;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const { completed, required } = countProgress(sections);
  const allRequiredComplete =
    flatItems(sections)
      .filter((i) => !i.optional)
      .every((i) => i.checked);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#9B7340]" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Checking go-live readiness…</p>
          </div>
        </PageContainer>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (loadError) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <p className="text-base font-medium mb-2">Unable to load go-live status</p>
              <p className="text-sm text-muted-foreground mb-6">{loadError}</p>
              <button
                onClick={() => void loadData()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9B7340] text-white text-sm font-medium hover:bg-[#b8924f] transition-colors"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Go-Live Checklist"
          subtitle="Complete all required items before launching your hotel on Innara"
          action={
            <Button
              size="sm"
              onClick={() => void loadData()}
              variant="outline"
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Refresh
            </Button>
          }
        />

        <div className="flex flex-col gap-5">
          {/* Progress bar */}
          <ProgressBar completed={completed} total={required} />

          {/* Checklist sections */}
          {sections.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              items={section.items}
              onToggle={handleToggle}
            />
          ))}

          {/* Go Live footer */}
          <div className="glass-card-dark rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold mb-0.5">Ready to go live?</h2>
              <p className="text-xs text-muted-foreground">
                {allRequiredComplete
                  ? "All required items are complete. Your hotel is ready to accept guests."
                  : "Complete all required checklist items above to enable the Go Live button."}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <a
                href="https://innara.app/docs/go-live"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                Launch Guide
              </a>

              <div
                title={
                  !allRequiredComplete
                    ? "Complete all required checklist items to enable Go Live"
                    : undefined
                }
              >
                <Button
                  disabled={!allRequiredComplete}
                  className="gap-2 bg-[#9B7340] hover:bg-[#b8924f] text-white border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-disabled={!allRequiredComplete}
                >
                  <Rocket className="w-4 h-4" aria-hidden="true" />
                  Go Live
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
