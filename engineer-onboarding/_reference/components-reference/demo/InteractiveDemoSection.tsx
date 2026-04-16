import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, Smartphone, Monitor, ArrowRight, MessageSquare, BarChart3 } from 'lucide-react';
import { GuestDemo } from './GuestDemo';
import { DashboardDemo } from './DashboardDemo';
import { ClickIndicator } from './ClickIndicator';
import { Button } from '@/components/ui/button';

interface DemoRequest {
  id: number;
  guest: string;
  room: string;
  item: string;
  status: string;
  time: string;
  staff: string;
  staffInitials: string;
  isNew?: boolean;
  estimate?: string;
}

// Click indicator positions (calibrated percentages relative to container)
const CLICK_POSITIONS = {
  CLICK_INPUT: { x: 50, y: 86 },      // Chat input (bottom center)
  CLICK_SEND: { x: 87, y: 86 },       // Send button (right of input)
  CLICK_TIME_BUTTON: { x: 35, y: 54 }, // "In 30 min" button
  CLICK_EXPLORE_TAB: { x: 37, y: 96 }, // Explore tab in bottom nav
  CLICK_ROOM_SERVICE: { x: 25, y: 30 }, // Room Service card (top left)
  CLICK_ADD_SALAD: { x: 87, y: 44 },   // Add button on salad
  CLICK_CHECKOUT: { x: 50, y: 92 },    // Checkout button
  CLICK_PLACE_ORDER: { x: 50, y: 88 }, // Place order button
  CLICK_VIEW_REQUESTS: { x: 50, y: 70 }, // View requests button
};

const DASHBOARD_CLICK_POSITIONS = {
  CLICK_ANALYTICS: { x: 50, y: 4 },    // Analytics tab in header
};

const GUEST_TARGETS: Record<string, string> = {
  CLICK_INPUT: '[data-demo-id="guest-chat-input"]',
  CLICK_SEND: '[data-demo-id="guest-chat-send"]',
  CLICK_TIME_BUTTON: '[data-demo-id="guest-time-30"]',
  CLICK_EXPLORE_TAB: '[data-demo-id="guest-nav-explore"]',
  CLICK_ROOM_SERVICE: '[data-demo-id="guest-room-service-card"]',
  CLICK_ADD_SALAD: '[data-demo-id="guest-add-salad"]',
  CLICK_CHECKOUT: '[data-demo-id="guest-checkout"]',
  CLICK_PLACE_ORDER: '[data-demo-id="guest-place-order"]',
  CLICK_VIEW_REQUESTS: '[data-demo-id="guest-view-requests"]',
};

const DASHBOARD_TARGETS: Record<string, string> = {
  CLICK_ANALYTICS: '[data-demo-id="dashboard-analytics-tab"]',
};

