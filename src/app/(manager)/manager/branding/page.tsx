"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  Palette,
  Type,
  Image,
  Code,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  getBranding,
  updateBranding,
  type HotelBranding,
} from "@/app/actions/branding";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Default values used for "Reset to Defaults"
// ---------------------------------------------------------------------------

const DEFAULT_BRANDING: HotelBranding = {
  logoUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  primaryColor: null,
  accentColor: null,
  backgroundColor: null,
  fontHeading: null,
  fontBody: null,
  customCss: null,
  welcomeMessage: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a potentially-null color to a safe hex value for <input type="color">. */
function toColorInput(value: string | null): string {
  return value ?? "#1a1d3a";
}

/** Returns true when `value` looks like a valid absolute URL. */
function isValidUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// SectionCard — visual wrapper for each form section
// ---------------------------------------------------------------------------

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon: Icon, title, children }: SectionCardProps): React.ReactElement {
  return (
    <div className="glass-card-dark rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-[#9B7340]" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UrlField — URL input with live image/favicon preview
// ---------------------------------------------------------------------------

interface UrlFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  previewAlt?: string;
}

function UrlField({
  id,
  label,
  value,
  onChange,
  placeholder = "https://",
  previewAlt = "Preview",
}: UrlFieldProps): React.ReactElement {
  const showPreview = isValidUrl(value);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <Input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-white/5 border-white/10 focus:border-[#9B7340] text-sm flex-1"
          aria-describedby={showPreview ? `${id}-preview` : undefined}
        />
        {showPreview && (
          <div
            id={`${id}-preview`}
            className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0"
            aria-label={`${label} preview`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={previewAlt}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColorField — color picker + hex text input
// ---------------------------------------------------------------------------

interface ColorFieldProps {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string) => void;
}

function ColorField({ id, label, value, onChange }: ColorFieldProps): React.ReactElement {
  const colorValue = toColorInput(value);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <input
            id={id}
            type="color"
            value={colorValue}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            aria-label={`${label} color picker`}
          />
          <label
            htmlFor={id}
            className="block w-10 h-10 rounded-lg border border-white/20 cursor-pointer overflow-hidden"
            style={{ backgroundColor: colorValue }}
            aria-label={`Pick ${label}`}
          />
        </div>
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="bg-white/5 border-white/10 focus:border-[#9B7340] text-sm font-mono w-32"
          aria-label={`${label} hex value`}
        />
        {value && (
          <span
            className="text-xs text-muted-foreground"
            aria-live="polite"
            aria-label={`Current ${label}: ${value}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LivePreview — visual card showing current colors and fonts
// ---------------------------------------------------------------------------

interface LivePreviewProps {
  form: HotelBranding;
}

function LivePreview({ form }: LivePreviewProps): React.ReactElement {
  const bgColor = form.backgroundColor ?? "#1a1d3a";
  const primaryColor = form.primaryColor ?? "#9B7340";
  const accentColor = form.accentColor ?? "#9B7340";
  const headingFont = form.fontHeading ?? "DM Sans";
  const bodyFont = form.fontBody ?? "DM Sans";
  const welcomeMsg = form.welcomeMessage ?? "Welcome to our hotel. How can we help you today?";

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10"
      role="region"
      aria-label="Live branding preview"
    >
      {/* Preview header bar */}
      <div
        className="px-4 py-2 flex items-center gap-1.5 border-b border-white/10"
        style={{ backgroundColor: bgColor }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-70" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" aria-hidden="true" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-70" aria-hidden="true" />
        <span className="ml-2 text-xs text-white/40">preview</span>
      </div>

      {/* Preview content */}
      <div
        className="p-5 flex flex-col gap-4"
        style={{ backgroundColor: bgColor }}
      >
        {/* Logo placeholder / heading */}
        {form.logoUrl && isValidUrl(form.logoUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.logoUrl}
            alt="Hotel logo preview"
            className="h-8 object-contain object-left"
          />
        ) : (
          <div
            className="text-sm font-semibold"
            style={{ fontFamily: headingFont, color: primaryColor }}
          >
            Hotel Name
          </div>
        )}

        {/* Heading sample */}
        <div>
          <p
            className="text-base font-bold leading-tight"
            style={{ fontFamily: headingFont, color: "#ffffff" }}
          >
            Welcome
          </p>
          <p
            className="text-xs mt-1 leading-relaxed opacity-70"
            style={{ fontFamily: bodyFont, color: "#ffffff" }}
          >
            {welcomeMsg.length > 80 ? `${welcomeMsg.slice(0, 80)}…` : welcomeMsg}
          </p>
        </div>

        {/* CTA button sample */}
        <div>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: primaryColor, fontFamily: bodyFont }}
            tabIndex={-1}
            aria-hidden="true"
          >
            View Services
          </button>
        </div>

        {/* Accent color sample */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
          <span className="text-xs opacity-50" style={{ color: "#ffffff", fontFamily: bodyFont }}>
            Accent color
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BrandingPage
// ---------------------------------------------------------------------------

export default function BrandingPage(): React.ReactElement {
  const router = useRouter();

  const [form, setForm] = useState<HotelBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const loadBranding = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const result = await getBranding();

    if (!result.success || !result.data) {
      setLoadError(result.error ?? "Failed to load branding configuration.");
      setLoading(false);
      return;
    }

    setForm(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadBranding();
  }, [loadBranding]);

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  };

  // -------------------------------------------------------------------------
  // Field helpers
  // -------------------------------------------------------------------------

  function setField<K extends keyof HotelBranding>(key: K, value: HotelBranding[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setStringField(key: keyof HotelBranding) {
    return (value: string) => setField(key, value === "" ? null : value);
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  const handleSave = async () => {
    setSaving(true);

    const result = await updateBranding(form);

    setSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to save branding configuration.");
      return;
    }

    toast.success("Branding saved successfully.");

    // Sync form with the server response if returned
    if (result.data) {
      setForm(result.data);
    }
  };

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  const handleResetConfirm = async () => {
    setShowResetDialog(false);
    setSaving(true);

    const result = await updateBranding(DEFAULT_BRANDING);

    setSaving(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to reset branding.");
      return;
    }

    setForm(DEFAULT_BRANDING);
    toast.success("Branding reset to defaults.");
  };

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
            <p className="text-sm text-muted-foreground">Loading branding configuration…</p>
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
              <p className="text-base font-medium mb-2">Unable to load branding</p>
              <p className="text-sm text-muted-foreground mb-6">{loadError}</p>
              <button
                onClick={() => void loadBranding()}
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
          title="Branding"
          subtitle="White-label customization for your guest portal"
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                disabled={saving}
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset to Defaults
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving}
                className="gap-1.5 bg-[#9B7340] hover:bg-[#b8924f] text-white border-0"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ---------------------------------------------------------------- */}
          {/* Left column: form sections                                        */}
          {/* ---------------------------------------------------------------- */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Logo section */}
            <SectionCard icon={Image} title="Logos & Favicon">
              <div className="flex flex-col gap-4">
                <UrlField
                  id="logo-url"
                  label="Logo URL"
                  value={form.logoUrl ?? ""}
                  onChange={setStringField("logoUrl")}
                  placeholder="https://your-hotel.com/logo.png"
                  previewAlt="Hotel logo"
                />
                <UrlField
                  id="logo-light-url"
                  label="Logo Light URL (for dark backgrounds)"
                  value={form.logoLightUrl ?? ""}
                  onChange={setStringField("logoLightUrl")}
                  placeholder="https://your-hotel.com/logo-light.png"
                  previewAlt="Hotel logo (light)"
                />
                <UrlField
                  id="favicon-url"
                  label="Favicon URL"
                  value={form.faviconUrl ?? ""}
                  onChange={setStringField("faviconUrl")}
                  placeholder="https://your-hotel.com/favicon.ico"
                  previewAlt="Favicon"
                />
              </div>
            </SectionCard>

            {/* Colors section */}
            <SectionCard icon={Palette} title="Brand Colors">
              <div className="flex flex-col gap-5">
                <ColorField
                  id="primary-color"
                  label="Primary Color"
                  value={form.primaryColor}
                  onChange={(v) => setField("primaryColor", v === "" ? null : v)}
                />
                <ColorField
                  id="accent-color"
                  label="Accent Color"
                  value={form.accentColor}
                  onChange={(v) => setField("accentColor", v === "" ? null : v)}
                />
                <ColorField
                  id="background-color"
                  label="Background Color"
                  value={form.backgroundColor}
                  onChange={(v) => setField("backgroundColor", v === "" ? null : v)}
                />
              </div>
            </SectionCard>

            {/* Typography section */}
            <SectionCard icon={Type} title="Typography">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="font-heading"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Heading Font
                  </Label>
                  <Input
                    id="font-heading"
                    type="text"
                    value={form.fontHeading ?? ""}
                    onChange={(e) => setStringField("fontHeading")(e.target.value)}
                    placeholder="e.g. Playfair Display"
                    maxLength={100}
                    className="bg-white/5 border-white/10 focus:border-[#9B7340] text-sm"
                    aria-describedby="font-heading-hint"
                  />
                  <p id="font-heading-hint" className="text-xs text-muted-foreground">
                    Enter a Google Fonts name or system font stack.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="font-body"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Body Font
                  </Label>
                  <Input
                    id="font-body"
                    type="text"
                    value={form.fontBody ?? ""}
                    onChange={(e) => setStringField("fontBody")(e.target.value)}
                    placeholder="e.g. Inter"
                    maxLength={100}
                    className="bg-white/5 border-white/10 focus:border-[#9B7340] text-sm"
                    aria-describedby="font-body-hint"
                  />
                  <p id="font-body-hint" className="text-xs text-muted-foreground">
                    Enter a Google Fonts name or system font stack.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Welcome message section */}
            <SectionCard icon={MessageSquare} title="Welcome Message">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="welcome-message"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Welcome Message
                </Label>
                <Textarea
                  id="welcome-message"
                  value={form.welcomeMessage ?? ""}
                  onChange={(e) => setStringField("welcomeMessage")(e.target.value)}
                  placeholder="Welcome to our hotel! We're here to make your stay exceptional."
                  maxLength={2000}
                  rows={4}
                  className="bg-white/5 border-white/10 focus:border-[#9B7340] text-sm resize-none"
                  aria-describedby="welcome-message-count"
                />
                <p
                  id="welcome-message-count"
                  className="text-xs text-muted-foreground text-right"
                  aria-live="polite"
                >
                  {(form.welcomeMessage ?? "").length} / 2000
                </p>
              </div>
            </SectionCard>

            {/* Custom CSS section */}
            <SectionCard icon={Code} title="Custom CSS">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="custom-css"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Custom CSS
                </Label>
                <Textarea
                  id="custom-css"
                  value={form.customCss ?? ""}
                  onChange={(e) => setStringField("customCss")(e.target.value)}
                  placeholder={`.guest-portal {\n  /* Custom styles here */\n}`}
                  maxLength={10000}
                  rows={8}
                  className="bg-white/5 border-white/10 focus:border-[#9B7340] text-sm font-mono resize-y"
                  aria-describedby="custom-css-count custom-css-warning"
                />
                <div className="flex items-start justify-between gap-2">
                  <p
                    id="custom-css-warning"
                    className="text-xs text-amber-400/80"
                  >
                    HTML tags are stripped automatically for security.
                  </p>
                  <p
                    id="custom-css-count"
                    className="text-xs text-muted-foreground flex-shrink-0"
                    aria-live="polite"
                  >
                    {(form.customCss ?? "").length} / 10000
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right column: live preview                                        */}
          {/* ---------------------------------------------------------------- */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 flex flex-col gap-4">
              <div className="glass-card-dark rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-4">Live Preview</h2>
                <LivePreview form={form} />
              </div>

              {/* Mobile save shortcut */}
              <div className="xl:hidden flex flex-col gap-2">
                <Button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="w-full gap-2 bg-[#9B7340] hover:bg-[#b8924f] text-white border-0"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowResetDialog(true)}
                  disabled={saving}
                  className="w-full gap-2"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      {/* -------------------------------------------------------------------- */}
      {/* Reset confirmation dialog                                              */}
      {/* -------------------------------------------------------------------- */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset branding to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all custom logos, colors, fonts, CSS, and your welcome message. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleResetConfirm()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
