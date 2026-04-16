import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, UtensilsCrossed, Flower2, Car,
  ConciergeBell, Plus, Check, ChevronLeft,
  ArrowRight, Clock, Compass, ClipboardList, User, ShoppingCart,
  Bed, Wrench, Shirt, ShoppingBag, Dumbbell, Coffee, MapPin, Gift, Phone
} from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { InnaraLogo } from '@/components/innara/Logo';

interface GuestDemoProps {
  isPlaying: boolean;
  onDemoEvent: (event: string, data?: any) => void;
}

type DemoView = 'concierge' | 'explore' | 'room-service' | 'checkout' | 'requests';

export function GuestDemo({ isPlaying, onDemoEvent }: GuestDemoProps) {
  const [view, setView] = useState<DemoView>('concierge');
  const [step, setStep] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Demo sequence with abort support for clean replay
  useEffect(() => {
    if (!isPlaying) {
      // Reset all state when stopped
      setView('concierge');
      setStep(0);
      setTypingText('');
      setSelectedTime('');
      setCartItems([]);
      setOrderPlaced(false);
      return;
    }

    let aborted = false;

    const wait = (ms: number) => new Promise<void>((resolve) => {
      const timer = setTimeout(() => { if (!aborted) resolve(); }, ms);
      // Store for cleanup isn't needed since aborted flag prevents further execution
    });

    const runSequence = async () => {
      await wait(1500);
      if (aborted) return;

      // Click input
      onDemoEvent('CLICK_INPUT');
      await wait(800);
      if (aborted) return;

      // Type message
      const message = 'I need my room cleaned';
      for (let i = 0; i <= message.length; i++) {
        if (aborted) return;
        setTypingText(message.substring(0, i));
        await wait(50);
      }
      await wait(400);
      if (aborted) return;

      // Click send
      onDemoEvent('CLICK_SEND');
      await wait(600);
      if (aborted) return;

      // Show message and typing
      setTypingText('');
      setStep(1);
      await wait(1500);
      if (aborted) return;
      setStep(2); // typing indicator
      await wait(1500);
      if (aborted) return;
      setStep(3); // AI response

      await wait(1800);
      if (aborted) return;

      // Click time button
      onDemoEvent('CLICK_TIME_BUTTON');
      await wait(800);
      if (aborted) return;
      setSelectedTime('In 30 min');
      setStep(4);

      await wait(1500);
      if (aborted) return;
      setStep(5); // confirmation

      await wait(1000);
      if (aborted) return;
      onDemoEvent('HOUSEKEEPING_REQUESTED');

      await wait(2500);
      if (aborted) return;

      // Navigate to Explore
      onDemoEvent('CLICK_EXPLORE_TAB');
      await wait(1000);
      if (aborted) return;
      setView('explore');

      await wait(2000);
      if (aborted) return;

      // Click Room Service
      onDemoEvent('CLICK_ROOM_SERVICE');
      await wait(1500);
      if (aborted) return;
      setView('room-service');

      await wait(2500);
      if (aborted) return;

      // Add salad
      onDemoEvent('CLICK_ADD_SALAD');
      await wait(1000);
      if (aborted) return;
      setCartItems([{ name: 'Caesar Salad', price: 12, description: 'Romaine, croutons, parmesan' }]);

      await wait(2000);
      if (aborted) return;

      // Checkout
      onDemoEvent('CLICK_CHECKOUT');
      await wait(1000);
      if (aborted) return;
      setView('checkout');

      await wait(3000);
      if (aborted) return;

      // Place order
      onDemoEvent('CLICK_PLACE_ORDER');
      await wait(1000);
      if (aborted) return;
      setOrderPlaced(true);

      await wait(1000);
      if (aborted) return;
      onDemoEvent('FOOD_ORDERED');

      await wait(3000);
      if (aborted) return;

      // View requests
      onDemoEvent('CLICK_VIEW_REQUESTS');
      await wait(1500);
      if (aborted) return;
      setView('requests');

      await wait(1500);
      if (aborted) return;
      onDemoEvent('VIEWING_REQUESTS');
    };

    runSequence();

    return () => { aborted = true; };
  }, [isPlaying, onDemoEvent]);

  return (
    <div className="w-full h-full relative overflow-hidden demo-screen">
      {/* Subtle animated background orbs - matching landing page style */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full"
          animate={{ x: [0, 15, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ 
            background: 'radial-gradient(circle, hsl(215 70% 75% / 0.35) 0%, transparent 70%)',
            filter: 'blur(20px)'
          }}
        />
        <motion.div
          className="absolute top-1/3 -right-12 w-40 h-40 rounded-full"
          animate={{ x: [0, -10, 0], y: [0, 15, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ 
            background: 'radial-gradient(circle, hsl(225 65% 78% / 0.3) 0%, transparent 70%)',
            filter: 'blur(18px)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header - improved */}
        <div className="flex-shrink-0 h-12 mobile-header px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/innaralogo2.png"
              alt="Innara"
              className="w-5 h-5 object-contain"
            />
            <InnaraLogo size="xs" useWordLogo showText showIcon={false} />
          </div>
          <div className="flex items-center gap-2">
            <span className="room-badge bg-white/40 border border-white/50 px-2.5 py-1 rounded-lg text-foreground text-[9px] font-semibold">
              Room 1204
            </span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1d3a] to-[#14182d] ring-1.5 ring-[#9B7340]/50 border border-[#9B7340] flex items-center justify-center text-[9px] font-semibold text-white">
              AA
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'concierge' && (
              <ConciergeView 
                key="concierge"
                step={step} 
                typingText={typingText} 
                selectedTime={selectedTime} 
              />
            )}
            {view === 'explore' && <ExploreView key="explore" />}
            {view === 'room-service' && (
              <RoomServiceView 
                key="room-service"
                cartItems={cartItems} 
              />
            )}
            {view === 'checkout' && (
              <CheckoutView 
                key="checkout"
                item={cartItems[0]} 
                orderPlaced={orderPlaced} 
              />
            )}
            {view === 'requests' && <RequestsView key="requests" />}
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <BottomNav currentView={view} />
      </div>
    </div>
  );
}

// Sub-components defined below
function ConciergeView({ step, typingText, selectedTime }: { step: number; typingText: string; selectedTime: string }) {
  const services = [
    { icon: UtensilsCrossed, label: 'Room Service' },
    { icon: Bed, label: 'Housekeeping' },
    { icon: Wrench, label: 'Maintenance' },
    { icon: Flower2, label: 'Spa & Wellness' },
    { icon: Car, label: 'Valet' },
    { icon: ConciergeBell, label: 'Concierge' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      {/* Service grid or chat */}
      <div className="flex-1 overflow-y-auto">
        {step === 0 ? (
          <div className="px-3 py-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full glass-card flex items-center justify-center">
                <Sparkles className="w-5 h-5 accent-icon" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Hello, Ahmed!</h3>
              <p className="text-[10px] text-muted-foreground">How can I assist you today?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {services.map((s, i) => (
                <div
                  key={i}
                  className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5"
                >
                  <s.icon className="w-5 h-5 accent-icon" />
                  <span className="text-[9px] text-foreground font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-3 py-3 space-y-2">
            {/* User message */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-end">
              <div className="bg-[#1a1d3a] text-white px-3 py-2 rounded-xl rounded-br-[4px] text-xs max-w-[80%] shadow-[0_2px_8px_rgba(26,29,58,0.3)]">
                I need my room cleaned
              </div>
            </motion.div>

            {/* Typing indicator */}
            {step === 2 && <TypingIndicator />}

            {/* AI response */}
            {step >= 3 && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div className="flex items-center gap-1.5 mb-1 ml-0.5">
                  <div className="w-5 h-5 rounded-full bg-[#1a1d3a] flex items-center justify-center shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-[#9B7340]" />
                  </div>
                  <span className="text-[8px] font-semibold text-[#9B7340] uppercase tracking-wide">AI Concierge</span>
                </div>
                <div className="glass-card px-3 py-2 rounded-xl rounded-bl-[4px] text-xs max-w-[85%] text-foreground">
                  <p>Of course! I'll send housekeeping right away. 🧹</p>
                  <p className="mt-1">When would you like them?</p>
                </div>
              </motion.div>
            )}

            {/* Time buttons */}
            {step === 3 && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex gap-1.5 flex-wrap">
                {['Now', 'In 30 min', 'In 1 hour'].map((t) => (
                  <div
                    key={t}
                    data-demo-id={t === 'In 30 min' ? 'guest-time-30' : undefined}
                    className="px-3 py-1.5 rounded-full bg-white/60 border border-white/60 text-foreground text-[10px] font-medium"
                  >
                    {t}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Selected time */}
            {step >= 4 && selectedTime && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-end">
                <div className="bg-[#1a1d3a] text-white px-3 py-2 rounded-xl rounded-br-[4px] text-xs shadow-[0_2px_8px_rgba(26,29,58,0.3)]">
                  {selectedTime}
                </div>
              </motion.div>
            )}

            {/* Confirmation */}
            {step >= 5 && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div className="flex items-center gap-1.5 mb-1 ml-0.5">
                  <div className="w-5 h-5 rounded-full bg-[#1a1d3a] flex items-center justify-center shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-[#9B7340]" />
                  </div>
                  <span className="text-[8px] font-semibold text-[#9B7340] uppercase tracking-wide">AI Concierge</span>
                </div>
                <div className="glass-card px-3 py-2 rounded-xl rounded-bl-[4px] text-xs text-foreground">
                  <p>Perfect! ✨ Housekeeping is on their way.</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">~32 minutes</span>
                  </div>
                  <div className="mt-1 inline-block border border-[#9B7340]/50 text-[8px] px-1.5 py-0.5 rounded-full bg-[#9B7340]/10">
                    <span className="text-[#9B7340] font-semibold">✓ Confirmed</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0 px-3 py-2 glass-card border-t border-white/60">
        <div className="relative">
          <input
            type="text"
            value={typingText}
            readOnly
            placeholder="What do you need?"
            data-demo-id="guest-chat-input"
            className="w-full h-9 pl-3 pr-9 rounded-full bg-white/70 border border-white/70 text-xs text-foreground placeholder:text-muted-foreground"
          />
          <button
            data-demo-id="guest-chat-send"
            className="absolute right-1 top-1 w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1d3a] to-[#2a2850] flex items-center justify-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ExploreView() {
  const services = [
    { icon: UtensilsCrossed, label: 'Room Service' },
    { icon: Bed, label: 'Housekeeping' },
    { icon: Wrench, label: 'Maintenance' },
    { icon: Flower2, label: 'Spa & Wellness' },
    { icon: Car, label: 'Valet Parking' },
    { icon: Phone, label: 'Concierge' },
    { icon: Shirt, label: 'Laundry' },
    { icon: ShoppingBag, label: 'Shopping' },
    { icon: Dumbbell, label: 'Fitness Center' },
    { icon: Coffee, label: 'Breakfast' },
    { icon: MapPin, label: 'Local Experiences' },
    { icon: Gift, label: 'Gift Shop' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 px-3 py-3 overflow-y-auto"
    >
      <div className="grid grid-cols-3 gap-1.5">
        {services.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            data-demo-id={s.label === 'Room Service' ? 'guest-room-service-card' : undefined}
            className="glass-card rounded-xl p-2.5 flex flex-col items-center gap-1.5"
          >
            <s.icon className="w-5 h-5 text-[#9B7340]" />
            <span className="text-[8px] text-foreground font-medium text-center leading-tight">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function RoomServiceView({ cartItems }: { cartItems: any[] }) {
  const hasItem = cartItems.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 flex items-center gap-2">
        <ChevronLeft className="w-4 h-4 text-foreground" />
        <span className="text-sm font-semibold text-foreground">Room Service</span>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Caesar Salad */}
        <div className="glass-card rounded-xl p-2 flex gap-2">
          <img 
            src="https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=100&q=80" 
            alt="Salad" 
            className="w-14 h-14 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-foreground">Caesar Salad</h4>
            <p className="text-[9px] text-foreground/60">Romaine, croutons</p>
            <p className="text-xs font-semibold text-foreground mt-1">$12</p>
          </div>
          <button
            data-demo-id="guest-add-salad"
            className="w-8 h-8 rounded-full bg-white/70 border border-white/70 flex items-center justify-center self-center"
          >
            {hasItem ? (
              <span className="text-sm font-bold text-foreground">1</span>
            ) : (
              <Plus className="w-4 h-4 text-foreground" />
            )}
          </button>
        </div>

        {/* Pizza */}
        <div className="glass-card rounded-xl p-2 flex gap-2">
          <img 
            src="https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=100&q=80" 
            alt="Pizza" 
            className="w-14 h-14 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-foreground">Margherita Pizza</h4>
            <p className="text-[9px] text-foreground/60">Tomato, mozzarella</p>
            <p className="text-xs font-semibold text-foreground mt-1">$18</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/70 border border-white/70 flex items-center justify-center self-center">
            <Plus className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Checkout button */}
      <div className="flex-shrink-0 px-3 py-2">
        <button
          data-demo-id="guest-checkout"
          className={`w-full h-9 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold ${
            hasItem 
            ? 'bg-gradient-to-r from-[#1a1d3a] to-[#2a2850] text-white' 
            : 'bg-white/70 text-foreground/60'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {hasItem ? 'Checkout (1)' : 'Add items'}
        </button>
      </div>
    </motion.div>
  );
}

function CheckoutView({ item, orderPlaced }: { item: any; orderPlaced: boolean }) {
  if (orderPlaced) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      className="absolute inset-0 bg-white/40 backdrop-blur-xl z-50 flex items-center justify-center"
      >
        <div className="glass-card rounded-2xl p-6 text-center mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-3"
          >
            <Check className="w-7 h-7 text-white" />
          </motion.div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Order Placed! 🎉</h3>
          <p className="text-muted-foreground text-xs mb-4">Delivery in ~18 minutes</p>
          <button
            data-demo-id="guest-view-requests"
            className="w-full h-9 bg-gradient-to-r from-[#1a1d3a] to-[#2a2850] text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4" />
            View Requests
          </button>
        </div>
      </motion.div>
    );
  }

  if (!item) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-white/40 backdrop-blur-xl z-50 flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="glass-card border-t border-white/60 rounded-t-2xl w-full p-4"
      >
        <div className="w-8 h-1 bg-foreground/15 rounded-full mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-3">Your Order</h3>

      <div className="flex gap-2 mb-3 bg-white/70 rounded-xl p-2">
          <img src="https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=100&q=80" alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-foreground">{item.name}</h4>
            <p className="text-[9px] text-muted-foreground">{item.description}</p>
            <p className="text-xs font-semibold text-foreground mt-0.5">${item.price}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-500/15 border-l-2 border-blue-400 p-2 rounded-lg mb-3">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] text-foreground">~18 min delivery</span>
        </div>

        <div className="flex justify-between text-xs mb-3">
          <span className="text-muted-foreground">Total</span>
          <span className="text-foreground font-bold">${(item.price * 1.02).toFixed(2)}</span>
        </div>

        <button
          data-demo-id="guest-place-order"
          className="w-full h-10 bg-gradient-to-r from-[#1a1d3a] to-[#2a2850] text-white rounded-full text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          Place Order
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}

function RequestsView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 px-3 py-4 space-y-2"
    >
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-start gap-2">
          <UtensilsCrossed className="w-5 h-5 text-[#9B7340]" />
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-foreground">Housekeeping</h3>
            <p className="text-[9px] text-foreground/60">In Progress</p>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-white/60 text-[9px] font-semibold text-foreground">
              ~32 min
            </div>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-start gap-2">
          <UtensilsCrossed className="w-5 h-5 text-[#9B7340]" />
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-foreground">Room Service</h3>
            <p className="text-[9px] text-foreground/60">Pending</p>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-white/60 text-[9px] font-semibold text-foreground">
              ~18 min
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BottomNav({ currentView }: { currentView: string }) {
  const items = [
    { id: 'concierge', icon: Sparkles, label: 'Concierge' },
    { id: 'explore', icon: Compass, label: 'Explore' },
    { id: 'requests', icon: ClipboardList, label: 'Requests' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="bottom-nav flex-shrink-0 h-12 flex items-center justify-around px-2">
      {items.map((item) => {
        const isActive = currentView === item.id || 
          (currentView === 'room-service' && item.id === 'explore') ||
          (currentView === 'checkout' && item.id === 'explore');
        return (
          <div
            key={item.id}
            data-demo-id={item.id === 'explore' ? 'guest-nav-explore' : undefined}
            className={`flex flex-col items-center gap-0.5 ${isActive ? 'nav-active' : 'text-muted-foreground'}`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-[8px] font-medium">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
