import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  X,
  User,
  Gamepad2,
  Tv,
  Headphones,
  HardDrive,
  Wifi,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';
import { MaintenanceTicket } from '../../types';
import { INITIAL_MAINTENANCE_TICKETS } from '../../data/adminInitialData';

export const AdminMaintenance: React.FC = () => {
  const { systems, updateSystemStatus } = useCafe();

  const [tickets, setTickets] = useState<MaintenanceTicket[]>(INITIAL_MAINTENANCE_TICKETS);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Ticket Form
  const [newStationId, setNewStationId] = useState(systems[0]?.id || '');
  const [newCategory, setNewCategory] = useState<MaintenanceTicket['issueCategory']>('CONTROLLER_DRIFT');
  const [newPriority, setNewPriority] = useState<MaintenanceTicket['priority']>('HIGH');
  const [newTechnician, setNewTechnician] = useState('Hardware Systems Tech');
  const [newDescription, setNewDescription] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const station = systems.find(s => s.id === newStationId);
    if (!station) return;

    const newTicket: MaintenanceTicket = {
      id: `maint-${Date.now().toString().slice(-4)}`,
      stationId: station.id,
      stationName: station.name,
      issueCategory: newCategory,
      priority: newPriority,
      reportedBy: 'Floor Admin',
      reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'OPEN',
      assignedTechnician: newTechnician,
      description: newDescription,
      resolutionNotes: ''
    };

    setTickets([newTicket, ...tickets]);

    // If critical or high, mark rig in MAINTENANCE status automatically
    if (newPriority === 'CRITICAL' || newPriority === 'HIGH') {
      updateSystemStatus(station.id, 'MAINTENANCE');
      triggerToast(`Ticket logged and ${station.name} locked in MAINTENANCE mode.`);
    } else {
      triggerToast(`Maintenance ticket created for ${station.name}.`);
    }

    setShowAddTicketModal(false);
    setNewDescription('');
  };

  const handleStatusChange = (ticketId: string, newStatus: MaintenanceTicket['status']) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : t.resolvedAt
            }
          : t
      )
    );

    // If resolved, offer to mark station back AVAILABLE
    if (newStatus === 'RESOLVED') {
      updateSystemStatus(ticket.stationId, 'AVAILABLE');
      triggerToast(`Ticket resolved! ${ticket.stationName} marked AVAILABLE for gamers.`);
    } else {
      triggerToast(`Ticket status updated to ${newStatus}.`);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchesQuery = !searchQuery ||
      t.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedTechnician?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const getCategoryIcon = (cat: MaintenanceTicket['issueCategory']) => {
    switch (cat) {
      case 'CONTROLLER_DRIFT':
        return <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'DISPLAY_GLITCH':
        return <Tv className="w-3.5 h-3.5 text-cyan-400" />;
      case 'AUDIO_FAILURE':
        return <Headphones className="w-3.5 h-3.5 text-purple-400" />;
      case 'GAME_UPDATE':
        return <HardDrive className="w-3.5 h-3.5 text-blue-400" />;
      case 'NETWORK_PING':
        return <Wifi className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-white/70" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Hardware Reliability & Ops
            </span>
            <span className="text-xs text-white/50 font-mono">
              {tickets.filter(t => t.status !== 'RESOLVED').length} Active Issues
            </span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight">
            Floor Hardware Maintenance & Technician Tickets
          </h2>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Log gamepad drift, display flickering, steam game patches, audio glitches, and rig sanitization.
          </p>
        </div>

        <button
          onClick={() => setShowAddTicketModal(true)}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Log Technical Issue</span>
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            Open Tickets
          </span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">
            {tickets.filter(t => t.status === 'OPEN').length}
          </div>
          <span className="text-[11px] text-amber-400/80 mt-1 block">Awaiting technician triage</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            In Progress
          </span>
          <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
            {tickets.filter(t => t.status === 'IN_PROGRESS').length}
          </div>
          <span className="text-[11px] text-cyan-400/80 mt-1 block">Under active repair / download</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            Critical High-Priority
          </span>
          <div className="text-3xl font-black text-red-400 font-mono mt-1">
            {tickets.filter(t => t.priority === 'CRITICAL' && t.status !== 'RESOLVED').length}
          </div>
          <span className="text-[11px] text-red-400/80 mt-1 block">Requires immediate fix</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">
            Resolved This Week
          </span>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
            {tickets.filter(t => t.status === 'RESOLVED').length}
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">Rigs restored to floor</span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-amber-400 text-black shadow'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search station, issue, technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 outline-none"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((t) => (
          <div
            key={t.id}
            className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
              t.status === 'OPEN'
                ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-400'
                : t.status === 'IN_PROGRESS'
                ? 'bg-cyan-950/15 border-cyan-500/30 hover:border-cyan-400'
                : 'bg-white/[0.02] border-white/10 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white font-mono uppercase tracking-tight">
                    {t.stationName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                    {getCategoryIcon(t.issueCategory)}
                    <span>{t.issueCategory.replace('_', ' ')}</span>
                  </span>
                </div>

                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    t.priority === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : t.priority === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {t.priority}
                </span>
              </div>

              <p className="text-xs text-white/80 my-2 leading-relaxed font-light">
                {t.description}
              </p>

              {t.resolutionNotes && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 my-2">
                  <strong className="block text-[10px] uppercase font-mono">Resolution:</strong>
                  {t.resolutionNotes}
                </div>
              )}

              <div className="my-2 pt-2 border-t border-white/5 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between text-white/50 font-mono">
                  <span>Reported:</span>
                  <span>{t.reportedAt} by {t.reportedBy}</span>
                </div>
                <div className="flex items-center justify-between text-white/70 font-mono">
                  <span>Assigned Tech:</span>
                  <span className="text-white font-bold">{t.assignedTechnician || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                  t.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : t.status === 'IN_PROGRESS'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {t.status.replace('_', ' ')}
              </span>

              <div className="flex items-center gap-1.5">
                {t.status === 'OPEN' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'IN_PROGRESS')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-[10px] font-black uppercase transition cursor-pointer"
                  >
                    Start Repair
                  </button>
                )}
                {t.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'RESOLVED')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-[10px] font-black uppercase transition cursor-pointer"
                  >
                    Mark Fixed
                  </button>
                )}
                {t.status === 'RESOLVED' && (
                  <span className="text-[10px] text-emerald-400 font-mono">Verified ✓</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD TICKET */}
      {showAddTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-black uppercase text-white">Log Maintenance Issue</h3>
              <button
                onClick={() => setShowAddTicketModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTicket} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">Affected Station</label>
                <select
                  value={newStationId}
                  onChange={(e) => setNewStationId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                >
                  {systems.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Issue Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="CONTROLLER_DRIFT">Controller Drift</option>
                    <option value="DISPLAY_GLITCH">Display / Cable Glitch</option>
                    <option value="AUDIO_FAILURE">Headset Audio Issue</option>
                    <option value="GAME_UPDATE">Game Patch / Download</option>
                    <option value="NETWORK_PING">Network Latency</option>
                    <option value="PERIPHERAL_REPLACE">Key/Mouse Replacement</option>
                    <option value="CLEANING">Sanitization & Cleaning</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High (Lock Rig)</option>
                    <option value="CRITICAL">Critical (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Assigned Technician</label>
                <input
                  type="text"
                  value={newTechnician}
                  onChange={(e) => setNewTechnician(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Description of Issue</label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Left bumper not registering clicks on Xbox Elite Series 2 controller."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTicketModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
