"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  BedDouble,
  Receipt,
  ClipboardList,
  Star,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Placeholder data — real data from stay context server action in a later ticket
// ---------------------------------------------------------------------------

const PLACEHOLDER_STAY = {
  guestName: "Alex Johnson",
  roomNumber: "412",
  roomType: "Deluxe King Suite",
  checkIn: "Mar 27, 2026",
  checkOut: "Mar 31, 2026",
  nightsCount: 4,
} as const;

// Placeholder outstanding charges — real data from billing server action later
const PLACEHOLDER_CHARGES = [
  { label: "Room Rate (4 nights)", amount: 1420.0 },
  { label: "Room Service", amount: 86.5 },
  { label: "Spa Services", amount: 180.0 },
  { label: "Minibar", amount: 32.0 },
  { label: "Taxes & Fees (12%)", amount: 206.22 },
] as const;

const TOTAL_CHARGES = PLACEHOLDER_CHARGES.reduce((sum, c) => sum + c.amount, 0);

// Placeholder pending requests count — real data from requests action later
const PENDING_REQUESTS_COUNT = 0;

// ---------------------------------------------------------------------------
// Goodbye state
// ---------------------------------------------------------------------------

function GoodbyeState({ guestName }: { guestName: string }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-[#1a1d3a]/5 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-[#1a1d3a]" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-[#1a1d3a]">
          Safe Travels, {guestName.split(" ")[0]}!
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          We hope you had a wonderful stay. Your receipt has been sent to your email.
        </p>
      </div>
      <div className="glass-card p-4 w-full space-y-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>Checkout complete</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>Receipt sent to your email</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span>Room key cards have been deactivated</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        We look forward to welcoming you back to{" "}
        <span className="font-medium text-[#1a1d3a]">The Grand Innara</span>.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GuestCheckoutPage(): React.ReactElement {
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleExpressCheckout() {
    if (isCheckingOut) return;
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // Placeholder — real checkout logic (mark booking as checked_out, generate receipt) comes in a later ticket
      await new Promise((resolve) => setTimeout(resolve, 1400));
      setCheckedOut(true);
    } catch {
      setCheckoutError("Unable to process checkout. Please contact the front desk.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (checkedOut) {
    return (
      <GuestPageShell>
        <GoodbyeState guestName={PLACEHOLDER_STAY.guestName} />
      </GuestPageShell>
    );
  }

  return (
    <GuestPageShell
      header={
        <div className="px-5 pt-2 pb-1">
          <h1 className="text-2xl font-semibold text-[#1a1d3a]">Check Out</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review your stay before you go
          </p>
        </div>
      }
      footer={
        <div className="space-y-2 pt-1">
          {checkoutError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}
          <Button
            size="lg"
            className="w-full text-base"
            onClick={handleExpressCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Checkout...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Express Check Out
              </span>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By checking out you confirm all charges are correct. The front desk is available for assistance.
          </p>
        </div>
      }
    >
      {/* Stay summary */}
      <section>
        <SectionHeader title="Your Stay" />
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9B7340]/10 flex items-center justify-center flex-shrink-0">
              <BedDouble className="w-5 h-5 text-[#9B7340]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1d3a]">
                Room {PLACEHOLDER_STAY.roomNumber} &mdash; {PLACEHOLDER_STAY.roomType}
              </p>
              <p className="text-xs text-muted-foreground">{PLACEHOLDER_STAY.nightsCount} nights</p>
            </div>
          </div>
          <div className="border-t border-border/20 pt-3 grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-[#9B7340] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                  Checked In
                </p>
                <p className="text-sm font-medium text-[#1a1d3a]">{PLACEHOLDER_STAY.checkIn}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-[#9B7340] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                  Checking Out
                </p>
                <p className="text-sm font-medium text-[#1a1d3a]">{PLACEHOLDER_STAY.checkOut}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outstanding charges */}
      <section>
        <SectionHeader title="Outstanding Charges" />
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-[#9B7340]" />
            <p className="text-xs text-muted-foreground">
              Estimated total — final amount confirmed at checkout
            </p>
          </div>
          {PLACEHOLDER_CHARGES.map((charge, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{charge.label}</span>
              <span className="font-medium">${charge.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border/30 pt-3 flex justify-between font-semibold text-base">
            <span>Estimated Total</span>
            <span className="text-[#1a1d3a]">${TOTAL_CHARGES.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Pending requests warning */}
      {PENDING_REQUESTS_COUNT > 0 && (
        <section>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {PENDING_REQUESTS_COUNT} pending request{PENDING_REQUESTS_COUNT > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                You have active requests. These will be cancelled upon checkout.
              </p>
            </div>
            <button
              onClick={() => router.push("/guest/requests")}
              className="flex-shrink-0 text-xs font-medium text-amber-700 underline"
            >
              View
            </button>
          </div>
        </section>
      )}

      {/* Feedback prompt */}
      <section>
        <div className="glass-card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9B7340]/10 flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-[#9B7340]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a1d3a]">Share Your Experience</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Before you go, let us know how your stay was.
            </p>
          </div>
          <button
            onClick={() => router.push("/guest/feedback")}
            className="flex-shrink-0 text-sm font-medium text-[#9B7340] hover:text-[#7d5c33] transition-colors"
            aria-label="Go to feedback form"
          >
            Rate Stay
          </button>
        </div>
      </section>

      {/* Pending requests empty state informational */}
      {PENDING_REQUESTS_COUNT === 0 && (
        <section>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">All requests completed</p>
              <p className="text-xs text-green-700 mt-0.5">
                No outstanding service requests on your account.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Contact front desk */}
      <section className="pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Questions about your bill? Call the front desk: ext. 0</span>
        </div>
      </section>
    </GuestPageShell>
  );
}
