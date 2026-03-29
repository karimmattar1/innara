"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, AlertCircle } from "lucide-react";
import { GuestPageShell } from "@/components/innara/GuestPageShell";
import { MenuItemCard } from "@/components/innara/MenuItemCard";
import { EmptyState } from "@/components/innara/EmptyState";
import { LoadingState } from "@/components/innara/LoadingState";
import { SectionHeader } from "@/components/innara/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMenuCategories, getMenuItems } from "@/app/actions/menu";
import type { MenuItemData, MenuCategoryData, CartItem } from "@/types/domain";

// ---------------------------------------------------------------------------
// Map DB snake_case rows to camelCase domain types
// ---------------------------------------------------------------------------

function mapCategory(row: Record<string, unknown>): MenuCategoryData {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

function mapMenuItem(row: Record<string, unknown>): MenuItemData {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    price: row.price as number,
    categoryId: (row.category_id as string | null) ?? null,
    categoryName: (row.category_id as string) ?? undefined,
    imageUrl: (row.image_url as string | null) ?? null,
    isPopular: (row.is_popular as boolean) ?? false,
    isAvailable: (row.is_available as boolean) ?? true,
    allergens: (row.allergens as string[] | null) ?? null,
    hotelId: row.hotel_id as string,
  };
}

// ---------------------------------------------------------------------------
// Cart helpers
// ---------------------------------------------------------------------------

function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getItemQuantity(cart: CartItem[], menuItemId: string): number {
  return cart.find((c) => c.menuItemId === menuItemId)?.quantity ?? 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RoomServiceMenuPage(): React.ReactElement {
  const router = useRouter();

  const [categories, setCategories] = useState<MenuCategoryData[]>([]);
  const [allItems, setAllItems] = useState<MenuItemData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [catsResult, itemsResult] = await Promise.all([
          getMenuCategories(),
          getMenuItems(),
        ]);
        if (cancelled) return;

        if (!catsResult.success || !itemsResult.success) {
          setError(catsResult.error ?? itemsResult.error ?? "Unable to load menu.");
          return;
        }

        const allCategory: MenuCategoryData = { id: "all", name: "All", slug: "all", description: null, sortOrder: -1 };
        const cats = [allCategory, ...(catsResult.data as Record<string, unknown>[]).map(mapCategory)];
        const items = (itemsResult.data as Record<string, unknown>[]).map(mapMenuItem);

        setCategories(cats);
        setAllItems(items);
      } catch {
        if (!cancelled) setError("Unable to load menu. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // Filtered items
  const displayedItems =
    selectedCategory === "all"
      ? allItems
      : allItems.filter((item) => item.categoryId === selectedCategory);

  // Cart mutations
  const handleAddToCart = useCallback((item: MenuItemData) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  }, []);

  const handleDecrement = useCallback((menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((c) => c.menuItemId !== menuItemId);
      }
      return prev.map((c) =>
        c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  }, []);

  const cartCount = getCartCount(cart);
  const cartTotal = getCartTotal(cart);

  const headerEl = (
    <div className="px-5 pt-2 pb-1">
      <h1 className="text-2xl font-semibold text-[#1a1d3a]">Room Service</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Order from our kitchen, delivered to your door</p>
    </div>
  );

  const categoryFilterEl = (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar px-1">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setSelectedCategory(cat.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === cat.id
              ? "bg-[#1a1d3a] text-white shadow-sm"
              : "bg-white/60 text-[#1a1d3a]/70 border border-[#1a1d3a]/10 hover:bg-white/80"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );

  const floatingCartEl =
    cartCount > 0 ? (
      <button
        onClick={() => {
          // Persist cart to sessionStorage before navigating
          sessionStorage.setItem("room-service-cart", JSON.stringify(cart));
          router.push("/guest/room-service/checkout");
        }}
        className="w-full h-14 rounded-2xl bg-[#1a1d3a] hover:bg-[#1a1d3a]/90 text-white flex items-center justify-between px-5 font-medium transition-all shadow-lg"
        aria-label={`View cart: ${cartCount} items, $${cartTotal.toFixed(2)} total`}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <span>View Cart</span>
        </div>
        <Badge className="bg-white/20 text-white border-0">
          {cartCount} &middot; ${cartTotal.toFixed(2)}
        </Badge>
      </button>
    ) : null;

  if (loading) {
    return (
      <GuestPageShell
        header={headerEl}
        topSlot={null}
      >
        <LoadingState variant="skeleton" text="Loading menu..." />
        <div className="space-y-3 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
      </GuestPageShell>
    );
  }

  if (error) {
    return (
      <GuestPageShell header={headerEl}>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setLoading(true);
              getMenuItems()
                .then((result) => {
                  if (result.success && result.data) {
                    setAllItems((result.data as Record<string, unknown>[]).map(mapMenuItem));
                  } else {
                    setError(result.error ?? "Unable to load menu.");
                  }
                  setLoading(false);
                })
                .catch(() => { setError("Unable to load menu. Please try again."); setLoading(false); });
            }}
          >
            Try Again
          </Button>
        </div>
      </GuestPageShell>
    );
  }

  return (
    <GuestPageShell
      header={headerEl}
      topSlot={categoryFilterEl}
      footer={floatingCartEl}
    >
      <div className="space-y-1">
        {displayedItems.length === 0 ? (
          <EmptyState
            iconName="cart"
            title="No items in this category"
            description="Check back later or browse another category."
          />
        ) : (
          <>
            <SectionHeader
              title={
                selectedCategory === "all"
                  ? `All Items (${displayedItems.length})`
                  : `${categories.find((c) => c.id === selectedCategory)?.name ?? ""} (${displayedItems.length})`
              }
            />
            <div className="space-y-2">
              {displayedItems.map((item) => {
                const qty = getItemQuantity(cart, item.id);
                return (
                  <div key={item.id} className="glass-card p-3 flex items-center gap-3">
                    {/* Image area */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-muted to-secondary">
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {item.categoryName?.toLowerCase().includes("drink")
                          ? "\uD83E\uDD64"
                          : item.categoryName?.toLowerCase().includes("dessert")
                          ? "\uD83C\uDF70"
                          : "\uD83C\uDF7D\uFE0F"}
                      </div>
                      {item.isPopular && (
                        <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 bg-[#9B7340] text-white border-0">
                          Popular
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-snug">{item.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                      {item.allergens && item.allergens.length > 0 && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Contains: {item.allergens.join(", ")}
                        </p>
                      )}
                      <p className="text-base font-bold text-[#1a1d3a] mt-1">${item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex-shrink-0 flex items-center gap-1.5">
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAddToCart(item)}
                          aria-label={`Add ${item.name} to cart`}
                          className="w-9 h-9 rounded-full bg-[#1a1d3a] text-white flex items-center justify-center hover:bg-[#1a1d3a]/90 transition-all"
                          disabled={!item.isAvailable}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDecrement(item.id)}
                            aria-label={`Remove one ${item.name}`}
                            className="w-8 h-8 rounded-full border border-[#1a1d3a]/20 text-[#1a1d3a] flex items-center justify-center hover:bg-secondary/40 transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-[#1a1d3a]">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            aria-label={`Add another ${item.name}`}
                            className="w-8 h-8 rounded-full bg-[#1a1d3a] text-white flex items-center justify-center hover:bg-[#1a1d3a]/90 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </GuestPageShell>
  );
}
