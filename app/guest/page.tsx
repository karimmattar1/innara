'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ShoppingCart, UtensilsCrossed, Home, Car, Bell, Flower2, Shirt, Wrench, Clock, Plus, Check, ChevronLeft, ArrowRight, X } from 'lucide-react'
import Image from 'next/image'

export default function GuestApp() {
  const [view, setView] = useState<'chat' | 'room-service' | 'checkout'>('chat')
  const [step, setStep] = useState(0)
  const [cartItems, setCartItems] = useState<any[]>([])

  const nextStep = () => setStep(s => s + 1)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Light background with flowing dark blue smoke */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-white">
        <div className="absolute inset-0">
          {/* Dark blue smoke clouds - very subtle */}
          <motion.div
            className="absolute -top-32 -left-32 w-[700px] h-[500px] bg-blue-600/35 mix-blend-multiply filter blur-3xl"
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
            className="absolute top-20 -right-32 w-[600px] h-[600px] bg-indigo-600/35 mix-blend-multiply filter blur-3xl"
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
            className="absolute bottom-0 left-1/4 w-[800px] h-[400px] bg-blue-700/35 mix-blend-multiply filter blur-3xl"
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
            className="absolute top-1/2 right-1/4 w-[650px] h-[550px] bg-indigo-700/35 mix-blend-multiply filter blur-3xl"
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
      <div className="relative z-10">
        {/* Top Bar - Transparent & Blurred */}
        <div className="sticky top-0 z-20 h-[72px] backdrop-blur-2xl bg-white/20 border-b border-white/20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="INARA" width={56} height={56} className="rounded-full" />
            <span className="text-3xl font-light tracking-wider text-navy" style={{ fontFamily: 'Georgia, serif' }}>INARA</span>
          </div>
          <span className="text-sm text-gold font-semibold tracking-wide">Room 1204</span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center text-white text-sm font-semibold shadow-lg">
            SA
          </div>
        </div>

        {/* Welcome Section */}
        <div className="px-5 py-8">
          <h1 className="text-2xl font-semibold text-navy mb-2">Welcome back, Sarah</h1>
          <p className="text-sm text-navy/60">How can we help you today?</p>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {view === 'chat' && (
            <ChatView
              step={step}
              nextStep={nextStep}
              onRoomServiceClick={() => setView('room-service')}
            />
          )}

          {view === 'room-service' && (
            <RoomServiceView
              onBack={() => setView('chat')}
              onAddToCart={(item) => {
                setCartItems([item])
                setTimeout(() => setView('checkout'), 800)
              }}
            />
          )}

          {view === 'checkout' && (
            <CheckoutView
              item={cartItems[0]}
              onPlaceOrder={() => {
                setTimeout(() => setView('chat'), 3000)
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ChatView({ step, nextStep, onRoomServiceClick }: any) {
  // Auto-advance from step 2 (typing) to step 3 (AI response)
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => nextStep(), 1200)
      return () => clearTimeout(timer)
    }
  }, [step, nextStep])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-t-[32px] -mt-6 min-h-[calc(100vh-200px)] p-5 pb-24 shadow-2xl"
    >
      {/* Chat Messages */}
      <div className="space-y-4 mb-6">
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
                    <p>Of course, Sarah! I'll send housekeeping to Room 1204 right away. 🧹</p>
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

      {/* Chat Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="What do you need today?"
          onClick={() => step === 0 && nextStep()}
          className="w-full h-14 pl-5 pr-16 rounded-full backdrop-blur-xl bg-white/20 border-2 border-white/30 text-navy placeholder:text-navy/50 focus:outline-none focus:border-gold focus:shadow-glow-gold transition-all"
        />
        <button className="absolute right-2 top-2 w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <Sparkles className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Quick Actions */}
      {step >= 4 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold mb-3 text-navy">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-3">
            <ActionButton icon={Home} label="Housekeeping" badge />
            <ActionButton icon={UtensilsCrossed} label="Room Service" highlight onClick={onRoomServiceClick} />
            <ActionButton icon={Car} label="Valet" />
            <ActionButton icon={Flower2} label="Spa" />
            <ActionButton icon={Bell} label="Concierge" />
            <ActionButton icon={Shirt} label="Laundry" />
            <ActionButton icon={Wrench} label="Maintenance" />
            <ActionButton icon={Clock} label="Checkout" />
          </div>
        </motion.div>
      )}
    </motion.div>
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
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-t-[32px] -mt-6 min-h-[calc(100vh-200px)] pb-24 shadow-2xl"
    >
      <button onClick={onBack} className="flex items-center gap-1 p-5 text-white hover:text-gold transition-colors">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="px-5">
        <h2 className="text-2xl font-semibold mb-1 text-white">Room Service</h2>
        <p className="text-sm text-white/60 mb-4">Available 24/7</p>

        <div className="backdrop-blur-xl bg-gold/20 border-l-4 border-gold p-3 rounded-lg mb-4 flex items-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
          <span className="text-sm text-navy">💡 Popular right now: Caesar Salad</span>
        </div>

        <div className="flex gap-2 overflow-x-auto mb-4 pb-2 -mx-5 px-5">
          {['Popular', 'Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts'].map((cat, i) => (
            <button key={cat} className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border shadow-lg transition-all hover:scale-105 ${i === 0 ? 'bg-gradient-to-r from-gold-light to-gold text-white border-gold' : 'backdrop-blur-xl bg-white/10 text-navy border-white/20 hover:bg-white/15'}`}>
              {cat}
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
    </motion.div>
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
    <button onClick={onClick} className={`relative aspect-square p-3 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all backdrop-blur-xl shadow-lg ${highlight ? 'bg-gold/20 border-gold shadow-[0_0_30px_rgba(189,155,48,0.4)]' : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-gold hover:shadow-xl hover:-translate-y-1'}`}>
      {badge && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-400 rounded-full shadow-lg" />}
      <Icon className="w-6 h-6 text-gold" />
      <span className="text-xs text-navy text-center leading-tight font-medium">{label}</span>
    </button>
  )
}

function FoodCard({ name, description, price, image, aiPick, added, onAdd }: any) {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-3 flex gap-3 hover:shadow-2xl hover:bg-white/15 hover:border-gold hover:scale-[1.02] transition-all shadow-lg">
      <div className="relative">
        <img src={image} alt={name} className="w-24 h-24 rounded-2xl object-cover" />
        {aiPick && (
          <div className="absolute top-1 right-1 bg-gradient-to-r from-gold-light to-gold text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-lg">
            AI Pick
          </div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-navy">{name}</h4>
        <p className="text-xs text-navy/60 line-clamp-1">{description}</p>
        <p className="text-sm font-semibold text-gold mt-2">${price}</p>
      </div>
      <button
        onClick={onAdd}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xl"
      >
        {added ? (
          <Check className="w-5 h-5 text-white" />
        ) : (
          <Plus className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  )
}
