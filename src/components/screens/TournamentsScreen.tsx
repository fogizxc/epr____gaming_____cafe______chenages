import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { Tournament } from '../../types';
import { Trophy, Calendar, MapPin, Users, ExternalLink, Shield, Flame, CheckCircle2 } from 'lucide-react';

export const TournamentsScreen: React.FC = () => {
  const { tournaments } = useCafe();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PC' | 'MOBILE' | 'CONSOLE'>('ALL');

  const filteredTournaments = tournaments.filter((t) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PC') return t.platform.toUpperCase().includes('PC');
    if (selectedFilter === 'MOBILE') return t.platform.toUpperCase().includes('MOBILE');
    if (selectedFilter === 'CONSOLE') return t.platform.toUpperCase().includes('PS5') || t.platform.toUpperCase().includes('XBOX');
    return true;
  });

  const totalPrizePool = tournaments.reduce((acc, t) => acc + (t.prizePool.first + t.prizePool.second), 0);

  return (
    <div id="screen-tournaments" className="w-full flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Competitions & Esports Arena
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Competitive Esports Tournaments</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Register your squad for official Bytes & Brew LAN stages, live broadcasted tournaments, and community cash cups.
          </p>
        </div>

        {/* Live Prize Pool Badge */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-md">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-white/40 block font-mono">
              Total Active Prize Pool
            </span>
            <span className="text-2xl font-black text-white font-mono">
              ₹{totalPrizePool.toLocaleString()}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
            LAN Finals Live
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['ALL', 'PC', 'MOBILE', 'CONSOLE'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition whitespace-nowrap cursor-pointer border ${
              selectedFilter === filter
                ? 'bg-white text-black border-white shadow-sm'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {filter === 'ALL' ? 'All Competitions' : `${filter} Championships`}
          </button>
        ))}
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((t) => (
          <div
            key={t.id}
            id={`tournament-card-${t.id}`}
            className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-white/25 flex flex-col justify-between transition-all duration-300 group backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.02)]"
          >
            <div>
              {/* Category & Status Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                  {t.platform} • {t.game}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${
                    t.status === 'REGISTRATION OPEN'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-white transition">
                {t.title}
              </h2>

              {/* Tournament Schedule & Details */}
              <div className="mt-4 space-y-2 text-xs text-white/70 font-light">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <span>{t.date} • {t.startTime} - {t.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-white/40" />
                  <span>{t.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-white/40" />
                  <span>Slots: <strong>{t.registeredTeamsCount} / {t.maxTeams} Teams</strong> (4 Players / Squad)</span>
                </div>

                {/* Prize Breakdown Banner */}
                <div className="mt-3 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">
                    Cash Prize Pool Distribution
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-amber-400">1st: ₹{t.prizePool.first.toLocaleString()}</span>
                    <span className="text-slate-300">2nd: ₹{t.prizePool.second.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Entry Fee & Google Form Link */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
                  Squad Entry Fee:
                </span>
                <span className="text-lg font-black text-white font-mono">
                  ₹{t.entryFeePerTeam.toLocaleString()}
                </span>
              </div>

              {/* Official External Link to Register via Google Form */}
              <a
                href={t.googleFormUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] transform active:scale-98"
              >
                <span>Register via Google Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Esports Arena Rules & Hardware Standards */}
      <div className="mt-4 p-6 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-2.5 mb-3">
          <Shield className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Official Bytes & Brew Esports Tournament Rules & Hardware
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-white/60 font-light leading-relaxed">
          <div>
            <strong className="text-white block mb-1 uppercase text-[11px]">Fair Play & Anti-Cheat</strong>
            All PC systems run kernel-level tournament anti-cheat with live referee observation. No unauthorized peripherals or external storage devices allowed.
          </div>
          <div>
            <strong className="text-white block mb-1 uppercase text-[11px]">Arena Hardware Provided</strong>
            Every player is equipped with 240Hz 0.5ms OLED esports displays, 1Gbps isolated low-ping LAN line, and noise-cancelling tournament headsets.
          </div>
          <div>
            <strong className="text-white block mb-1 uppercase text-[11px]">Team Check-in Protocol</strong>
            Squad captains must report to Bytes & Brew Counter Desk 45 minutes prior to match schedule with team registration ticket confirmation.
          </div>
        </div>
      </div>
    </div>
  );
};
