"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MenuItemData } from "@/types/domain";

interface MenuItemCardProps {
  item: MenuItemData;
  onAdd: (item: MenuItemData) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const imageUrl = item.imageUrl?.startsWith('http') ? item.imageUrl : null;

  return (
    <div className="menu-item-card relative">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-muted to-secondary">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {item.categoryName?.toLowerCase().includes('drink') ? '\uD83E\uDD64' :
             item.categoryName?.toLowerCase().includes('dessert') ? '\uD83C\uDF70' : '\uD83C\uDF7D\uFE0F'}
          </div>
        )}
        {item.isPopular && (
          <Badge className="absolute top-1 left-1 text-[10px] px-2 py-0.5">
            Popular
          </Badge>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-base font-bold text-foreground">${item.price}</p>
          {item.allergens && item.allergens.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({item.allergens.join(', ')})
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onAdd(item)}
        className="add-button flex-shrink-0"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
