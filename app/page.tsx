'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  MessageSquare,
  BarChart3,
  Users,
  ArrowRight,
  Check,
  TrendingUp,
  Zap,
  Shield,
  Globe,
  DollarSign,
  Target,
  Rocket,
  Award,
  Building2,
  LineChart
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  const [waitlistTab, setWaitlistTab] = useState<'guest' | 'hotel'>('guest')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Demo orchestration
  const guestIframeRef = useRef<HTMLIFrameElement>(null)
  const dashboardIframeRef = useRef<HTMLIFrameElement>(null)
  const demoSectionRef = useRef<HTMLDivElement>(null)
  const [demoStarted, setDemoStarted] = useState(false)
  const [clickIndicators, setClickIndicators] = useState<{id: number, x: number, y: number, target: 'guest' | 'dashboard'}[]>([])

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitted(true)
    setIsSubmitting(false)
    setTimeout(() => {
      setSubmitted(false)
      setEmail('')
    }, 3000)
  }

  // Listen for messages from guest app
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: verify origin
      if (event.origin !== window.location.origin) return

      const { type, action, request } = event.data

      if (type === 'DEMO_EVENT') {
        // Show click indicator on dashboard when guest triggers actions
        if (action === 'HOUSEKEEPING_REQUESTED' || action === 'FOOD_ORDERED') {
          const id = Date.now()
          setClickIndicators(prev => [...prev, { id, x: 50, y: 30, target: 'dashboard' }])
          setTimeout(() => {
            setClickIndicators(prev => prev.filter(ind => ind.id !== id))
          }, 800)
        }

        // Forward events to dashboard
        if (action === 'HOUSEKEEPING_REQUESTED') {
          setTimeout(() => {
            dashboardIframeRef.current?.contentWindow?.postMessage({
              type: 'ADD_REQUEST',
              request: {
                id: Date.now(),
                guest: 'Sarah Ahmed',
                room: '1204',
                item: 'Room Cleaning',
                status: 'pending',
                time: 'Just now',
                staff: 'James',
                staffInitials: 'JM',
                isNew: true,
                estimate: '~18 min'
              }
            }, window.location.origin)
          }, 800)
        } else if (action === 'FOOD_ORDERED') {
          setTimeout(() => {
            dashboardIframeRef.current?.contentWindow?.postMessage({
              type: 'ADD_REQUEST',
              request: {
                id: Date.now() + 1,
                guest: 'Sarah Ahmed',
                room: '1204',
                item: 'Caesar Salad',
                status: 'pending',
                time: 'Just now',
                staff: 'Olivia',
                staffInitials: 'OC',
                isNew: true,
                estimate: '~32 min'
              }
            }, window.location.origin)
          }, 800)
        } else if (action === 'VIEWING_REQUESTS') {
          // Show click indicator on Analytics tab first
          setTimeout(() => {
            const id = Date.now()
            setClickIndicators(prev => [...prev, { id, x: 85, y: 12, target: 'dashboard' }])
            setTimeout(() => {
              setClickIndicators(prev => prev.filter(ind => ind.id !== id))
            }, 1500)
          }, 1500)

          // Then switch dashboard to analytics after showing click
          setTimeout(() => {
            dashboardIframeRef.current?.contentWindow?.postMessage({
              type: 'SWITCH_VIEW',
              view: 'analytics'
            }, window.location.origin)
          }, 3500)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Intersection Observer to start demo when section is visible
  useEffect(() => {
    if (!demoSectionRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !demoStarted) {
            console.log('=== LANDING PAGE DEMO DEBUG ===')
            console.log('Demo section is visible, starting demo...')
            setDemoStarted(true)
            // Start the demo after a short delay
            setTimeout(() => {
              guestIframeRef.current?.contentWindow?.postMessage({
                type: 'START_DEMO'
              }, window.location.origin)
              console.log('Sent START_DEMO message to guest iframe')
            }, 500)
          }
        })
      },
      { threshold: 0.3 } // Trigger when 30% visible
    )

    observer.observe(demoSectionRef.current)
    return () => observer.disconnect()
  }, [demoStarted])

  // Debug iframe dimensions
  useEffect(() => {
    setTimeout(() => {
      console.log('=== IFRAME DIMENSIONS DEBUG ===')
      if (guestIframeRef.current) {
        const guestRect = guestIframeRef.current.getBoundingClientRect()
        console.log('Guest iframe:', {
          width: guestRect.width,
          height: guestRect.height,
          expectedScale: 0.8,
          contentWidth: 375,
          contentHeight: 812,
          calculatedDisplayWidth: 375 * 0.8,
          calculatedDisplayHeight: 812 * 0.8
        })
      }
      if (dashboardIframeRef.current) {
        const dashRect = dashboardIframeRef.current.getBoundingClientRect()
        console.log('Dashboard iframe:', {
          width: dashRect.width,
          height: dashRect.height,
          expectedScale: 0.451,
          contentWidth: 1440,
          contentHeight: 1039,
          calculatedDisplayWidth: 1440 * 0.451,
          calculatedDisplayHeight: 1039 * 0.451
        })
      }
      console.log('================================')
    }, 2000)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Flowing Blue Smoke Background - matching demo pages */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-white">
        <div className="absolute inset-0">
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
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/20 border-b border-white/20"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="INNARA" width={48} height={48} className="rounded-full" />
              <span className="text-3xl font-light tracking-wider text-navy" style={{ fontFamily: 'Georgia, serif' }}>INNARA</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#product" className="text-navy/70 hover:text-navy transition-colors font-medium">Product</a>
              <a href="#metrics" className="text-navy/70 hover:text-navy transition-colors font-medium">Metrics</a>
              <a href="#demo" className="text-navy/70 hover:text-navy transition-colors font-medium">Demo</a>
              <motion.a
                href="#waitlist"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-navy text-white rounded-full font-semibold shadow-lg hover:bg-navy-hover transition-all"
              >
                Join Waitlist
              </motion.a>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-5xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-8 px-6 py-3 backdrop-blur-xl bg-white/40 border border-white/40 rounded-full shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="text-navy font-semibold">Backed by AI • Trusted by 5-star hotels</span>
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-light text-navy mb-8 leading-tight tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                The AI Concierge
                <br />
                <span className="font-normal italic">Hotels Deserve</span>
              </h1>

              <p className="text-xl md:text-2xl text-navy/70 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
                Transform guest experiences with intelligent automation.
                <br className="hidden md:block" />
                Delight every guest while reducing operational costs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                <motion.a
                  href="#waitlist"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-10 py-5 bg-navy text-white rounded-full font-semibold text-lg shadow-2xl hover:bg-navy-hover transition-all flex items-center justify-center gap-3"
                >
                  Join Waitlist
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>

                <motion.a
                  href="#demo"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 backdrop-blur-xl bg-white/40 border-2 border-navy/30 text-navy rounded-full font-semibold text-lg shadow-xl hover:bg-white/60 hover:border-navy/50 transition-all"
                >
                  View Live Demo
                </motion.a>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {[
                  { value: '$1.5T', label: 'Market Size', icon: Globe, highlight: true },
                  { value: '40%', label: 'Target Revenue Lift', icon: DollarSign, highlight: true },
                  { value: '35%', label: 'Projected Savings', icon: TrendingUp, highlight: false },
                  { value: '94%', label: 'Satisfaction Goal', icon: Award, highlight: false },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={`backdrop-blur-xl ${metric.highlight ? 'bg-gradient-to-br from-gold/20 to-gold/10 border-gold/50' : 'bg-white/30 border-white/40'} border rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all`}
                  >
                    <metric.icon className={`w-8 h-8 ${metric.highlight ? 'text-gold' : 'text-navy'} mb-3 mx-auto`} />
                    <div className={`text-4xl font-bold ${metric.highlight ? 'text-gold' : 'text-navy'} mb-1`}>{metric.value}</div>
                    <div className="text-sm text-navy/70 font-medium">{metric.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Traction & Market Timing */}
        <section id="metrics" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-light text-navy mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Our <span className="italic">Goals</span>
              </h2>
              <p className="text-xl text-navy/70 max-w-2xl mx-auto font-light">
                Target metrics we're working toward
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  value: '3',
                  label: 'Target Pilot Hotels',
                  sublabel: 'Luxury properties',
                  icon: Building2,
                  color: 'from-gold/30 to-gold/20'
                },
                {
                  value: '50+',
                  label: 'Projected Waitlist',
                  sublabel: 'Hotels interested',
                  icon: TrendingUp,
                  color: 'from-blue-500/30 to-blue-500/20'
                },
                {
                  value: '94%',
                  label: 'Satisfaction Goal',
                  sublabel: 'Target guest rating',
                  icon: Award,
                  color: 'from-green-500/30 to-green-500/20'
                }
              ].map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`backdrop-blur-xl bg-gradient-to-br ${metric.color} border border-white/40 rounded-3xl p-10 text-center shadow-2xl hover:scale-105 transition-all`}
                >
                  <metric.icon className="w-12 h-12 text-navy mx-auto mb-6" />
                  <div className="text-6xl font-bold text-navy mb-3">{metric.value}</div>
                  <div className="text-xl font-semibold text-navy mb-2">{metric.label}</div>
                  <div className="text-sm text-navy/60">{metric.sublabel}</div>
                </motion.div>
              ))}
            </div>

            {/* Why Now */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="backdrop-blur-xl bg-white/40 border border-white/40 rounded-3xl p-12 shadow-2xl"
            >
              <div className="text-center mb-10">
                <Rocket className="w-16 h-16 text-gold mx-auto mb-6" />
                <h3 className="text-4xl font-light text-navy mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                  Why <span className="italic">Now</span>?
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: 'Labor Crisis',
                    description: 'Hotels facing 30% staff shortages post-pandemic. AI automation is no longer optional—it\'s survival.'
                  },
                  {
                    title: 'Guest Expectations',
                    description: '87% of luxury travelers now expect instant, personalized service through mobile apps.'
                  },
                  {
                    title: 'Technology Readiness',
                    description: 'Modern LLMs finally capable of human-quality conversations at scale.'
                  },
                  {
                    title: 'Market Consolidation',
                    description: 'First mover advantage in emerging $15B hotel tech AI segment.'
                  }
                ].map((reason, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <Check className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-xl font-semibold text-navy mb-2">{reason.title}</h4>
                      <p className="text-navy/70 leading-relaxed">{reason.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Product Showcase */}
        <section ref={demoSectionRef} id="product" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-light text-navy mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Two Sides. <span className="italic">One Platform.</span>
              </h2>
              <p className="text-xl text-navy/70 max-w-2xl mx-auto font-light">
                Seamless AI-powered communication between guests and staff
              </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-12 items-start justify-center mb-20">
              {/* Guest Side - Phone Mockup with Live Preview */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group relative flex-shrink-0"
              >
                <div className="backdrop-blur-xl bg-white/40 border border-white/40 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center shadow-lg">
                      <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-navy">For Guests</h3>
                      <p className="text-navy/60 text-sm">Mobile experience</p>
                    </div>
                  </div>

                  {/* Phone Mockup */}
                  <div className="relative mx-auto mb-6" style={{ width: '300px' }}>
                    {/* Phone Frame */}
                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>

                      {/* Screen */}
                      <div className="relative bg-white rounded-[2.5rem] overflow-hidden" style={{ height: '620px' }}>
                        <iframe
                          ref={guestIframeRef}
                          src="/guest?embed=true"
                          className="w-full h-full border-0"
                          title="Guest App Preview"
                        />
                        {/* Click indicators for guest */}
                        <AnimatePresence>
                          {clickIndicators.filter(ind => ind.target === 'guest').map((indicator) => (
                            <motion.div
                              key={indicator.id}
                              initial={{ scale: 0, opacity: 1 }}
                              animate={{ scale: 2, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.8 }}
                              className="absolute pointer-events-none"
                              style={{
                                left: `${indicator.x}%`,
                                top: `${indicator.y}%`,
                                width: '40px',
                                height: '40px',
                                marginLeft: '-20px',
                                marginTop: '-20px',
                                borderRadius: '50%',
                                border: '3px solid rgba(29, 27, 56, 0.6)',
                                background: 'radial-gradient(circle, rgba(29, 27, 56, 0.3) 0%, transparent 70%)'
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Home Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-700 rounded-full"></div>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {[
                      'Natural AI conversations',
                      'Instant service requests',
                      'Real-time order tracking',
                      'Personalized recommendations'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-gold flex-shrink-0" />
                        <span className="text-navy/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-center text-xs text-navy/60 mt-4 italic">Interactive demo • Try it yourself</p>
                </div>
              </motion.div>

              {/* Hotel Side - Laptop Mockup with Live Preview */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group relative flex-1"
              >
                <div className="backdrop-blur-xl bg-white/40 border border-white/40 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-navy">For Hotels</h3>
                      <p className="text-navy/60 text-sm">Powerful operations dashboard</p>
                    </div>
                  </div>

                  {/* Laptop Mockup */}
                  <div className="relative mb-6">
                    {/* Laptop Screen */}
                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-2xl p-3 shadow-2xl" style={{ width: '650px' }}>
                      {/* Webcam */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full z-10"></div>

                      {/* Screen */}
                      <div className="relative bg-white rounded-lg overflow-hidden" style={{ height: '468px' }}>
                        <iframe
                          ref={dashboardIframeRef}
                          src="/dashboard?embed=true"
                          className="w-full h-full border-0"
                          title="Dashboard Preview"
                        />
                        {/* Click indicators for dashboard */}
                        <AnimatePresence>
                          {clickIndicators.filter(ind => ind.target === 'dashboard').map((indicator) => (
                            <motion.div
                              key={indicator.id}
                              initial={{ scale: 0, opacity: 1 }}
                              animate={{ scale: 2.5, opacity: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.8 }}
                              className="absolute pointer-events-none"
                              style={{
                                left: `${indicator.x}%`,
                                top: `${indicator.y}%`,
                                width: '60px',
                                height: '60px',
                                marginLeft: '-30px',
                                marginTop: '-30px',
                                borderRadius: '50%',
                                border: '4px solid rgba(29, 27, 56, 0.6)',
                                background: 'radial-gradient(circle, rgba(29, 27, 56, 0.3) 0%, transparent 70%)'
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Laptop Base */}
                    <div className="relative h-4 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-xl shadow-xl">
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                    </div>

                    {/* Laptop Shadow/Stand */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-48 h-2 bg-gray-400/30 rounded-full blur-sm"></div>
                  </div>

                  <ul className="space-y-3">
                    {[
                      'Real-time request management',
                      'AI-powered insights & analytics',
                      'Automated task assignment',
                      'Revenue optimization'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-gold flex-shrink-0" />
                        <span className="text-navy/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-center text-xs text-navy/60 mt-4 italic">Interactive demo • Click to explore</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section id="demo" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="backdrop-blur-xl bg-gradient-to-br from-navy/90 to-navy-dark/90 border border-white/20 rounded-3xl p-12 shadow-2xl text-center"
            >
              <Sparkles className="w-16 h-16 text-gold mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Experience INNARA <span className="italic">Live</span>
              </h2>
              <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                See how INNARA transforms the guest experience in real-time
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <motion.div whileHover={{ scale: 1.05, y: -5 }} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
                  <MessageSquare className="w-12 h-12 text-gold mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Guest App</h3>
                  <p className="text-white/70 text-sm mb-6">Experience AI chat, room service, and more</p>
                  <Link
                    href="/guest"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-navy rounded-full font-semibold hover:bg-white/90 transition-all"
                  >
                    Try Guest App
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, y: -5 }} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
                  <BarChart3 className="w-12 h-12 text-gold mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-3">Staff Dashboard</h3>
                  <p className="text-white/70 text-sm mb-6">See real-time analytics and insights</p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-navy rounded-full font-semibold hover:bg-white/90 transition-all"
                  >
                    Try Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Waitlist Section */}
        <section id="waitlist" className="py-32 px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl md:text-6xl font-light text-navy mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                Join the <span className="italic">Revolution</span>
              </h2>
              <p className="text-xl text-navy/70 font-light">
                Be among the first to transform your hotel experience
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/40 border border-white/40 rounded-3xl p-10 shadow-2xl"
            >
              {/* Tabs */}
              <div className="flex gap-2 mb-8 p-1 backdrop-blur-xl bg-white/40 rounded-full">
                <button
                  onClick={() => setWaitlistTab('guest')}
                  className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                    waitlistTab === 'guest'
                      ? 'bg-navy text-white shadow-lg'
                      : 'text-navy/60 hover:text-navy'
                  }`}
                >
                  I'm a Guest
                </button>
                <button
                  onClick={() => setWaitlistTab('hotel')}
                  className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                    waitlistTab === 'hotel'
                      ? 'bg-navy text-white shadow-lg'
                      : 'text-navy/60 hover:text-navy'
                  }`}
                >
                  I'm a Hotel
                </button>
              </div>

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleWaitlistSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-navy mb-3">
                        {waitlistTab === 'guest' ? 'Email Address' : 'Work Email'}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/60 border-2 border-white/60 focus:border-gold focus:outline-none transition-all text-navy placeholder:text-navy/40"
                        placeholder={waitlistTab === 'guest' ? 'you@example.com' : 'you@hotel.com'}
                        required
                      />
                    </div>

                    {waitlistTab === 'hotel' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-sm font-semibold text-navy mb-3">
                          Hotel Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/60 border-2 border-white/60 focus:border-gold focus:outline-none transition-all text-navy placeholder:text-navy/40"
                          placeholder="Grand Hotel & Resorts"
                        />
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-5 bg-navy text-white rounded-full font-bold text-lg shadow-xl hover:bg-navy-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          {waitlistTab === 'guest' ? 'Get Early Access' : 'Request Demo'}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>

                    <p className="text-center text-sm text-navy/60">
                      {waitlistTab === 'guest'
                        ? 'Be the first to know when INNARA launches at your favorite hotels'
                        : 'Be among the first hotels to transform guest experiences with AI'
                      }
                    </p>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-semibold text-navy mb-3">Welcome to INNARA!</h3>
                    <p className="text-lg text-navy/70">
                      {waitlistTab === 'guest'
                        ? "You're on the list. We'll notify you when we launch."
                        : "Our team will reach out within 24 hours to schedule your demo."
                      }
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="backdrop-blur-xl bg-navy/90 border-t border-white/10 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="INNARA" width={40} height={40} className="rounded-full" />
                <span className="text-2xl font-light tracking-wider text-white" style={{ fontFamily: 'Georgia, serif' }}>INNARA</span>
              </div>

              <div className="flex items-center gap-8 text-sm text-white/70">
                <a href="/guest" className="hover:text-white transition-colors">Guest Demo</a>
                <a href="/dashboard" className="hover:text-white transition-colors">Dashboard Demo</a>
                <a href="#waitlist" className="hover:text-white transition-colors">Waitlist</a>
              </div>

              <div className="text-sm text-white/50">
                © 2025 INNARA. Illuminating hospitality.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
