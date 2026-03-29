import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia" as Stripe.LatestApiVersion,
});

// Service-role client bypasses RLS — required for webhook writes
// (subscriptions table: only service_role can INSERT/UPDATE)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    Sentry.captureException(err, {
      tags: { handler: "stripe-webhook", stage: "signature-verification" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Acknowledge unhandled event types — do not return non-2xx
        break;
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { handler: "stripe-webhook", stage: "event-processing" },
      extra: { eventType: event.type, eventId: event.id },
    });
    // Return 200 to prevent Stripe retry storms for logic errors.
    // Failures are tracked via Sentry; the webhook can be replayed from
    // the Stripe dashboard after the underlying issue is resolved.
    return NextResponse.json({ received: true, error: "processing_failed" });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Helpers — extract period from subscription items (Stripe v21+ API)
// ---------------------------------------------------------------------------

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const item = subscription.items?.data?.[0];
  if (!item) return { start: null, end: null };
  return {
    start: item.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    end: item.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
  };
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const hotelId = session.metadata?.hotel_id;
  if (!hotelId) {
    throw new Error(
      `checkout.session.completed missing hotel_id metadata — session: ${session.id}`,
    );
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) {
    throw new Error(
      `checkout.session.completed has no subscription — session: ${session.id}`,
    );
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const plan = mapStripePlanFromSubscription(subscription);
  const period = getSubscriptionPeriod(subscription);

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      hotel_id: hotelId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan,
      status: mapStripeStatus(subscription.status),
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "hotel_id" },
  );

  if (error) {
    throw new Error(
      `Failed to upsert subscription after checkout: ${error.message}`,
    );
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const hotelId = subscription.metadata?.hotel_id;
  if (!hotelId) {
    await updateSubscriptionByStripeId(subscription);
    return;
  }

  await upsertSubscription(hotelId, subscription);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    throw new Error(
      `Failed to mark subscription cancelled: ${error.message}`,
    );
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  // In Stripe v21+, subscription ID is accessed via parent details
  const subscriptionId = extractSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    throw new Error(
      `Failed to set subscription to past_due: ${error.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice,
): string | null {
  // Stripe v21+ uses parent.subscription_details.subscription
  const parent = invoice.parent as
    | { subscription_details?: { subscription?: string | null } }
    | null
    | undefined;
  return parent?.subscription_details?.subscription ?? null;
}

async function upsertSubscription(
  hotelId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  const plan = mapStripePlanFromSubscription(subscription);
  const period = getSubscriptionPeriod(subscription);

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      hotel_id: hotelId,
      stripe_subscription_id: subscription.id,
      plan,
      status: mapStripeStatus(subscription.status),
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "hotel_id" },
  );

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }
}

async function updateSubscriptionByStripeId(
  subscription: Stripe.Subscription,
): Promise<void> {
  const plan = mapStripePlanFromSubscription(subscription);
  const period = getSubscriptionPeriod(subscription);

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      plan,
      status: mapStripeStatus(subscription.status),
      current_period_start: period.start,
      current_period_end: period.end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    throw new Error(
      `Failed to update subscription by stripe ID: ${error.message}`,
    );
  }
}

type LocalStatus = "trialing" | "active" | "past_due" | "cancelled" | "unpaid";

function mapStripeStatus(status: Stripe.Subscription.Status): LocalStatus {
  const statusMap: Record<Stripe.Subscription.Status, LocalStatus> = {
    active: "active",
    past_due: "past_due",
    canceled: "cancelled",
    incomplete: "unpaid",
    incomplete_expired: "cancelled",
    trialing: "trialing",
    unpaid: "unpaid",
    paused: "past_due",
  };
  return statusMap[status];
}

type Plan = "starter" | "pro" | "enterprise";

const LOOKUP_KEY_TO_PLAN: Record<string, Plan> = {
  innara_starter_monthly: "starter",
  innara_pro_monthly: "pro",
  innara_enterprise_monthly: "enterprise",
};

function mapStripePlanFromSubscription(
  subscription: Stripe.Subscription,
): Plan {
  const item = subscription.items.data[0];
  if (!item) return "starter";

  const lookupKey = item.price.lookup_key;
  if (lookupKey && lookupKey in LOOKUP_KEY_TO_PLAN) {
    return LOOKUP_KEY_TO_PLAN[lookupKey];
  }

  const metaPlan = subscription.metadata?.plan as Plan | undefined;
  if (metaPlan && ["starter", "pro", "enterprise"].includes(metaPlan)) {
    return metaPlan;
  }

  return "starter";
}
