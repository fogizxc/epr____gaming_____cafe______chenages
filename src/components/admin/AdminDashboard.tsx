import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Gamepad2,
  Clock,
  Coffee,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Radio,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  Activity,
  ChevronRight,
  Search,
  ExternalLink,
  ShieldCheck,
  Percent,
  Flame,
  Volume2
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { GamingSystem, ActiveSession, Booking, FnbProduct, MaintenanceTicket } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenWalkInModal: () => void;
  maintenanceTickets?: MaintenanceTicket[];
  onToggleSurge?: (preset: 'NORMAL' | 'PEAK' | 'WEEKEND') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenWalkInModal,
  maintenanceTickets = [],
  onToggleSurge
}) => {
  const {
    systems,
    activeSessions,
    bookings,
    fnbProducts,
    financialSummary,
    pricing,
    employeeShift,
    registeredAccounts,
    extendSession,
    endSession,
    toggleMaintenance,
    updateSystemStatus,
    currentTimestamp
  } = useCafe();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [selectedSessionForExtend, setSelectedSessionForExtend] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick clock every second for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Calculations for top-level KPIs
  const totalStations = systems.length || 14;
  const occupiedStations = systems.filter(s => s.status === 'ACTIVE').length;
  const availableStations = systems.filter(s => s.status === 'AVAILABLE').length;
  const maintenanceStations = systems.filter(s => s.status === 'MAINTENANCE').length;
  const occupancyPercent = Math.round((occupiedStations / totalStations) * 100);

  // Revenue & Profit
  const todayRevenue = financialSummary?.todayRevenue || 18450;
  const todayExpenses = financialSummary?.expenses || 5580;
  const todayProfit = Math.max(0, todayRevenue - todayExpenses);
  const profitMarginPercent = todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 0;
  const revenueTarget = 24000;
  const targetProgress = Math.min(100, Math.round((todayRevenue / revenueTarget) * 100));

  // Upcoming bookings for today
  const todayDateStr = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED');

  // F&B Sales
  const fnbSalesToday = financialSummary?.fnbRevenue || 3820;

  // Low stock products count (< 10 units)
  const lowStockProducts = fnbProducts.filter(p => p.stock < 10);

  // Active sessions sorted by time remaining
  const activeSessionsWithTime = activeSessions.map(sess => {
    const remainingMs = Math.max(0, sess.endTime - now);
    const minsRemaining = Math.floor(remainingMs / 60000);
    const secsRemaining = Math.floor((remainingMs % 60000) / 1000);
    return {
      ...sess,
      minsRemaining,
      secsRemaining,
      isExpiringSoon: minsRemaining < 15
    };
  });

  // Filter systems for the live floor grid
  const filteredSystems = systems.filter(s => {
    const matchesCategory = filterCategory === 'ALL' || s.category === filterCategory;
    const matchesQuery = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.currentCustomerName && s.currentCustomerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Format countdown string
  const formatTimeRemaining = (endTime: number) => {
    const diff = Math.max(0, endTime - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleQuickExtend = (sessionId: string, extraHours: number) => {
    const res = extendSession(sessionId, extraHours);
    if (res.success) {
      showToast(`+${extraHours}h added to session successfully.`);
      setSelectedSessionForExtend(null);
    } else {
      showToast(res.error || 'Failed to extend session.');
    }
  };

  const handleQuickEnd = (sessionId: string, rigName: string) => {
    if (confirm(`End session on ${rigName} and generate final checkout bill?`)) {
      const res = endSession(sessionId);
      if (res.success) {
        showToast(`Session terminated on ${rigName}. Invoice generated.`);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP-LEVEL EXECUTIVE KPIS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* KPI 1: TODAY'S REVENUE */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/30 transition flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-400/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              Today's Revenue
            </span>
            <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl font-black text-white font-mono tracking-tight">
              ₹{todayRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-400 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>{targetProgress}% of target</span>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${targetProgress}%` }}
            />
          </div>
        </div>

        {/* KPI 2: TODAY'S PROFIT */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/30 transition flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-400/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              Today's Profit
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400">
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
              ₹{todayProfit.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/50 font-mono">
              <span>{profitMarginPercent}% Net Margin</span>
            </div>
          </div>
          <div className="text-[9px] text-white/40 truncate">
            OPEX: ₹{todayExpenses.toLocaleString()}
          </div>
        </div>

        {/* KPI 3: ACTIVE SESSIONS */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/30 transition flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-400/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              Active Sessions
            </span>
            <span className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl font-black text-white font-mono tracking-tight flex items-baseline gap-1.5">
              <span>{occupiedStations}</span>
              <span className="text-xs text-white/40 font-normal">/ {totalStations}</span>
            </div>
            <div className="text-[10px] text-cyan-400/90 font-mono mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{occupiedStations} Gamers Live</span>
            </div>
          </div>
          <div className="text-[9px] text-white/40">
            {activeSessionsWithTime.filter(s => s.isExpiringSoon).length > 0 ? (
              <span className="text-amber-400 font-bold">
                ⚠️ {activeSessionsWithTime.filter(s => s.isExpiringSoon).length} expiring soon
              </span>
            ) : (
              'All sessions healthy'
            )}
          </div>
        </div>

        {/* KPI 4: OCCUPANCY */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-400/30 transition flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-400/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              Occupancy
            </span>
            <span className="p-1.5 rounded-lg bg-purple-400/10 text-purple-400">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl font-black text-purple-400 font-mono tracking-tight">
              {occupancyPercent}%
            </div>
            <div className="text-[10px] text-white/50 font-mono mt-1">
              Floor Utilization
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent > 80 ? 'bg-emerald-400' : occupancyPercent > 40 ? 'bg-purple-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* KPI 5: AVAILABLE STATIONS */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-400/30 transition flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-400/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              Available Rigs
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400">
              <Gamepad2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
              {availableStations}
            </div>
            <div className="text-[10px] text-white/50 font-mono mt-1">
              Ready for Walk-Ins
            </div>
          </div>
          <div className="text-[9px] text-white/40">
            {maintenanceStations > 0 ? (
              <span className="text-amber-400">{maintenanceStations} in service</span>
            ) : (
              '0 in maintenance'
            )}
          </div>
        </div>

        {/* KPI 6: UPCOMING BOOKINGS */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-400/30 transition flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-400/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              Upcoming Bookings
            </span>
            <span className="p-1.5 rounded-lg bg-blue-400/10 text-blue-400">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl font-black text-blue-400 font-mono tracking-tight">
              {upcomingBookings.length}
            </div>
            <div className="text-[10px] text-white/50 font-mono mt-1">
              Scheduled Today
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('BOOKINGS')}
            className="text-[9px] text-blue-400 hover:underline text-left cursor-pointer flex items-center gap-0.5"
          >
            <span>View Queue</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* KPI 7: F&B SALES */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-400/30 transition flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-400/5 rounded-full blur-xl pointer-events-none group-hover:bg-orange-400/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              F&B Concessions
            </span>
            <span className="p-1.5 rounded-lg bg-orange-400/10 text-orange-400">
              <Coffee className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-xl font-black text-orange-400 font-mono tracking-tight">
              ₹{fnbSalesToday.toLocaleString()}
            </div>
            <div className="text-[10px] text-white/50 font-mono mt-1">
              Café Sales Today
            </div>
          </div>
          <div className="text-[9px] text-white/40">
            {lowStockProducts.length > 0 ? (
              <span className="text-amber-400">{lowStockProducts.length} items low stock</span>
            ) : (
              'Inventory stocked'
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OPERATIONAL ACTION BAR & FAST COMMANDS */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-black/60 via-white/[0.02] to-black/60 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Quick Command Center</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE PULSE
              </span>
            </h4>
            <p className="text-[11px] text-white/50 font-light">
              Answer the question: "What is happening in my gaming café right now?"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* 1-Click Walk-In */}
          <button
            onClick={onOpenWalkInModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Walk-In</span>
          </button>

          {/* Fast Surge Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => {
                if (onToggleSurge) onToggleSurge('NORMAL');
                showToast('Tariff set to STANDARD RATES (₹0 surge).');
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer ${
                pricing?.peakSurgePercent === 0 ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => {
                if (onToggleSurge) onToggleSurge('PEAK');
                showToast('⚡ Dynamic Peak Surge (+15%) Activated.');
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer ${
                pricing?.peakSurgePercent === 15 ? 'bg-amber-400 text-black font-black' : 'text-white/40 hover:text-white'
              }`}
            >
              Peak +15%
            </button>
            <button
              onClick={() => {
                if (onToggleSurge) onToggleSurge('WEEKEND');
                showToast('🔥 Weekend LAN Tournament Surge (+25%) Activated.');
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer ${
                pricing?.weekendSurgePercent === 25 ? 'bg-red-500 text-white font-black' : 'text-white/40 hover:text-white'
              }`}
            >
              Weekend +25%
            </button>
          </div>

          {/* Drawer Reconciliation */}
          <button
            onClick={() => onNavigateTab('STAFF')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Till Audit</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. URGENT OPERATIONAL ALERTS BAR (IF ANY) */}
      {/* ========================================================================= */}
      {(lowStockProducts.length > 0 || maintenanceStations > 0 || activeSessionsWithTime.some(s => s.isExpiringSoon)) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeSessionsWithTime.some(s => s.isExpiringSoon) && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold block">Sessions Expiring in &lt;15 mins</span>
                  <span className="text-[11px] text-amber-300/70">
                    {activeSessionsWithTime.filter(s => s.isExpiringSoon).map(s => s.systemName).join(', ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('LIVE_OPS')}
                className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-lg text-[10px] font-bold uppercase shrink-0"
              >
                Extend
              </button>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Coffee className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="font-bold block">Low Stock Alert ({lowStockProducts.length} items)</span>
                  <span className="text-[11px] text-red-300/70 truncate block max-w-xs">
                    {lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('INVENTORY')}
                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-[10px] font-bold uppercase shrink-0"
              >
                Restock
              </button>
            </div>
          )}

          {maintenanceStations > 0 && (
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold block">{maintenanceStations} Station(s) Under Service</span>
                  <span className="text-[11px] text-blue-300/70">
                    Hardware technician on duty
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('SYSTEMS')}
                className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-[10px] font-bold uppercase shrink-0"
              >
                Inspect
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REAL-TIME FLOOR HEAT-GRID & LIVE RIG STATUS */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Live Floor Heat-Grid & Telemetry
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>REAL-TIME TICKING</span>
              </span>
            </div>
            <p className="text-xs text-white/50 font-light mt-1">
              Active sessions, remaining play times, and instant 1-click station actions.
            </p>
          </div>

          {/* Filter tabs & Search */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search station or gamer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 outline-none w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1">
              {['ALL', 'Gaming PC', 'PlayStation', 'Xbox', 'Sim Racing', 'VR Lounge', 'Pool Table'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer whitespace-nowrap ${
                    filterCategory === cat
                      ? 'bg-white text-black font-black'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {cat === 'Gaming PC' ? 'PC' : cat === 'PlayStation' ? 'PS5' : cat === 'VR Lounge' ? 'VR' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSystems.map((station) => {
            const activeSession = activeSessions.find(
              s => s.systemId === station.id || (station.activeSessionId && s.id === station.activeSessionId)
            );
            const remainingFormatted = station.sessionEndTime
              ? formatTimeRemaining(station.sessionEndTime)
              : null;
            const isExpiringSoon = station.sessionEndTime && (station.sessionEndTime - now < 15 * 60 * 1000);

            return (
              <div
                key={station.id}
                className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                  station.status === 'ACTIVE'
                    ? isExpiringSoon
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      : 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-400'
                    : station.status === 'MAINTENANCE'
                    ? 'bg-red-950/20 border-red-500/30 opacity-75'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Top header of station card */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-mono uppercase tracking-tight">
                        {station.name}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                        {station.category}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        station.status === 'ACTIVE'
                          ? isExpiringSoon
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : station.status === 'MAINTENANCE'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-white/10 text-white/60 border border-white/10'
                      }`}
                    >
                      {station.status}
                    </span>
                  </div>

                  {/* Active session gamer details or idle status */}
                  {station.status === 'ACTIVE' ? (
                    <div className="py-2 border-y border-white/5 my-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Gamer:</span>
                        <span className="font-black text-white truncate max-w-[140px]">
                          {station.currentCustomerName || activeSession?.customerName || 'Registered Gamer'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-white/40">Time Left:</span>
                        <span
                          className={`font-black flex items-center gap-1 ${
                            isExpiringSoon ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{remainingFormatted || 'Active'}</span>
                        </span>
                      </div>

                      {station.ipAddress && (
                        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                          <span>IP: {station.ipAddress}</span>
                          <span className="text-emerald-400">⚡ {station.ping || 12}ms</span>
                        </div>
                      )}
                    </div>
                  ) : station.status === 'MAINTENANCE' ? (
                    <div className="py-4 text-center text-xs text-red-400/80 font-mono">
                      Rig Locked / In Service
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-white/40 font-mono">
                      Ready for Walk-In • ₹{station.hourlyRate}/hr
                    </div>
                  )}
                </div>

                {/* Bottom Quick Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-1.5">
                  {station.status === 'ACTIVE' ? (
                    <>
                      {/* Quick +1 Hour */}
                      <button
                        onClick={() => {
                          const sid = station.activeSessionId || activeSession?.id;
                          if (sid) handleQuickExtend(sid, 1);
                        }}
                        className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase transition cursor-pointer text-center"
                      >
                        +1 Hour
                      </button>

                      {/* Add Food to Tab */}
                      <button
                        onClick={() => onNavigateTab('FNB')}
                        className="px-2 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Add snack or drink to this station"
                      >
                        <Coffee className="w-3 h-3" />
                      </button>

                      {/* Stop Session & Checkout */}
                      <button
                        onClick={() => {
                          const sid = station.activeSessionId || activeSession?.id;
                          if (sid) handleQuickEnd(sid, station.name);
                        }}
                        className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer"
                        title="End session & checkout"
                      >
                        End
                      </button>
                    </>
                  ) : station.status === 'MAINTENANCE' ? (
                    <button
                      onClick={() => toggleMaintenance(station.id, 'Routine maintenance cleared by admin')}
                      className="w-full py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-black uppercase transition cursor-pointer"
                    >
                      Mark Available
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onOpenWalkInModal}
                        className="flex-1 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black rounded-lg text-[10px] font-black uppercase transition cursor-pointer shadow"
                      >
                        Start Session
                      </button>
                      <button
                        onClick={() => toggleMaintenance(station.id, 'Diagnostic maintenance test')}
                        className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-[10px] font-mono transition cursor-pointer"
                        title="Lock Rig"
                      >
                        Lock
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SPLIT OVERVIEW: UPCOMING BOOKINGS & RECENT TRANSACTIONS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Desk Queue */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Front Desk Reservations Queue</span>
            </h4>
            <button
              onClick={() => onNavigateTab('BOOKINGS')}
              className="text-[10px] font-bold text-blue-400 hover:underline uppercase"
            >
              Full Queue ({bookings.length}) →
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {upcomingBookings.slice(0, 5).map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block uppercase tracking-tight">
                    {b.customerName}
                  </span>
                  <span className="text-[11px] text-white/40 font-mono">
                    {b.date} • {b.startTime} • {b.systemName || b.systemId} ({b.durationHours}h)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">₹{b.totalPrice}</span>
                  <button
                    onClick={() => onNavigateTab('BOOKINGS')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30 text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Check In
                  </button>
                </div>
              </div>
            ))}

            {upcomingBookings.length === 0 && (
              <div className="py-6 text-center text-xs text-white/40">
                No pending reservations scheduled for today. Ready for walk-ins!
              </div>
            )}
          </div>
        </div>

        {/* Right: Cash Till & Staff Status */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Active Shift Drawer & Operators</span>
            </h4>
            <button
              onClick={() => onNavigateTab('STAFF')}
              className="text-[10px] font-bold text-emerald-400 hover:underline uppercase"
            >
              Reconcile Register →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] text-white/40 uppercase font-mono block">Opening Cash</span>
              <div className="text-base font-black text-white font-mono mt-1">
                ₹{(employeeShift?.openingCash || 2000).toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] text-white/40 uppercase font-mono block">Cash Collected</span>
              <div className="text-base font-black text-emerald-400 font-mono mt-1">
                ₹{(employeeShift?.cashSales || 4850).toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[9px] text-white/40 uppercase font-mono block">Digital (UPI/Card)</span>
              <div className="text-base font-black text-cyan-400 font-mono mt-1">
                ₹{(employeeShift?.cardSales || 11300).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70">
                Current Supervisor: <strong className="text-white">{employeeShift?.employeeName || 'Samir Rao'}</strong>
              </span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">
              Expected Till: ₹{((employeeShift?.openingCash || 2000) + (employeeShift?.cashSales || 4850)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
