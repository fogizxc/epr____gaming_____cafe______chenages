import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { Crown, Sparkles, CheckCircle2, Shield, Gift, ArrowRight } from 'lucide-react';
import { GamingServiceCategory } from '../../types';

interface MembershipScreenProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
}

export const MembershipScreen: React.FC<MembershipScreenProps> = ({ onOpenBooking }) => {
  const {
    customerMembership,
    purchaseMembership,
    loyaltyPoints,
    redeemLoyaltyPoints
  } = useCafe();

  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const handleRedeem = (pts: number) => {
    const res = redeemLoyaltyPoints(pts);
    if (res.success) {
      setRedeemSuccess(`Successfully redeemed ${pts} PTS for ₹${res.discountVal} Café credit!`);
      setTimeout(() => setRedeemSuccess(null), 3000);
    }
  };

  return (
    <div id="screen-membership" className="w-full flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            VIP Privileges & Passes
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" />
            <span>Bytes & Brew VIP Membership & Rewards</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Track your prepaid hours, VIP lounge allocations, loyalty points, and active tier benefits.
          </p>
        </div>

        <span className="text-xs uppercase tracking-widest text-white/60 font-bold px-4 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md self-start md:self-end">
          Default Plan: ₹3,999 / Quarter
        </span>
      </div>

      {/* Main Membership Tracker Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Standard Gaming Hours Tracker */}
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.02)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Standard Gaming Allocation
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                PC / PS5 / Xbox
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white font-mono">
                {customerMembership.normalHoursRemaining}
              </span>
              <span className="text-sm text-white/40 uppercase tracking-wider font-bold">
                / {customerMembership.normalHoursAllocated} Hours Left
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: `${(customerMembership.normalHoursRemaining / customerMembership.normalHoursAllocated) * 100}%`
                }}
              />
            </div>

            <p className="text-xs text-white/50 mt-3 font-light">
              Used: {customerMembership.normalHoursUsed} Hours • Valid until {customerMembership.expiryDate}
            </p>
          </div>

          <button
            onClick={() => onOpenBooking('Gaming PC')}
            className="mt-6 w-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition cursor-pointer active:scale-98"
          >
            Use Hours on Station
          </button>
        </div>

        {/* Card 2: VIP Suite Gaming Hours Tracker */}
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.02)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                VIP Luxury Suite Allocation
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                VIP Suite Only
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white font-mono">
                {customerMembership.vipHoursRemaining}
              </span>
              <span className="text-sm text-white/40 uppercase tracking-wider font-bold">
                / {customerMembership.vipHoursAllocated} Hours Left
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-red-600"
                style={{
                  width: `${(customerMembership.vipHoursRemaining / customerMembership.vipHoursAllocated) * 100}%`
                }}
              />
            </div>

            <p className="text-xs text-white/50 mt-3 font-light">
              Dedicated 85" Neo QLED 8K & Dual RTX 4090 Rigs
            </p>
          </div>

          <button
            onClick={() => onOpenBooking('VIP Room')}
            className="mt-6 w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition cursor-pointer active:scale-98"
          >
            Book VIP Room
          </button>
        </div>

        {/* Card 3: Membership Plan Details & Renewal */}
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.02)]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">
              Active Subscription
            </span>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
              {customerMembership.planName}
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Original Price Paid: <strong className="font-mono text-white">₹{customerMembership.pricePaid}</strong>
            </p>

            <div className="mt-4 text-xs text-white/70 space-y-2 font-light">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>15% Flat Discount on F&B Menu</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Free Entry into Monthly Community Tournaments</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Priority Queue & Zero Waitlist</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => purchaseMembership('plan-premium')}
            className="mt-6 w-full bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-98"
          >
            Renew / Top Up (₹3,999)
          </button>
        </div>
      </div>

      {/* Rewards Club & Loyalty Points Redemptions */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                Bytes & Brew Rewards Club
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Tier: Gold Member
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono">
                {loyaltyPoints} PTS
              </span>
              <span className="text-xs text-white/40">Loyalty Balance</span>
            </div>

            <p className="text-xs text-white/50 mt-1 font-light">
              Earn 10 points for every ₹100 spent. Redeem points for instant free gaming hours or café discounts!
            </p>
          </div>

          {/* Redemption Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Redeem Rewards:
            </span>
            <div className="flex items-center gap-3">
              <button
                disabled={loyaltyPoints < 100}
                onClick={() => handleRedeem(100)}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/15 disabled:opacity-30 border border-white/10 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95"
              >
                100 Pts (₹10 Off)
              </button>
              <button
                disabled={loyaltyPoints < 300}
                onClick={() => handleRedeem(300)}
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/15 text-white text-xs font-bold rounded-xl transition cursor-pointer active:scale-95"
              >
                300 Pts (₹30 Off)
              </button>
            </div>
            {redeemSuccess && (
              <span className="text-xs text-emerald-400 font-bold mt-1 block animate-fadeIn">
                ✓ {redeemSuccess}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
