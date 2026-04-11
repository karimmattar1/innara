"use server";

import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAdminContext } from "@/lib/auth-context";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlanTier {
  id: string;
  name: string;
  displayName: string;
  monthlyPrice: number;
  features: string[];
  maxRooms: number | null;
  maxStaff: number | null;
  isActive: boolean;
  hotelCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// getPlans — list all plan tiers with hotel counts
// ---------------------------------------------------------------------------

export async function getPlans(): Promise<ActionResult<PlanTier[]>> {
  try {
    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();

    // Fetch plans from subscriptions to derive unique plans
    // Since there's no dedicated plans table yet, we derive from existing data
    // and use a settings-based approach stored in a plans JSONB on a config row
    // Get subscription counts per plan
    const { data: subs, error: subsError } = await adminClient
      .from("subscriptions")
      .select("plan, hotel_id");

    if (subsError) {
      Sentry.captureException(subsError, {
        tags: { action: "getPlans", stage: "subs-query" },
      });
      return { success: false, error: "Failed to load subscription data." };
    }

    const planCounts = new Map<string, number>();
    for (const sub of subs ?? []) {
      const current = planCounts.get(sub.plan) ?? 0;
      planCounts.set(sub.plan, current + 1);
    }

    // Default plan tiers (static configuration until dedicated plans table exists)
    const defaultPlans: PlanTier[] = [
      {
        id: "plan-starter",
        name: "starter",
        displayName: "Starter",
        monthlyPrice: 99,
        features: [
          "Up to 50 rooms",
          "Basic analytics",
          "Email support",
          "Guest portal",
          "Service requests",
        ],
        maxRooms: 50,
        maxStaff: 10,
        isActive: true,
        hotelCount: planCounts.get("starter") ?? 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "plan-pro",
        name: "pro",
        displayName: "Pro",
        monthlyPrice: 249,
        features: [
          "Up to 200 rooms",
          "Advanced analytics",
          "Priority support",
          "AI concierge",
          "PMS integration",
          "Custom branding",
        ],
        maxRooms: 200,
        maxStaff: 50,
        isActive: true,
        hotelCount: planCounts.get("pro") ?? 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "plan-enterprise",
        name: "enterprise",
        displayName: "Enterprise",
        monthlyPrice: 599,
        features: [
          "Unlimited rooms",
          "Full analytics suite",
          "Dedicated account manager",
          "AI concierge with custom training",
          "PMS integration",
          "White-label branding",
          "SLA guarantees",
          "API access",
        ],
        maxRooms: null,
        maxStaff: null,
        isActive: true,
        hotelCount: planCounts.get("enterprise") ?? 0,
        createdAt: new Date().toISOString(),
      },
    ];

    return { success: true, data: defaultPlans };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "getPlans" } });
    return { success: false, error: "Internal server error." };
  }
}

// ---------------------------------------------------------------------------
// updateHotelPlan — change a hotel's subscription plan
// ---------------------------------------------------------------------------

export async function updateHotelPlan(
  hotelId: string,
  newPlan: string,
): Promise<ActionResult<void>> {
  try {
    const parsedId = z.string().uuid().safeParse(hotelId);
    const parsedPlan = z.enum(["starter", "pro", "enterprise"]).safeParse(newPlan);

    if (!parsedId.success) {
      return { success: false, error: "Invalid hotel ID" };
    }
    if (!parsedPlan.success) {
      return { success: false, error: "Invalid plan. Must be starter, pro, or enterprise." };
    }

    const supabase = await createClient();
    const ctx = await resolveAdminContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };

    const adminClient = createAdminClient();

    // Get current subscription
    const { data: currentSub, error: fetchError } = await adminClient
      .from("subscriptions")
      .select("id, plan, status")
      .eq("hotel_id", parsedId.data)
      .maybeSingle();

    if (fetchError) {
      Sentry.captureException(fetchError, {
        tags: { action: "updateHotelPlan", stage: "fetch" },
      });
      return { success: false, error: "Failed to load subscription." };
    }

    if (!currentSub) {
      return { success: false, error: "Hotel has no subscription. Create one via billing first." };
    }

    if (currentSub.plan === parsedPlan.data) {
      return { success: false, error: "Hotel is already on this plan." };
    }

    const oldPlan = currentSub.plan;

    const { error: updateError } = await adminClient
      .from("subscriptions")
      .update({
        plan: parsedPlan.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentSub.id);

    if (updateError) {
      Sentry.captureException(updateError, {
        tags: { action: "updateHotelPlan", stage: "update" },
      });
      return { success: false, error: "Failed to update plan." };
    }

    await logAudit(adminClient, {
      hotelId: parsedId.data,
      actorId: ctx.userId,
      action: "subscription.plan_changed",
      tableName: "subscriptions",
      recordId: currentSub.id,
      oldData: { plan: oldPlan },
      newData: { plan: parsedPlan.data },
    });

    return { success: true };
  } catch (err) {
    Sentry.captureException(err, { tags: { action: "updateHotelPlan" } });
    return { success: false, error: "Internal server error." };
  }
}
