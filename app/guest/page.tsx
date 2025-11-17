'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ShoppingCart, UtensilsCrossed, Home, Car, Bell, Flower2, Shirt, Wrench, Clock, Plus, Check, ChevronLeft, ArrowRight, X, Compass, ClipboardList, User, ConciergeBell, ShoppingBag, Package, Wine, Search, Dumbbell } from 'lucide-react'
import Image from 'next/image'

function GuestAppContent() {
  const searchParams = useSearchParams()
  const [isEmbed, setIsEmbed] = useState(false)

  const [view, setView] = useState<'concierge' | 'explore' | 'requests' | 'profile' | 'room-service' | 'spa' | 'laundry' | 'valet' | 'checkout'>('concierge')
  const [step, setStep] = useState(0)
  const [cartItems, setCartItems] = useState<any[]>([])

  const nextStep = () => setStep(s => s + 1)

  // Check for embed parameter using window.location for better iframe compatibility
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const embedParam = urlParams.get('embed')
    const isEmbedMode = embedParam === 'true'
    setIsEmbed(isEmbedMode)

    console.log('=== GUEST APP DEBUG ===')
    console.log('Full URL:', window.location.href)
    console.log('Search string:', window.location.search)
    console.log('URLSearchParams:', urlParams.toString())
    console.log('Embed param value:', embedParam)
    console.log('isEmbed:', isEmbedMode)
    console.log('Will render:', isEmbedMode ? 'EMBED MODE (no frame)' : 'FULL MODE (with frame)')
    console.log('======================')
  }, [])

  // Render just the app content without phone frame when embedded
  const AppContent = () => (
    <div className={`relative w-full h-full ${isEmbed ? 'overflow-hidden' : 'overflow-hidden'}`}>
      {/* DEBUG OVERLAY - Remove after testing */}
      <div className="absolute top-0 left-0 z-50 bg-red-500 text-white text-xs p-2 opacity-90">
        DEBUG: isEmbed={isEmbed ? 'TRUE' : 'FALSE'} | URL={typeof window !== 'undefined' ? window.location.search : 'SSR'}
      </div>

      {/* Scaling wrapper for embed mode */}
      <div className={isEmbed ? 'w-full h-full flex items-center justify-center' : 'w-full h-full'} style={isEmbed ? {
        transform: 'scale(0.9)',
        transformOrigin: 'center center',
      } : {}}>
              {/* Light background with flowing dark blue smoke */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-white">
        <div className="absolute inset-0">
          {/* Dark blue smoke clouds - very subtle */}
          <motion.div
            className="absolute -top-32 -left-32 w-[700px] h-[500px] bg-blue-600/15 mix-blend-multiply filter blur-3xl"
            style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
            animate={{
              x: [0, 80, 0],
              y: [0, 40, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-20 -right-32 w-[600px] h-[600px] bg-indigo-600/15 mix-blend-multiply filter blur-3xl"
            style={{ borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' }}
            animate={{
              x: [0, -60, 0],
              y: [0, 80, 0],
              scale: [1, 1.15, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div
            className="absolute bottom-0 left-1/4 w-[800px] h-[400px] bg-blue-700/15 mix-blend-multiply filter blur-3xl"
            style={{ borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%' }}
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 45, 0],
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/4 w-[650px] h-[550px] bg-indigo-700/15 mix-blend-multiply filter blur-3xl"
            style={{ borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' }}
            animate={{
              x: [0, 40, 0],
              y: [0, -50, 0],
              scale: [1, 1.25, 1],
              rotate: [0, -60, 0],
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 6
            }}
          />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Top Bar - Transparent & Blurred (Hidden in embed mode) */}
                {!isEmbed && (
                  <div className="flex-shrink-0 h-[70px] backdrop-blur-2xl bg-white/20 border-b border-white/20 px-4 flex items-center justify-between pt-8">
                    <div className="flex items-center gap-2">
                      <Image src="/logo.png" alt="INNARA" width={40} height={40} className="rounded-full" />
                      <span className="text-xl font-light tracking-wider text-navy" style={{ fontFamily: 'Georgia, serif' }}>INNARA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gold font-semibold tracking-wide">Room 1204</span>
                      <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold shadow-lg border-2 border-gold/30">
                        AA
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Content - Full Height */}
                <div className="flex-1 flex flex-col">
                  <AnimatePresence mode="wait">
                  {view === 'concierge' && (
                    <ConciergeView
                      step={step}
                      nextStep={nextStep}
                      onServiceClick={(service: string) => setView(service as any)}
                      onNavClick={(nav: string) => setView(nav as any)}
                      isEmbed={isEmbed}
                    />
                  )}

                  {view === 'explore' && (
                    <ExploreView
                      onServiceClick={(service: string) => setView(service as any)}
                      onNavClick={(nav: string) => setView(nav as any)}
                      isEmbed={isEmbed}
                    />
                  )}

                  {view === 'requests' && (
                    <RequestsView
                      onNavClick={(nav: string) => setView(nav as any)}
                      isEmbed={isEmbed}
                    />
                  )}

                  {view === 'profile' && (
                    <ProfileView
                      onNavClick={(nav: string) => setView(nav as any)}
                      isEmbed={isEmbed}
                    />
                  )}

                  {view === 'room-service' && (
                    <RoomServiceView
                      onBack={() => setView('concierge')}
                      onAddToCart={(item: any) => {
                        setCartItems([item])
                        setTimeout(() => setView('checkout'), 800)
                      }}
                    />
                  )}

                  {view === 'checkout' && (
                    <CheckoutView
                      item={cartItems[0]}
                      onPlaceOrder={() => {
                        setTimeout(() => setView('concierge'), 3000)
                      }}
                    />
                  )}
                  </AnimatePresence>
                </div>
              </div>
      </div> {/* Close scaling wrapper */}
            </div>
  )

  // If embedded, render just the app content without phone frame
  if (isEmbed) {
    return <AppContent />
  }

  // Otherwise render with full phone mockup
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      {/* Phone Frame */}
      <div className="relative">
        {/* Power Button */}
        <div className="absolute right-0 top-[200px] w-[3px] h-[80px] bg-slate-800 rounded-l-sm"></div>

        {/* Volume Buttons */}
        <div className="absolute left-0 top-[180px] w-[3px] h-[50px] bg-slate-800 rounded-r-sm"></div>
        <div className="absolute left-0 top-[240px] w-[3px] h-[50px] bg-slate-800 rounded-r-sm"></div>

        {/* Phone Bezel */}
        <div className="relative w-[413px] h-[872px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-[50px] shadow-2xl p-[10px] ring-2 ring-slate-700">
          {/* Screen Container */}
          <div className="relative w-full h-full bg-black rounded-[42px] overflow-hidden shadow-inner">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-3xl z-50 shadow-lg"></div>

            {/* Actual App Content */}
            <AppContent />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GuestApp() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-white" />}>
      <GuestAppContent />
    </Suspense>
  )
}

function ConciergeView({ step, nextStep, onServiceClick, onNavClick, isEmbed }: any) {
  // Auto-advance from step 2 (typing) to step 3 (AI response)
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => nextStep(), 1200)
      return () => clearTimeout(timer)
    }
  }, [step, nextStep])

  const popularServices = [
    { icon: UtensilsCrossed, label: 'Room Service', value: 'room-service', color: 'from-amber-400 to-orange-500' },
    { icon: Flower2, label: 'Spa & Wellness', value: 'spa', color: 'from-pink-400 to-rose-500' },
    { icon: Shirt, label: 'Laundry', value: 'laundry', color: 'from-blue-400 to-cyan-500' },
    { icon: Car, label: 'Valet', value: 'valet', color: 'from-purple-400 to-indigo-500' },
    { icon: ConciergeBell, label: 'Concierge', value: 'concierge', color: 'from-yellow-400 to-amber-500' },
    { icon: ShoppingBag, label: 'Shopping', value: 'shopping', color: 'from-green-400 to-emerald-500' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Welcome Section (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg font-semibold text-navy mb-1">Welcome back, Ahmed</h1>
          <p className="text-xs text-navy/60">How can we help you today?</p>
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Service Tiles - 2x3 Grid */}
        <div className={`px-6 py-6 grid grid-cols-2 gap-4 ${step === 0 ? 'flex-1 content-center' : ''}`}>
          {popularServices.map((service) => (
            <button
              key={service.value}
              onClick={() => onServiceClick(service.value)}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/20 hover:border-gold/50 hover:scale-105 transition-all shadow-lg aspect-square"
            >
              <service.icon className="w-8 h-8 text-gold" />
              <span className="text-xs text-navy text-center leading-tight font-medium">{service.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages - Only show when active */}
        <div className={`px-4 space-y-3 ${step >= 1 ? 'block' : 'hidden'} pb-4`}>
        {step >= 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-end"
          >
            <div className="backdrop-blur-xl bg-white/20 border border-white/20 text-navy px-4 py-3 rounded-2xl rounded-br-md max-w-[80%] shadow-lg">
              I need my room cleaned
            </div>
          </motion.div>
        )}

        {step >= 2 && (
          <>
            {step === 2 && <TypingIndicator />}
            {step >= 3 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex justify-start"
              >
                <div className="relative">
                  <div className="absolute -top-2 -left-2 backdrop-blur-xl bg-white/90 text-gold text-xs font-semibold px-2 py-0.5 rounded-full border border-gold shadow-lg">
                    AI
                  </div>
                  <div className="bg-gradient-to-br from-gold-light to-gold text-white px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%] shadow-2xl">
                    <p>Of course, Ahmed! I'll send housekeeping to Room 1204 right away. 🧹</p>
                    <p className="mt-2">When would you like them to arrive?</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {step >= 3 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2"
          >
            <button
              onClick={() => nextStep()}
              className="px-5 py-2.5 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 text-navy hover:bg-gold hover:text-white hover:border-gold hover:scale-105 transition-all text-sm font-semibold shadow-lg"
            >
              Now
            </button>
            <button className="px-5 py-2.5 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 text-navy hover:bg-gold hover:text-white hover:border-gold hover:scale-105 transition-all text-sm font-semibold shadow-lg">
              In 30 min
            </button>
            <button className="px-5 py-2.5 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 text-navy hover:bg-gold hover:text-white hover:border-gold hover:scale-105 transition-all text-sm font-semibold shadow-lg">
              In 1 hour
            </button>
          </motion.div>
        )}

        {step >= 4 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-start"
          >
            <div className="relative">
              <div className="absolute -top-2 -left-2 backdrop-blur-xl bg-white/90 text-gold text-xs font-semibold px-2 py-0.5 rounded-full border border-gold shadow-lg">
                AI
              </div>
              <div className="bg-gradient-to-br from-gold-light to-gold text-white px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%] shadow-2xl">
                <p className="mb-2">Perfect! ✨ Housekeeping is on their way.</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>⏱️ Estimated arrival: <span className="font-bold">~18 minutes</span></span>
                </div>
                <p className="text-xs opacity-70 mt-1">(2 requests ahead of you)</p>
                <div className="mt-2 inline-block border border-white/50 text-xs px-2 py-0.5 rounded-full">
                  AI Predicted
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      </div>

      {/* Bottom Fixed Chat Input (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="flex-shrink-0 px-4 py-2 backdrop-blur-xl bg-white/10 border-t border-white/20">
          <div className="relative">
            <input
              type="text"
              placeholder="What do you need today?"
              onClick={() => step === 0 && nextStep()}
              className="w-full h-11 pl-4 pr-12 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 text-sm text-navy placeholder:text-navy/50 focus:outline-none focus:border-gold focus:bg-white/30 transition-all shadow-lg"
            />
            <button className="absolute right-1.5 top-1.5 w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center shadow-md hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Glassy (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="flex-shrink-0 h-16 backdrop-blur-xl bg-white/20 border-t border-white/20 flex items-center justify-around px-2">
          <button className="flex flex-col items-center gap-0.5 py-2 text-gold">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Concierge</span>
          </button>
          <button onClick={() => onNavClick('explore')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </button>
          <button onClick={() => onNavClick('requests')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-medium">Requests</span>
          </button>
          <button onClick={() => onNavClick('profile')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      )}
    </div>
  )
}

function ExploreView({ onServiceClick, onNavClick, isEmbed }: any) {
  const allServices = [
    { icon: UtensilsCrossed, label: 'Room Service', value: 'room-service', color: 'from-amber-400 to-orange-500' },
    { icon: Flower2, label: 'Spa & Wellness', value: 'spa', color: 'from-pink-400 to-rose-500' },
    { icon: Shirt, label: 'Laundry', value: 'laundry', color: 'from-blue-400 to-cyan-500' },
    { icon: Car, label: 'Valet', value: 'valet', color: 'from-purple-400 to-indigo-500' },
    { icon: ConciergeBell, label: 'Concierge', value: 'concierge', color: 'from-yellow-400 to-amber-500' },
    { icon: ShoppingBag, label: 'Shopping', value: 'shopping', color: 'from-green-400 to-emerald-500' },
    { icon: Wine, label: 'Mini Bar', value: 'minibar', color: 'from-red-400 to-pink-500' },
    { icon: Package, label: 'Packages', value: 'packages', color: 'from-indigo-400 to-purple-500' },
    { icon: Wrench, label: 'Maintenance', value: 'maintenance', color: 'from-gray-400 to-slate-500' },
    { icon: Dumbbell, label: 'Gym & Fitness', value: 'gym', color: 'from-teal-400 to-cyan-500' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg font-semibold text-navy mb-1">Explore Services</h1>
          <p className="text-xs text-navy/60 mb-3">Browse all available amenities</p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
            <input
              type="text"
              placeholder="Search services..."
              className="w-full h-9 pl-9 pr-3 rounded-full backdrop-blur-xl bg-white/20 border border-white/30 text-sm text-navy placeholder:text-navy/50 focus:outline-none focus:border-gold/50 focus:bg-white/30 transition-all"
            />
          </div>
        </div>
      )}

      {/* Services Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="px-4 py-3 grid grid-cols-2 gap-3 flex-1 content-center">
          {allServices.map((service) => (
            <button
              key={service.value}
              onClick={() => onServiceClick(service.value)}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/20 hover:border-gold/50 hover:scale-105 transition-all shadow-lg"
            >
              <service.icon className="w-7 h-7 text-gold" />
              <span className="text-xs text-navy text-center leading-tight font-medium">{service.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Navigation - Glassy (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="flex-shrink-0 h-16 backdrop-blur-xl bg-white/20 border-t border-white/20 flex items-center justify-around px-2">
          <button onClick={() => onNavClick('concierge')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Concierge</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 py-2 text-gold">
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </button>
          <button onClick={() => onNavClick('requests')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-medium">Requests</span>
          </button>
          <button onClick={() => onNavClick('profile')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      )}
    </div>
  )
}

function RequestsView({ onNavClick, isEmbed }: any) {
  const requests = [
    { id: 1, service: 'Housekeeping', status: 'In Progress', time: '~18 min', icon: Wrench, color: 'from-blue-400 to-cyan-500' },
    { id: 2, service: 'Room Service', status: 'Delivered', time: 'Completed', icon: UtensilsCrossed, color: 'from-green-400 to-emerald-500' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg font-semibold text-navy mb-1">Your Requests</h1>
          <p className="text-xs text-navy/60">Track all your service requests</p>
        </div>
      )}

      {/* Requests List - Scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="px-6 py-6 flex flex-col gap-4 flex-1 content-center">
          {requests.map((request) => (
            <div key={request.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <request.icon className="w-8 h-8 text-gold flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-navy">{request.service}</h3>
                  <p className="text-xs text-navy/60 mt-1">{request.status}</p>
                  <div className="mt-2 inline-block px-3 py-1 rounded-full bg-gold/20 border border-gold/30 text-xs font-semibold text-gold">
                    {request.time}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-8 h-8 text-navy/40" />
              </div>
              <p className="text-sm text-navy/60">No active requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Glassy (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="flex-shrink-0 h-16 backdrop-blur-xl bg-white/20 border-t border-white/20 flex items-center justify-around px-2">
          <button onClick={() => onNavClick('concierge')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Concierge</span>
          </button>
          <button onClick={() => onNavClick('explore')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 py-2 text-gold">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-medium">Requests</span>
          </button>
          <button onClick={() => onNavClick('profile')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      )}
    </div>
  )
}

function ProfileView({ onNavClick, isEmbed }: any) {
  return (
    <div className="flex flex-col h-full">
      {/* Header (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-xl font-semibold shadow-lg border-2 border-gold/30">
              AA
            </div>
            <div>
              <h1 className="text-lg font-semibold text-navy">Ahmed Ali</h1>
              <p className="text-xs text-navy/60">Room 1204 • Premium Guest</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings List - Scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="px-6 py-6 flex flex-col gap-4 flex-1 content-center">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-navy mb-1">Preferences</h3>
            <p className="text-xs text-navy/60">Manage your stay preferences</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-navy mb-1">Payment Methods</h3>
            <p className="text-xs text-navy/60">Manage billing and payments</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-navy mb-1">Notifications</h3>
            <p className="text-xs text-navy/60">Configure alerts and updates</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-navy mb-1">Support</h3>
            <p className="text-xs text-navy/60">Get help and contact us</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Glassy (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="flex-shrink-0 h-16 backdrop-blur-xl bg-white/20 border-t border-white/20 flex items-center justify-around px-2">
          <button onClick={() => onNavClick('concierge')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Concierge</span>
          </button>
          <button onClick={() => onNavClick('explore')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </button>
          <button onClick={() => onNavClick('requests')} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-medium">Requests</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 py-2 text-gold">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      )}
    </div>
  )
}

function RoomServiceView({ onBack, onAddToCart }: any) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    setAdded(true)
    onAddToCart({
      name: 'Caesar Salad',
      price: 12,
      description: 'Romaine, croutons, parmesan'
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex-shrink-0 backdrop-blur-xl bg-white/20 border-b border-white/20 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-navy hover:text-navy/70 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-navy">Room Service</h2>
          <p className="text-xs text-navy/60">Available 24/7</p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <div className="backdrop-blur-xl bg-white/10 border-l-4 border-navy/30 p-3 rounded-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-navy flex-shrink-0" />
            <span className="text-sm text-navy">Popular right now: Caesar Salad</span>
          </div>

          <div className="flex gap-3 mb-4">
            {['Popular', 'Meals', 'Drinks'].map((cat, i) => (
              <button key={cat} className={`relative flex-1 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all hover:scale-105 overflow-hidden ${i === 0 ? 'backdrop-blur-xl bg-white/10 text-navy border-white/40 shadow-lg' : 'backdrop-blur-xl bg-white/10 text-navy border-white/20 hover:bg-white/15'}`}>
                {i === 0 && <div className="absolute inset-0 bg-navy/20 rounded-full"></div>}
                <span className="relative z-10">{cat}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <FoodCard
              name="Caesar Salad"
              description="Romaine, croutons, parmesan"
              price={12}
              image="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80"
              aiPick
              added={added}
              onAdd={handleAdd}
            />
            <FoodCard
              name="Margherita Pizza"
              description="Tomato, mozzarella, basil"
              price={18}
              image="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80"
              onAdd={() => {}}
            />
            <FoodCard
              name="Grilled Salmon"
              description="Asparagus, herb butter"
              price={24}
              image="https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&q=80"
              onAdd={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="flex-shrink-0 px-4 py-3 backdrop-blur-xl bg-white/10 border-t border-white/20">
        <button className="w-full h-12 backdrop-blur-xl bg-white/30 border border-white/40 text-navy rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg">
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </button>
      </div>

      {/* Bottom Navigation - Glassy */}
      <div className="flex-shrink-0 h-16 backdrop-blur-xl bg-white/20 border-t border-white/20 flex items-center justify-around px-2">
        <button onClick={onBack} className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium">Concierge</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium">Explore</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-medium">Requests</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 py-2 text-navy/60 hover:text-navy">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  )
}

function CheckoutView({ item, onPlaceOrder }: any) {
  const [orderPlaced, setOrderPlaced] = useState(false)

  const handlePlaceOrder = () => {
    setOrderPlaced(true)
    onPlaceOrder()
  }

  // Safety check
  if (!item) {
    return null
  }

  if (orderPlaced) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-2xl"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-semibold mb-2 text-white">Order Placed! 🎉</h3>
          <p className="text-white/70">We'll deliver in ~32 minutes</p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        className="backdrop-blur-2xl bg-white/10 border-t border-white/20 rounded-t-[32px] w-full h-[60vh] p-6 shadow-2xl"
      >
        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-4 text-white">Your Order</h3>

        <div className="flex gap-4 mb-4 backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-3 shadow-lg">
          <img src="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=100&q=80" alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1">
            <h4 className="font-semibold text-white">{item.name}</h4>
            <p className="text-sm text-white/60">{item.description}</p>
            <p className="text-gold font-semibold mt-1">${item.price}</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-blue-500/20 border-l-4 border-blue-400 p-3 rounded-lg mb-4 shadow-lg">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white">⏱️ Estimated delivery: <span className="font-bold">~32 minutes</span></p>
              <p className="text-xs text-white/60 mt-1">Kitchen is busy</p>
              <span className="inline-block mt-2 text-xs border border-gold text-gold px-2 py-0.5 rounded-full">AI Predicted</span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 space-y-2 shadow-lg">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span className="text-white">${item.price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Service fee</span>
            <span className="text-white">$2</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
            <span className="text-gold">Total</span>
            <span className="text-gold">${item.price + 2}</span>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          className="w-full h-14 bg-gradient-to-r from-gold-light to-gold text-white rounded-full font-semibold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-2xl"
        >
          Place Order
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gradient-to-br from-gold-light to-gold px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              animate={{ y: [-4, 0, -4] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon, label, badge, highlight, onClick }: any) {
  return (
    <button onClick={onClick} className={`relative aspect-square p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all backdrop-blur-xl shadow-lg ${highlight ? 'bg-gold/20 border-gold shadow-[0_0_30px_rgba(189,155,48,0.4)]' : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-gold hover:shadow-xl hover:-translate-y-1'}`}>
      {badge && <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg" />}
      <Icon className="w-5 h-5 text-gold" />
      <span className="text-[10px] text-navy text-center leading-tight font-medium">{label}</span>
    </button>
  )
}

function FoodCard({ name, description, price, image, aiPick, added, onAdd }: any) {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-3 flex gap-3 hover:shadow-2xl hover:bg-white/15 hover:scale-[1.02] transition-all shadow-lg">
      <div className="relative">
        <img src={image} alt={name} className="w-24 h-24 rounded-2xl object-cover" />
        {aiPick && (
          <div className="absolute top-1 right-1 backdrop-blur-xl bg-white/30 text-navy text-xs px-2 py-0.5 rounded-full font-semibold shadow-lg border border-white/40">
            Popular
          </div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-navy">{name}</h4>
        <p className="text-xs text-navy/60 line-clamp-1">{description}</p>
        <p className="text-sm font-semibold text-navy mt-2">${price}</p>
      </div>
      <button
        onClick={onAdd}
        className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/30 border border-white/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg"
      >
        {added ? (
          <Check className="w-5 h-5 text-navy" />
        ) : (
          <Plus className="w-5 h-5 text-navy" />
        )}
      </button>
    </div>
  )
}
