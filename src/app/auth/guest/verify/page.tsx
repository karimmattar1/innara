"use client";

import { useState } from "react";
import { InnaraLogo } from "@/components/innara/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Mail, ArrowRight } from "lucide-react";
import {
  verifyBookingReference,
  sendGuestMagicLink,
} from "@/app/actions/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: Step }): React.ReactElement {
  const steps = [1, 2, 3] as const;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === current
                ? "bg-[#1a1d3a] text-white"
                : step < current
                  ? "bg-[#9B7340] text-white"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step < current ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              step
            )}
          </div>
          {step < 3 && (
            <div
              className={`w-8 h-0.5 transition-colors ${
                step < current ? "bg-[#9B7340]" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GuestVerifyPage(): React.ReactElement {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 fields
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [lastName, setLastName] = useState("");

  // Carried forward from step 1
  const [bookingId, setBookingId] = useState("");
  const [hotelId, setHotelId] = useState("");

  // Step 2 fields
  const [email, setEmail] = useState("");

  // -------------------------------------------------------------------------
  // Step 1: Verify booking reference
  // -------------------------------------------------------------------------

  const handleVerifyBooking = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (!confirmationNumber.trim() || !lastName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    const result = await verifyBookingReference(
      confirmationNumber.trim(),
      lastName.trim(),
    );

    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Verification failed");
      return;
    }

    setBookingId(result.bookingId!);
    setHotelId(result.hotelId!);
    setStep(2);
  };

  // -------------------------------------------------------------------------
  // Step 2: Send magic link
  // -------------------------------------------------------------------------

  const handleSendMagicLink = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);

    const result = await sendGuestMagicLink(email.trim(), bookingId, hotelId);

    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to send magic link");
      return;
    }

    toast.success("Magic link sent!");
    setStep(3);
  };

  // -------------------------------------------------------------------------
  // Step 3: Resend magic link
  // -------------------------------------------------------------------------

  const handleResend = async (): Promise<void> => {
    setIsLoading(true);

    const result = await sendGuestMagicLink(email.trim(), bookingId, hotelId);

    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to resend magic link");
      return;
    }

    toast.success("Magic link resent!");
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex-1 flex flex-col px-5 py-8">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <InnaraLogo size="sm" />
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step 1: Enter Booking Reference */}
      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#1a1d3a]">
              Verify Your Booking
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your booking confirmation number and last name to get
              started.
            </p>
          </div>

          <form
            onSubmit={handleVerifyBooking}
            className="glass-card p-6 space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="confirmation-number" className="text-sm font-medium">
                Confirmation Number
              </Label>
              <Input
                id="confirmation-number"
                type="text"
                placeholder="e.g. INN-2024-ABC123"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                required
                autoComplete="off"
                className="h-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="last-name"
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="h-12 rounded-xl border-border/60 bg-white/90 backdrop-blur-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Booking
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 2: Enter Email */}
      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1a1d3a]">
              Booking Confirmed
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your email address and we&apos;ll send you a secure sign-in
              link.
            </p>
          </div>

          <form
            onSubmit={handleSendMagicLink}
            className="glass-card p-6 space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Magic Link
                  <Mail className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 3: Check Email */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center">
          <div className="glass-card p-8 text-center max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-[#1a1d3a]/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#1a1d3a]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1a1d3a]">
              Check Your Email
            </h1>
            <p className="text-muted-foreground mt-3 text-sm">
              We&apos;ve sent a magic link to
            </p>
            <p className="font-medium text-[#1a1d3a] mt-1">{email}</p>
            <p className="text-muted-foreground mt-3 text-sm">
              Click the link in your email to sign in and access your stay.
            </p>

            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-3">
                Didn&apos;t receive the email? Check your spam folder or try
                again.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleResend}
                className="h-10 rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend Magic Link"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
