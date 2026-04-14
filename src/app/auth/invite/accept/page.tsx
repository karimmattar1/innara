"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InnaraLogo } from "@/components/innara/Logo";
import { GlassButton } from "@/components/ui/glass-button";
import { BorderBeam } from "@/components/ui/border-beam";
import { Spotlight } from "@/components/ui/spotlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function InviteAcceptPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="dark">
          <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}

function InviteAcceptContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const emailParam = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const hasMissingParams = !token || !emailParam;

  function validatePasswords(): boolean {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!validatePasswords()) return;

    setIsLoading(true);

    const supabase = createClient();

    // Step 1: Verify the invite OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: emailParam,
      token,
      type: "invite",
    });

    if (verifyError) {
      toast.error(verifyError.message);
      setIsLoading(false);
      return;
    }

    // Step 2: Set the user's password
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      toast.error(updateError.message);
      setIsLoading(false);
      return;
    }

    toast.success("Account activated! Redirecting...");
    router.push("/staff");
  }

  // Missing params error state
  if (hasMissingParams) {
    return (
      <div className="dark">
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground overflow-hidden">
          <Spotlight
            className="-top-40 left-0 md:left-60 md:-top-20"
            fill="#9B7340"
          />
          <div className="relative z-10 w-full max-w-sm">
            <div className="mb-8 flex justify-center">
              <InnaraLogo variant="light" size="md" />
            </div>

            <div className="glass-card-dark relative p-6 text-center sm:p-8">
              <BorderBeam size={180} duration={12} />
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-6 text-destructive" />
              </div>
              <h1 className="mb-2 font-playfair text-xl font-medium">Invalid Invite Link</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                This invite link is invalid or has expired. Please check the link in your
                email and try again, or contact your hotel administrator.
              </p>
              <Link href="/auth/staff/login">
                <GlassButton
                  variant="ghost"
                  className="h-11 w-full rounded-xl"
                >
                  Go to Staff Login
                </GlassButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground overflow-hidden">
        {/* Spotlight */}
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#9B7340"
        />
        {/* Decorative background orbs */}
        <div
          className="pointer-events-none absolute top-24 right-[5%] h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(155, 115, 64, 0.15), transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-24 left-[5%] h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(26, 29, 58, 0.3), transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <InnaraLogo variant="light" size="md" />
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-playfair text-3xl font-medium">Accept Your Invitation</h1>
            <p className="text-muted-foreground">Set up your password to join the team</p>
          </div>

          {/* Form card */}
          <div className="glass-card-dark relative p-6 sm:p-8">
            <BorderBeam size={180} duration={12} />
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  name="email"
                  value={emailParam}
                  readOnly
                  disabled
                  className="h-11 rounded-xl border-white/10 bg-white/5 text-muted-foreground"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="invite-password">Password</Label>
                <div className="relative">
                  <Input
                    id="invite-password"
                    type={showPassword ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    required
                    minLength={8}
                    disabled={isLoading}
                    aria-invalid={passwordError ? true : undefined}
                    aria-describedby={passwordError ? "invite-password-error" : undefined}
                    className="h-11 rounded-xl border-white/10 bg-white/5 pr-11 text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="invite-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="invite-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    required
                    minLength={8}
                    disabled={isLoading}
                    aria-invalid={passwordError ? true : undefined}
                    aria-describedby={passwordError ? "invite-password-error" : undefined}
                    className="h-11 rounded-xl border-white/10 bg-white/5 pr-11 text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Validation error */}
              {passwordError && (
                <p
                  id="invite-password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {passwordError}
                </p>
              )}

              <GlassButton
                type="submit"
                variant="solid"
                disabled={isLoading}
                className="h-11 w-full rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Activating account...
                  </>
                ) : (
                  "Activate Account"
                )}
              </GlassButton>
            </form>
          </div>

          {/* Already have an account */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/staff/login"
              className="font-semibold text-bronze hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
