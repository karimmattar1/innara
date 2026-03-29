"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InnaraLogo } from "@/components/innara/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail } from "lucide-react";

export default function GuestRegisterPage(): React.ReactElement {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setIsEmailSent(true);
    setIsLoading(false);
  };

  // Success state: email confirmation sent
  if (isEmailSent) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div className="gradient-bg" />
        <div className="gradient-orb-1" />
        <div className="gradient-orb-3" />

        <header className="mobile-header px-5 py-4 flex items-center gap-4 relative z-10">
          <Link
            href="/auth/guest/login"
            className="p-2 -ml-2 rounded-xl hover:bg-muted/50 transition-colors"
            aria-label="Go to login"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <InnaraLogo size="sm" />
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-10 relative z-10">
          <div className="w-full max-w-sm">
            <div className="glass-card p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-medium">Check Your Email</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link in your email to activate your account.
              </p>
              <p className="text-muted-foreground text-xs">
                Didn&apos;t receive the email? Check your spam folder.
              </p>
              <Link
                href="/auth/guest/login"
                className="inline-block mt-4 text-sm text-bronze font-semibold hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="gradient-bg" />
      <div className="gradient-orb-2" />
      <div className="gradient-orb-3" />

      {/* Header */}
      <header className="mobile-header px-5 py-4 flex items-center gap-4 relative z-10">
        <Link
          href="/auth/guest/login"
          className="p-2 -ml-2 rounded-xl hover:bg-muted/50 transition-colors"
          aria-label="Go back to login"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <InnaraLogo size="sm" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-5 py-10 relative z-10">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Join Innara for seamless hotel services
            </p>
          </div>

          {/* Registration form */}
          <form
            onSubmit={handleSubmit}
            className="glass-card p-6 space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="h-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-12 pr-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-12 pr-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Footer link */}
          <p className="text-center mt-8 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/guest/login"
              className="text-bronze font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
