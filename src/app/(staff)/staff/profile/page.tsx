"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Building2,
  Shield,
  Lock,
  LogOut,
  Bell,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StaffHeader } from "@/components/innara/StaffHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { getStaffProfile } from "@/app/actions/staff";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENT_LABELS } from "@/constants/app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileData {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  hotelId: string;
  isActive: boolean;
  avatarUrl: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Sub-components (inlined per ticket requirements — no new shared files)
// ---------------------------------------------------------------------------

function ProfileSkeleton(): React.ReactElement {
  return (
    <div className="animate-pulse space-y-6">
      {/* Avatar + name skeleton */}
      <div className="glass-card-dark rounded-2xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-white/10" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 rounded-full bg-white/10" />
            <div className="h-5 w-24 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
      {/* Info card skeleton */}
      <div className="glass-card-dark rounded-2xl p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-16 rounded bg-white/10" />
              <div className="h-4 w-40 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <div className="glass-card-dark rounded-2xl p-10 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/15 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Unable to load profile</p>
        <p className="text-sm text-muted-foreground mt-1">
          Something went wrong. Please try again.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StaffProfilePage(): React.ReactElement {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getStaffProfile();
    if (result.success && result.data) {
      setProfile(result.data);
    } else {
      setError(result.error ?? "Unable to load profile.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/staff/login");
    } catch {
      // Sign out failed — still redirect to login so the user isn't stuck
      router.push("/auth/staff/login");
    }
  };

  const initials = profile ? getInitials(profile.name) : "";
  const departmentLabel = profile
    ? (DEPARTMENT_LABELS[profile.department] ?? profile.department)
    : "";
  const roleLabel = profile ? formatRole(profile.role) : "";

  return (
    <>
      <StaffHeader
        userName={profile?.name}
        userInitials={initials}
        department={profile?.department}
      />
      <PageContainer className="max-w-2xl">
        <PageHeader
          title="My Profile"
          subtitle="Your account information and settings"
          backTo="/staff"
        />

        {loading && <ProfileSkeleton />}

        {!loading && error && (
          <ErrorState onRetry={loadProfile} />
        )}

        {!loading && !error && profile && (
          <div className="space-y-4">
            {/* ----------------------------------------------------------------
                Profile header card
            ---------------------------------------------------------------- */}
            <section
              className="glass-card-dark rounded-2xl p-6"
              aria-label="Profile overview"
            >
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={`${profile.name} avatar`}
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-[#9B7340]/30"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full bg-[#9B7340]/20 flex items-center justify-center ring-2 ring-[#9B7340]/30"
                      aria-hidden="true"
                    >
                      <span className="text-xl font-bold text-[#9B7340]">
                        {initials}
                      </span>
                    </div>
                  )}
                  {/* Active indicator */}
                  {profile.isActive && (
                    <span
                      className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-background"
                      aria-label="Active"
                      role="img"
                    />
                  )}
                </div>

                {/* Name + badges */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold truncate">{profile.name}</h2>
                  {profile.isActive && (
                    <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Active
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-[#9B7340]/15 text-[#9B7340] border-[#9B7340]/20"
                    >
                      {roleLabel}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-white/5 text-foreground/70 border-white/10"
                    >
                      {departmentLabel}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------
                Profile info card
            ---------------------------------------------------------------- */}
            <section
              className="glass-card-dark rounded-2xl p-6"
              aria-label="Account information"
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Account Information
              </h3>

              <div className="space-y-4" role="list">
                {/* Email */}
                <div className="flex items-start gap-3" role="listitem">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{profile.email}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Managed by admin
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/5" />

                {/* Department */}
                <div className="flex items-start gap-3" role="listitem">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{departmentLabel}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Assigned by admin
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/5" />

                {/* Role */}
                <div className="flex items-start gap-3" role="listitem">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{roleLabel}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Assigned by admin
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------------------
                Notification preferences (Wave 3 placeholder)
            ---------------------------------------------------------------- */}
            <section
              className="glass-card-dark rounded-2xl p-6"
              aria-label="Notification preferences"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Notifications
                </h3>
                <Badge
                  variant="outline"
                  className="text-xs border-[#9B7340]/30 text-[#9B7340]"
                >
                  Coming soon
                </Badge>
              </div>

              <div className="space-y-3" aria-label="Notification toggles — coming soon">
                {[
                  { icon: Bell, label: "Request updates" },
                  { icon: MessageSquare, label: "New messages" },
                  { icon: AlertTriangle, label: "SLA warnings" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3 opacity-50"
                    aria-disabled="true"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground/70">{label}</span>
                    </div>
                    {/* Placeholder toggle — not functional */}
                    <div
                      className="w-9 h-5 rounded-full bg-white/10 flex items-center px-0.5"
                      aria-hidden="true"
                    >
                      <div className="w-4 h-4 rounded-full bg-white/20" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ----------------------------------------------------------------
                Account settings
            ---------------------------------------------------------------- */}
            <section
              className="glass-card-dark rounded-2xl p-6"
              aria-label="Account settings"
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Account Settings
              </h3>

              <div className="space-y-2">
                {/* Change password */}
                <button
                  type="button"
                  onClick={() => router.push("/auth/staff/forgot-password")}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                  aria-label="Change password"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Change password</p>
                    <p className="text-xs text-muted-foreground">
                      Send a reset link to your email
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>

                <div className="border-t border-white/5 my-1" />

                {/* Sign out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-destructive/10 transition-colors text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label="Sign out"
                >
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-destructive">
                      {signingOut ? "Signing out…" : "Sign out"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You will be redirected to the login page
                    </p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}
      </PageContainer>
    </>
  );
}
