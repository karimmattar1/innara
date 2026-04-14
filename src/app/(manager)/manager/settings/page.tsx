"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Settings,
  Activity,
  Copy,
  Check,
  Server,
  Database,
  Shield,
  Cloud,
  CreditCard,
  Brain,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { getHotelSettings, updateHotelSettings } from "@/app/actions/branding";
import { BorderBeam } from "@/components/ui/border-beam";
import type { HotelSettings } from "@/app/actions/branding";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SaveStatus = "idle" | "saving" | "success" | "error";

// ---------------------------------------------------------------------------
// Service status data
// ---------------------------------------------------------------------------

interface ServiceStatus {
  label: string;
  status: string;
  dotColor: "green" | "yellow";
  icon: React.ElementType;
  note?: string;
}

const SERVICES: ServiceStatus[] = [
  {
    label: "Database",
    status: "Connected",
    dotColor: "green",
    icon: Database,
  },
  {
    label: "Authentication",
    status: "Active",
    dotColor: "green",
    icon: Shield,
  },
  {
    label: "Storage",
    status: "Available",
    dotColor: "green",
    icon: Cloud,
  },
  {
    label: "Realtime",
    status: "Connected",
    dotColor: "green",
    icon: Server,
  },
  {
    label: "Stripe",
    status: "Configured",
    dotColor: "yellow",
    icon: CreditCard,
    note: "Requires webhook verification",
  },
  {
    label: "AI Concierge",
    status: "Ready",
    dotColor: "green",
    icon: Brain,
  },
];

const SYSTEM_INFO: { label: string; value: string }[] = [
  { label: "Platform Version", value: "Innara v1.0.0" },
  { label: "Environment", value: "Production" },
  { label: "Region", value: "ap-south-1" },
  { label: "Last Deploy", value: "—" },
];

// ---------------------------------------------------------------------------
// StatusDot
// ---------------------------------------------------------------------------

interface StatusDotProps {
  color: "green" | "yellow";
}

