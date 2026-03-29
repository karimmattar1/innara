"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  X,
  Building2,
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { EmptyCartState } from "@/components/innara/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CartItem } from "@/types/domain";

// ---------------------------------------------------------------------------
// Placeholder server action (real action wired in a later ticket)
// ---------------------------------------------------------------------------

interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

async function submitOrder(input: {
  items: CartItem[];
  notes: string;
  tip: number;
  paymentMethod: string;
}): Promise<CreateOrderResult> {
  // Placeholder — real action: createOrder(input) from src/app/actions/orders.ts
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { success: true, orderId: `ORD-${Date.now().toString(36).toUpperCase()}` };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAX_RATE = 0.1;

const PAYMENT_METHODS = [
  {
    id: "room",
    label: "Charge to Room",
    description: "Added to your room bill at checkout",
    icon: Building2,
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Secure payment processed at delivery",
    icon: CreditCard,
  },
  {
    id: "cash",
    label: "Cash",
    description: "Pay with cash upon delivery",
    icon: Wallet,
  },
] as const;

const TIP_PRESETS = [
  { label: "No tip", amount: 0 },
  { label: "$2", amount: 2 },
  { label: "$5", amount: 5 },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoomServiceCheckoutPage(): React.ReactElement {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<string>("room");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTip, setCustomTip] = useState("");
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  // Load cart from sessionStorage (set by menu page on navigation)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("room-service-cart");
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCart(parsed as CartItem[]);
        }
      }
    } catch {
      // Corrupted sessionStorage — start with empty cart
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cart mutations
  // ---------------------------------------------------------------------------

  function updateQuantity(menuItemId: string, delta: number) {
    setCart((prev) => {
      const item = prev.find((c) => c.menuItemId === menuItemId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        const next = prev.filter((c) => c.menuItemId !== menuItemId);
        sessionStorage.setItem("room-service-cart", JSON.stringify(next));
        return next;
      }
      const next = prev.map((c) =>
        c.menuItemId === menuItemId ? { ...c, quantity: newQty } : c
      );
      sessionStorage.setItem("room-service-cart", JSON.stringify(next));
      return next;
    });
  }

  function removeItem(menuItemId: string) {
    setCart((prev) => {
      const next = prev.filter((c) => c.menuItemId !== menuItemId);
      sessionStorage.setItem("room-service-cart", JSON.stringify(next));
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Totals
  // ---------------------------------------------------------------------------

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const effectiveTip = isCustomTip
    ? parseFloat(customTip) || 0
    : tipAmount;
  const grandTotal = subtotal + tax + effectiveTip;

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handlePlaceOrder() {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitOrder({
        items: cart,
        notes,
        tip: effectiveTip,
        paymentMethod: selectedPayment,
      });

      if (result.success && result.orderId) {
        sessionStorage.removeItem("room-service-cart");
        setConfirmedOrderId(result.orderId);
      } else {
        setSubmitError(result.error ?? "Failed to place order. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  if (confirmedOrderId) {
    return (
      <GuestPageShell>
        <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[#1a1d3a]">Order Placed!</h2>
            <p className="text-muted-foreground text-sm">
              Your order <span className="font-semibold text-[#1a1d3a]">{confirmedOrderId}</span> has been received.
            </p>
            <p className="text-muted-foreground text-sm">
              Estimated delivery: <span className="font-medium">25–35 minutes</span>
            </p>
          </div>
          <div className="glass-card p-4 text-sm text-muted-foreground text-left w-full">
            <p>Our team is preparing your order. You&apos;ll receive a notification when it&apos;s on its way.</p>
          </div>
          <Button
            className="w-full"
            onClick={() => router.push("/guest/requests")}
          >
            Track My Order
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/guest/room-service")}
          >
            Order More
          </Button>
        </div>
      </GuestPageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty cart
  // ---------------------------------------------------------------------------

  if (cart.length === 0 && !isSubmitting) {
    return (
      <GuestPageShell>
        <EmptyCartState onBrowse={() => router.push("/guest/room-service")} />
      </GuestPageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Main checkout view
  // ---------------------------------------------------------------------------

  return (
    <GuestPageShell
      header={
        <div className="px-5 pt-2 pb-1">
          <h1 className="text-2xl font-semibold text-[#1a1d3a]">Your Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and confirm your order</p>
        </div>
      }
      footer={
        <div className="space-y-2 pt-1">
          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
          <Button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isSubmitting}
            size="lg"
            className="w-full text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Placing Order...
              </span>
            ) : (
              `Place Order · $${grandTotal.toFixed(2)}`
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Estimated delivery 25–35 min · We&apos;ll notify you when it&apos;s on its way
          </p>
        </div>
      }
    >
      {/* Cart items */}
      <section>
        <SectionHeader title="Order Items" />
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.menuItemId}
              className="glass-card p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ${item.price.toFixed(2)} each
                </p>
              </div>
              {/* Qty controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => updateQuantity(item.menuItemId, -1)}
                  aria-label={`Decrease quantity of ${item.name}`}
                  className="w-7 h-7 rounded-full border border-[#1a1d3a]/20 flex items-center justify-center hover:bg-secondary/40 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                  className="w-7 h-7 rounded-full bg-[#1a1d3a] text-white flex items-center justify-center hover:bg-[#1a1d3a]/90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Line total */}
              <p className="font-semibold text-sm w-14 text-right text-[#1a1d3a]">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              {/* Remove */}
              <button
                onClick={() => removeItem(item.menuItemId)}
                aria-label={`Remove ${item.name} from order`}
                className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Special instructions */}
      <section>
        <SectionHeader title="Special Instructions" />
        <Textarea
          placeholder="Allergies, dietary requirements, special requests..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          className="resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{notes.length}/500</p>
      </section>

      {/* Tip */}
      <section>
        <SectionHeader title="Add a Tip" />
        <div className="flex gap-2 flex-wrap">
          {TIP_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setIsCustomTip(false);
                setTipAmount(preset.amount);
                setCustomTip("");
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                !isCustomTip && tipAmount === preset.amount
                  ? "bg-[#1a1d3a] text-white border-[#1a1d3a]"
                  : "border-border/50 text-foreground hover:bg-secondary/40"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => {
              setIsCustomTip(true);
              setTipAmount(0);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              isCustomTip
                ? "bg-[#1a1d3a] text-white border-[#1a1d3a]"
                : "border-border/50 text-foreground hover:bg-secondary/40"
            }`}
          >
            Custom
          </button>
        </div>
        {isCustomTip && (
          <div className="mt-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.50"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-4 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Custom tip amount"
            />
          </div>
        )}
      </section>

      {/* Payment method */}
      <section>
        <SectionHeader title="Payment Method" />
        <div className="space-y-2">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedPayment === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                  isSelected
                    ? "ring-2 ring-[#1a1d3a] bg-[#1a1d3a]/5 border-[#1a1d3a]/20"
                    : "glass-card border-border/30 hover:bg-secondary/30"
                }`}
                aria-pressed={isSelected}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-[#1a1d3a] text-white" : "bg-secondary/60"
                  }`}
                >
                  <method.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-[#1a1d3a]" : "border-border/50"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#1a1d3a]" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Order summary */}
      <section>
        <SectionHeader title="Summary" />
        <div className="glass-card p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {effectiveTip > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tip</span>
              <span>${effectiveTip.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-border/30 pt-3 flex justify-between font-semibold text-base">
            <span>Total</span>
            <span className="text-[#1a1d3a]">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>
    </GuestPageShell>
  );
}
