import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Users,
  Sparkles,
  Gift,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { PromotionCode } from '../../types';
import { INITIAL_PROMOTIONS } from '../../data/adminInitialData';

export const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionCode[]>(INITIAL_PROMOTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Promo Form
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [newDiscountValue, setNewDiscountValue] = useState(20);
  const [newMinSpend, setNewMinSpend] = useState(300);
  const [newMaxUses, setNewMaxUses] = useState(200);
  const [newValidUntil, setNewValidUntil] = useState('2026-12-31');
  const [newDescription, setNewDescription] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = (id: string) => {
    setPromotions(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
          triggerToast(`Promo code ${p.code} is now ${nextStatus}.`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleAddPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    const newPromo: PromotionCode = {
      id: `promo-${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      discountType: newDiscountType,
      discountValue: newDiscountValue,
      minSpend: newMinSpend,
      maxUses: newMaxUses,
      currentUses: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: newValidUntil,
      status: 'ACTIVE',
      description: newDescription,
      applicableServices: ['Gaming PC', 'PlayStation', 'Xbox', 'Sim Racing']
    };

    setPromotions([newPromo, ...promotions]);
    setShowAddModal(false);
    triggerToast(`Promo coupon code ${newPromo.code} created and live!`);
    setNewCode('');
    setNewDescription('');
  };

  const filteredPromos = promotions.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Customer Retention & Growth
            </span>
            <span className="text-xs text-white/50 font-mono">
              {promotions.filter(p => p.status === 'ACTIVE').length} Active Coupons
            </span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight">
            Promotions, Discount Coupons & Referral Rewards
          </h2>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Configure flash coupons, percentage discounts, minimum ticket spends, and friend referral bonuses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Promo Code</span>
        </button>
      </div>

      {/* Referral Program Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-black/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-wider">
              Gamers Referral Engine
            </h4>
            <p className="text-[11px] text-white/60">
              Active Rule: Referrer receives <strong className="text-purple-300">₹100 Wallet Credit</strong> and newly referred gamer gets <strong className="text-purple-300">₹50 off</strong> their 1st session.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-white/60">
          <span>Total Referral Redemptions: <strong className="text-white">248</strong></span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search promo code or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 outline-none"
          />
        </div>

        <span className="text-xs text-white/40 font-mono">
          Showing {filteredPromos.length} codes
        </span>
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromos.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
              p.status === 'ACTIVE'
                ? 'bg-white/[0.03] border-white/10 hover:border-amber-400/30'
                : 'bg-white/[0.01] border-white/5 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white font-mono tracking-wider px-2.5 py-1 rounded-xl bg-black/60 border border-white/15">
                    {p.code}
                  </span>
                  <button
                    onClick={() => handleCopy(p.code)}
                    className="p-1 rounded-lg text-white/40 hover:text-white transition cursor-pointer"
                    title="Copy code"
                  >
                    {copiedCode === p.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    p.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm font-black text-amber-400 my-1">
                <span>
                  {p.discountType === 'PERCENT' ? `${p.discountValue}% OFF` : `Flat ₹${p.discountValue} OFF`}
                </span>
                <span className="text-xs text-white/50 font-normal font-mono">
                  (Min spend ₹{p.minSpend})
                </span>
              </div>

              <p className="text-xs text-white/70 my-2 leading-relaxed font-light">
                {p.description}
              </p>

              <div className="py-2.5 border-y border-white/5 my-2 flex flex-col gap-1 text-[11px] font-mono">
                <div className="flex items-center justify-between text-white/50">
                  <span>Usage Redemptions:</span>
                  <span className="text-white font-bold">
                    {p.currentUses} / {p.maxUses} used
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden mt-1">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (p.currentUses / p.maxUses) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-white/40 text-[10px] mt-1">
                  <span>Valid Until: {p.validUntil}</span>
                  <span>Applicable: All Platforms</span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(p.id)}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  p.status === 'ACTIVE'
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {p.status === 'ACTIVE' ? 'Disable Code' : 'Activate Code'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD PROMO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-black uppercase text-white">Create Promo Coupon</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPromotion} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-white/60 block mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LANFEST2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Discount Type</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="PERCENT">Percentage (% off)</option>
                    <option value="FLAT">Flat (₹ off)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">
                    Value ({newDiscountType === 'PERCENT' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newMinSpend}
                    onChange={(e) => setNewMinSpend(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Valid Until</label>
                <input
                  type="date"
                  value={newValidUntil}
                  onChange={(e) => setNewValidUntil(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Description / Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Valid on all PC and Console rigs on weekends."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