function StatusDot({ color }: StatusDotProps): React.ReactElement {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        color === "green" ? "bg-emerald-400" : "bg-amber-400"
      }`}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// ServiceStatusCard
// ---------------------------------------------------------------------------

interface ServiceStatusCardProps {
  service: ServiceStatus;
}

function ServiceStatusCard({
  service,
}: ServiceStatusCardProps): React.ReactElement {
  const Icon = service.icon;

  return (
    <div className="glass-card-dark rounded-2xl p-4 flex items-center gap-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 shrink-0">
        <Icon className="w-4 h-4 text-[#9B7340]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{service.label}</p>
        {service.note && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {service.note}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusDot color={service.dotColor} />
        <span
          className={`text-xs font-medium ${
            service.dotColor === "green"
              ? "text-emerald-400"
              : "text-amber-400"
          }`}
        >
          {service.status}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HotelSettingsTab
// ---------------------------------------------------------------------------

interface HotelSettingsTabProps {
  settings: HotelSettings;
}

function HotelSettingsTab({
  settings,
}: HotelSettingsTabProps): React.ReactElement {
  const [name, setName] = useState(settings.name);
  const [type, setType] = useState(settings.type ?? "");
  const [location, setLocation] = useState(settings.location ?? "");
  const [address, setAddress] = useState(settings.address ?? "");
  const [description, setDescription] = useState(settings.description ?? "");
  const [imageUrl, setImageUrl] = useState(settings.imageUrl ?? "");
  const [amenitiesRaw, setAmenitiesRaw] = useState(
    settings.amenities.join(", ")
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [slugCopied, setSlugCopied] = useState(false);

  const handleCopySlug = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(settings.slug);
      setSlugCopied(true);
      setTimeout(() => setSlugCopied(false), 2000);
    } catch {
      // Clipboard API not available — no-op
    }
  }, [settings.slug]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setSaveStatus("error");
      setSaveMessage("Hotel name is required.");
      return;
    }

    setSaveStatus("saving");
    setSaveMessage(null);

    const amenitiesArray = amenitiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await updateHotelSettings({
      name: name.trim(),
      type: type.trim() || null,
      location: location.trim() || null,
      address: address.trim() || null,
      description: description.trim() || null,
      amenities: amenitiesArray,
    });

    if (!result.success) {
      setSaveStatus("error");
      setSaveMessage(result.error ?? "Failed to save settings.");
    } else {
      setSaveStatus("success");
      setSaveMessage("Settings saved successfully.");
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage(null);
      }, 3000);
    }
  }, [name, type, location, address, description, amenitiesRaw]);

  const imagePreviewValid =
    imageUrl.trim().length > 0 &&
    (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"));

  return (
    <div className="flex flex-col gap-6">
      {/* General Info */}
      <section
        aria-labelledby="general-info-heading"
        className="glass-card-dark relative rounded-2xl p-6"
      >
        <BorderBeam size={180} duration={16} />
        <h2
          id="general-info-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5"
        >
          General Info
        </h2>

        <div className="flex flex-col gap-5">
          {/* Hotel Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-name">
              Hotel Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hotel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grand Palms Hotel"
              required
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-slug">Slug</Label>
            <div className="flex gap-2">
              <Input
                id="hotel-slug"
                value={settings.slug}
                readOnly
                className="flex-1 opacity-60 cursor-default select-all"
                aria-label="Hotel slug (read-only)"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleCopySlug()}
                aria-label="Copy slug to clipboard"
                className="shrink-0 gap-1.5 px-3"
              >
                {slugCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {slugCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Hotel Type */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-type">Hotel Type</Label>
            <Input
              id="hotel-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. boutique, resort, business"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-description">Description</Label>
            <Textarea
              id="hotel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of your property…"
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section
        aria-labelledby="location-heading"
        className="glass-card-dark rounded-2xl p-6"
      >
        <h2
          id="location-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5"
        >
          Location
        </h2>

        <div className="flex flex-col gap-5">
          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-address">Address</Label>
            <Textarea
              id="hotel-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full property address…"
              rows={2}
            />
          </div>

          {/* Location / City */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-location">Location / City</Label>
            <Input
              id="hotel-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Maldives, Bali, New York"
            />
          </div>
        </div>
      </section>

      {/* Media */}
      <section
        aria-labelledby="media-heading"
        className="glass-card-dark rounded-2xl p-6"
      >
        <h2
          id="media-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5"
        >
          Media
        </h2>

        <div className="flex flex-col gap-5">
          {/* Image URL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-image-url">Image URL</Label>
            <Input
              id="hotel-image-url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/hotel-image.jpg"
            />
          </div>

          {/* Image preview */}
          {imagePreviewValid && (
            <div className="mt-1">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Hotel property preview"
                className="w-full max-w-sm h-40 object-cover rounded-xl border border-border/20"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Amenities */}
      <section
        aria-labelledby="amenities-heading"
        className="glass-card-dark rounded-2xl p-6"
      >
        <h2
          id="amenities-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5"
        >
          Amenities
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hotel-amenities">
              Amenities{" "}
              <span className="text-muted-foreground font-normal">
                (comma-separated)
              </span>
            </Label>
            <Input
              id="hotel-amenities"
              value={amenitiesRaw}
              onChange={(e) => setAmenitiesRaw(e.target.value)}
              placeholder="Pool, Spa, Free WiFi, Gym, Restaurant"
            />
          </div>

          {/* Tag-style display */}
          {amenitiesRaw.trim().length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1" aria-label="Amenity tags">
              {amenitiesRaw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#9B7340]/15 text-[#9B7340] border border-[#9B7340]/20"
                  >
                    {amenity}
                  </span>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Save */}
      <div className="flex flex-col items-start gap-2 pb-2">
        <Button
          onClick={() => void handleSave()}
          disabled={saveStatus === "saving"}
          className="bg-[#9B7340] hover:bg-[#b8924f] text-white border-0 gap-2 px-6"
          aria-live="polite"
        >
          {saveStatus === "saving" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>

        {saveMessage && (
          <p
            role="status"
            aria-live="polite"
            className={`text-sm ${
              saveStatus === "success"
                ? "text-emerald-400"
                : "text-destructive"
            }`}
          >
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SystemHealthTab
// ---------------------------------------------------------------------------

function SystemHealthTab(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      {/* Service status */}
      <section aria-labelledby="service-status-heading">
        <h2
          id="service-status-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
        >
          Service Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map((service) => (
            <ServiceStatusCard key={service.label} service={service} />
          ))}
        </div>
      </section>

      {/* System info */}
      <section aria-labelledby="system-info-heading">
        <h2
          id="system-info-heading"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
        >
          System Info
        </h2>
        <div className="glass-card-dark rounded-2xl divide-y divide-white/5 overflow-hidden">
          {SYSTEM_INFO.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Support note */}
      <p className="text-xs text-muted-foreground border border-border/20 rounded-xl px-4 py-3 bg-white/[0.02]">
        For detailed system monitoring, contact Innara support.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ManagerSettingsPage
// ---------------------------------------------------------------------------

export default function ManagerSettingsPage(): React.ReactElement {
  const router = useRouter();

  const [settings, setSettings] = useState<HotelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getHotelSettings();
    if (!result.success || !result.data) {
      setError(result.error ?? "Failed to load hotel settings.");
      setLoading(false);
      return;
    }

    setSettings(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  }, [router]);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#9B7340]" />
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          </div>
        </PageContainer>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error || !settings) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <p className="text-base font-medium mb-2">
                Unable to load settings
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {error ?? "Something went wrong. Please try again."}
              </p>
              <button
                onClick={() => void loadSettings()}
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <ManagerHeader onSignOut={() => void handleSignOut()} />

      <PageContainer>
        <PageHeader
          title="Settings"
          subtitle="Hotel configuration and system health"
          action={
            <button
              onClick={() => void loadSettings()}
              aria-label="Refresh settings"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          }
        />

        <Tabs defaultValue="hotel-settings">
          <TabsList className="mb-6">
            <TabsTrigger value="hotel-settings" className="gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Hotel Settings
            </TabsTrigger>
            <TabsTrigger value="system-health" className="gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              System Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotel-settings">
            <HotelSettingsTab settings={settings} />
          </TabsContent>

          <TabsContent value="system-health">
            <SystemHealthTab />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
