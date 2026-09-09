import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { ActiveSession } from '../types';
import {
  Clock,
  Flame,
  PlusCircle,
  Coffee,
  AlertCircle,
  CheckCircle2,
  StopCircle,
  QrCode
} from 'lucide-react';

interface ActiveSessionBannerProps {
  session: ActiveSession;
  onOpenFnBModal?: (sessionId: string) => void;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({
  session,
  onOpenFnBModal
}) => {
  const { currentTimestamp, extendSession, endSession, setActiveInvoiceForModal, currentRole } = useCafe();
  const [extendHours, setExtendHours] = useState(1);
  const [extendMsg, setExtendMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Time remaining calculation in milliseconds
  const remainingMs = Math.max(0, session.endTime - currentTimestamp);
  const totalMs = session.durationHours * 3600 * 1000;
  const elapsedMs = Math.min(totalMs, totalMs - remainingMs);
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedRemaining = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Section 25: Alerts at 30m, 10m, 5m
  const isUrgent5m = totalSeconds <= 300 && totalSeconds > 0;
  const isWarning10m = totalSeconds <= 600 && totalSeconds > 300;
  const isWarning30m = totalSeconds <= 1800 && totalSeconds > 600;

  const handleExtend = () => {
    setExtendMsg(null);
    const res = extendSession(session.id, extendHours);
    if (!res.success) {
      setExtendMsg({ type: 'error', text: res.error || 'Cannot extend session.' });
    } else {
      setExtendMsg({ type: 'success', text: `Extended session by ${extendHours} hour(s)!` });
    }
  };

  const handleEndSession = () => {
    const res = endSession(session.id);
    if (res.success && res.invoice) {
      setActiveInvoiceForModal(res.invoice);
    }
  };

  return (
    <div
      id={`active-session-${session.id}`}
      className="w-full rounded-2xl bg-[#0a0a0a] border border-white/10 p-5 shadow-[0_0_15px_rgba(255,255,255,0.02)] relative overflow-hidden backdrop-blur-md"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Station info and Player badge */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-red-500 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-red-600 text-white uppercase tracking-widest">
                Active Session
              </span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                Started {new Date(session.startTime).toTimeString().substring(0, 5)}
              </span>
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1">
              {session.systemName} • {session.customerName}
            </h3>
            <p className="text-xs text-white/50 font-light">
              Rate: ₹{session.ratePerHour}/hr • Paid via {session.paymentMethod} • Total: ₹{session.totalAmount}
            </p>
          </div>
        </div>

        {/* Center: Live Synchronized Countdown Timer */}
        <div className="flex flex-col items-center lg:items-center justify-center bg-black/60 border border-white/10 px-5 py-2.5 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">
            <Clock className="w-3 h-3 text-white/60" />
            <span>Time Remaining</span>
          </div>
          <div
            className={`font-mono text-2xl lg:text-3xl font-black tracking-widest mt-0.5 ${
              isUrgent5m
                ? 'text-red-500 animate-pulse'
                : isWarning10m
                ? 'text-amber-400'
                : 'text-white'
            }`}
          >
            {formattedRemaining}
          </div>
          {/* Progress bar */}
          <div className="w-36 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isUrgent5m ? 'bg-red-600' : 'bg-white'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Quick actions (Extend, Add F&B, End) */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* F&B Snack Bar Add */}
          {onOpenFnBModal && (
            <button
              onClick={() => onOpenFnBModal(session.id)}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5 text-white/70" />
              <span>Add F&B ({session.foodItems.length})</span>
            </button>
          )}

          {/* Extend Session */}
          <button
            onClick={handleExtend}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-red-500" />
            <span>+1 Hour</span>
          </button>

          {/* End Session (Staff or Admin) */}
          {(currentRole === 'EMPLOYEE' || currentRole === 'ADMIN') && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>End & Print Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning alert banners if ending soon */}
      {isUrgent5m && (
        <div className="mt-3 p-2 rounded-lg bg-red-900/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>URGENT: Less than 5 minutes remaining! Please extend now or prepare for session wrap-up.</span>
        </div>
      )}
      {isWarning10m && (
        <div className="mt-3 p-2 rounded-lg bg-amber-900/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Notice: 10 minutes remaining in active session.</span>
        </div>
      )}
      {extendMsg && (
        <div
          className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
            extendMsg.type === 'error'
              ? 'bg-red-900/70 text-red-200 border border-red-500'
              : 'bg-emerald-900/70 text-emerald-200 border border-emerald-500'
          }`}
        >
          <span>{extendMsg.text}</span>
        </div>
      )}
    </div>
  );
};
