import React, { useState, useEffect } from 'react';
import {
  Clock,
  Tv,
  Coffee,
  ArrowRightLeft,
  XCircle,
  PlusCircle,
  AlertCircle,
  DollarSign,
  Receipt,
  CheckCircle2,
  Search,
  Filter
} from 'lucide-react';
import { ActiveSession, GamingSystem } from '../../types';

interface EmployeeLiveSessionsViewProps {
  activeSessions: ActiveSession[];
  systems: GamingSystem[];
  onOpenFnB: (sessionId: string) => void;
  onExtendSession: (sessionId: string, hours: number) => Promise<{ success: boolean; error?: string }>;
  onTransferSession: (sessionId: string, targetSystemId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  onEndSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
}

export const EmployeeLiveSessionsView: React.FC<EmployeeLiveSessionsViewProps> = ({
  activeSessions,
  systems,
  onOpenFnB,
  onExtendSession,
  onTransferSession,
  onEndSession
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  // Modals for Extension and Transfer
  const [extendModalSession, setExtendModalSession] = useState<ActiveSession | null>(null);
  const [extendHours, setExtendHours] = useState(1);

  const [transferModalSession, setTransferModalSession] = useState<ActiveSession | null>(null);
  const [targetSystemId, setTargetSystemId] = useState('');
  const [transferReason, setTransferReason] = useState('Customer preference');

  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Available systems for transfer (must be AVAILABLE)
  const availableSystems = systems.filter(s => s.status === 'AVAILABLE');

  const filteredSessions = activeSessions.filter(s =>
    s.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.systemName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.customerPhone && s.customerPhone.includes(searchFilter)) ||
    (s.gameTitle && s.gameTitle.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleConfirmExtend = async () => {
    if (!extendModalSession) return;
    setIsProcessing(true);
    setActionError('');
    const res = await onExtendSession(extendModalSession.id, extendHours);
    setIsProcessing(false);
    if (res.success) {
      setExtendModalSession(null);
    } else {
      setActionError(res.error || 'Failed to extend session.');
    }
  };

  const handleConfirmTransfer = async () => {
    if (!transferModalSession || !targetSystemId) return;
    setIsProcessing(true);
    setActionError('');
    const res = await onTransferSession(transferModalSession.id, targetSystemId, transferReason);
    setIsProcessing(false);
    if (res.success) {
      setTransferModalSession(null);
      setTargetSystemId('');
    } else {
      setActionError(res.error || 'Failed to transfer station.');
    }
  };

  const handleConfirmEnd = async (session: ActiveSession) => {
    if (!confirm(`Are you sure you want to end the session for ${session.customerName} on ${session.systemName}? This will finalize the bill and free the station.`)) {
      return;
    }
    const res = await onEndSession(session.id);
    if (!res.success) {
      alert(res.error || 'Failed to end session.');
    }
  };

  // Helper to calculate remaining minutes
  const calculateRemaining = (endTimeStr: string) => {
    try {
      const [h, m] = endTimeStr.split(':').map(Number);
      const now = new Date();
      const end = new Date();
      end.setHours(h, m, 0, 0);

      const diffMs = end.getTime() - now.getTime();
      if (diffMs <= 0) return { remainingMins: 0, text: '00:00 (Expired)', isWarning: true, isCritical: true };

      const totalMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const pad = (n: number) => String(n).padStart(2, '0');

      return {
        remainingMins: totalMins,
        text: `${hrs > 0 ? `${hrs}h ` : ''}${pad(mins)}m remaining`,
        isWarning: totalMins <= 15,
        isCritical: totalMins <= 5
      };
    } catch {
      return { remainingMins: 30, text: '30m', isWarning: false, isCritical: false };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Live Session Control Center
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Real-time station monitoring, collision-safe extensions, atomic transfers & bill closing.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search active players or rigs..."
            className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Live Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
          No live sessions found matching filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const timeInfo = calculateRemaining(session.endTime);
            return (
              <div
                key={session.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  timeInfo.isCritical
                    ? 'bg-red-950/20 border-red-500/50 shadow-lg shadow-red-950/20'
                    : timeInfo.isWarning
                    ? 'bg-amber-950/15 border-amber-500/40'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  {/* Card Header: Rig, Status & Timer */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white uppercase tracking-tight">
                          {session.systemName}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/80">
                          {session.durationHours}h slot
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {session.customerName}
                      </div>
                      <div className="text-xs text-white/40 font-mono">
                        {session.customerPhone}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl inline-block ${
                          timeInfo.isCritical
                            ? 'bg-red-600 text-white animate-pulse'
                            : timeInfo.isWarning
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {timeInfo.text}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono mt-1">
                        {session.startTime} → {session.endTime}
                      </div>
                    </div>
                  </div>

                  {/* Active Game Title */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs mb-3">
                    <span className="text-white/50">Running Game:</span>
                    <span className="font-bold text-white truncate max-w-[200px]">
                      {session.gameTitle || 'Apex Legends'}
                    </span>
                  </div>

                  {/* Billing Details */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">
                        Current Charges
                      </span>
                      <div className="font-mono text-white font-bold mt-0.5">
                        Gaming: ₹{session.gamingCharge} {session.fnbTotalCharge > 0 && `• F&B: ₹${session.fnbTotalCharge}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white/40 block text-[10px] uppercase font-bold tracking-wider">
                        Total Tab
                      </span>
                      <div className="text-sm font-mono font-black text-emerald-400">
                        ₹{session.totalCharge}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Add F&B */}
                    <button
                      onClick={() => onOpenFnB(session.id)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-400" />
                      <span>Add F&B</span>
                    </button>

                    {/* Extend Session */}
                    <button
                      onClick={() => {
                        setExtendModalSession(session);
                        setExtendHours(1);
                        setActionError('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Extend</span>
                    </button>

                    {/* Transfer Station */}
                    <button
                      onClick={() => {
                        setTransferModalSession(session);
                        setTargetSystemId(availableSystems[0]?.id || '');
                        setActionError('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                      <span>Transfer</span>
                    </button>
                  </div>

                  {/* End Session */}
                  <button
                    onClick={() => handleConfirmEnd(session)}
                    className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    End & Bill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EXTEND SESSION MODAL */}
      {extendModalSession && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">
                Extend Session: {extendModalSession.systemName}
              </h3>
              <button
                onClick={() => setExtendModalSession(null)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-white/60">
              Player: <strong className="text-white">{extendModalSession.customerName}</strong>
              <br />
              Current End Time: <span className="font-mono text-cyan-400">{extendModalSession.endTime}</span>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                Select Extra Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1, 2, 3].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setExtendHours(hrs)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                      extendHours === hrs
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    +{hrs === 0.5 ? '30m' : `${hrs}h`}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConfirmExtend}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-cyan-600/30 disabled:opacity-50"
            >
              {isProcessing ? 'Extending...' : 'Confirm Extension'}
            </button>
          </div>
        </div>
      )}

      {/* TRANSFER STATION MODAL */}
      {transferModalSession && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">
                Transfer Station: {transferModalSession.systemName}
              </h3>
              <button
                onClick={() => setTransferModalSession(null)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-white/60">
              Player: <strong className="text-white">{transferModalSession.customerName}</strong>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                Select Destination Rig (Available Only)
              </label>
              {availableSystems.length === 0 ? (
                <div className="text-xs text-red-400 p-2.5 bg-red-950/40 rounded-xl">
                  No stations are currently free on the floor.
                </div>
              ) : (
                <select
                  value={targetSystemId}
                  onChange={(e) => setTargetSystemId(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {availableSystems.map((s) => (
                    <option key={s.id} value={s.id} className="bg-black text-white">
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                Reason for Station Transfer
              </label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Squad joining / peripheral preference"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleConfirmTransfer}
              disabled={isProcessing || !targetSystemId}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {isProcessing ? 'Transferring...' : 'Confirm Atomic Transfer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
