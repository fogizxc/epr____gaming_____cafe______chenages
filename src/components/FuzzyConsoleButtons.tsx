import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { GamingServiceCategory } from '../types';
import { Monitor, Gamepad2, Gauge, Glasses, Volume2, VolumeX, ArrowUpRight, Radio, Sparkles } from 'lucide-react';

interface FuzzyConsoleButtonsProps {
  onSelectConsole: (category: GamingServiceCategory) => void;
}

interface CategoryCard {
  category: GamingServiceCategory;
  title: string;
  eyebrow: string;
  description: string;
  specs: string;
  videoUrl: string;
  fallbackPoster: string;
  accent: string;
  icon: React.ReactNode;
}

const FEATURED_CATEGORIES: CategoryCard[] = [
  {
    category: 'PS5',
    title: 'PlayStation 5',
    eyebrow: 'CONSOLE / 4K 120HZ',
    description: 'DualSense gaming, cinematic exclusives and competitive couch play.',
    specs: 'Spider-Man 2 • FC 26 • Tekken 8',
    videoUrl: '/videos/ps5.mp4',
    fallbackPoster: '/videos/ps5_thumb.jpg',
    accent: 'red',
    icon: <Gamepad2 className="h-5 w-5" />
  },
  {
    category: 'Xbox',
    title: 'Xbox Series X',
    eyebrow: 'CONSOLE / GAME PASS',
    description: 'Fast loading, HDR gaming and a huge multiplayer library.',
    specs: 'Forza • Halo • EA FC',
    videoUrl: '/videos/xbox.mp4',
    fallbackPoster: '/videos/xbox_thumb.jpg',
    accent: 'emerald',
    icon: <Gamepad2 className="h-5 w-5" />
  },
  {
    category: 'Gaming PC',
    title: 'Battle Rigs',
    eyebrow: 'PC / ESPORTS',
    description: 'High-refresh competitive rigs built for serious sessions.',
    specs: 'Valorant • CS2 • GTA V • Warzone',
    videoUrl: '/videos/pc_rig.mp4',
    fallbackPoster: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg',
    accent: 'cyan',
    icon: <Monitor className="h-5 w-5" />
  },
  {
    category: 'VR',
    title: 'VR Arena',
    eyebrow: 'IMMERSIVE / 6DOF',
    description: 'Step inside the game with room-scale virtual reality.',
    specs: 'Beat Saber • Alyx • Motion Arena',
    videoUrl: '/videos/vr.mp4',
    fallbackPoster: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/library_hero.jpg',
    accent: 'violet',
    icon: <Glasses className="h-5 w-5" />
  },
  {
    category: 'Sim Racing',
    title: 'Sim Racing',
    eyebrow: 'DIRECT DRIVE / TRIPLE SCREEN',
    description: 'Get behind the wheel with force feedback and race-ready hardware.',
    specs: 'F1 • Assetto Corsa • iRacing',
    videoUrl: '/videos/sim_racing.mp4',
    fallbackPoster: '/videos/sim_racing_thumb.jpg',
    accent: 'orange',
    icon: <Gauge className="h-5 w-5" />
  }
];

const accentStyles: Record<string, { text: string; border: string; glow: string }> = {
  red: { text: 'text-red-400', border: 'group-hover:border-red-500/50', glow: 'group-hover:shadow-red-950/40' },
  emerald: { text: 'text-emerald-400', border: 'group-hover:border-emerald-500/50', glow: 'group-hover:shadow-emerald-950/30' },
  cyan: { text: 'text-cyan-400', border: 'group-hover:border-cyan-500/50', glow: 'group-hover:shadow-cyan-950/30' },
  violet: { text: 'text-violet-400', border: 'group-hover:border-violet-500/50', glow: 'group-hover:shadow-violet-950/30' },
  orange: { text: 'text-orange-400', border: 'group-hover:border-orange-500/50', glow: 'group-hover:shadow-orange-950/30' }
};

