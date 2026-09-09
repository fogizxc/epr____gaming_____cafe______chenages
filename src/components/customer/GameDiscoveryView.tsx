import React, { useState, useMemo } from 'react';
import { useCafe } from '../../context/CafeContext';
import { ConsoleGameItem, GamingServiceCategory } from '../../types';
import { CONSOLE_GAMES_DATABASE } from '../../data/consoleGamesData';
import {
  Gamepad2,
  Search,
  Filter,
  Star,
  Tv,
  CheckCircle2,
  Play,
  X,
  ArrowRight,
  Sparkles,
  Users,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';

interface GameDiscoveryViewProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
  onSelectGameForBooking?: (game: { title: string; category?: GamingServiceCategory; coverUrl?: string }) => void;
}

export const GameDiscoveryView: React.FC<GameDiscoveryViewProps> = ({
  onOpenBooking,
  onSelectGameForBooking
}) => {
  const { systems, requireLogin } = useCafe();

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [genreFilter, setGenreFilter] = useState<string>('ALL');
  const [multiplayerFilter, setMultiplayerFilter] = useState<string>('ALL');
  const [selectedGameForModal, setSelectedGameForModal] = useState<ConsoleGameItem | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  const platforms = ['ALL', 'Gaming PC', 'PS5', 'Xbox', 'Sim Racing', 'VR'];
  const genres = ['ALL', 'Action', 'FPS', 'Racing', 'Sports', 'RPG', 'Fighting', 'Open World'];

  // Filtered and searched games
  const filteredGames = useMemo(() => {
    return CONSOLE_GAMES_DATABASE.filter((game) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = game.title.toLowerCase().includes(q);
        const matchCategory = game.category.toLowerCase().includes(q);
        const matchTags = game.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchCategory && !matchTags) return false;
      }

      // Platform filter
      if (platformFilter !== 'ALL') {
        const matchesPlatform =
          game.platforms.includes(platformFilter as GamingServiceCategory) ||
          (platformFilter === 'PS5' && game.platforms.includes('PlayStation')) ||
          (platformFilter === 'PlayStation' && game.platforms.includes('PS5'));
        if (!matchesPlatform) return false;
      }

      // Genre filter
      if (genreFilter !== 'ALL') {
        const matchGenre =
          game.category.toLowerCase().includes(genreFilter.toLowerCase()) ||
          game.tags.some((t) => t.toLowerCase().includes(genreFilter.toLowerCase()));
        if (!matchGenre) return false;
      }

      // Multiplayer filter
      if (multiplayerFilter === 'MULTIPLAYER') {
        if (!game.multiplayerType.toLowerCase().includes('multiplayer') && !game.multiplayerType.toLowerCase().includes('co-op') && !game.multiplayerType.toLowerCase().includes('online')) {
          return false;
        }
      } else if (multiplayerFilter === 'SINGLEPLAYER') {
        if (game.multiplayerType.toLowerCase().includes('pure multiplayer')) return false;
      }

      return true;
    });
  }, [searchQuery, platformFilter, genreFilter, multiplayerFilter]);

  // Find installed stations for a game
  const getInstalledStationsForGame = (gameTitle: string, platforms: GamingServiceCategory[]) => {
    return systems.filter((sys) => {
      // Check category match
      const catMatch = platforms.includes(sys.category) ||
        (platforms.includes('PS5') && sys.category === 'PlayStation') ||
        (platforms.includes('PlayStation') && sys.category === 'PS5');

      if (!catMatch) return false;

      // Check if installed in installedGames array or marked as Full Library
      if (sys.installedGames.some((g) => g.toLowerCase().includes('full library'))) return true;
      return sys.installedGames.some(
        (g) => g.toLowerCase().includes(gameTitle.toLowerCase()) || gameTitle.toLowerCase().includes(g.toLowerCase())
      );
    });
  };

  const handleBookGame = (game: ConsoleGameItem) => {
    requireLogin(() => {
      const primaryCategory = game.platforms[0] || 'Gaming PC';
      if (onSelectGameForBooking) {
        onSelectGameForBooking({
          title: game.title,
          category: primaryCategory,
          coverUrl: game.coverUrl
        });
      }
      setSelectedGameForModal(null);
      onOpenBooking(primaryCategory);
    }, `Please log in to reserve a gaming station for ${game.title}.`);
  };

  return (
    <div id="screen-game-discovery" className="flex flex-col gap-6 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Pre-Installed Game Vault
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-white/80" />
            <span>Game Discovery Library</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-2xl">
            Explore 300+ pre-installed, high-performance verified titles across PC, PS5, Xbox Series X, and VR. Zero installation wait time.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-white/70 self-start md:self-auto">
          Showing <strong className="text-white font-bold">{filteredGames.length}</strong> Titles
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0c0c0c] border border-white/10">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="game-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games by title, genre, publisher, or tags (e.g., Valorant, Tekken, Racing)..."
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/40 text-xs focus:outline-none focus:border-red-600/60 focus:bg-white/[0.05] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Platform Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider mr-1">Platform:</span>
          {platforms.map((p) => {
            const isSelected = platformFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/30'
                    : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider mr-1">Genre:</span>
          {genres.map((g) => {
            const isSelected = genreFilter === g;
            return (
              <button
                key={g}
                onClick={() => setGenreFilter(g)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black font-black'
                    : 'bg-white/[0.03] text-white/60 hover:text-white'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Games Catalog Grid */}
      {filteredGames.length === 0 ? (
        <div className="p-16 rounded-2xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center justify-center gap-3">
          <Gamepad2 className="w-12 h-12 text-white/20" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider">No Games Found</h3>
          <p className="text-xs text-white/50 max-w-sm">
            We couldn't find any games matching "{searchQuery}". Try clearing filters or searching for popular titles like Spider-Man, Valorant, or FIFA.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setPlatformFilter('ALL');
              setGenreFilter('ALL');
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded-xl mt-2 transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredGames.map((game) => {
            const installedStations = getInstalledStationsForGame(game.title, game.platforms);
            const availableStations = installedStations.filter((s) => s.status === 'AVAILABLE');

            return (
              <div
                key={game.id}
                onClick={() => setSelectedGameForModal(game)}
                className="group relative rounded-2xl bg-[#0b0b0b] border border-white/10 hover:border-red-600/50 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              >
                {/* 600x900 Box Art Cover */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                  <img
                    src={game.coverUrl}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

                  {/* Rating Tag */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-black/80 text-amber-400 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      <span>{game.rating}</span>
                    </span>
                  </div>

                  {/* Platform Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    {game.platforms.slice(0, 2).map((p) => (
                      <span
                        key={p}
                        className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-black/70 text-white border border-white/15 backdrop-blur-md"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Availability Badge at Bottom of Cover */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded backdrop-blur-md block truncate ${
                      availableStations.length > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800/80 text-white/70 border border-white/10'
                    }`}>
                      {availableStations.length > 0
                        ? `● ${availableStations.length} Rigs Available`
                        : `${installedStations.length} Total Stations`}
                    </span>
                  </div>
                </div>

                {/* Details Bottom */}
                <div className="p-3 flex flex-col gap-2">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-red-400 transition-colors">
                      {game.title}
                    </h4>
                    <span className="text-[10px] text-white/50 block truncate mt-0.5">
                      {game.category} • {game.multiplayerType}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] text-white/40 uppercase tracking-wider">
                      Quick View
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookGame(game);
                      }}
                      className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEDICATED GAME DETAILS MODAL */}
      {selectedGameForModal && (
        <div
          id="game-details-modal-overlay"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedGameForModal(null)}
        >
          <div
            id="game-details-modal-content"
            className="w-full max-w-3xl max-h-[90vh] bg-[#0d0d0d] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Banner */}
            <div className="relative h-60 sm:h-72 w-full bg-black overflow-hidden">
              <img
                src={selectedGameForModal.bannerUrl || selectedGameForModal.coverUrl}
                alt={selectedGameForModal.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedGameForModal(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border border-white/20 flex items-center justify-center transition cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Overlay */}
              <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {selectedGameForModal.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-red-600 text-white"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-black/80 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{selectedGameForModal.rating}</span>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {selectedGameForModal.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-500">
                  Game Overview & Technical Details
                </span>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  {selectedGameForModal.description}
                </p>
              </div>

              {/* Tags & Multiplayer Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Category</span>
                  <span className="text-xs font-bold text-white">{selectedGameForModal.category}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Mode</span>
                  <span className="text-xs font-bold text-white">{selectedGameForModal.multiplayerType}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Installation</span>
                  <span className="text-xs font-bold text-emerald-400">100% Pre-Cached</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Recommended</span>
                  <span className="text-xs font-bold text-white">2 Hours Session</span>
                </div>
              </div>

              {/* Installed Stations at Cafe */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40 block font-bold mb-3">
                  Installed on These Arena Stations
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {getInstalledStationsForGame(selectedGameForModal.title, selectedGameForModal.platforms).map((st) => (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-white font-mono">{st.name}</span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        st.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {st.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedGameForModal(null)}
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBookGame(selectedGameForModal)}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Book Station for {selectedGameForModal.title}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
