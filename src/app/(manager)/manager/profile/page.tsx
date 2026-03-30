"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  User,
  Shield,
  Info,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { ManagerHeader } from "@/components/innara/ManagerHeader";
import { PageContainer } from "@/components/innara/PageContainer";
import { PageHeader } from "@/components/innara/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  department: string | null;
  app_role: string | null;
  hotel_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function truncateId(id: string | null | undefined, chars = 12): string {
  if (!id) return "—";
  return id.length > chars ? `${id.slice(0, chars)}…` : id;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "M";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function roleLabel(role: string | null | undefined): string {
  const map: Record<string, string> = {
    staff: "Staff",
    front_desk: "Front Desk",
    manager: "Manager",
    super_admin: "Super Admin",
    guest: "Guest",
  };
  return role ? (map[role] ?? role) : "—";
}

function departmentLabel(dept: string | null | undefined): string {
  const map: Record<string, string> = {
    front_desk: "Front Desk",
    housekeeping: "Housekeeping",
    maintenance: "Maintenance",
    food_beverage: "Food & Beverage",
    concierge: "Concierge",
    management: "Management",
  };
  return dept ? (map[dept] ?? dept) : "—";
}

// ---------------------------------------------------------------------------
// CopyButton — inline copy with success tick
// ---------------------------------------------------------------------------

interface CopyButtonProps {
  value: string;
}

function CopyButton({ value }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <button
      onClick={() => void handleCopy()}
      aria-label="Copy to clipboard"
      className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ManagerProfilePage(): React.ReactElement {
  const router = useRouter();

  // Data
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile edit form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Danger zone
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [globalSignOutLoading, setGlobalSignOutLoading] = useState(false);

  // Header state
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userInitials, setUserInitials] = useState<string | undefined>(
    undefined
  );

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/auth/staff/login");
      return;
    }

    setAuthUser(authData.user);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, avatar_url, department, app_role, hotel_id, created_at"
      )
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      setError("Failed to load profile. Please try again.");
      setLoading(false);
      return;
    }

    setProfile(profileData as ProfileRow);

    // Seed editable fields
    setFullName(profileData?.full_name ?? "");
    setPhone(profileData?.phone ?? "");

    // Header info
    const name = profileData?.full_name ?? authData.user.email ?? "";
    setUserName(name);
    setUserInitials(getInitials(name));

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Sign out (current session)
  // ---------------------------------------------------------------------------

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/staff/login");
  }, [router]);

  // ---------------------------------------------------------------------------
  // Save profile
  // ---------------------------------------------------------------------------

  const handleSaveProfile = useCallback(async () => {
    if (!authUser) return;
    setProfileSaving(true);
    setProfileFeedback(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", authUser.id);

    setProfileSaving(false);

    if (updateError) {
      setProfileFeedback({ type: "error", message: "Failed to save profile. Please try again." });
      return;
    }

    // Update header name
    setUserName(fullName);
    setUserInitials(getInitials(fullName));
    setProfile((prev) => (prev ? { ...prev, full_name: fullName, phone } : prev));

    setProfileFeedback({ type: "success", message: "Profile saved successfully." });
  }, [authUser, fullName, phone]);

  // ---------------------------------------------------------------------------
  // Change password
  // ---------------------------------------------------------------------------

  const handleUpdatePassword = useCallback(async () => {
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    setPasswordSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setPasswordSaving(false);

    if (updateError) {
      setPasswordFeedback({ type: "error", message: updateError.message ?? "Failed to update password." });
      return;
    }

    setPasswordFeedback({ type: "success", message: "Password updated successfully." });
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
  }, [newPassword, confirmPassword]);

  const handleCancelPasswordChange = useCallback(() => {
    setShowPasswordForm(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordFeedback(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Global sign out
  // ---------------------------------------------------------------------------

  const handleGlobalSignOut = useCallback(async () => {
    setGlobalSignOutLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/auth/staff/login");
  }, [router]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#9B7340]" />
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          </div>
        </PageContainer>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error || !authUser) {
    return (
      <>
        <ManagerHeader onSignOut={() => void handleSignOut()} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="glass-card-dark p-8 rounded-2xl text-center max-w-md">
              <p className="text-base font-medium mb-2">Unable to load profile</p>
              <p className="text-sm text-muted-foreground mb-6">
                {error ?? "Something went wrong. Please try again."}
              </p>
              <button
                onClick={() => void loadData()}
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const avatarInitials = getInitials(profile?.full_name ?? authUser.email);
  const authProvider =
    (authUser.app_metadata?.provider as string | undefined) ?? "email";

  return (
    <div className="min-h-screen bg-background">
      <ManagerHeader
        userName={userName}
        userInitials={userInitials}
        onSignOut={() => void handleSignOut()}
      />

      <PageContainer>
        <PageHeader
          title="My Profile"
          subtitle="Manage your account information and security settings"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ------------------------------------------------------------------ */}
          {/* Left column: Profile + Security                                      */}
          {/* ------------------------------------------------------------------ */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* ---------------------------------------------------------------- */}
            {/* Profile section                                                   */}
            {/* ---------------------------------------------------------------- */}
            <section aria-labelledby="profile-section-heading">
              <div className="glass-card-dark rounded-2xl p-6">
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-[#9B7340]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#9B7340]" />
                  </div>
                  <h2
                    id="profile-section-heading"
                    className="text-base font-semibold"
                  >
                    Personal Information
                  </h2>
                </div>

                {/* Avatar + identity */}
                <div className="flex items-start gap-5 mb-6">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name ?? "Avatar"}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-[#9B7340]/30 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#9B7340]/20 flex items-center justify-center text-[#9B7340] text-lg font-semibold shrink-0 ring-2 ring-[#9B7340]/30">
                      {avatarInitials}
                    </div>
                  )}

                  <div className="flex flex-col gap-1 pt-1">
                    <p className="text-base font-semibold">
                      {profile?.full_name ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {authUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {profile?.department && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          {departmentLabel(profile.department)}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#9B7340]/15 text-[#9B7340] border border-[#9B7340]/20">
                        {roleLabel(profile?.app_role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="grid gap-1.5">
                    <Label htmlFor="profile-full-name">Full name</Label>
                    <Input
                      id="profile-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={authUser.email ?? ""}
                      readOnly
                      disabled
                      className="opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input
                      id="profile-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Feedback */}
                {profileFeedback && (
                  <div
                    className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${
                      profileFeedback.type === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}
                  >
                    {profileFeedback.type === "success" ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    {profileFeedback.message}
                  </div>
                )}

                {/* Save button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => void handleSaveProfile()}
                    disabled={profileSaving}
                    className="gap-2"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* Security section                                                  */}
            {/* ---------------------------------------------------------------- */}
            <section aria-labelledby="security-section-heading">
              <div className="glass-card-dark rounded-2xl p-6">
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2
                    id="security-section-heading"
                    className="text-base font-semibold"
                  >
                    Security
                  </h2>
                </div>

                {/* Last sign-in */}
                <div className="flex items-center justify-between mb-5 py-3 px-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm font-medium">Last sign-in</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {authUser.last_sign_in_at
                        ? new Date(authUser.last_sign_in_at).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "—"}
                    </p>
                  </div>
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Change password toggle */}
                {!showPasswordForm ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(true);
                      setPasswordFeedback(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="new-password">New password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            aria-label={
                              showNewPassword ? "Hide password" : "Show password"
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="confirm-password">Confirm password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password feedback */}
                    {passwordFeedback && (
                      <div
                        className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm border ${
                          passwordFeedback.type === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {passwordFeedback.type === "success" ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                        )}
                        {passwordFeedback.message}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => void handleUpdatePassword()}
                        disabled={passwordSaving}
                        className="gap-2"
                      >
                        {passwordSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating…
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelPasswordChange}
                        disabled={passwordSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Right column: Account Info + Danger Zone                            */}
          {/* ------------------------------------------------------------------ */}
          <div className="flex flex-col gap-6">
            {/* ---------------------------------------------------------------- */}
            {/* Account Info section                                              */}
            {/* ---------------------------------------------------------------- */}
            <section aria-labelledby="account-info-heading">
              <div className="glass-card-dark rounded-2xl p-6">
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Info className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2
                    id="account-info-heading"
                    className="text-base font-semibold"
                  >
                    Account Info
                  </h2>
                </div>

                <dl className="space-y-4">
                  {/* Account ID */}
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Account ID
                    </dt>
                    <dd className="flex items-center text-sm font-mono">
                      <span className="truncate">{truncateId(authUser.id)}</span>
                      <CopyButton value={authUser.id} />
                    </dd>
                  </div>

                  {/* Hotel ID */}
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Hotel ID
                    </dt>
                    <dd className="flex items-center text-sm font-mono">
                      {profile?.hotel_id ? (
                        <>
                          <span className="truncate">
                            {truncateId(profile.hotel_id)}
                          </span>
                          <CopyButton value={profile.hotel_id} />
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </dd>
                  </div>

                  {/* Member since */}
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Member since
                    </dt>
                    <dd className="text-sm">
                      {formatDate(profile?.created_at)}
                    </dd>
                  </div>

                  {/* Auth provider */}
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Auth provider
                    </dt>
                    <dd className="text-sm capitalize">{authProvider}</dd>
                  </div>
                </dl>
              </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* Danger Zone                                                       */}
            {/* ---------------------------------------------------------------- */}
            <section aria-labelledby="danger-zone-heading">
              <div className="glass-card-dark rounded-2xl p-6 border border-red-500/20">
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-red-500/20">
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h2
                    id="danger-zone-heading"
                    className="text-base font-semibold text-red-400"
                  >
                    Danger Zone
                  </h2>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Sign out of all devices immediately. You will need to sign back
                  in on each device.
                </p>

                {!showSignOutConfirm ? (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-colors"
                    onClick={() => setShowSignOutConfirm(true)}
                  >
                    Sign Out of All Devices
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-400">
                      Are you sure? This will end all active sessions.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors gap-2"
                        onClick={() => void handleGlobalSignOut()}
                        disabled={globalSignOutLoading}
                      >
                        {globalSignOutLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing out…
                          </>
                        ) : (
                          "Yes, sign out all"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowSignOutConfirm(false)}
                        disabled={globalSignOutLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
