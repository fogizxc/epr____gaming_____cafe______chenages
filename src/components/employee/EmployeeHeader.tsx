import React, { useState, useEffect } from 'react';
import {
  Clock,
  DollarSign,
  AlertTriangle,
  Bell,
  LogOut,
  Shield,
  Radio,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Power
} from 'lucide-react';
import { EmployeeShift, OperationalAlert } from '../../types';

interface EmployeeHeaderProps {
  shift: EmployeeShift;
  unreadAlertsCount: number;
  onOpenShiftModal: () => void;
  onOpenAlerts: () => void;
  onEmergencyHelp: () => void;
  onRefreshData: () => void;
  onLogout: () => void;
  isRefreshing?: boolean;
}

export const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  shift,
  unreadAlertsCount,
  onOpenShiftModal,
  onOpenAlerts,
  onEmergencyHelp,
  onRefreshData,
  onLogout,
  isRefreshing = false
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      // Estimate elapsed shift time
      if (shift.startTime) {
        const [timePart, modifier] = shift.startTime.split(' ');
        if (timePart) {
          let [hours, minutes] = timePart.split(':').map(Number);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;

          const now = new Date();
          const shiftStart = new Date();
          shiftStart.setHours(hours, minutes, 0, 0);

          let diffMs = now.getTime() - shiftStart.getTime();
          if (diffMs < 0) diffMs = 0; // fallback if future/error

          const diffSec = Math.floor(diffMs / 1000);
          const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
          const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
          const s = String(diffSec % 60).padStart(2, '0');
          setElapsedTime(`${h}:${m}:${s}`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [shift.startTime]);

  const netCashInDrawer = shift.openingCash + shift.cashSales - shift.expenses;

  return (
    <header
      id="employee-portal-header"
      className="p-4 sm:p-5 rounded-2xl bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
    >
      {/* Left: Brand, Role Badge, Shift Status */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-lg shadow-red-600/20 font-black text-sm tracking-wider">
          BB
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-black uppercase text-white tracking-tight">
              Bytes & Brew
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold">
              Floor Terminal
            </span>
            {shift.status === 'OPEN' ? (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Shift Active
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 font-bold">
                Shift Reconciled
              </span>
            )}
          </div>
          <div className="text-xs text-white/50 font-light mt-0.5 flex items-center gap-2">
            <span>Staff Lead: <strong className="text-white/90 font-medium">{shift.employeeName}</strong></span>
            <span>•</span>
            <span className="font-mono text-[11px] text-white/40">Clock: {currentTime}</span>
          </div>
        </div>
      </div>

      {/* Right: Real-time Stats, Drawer, Alerts, Emergency, Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full md:w-auto justify-between md:justify-end">
        {/* Shift Duration Pill */}
        <div
          title="Elapsed Shift Time"
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 text-xs font-mono"
        >
          <Clock className="w-3.5 h-3.5 text-white/50" />
          <span className="text-white font-bold">{elapsedTime}</span>
        </div>

        {/* Cash Drawer Balance Trigger */}
        <button
          id="employee-drawer-btn"
          onClick={onOpenShiftModal}
          className="px-3.5 py-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer active:scale-95"
          title="Click to view Cash Ledger & End Shift"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Drawer: ₹{netCashInDrawer}</span>
        </button>

        {/* Operational Alerts Bell */}
        <button
          id="employee-alerts-btn"
          onClick={onOpenAlerts}
          className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer active:scale-95"
          title="Operational Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Fast Refresh */}
        <button
          onClick={onRefreshData}
          disabled={isRefreshing}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer active:scale-95 disabled:opacity-50"
          title="Synchronize Live Floor Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
        </button>

        {/* Emergency Help */}
        <button
          onClick={onEmergencyHelp}
          className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Emergency Help & Manager Broadcast"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">SOS Help</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-950/50 hover:border-red-500/40 hover:text-red-400 border border-white/10 flex items-center justify-center text-white/50 transition cursor-pointer active:scale-95"
          title="Log out of Staff Terminal"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