export const FuzzyConsoleButtons: React.FC<FuzzyConsoleButtonsProps> = ({ onSelectConsole }) => {
  const { getRateForService, systems } = useCafe();
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURED_CATEGORIES.map((item) => [item.category, true]))
  );
  const [activeCategory, setActiveCategory] = useState<GamingServiceCategory | null>(null);

  const getAvailableCount = (category: GamingServiceCategory) =>
    systems.filter(
      (system) =>
        (system.category === category || (category === 'PS5' && system.category === 'PlayStation')) &&
        system.status === 'AVAILABLE'
    ).length;

  const toggleMute = (event: React.MouseEvent, category: GamingServiceCategory) => {
    event.stopPropagation();
    setMutedStates((current) => ({ ...current, [category]: !current[category] }));
  };

  const selectCategory = (category: GamingServiceCategory) => {
    setActiveCategory(category);
    onSelectConsole(category);
  };

  return (
    <section id="console-fuzzy-buttons-section" className="mt-14 w-full px-1 sm:mt-20">
      <div className="mb-8 flex flex-col gap-5 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.42em] text-red-500">
            <Sparkles className="h-3.5 w-3.5" />
            Choose your arena
          </div>
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
            Pick your <span className="text-red-500">battlefield.</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
            Five ways to play. Every station has its own live visual feed — choose a setup and jump straight into its game library.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live station feeds
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12 xl:gap-6">
        {FEATURED_CATEGORIES.map((item, index) => {
          const style = accentStyles[item.accent];
          const availableCount = getAvailableCount(item.category);
          const isMuted = mutedStates[item.category];
          const featured = index === 0 || index === 2;

          return (
            <button
              key={item.category}
              type="button"
              onClick={() => selectCategory(item.category)}
              onMouseEnter={() => setActiveCategory(item.category)}
              onMouseLeave={() => setActiveCategory(null)}
              className={`group relative min-h-[390px] overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] text-left shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${style.border} ${style.glow} ${
                featured ? 'xl:col-span-4' : 'xl:col-span-2'
              }`}
            >
              <div className="absolute inset-0 bg-black">
                <video
                  src={item.videoUrl}
                  poster={item.fallbackPoster}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-105 group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/45 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
              </div>

              <div className="relative z-10 flex h-full min-h-[390px] flex-col justify-between p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
                    <Radio className="h-3 w-3 text-red-500" />
                    Live feed
                  </span>
                  <span
                    onClick={(event) => toggleMute(event, item.category)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/70 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
                    role="button"
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className={`h-4 w-4 ${style.text}`} />}
                  </span>
                </div>

                <div className="max-w-[340px]">
                  <div className={`mb-3 text-[9px] font-black uppercase tracking-[0.3em] ${style.text}`}>
                    {item.eyebrow}
                  </div>
                  <div className="mb-3 flex items-center gap-3 text-white">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/50 backdrop-blur-md">
                      {item.icon}
                    </span>
                    <h3 className={`${featured ? 'text-2xl sm:text-3xl' : 'text-xl'} font-black uppercase tracking-tight`}>
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs leading-6 text-white/60 sm:text-sm">{item.description}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/35">{item.specs}</p>

                  <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                      <span className="block text-[8px] font-bold uppercase tracking-[0.25em] text-white/35">From</span>
                      <span className="font-mono text-lg font-black text-white">
                        ₹{getRateForService(item.category)}<span className="text-xs font-normal text-white/35">/hr</span>
                      </span>
                    </div>
                    <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
                      {availableCount > 0 ? `${availableCount} ready` : 'Check availability'}
                      <ArrowUpRight className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${style.text}`} />
                    </span>
                  </div>
                </div>
              </div>

              {activeCategory === item.category && (
                <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/20" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          Select a station to browse its complete game catalog
        </p>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Video previews play automatically
        </div>
      </div>
    </section>
  );
};
