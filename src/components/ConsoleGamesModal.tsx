import React, { useState, useMemo } from 'react';
import { useCafe } from '../context/CafeContext';
import { GamingServiceCategory, GamingSystem } from '../types';
import {
  getGamesForCategory,
  getGamesForStation,
  ConsoleGameItem
} from '../data/consoleGamesData';
import { GameDetailView, GameDetailData } from './GameDetailView';
import {
  X,
  Search,
  Gamepad2,
  Monitor,
  Tv,
  Crown,
  Gauge,
  Glasses,
  CircleDot,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Wifi,
  Activity,
  Flame
} from 'lucide-react';

interface ConsoleGamesModalProps {
  category: GamingServiceCategory;
  initialStationId?: string;
  onClose: () => void;
  onBookStation: (category: GamingServiceCategory, systemId?: string, gameTitle?: string) => void;
}

export const ConsoleGamesModal: React.FC<ConsoleGamesModalProps> = ({
  category,
  initialStationId,
  onClose,
  onBookStation
}) => {
  const {
    systems,
    setSelectedStationForBooking,
    setSelectedGameForBooking,
    getRateForService,
    requireLogin
  } = useCafe();
  const [selectedStationId, setSelectedStationId] = useState<string>(initialStationId || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<ConsoleGameItem | null>(null);

  // Normalize category match
  const isTargetCategory = (sysCat: GamingServiceCategory) => {
    if (sysCat === category) return true;
    if (category === 'PS5' && sysCat === 'PlayStation') return true;
    if (category === 'PlayStation' && sysCat === 'PS5') return true;
    return false;
  };

  // Systems in this category
  const systemsInCategory = useMemo(() => {
    return systems.filter(s => isTargetCategory(s.category));
  }, [systems, category]);

  const activeSystem = useMemo(() => {
    if (selectedStationId === 'ALL') return null;
    return systemsInCategory.find(s => s.id === selectedStationId) || null;
  }, [selectedStationId, systemsInCategory]);

  // Games list
  const categoryGamesData = useMemo(() => {
    return getGamesForCategory(category, systems);
  }, [category, systems]);

  // Distinct genres
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    categoryGamesData.forEach(({ game }) => genres.add(game.category));
    return ['ALL', ...Array.from(genres)];
  }, [categoryGamesData]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return categoryGamesData.filter(({ game, installedStations }) => {
      // Station filter
      if (selectedStationId !== 'ALL') {
        const isInstalledOnSelected = installedStations.some(s => s.id === selectedStationId);
        if (!isInstalledOnSelected) return false;
      }

      // Genre filter
      if (selectedGenre !== 'ALL' && game.category !== selectedGenre) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchCategory = game.category.toLowerCase().includes(q);
        const matchTags = game.tags.some(t => t.toLowerCase().includes(q));
        const matchDesc = game.description.toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchTags && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [categoryGamesData, selectedStationId, selectedGenre, searchQuery]);

  // Console branding & theme
  const getCategoryConfig = (cat: GamingServiceCategory) => {
    switch (cat) {
      case 'PS5':
      case 'PlayStation':
        return {
          title: 'PlayStation 5 Console',
          subtitle: 'Sony Bravia 4K 120Hz OLED • DualSense Edge',
          accent: 'text-red-500',
          badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: <Gamepad2 className="w-5 h-5 text-red-500" />
        };
      case 'Xbox':
        return {
          title: 'Xbox Series X Console',
          subtitle: 'Xbox Game Pass Ultimate • Elite Series 2',
          accent: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          icon: <Gamepad2 className="w-5 h-5 text-emerald-400" />
        };
      case 'PS4':
        return {
          title: 'PlayStation 4 Pro / Slim',
          subtitle: 'DualShock 4 • 50" HDR Gaming Displays',
          accent: 'text-indigo-400',
          badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          icon: <Tv className="w-5 h-5 text-indigo-400" />
        };
      case 'Gaming PC':
        return {
          title: 'Gaming PC Battle Rigs',
          subtitle: 'Intel Core i9 14900K • RTX 4090 24GB • 240Hz OLED',
          accent: 'text-cyan-400',
          badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          icon: <Monitor className="w-5 h-5 text-cyan-400" />
        };
      case 'Sim Racing':
        return {
          title: 'Direct Drive Sim Racing Rigs',
          subtitle: 'Fanatec DD2 25Nm • Triple Curved Displays • Hydraulic Pedals',
          accent: 'text-orange-400',
          badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
          icon: <Gauge className="w-5 h-5 text-orange-400" />
        };
      case 'VR':
        return {
          title: 'VR Motion Holodeck',
          subtitle: 'Meta Quest 3 & Vive Pro 2 • 4x4m Padded 6DoF Play Area',
          accent: 'text-teal-400',
          badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
          icon: <Glasses className="w-5 h-5 text-teal-400" />
        };
      case 'VIP Room':
        return {
          title: 'VIP Gaming Lounge Suite',
          subtitle: 'Private 8K Suite • Dual Liquid Cooled Rigs + PS5 • Dolby Atmos',
          accent: 'text-purple-400',
          badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          icon: <Crown className="w-5 h-5 text-purple-400" />
        };
      case 'Pool Table':
        return {
          title: 'Championship Pool Tables',
          subtitle: '9ft Tournament Slate • Aramith Pro TV Balls • Predator Cues',
          accent: 'text-yellow-400',
          badgeBg: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
          icon: <CircleDot className="w-5 h-5 text-yellow-400" />
        };
      default:
        return {
          title: `${category} Station`,
          subtitle: 'High-Performance Arena Hardware',
          accent: 'text-white',
          badgeBg: 'bg-white/10 text-white border-white/20',
          icon: <Monitor className="w-5 h-5 text-white" />
        };
    }
  };

  const config = getCategoryConfig(category);

  return (
    <div
      id="console-games-modal-overlay"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="console-games-modal-content"
        className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/15 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-2.5 sm:p-7 my-auto max-h-[96vh] flex flex-col text-white backdrop-blur-xl animate-in fade-in zoom-in-95"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-4 sm:right-6 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer z-20"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body: Either Detail View or Catalog Browser */}
        {selectedGameForDetails ? (
          <div className="overflow-y-auto pr-1 flex-1 py-2">
            <GameDetailView
              game={{
                id: selectedGameForDetails.id,
                title: selectedGameForDetails.title,
                tagline: selectedGameForDetails.multiplayerType || '4K Next-Gen Gaming Experience',
                category: selectedGameForDetails.category,
                tags: selectedGameForDetails.tags,
                description: selectedGameForDetails.description,
                price: `₹${getRateForService(category)}/hr`,
                rating: selectedGameForDetails.rating,
                platforms: selectedGameForDetails.platforms,
                bannerUrl: selectedGameForDetails.bannerUrl || selectedGameForDetails.coverUrl,
                coverUrl: selectedGameForDetails.coverUrl,
                multiplayerType: selectedGameForDetails.multiplayerType
              }}
              defaultPlatform={category}
              onBack={() => setSelectedGameForDetails(null)}
              onBookSlot={(game, selectedPlat) => {
                let targetSys = activeSystem;
                if (!targetSys || targetSys.status !== 'AVAILABLE') {
                  targetSys = systems.find(s => s.category === selectedPlat && s.status === 'AVAILABLE') || systemsInCategory[0];
                }
                if (targetSys) {
                  setSelectedStationForBooking(targetSys);
                }
                setSelectedGameForBooking({
                  title: game.title,
                  category: selectedPlat,
                  coverUrl: game.coverUrl
                });
                onBookStation(selectedPlat, targetSys?.id, game.title);
              }}
            />
          </div>
        ) : (
          <>
            {/* Station Tabs Switcher */}
            <div className="pt-1 pb-3 sm:pb-3.5 border-b border-white/10 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none pr-10 sm:pr-14">
          <div className="flex items-center gap-2 flex-nowrap">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap pl-1">
              Select Rig:
            </span>

            {/* All Stations Pill */}
            <button
              onClick={() => setSelectedStationId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap cursor-pointer border ${
                selectedStationId === 'ALL'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              All {category} Rigs ({categoryGamesData.length} Games)
            </button>

            {/* Specific Station Pills */}
            {systemsInCategory.map((s) => {
              const isSelected = selectedStationId === s.id;
              const isAvail = s.status === 'AVAILABLE';
              const installedCount = s.installedGames.length;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStationId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap cursor-pointer border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-sm'
                      : isAvail
                      ? 'bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white'
                      : 'bg-white/[0.02] text-white/40 border-white/5 hover:text-white/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAvail ? 'bg-emerald-400' : s.status === 'ACTIVE' ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                  />
                  <span>{s.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-black/10 text-black' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {installedCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Station Telemetry Card (If a specific rig is selected) */}
        {activeSystem && (
          <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="font-bold text-white uppercase text-sm">
                  {activeSystem.name} • {activeSystem.category}
                </span>
                <p className="text-white/60 text-[11px] font-light mt-0.5 line-clamp-1">
                  {activeSystem.specs}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/70 font-mono text-[11px] shrink-0">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                {activeSystem.ping}ms
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                {activeSystem.temp}°C
              </span>
              <span
                className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                  activeSystem.status === 'AVAILABLE'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {activeSystem.status}
              </span>
            </div>
          </div>
        )}

        {/* Search & Genre Filters Row */}
        <div className="my-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search games on this ${category}...`}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Genre Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition whitespace-nowrap cursor-pointer border ${
                  selectedGenre === genre
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[320px] max-h-[50vh]">
          {filteredGames.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-white/5 rounded-2xl bg-white/[0.02]">
              <Gamepad2 className="w-10 h-10 text-white/20 mb-3" />
              <h4 className="text-base font-bold text-white uppercase tracking-tight">
                No Games Found Matching Your Search
              </h4>
              <p className="text-xs text-white/50 mt-1 max-w-sm">
                Try clearing your search query or selecting "All {category} Rigs" to view the full library.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('ALL');
                  setSelectedStationId('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pb-4">
              {filteredGames.map(({ game, installedStations }) => {
                return (
                  <div
                    key={game.id}
                    id={`game-card-${game.id}`}
                    onClick={() => {
                      requireLogin(
                        () => setSelectedGameForDetails(game),
                        `Please log in to view ${game.title} game info, media reels, and book installed stations.`
                      );
                    }}
                    className="group relative rounded-xl sm:rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-200 flex flex-col p-2 sm:p-2.5 cursor-pointer active:scale-[0.98]"
                  >
                    {/* Game Poster Image */}
                    <div className="relative w-full aspect-[16/10] rounded-lg sm:rounded-xl overflow-hidden bg-neutral-900 mb-2">
                      <img
                        src={game.coverUrl}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-white bg-red-600/90 px-2 py-0.5 rounded shadow">
                          View Overview & Trailer
                        </span>
                      </div>
                    </div>

                    {/* Game Title */}
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight group-hover:text-red-400 transition-colors line-clamp-1">
                      {game.title}
                    </h4>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="pt-4 mt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Sparkles className="w-4 h-4 text-white/80" />
            <span>
              All games pre-installed with zero waiting time. 1Gbps LAN and automatic cloud saves.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition cursor-pointer"
            >
              Back
            </button>

            <button
              onClick={() => {
                requireLogin(() => {
                  let targetSys = activeSystem;
                  if (!targetSys || targetSys.status !== 'AVAILABLE') {
                    targetSys = systemsInCategory.find(s => s.status === 'AVAILABLE') || systemsInCategory[0];
                  }
                  if (targetSys) {
                    setSelectedStationForBooking(targetSys);
                  }
                  onBookStation(category, targetSys?.id);
                }, `Please log in to reserve ${activeSystem ? activeSystem.name : config.title}.`);
              }}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              <span>Reserve {activeSystem ? activeSystem.name : config.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};
