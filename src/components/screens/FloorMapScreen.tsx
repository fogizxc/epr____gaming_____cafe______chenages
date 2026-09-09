import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { GamingSystem, GamingServiceCategory } from '../../types';
import { Tv, Monitor, Cpu, Activity, Wifi, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FloorMapScreenProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
}

export const FloorMapScreen: React.FC<FloorMapScreenProps> = ({ onOpenBooking }) => {
  const { systems, setSelectedStationForBooking } = useCafe();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredSystems = systems.filter((s) => {
    if (selectedCategory === 'ALL') return true;
    return s.category === selectedCategory;
  });

  const availableCount = systems.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div id="screen-floormap" className="w-full flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Real-Time Telemetry & Hardware Map
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Tv className="w-8 h-8 text-white/80" />
            <span>Arena Floor Map & Stations</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Live occupancy map, ping latency sensors, GPU thermals, and instant hardware station reservations.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-white/40 block font-mono">
              Live Arena Capacity
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {availableCount} / {systems.length} Free
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'PS5', 'Xbox', 'PS4', 'Gaming PC', 'VIP Room', 'VR', 'Sim Racing', 'Pool Table'].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider font-bold transition whitespace-nowrap cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSystems.map((s) => (
          <div
            key={s.id}
            id={`system-node-${s.id}`}
            className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-white/25 flex flex-col justify-between transition-all duration-200 group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white/80">{s.id}</span>
                <span
                  className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                    s.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : s.status === 'IN_USE'
                      ? 'bg-red-600/20 text-red-300 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {s.status === 'IN_USE' ? 'Busy' : s.status}
                </span>
              </div>

              <h3 className="text-base font-black text-white uppercase tracking-tight mt-2">
                {s.name}
              </h3>
              <span className="text-xs text-white/50">{s.category}</span>

              {/* Hardware specs */}
              <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 text-xs text-white/60 font-light">
                <p className="line-clamp-2">{s.specs}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-white/70">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    {s.ping}ms
                  </span>
                  <span className="flex items-center gap-1 text-white/70">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    {s.temp}°C
                  </span>
                  <span className="text-white font-bold">₹{s.hourlyRate}/hr</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              {s.status === 'AVAILABLE' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStationForBooking(s);
                    onOpenBooking(s.category);
                  }}
                  className="w-full bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                >
                  <span>Book Station</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-white/5 text-white/30 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl border border-white/5 cursor-not-allowed text-center"
                >
                  Busy (In Session)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
