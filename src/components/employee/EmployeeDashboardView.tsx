import React, { useState } from 'react';
import {
  Clock,
  Tv,
  Users,
  Calendar,
  Coffee,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRight,
  PlusCircle,
  QrCode,
  Zap,
  ShieldAlert,
  ChevronRight,
  Flame
} from 'lucide-react';
import {
  EmployeeDashboardStats,
  ActiveSession,
  GamingSystem,
  OperationalAlert,
  EmployeeTab
} from '../../types';

interface EmployeeDashboardViewProps {
  stats: EmployeeDashboardStats;
  activeSessions: ActiveSession[];
  systems: GamingSystem[];
  alerts: OperationalAlert[];
  onOpenWalkInModal: () => void;
  onSelectTab: (tab: EmployeeTab) => void;
  onCheckInQr: (qrCode: string) => void;
  onResolveAlert: (alertId: string) => void;
  onOpenFnB: (sessionId: string) => void;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({
  stats,
  activeSessions,
  systems,
  alerts,
  onOpenWalkInModal,
  onSelectTab,
  onCheckInQr,
  onResolveAlert,
  onOpenFnB
}) => {
  const [fastQrInput, setFastQrInput] = useState('');

  const handleFastQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastQrInput.trim()) return;
    onCheckInQr(fastQrInput.trim());
    setFastQrInput('');
  };

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Real-Time Operational KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Sessions */}
        <div
          onClick={() => onSelectTab('SESSIONS')}
          className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold">Active Sessions</span>
            <Clock className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.activeSessionsCount}</div>
          <div className="text-[11px] text-white/40 mt-1 flex items-center justify-between">
            <span>Live on floor</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Available Stations */}
        <div
          onClick={() => onSelectTab('FLOOR')}
          className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold">Available Rigs</span>
            <Tv className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{stats.availableStationsCount}</div>
          <div className="text-[11px] text-white/40 mt-1 flex items-center justify-between">
            <span>Ready for walk-ins</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Today's Bookings */}
        <div
          onClick={() => onSelectTab('BOOKINGS')}
          className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold">Upcoming Bookings</span>
            <Calendar className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.upcomingBookingsCount}</div>
          <div className="text-[11px] text-white/40 mt-1 flex items-center justify-between">
            <span>{stats.reservedStationsCount} reserved stations</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Waitlist */}
        <div
          onClick={() => onSelectTab('WAITLIST')}
          className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 backdrop-blur-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-white/50 mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold">Gamers Waitlist</span>
            <Users className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.waitlistCount}</div>
          <div className="text-[11px] text-white/40 mt-1 flex items-center justify-between">
            <span>In queue</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 2. Fast QR Check-In Scanner & Fast Walk-in Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
              Instant Booking QR / Pass Scanner
            </h3>
          </div>
          <p className="text-xs text-white/50 font-light">
            Scan barcode/QR or enter booking reference to instantly seat arriving gamers.
          </p>

          <form onSubmit={handleFastQrSubmit} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fastQrInput}
                onChange={(e) => setFastQrInput(e.target.value)}
                placeholder="Scan QR or enter Booking ID (e.g. BK-101 or NEXUS-BK-101-ANDY)"
                className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-cyan-600/20 active:scale-95 shrink-0"
            >
              Verify & Check In
            </button>
          </form>
        </div>

        <div className="h-px md:h-20 w-full md:w-px bg-white/10" />

        {/* Quick Walkin Lane */}
        <div className="md:w-64 flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 mb-1">
            Counter Fast-Lane
          </span>
          <div className="text-sm font-bold text-white mb-2">Unscheduled Walk-in?</div>
          <button
            onClick={onOpenWalkInModal}
            className="flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition cursor-pointer shadow-md active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Launch Walk-In Wizard</span>
          </button>
        </div>
      </div>

      {/* 3. Operational Alerts Stream (if any) */}
      {activeAlerts.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Active Operational Alerts ({activeAlerts.length})</span>
            </div>
            <button
              onClick={() => onSelectTab('ALERTS')}
              className="text-[11px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
            >
              View All Alerts
            </button>
          </div>

          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-black/40 border border-amber-500/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : alert.severity === 'WARNING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-cyan-600 text-white'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-white mr-2">{alert.title}:</span>
                    <span className="text-white/60 font-light">{alert.message}</span>
                  </div>
                </div>
                <button
                  onClick={() => onResolveAlert(alert.id)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Live Floor Sessions Overview */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-tight">
              Live Arena Sessions ({activeSessions.length})
            </h3>
          </div>
          <button
            onClick={() => onSelectTab('SESSIONS')}
            className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <span>Full Session Board</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-white/40 text-xs">
            No players currently active on floor. Click "Launch Walk-In Wizard" to seat arriving gamers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSessions.slice(0, 6).map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between hover:border-white/20 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-white text-sm uppercase tracking-tight">
                      {session.systemName}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                      LIVE • {session.startTime} - {session.endTime}
                    </span>
                  </div>
                  <div className="text-xs text-white/80 font-medium truncate">
                    {session.customerName}
                  </div>
                  <div className="text-[11px] text-white/40 font-mono truncate mt-0.5">
                    {session.gameTitle || 'Active Game Session'}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/50 font-mono">Bill: ₹{session.totalCharge}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenFnB(session.id)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      <Coffee className="w-3 h-3 text-amber-400" />
                      <span>F&B</span>
                    </button>
                    <button
                      onClick={() => onSelectTab('SESSIONS')}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
