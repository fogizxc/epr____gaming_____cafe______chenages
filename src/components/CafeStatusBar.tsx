import React, { useMemo } from 'react';
import { Activity, CircleDollarSign, Clock3, Wifi } from 'lucide-react';
import { useCafe } from '../context/CafeContext';

/** Lightweight always-on operational pulse for the gaming floor. */
export const CafeStatusBar: React.FC = () => {
  const { systems, activeSessions, financialSummary } = useCafe();
  const online = useMemo(() => systems.filter(s => s.status !== 'MAINTENANCE').length, [systems]);
  const live = activeSessions.length;
  const revenue = Math.max(0, financialSummary.todayRevenue || 0);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 md:bottom-3 md:px-6">
      <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/80 px-3 py-2.5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
          <span className="hidden text-[10px] font-black uppercase tracking-[.22em] text-emerald-300 sm:inline">Cafe live</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-white/45 sm:gap-5">
          <span className="flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5 text-white/30" /> {online} rigs online</span>
          <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-red-400" /> {live} live</span>
          <span className="hidden items-center gap-1.5 md:flex"><Clock3 className="h-3.5 w-3.5 text-white/30" /> Live operations</span>
          <span className="hidden items-center gap-1.5 lg:flex"><CircleDollarSign className="h-3.5 w-3.5 text-emerald-400" /> ₹{revenue.toLocaleString('en-IN')} today</span>
        </div>
      </div>
    </div>
  );
};
