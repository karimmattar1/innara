"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InnaraLogo } from "@/components/innara/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/staff/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    setEmailSent(true);
    setIsLoading(false);
  }

  return (
    <div className="dark">
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
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

          {emailSent ? (
            /* Success state */
            <div className="glass-card-dark p-6 text-center sm:p-8">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-bronze/10">
                <Mail className="size-6 text-bronze" />
              </div>
              <h1 className="mb-2 text-xl font-medium">Check Your Email</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                We sent a password reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>. Check your
                inbox and follow the link to reset your password.
              </p>
              <Link href="/auth/staff/login">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-medium">Forgot Password</h1>
                <p className="text-muted-foreground">
                  Enter your email and we will send you a reset link
                </p>
              </div>

              <div className="glass-card-dark p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="staff@hotel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full rounded-xl bg-bronze text-sm font-semibold text-navy hover:bg-bronze-light active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link
                  href="/auth/staff/login"
                  className="inline-flex items-center gap-1 font-semibold text-bronze hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
