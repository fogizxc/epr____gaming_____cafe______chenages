import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Gamepad2,
  Clock,
  DollarSign,
  Tv,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  Coffee,
  CreditCard,
  Wallet
} from 'lucide-react';
import {
  GamingSystem,
  GamingServiceCategory,
  EmployeeCustomerRecord,
  FnbProduct
} from '../../types';

interface EmployeeWalkInModalProps {
  systems: GamingSystem[];
  onClose: () => void;
  onSuccess: (session: any) => void;
}

export const EmployeeWalkInModal: React.FC<EmployeeWalkInModalProps> = ({
  systems,
  onClose,
  onSuccess
}) => {
  // Step State
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<EmployeeCustomerRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<EmployeeCustomerRecord | null>(null);

  // New Customer Form (if not selected from search)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gamerTag, setGamerTag] = useState('');

  // Service & Station
  const [selectedService, setSelectedService] = useState<GamingServiceCategory>('PC_GAMING');
  const [selectedSystemId, setSelectedSystemId] = useState('');

  // Duration & Pricing
  const [durationHours, setDurationHours] = useState(1);
  const [useMembership, setUseMembership] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership'>('Cash');
  const [gameTitle, setGameTitle] = useState('Apex Legends / Counter-Strike 2');

  // Fast Snack / Drink selection
  const [fnbAddons, setFnbAddons] = useState<{ id: string; name: string; price: number }[]>([
    { id: 'fnb-cold-brew', name: 'Cold Brew Nitro (250ml)', price: 120 },
    { id: 'fnb-red-bull', name: 'Red Bull Energy Can', price: 160 },
    { id: 'fnb-nachos', name: 'Artisan Loaded Nachos', price: 180 },
    { id: 'fnb-espresso', name: 'Double Espresso Shot', price: 90 }
  ]);
  const [selectedFnbIds, setSelectedFnbIds] = useState<string[]>([]);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Search customers via backend
  useEffect(() => {
    if (!customerSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/employee/customers?q=${encodeURIComponent(customerSearch.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        console.error('Customer search error:', err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Available systems for selected category
  const availableSystems = systems.filter(
    s => s.category === selectedService && s.status === 'AVAILABLE'
  );

  // Auto-select first available system when category changes
  useEffect(() => {
    if (availableSystems.length > 0) {
      setSelectedSystemId(availableSystems[0].id);
    } else {
      setSelectedSystemId('');
    }
  }, [selectedService, systems]);

  const selectCustomer = (cust: EmployeeCustomerRecord) => {
    setSelectedCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setGamerTag(cust.gamerTag || '');
    setSearchResults([]);
    setCustomerSearch('');
    if (cust.membershipTier && !cust.membershipTier.includes('Casual')) {
      setUseMembership(true);
    }
  };

  // Base Hourly Rates
  const getRate = (cat: GamingServiceCategory) => {
    switch (cat) {
      case 'PC_GAMING': return 250;
      case 'PS5_CONSOLE': return 350;
      case 'XBOX_CONSOLE': return 300;
      case 'SIM_RACING': return 500;
      case 'VR_RIGS': return 600;
      default: return 250;
    }
  };

  const hourlyRate = getRate(selectedService);
  const rawGamingCharge = hourlyRate * durationHours;
  const discountMultiplier = useMembership ? 0.8 : 1.0;
  const gamingCharge = Math.round(rawGamingCharge * discountMultiplier);

  const fnbTotal = selectedFnbIds.reduce((sum, id) => {
    const item = fnbAddons.find(a => a.id === id);
    return sum + (item ? item.price : 0);
  }, 0);

  const totalPayable = gamingCharge + fnbTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Customer Name and Phone Number are required.');
      return;
    }
    if (!selectedSystemId) {
      setErrorMsg('Please select an available station on the floor.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fnbItemsPayload = selectedFnbIds.map(id => {
        const item = fnbAddons.find(a => a.id === id);
        return {
          productId: id,
          productName: item ? item.name : id,
          price: item ? item.price : 0,
          quantity: 1
        };
      });

      const res = await fetch('/api/employee/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: selectedSystemId,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          durationHours,
          paymentMethod,
          useMembership,
          gameTitle,
          fnbItems: fnbItemsPayload
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data.session);
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to start walk-in session.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error starting walk-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                New Walk-In Session Wizard
              </h2>
              <p className="text-xs text-white/50 font-light">
                Instant counter enrollment, station dispatch & billing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Customer Search or Enter Details */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                1. Customer Identification
              </span>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Quick Customer Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search registered gamers by phone, name or gamer tag..."
                className="w-full bg-black/50 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-red-500 focus:outline-none"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141414] border border-white/20 rounded-xl shadow-2xl p-2 z-20 max-h-48 overflow-y-auto space-y-1">
                  {searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => selectCustomer(cust)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/15 transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{cust.name}</span>{' '}
                        <span className="text-white/50 font-mono">({cust.phone})</span>
                        {cust.gamerTag && (
                          <span className="text-cyan-400 font-mono ml-2">@{cust.gamerTag}</span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                        {cust.membershipTier || 'Casual'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Name & Phone Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                  Phone Number (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Service & Station Selection */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">
              2. Gaming Rig & Service Category
            </span>

            {/* Category Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'PC_GAMING' as GamingServiceCategory, label: 'PC Arena', rate: 250 },
                { id: 'PS5_CONSOLE' as GamingServiceCategory, label: 'PS5 Pod', rate: 350 },
                { id: 'XBOX_CONSOLE' as GamingServiceCategory, label: 'Xbox X', rate: 300 },
                { id: 'SIM_RACING' as GamingServiceCategory, label: 'Sim Racing', rate: 500 },
                { id: 'VR_RIGS' as GamingServiceCategory, label: 'VR Rig', rate: 600 }
              ].map((cat) => {
                const count = systems.filter(s => s.category === cat.id && s.status === 'AVAILABLE').length;
                const isSelected = selectedService === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedService(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-red-600/20 border-red-500 text-white shadow-sm'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs">{cat.label}</div>
                    <div className="text-[10px] text-white/50 font-mono">₹{cat.rate}/hr</div>
                    <div className="text-[9px] font-bold mt-1 text-emerald-400">
                      {count} available
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Station Picker */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                Select Available Station *
              </label>
              {availableSystems.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                  All stations in this category are currently occupied. Select another category or add customer to Waitlist.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableSystems.map((sys) => (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => setSelectedSystemId(sys.id)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        selectedSystemId === sys.id
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{sys.name}</div>
                      <div className="text-[9px] text-white/40 truncate">{sys.specs.gpu || sys.specs.display}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Duration, Addons & Payment */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">
              3. Duration, Snack Add-ons & Pricing
            </span>

            {/* Duration Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {[0.5, 1, 2, 3, 4].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setDurationHours(hrs)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                    durationHours === hrs
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {hrs === 0.5 ? '30 Mins' : `${hrs} Hr${hrs > 1 ? 's' : ''}`}
                </button>
              ))}
            </div>

            {/* Quick Snacks / Drinks Addons */}
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
                Quick Counter Snack / Drink Combo:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {fnbAddons.map((item) => {
                  const isChecked = selectedFnbIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedFnbIds(prev =>
                          isChecked ? prev.filter(i => i !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                          : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Coffee className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold shrink-0 ml-1">₹{item.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
                Payment Collection Method:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['Cash', 'UPI', 'Card', 'Wallet'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider text-center transition cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Summary & Final Action */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-white/50">
                Gaming: ₹{gamingCharge} ({durationHours}hr) {fnbTotal > 0 && `+ F&B: ₹${fnbTotal}`}
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
                Total Payable: <span className="text-emerald-400">₹{totalPayable}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedSystemId}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 rounded-xl transition cursor-pointer shadow-xl shadow-red-600/30 active:scale-95"
            >
              {isSubmitting ? 'Starting Session...' : 'Confirm & Seat Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
