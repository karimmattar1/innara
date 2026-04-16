import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInnaraStore } from "@/store/InnaraStoreProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useDataMode } from "@/data/DataModeProvider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, X, CreditCard, Building2, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { CartItem } from "@/hooks/useOrders";

interface RoomServiceCheckoutSheetProps {
  cart: CartItem[];
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  roomNumber: string;
  hotelId: string;
  stayId?: string;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  onOrderPlaced: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS = [
  { id: "room", label: "Charge to Room", description: "Added to your room bill", icon: Building2 },
  { id: "card", label: "Credit Card", description: "Visa ending in •••• 4242", icon: CreditCard },
  { id: "wallet", label: "Digital Wallet", description: "Apple Pay / Google Pay", icon: Wallet },
];

export function RoomServiceCheckoutSheet({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  roomNumber,
  hotelId,
  orderNotes,
  onOrderNotesChange,
  onOrderPlaced,
  isOpen,
  onOpenChange,
}: RoomServiceCheckoutSheetProps) {
  const navigate = useNavigate();
  const { dispatch: storeDispatch } = useInnaraStore();
  const { user, profile } = useAuth();
  const { mode } = useDataMode();
  const [selectedPayment, setSelectedPayment] = useState("room");
  const [isOrdering, setIsOrdering] = useState(false);

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const tax = cartTotal * 0.05;
  const grandTotal = cartTotal + tax;

  const handleCheckout = async () => {
    setIsOrdering(true);
    const itemNames = cart.map(c => `${c.name} x${c.quantity}`).join(', ');
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const guestName = profile?.full_name || 'Guest';
    const itemLabel = itemNames.length > 60 ? itemNames.slice(0, 57) + '...' : itemNames;
    const desc = orderNotes || `Room service order — $${grandTotal.toFixed(2)}`;

    const paymentMethod = selectedPayment; // 'room' | 'card' | 'wallet'
    const chargeAmountCents = Math.round(grandTotal * 100);

    // Pilot mode: use repo then dispatch to store for cross-portal sync
    if (mode === 'pilot') {
      try {
        const { getRequestRepo } = await import('@/data/repos/requestRepo');
        const repo = await getRequestRepo();
        const result = await repo.createRequest({
          hotelId,
          userId: user?.id || 'demo-guest-001',
          guestName,
          roomNumber,
          category: 'room_service' as any,
          item: itemLabel,
          description: desc,
          priority: 'medium' as any,
          etaMinutes: 30,
        });
        if (result) {
          storeDispatch({
            type: 'CREATE_REQUEST',
            payload: {
              id: result.id,
              hotelId,
              userId: user?.id || 'demo-guest-001',
              guestName,
              roomNumber,
              category: 'room_service',
              item: itemLabel,
              description: desc,
              priority: 'medium',
              etaMinutes: 30,
              paymentMethod,
              chargeAmountCents,
            },
          });
        }
      } catch (err) {
        console.error('Pilot checkout failed, falling back to store:', err);
      }
    }

    // Demo mode (or pilot fallback): dispatch to store
    if (mode !== 'pilot') {
      storeDispatch({
        type: 'CREATE_REQUEST',
        payload: {
          id: requestId,
          hotelId,
          userId: user?.id || 'demo-guest-001',
          guestName,
          roomNumber,
          category: 'room_service',
          item: itemLabel,
          description: desc,
          priority: 'medium',
          etaMinutes: 30,
          paymentMethod,
          chargeAmountCents,
        },
      });
    }

    // Simulate order placement
    setTimeout(() => {
      setIsOrdering(false);
      onOrderPlaced();
      onOpenChange(false);
      toast.success("Order placed successfully!");
      navigate(`/guest/order-confirmation/order-${Date.now()}`);
    }, 1000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-between px-6"
          disabled={cart.length === 0}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>{cart.length === 0 ? "Add items to cart" : "View Cart"}</span>
          </div>
          {cartCount > 0 && (
            <Badge className="bg-white/20 text-white">
              {cartCount} · ${cartTotal.toFixed(2)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[80vh] max-h-[80vh] w-full sm:max-w-md mx-auto rounded-t-3xl overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl font-serif">Your Order</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Cart items */}
          {cart.map((item) => (
            <div key={item.menuItemId} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  ${item.price.toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full text-muted-foreground"
                  onClick={() => onRemoveItem(item.menuItemId)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="font-semibold w-16 text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          {/* Special instructions */}
          <div className="pt-2">
            <Textarea
              placeholder="Special instructions (allergies, preferences...)"
              value={orderNotes}
              onChange={(e) => onOrderNotesChange(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Payment method selection */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">
              Payment Method
            </p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedPayment === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                      isSelected
                        ? "ring-2 ring-primary bg-primary/5 border-primary/20"
                        : "glass-card border-border/30 hover:bg-secondary/30"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/60"
                      }`}
                    >
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium">{method.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-primary"
                          : "border-border/50"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Totals + Place Order */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (5%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            loading={isOrdering}
            size="lg"
            className="w-full text-lg"
          >
            {`Place Order · $${grandTotal.toFixed(2)}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Delivery to Room {roomNumber} • Estimated 25-35 min
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
