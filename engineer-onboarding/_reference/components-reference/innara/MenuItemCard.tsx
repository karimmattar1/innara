import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuItemData } from "@/hooks/useMenuItems";

// Import food images for fallback
import caesarSaladImg from "@/assets/food-caesar-salad.jpg";
import margheritaPizzaImg from "@/assets/food-margherita-pizza.jpg";
import grilledSalmonImg from "@/assets/food-grilled-salmon.jpg";

const foodImages: Record<string, string> = {
  'caesar-salad': caesarSaladImg,
  'margherita-pizza': margheritaPizzaImg,
  'grilled-salmon': grilledSalmonImg,
  'caesar_salad': caesarSaladImg,
  'margherita_pizza': margheritaPizzaImg,
  'grilled_salmon': grilledSalmonImg,
};

interface MenuItemCardProps {
  item: MenuItemData;
  onAdd: (item: MenuItemData) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  // Try to get image from DB url, then from local mapping
  const imageUrl = item.image_url?.startsWith('http') 
    ? item.image_url 
    : item.image_url && foodImages[item.image_url];
  
  return (
    <div className="menu-item-card relative">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-muted to-secondary">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {item.category_name?.toLowerCase().includes('drink') ? '🥤' : 
             item.category_name?.toLowerCase().includes('dessert') ? '🍰' : '🍽️'}
          </div>
        )}
        {item.is_popular && (
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
