import React, { useState } from 'react';
import {
  X,
  Plus,
  Play,
  User,
  Phone,
  Gamepad2,
  Clock,
  CreditCard,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useCafe } from '../../context/CafeContext';

interface AdminWalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSystemId?: string;
  onSuccess?: (msg: string) => void;
}

export const AdminWalkInModal: React.FC<AdminWalkInModalProps> = ({
  isOpen,
  onClose,
  preselectedSystemId,
  onSuccess
}) => {
  const { systems, startWalkInSession, employeeShift } = useCafe();

  const availableSystems = systems.filter(
    s => s.status === 'AVAILABLE' || s.id === preselectedSystemId
  );

  const [systemId, setSystemId] = useState(
    preselectedSystemId || availableSystems[0]?.id || ''
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [gameTitle, setGameTitle] = useState('Valorant / Counter-Strike 2');
  const [durationHours, setDurationHours] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Wallet'>('UPI');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedSys = systems.find(s => s.id === systemId);
  const hourlyRate = selectedSys?.hourlyRate || 199;
  const estimatedCost = hourlyRate * durationHours;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!systemId) {
      setError('Please select an available gaming rig.');
      return;
    }

    if (!customerName.trim()) {
      setError('Customer / Gamer name is required.');
      return;
    }

    const res = startWalkInSession({
      systemId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || 'Walk-In Gamer',
      gameTitle: gameTitle.trim(),
      durationHours: Number(durationHours),
      paymentMethod,
      employeeName: employeeShift?.employeeName || 'Duty Supervisor'
    });

    if (res.success) {
      if (onSuccess) {
        onSuccess(`Walk-in session started for ${customerName} on ${selectedSys?.name || systemId}!`);
      }
      onClose();
    } else {
      setError(res.error || 'Failed to start session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#111] border border-white/15 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-white tracking-tight">
                Launch Walk-In Gamer Session
              </h3>
              <p className="text-xs text-white/50 font-light">
                Assign available rig, set play duration, and collect tariff
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Rig Select */}
          <div>
            <label className="text-xs text-white/60 block mb-1">Select Available Rig / Station</label>
            <select
              required
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
            >
              <option value="">-- Select Station --</option>
              {availableSystems.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category}) • ₹{s.hourlyRate}/hr • {s.location}
                </option>
              ))}
            </select>
          </div>

          {/* Gamer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 block mb-1">Gamer / Nickname</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 98200 12345"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Game Title & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 block mb-1">Title / Game</label>
              <div className="relative">
                <Gamepad2 className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Valorant, FIFA 24"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Duration (Hours)</label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours (Half Day)</option>
                  <option value={6}>6 Hours (LAN Pass)</option>
                  <option value={8}>8 Hours (All Night)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(['UPI', 'Cash', 'Card', 'Wallet'] as const).map(method => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 text-xs font-bold uppercase rounded-xl transition cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-amber-400 text-black shadow font-black'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Cost Estimate Pill */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-white/40 uppercase block">Total Estimated Bill:</span>
              <span className="text-xl font-black text-amber-400">
                ₹{estimatedCost}
              </span>
            </div>
            <div className="text-right text-[11px] text-white/50">
              <span>{durationHours} hr(s) @ ₹{hourlyRate}/hr</span>
              <span className="block text-emerald-400 font-bold">Rig status set to ACTIVE</span>
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="pt-3 border-t border-white/10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
            >
              Start Session Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
