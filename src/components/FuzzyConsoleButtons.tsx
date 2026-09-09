import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { GamingServiceCategory } from '../types';
import {
  Monitor,
  Gamepad2,
  Crown,
  Volume2,
  VolumeX,
  Gauge,
  CircleDot,
  Glasses,
  Tv
} from 'lucide-react';

interface FuzzyConsoleButtonsProps {
  onSelectConsole: (category: GamingServiceCategory) => void;
}

interface ConsoleButtonItem {
  category: GamingServiceCategory;
  title: string;
  badge: string;
  specs: string;
  glowClass: string;
  accentColor: string;
  videoUrl: string;
  fallbackPoster: string;
  typeGroup: 'CONSOLE' | 'RIG' | 'LOUNGE';
}

export const FuzzyConsoleButtons: React.FC<FuzzyConsoleButtonsProps> = ({ onSelectConsole }) => {
  const { getRateForService, systems, openConsoleGames } = useCafe();
  const [activeGroup, setActiveGroup] = useState<'ALL' | 'CONSOLE' | 'RIG' | 'LOUNGE'>('ALL');
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({
    PS5: true,
    Xbox: true,
    PS4: true,
    'Gaming PC': true,
    'VIP Room': true,
    VR: true,
    'Pool Table': true,
    'Sim Racing': true
  });

  // Calculate live availability count
  const getAvailableCount = (cat: GamingServiceCategory) => {
    return systems.filter(s => (s.category === cat || (cat === 'PS5' && s.category === 'PlayStation')) && s.status === 'AVAILABLE').length;
  };

  const consoles: ConsoleButtonItem[] = [
    {
      category: 'PS5',
      title: 'PlayStation 5 Console',
      badge: 'Sony 4K 120Hz',
      specs: 'DualSense Edge, 65" Bravia OLED, Spider-Man 2 & Tekken 8',
      glowClass: 'fuzzy-glow',
      accentColor: '#ef4444',
      videoUrl: '/videos/ps5.mp4',
      fallbackPoster: '/videos/ps5_thumb.jpg',
      typeGroup: 'CONSOLE'
    },
    {
      category: 'Xbox',
      title: 'Xbox Series X Console',
      badge: 'Game Pass Ultimate',
      specs: 'Elite Series 2, 55" 4K HDR, Forza Motorsport & Halo Infinite',
      glowClass: 'fuzzy-glow-green',
      accentColor: '#10b981',
      videoUrl: '/videos/xbox.mp4',
      fallbackPoster: '/videos/xbox_thumb.jpg',
      typeGroup: 'CONSOLE'
    },
    {
      category: 'PS4',
      title: 'PlayStation 4 Pro / Slim',
      badge: '1080p HDR Classics',
      specs: 'DualShock 4, 50" HDR TV, God of War, FIFA 23 & Bloodborne',
      glowClass: 'fuzzy-glow-indigo',
      accentColor: '#6366f1',
      videoUrl: '/videos/ps4.mp4',
      fallbackPoster: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1593500/library_hero.jpg',
      typeGroup: 'CONSOLE'
    },
    {
      category: 'Gaming PC',
      title: 'Gaming PC Battle Rigs',
      badge: 'RTX 4090 24GB',
      specs: 'Core i9 14900K, 240Hz OLED, 1Gbps LAN, Valorant & CS2',
      glowClass: 'fuzzy-glow-blue',
      accentColor: '#3b82f6',
      videoUrl: '/videos/pc_rig.mp4',
      fallbackPoster: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg',
      typeGroup: 'RIG'
    },
    {
      category: 'Sim Racing',
      title: 'Direct Drive Sim Racing',
      badge: 'Fanatec DD 25Nm',
      specs: 'Heusinkveld Pedals, Triple Curved Screens, Assetto Corsa & F1 24',
      glowClass: 'fuzzy-glow-orange',
      accentColor: '#f97316',
      videoUrl: '/videos/sim_racing.mp4',
      fallbackPoster: '/videos/sim_racing_thumb.jpg',
      typeGroup: 'RIG'
    },
    {
      category: 'VR',
      title: 'VR Motion Holodeck',
      badge: 'Quest 3 & Vive Pro 2',
      specs: '6DoF Room-scale 4x4m Padded Arena, Half-Life Alyx & Beat Saber',
      glowClass: 'fuzzy-glow-cyan',
      accentColor: '#06b6d4',
      videoUrl: '/videos/vr.mp4',
      fallbackPoster: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/library_hero.jpg',
      typeGroup: 'RIG'
    },
    {
      category: 'VIP Room',
      title: 'VIP Gaming Lounge Suite',
      badge: 'Ultra Private Suite',
      specs: '85" Neo QLED 8K, Dual Rigs + PS5, Dolby Atmos 7.1.4, Mini Bar',
      glowClass: 'fuzzy-glow-purple',
      accentColor: '#a855f7',
      videoUrl: '/videos/vip_room.mp4',
      fallbackPoster: 'https://i.ytimg.com/vi/QdBZY2fkU-0/maxresdefault.jpg',
      typeGroup: 'LOUNGE'
    },
    {
      category: 'Pool Table',
      title: 'Tournament Pool Table',
      badge: '9ft Championship Slate',
      specs: 'Aramith Pro TV Balls, Predator Carbon Cues, Shadowless LED',
      glowClass: 'fuzzy-glow-amber',
      accentColor: '#eab308',
      videoUrl: '/videos/pool_table.mp4',
      fallbackPoster: '/videos/pool_thumb.jpg',
      typeGroup: 'LOUNGE'
    }
  ];

  const toggleMute = (e: React.MouseEvent, cat: string) => {
    e.stopPropagation();
    setMutedStates(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredConsoles = consoles.filter(c => activeGroup === 'ALL' || c.typeGroup === activeGroup);

  const getCategoryIcon = (category: GamingServiceCategory) => {
    switch (category) {
      case 'PS5':
      case 'PlayStation':
        return <Gamepad2 className="w-4 h-4 text-red-500" />;
      case 'Xbox':
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'PS4':
        return <Tv className="w-4 h-4 text-indigo-400" />;
      case 'Gaming PC':
        return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'Sim Racing':
        return <Gauge className="w-4 h-4 text-orange-400" />;
      case 'VR':
        return <Glasses className="w-4 h-4 text-teal-400" />;
      case 'VIP Room':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'Pool Table':
        return <CircleDot className="w-4 h-4 text-yellow-400" />;
      default:
        return <Monitor className="w-4 h-4 text-white/80" />;
    }
  };

  return (
    <section id="console-fuzzy-buttons-section" className="w-full flex flex-col gap-4 mt-4">
      {/* Section Header with Editorial Kicker and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600">
            Hardware Stations & Rig Access
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">
              Console & Rig Access
            </h2>
            <span className="text-[9px] uppercase tracking-widest bg-white/5 text-white/70 border border-white/10 px-2 py-0.5 rounded-full font-bold">
              8 Rigs Live
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveGroup('ALL')}
            className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition whitespace-nowrap cursor-pointer border ${
              activeGroup === 'ALL'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            All Rigs (8)
          </button>
          <button
            onClick={() => setActiveGroup('CONSOLE')}
            className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition whitespace-nowrap cursor-pointer border ${
              activeGroup === 'CONSOLE'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            Consoles (3)
          </button>
          <button
            onClick={() => setActiveGroup('RIG')}
            className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition whitespace-nowrap cursor-pointer border ${
              activeGroup === 'RIG'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            Esports & Sim (3)
          </button>
          <button
            onClick={() => setActiveGroup('LOUNGE')}
            className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold transition whitespace-nowrap cursor-pointer border ${
              activeGroup === 'LOUNGE'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            VIP & Billiards (2)
          </button>
        </div>
      </div>

      {/* Fuzzy Style Buttons with Embedded Live Video (Responsive 4-column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredConsoles.map((item) => {
          const rate = getRateForService(item.category);
          const availableCount = getAvailableCount(item.category);
          const isMuted = mutedStates[item.category];

          return (
            <div
              key={item.category}
              id={`fuzzy-btn-${item.category.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => openConsoleGames(item.category)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 border border-white/10 hover:border-white/25 bg-white/5 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.02)] min-h-[250px] flex flex-col justify-between p-5"
            >
              {/* LIVE VIDEO PLAYING INSIDE THE BUTTON */}
              <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                <video
                  src={item.videoUrl}
                  poster={item.fallbackPoster}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-60 group-hover:opacity-85"
                />
                {/* Frosted / Editorial gradient layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              </div>

              {/* Top Header of Button: Category Badge & Live Pulse Dot */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white">
                      Live Feed
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/80 backdrop-blur-md">
                    {item.badge}
                  </span>
                </div>

                {/* Sound Toggle on Video */}
                <button
                  onClick={(e) => toggleMute(e, item.category)}
                  className="w-6 h-6 rounded-full bg-black/60 hover:bg-black border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition backdrop-blur-md"
                  title={isMuted ? 'Unmute Live Audio' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-red-500" />}
                </button>
              </div>

              {/* Center / Bottom Info of Button */}
              <div className="relative z-10 mt-auto pt-6">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(item.category)}
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    {item.title}
                  </h3>
                </div>

                <p className="text-[11px] text-white/50 line-clamp-2 font-light">
                  {item.specs}
                </p>

                {/* Pricing & Availability Bar */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block">
                      Hourly Rate
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      ₹{rate}
                      <span className="text-xs font-normal text-white/40">/hr</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full backdrop-blur-md inline-block border ${
                        availableCount > 0
                          ? 'bg-white/10 text-white border-white/20'
                          : 'bg-red-600/20 text-red-400 border-red-600/30'
                      }`}
                    >
                      {availableCount > 0 ? `${availableCount} Available` : 'Occupied'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
