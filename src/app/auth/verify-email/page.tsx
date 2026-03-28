"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { InnaraLogo } from "@/components/innara/Logo";
import { AppBackground } from "@/components/innara/AppBackground";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function VerifyEmailContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  // Error state
  if (error) {
    const errorMessages: Record<string, string> = {
      verification_failed:
        "We couldn't verify your email. The link may have expired or already been used.",
      invalid_link:
        "This verification link is invalid. Please request a new one.",
    };

    const errorDescription =
      errorMessages[error] ??
      "An unexpected error occurred during verification. Please try again.";

    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-medium">Verification Failed</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {errorDescription}
        </p>
        <div className="pt-2">
          <Link href="/auth/guest/login">
            <Button className="w-full h-12 rounded-xl text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="text-2xl font-medium">Email Verified!</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your email has been verified. You can now access your hotel
          experience.
        </p>
        <div className="pt-2">
          <Link href="/guest">
            <Button className="w-full h-12 rounded-xl text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Continue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default/loading state — no params yet
  return (
    <div className="glass-card p-8 text-center space-y-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
      <h1 className="text-2xl font-medium">Verifying your email...</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Please wait while we confirm your email address.
      </p>
    </div>
  );
}

export default function VerifyEmailPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AppBackground />

      <header className="mobile-header px-5 py-4 flex items-center gap-4 relative z-10">
        <InnaraLogo size="sm" />
      </header>

      <main
        className="flex-1 flex items-center justify-center px-5 py-10 relative z-10"
        role="main"
      >
        <div className="w-full max-w-sm">
          <Suspense
            fallback={
              <div className="glass-card p-8 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
                <h1 className="text-2xl font-medium">
                  Verifying your email...
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Please wait while we confirm your email address.
                </p>
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
