'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Home, UtensilsCrossed, Car, Bell, SlidersHorizontal, Sparkles } from 'lucide-react'
import Image from 'next/image'

const initialRequests = [
  { id: 1, guest: 'Benjamin Turner', room: '305', item: 'Towels', status: 'in_progress', time: '10 min. ago', staff: 'James', staffInitials: 'JM' },
  { id: 2, guest: 'Emma Johnson', room: '420', item: 'Margherita Pizza', status: 'pending', time: '20 min. ago', staff: 'Olivia', staffInitials: 'OC' },
  { id: 3, guest: 'William Harris', room: '512', item: 'Car Retrieval', status: 'pending', time: '30 min. ago', staff: 'Ahmed', staffInitials: 'AA' },
  { id: 4, guest: 'Olivia Martinez', room: '203', item: 'Room Cleaning', status: 'pending', time: '30 min. ago', staff: 'Michael', staffInitials: 'MB' },
  { id: 5, guest: 'Michael Brown', room: '210', item: 'Extra Pillows', status: 'in_progress', time: '45 min. ago', staff: 'Sarah', staffInitials: 'SJ' },
]

export default function Dashboard() {
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

      {/* Top Nav - Transparent & Blurred */}
      <div className="sticky top-0 z-20 backdrop-blur-2xl bg-white/20 border-b border-white/20">
        <div className="px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image src="/logo.png" alt="INNARA" fill className="object-contain rounded-full" />
            </div>
            <span className="text-4xl font-light tracking-wider text-navy" style={{ fontFamily: 'Georgia, serif' }}>INNARA</span>
          </div>

          <div className="flex items-center gap-8">
            <button className="text-sm font-semibold text-gold border-b-2 border-gold pb-5 pt-6">Dashboard</button>
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
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-110 transition-transform shadow-lg">
              JM
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-12">
        {/* Stats Row - Glass Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={ClipboardList}
            label="Total Requests"
            value={stats.total}
            change="+2 today"
          />
          <StatCard
            icon={Home}
            label="Housekeeping"
            value={stats.housekeeping}
          />
          <StatCard
            icon={UtensilsCrossed}
            label="Room Service"
            value={stats.roomService}
            change="+1 today"
          />
          <StatCard
            icon={Car}
            label="Valet"
            value={stats.valet}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Requests Table */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-navy">Active Requests</h2>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-navy hover:bg-white/30 transition-all">
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-sm font-medium">Filter</span>
              </button>
            </div>

            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
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
          </div>

          {/* AI Insights Panel */}
          <div className="col-span-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-navy flex items-center gap-2 mb-2">
                AI Insights
                <Sparkles className="w-6 h-6 text-gold" />
              </h2>
              <p className="text-sm text-navy/60">Real-time intelligence</p>
            </div>

            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
              <div className="space-y-6">
                <InsightCard
                  icon="🔥"
                  title="Peak Demand"
                  value="2-4 PM today"
                  description="25% higher request volume"
                  progress={75}
                />
                <InsightCard
                  icon="💡"
                  title="Upsell Opportunity"
                  value="3 guests"
                  description="Viewed spa menu but didn't book"
                />
                <InsightCard
                  icon="⚡"
                  title="Avg Response Time"
                  value="8 minutes"
                  description="↓ 15% from yesterday"
                  valueColor="text-green-400"
                />
              </div>

              <div className="mt-8 pt-8 border-t border-navy/20">
                <h3 className="text-sm font-semibold text-navy mb-4">Live Activity</h3>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-start gap-3"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-gold rounded-full mt-1.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm text-navy/90">{activity.text}</p>
                        <p className="text-xs text-navy/50 mt-0.5">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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

function StatCard({ icon: Icon, label, value, change }: any) {
  return (
    <motion.div
      layout
      className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl hover:bg-white/15 hover:scale-105 hover:shadow-[0_0_40px_rgba(189,155,48,0.3)] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center">
          <Icon className="w-7 h-7 text-gold" />
        </div>
      </div>
      <p className="text-xs uppercase text-navy/70 font-semibold tracking-wide mb-2">{label}</p>
      <motion.p
        key={value}
        initial={{ scale: 1.3, color: '#bd9b30' }}
        animate={{ scale: 1, color: '#1d1b38' }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-bold text-navy mb-2"
      >
        {value}
      </motion.p>
      {change && (
        <p className="text-sm text-green-400 flex items-center gap-1 font-medium">
          <span>↑</span>
          {change}
        </p>
      )}
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
  const colors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-green-500 to-green-600', 'from-orange-500 to-orange-600']
  const color = colors[initials.charCodeAt(0) % colors.length]

  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold border-2 border-white/20 shadow-lg hover:scale-110 transition-transform cursor-pointer`}>
      {initials}
    </div>
  )
}

function InsightCard({ icon, title, value, description, progress, valueColor = 'text-gold' }: any) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all"
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy/90 mb-2">{title}</p>
          <p className={`text-2xl font-bold ${valueColor} mb-2`}>{value}</p>
          <p className="text-xs text-navy/60 leading-relaxed">{description}</p>
          {progress && (
            <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-gold-light via-gold to-gold-light rounded-full"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
