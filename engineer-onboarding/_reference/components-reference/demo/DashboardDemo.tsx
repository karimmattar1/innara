import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Star, DollarSign, Clock, ClipboardList, Users,
  BarChart3, TrendingUp, Award, Target, Sparkles, AlertTriangle,
  ArrowUpRight, Calendar, Activity
} from 'lucide-react';
import { InnaraLogo } from '@/components/innara/Logo';

interface DashboardDemoProps {
  requests: DemoRequest[];
  showAnalytics: boolean;
}

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

const initialRequests: DemoRequest[] = [
  { id: 1, guest: 'Benjamin Turner', room: '305', item: 'Towels', status: 'completed', time: '10 min ago', staff: 'James', staffInitials: 'JM' },
  { id: 2, guest: 'Emma Johnson', room: '420', item: 'Margherita Pizza', status: 'completed', time: '20 min ago', staff: 'Olivia', staffInitials: 'OC' },
  { id: 3, guest: 'William Harris', room: '512', item: 'Car Retrieval', status: 'pending', time: '30 min ago', staff: 'Ahmed', staffInitials: 'AA' },
];

export function DashboardDemo({ requests, showAnalytics }: DashboardDemoProps) {
  // Track new request count dynamically
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [stats, setStats] = useState({
    happiness: 94,
    revenue: 12.4,
    resolution: 6.2,
    activeRequests: 42,
    guestsServed: 87,
  });

  // Update stats when new requests come in
  useEffect(() => {
    const newCount = requests.filter(r => r.isNew).length;
    if (newCount > 0) {
      setNewRequestCount(prev => prev + newCount);
      setStats(prev => ({
        happiness: Math.min(100, prev.happiness + newCount * 0.5),
        revenue: prev.revenue + (requests.some(r => r.isNew && r.item.includes('Salad')) ? 0.012 : 0),
        resolution: Math.max(4.0, prev.resolution - 0.1),
        activeRequests: prev.activeRequests + newCount,
        guestsServed: prev.guestsServed + newCount,
      }));
    }
  }, [requests]);

  const allRequests = [...requests, ...initialRequests].slice(0, 5);

  return (
    <div className="w-full h-full relative overflow-hidden demo-screen">
      {/* Subtle animated background orbs - matching landing page style */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full"
          animate={{ x: [0, 20, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ 
            background: 'radial-gradient(circle, hsl(215 70% 75% / 0.3) 0%, transparent 70%)',
            filter: 'blur(25px)'
          }}
        />
        <motion.div
          className="absolute top-1/4 -right-16 w-56 h-56 rounded-full"
          animate={{ x: [0, -15, 0], y: [0, 20, 0], scale: [1, 1.03, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ 
            background: 'radial-gradient(circle, hsl(225 65% 78% / 0.25) 0%, transparent 70%)',
            filter: 'blur(22px)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header - fixed with proper nav styling */}
        <div className="flex-shrink-0 h-10 mobile-header px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/innaralogo2.png"
              alt="Innara"
              className="w-5 h-5 object-contain"
            />
            <InnaraLogo size="xs" useWordLogo showText showIcon={false} />
          </div>
          
          {/* Nav tabs - all styled consistently */}
          <div className="flex items-center gap-1">
            <button className={`px-2.5 py-1 rounded-full text-[8px] font-semibold transition-all ${
              !showAnalytics 
                ? 'text-accent-gold bg-white/70' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
            }`}>
              Dashboard
            </button>
            <button
              data-demo-id="dashboard-analytics-tab"
              className={`px-2.5 py-1 rounded-full text-[8px] font-semibold transition-all ${
              showAnalytics 
                ? 'text-accent-gold bg-white/70' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
            }`}
            >
              Analytics
            </button>
            <button className="px-2.5 py-1 rounded-full text-[8px] font-semibold text-muted-foreground hover:text-foreground hover:bg-white/50 transition-all">
              Requests
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-3.5 h-3.5 text-foreground" />
              {newRequestCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-white text-[6px] font-bold"
                >
                  {Math.min(newRequestCount, 9)}
                </motion.div>
              )}
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1a1d3a] to-[#14182d] ring-1 ring-[#9B7340]/50 border border-[#9B7340] flex items-center justify-center text-white text-[7px] font-bold">
              JM
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden p-2">
          <AnimatePresence mode="wait">
            {!showAnalytics ? (
              <DashboardView key="dashboard" stats={stats} requests={allRequests} newRequestCount={newRequestCount} />
            ) : (
              <AnalyticsView key="analytics" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ stats, requests, newRequestCount }: { stats: any; requests: DemoRequest[]; newRequestCount: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-full flex flex-col gap-2"
    >
      {/* Stats row - compact */}
      <div className="grid grid-cols-5 gap-1.5">
        <MetricCard icon={Star} label="Happiness" value={`${Math.round(stats.happiness)}%`} change="+3%" />
        <MetricCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toFixed(1)}K`} change="+$2.1K" />
        <MetricCard icon={Clock} label="Resolution" value={`${stats.resolution.toFixed(1)}m`} change="-1.8m" />
        <MetricCard 
          icon={ClipboardList} 
          label="Active" 
          value={stats.activeRequests} 
          change={newRequestCount > 0 ? `+${newRequestCount}` : '+0'} 
          highlight={newRequestCount > 0}
        />
        <MetricCard icon={Users} label="Served" value={stats.guestsServed} change="+12" />
      </div>

      {/* Requests table */}
      <div className="flex-1 glass-premium rounded-lg p-2 overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[9px] font-bold text-foreground">Active Requests</h3>
          <span className="text-[7px] text-foreground/50">Real-time</span>
        </div>
        
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/60">
                <th className="text-left text-[6px] uppercase text-foreground/50 font-semibold pb-1">Guest</th>
                <th className="text-left text-[6px] uppercase text-foreground/50 font-semibold pb-1">Room</th>
                <th className="text-left text-[6px] uppercase text-foreground/50 font-semibold pb-1">Item</th>
                <th className="text-left text-[6px] uppercase text-foreground/50 font-semibold pb-1">Status</th>
                <th className="text-left text-[6px] uppercase text-foreground/50 font-semibold pb-1">Time</th>
                <th className="text-left text-[6px] uppercase text-foreground/50 font-semibold pb-1">Staff</th>
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
    </motion.div>
  );
}

function MetricCard({ icon: Icon, label, value, change, highlight }: { 
  icon: any; 
  label: string; 
  value: string | number; 
  change: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      layout
      className="glass-card rounded-md p-1.5 hover:bg-white/40 transition-all"
    >
      <div className="flex items-center gap-1 mb-0.5">
        <div className="w-4 h-4 rounded bg-[#9B7340]/10 flex items-center justify-center">
          <Icon className="w-2 h-2 text-[#9B7340]" />
        </div>
      </div>
      <p className="text-[6px] text-foreground/50 font-medium">{label}</p>
      <motion.p
        key={value}
        initial={{ scale: 1.1, color: '#9B7340' }}
        animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
        transition={{ duration: 0.5 }}
        className="text-[10px] font-bold text-foreground"
      >
        {value}
      </motion.p>
      <motion.p 
        key={change}
        initial={highlight ? { scale: 1.2 } : false}
        animate={{ scale: 1 }}
        className={`text-[6px] font-medium ${highlight ? 'text-green-500' : 'text-green-500/70'}`}
      >
        {change}
      </motion.p>
    </motion.div>
  );
}

function RequestRow({ request }: { request: DemoRequest }) {
  return (
    <motion.tr
      initial={request.isNew ? { y: -10, opacity: 0, backgroundColor: 'rgba(134, 111, 39, 0.2)' } : false}
      animate={request.isNew ? {
        y: 0,
        opacity: 1,
        backgroundColor: ['rgba(134, 111, 39, 0.2)', 'rgba(134, 111, 39, 0.2)', 'transparent']
      } : { y: 0, opacity: 1 }}
      transition={request.isNew ? {
        duration: 0.5,
        backgroundColor: { times: [0, 0.7, 1], duration: 2 }
      } : { duration: 0.3 }}
      className="border-b border-white/60"
    >
      <td className="py-1">
        <span className="text-[7px] font-medium text-foreground">{request.guest}</span>
      </td>
      <td className="py-1">
        <span className="text-[7px] text-muted-foreground font-mono bg-white/60 px-1 py-0.5 rounded">{request.room}</span>
      </td>
      <td className="py-1">
        <span className="text-[7px] text-foreground/70">{request.item}</span>
      </td>
      <td className="py-1">
        <StatusBadge status={request.status} />
      </td>
      <td className="py-1">
        <div className="flex items-center gap-0.5">
          <span className="text-[7px] text-foreground/50">{request.time}</span>
          {request.isNew && (
            <span className="text-[5px] font-bold text-[#9B7340] px-1 py-0.5 rounded bg-[#9B7340]/20">NEW</span>
          )}
        </div>
      </td>
      <td className="py-1">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1a1d3a] to-[#14182d] ring-0.5 ring-[#9B7340]/40 flex items-center justify-center text-white text-[5px] font-bold">
          {request.staffInitials}
        </div>
      </td>
    </motion.tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const dotColors: Record<string, string> = {
    pending: '#7e9ab8',
    in_progress: '#c4a06a',
    completed: '#7aaa8a',
  };

  return (
    <span className="text-[6px] font-medium px-1.5 py-0.5 rounded-full border border-foreground/10 bg-secondary/50 text-foreground/60 inline-flex items-center gap-0.5">
      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: dotColors[status] || dotColors.pending }} />
      {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AnalyticsView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-full flex flex-col gap-2 overflow-y-auto pr-1"
    >
      {/* KPI Overview - 4 cards */}
      <div className="grid grid-cols-4 gap-1.5">
        <AnalyticsCard icon={DollarSign} label="Revenue (30d)" value="$247.8K" change="+18.2%" />
        <AnalyticsCard icon={Users} label="Guests" value="2,847" change="+12.4%" />
        <AnalyticsCard icon={Star} label="Satisfaction" value="94.8%" change="+2.1%" />
        <AnalyticsCard icon={Target} label="FCR" value="87.3%" change="+5.7%" />
      </div>

      {/* Top Staff */}
      <div className="glass-card rounded-lg p-2">
        <h3 className="text-[8px] font-semibold text-foreground mb-2">Top Staff</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: 'Olivia Chen', tasks: 42, rating: 4.9 },
            { name: 'James Miller', tasks: 38, rating: 4.7 },
            { name: 'Maria Lopez', tasks: 33, rating: 4.8 },
          ].map((staff) => (
            <div key={staff.name} className="bg-white/70 rounded-lg p-1.5">
              <p className="text-[6px] font-semibold text-foreground truncate">{staff.name}</p>
              <p className="text-[5px] text-foreground/60">{staff.tasks} tasks</p>
              <p className="text-[5px] text-foreground/60">★ {staff.rating}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights - full width */}
      <div className="glass-card rounded-lg p-2">
        <div className="flex items-center gap-1 mb-1.5">
          <Sparkles className="w-3 h-3 text-[#9B7340]" />
          <h3 className="text-[8px] font-semibold text-foreground">AI Insights</h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex items-start gap-1.5 bg-red-500/10 border-l-2 border-red-500 p-1.5 rounded">
            <Target className="w-2.5 h-2.5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[6px] font-semibold text-foreground">Upsell: Room 1204</p>
              <p className="text-[5px] text-foreground/60">Likely to accept spa offer</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5 bg-emerald-500/10 border-l-2 border-emerald-500 p-1.5 rounded">
            <Sparkles className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[6px] font-semibold text-foreground">Staff Load Balanced</p>
              <p className="text-[5px] text-foreground/60">Redistributed 7 tasks</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5 bg-amber-500/10 border-l-2 border-amber-500 p-1.5 rounded">
            <Activity className="w-2.5 h-2.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[6px] font-semibold text-foreground">Peak at 7–9 PM</p>
              <p className="text-[5px] text-foreground/60">Prep concierge desk</p>
            </div>
          </div>
        </div>
      </div>


      {/* Two-column layout for charts */}
      <div className="flex-1 grid grid-cols-2 gap-2">
        {/* Category breakdown with mini bar chart */}
        <div className="glass-card rounded-lg p-2">
          <h3 className="text-[8px] font-semibold text-foreground mb-2">Request Volume</h3>
          <div className="space-y-1.5">
            {[
              { category: 'Room Service', percentage: 32, color: 'bg-amber-500' },
              { category: 'Housekeeping', percentage: 23, color: 'bg-blue-500' },
              { category: 'Concierge', percentage: 19, color: 'bg-purple-500' },
              { category: 'Spa', percentage: 15, color: 'bg-pink-500' },
              { category: 'Valet', percentage: 11, color: 'bg-green-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-[6px] text-foreground/70 w-14 truncate">{item.category}</span>
                <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
                <span className="text-[6px] text-foreground/60 w-6">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly trend mini chart */}
        <div className="glass-card rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[8px] font-semibold text-foreground">Weekly Trend</h3>
            <div className="flex items-center gap-0.5 text-green-500">
              <ArrowUpRight className="w-2.5 h-2.5" />
              <span className="text-[6px] font-semibold">+12%</span>
            </div>
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end justify-between gap-1 h-16">
            {[45, 62, 48, 78, 65, 82, 90].map((value, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="flex-1 bg-gradient-to-t from-primary to-primary/60 rounded-t"
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="text-[5px] text-foreground/40 flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* SLA + Response Time */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-card rounded-lg p-2">
          <h3 className="text-[8px] font-semibold text-foreground mb-2">SLA Compliance</h3>
          <div className="space-y-1.5">
            {[
              { label: 'Housekeeping', value: 94 },
              { label: 'Room Service', value: 97 },
              { label: 'Maintenance', value: 88 },
              { label: 'Concierge', value: 99 },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-1.5">
                <span className="text-[6px] text-foreground/70 w-14 truncate">{row.label}</span>
                <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.value}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <span className="text-[6px] text-foreground/60 w-6 text-right">{row.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-lg p-2">
          <h3 className="text-[8px] font-semibold text-foreground mb-2">Response Time</h3>
          <div className="space-y-1.5">
            {[
              { label: '<5 min', value: 62, color: 'bg-emerald-500' },
              { label: '5–10', value: 24, color: 'bg-amber-500' },
              { label: '10–15', value: 10, color: 'bg-orange-500' },
              { label: '15+', value: 4, color: 'bg-red-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-1.5">
                <span className="text-[6px] text-foreground/70 w-12">{row.label}</span>
                <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.value}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full ${row.color} rounded-full`}
                  />
                </div>
                <span className="text-[6px] text-foreground/60 w-6 text-right">{row.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  );
}

function AnalyticsCard({ icon: Icon, label, value, change }: { icon: any; label: string; value: string; change: string }) {
  return (
    <motion.div
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card rounded-md p-1.5"
    >
      <div className="flex items-center justify-between mb-0.5">
        <Icon className="w-3 h-3 text-[#9B7340]" />
        <TrendingUp className="w-2 h-2 text-green-500" />
      </div>
      <p className="text-[6px] text-foreground/50 font-medium">{label}</p>
      <p className="text-[9px] font-bold text-foreground">{value}</p>
      <p className="text-[6px] text-green-500 font-medium">{change}</p>
    </motion.div>
  );
}
