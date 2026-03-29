"use server";

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

// ---------------------------------------------------------------------------
// getMenuCategories
// ---------------------------------------------------------------------------

export async function getMenuCategories(): Promise<ActionResult<unknown[]>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Fetch active categories ordered by sort_order
    const { data: categories, error: queryError } = await supabase
      .from("menu_categories")
      .select("id, name, slug, description, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (queryError) {
      return { success: false, error: "Unable to retrieve menu categories. Please try again." };
    }

    return { success: true, data: categories ?? [] };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getMenuItems
// ---------------------------------------------------------------------------

export async function getMenuItems(
  categoryId?: string,
): Promise<ActionResult<unknown[]>> {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Build query — optionally filter by category
    let query = supabase
      .from("menu_items")
      .select(
        "id, name, description, price, category_id, image_url, is_popular, is_available, allergens, hotel_id"
      )
      .eq("is_available", true);

    if (categoryId !== undefined) {
      query = query.eq("category_id", categoryId);
    }

    // Order: popular items first, then alphabetical
    const { data: items, error: queryError } = await query.order("is_popular", {
      ascending: false,
    }).order("name", { ascending: true });

    if (queryError) {
      return { success: false, error: "Unable to retrieve menu items. Please try again." };
    }

    return { success: true, data: items ?? [] };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
