import React from 'react';
import { useCafe } from '../../context/CafeContext';
import { SpecialOffersRow } from '../SpecialOffersRow';
import { Flame, Sparkles, Zap, Shield, Gift } from 'lucide-react';
import { GamingServiceCategory } from '../../types';

interface OffersScreenProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
}

export const OffersScreen: React.FC<OffersScreenProps> = ({ onOpenBooking }) => {
  return (
    <div id="screen-offers" className="w-full flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Exclusive Packages & Special Bundles
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Flame className="w-8 h-8 text-red-600" />
            <span>Curated Experiences & Offers</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Trending titles in Nexus Lounge with instant station boot, dedicated 240Hz rigs, and launch edition perks.
          </p>
        </div>

        <span className="text-xs uppercase tracking-widest text-red-400 font-bold px-4 py-2 rounded-full border border-red-500/30 bg-red-600/10 backdrop-blur-md self-start md:self-end">
          🔥 Weekend Prime Active
        </span>
      </div>

      {/* Special Offers Grid */}
      <SpecialOffersRow onQuickBook={() => onOpenBooking('Gaming PC')} />

      {/* Value Passes */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              <span>Midnight Esports Pass</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase">6-Hour All-Nighter</h3>
            <p className="text-xs text-white/50 mt-1 font-light">
              Midnight to 6:00 AM uninterrupted high-speed LAN access with unlimited monster energy drinks.
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">₹699</span>
              <span className="text-xs text-white/40 line-through">₹1,494</span>
            </div>
          </div>
          <button
            onClick={() => onOpenBooking('Gaming PC')}
            className="mt-6 w-full bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
          >
            Claim Midnight Pass
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Gift className="w-4 h-4" />
              <span>Squad LAN Bundle</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase">5x Side-by-Side Rigs</h3>
            <p className="text-xs text-white/50 mt-1 font-light">
              Book an entire squad pod for 4 hours. Includes 5 medium pizzas & cold beverages.
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">₹3,499</span>
              <span className="text-xs text-white/40 line-through">₹4,990</span>
            </div>
          </div>
          <button
            onClick={() => onOpenBooking('Gaming PC')}
            className="mt-6 w-full bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
          >
            Book Squad Pod
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-4 h-4" />
              <span>VIP Suite Cinema Pass</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase">85" Neo QLED 8K Suite</h3>
            <p className="text-xs text-white/50 mt-1 font-light">
              Dual RTX 4090 + PS5 Pro, recliner couch lounge, Dolby Atmos surround sound (up to 6 friends).
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">₹1,999</span>
              <span className="text-xs text-white/40 font-mono">/ 3 Hours</span>
            </div>
          </div>
          <button
            onClick={() => onOpenBooking('VIP Room')}
            className="mt-6 w-full bg-red-600 text-white hover:bg-red-700 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
          >
            Reserve VIP Suite
          </button>
        </div>
      </div>
    </div>
  );
};
