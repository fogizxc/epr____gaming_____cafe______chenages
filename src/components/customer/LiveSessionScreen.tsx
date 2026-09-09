import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import {
  Tv,
  Clock,
  Coffee,
  PlusCircle,
  Repeat,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Wifi,
  ShieldCheck,
  X,
  Send,
  LogOut,
  Receipt
} from 'lucide-react';
import { GamingServiceCategory, GamingSystem, SupportTicketCategory } from '../../types';

interface LiveSessionScreenProps {
  onOpenBooking?: (category?: GamingServiceCategory) => void;
  onOpenFnB?: (sessionId: string) => void;
}

export const LiveSessionScreen: React.FC<LiveSessionScreenProps> = ({
  onOpenBooking,
  onOpenFnB
}) => {
  const {
    activeSessions,
    systems,
    extendSession,
    endSession,
    requireLogin,
    setActiveNav
  } = useCafe();

  // Find customer's active session
  const currentSession = activeSessions.find(
    (s) => s.status === 'ACTIVE'
  );

  const currentStation = currentSession
    ? systems.find((s) => s.id === currentSession.systemId)
    : null;

  // Real-time server-aligned countdown
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (currentSession?.endTime) {
      return Math.max(0, Math.floor((currentSession.endTime - Date.now()) / 1000));
    }
    return 0;
  });

  useEffect(() => {
    if (!currentSession?.endTime) return;
    const interval = setInterval(() => {
      setSecondsRemaining(Math.max(0, Math.floor((currentSession.endTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession?.endTime]);

  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // State modals
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isStaffCallModalOpen, setIsStaffCallModalOpen] = useState(false);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);

  // Extend duration state
  const [extendHours, setExtendHours] = useState(1);
  const [extendFeedback, setExtendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Transfer station state
  const [selectedTargetStationId, setSelectedTargetStationId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Call staff state
  const [staffCategory, setStaffCategory] = useState<SupportTicketCategory>('CONTROLLER');
  const [staffIssueText, setStaffIssueText] = useState('');
  const [staffCallSubmitted, setStaffCallSubmitted] = useState<string | null>(null);

  // Handle Extend Session via Server Endpoint
  const handleConfirmExtend = async () => {
    if (!currentSession) return;
    try {
      const res = await fetch(`/api/sessions/${currentSession.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraHours: extendHours })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setExtendFeedback({ type: 'error', message: data.error || 'Cannot extend session.' });
      } else {
        setExtendFeedback({ type: 'success', message: `Session extended by ${extendHours} hour(s)!` });
        extendSession(currentSession.id, extendHours);
        setTimeout(() => {
          setIsExtendModalOpen(false);
          setExtendFeedback(null);
        }, 1500);
      }
    } catch (err: any) {
      setExtendFeedback({ type: 'error', message: 'Network error communicating with cafe server.' });
    }
  };

  // Handle Transfer Request via Server Endpoint
  const handleConfirmTransfer = async () => {
    if (!currentSession || !selectedTargetStationId) return;
    try {
      const res = await fetch(`/api/sessions/${currentSession.id}/transfer-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedStationId: selectedTargetStationId,
          reason: transferReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setTransferSuccess(true);
        setTimeout(() => {
          setIsTransferModalOpen(false);
          setTransferSuccess(false);
          setSelectedTargetStationId('');
          setTransferReason('');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Call Staff via Server Endpoint
  const handleConfirmCallStaff = async () => {
    if (!currentSession) return;
    try {
      const res = await fetch(`/api/sessions/${currentSession.id}/call-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: staffIssueText || `Assistance needed: ${staffCategory}`,
          category: staffCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        setStaffCallSubmitted(data.ticket.id);
        setTimeout(() => {
          setIsStaffCallModalOpen(false);
          setStaffCallSubmitted(null);
          setStaffIssueText('');
        }, 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Available alternative stations for transfer
  const availableTargetStations = systems.filter(
    (s) => s.id !== currentSession?.systemId && s.status === 'AVAILABLE'
  );

  if (!currentSession) {
    return (
      <div className="p-16 rounded-3xl bg-[#0c0c0c] border border-white/10 text-center flex flex-col items-center justify-center gap-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
          <Tv className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            No Active Live Session
          </h2>
          <p className="text-xs text-white/50 max-w-md mt-1">
            You are not currently checked into an arena rig. Reserve a gaming station or check in with your QR pass at the front desk terminal.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onOpenBooking && onOpenBooking('Gaming PC')}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 cursor-pointer"
          >
            Reserve a Rig
          </button>
          <button
            onClick={() => setActiveNav('reservations')}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            My Reservations
          </button>
        </div>
      </div>
    );
  }

  const gamingCharges = currentSession.totalAmount - currentSession.foodTotal;

  return (
    <div id="screen-live-session" className="flex flex-col gap-6 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Arena Rig Control Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Tv className="w-8 h-8 text-red-500 animate-pulse" />
            <span>Live Session Hub: {currentSession.systemName}</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1">
            Real-time station monitoring, high-speed fiber telemetry, in-session café ordering, and instant concierge support.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-mono font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>SESSION RUNNING</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Telemetry & Countdown Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Countdown & Station Telemetry */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-2xl">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                Active Game
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                {currentSession.gameTitle || 'Apex Legends / Valorant'}
              </h2>
              <span className="text-xs text-white/50">
                Logged in as: <strong className="text-white font-bold">{currentSession.customerName}</strong>
              </span>
            </div>

            {/* Hardware Status Pills */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <span>{currentStation?.ping || 9}ms Ping</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-cyan-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentStation?.temp || 45}°C GPU</span>
              </span>
            </div>
          </div>

          {/* Central Circular / Digital Timer Display */}
          <div className="py-6 flex flex-col items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 mb-2">
              Time Remaining on Rig
            </span>
            <div className="text-5xl sm:text-7xl font-black text-red-500 font-mono tracking-wider drop-shadow-[0_0_25px_rgba(239,68,68,0.3)]">
              {formatTimer(secondsRemaining)}
            </div>
            <span className="text-xs text-white/40 mt-3 font-mono">
              Started {new Date(currentSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Scheduled Finish {new Date(currentSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Action Hub Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => onOpenFnB && onOpenFnB(currentSession.id)}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-amber-600/20 border border-white/10 hover:border-amber-500/40 text-white transition flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
            >
              <Coffee className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider">Order F&B</span>
              <span className="text-[9px] text-white/40">Delivered to Rig</span>
            </button>

            <button
              onClick={() => setIsExtendModalOpen(true)}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-red-600/20 border border-white/10 hover:border-red-600/40 text-white transition flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
            >
              <Clock className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider">Extend Time</span>
              <span className="text-[9px] text-white/40">+30m / +1h / +2h</span>
            </button>

            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-cyan-600/20 border border-white/10 hover:border-cyan-500/40 text-white transition flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
            >
              <Repeat className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider">Transfer Rig</span>
              <span className="text-[9px] text-white/40">Switch Station</span>
            </button>

            <button
              onClick={() => setIsStaffCallModalOpen(true)}
              className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-white transition flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
            >
              <Headphones className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider">Call Staff</span>
              <span className="text-[9px] text-white/40">Instant Concierge</span>
            </button>
          </div>
        </div>

        {/* Right Col: Live Session Ledger & In-Session Bill */}
        <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-white/60" />
                <span>Live Session Bill</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                AUTO-CALCULATING
              </span>
            </div>

            {/* Bill Details */}
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between text-white/70">
                <span>Gaming Duration ({currentSession.durationHours}h @ ₹{currentSession.ratePerHour}/h)</span>
                <span className="font-mono text-white font-bold">₹{gamingCharges}</span>
              </div>

              {/* Food Items Attached */}
              {currentSession.foodItems.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                    In-Session Café Orders
                  </span>
                  {currentSession.foodItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-white/60 pl-1">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-mono text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bill Totals */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                <span className="font-bold text-white uppercase">Current Total</span>
                <span className="text-xl font-black text-white font-mono">
                  ₹{currentSession.totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* End Session Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => setIsEndSessionModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Checkout & End Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* EXTEND SESSION MODAL */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" />
                <span>Extend Gaming Time</span>
              </h3>
              <button onClick={() => setIsExtendModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Add extra hours to station <strong className="text-white font-bold">{currentSession.systemName}</strong> without interrupting your game.
            </p>

            {/* Select Extra Hours */}
            <div className="grid grid-cols-3 gap-2">
              {[0.5, 1, 2].map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => setExtendHours(hrs)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                    extendHours === hrs
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                  }`}
                >
                  +{hrs >= 1 ? `${hrs} Hour${hrs > 1 ? 's' : ''}` : '30 Mins'}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-white/60">Additional Charge:</span>
              <span className="font-mono text-white font-black text-base">
                ₹{Math.round(currentSession.ratePerHour * extendHours)}
              </span>
            </div>

            {extendFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                extendFeedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {extendFeedback.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExtend}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER REQUEST MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Repeat className="w-5 h-5 text-cyan-400" />
                <span>Station Transfer Request</span>
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Want to switch to another available rig or upgrade to Sim Racing / VIP Suite? Select your target station:
            </p>

            {/* Target Stations List */}
            <div className="max-h-48 overflow-y-auto flex flex-col gap-2">
              {availableTargetStations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedTargetStationId(st.id)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    selectedTargetStationId === st.id
                      ? 'bg-cyan-950/30 border-cyan-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{st.name} ({st.category})</span>
                    <span className="text-[10px] text-white/40 font-mono">₹{st.hourlyRate}/hr</span>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 ${selectedTargetStationId === st.id ? 'text-cyan-400' : 'text-white/20'}`} />
                </button>
              ))}
            </div>

            {/* Reason */}
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Reason for Transfer</label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g., Peripherals issue, playing with friend, upgrade..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {transferSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                Transfer request submitted! Staff will approve and migrate your session.
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!selectedTargetStationId}
                onClick={handleConfirmTransfer}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL STAFF / CONCIERGE MODAL */}
      {isStaffCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Headphones className="w-5 h-5 text-purple-400" />
                <span>Call Staff to Station</span>
              </h3>
              <button onClick={() => setIsStaffCallModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Need technical help, controller swap, or café assistance at <strong className="text-white">{currentSession.systemName}</strong>? Select assistance category:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(['CONTROLLER', 'NETWORK', 'GAME_PROBLEM', 'FOOD', 'STATION', 'GENERAL'] as SupportTicketCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setStaffCategory(cat)}
                  className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer text-left ${
                    staffCategory === cat
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Additional Note (Optional)</label>
              <textarea
                rows={2}
                value={staffIssueText}
                onChange={(e) => setStaffIssueText(e.target.value)}
                placeholder="e.g., Need DualSense charging cable, game crash error code..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>

            {staffCallSubmitted && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Technician dispatched! Request #{staffCallSubmitted} is queued.</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsStaffCallModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCallStaff}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Dispatch Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* END SESSION CONFIRMATION MODAL */}
      {isEndSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 text-red-500">
                <LogOut className="w-5 h-5" />
                <span>End Live Session?</span>
              </h3>
              <button onClick={() => setIsEndSessionModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Ending your session will log out station <strong className="text-white font-bold">{currentSession.systemName}</strong> and generate your final digital receipt.
            </p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/60">Final Bill Payable:</span>
              <span className="text-xl font-black text-white font-mono">₹{currentSession.totalAmount}</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsEndSessionModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Continue Playing
              </button>
              <button
                onClick={() => {
                  endSession(currentSession.id);
                  setIsEndSessionModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
