'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Home, UtensilsCrossed, Car, Bell, SlidersHorizontal, Sparkles, TrendingUp, Lightbulb, Zap, DollarSign, Clock, Users, BarChart3, TrendingDown, Star, Award, Target } from 'lucide-react'
import Image from 'next/image'

const initialRequests = [
  { id: 1, guest: 'Benjamin Turner', room: '305', item: 'Towels', status: 'in_progress', time: '10 min. ago', staff: 'James', staffInitials: 'JM' },
  { id: 2, guest: 'Emma Johnson', room: '420', item: 'Margherita Pizza', status: 'pending', time: '20 min. ago', staff: 'Olivia', staffInitials: 'OC' },
  { id: 3, guest: 'William Harris', room: '512', item: 'Car Retrieval', status: 'pending', time: '30 min. ago', staff: 'Ahmed', staffInitials: 'AA' },
  { id: 4, guest: 'Olivia Martinez', room: '203', item: 'Room Cleaning', status: 'pending', time: '30 min. ago', staff: 'Michael', staffInitials: 'MB' },
  { id: 5, guest: 'Michael Brown', room: '210', item: 'Extra Pillows', status: 'in_progress', time: '45 min. ago', staff: 'Sarah', staffInitials: 'SJ' },
]

function DashboardContent() {
  const searchParams = useSearchParams()
  const [isEmbed, setIsEmbed] = useState(false)
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics'>('dashboard')

  const [stats, setStats] = useState({
    total: 42,
    housekeeping: 14,
    roomService: 9,
    valet: 7,
  })
  const [requests, setRequests] = useState(initialRequests)
  const [activities, setActivities] = useState([
    { id: 'a3', text: 'Room 420 • Pizza delivered', time: '5 min ago' },
    { id: 'a4', text: 'Room 305 • Towels delivered', time: '12 min ago' },
  ])

  // Check for embed parameter using window.location for better iframe compatibility
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const embedParam = urlParams.get('embed')
    const isEmbedMode = embedParam === 'true'
    setIsEmbed(isEmbedMode)

    // Set viewport for embed mode - make content think it's 1440px wide (desktop size)
    if (isEmbedMode) {
      const metaViewport = document.querySelector('meta[name="viewport"]')
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=1440, initial-scale=1, maximum-scale=1, user-scalable=no')
      }
      // Also set body to exact size to prevent overflow
      document.body.style.width = '1440px'
      document.body.style.height = '900px' // Standard desktop height
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }

    console.log('=== DASHBOARD DEBUG ===')
    console.log('Full URL:', window.location.href)
    console.log('Search string:', window.location.search)
    console.log('URLSearchParams:', urlParams.toString())
    console.log('Embed param value:', embedParam)
    console.log('isEmbed:', isEmbedMode)
    console.log('Will hide nav bar:', isEmbedMode)

    // Dimension diagnostics
    console.log('--- VIEWPORT DIAGNOSTICS ---')
    console.log('window.innerWidth:', window.innerWidth)
    console.log('window.innerHeight:', window.innerHeight)
    console.log('document.body.clientWidth:', document.body.clientWidth)
    console.log('document.body.clientHeight:', document.body.clientHeight)
    console.log('document.body.scrollWidth:', document.body.scrollWidth)
    console.log('document.body.scrollHeight:', document.body.scrollHeight)
    console.log('devicePixelRatio:', window.devicePixelRatio)
    console.log('Is in iframe:', window.self !== window.top)

    if (window.self !== window.top) {
      console.log('--- IFRAME CONTEXT ---')
      console.log('Parent origin:', document.referrer)
    }

    console.log('--- SCALING MATH ---')
    console.log('Current scale:', 0.7)
    console.log('Height compensation:', '142.857%')
    console.log('Expected content width at scale 0.7:', window.innerWidth * 0.7)
    console.log('Expected visible height at scale 0.7:', window.innerHeight * 0.7)

    console.log('======================')

    // Check dimensions after render
    setTimeout(() => {
      console.log('--- POST-RENDER DIMENSIONS (Dashboard) ---')
      const scalingWrapper = document.querySelector('[data-scaling-wrapper]')
      if (scalingWrapper) {
        const rect = scalingWrapper.getBoundingClientRect()
        const computed = window.getComputedStyle(scalingWrapper as Element)
        console.log('Scaling wrapper rect:', {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        })
        console.log('Scaling wrapper computed:', {
          transform: computed.transform,
          width: computed.width,
          height: computed.height
        })
        console.log('Scaling wrapper scroll:', {
          scrollWidth: (scalingWrapper as HTMLElement).scrollWidth,
          scrollHeight: (scalingWrapper as HTMLElement).scrollHeight
        })
      }
      console.log('Body overflow:', {
        overflowX: window.getComputedStyle(document.body).overflowX,
        overflowY: window.getComputedStyle(document.body).overflowY
      })
      console.log('=========================================')
    }, 1000)
  }, [])

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setRequests(prev => [{
        id: 6,
        guest: 'Sarah Ahmed',
        room: '1204',
        item: 'Room Cleaning',
        status: 'pending',
        time: 'Just now',
        staff: 'James',
        staffInitials: 'JM',
        isNew: true,
        estimate: '~18 min'
      }, ...prev])

      setStats(prev => ({
        ...prev,
        total: 43,
        housekeeping: 15
      }))

      setActivities(prev => [{
        id: 'a2',
        text: 'Room 1204 • Housekeeping requested',
        time: 'Just now'
      }, ...prev])
    }, 3000)

    const timer2 = setTimeout(() => {
      setRequests(prev => [{
        id: 7,
        guest: 'Sarah Ahmed',
        room: '1204',
        item: 'Caesar Salad',
        status: 'pending',
        time: 'Just now',
        staff: 'Olivia',
        staffInitials: 'OC',
        isNew: true,
        estimate: '~32 min'
      }, ...prev])

      setStats(prev => ({
        ...prev,
        total: 44,
        roomService: 10
      }))

      setActivities(prev => [{
        id: 'a1',
        text: 'Room 1204 • Caesar Salad ordered',
        time: 'Just now'
      }, ...prev])
    }, 5500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Light background with flowing dark blue smoke */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-white">
        <div className="absolute inset-0">
          {/* Dark blue smoke clouds - very subtle */}
          <div
            className="absolute -top-32 -left-32 w-[700px] h-[500px] bg-blue-600/35 mix-blend-multiply filter blur-3xl animate-blob"
            style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
          />
          <div
            className="absolute top-20 -right-32 w-[600px] h-[600px] bg-indigo-600/35 mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"
            style={{ borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-[800px] h-[400px] bg-blue-700/35 mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"
            style={{ borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%' }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-[650px] h-[550px] bg-indigo-700/35 mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"
            style={{ borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%' }}
          />
        </div>
      </div>

      {/* Top Nav - Transparent & Blurred (Hidden in embed mode) */}
      {!isEmbed && (
        <div className="sticky top-0 z-20 backdrop-blur-2xl bg-white/20 border-b border-white/20">
          <div className="px-12 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <Image src="/logo.png" alt="INNARA" fill className="object-contain rounded-full" />
              </div>
              <span className="text-4xl font-light tracking-wider text-navy" style={{ fontFamily: 'Georgia, serif' }}>INNARA</span>
            </div>

            <div className="flex items-center gap-8">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`text-sm font-semibold pb-5 pt-6 transition-colors ${activeView === 'dashboard' ? 'text-gold border-b-2 border-gold' : 'text-navy/60 hover:text-navy'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`text-sm font-semibold pb-5 pt-6 transition-colors ${activeView === 'analytics' ? 'text-gold border-b-2 border-gold' : 'text-navy/60 hover:text-navy'}`}
              >
                Analytics
              </button>
              <button className="text-sm font-semibold text-navy/60 hover:text-navy pb-5 pt-6 transition-colors">Requests</button>
              <button className="text-sm font-semibold text-navy/60 hover:text-navy pb-5 pt-6 transition-colors">Rooms</button>
              <button className="text-sm font-semibold text-navy/60 hover:text-navy pb-5 pt-6 transition-colors">Reports</button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-white/40 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <Bell className="w-5 h-5 text-navy" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">2</div>
              </div>
              <div className="w-11 h-11 bg-gradient-to-br from-navy to-navy-dark rounded-full flex items-center justify-center text-gold text-sm font-bold cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-gold/30">
                JM
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 p-12 space-y-8">
        {activeView === 'dashboard' ? (
          <>
        {/* Top Stats Row - Key Metrics */}
        <div className="grid grid-cols-5 gap-6">
          <MetricCard
            icon={Star}
            label="Guest Happiness"
            value="94%"
            change="+3% vs last week"
            trend="up"
            description="Based on 128 interactions"
          />
          <MetricCard
            icon={DollarSign}
            label="Revenue Today"
            value="$12.4K"
            change="+$2.1K vs yesterday"
            trend="up"
            description="Upsell conversion: 34%"
          />
          <MetricCard
            icon={Clock}
            label="Avg Resolution"
            value="6.2 min"
            change="-1.8 min vs yesterday"
            trend="up"
            description="Target: < 8 min"
          />
          <MetricCard
            icon={ClipboardList}
            label="Active Requests"
            value={stats.total}
            change="+2 today"
            trend="neutral"
            description="2 high priority"
          />
          <MetricCard
            icon={Users}
            label="Guests Served"
            value="87"
            change="+12 today"
            trend="up"
            description="168 total checked in"
          />
        </div>

        {/* Active Requests Table */}
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-navy mb-1">Active Requests</h2>
              <p className="text-sm text-navy/60">Real-time request tracking and assignment</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-navy hover:bg-white/30 transition-all">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-navy/20">
                <th className="text-left text-xs uppercase text-navy/70 font-semibold pb-4">Guest</th>
                <th className="text-left text-xs uppercase text-navy/70 font-semibold pb-4">Room</th>
                <th className="text-left text-xs uppercase text-navy/70 font-semibold pb-4">Item</th>
                <th className="text-left text-xs uppercase text-navy/70 font-semibold pb-4">Status</th>
                <th className="text-left text-xs uppercase text-navy/70 font-semibold pb-4">Requested</th>
                <th className="text-left text-xs uppercase text-navy/70 font-semibold pb-4">Staff</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {requests.map((request) => (
                  <RequestRow key={request.id} request={request} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* 30-Day Trends Chart */}
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-navy flex items-center gap-2 mb-1">
                30-Day Performance Trends
                <BarChart3 className="w-6 h-6 text-gold" />
              </h2>
              <p className="text-sm text-navy/60">Request volume, resolution time, and guest satisfaction</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold"></div>
                <span className="text-xs text-navy/70">Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-navy/70">Satisfaction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-navy/70">Revenue</span>
              </div>
            </div>
          </div>
          <TrendsChart />
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Room Service Demand Forecast */}
          <div className="col-span-5">
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-navy flex items-center gap-2 mb-1">
                  <UtensilsCrossed className="w-5 h-5 text-gold" />
                  Room Service Forecast
                </h2>
                <p className="text-sm text-navy/60">Next 6 hours predicted demand</p>
              </div>
              <div className="space-y-4">
                <ForecastBar time="2-3 PM" demand={85} label="Peak" />
                <ForecastBar time="3-4 PM" demand={92} label="Peak" highlight />
                <ForecastBar time="4-5 PM" demand={78} label="High" />
                <ForecastBar time="5-6 PM" demand={65} label="Moderate" />
                <ForecastBar time="6-7 PM" demand={88} label="Peak" />
                <ForecastBar time="7-8 PM" demand={95} label="Peak" highlight />
              </div>
              <div className="mt-6 pt-6 border-t border-navy/20">
                <div className="flex items-center gap-3 backdrop-blur-xl bg-gold/10 border-l-4 border-gold p-4 rounded-lg">
                  <Sparkles className="w-5 h-5 text-gold flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-navy mb-1">AI Recommendation</p>
                    <p className="text-xs text-navy/70">Add 2 kitchen staff for 3-4 PM and 7-8 PM peaks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Performance Leaderboard */}
          <div className="col-span-4">
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-navy flex items-center gap-2 mb-1">
                  <Award className="w-5 h-5 text-gold" />
                  Top Performers Today
                </h2>
                <p className="text-sm text-navy/60">Based on speed and guest ratings</p>
              </div>
              <div className="space-y-4">
                <StaffRank rank={1} name="James Miller" tasks={23} rating={4.9} avgTime="4.2 min" />
                <StaffRank rank={2} name="Sarah Johnson" tasks={21} rating={4.8} avgTime="5.1 min" />
                <StaffRank rank={3} name="Ahmed Ali" tasks={19} rating={4.9} avgTime="5.8 min" />
                <StaffRank rank={4} name="Olivia Chen" tasks={18} rating={4.7} avgTime="6.3 min" />
                <StaffRank rank={5} name="Michael Brown" tasks={17} rating={4.8} avgTime="6.5 min" />
              </div>
            </div>
          </div>

          {/* Predictive AI Insights */}
          <div className="col-span-3">
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-navy flex items-center gap-2 mb-1">
                  AI Insights
                  <Sparkles className="w-5 h-5 text-gold" />
                </h2>
                <p className="text-sm text-navy/60">Real-time intelligence</p>
              </div>
              <div className="space-y-5">
                <AIInsightCard
                  icon={Target}
                  title="Upsell Alert"
                  value="Room 1204"
                  description="Guest ordered Caesar Salad - recommend wine pairing"
                  urgency="high"
                />
                <AIInsightCard
                  icon={TrendingUp}
                  title="Demand Spike"
                  value="+40% spa"
                  description="Sunny weather forecast tomorrow - pre-stock towels"
                  urgency="medium"
                />
                <AIInsightCard
                  icon={Lightbulb}
                  title="Pattern Detected"
                  value="3 VIP guests"
                  description="Checking in at 3 PM - prep premium amenities"
                  urgency="high"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-navy/20">
                <h3 className="text-sm font-semibold text-navy mb-4">Live Activity</h3>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-start gap-2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-gold rounded-full mt-1.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs text-navy/90">{activity.text}</p>
                        <p className="text-[10px] text-navy/50 mt-0.5">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        ) : (
          <AnalyticsView />
        )}
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-white" />}>
      <DashboardContent />
    </Suspense>
  )
}

function MetricCard({ icon: Icon, label, value, change, trend, description }: any) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-navy/60'
  }

  return (
    <motion.div
      layout
      className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-white/15 hover:scale-105 hover:shadow-[0_0_40px_rgba(189,155,48,0.3)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-gold" />
        </div>
      </div>
      <p className="text-xs uppercase text-navy/70 font-semibold tracking-wide mb-1">{label}</p>
      <motion.p
        key={value}
        initial={{ scale: 1.2, color: '#bd9b30' }}
        animate={{ scale: 1, color: '#1d1b38' }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-navy mb-1"
      >
        {value}
      </motion.p>
      <p className={`text-xs ${trendColors[trend as keyof typeof trendColors]} font-medium mb-1`}>
        {change}
      </p>
      <p className="text-[10px] text-navy/50">{description}</p>
    </motion.div>
  )
}

function TrendsChart() {
  // 30 data points for the last 30 days
  const requestData = [42, 38, 45, 48, 44, 52, 49, 55, 51, 48, 56, 53, 58, 62, 59, 64, 61, 58, 65, 68, 63, 70, 67, 72, 69, 75, 71, 78, 74, 80]
  const satisfactionData = [88, 87, 89, 91, 90, 92, 91, 93, 92, 91, 94, 93, 95, 94, 93, 95, 94, 96, 95, 94, 96, 95, 97, 96, 95, 97, 96, 95, 96, 94]
  const revenueData = [8.2, 7.8, 8.5, 9.1, 8.7, 9.4, 9.2, 10.1, 9.8, 9.5, 10.3, 10.0, 10.8, 11.2, 10.9, 11.5, 11.2, 10.9, 11.8, 12.1, 11.7, 12.4, 12.0, 12.7, 12.3, 13.0, 12.6, 13.3, 12.9, 12.4]

  const maxRequest = Math.max(...requestData)
  const maxSatisfaction = 100
  const maxRevenue = Math.max(...revenueData)

  const width = 1100
  const height = 250
  const padding = 40

  const createPath = (data: number[], max: number) => {
    const xStep = (width - padding * 2) / (data.length - 1)
    const points = data.map((value, i) => {
      const x = padding + i * xStep
      const y = height - padding - ((value / max) * (height - padding * 2))
      return `${x},${y}`
    })
    return `M ${points.join(' L ')}`
  }

  return (
    <div className="relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + i * ((height - padding * 2) / 4)}
            x2={width - padding}
            y2={padding + i * ((height - padding * 2) / 4)}
            stroke="#1d1b38"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
        ))}

        {/* Revenue area */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 2, delay: 0.4 }}
          d={`${createPath(revenueData, maxRevenue)} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill="url(#revenueGradient)"
        />

        {/* Revenue line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.4 }}
          d={createPath(revenueData, maxRevenue)}
          stroke="#10b981"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Requests line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2 }}
          d={createPath(requestData, maxRequest)}
          stroke="#bd9b30"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Satisfaction line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.2 }}
          d={createPath(satisfactionData, maxSatisfaction)}
          stroke="#3b82f6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-4 px-10">
        <span className="text-xs text-navy/50">Day 1</span>
        <span className="text-xs text-navy/50">Day 15</span>
        <span className="text-xs text-navy/50">Day 30</span>
      </div>
    </div>
  )
}

function ForecastBar({ time, demand, label, highlight }: any) {
  const getColor = () => {
    if (demand >= 90) return 'from-red-500 to-red-600'
    if (demand >= 75) return 'from-orange-500 to-orange-600'
    return 'from-blue-500 to-blue-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-navy">{time}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-navy/60">{label}</span>
          {highlight && (
            <Sparkles className="w-3 h-3 text-gold" />
          )}
        </div>
      </div>
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${demand}%` }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className={`h-full bg-gradient-to-r ${getColor()} rounded-full`}
        />
      </div>
    </div>
  )
}

function StaffRank({ rank, name, tasks, rating, avgTime }: any) {
  const getMedalColor = () => {
    if (rank === 1) return 'from-gold to-yellow-600'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-amber-600 to-amber-700'
    return 'from-navy/20 to-navy/30'
  }

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
    >
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMedalColor()} flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
        {rank}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-navy">{name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-navy/60">{tasks} tasks</span>
          <span className="text-xs text-navy/60">•</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-gold fill-gold" />
            <span className="text-xs text-navy/70 font-semibold">{rating}</span>
          </div>
          <span className="text-xs text-navy/60">•</span>
          <span className="text-xs text-navy/60">{avgTime}</span>
        </div>
      </div>
    </motion.div>
  )
}

function AIInsightCard({ icon: Icon, title, value, description, urgency }: any) {
  const urgencyColors = {
    high: 'border-l-red-500 bg-red-500/5',
    medium: 'border-l-orange-500 bg-orange-500/5',
    low: 'border-l-blue-500 bg-blue-500/5'
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`backdrop-blur-xl bg-white/5 border-l-4 ${urgencyColors[urgency as keyof typeof urgencyColors]} border border-white/10 rounded-xl p-4`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-navy/90 mb-1">{title}</p>
          <p className="text-sm font-bold text-navy mb-1">{value}</p>
          <p className="text-[10px] text-navy/60 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

function RequestRow({ request }: any) {
  return (
    <motion.tr
      initial={request.isNew ? { y: -20, opacity: 0, backgroundColor: 'rgba(189, 155, 48, 0.2)' } : false}
      animate={request.isNew ? {
        y: 0,
        opacity: 1,
        backgroundColor: ['rgba(189, 155, 48, 0.2)', 'rgba(189, 155, 48, 0.2)', 'transparent']
      } : { y: 0, opacity: 1 }}
      transition={request.isNew ? {
        duration: 0.6,
        backgroundColor: {
          times: [0, 0.7, 1],
          duration: 2.5
        }
      } : { duration: 0.6 }}
      className="border-b border-navy/10 hover:bg-white/5"
    >
      <td className="py-5">
        <p className="text-sm font-semibold text-navy">{request.guest}</p>
      </td>
      <td className="py-5">
        <p className="text-sm text-navy/80 font-mono bg-navy/10 px-3 py-1 rounded-full inline-block">{request.room}</p>
      </td>
      <td className="py-5">
        <p className="text-sm text-navy/80">{request.item}</p>
      </td>
      <td className="py-5">
        <StatusBadge status={request.status} />
      </td>
      <td className="py-5">
        <div className="flex items-center gap-2">
          <p className="text-sm text-white/60">{request.time}</p>
          {request.isNew && (
            <span className="text-xs font-semibold text-gold px-2 py-0.5 rounded-full bg-gold/20 border border-gold/30">NEW</span>
          )}
          {request.estimate && (
            <span className="text-xs border border-gold/50 text-gold px-2 py-0.5 rounded-full bg-gold/10">{request.estimate}</span>
          )}
        </div>
      </td>
      <td className="py-5">
        <StaffAvatar initials={request.staffInitials} name={request.staff} />
      </td>
    </motion.tr>
  )
}

function StatusBadge({ status }: any) {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    in_progress: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  }

  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${styles[status as keyof typeof styles]}`}>
      {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function StaffAvatar({ initials, name }: any) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-dark flex items-center justify-center text-gold text-xs font-bold border-2 border-gold/20 shadow-lg hover:scale-110 transition-transform cursor-pointer">
      {initials}
    </div>
  )
}

function AnalyticsView() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-4xl font-light text-navy mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          In-Depth Analytics
        </h1>
        <p className="text-sm text-navy/60">Comprehensive performance metrics and insights</p>
      </div>

      {/* KPI Overview - 4 columns */}
      <div className="grid grid-cols-4 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 text-gold" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xs uppercase text-navy/70 font-semibold tracking-wide mb-1">Total Revenue (30d)</p>
          <p className="text-3xl font-bold text-navy mb-1">$247.8K</p>
          <p className="text-xs text-green-500 font-medium">+18.2% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 text-gold" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xs uppercase text-navy/70 font-semibold tracking-wide mb-1">Guests Served</p>
          <p className="text-3xl font-bold text-navy mb-1">2,847</p>
          <p className="text-xs text-green-500 font-medium">+12.4% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Star className="w-10 h-10 text-gold" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xs uppercase text-navy/70 font-semibold tracking-wide mb-1">Avg Satisfaction</p>
          <p className="text-3xl font-bold text-navy mb-1">94.8%</p>
          <p className="text-xs text-green-500 font-medium">+2.1% vs last month</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="w-10 h-10 text-gold" />
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xs uppercase text-navy/70 font-semibold tracking-wide mb-1">First Call Resolution</p>
          <p className="text-3xl font-bold text-navy mb-1">87.3%</p>
          <p className="text-xs text-green-500 font-medium">+5.7% vs last month</p>
        </motion.div>
      </div>

      {/* Service Category Breakdown */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl col-span-2"
        >
          <h3 className="text-xl font-semibold text-navy mb-6">Request Volume by Category</h3>
          <div className="space-y-5">
            {[
              { category: 'Room Service', count: 847, percentage: 32, color: 'from-amber-400 to-orange-500', revenue: '$42.1K' },
              { category: 'Housekeeping', count: 623, percentage: 23, color: 'from-blue-400 to-cyan-500', revenue: '$18.7K' },
              { category: 'Concierge', count: 512, percentage: 19, color: 'from-purple-400 to-indigo-500', revenue: '$38.2K' },
              { category: 'Spa & Wellness', count: 387, percentage: 15, color: 'from-pink-400 to-rose-500', revenue: '$67.4K' },
              { category: 'Valet', count: 298, percentage: 11, color: 'from-green-400 to-emerald-500', revenue: '$8.9K' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`} />
                    <span className="text-sm font-medium text-navy">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-navy/60">{item.count} requests</span>
                    <span className="text-sm font-semibold text-gold">{item.revenue}</span>
                    <span className="text-xs font-semibold text-navy/80 w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1.5, delay: i * 0.1 }}
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <h3 className="text-xl font-semibold text-navy mb-6">Peak Hours</h3>
          <div className="space-y-4">
            {[
              { time: '8:00 AM - 10:00 AM', demand: 95, label: 'Breakfast Rush' },
              { time: '12:00 PM - 2:00 PM', demand: 88, label: 'Lunch Peak' },
              { time: '7:00 PM - 9:00 PM', demand: 92, label: 'Dinner Peak' },
              { time: '10:00 PM - 12:00 AM', demand: 45, label: 'Evening Service' },
            ].map((slot, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-navy">{slot.time}</p>
                    <p className="text-xs text-navy/60">{slot.label}</p>
                  </div>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${slot.demand}%` }}
                    transition={{ duration: 1.5, delay: i * 0.1 }}
                    className={`h-full bg-gradient-to-r ${
                      slot.demand >= 85 ? 'from-red-500 to-red-600' :
                      slot.demand >= 70 ? 'from-orange-500 to-orange-600' :
                      'from-blue-500 to-blue-600'
                    } rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Response Time & Staff Performance */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <h3 className="text-xl font-semibold text-navy mb-6">Response Time Breakdown</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-navy/80">Under 5 minutes</span>
                <span className="text-sm font-semibold text-navy">67%</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '67%' }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-navy/80">5-10 minutes</span>
                <span className="text-sm font-semibold text-navy">24%</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '24%' }}
                  transition={{ duration: 1.5, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-navy/80">Over 10 minutes</span>
                <span className="text-sm font-semibold text-navy">9%</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '9%' }}
                  transition={{ duration: 1.5, delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-navy">Average Response Time</span>
                <span className="text-2xl font-bold text-gold">6.2 min</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <h3 className="text-xl font-semibold text-navy mb-6">Top Performing Staff</h3>
          <div className="space-y-4">
            {[
              { rank: 1, name: 'Sarah Johnson', tasks: 147, rating: 4.9, avgTime: '4.2 min' },
              { rank: 2, name: 'Michael Chen', tasks: 134, rating: 4.8, avgTime: '5.1 min' },
              { rank: 3, name: 'Ahmed Ali', tasks: 128, rating: 4.8, avgTime: '5.3 min' },
              { rank: 4, name: 'Emma Davis', tasks: 121, rating: 4.7, avgTime: '5.9 min' },
              { rank: 5, name: 'James Wilson', tasks: 115, rating: 4.7, avgTime: '6.1 min' },
            ].map((staff) => (
              <motion.div
                key={staff.rank}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: staff.rank * 0.1 }}
                className="flex items-center gap-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                  staff.rank === 1 ? 'from-gold to-yellow-600' :
                  staff.rank === 2 ? 'from-gray-300 to-gray-400' :
                  staff.rank === 3 ? 'from-amber-600 to-amber-700' :
                  'from-navy/20 to-navy/30'
                } flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
                  {staff.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">{staff.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-navy/60">{staff.tasks} tasks</span>
                    <span className="text-xs text-navy/60">•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-gold fill-gold" />
                      <span className="text-xs text-navy/70 font-semibold">{staff.rating}</span>
                    </div>
                    <span className="text-xs text-navy/60">•</span>
                    <span className="text-xs text-navy/60">{staff.avgTime}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Guest Satisfaction Insights */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
      >
        <h3 className="text-xl font-semibold text-navy mb-6">Guest Satisfaction Insights</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">94%</span>
            </div>
            <p className="text-sm font-semibold text-navy mb-1">Very Satisfied</p>
            <p className="text-xs text-navy/60">2,674 guests</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">4%</span>
            </div>
            <p className="text-sm font-semibold text-navy mb-1">Satisfied</p>
            <p className="text-xs text-navy/60">114 guests</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">1.5%</span>
            </div>
            <p className="text-sm font-semibold text-navy mb-1">Neutral</p>
            <p className="text-xs text-navy/60">43 guests</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">0.5%</span>
            </div>
            <p className="text-sm font-semibold text-navy mb-1">Unsatisfied</p>
            <p className="text-xs text-navy/60">16 guests</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

