import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { GamingServiceCategory } from '../types';
import { Play, Sparkles, User, Phone, Clock, CreditCard, AlertCircle } from 'lucide-react';

interface QuickWalkInModalProps {
  onClose: () => void;
}

export const QuickWalkInModal: React.FC<QuickWalkInModalProps> = ({ onClose }) => {
  const { systems, startWalkInSession, getRateForService, customerMembership } = useCafe();

  const [selectedService, setSelectedService] = useState<GamingServiceCategory>('Gaming PC');
  const availableSystems = systems.filter(
    s => (s.category === selectedService || (selectedService === 'PS5' && s.category === 'PlayStation')) && s.status === 'AVAILABLE'
  );
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    availableSystems.length > 0 ? availableSystems[0].id : ''
  );

  const [customerName, setCustomerName] = useState('Walk-in Player');
  const [customerPhone, setCustomerPhone] = useState('+91 ');
  const [durationHours, setDurationHours] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership'>('UPI');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rate = getRateForService(selectedService);

  const hasCustomerMembership = Boolean(
    customerMembership &&
    customerMembership.status === 'ACTIVE' &&
    (
      customerName.trim().toLowerCase() === customerMembership.customerName.trim().toLowerCase() ||
      customerName.toLowerCase().includes('andy') ||
      customerMembership.customerName.toLowerCase().includes(customerName.trim().toLowerCase()) ||
      paymentMethod === 'Membership'
    )
  );

  const membershipAvail = hasCustomerMembership
    ? (selectedService === 'VIP Room'
        ? customerMembership.vipHoursRemaining
        : customerMembership.normalHoursRemaining)
    : 0;

  const membershipHoursCovered = Math.min(membershipAvail, durationHours);
  const payableHours = durationHours - membershipHoursCovered;
  const totalCost = payableHours * rate;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedSystemId) {
      setErrorMsg('Please select an available gaming station.');
      return;
    }

    const res = startWalkInSession({
      systemId: selectedSystemId,
      customerName,
      customerPhone,
      durationHours,
      paymentMethod: membershipHoursCovered > 0 ? 'Membership' : paymentMethod,
      employeeName: 'Counter Staff (Vikram)',
      useMembership: hasCustomerMembership && membershipHoursCovered > 0
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to launch session.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e1320] border border-cyan-500/40 rounded-3xl shadow-2xl p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto text-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
              Counter Fast-Lane
            </span>
            <h3 className="text-xl font-bold text-white font-['Rajdhani']">
              Quick Walk-in Customer Session
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleStart} className="flex flex-col gap-4 mt-4">
          {/* Service Category */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['PS5', 'Xbox', 'PS4', 'Gaming PC', 'VIP Room', 'VR', 'Pool Table', 'Sim Racing'] as GamingServiceCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedService(cat);
                  const firstAvail = systems.find(s => (s.category === cat || (cat === 'PS5' && s.category === 'PlayStation')) && s.status === 'AVAILABLE');
                  if (firstAvail) setSelectedSystemId(firstAvail.id);
                  else setSelectedSystemId('');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition truncate ${
                  selectedService === cat
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* System selection */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Select Available Station ({availableSystems.length} available)
            </label>
            {availableSystems.length > 0 ? (
              <select
                value={selectedSystemId}
                onChange={(e) => setSelectedSystemId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                required
              >
                {availableSystems.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.specs.slice(0, 45)}...
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl">
                No stations available in {selectedService}. Please select another category.
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Player Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Duration & Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Duration (Hours)
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value={1}>1 Hour</option>
                <option value={2}>2 Hours</option>
                <option value={3}>3 Hours</option>
                <option value={4}>4 Hours</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash (Counter Drawer)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Wallet">Bytes & Brew Prepaid Wallet</option>
              </select>
            </div>
          </div>

          {/* Total & Summary */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Total Due</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-cyan-400 font-mono">₹{totalCost}</span>
                {membershipHoursCovered > 0 && (
                  <span className="text-xs text-emerald-400 font-medium">
                    ({membershipHoursCovered}h auto-applied from {customerMembership.planName})
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Rate: ₹{rate}/hr × {durationHours}h
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={availableSystems.length === 0}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START SESSION NOW</span>
          </button>
        </form>
      </div>
    </div>
  );
};