export function InteractiveDemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const guestScreenRef = useRef<HTMLDivElement>(null);
  const dashboardScreenRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Demo state
  const [guestClickIndicators, setGuestClickIndicators] = useState<{ id: number; x: number; y: number }[]>([]);
  const [dashboardClickIndicators, setDashboardClickIndicators] = useState<{ id: number; x: number; y: number }[]>([]);
  const [dashboardRequests, setDashboardRequests] = useState<DemoRequest[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const getTargetPosition = useCallback(
    (selector: string, containerRef: { current: HTMLDivElement | null }) => {
      const container = containerRef.current;
      const el = container?.querySelector(selector) as HTMLElement | null;
      if (!container || !el) return null;

      const containerRect = container.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      if (!containerRect.width || !containerRect.height) return null;

      const x = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
      const y = ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 100;

      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    []
  );

  // Add click indicator helper
  const addClickIndicator = useCallback((target: 'guest' | 'dashboard', position: { x: number; y: number }) => {
    const id = Date.now();
    if (target === 'guest') {
      setGuestClickIndicators(prev => [...prev, { id, ...position }]);
      setTimeout(() => {
        setGuestClickIndicators(prev => prev.filter(ind => ind.id !== id));
      }, 1500);
    } else {
      setDashboardClickIndicators(prev => [...prev, { id, ...position }]);
      setTimeout(() => {
        setDashboardClickIndicators(prev => prev.filter(ind => ind.id !== id));
      }, 1500);
    }
  }, []);

  // Handle demo events from GuestDemo
  const handleDemoEvent = useCallback((event: string) => {
    // Show click indicator (prefer DOM targets, fallback to static positions)
    const guestSelector = GUEST_TARGETS[event];
    const guestPosition = guestSelector ? getTargetPosition(guestSelector, guestScreenRef) : null;
    const fallbackPosition = CLICK_POSITIONS[event as keyof typeof CLICK_POSITIONS];
    if (guestPosition) {
      addClickIndicator('guest', guestPosition);
    } else if (fallbackPosition) {
      addClickIndicator('guest', fallbackPosition);
    }

    // Handle specific events
    if (event === 'HOUSEKEEPING_REQUESTED') {
      setTimeout(() => {
        setDashboardRequests(prev => [{
          id: Date.now(),
          guest: 'Ahmed Ali',
          room: '1204',
          item: 'Room Cleaning',
          status: 'pending',
          time: 'Just now',
          staff: 'James',
          staffInitials: 'JM',
          isNew: true,
          estimate: '~32 min'
        }, ...prev]);
      }, 800);
    } else if (event === 'FOOD_ORDERED') {
      setTimeout(() => {
        setDashboardRequests(prev => [{
          id: Date.now() + 1,
          guest: 'Ahmed Ali',
          room: '1204',
          item: 'Caesar Salad',
          status: 'pending',
          time: 'Just now',
          staff: 'Olivia',
          staffInitials: 'OC',
          isNew: true,
          estimate: '~18 min'
        }, ...prev]);
      }, 800);
    } else if (event === 'VIEWING_REQUESTS') {
      // Show click on Analytics tab
      setTimeout(() => {
        const selector = DASHBOARD_TARGETS.CLICK_ANALYTICS;
        const dashboardPosition = selector ? getTargetPosition(selector, dashboardScreenRef) : null;
        const fallback = DASHBOARD_CLICK_POSITIONS.CLICK_ANALYTICS;
        if (dashboardPosition) {
          addClickIndicator('dashboard', dashboardPosition);
        } else {
          addClickIndicator('dashboard', fallback);
        }
      }, 200);
      // Switch to analytics view
      setTimeout(() => {
        setShowAnalytics(true);
      }, 700);
    }
  }, [addClickIndicator, getTargetPosition]);

  // Intersection observer to start demo when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          setTimeout(() => setIsPlaying(true), 500);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  // Reset demo function - longer gap so GuestDemo fully cleans up
  const resetDemo = useCallback(() => {
    setIsPlaying(false);
    setDashboardRequests([]);
    setShowAnalytics(false);
    setGuestClickIndicators([]);
    setDashboardClickIndicators([]);
    setTimeout(() => setIsPlaying(true), 500);
  }, []);

  return (
    <section ref={sectionRef} id="demo" className="py-16 px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            See <span className="italic accent-text">Innara</span> in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Watch how guests and staff interact seamlessly through our AI-powered platform
          </p>
        </div>

        {/* Demo container */}
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* LEFT: Phone mockup (Guest App) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-shrink-0"
          >
            <div className="glass-premium p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 accent-icon" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">For Guests</h3>
                  <p className="text-xs text-muted-foreground">Mobile experience</p>
                </div>
              </div>

              {/* Phone mockup */}
              <div className="relative mx-auto" style={{ width: '260px' }}>
                {/* Phone frame */}
                <div className="relative glass-premium rounded-[2.5rem] p-2 shadow-2xl border border-white/60">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-white/60 rounded-b-2xl z-10 border border-white/70" />

                  {/* Screen */}
                  <div
                    ref={guestScreenRef}
                    className="relative bg-transparent rounded-[2rem] overflow-hidden"
                    style={{ height: '500px' }}
                  >
                    <GuestDemo isPlaying={isPlaying} onDemoEvent={handleDemoEvent} />
                    <ClickIndicator indicators={guestClickIndicators} size="small" />
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/70 rounded-full" />
                </div>
              </div>

              {/* Features list */}
              <ul className="mt-4 space-y-2">
                {[
                  'Natural AI conversations',
                  'Instant service requests',
                  'Real-time order tracking',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#9B7340]" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="text-center text-xs text-[#9B7340] mt-3 italic">
                Interactive demo • Watch the magic
              </p>
            </div>
          </motion.div>

          {/* RIGHT: Laptop mockup (Dashboard) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="glass-premium p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 accent-icon" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">For Hotels</h3>
                  <p className="text-xs text-muted-foreground">Powerful operations dashboard</p>
                </div>
              </div>

              {/* Laptop mockup */}
              <div className="relative">
                {/* Laptop screen */}
                <div className="relative glass-premium rounded-t-lg p-2 shadow-2xl border border-white/60" style={{ width: '100%', maxWidth: '700px' }}>
                  {/* Webcam */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/70 rounded-full z-10" />

                  {/* Screen */}
                  <div
                    ref={dashboardScreenRef}
                    className="relative bg-transparent rounded-md overflow-hidden"
                    style={{ height: '380px' }}
                  >
                    <DashboardDemo requests={dashboardRequests} showAnalytics={showAnalytics} />
                    <ClickIndicator indicators={dashboardClickIndicators} size="large" />
                  </div>
                </div>

                {/* Laptop base */}
                <div className="relative h-3 glass-premium rounded-b-lg shadow-xl border border-white/60 border-t-0" style={{ width: '100%', maxWidth: '700px' }}>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                </div>

                {/* Laptop stand shadow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/40 rounded-full blur-sm" />
              </div>

              {/* Features list */}
              <ul className="mt-4 space-y-2">
                {[
                  'Real-time request management',
                  'AI-powered insights & analytics',
                  'Automated task assignment',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#9B7340]" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <p className="text-center text-xs text-[#9B7340] mt-3 italic">
                Watch requests flow in real-time
              </p>
            </div>
          </motion.div>
        </div>

        {/* Replay button */}
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={resetDemo}
            className="gap-2"
          >
            Replay Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
