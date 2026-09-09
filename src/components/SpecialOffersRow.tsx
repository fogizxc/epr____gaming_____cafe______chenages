import React from 'react';
import { useCafe } from '../context/CafeContext';
import { Sparkles, Trophy, Flame } from 'lucide-react';

interface SpecialOffersRowProps {
  onQuickBook: (gameTitle: string) => void;
}

export const SpecialOffersRow: React.FC<SpecialOffersRowProps> = ({ onQuickBook }) => {
  const offers = [
    {
      id: 'offer-gta',
      title: 'Grand Theft Auto VI',
      badge: 'Fighting, Action',
      platform: 'PS5 & RTX 4090',
      price: '₹249/hr',
      banner: 'https://i.ytimg.com/vi/QdBZY2fkU-0/maxresdefault.jpg',
      accent: 'from-pink-900/60 to-purple-950/60'
    },
    {
      id: 'offer-nba',
      title: 'NBA 2K25 Allen Iverson',
      badge: 'Sports Simulation',
      platform: 'PS5 DualSense',
      price: '₹199/hr',
      banner: 'https://shared.steamstatic.com/store_item_assets/steam/apps/2878980/library_hero.jpg',
      accent: 'from-amber-900/60 to-red-950/60'
    },
    {
      id: 'offer-cod',
      title: 'Call of Duty: MW II',
      badge: 'Tactical FPS',
      platform: '240Hz OLED Rig',
      price: '₹249/hr',
      banner: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1938090/library_hero.jpg',
      accent: 'from-emerald-950/60 to-black'
    },
    {
      id: 'offer-tekken',
      title: 'Tekken 8 Launch Edition',
      badge: 'Tournament Ranked',
      platform: 'PS5 Arcade Stick',
      price: '₹199/hr',
      banner: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1778820/library_hero.jpg',
      accent: 'from-red-950/60 to-slate-950'
    }
  ];

  return (
    <div id="special-offers-grid" className="w-full flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600">
            Curated Experiences
          </span>
          <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
            Trending in Nexus Lounge
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
          Instant Station Boot
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => onQuickBook(offer.title)}
            className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/25 p-5 min-h-[220px] flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-[0_0_15px_rgba(255,255,255,0.02)] backdrop-blur-md"
          >
            {/* Background art */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-30 group-hover:opacity-55 transition duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${offer.banner})` }}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${offer.accent} via-black/70 to-transparent z-1`} />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-black/60 text-white/80 border border-white/15 backdrop-blur-md">
                {offer.badge}
              </span>
              <span className="text-xs font-mono font-black text-white bg-black/70 px-2 py-0.5 rounded-md border border-white/10">
                {offer.price}
              </span>
            </div>

            {/* Title & Action */}
            <div className="relative z-10 mt-auto">
              <h4 className="text-sm font-black text-white uppercase tracking-tight">
                {offer.title}
              </h4>
              <p className="text-[11px] text-white/50 mt-0.5 font-light">
                {offer.platform}
              </p>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest font-bold text-white/40 group-hover:text-white transition">
                  Quick Reserve
                </span>
                <span className="text-xs font-bold text-red-600 group-hover:translate-x-1 transition">
                  →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
