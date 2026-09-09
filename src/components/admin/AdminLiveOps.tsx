import React, { useState, useEffect } from 'react';
import {
  Radio,
  Clock,
  Coffee,
  ArrowRightLeft,
  AlertOctagon,
  FileText,
  Search,
  Plus,
  Zap,
  CheckCircle2,
  X,
  Send,
  RotateCcw,
  Sparkles,
  DollarSign,
  User,
  Phone
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { ActiveSession, GamingSystem } from '../../types';

interface AdminLiveOpsProps {
  onOpenWalkInModal: () => void;
}

export const AdminLiveOps: React.FC<AdminLiveOpsProps> = ({ onOpenWalkInModal }) => {
  const {
    systems,
    activeSessions,
    fnbProducts,
    extendSession,
    addFoodToSession,
    endSession,
    updateSystem
  } = useCafe();

  const [now, setNow] = useState(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Modals state
  const [foodModalSession, setFoodModalSession] = useState<ActiveSession | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  const [transferModalSession, setTransferModalSession] = useState<ActiveSession | null>(null);
  const [transferTargetSystemId, setTransferTargetSystemId] = useState('');

  const [broadcastModalRig, setBroadcastModalRig] = useState<GamingSystem | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatCountdown = (endTime: number) => {
    const diff = Math.max(0, endTime - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleExtend = (sessionId: string, hours: number) => {
    const res = extendSession(sessionId, hours);
    if (res.success) {
      triggerToast(`Session extended by ${hours} hour(s).`);
    } else {
      triggerToast(res.error || 'Failed to extend session.');
    }
  };

  const handleAddFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodModalSession || !selectedProduct) return;
    const res = addFoodToSession(foodModalSession.id, selectedProduct, productQuantity);
    if (res.success) {
      triggerToast(`Added ${productQuantity}x concessions item to ${foodModalSession.customerName}'s tab.`);
      setFoodModalSession(null);
      setSelectedProduct('');
      setProductQuantity(1);
    } else {
      triggerToast(res.error || 'Failed to add item to tab.');
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalSession || !transferTargetSystemId) return;

    const oldSys = systems.find(s => s.id === transferModalSession.systemId);
    const newSys = systems.find(s => s.id === transferTargetSystemId);

    if (!oldSys || !newSys) return;

    // Free old system
    updateSystem(oldSys.id, {
      status: 'AVAILABLE',
      activeSessionId: undefined,
      currentCustomerName: undefined,
      currentCustomerPhone: undefined,
      sessionEndTime: undefined
    });

    // Occupy new system
    updateSystem(newSys.id, {
      status: 'ACTIVE',
      activeSessionId: transferModalSession.id,
      currentCustomerName: transferModalSession.customerName,
      currentCustomerPhone: transferModalSession.customerPhone,
      sessionEndTime: transferModalSession.endTime
    });

    // Update activeSession object
    transferModalSession.systemId = newSys.id;
    transferModalSession.systemName = newSys.name;

    triggerToast(`Station successfully transferred from ${oldSys.name} to ${newSys.name}.`);
    setTransferModalSession(null);
  };

  const handleBroadcastSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastModalRig || !broadcastMessage) return;
    triggerToast(`In-game screen alert sent to ${broadcastModalRig.name}: "${broadcastMessage}"`);
    setBroadcastModalRig(null);
    setBroadcastMessage('');
  };

  const handleEndSession = (sessionId: string, rigName: string) => {
    if (confirm(`End session on ${rigName}? This will finalize billing and free up the station.`)) {
      const res = endSession(sessionId);
      if (res.success) {
        triggerToast(`Session terminated. Invoice #${res.invoice?.id || ''} generated.`);
      }
    }
  };

  const filteredSessions = activeSessions.filter(s => {
    const sys = systems.find(sys => sys.id === s.systemId);
    const matchesCategory = filterCategory === 'ALL' || (sys && sys.category === filterCategory);
    const matchesQuery = !searchQuery ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.systemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerPhone.includes(searchQuery);
    return matchesCategory && matchesQuery;
  });

  const availableTargetSystems = systems.filter(s => s.status === 'AVAILABLE');

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Floor Command
            </span>
            <span className="text-xs text-white/50 font-mono">
              {activeSessions.length} Active Gamer Sessions
            </span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight mt-1">
            Live Floor Operations & Active Station Controls
          </h2>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Monitor real-time gaming times, transfer stations on request, add concessions to active tabs, or terminate sessions.
          </p>
        </div>

        <button
          onClick={onOpenWalkInModal}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Walk-in Session</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gamer, station, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'Gaming PC', 'PlayStation', 'Xbox', 'Sim Racing', 'VR Lounge', 'Pool Table'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                filterCategory === cat
                  ? 'bg-amber-400 text-black shadow'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map((session) => {
          const sys = systems.find(s => s.id === session.systemId);
          const remainingMs = Math.max(0, session.endTime - now);
          const isExpiring = remainingMs < 15 * 60 * 1000;

          return (
            <div
              key={session.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                isExpiring
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Station & Status header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white font-mono uppercase tracking-tight">
                        {session.systemName}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/60 uppercase">
                        {sys?.category || 'Rig'}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono block mt-0.5">
                      Session ID: #{session.id.slice(-6)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 ${
                        isExpiring
                          ? 'bg-amber-400 text-black animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatCountdown(session.endTime)}</span>
                    </span>
                  </div>
                </div>

                {/* Gamer info */}
                <div className="py-3 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Gamer:</span>
                    </span>
                    <span className="font-bold text-white uppercase tracking-tight">
                      {session.customerName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/40 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>Phone:</span>
                    </span>
                    <span className="text-white/70">{session.customerPhone}</span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/40">Tariff Rate:</span>
                    <span className="text-amber-400 font-bold">₹{session.hourlyRate}/hr</span>
                  </div>

                  {session.gameTitle && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/40">Current Game:</span>
                      <span className="text-cyan-400 font-bold truncate max-w-[150px]">
                        {session.gameTitle}
                      </span>
                    </div>
                  )}

                  {/* F&B Items added to tab */}
                  {session.foodOrders && session.foodOrders.length > 0 && (
                    <div className="mt-1 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">
                        Concessions Tab ({session.foodOrders.length} items):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {session.foodOrders.map((f, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300 font-mono"
                          >
                            {f.name} × {f.quantity} (₹{f.price * f.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleExtend(session.id, 0.5)}
                    className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase transition cursor-pointer"
                  >
                    +30 Mins
                  </button>
                  <button
                    onClick={() => handleExtend(session.id, 1)}
                    className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase transition cursor-pointer"
                  >
                    +1 Hour
                  </button>
                  <button
                    onClick={() => handleExtend(session.id, 2)}
                    className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase transition cursor-pointer"
                  >
                    +2 Hours
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Add Snack */}
                  <button
                    onClick={() => setFoodModalSession(session)}
                    className="flex-1 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Coffee className="w-3 h-3" />
                    <span>Add Snack</span>
                  </button>

                  {/* Transfer Station */}
                  <button
                    onClick={() => {
                      setTransferModalSession(session);
                      setTransferTargetSystemId(availableTargetSystems[0]?.id || '');
                    }}
                    disabled={availableTargetSystems.length === 0}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-30 text-cyan-300 text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Transfer</span>
                  </button>

                  {/* Send Screen Alert */}
                  {sys && (
                    <button
                      onClick={() => setBroadcastModalRig(sys)}
                      className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                      title="Send screen message alert"
                    >
                      <Radio className="w-3 h-3" />
                    </button>
                  )}

                  {/* Force End */}
                  <button
                    onClick={() => handleEndSession(session.id, session.systemName)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold uppercase transition cursor-pointer"
                    title="End session & checkout bill"
                  >
                    End
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="col-span-full py-16 text-center text-white/40 text-xs">
            No active sessions matching the current filter. Launch a walk-in to get started.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD FOOD TO SESSION TAB */}
      {/* ========================================================================= */}
      {foodModalSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-black uppercase text-white">
                  Add Concession to Tab
                </h3>
                <p className="text-xs text-white/50 font-mono">
                  {foodModalSession.systemName} • {foodModalSession.customerName}
                </p>
              </div>
              <button
                onClick={() => setFoodModalSession(null)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFoodSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1">Select Concession Item</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                >
                  <option value="">-- Choose snack or drink --</option>
                  {fnbProducts.filter(p => p.stock > 0).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price}) • {p.stock} in stock
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFoodModalSession(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase"
                >
                  Add to Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRANSFER STATION */}
      {/* ========================================================================= */}
      {transferModalSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-black uppercase text-white">
                  Transfer Gaming Station
                </h3>
                <p className="text-xs text-white/50 font-mono">
                  Move {transferModalSession.customerName} ({transferModalSession.systemName}) to another rig
                </p>
              </div>
              <button
                onClick={() => setTransferModalSession(null)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1">Select Available Destination Rig</label>
                <select
                  required
                  value={transferTargetSystemId}
                  onChange={(e) => setTransferTargetSystemId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 outline-none"
                >
                  {availableTargetSystems.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category}) • ₹{s.hourlyRate}/hr
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-white/40 leading-relaxed">
                All remaining session time and tab charges will be transferred seamlessly to the new rig.
              </p>

              <div className="pt-2 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTransferModalSession(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BROADCAST ALERT TO RIG SCREEN */}
      {/* ========================================================================= */}
      {broadcastModalRig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-black uppercase text-white">
                  Send Screen Alert to {broadcastModalRig.name}
                </h3>
                <p className="text-xs text-white/50 font-mono">
                  Message overlays on the gamer's monitor in real-time
                </p>
              </div>
              <button
                onClick={() => setBroadcastModalRig(null)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSend} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1">Message Content</label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Your booked session will expire in 10 minutes. Head to front desk to extend."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setBroadcastModalRig(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
