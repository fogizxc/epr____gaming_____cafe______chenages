import React, { useState } from 'react';
import {
  Users,
  Plus,
  Clock,
  Phone,
  Gamepad2,
  Tv,
  CheckCircle2,
  Trash2,
  Bell,
  AlertCircle
} from 'lucide-react';
import { WaitlistEntry, GamingSystem, GamingServiceCategory } from '../../types';

interface EmployeeWaitlistViewProps {
  waitlist: WaitlistEntry[];
  systems: GamingSystem[];
  onAddWaitlist: (entry: { customerName: string; customerPhone: string; service: GamingServiceCategory; durationHours: number; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  onAssignStation: (waitlistId: string, systemId: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveWaitlist: (waitlistId: string) => Promise<{ success: boolean; error?: string }>;
}

export const EmployeeWaitlistView: React.FC<EmployeeWaitlistViewProps> = ({
  waitlist,
  systems,
  onAddWaitlist,
  onAssignStation,
  onRemoveWaitlist
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState<GamingServiceCategory>('PC_GAMING');
  const [durationHours, setDurationHours] = useState(1);
  const [notes, setNotes] = useState('');

  // Assign Station Modal
  const [assigningEntry, setAssigningEntry] = useState<WaitlistEntry | null>(null);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [actionError, setActionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const availableSystems = systems.filter(s => s.status === 'AVAILABLE');

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setIsProcessing(true);
    setActionError('');
    const res = await onAddWaitlist({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      service,
      durationHours,
      notes
    });
    setIsProcessing(false);
    if (res.success) {
      setShowAddModal(false);
      setName('');
      setPhone('');
      setNotes('');
    } else {
      setActionError(res.error || 'Failed to add to waitlist.');
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningEntry || !selectedStationId) return;
    setIsProcessing(true);
    setActionError('');
    const res = await onAssignStation(assigningEntry.id, selectedStationId);
    setIsProcessing(false);
    if (res.success) {
      setAssigningEntry(null);
      setSelectedStationId('');
    } else {
      setActionError(res.error || 'Failed to assign station.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Add Button */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Gamer Waitlist Queue ({waitlist.length})
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Manage peak-hour queues, send arrival notifications & auto-seat players when rigs open.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-purple-600/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Waitlist</span>
        </button>
      </div>

      {/* Waitlist Table / Cards */}
      {waitlist.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
          Waitlist is currently empty. Floor has capacity or no waiting gamers logged.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waitlist.map((entry, idx) => (
            <div
              key={entry.id}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-white">{entry.customerName}</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                    {entry.status}
                  </span>
                </div>

                <div className="text-xs text-white/50 font-mono space-y-1 mb-3">
                  <div>Phone: {entry.customerPhone}</div>
                  <div>Desired: {entry.service.replace('_', ' ')} ({entry.durationHours}hr)</div>
                  {entry.notes && <div className="text-white/40 italic">"{entry.notes}"</div>}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setAssigningEntry(entry);
                    setSelectedStationId(availableSystems[0]?.id || '');
                    setActionError('');
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
                >
                  Assign Rig
                </button>
                <button
                  onClick={() => onRemoveWaitlist(entry.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-950/60 hover:text-red-400 text-white/40 transition cursor-pointer"
                  title="Remove from queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD TO WAITLIST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">Add Player to Waitlist</h3>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Phone Number (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Desired Rig Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="PC_GAMING" className="bg-black text-white">PC Gaming Arena (₹250/hr)</option>
                  <option value="PS5_CONSOLE" className="bg-black text-white">PS5 Console Pod (₹350/hr)</option>
                  <option value="XBOX_CONSOLE" className="bg-black text-white">Xbox Series X (₹300/hr)</option>
                  <option value="SIM_RACING" className="bg-black text-white">Sim Racing Cockpit (₹500/hr)</option>
                  <option value="VR_RIGS" className="bg-black text-white">VR Rigs (₹600/hr)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Notes / Peripheral requests</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Needs 2 controllers / waiting at café bar"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30"
              >
                {isProcessing ? 'Enrolling...' : 'Enroll on Waitlist'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN STATION MODAL */}
      {assigningEntry && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">Seat Waiting Player</h3>
              <button onClick={() => setAssigningEntry(null)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">✕</button>
            </div>

            <div className="text-xs text-white/60">
              Player: <strong className="text-white">{assigningEntry.customerName}</strong> ({assigningEntry.service.replace('_', ' ')})
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                Select Available Station
              </label>
              {availableSystems.length === 0 ? (
                <div className="text-xs text-red-400 p-3 rounded-xl bg-red-950/40">
                  No stations are free right now. Wait for a session to end.
                </div>
              ) : (
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
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

            <button
              onClick={handleConfirmAssign}
              disabled={isProcessing || !selectedStationId}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              {isProcessing ? 'Seating...' : 'Start Session & Notify Player'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
