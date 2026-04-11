"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { resolveManagerContext } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Stripe client — pinned to the version shipped with stripe@21.0.1.
// Lazy-initialized to avoid throwing during `next build` page-data collection
// when STRIPE_SECRET_KEY is absent from the build environment.
// ---------------------------------------------------------------------------

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia" as Stripe.LatestApiVersion,
  });
  return stripeClient;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_PLANS = ["starter", "pro", "enterprise"] as const;
type Plan = (typeof VALID_PLANS)[number];

const PRICE_LOOKUP_KEYS: Record<Plan, string> = {
  starter: "innara_starter_monthly",
  pro: "innara_pro_monthly",
  enterprise: "innara_enterprise_monthly",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionData {
  id: string;
  plan: "starter" | "pro" | "enterprise";
  status: "trialing" | "active" | "past_due" | "cancelled" | "unpaid";
  roomCount: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

// ---------------------------------------------------------------------------
// getSubscription
// ---------------------------------------------------------------------------

export async function getSubscription(): Promise<
  ActionResult<SubscriptionData | null>
> {
  try {
    const supabase = await createClient();
    const ctx = await resolveManagerContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id, plan, status, room_count, current_period_start, current_period_end, cancel_at_period_end",
      )
      .eq("hotel_id", ctx.hotelId)
      .maybeSingle();

    if (error) {
      return { success: false, error: "Failed to load subscription." };
    }

    if (!data) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: data.id,
        plan: data.plan as Plan,
        status: data.status as SubscriptionData["status"],
        roomCount: data.room_count ?? null,
        currentPeriodStart: data.current_period_start ?? null,
        currentPeriodEnd: data.current_period_end ?? null,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// createCheckoutSession
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  plan: Plan,
): Promise<ActionResult<{ url: string }>> {
  if (!VALID_PLANS.includes(plan)) {
    return { success: false, error: "Invalid plan selected." };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveManagerContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    // Fetch hotel name and existing Stripe customer ID in a single query
    const { data: hotel, error: hotelError } = await supabase
      .from("hotels")
      .select("id, name, subscriptions(stripe_customer_id)")
      .eq("id", ctx.hotelId)
      .single();

    if (hotelError || !hotel) {
      return { success: false, error: "Hotel not found." };
    }

    // hotels -> subscriptions is a one-to-one relationship (UNIQUE on hotel_id)
    const existingCustomerId =
      Array.isArray(hotel.subscriptions) && hotel.subscriptions.length > 0
        ? (hotel.subscriptions[0] as { stripe_customer_id: string | null })
            .stripe_customer_id
        : null;

    // Get or create Stripe customer
    let customerId = existingCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        name: hotel.name,
        metadata: {
          hotel_id: ctx.hotelId,
        },
      });
      customerId = customer.id;
    }

    // Resolve price ID from lookup key
    const prices = await getStripe().prices.list({
      lookup_keys: [PRICE_LOOKUP_KEYS[plan]],
      limit: 1,
    });

    const price = prices.data[0];
    if (!price) {
      return {
        success: false,
        error: "Pricing not available for this plan. Please contact support.",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${appUrl}/manager/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/manager/billing`,
      metadata: {
        hotel_id: ctx.hotelId,
        hotel_name: hotel.name,
        plan,
      },
    });

    if (!session.url) {
      return { success: false, error: "Failed to create checkout session." };
    }

    return { success: true, data: { url: session.url } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// createBillingPortalSession
// ---------------------------------------------------------------------------

export async function createBillingPortalSession(): Promise<
  ActionResult<{ url: string }>
> {
  try {
    const supabase = await createClient();
    const ctx = await resolveManagerContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("hotel_id", ctx.hotelId)
      .maybeSingle();

    if (subError) {
      return { success: false, error: "Failed to load subscription." };
    }

    if (!subscription?.stripe_customer_id) {
      return {
        success: false,
        error: "No active subscription found. Please subscribe first.",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/manager/billing`,
    });

    return { success: true, data: { url: portalSession.url } };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// cancelSubscription
// ---------------------------------------------------------------------------

export async function cancelSubscription(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const ctx = await resolveManagerContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("hotel_id", ctx.hotelId)
      .maybeSingle();

    if (subError) {
      return { success: false, error: "Failed to load subscription." };
    }

    if (!subscription?.stripe_subscription_id) {
      return { success: false, error: "No active subscription found." };
    }

    if (
      subscription.status === "cancelled" ||
      subscription.status === "unpaid"
    ) {
      return {
        success: false,
        error: "Subscription is already cancelled or unpaid.",
      };
    }

    await getStripe().subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
