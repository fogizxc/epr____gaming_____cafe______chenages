import React, { useState, useRef, useEffect } from 'react';
import { useCafe } from '../context/CafeContext';
import { GamingServiceCategory } from '../types';
import { getGameMedia, GamePhotoItem, GameVideoClip } from '../utils/gameMedia';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Gamepad2,
  Monitor,
  Tv,
  Eye,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Wifi,
  Clock,
  ArrowLeft
} from 'lucide-react';

export interface GameDetailData {
  id: string;
  title: string;
  tagline?: string;
  category: string;
  tags: string[];
  description: string;
  price?: string;
  rating: string;
  platforms: (GamingServiceCategory | string)[];
  bannerUrl?: string;
  coverUrl: string;
  videoPreviewUrl?: string;
  thumbnails?: string[];
  availableCount?: number;
  multiplayerType?: string;
}

interface GameDetailViewProps {
  game: GameDetailData;
  defaultPlatform?: GamingServiceCategory;
  onBack: () => void;
  onBookSlot: (game: GameDetailData, selectedPlatform: GamingServiceCategory) => void;
}

export const GameDetailView: React.FC<GameDetailViewProps> = ({
  game,
  defaultPlatform,
  onBack,
  onBookSlot
}) => {
  const { systems, getRateForService } = useCafe();

  // Determine initial platform
  const initialPlatform: GamingServiceCategory =
    defaultPlatform ||
    (game.platforms.includes('PS5')
      ? 'PS5'
      : game.platforms.includes('Xbox')
      ? 'Xbox'
      : 'Gaming PC');

  const [selectedPlatform, setSelectedPlatform] = useState<GamingServiceCategory>(initialPlatform);

  // Dynamic media for this game
  const media = getGameMedia(game);
  const getInitialVideo = () => {
    if (game.videoPreviewUrl && !game.videoPreviewUrl.includes('commondatastorage.googleapis.com')) {
      return game.videoPreviewUrl;
    }
    return media.videoPreviewUrl;
  };

  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(getInitialVideo);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Photos state with persistence
  const storageKey = `nexus_game_photos_${game.id}`;
  const [gamePhotos, setGamePhotos] = useState<GamePhotoItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only keep if not old Unsplash placeholders
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].url.includes('images.unsplash.com')) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return media.defaultPhotos;
  });

  // Keep state updated if selected game changes
  useEffect(() => {
    setCurrentVideoUrl(getInitialVideo());
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].url.includes('images.unsplash.com')) {
          setGamePhotos(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setGamePhotos(media.defaultPhotos);
  }, [game.id, game.title]);

  const savePhotos = (updated: GamePhotoItem[]) => {
    setGamePhotos(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Lightbox & Manage Photos Modals
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoLocation, setNewPhotoLocation] = useState('');
  const [replaceIndex, setReplaceIndex] = useState<number>(0);

  // Video playback sync
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentVideoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Available rigs for the selected platform
  const isTargetCategory = (sysCat: GamingServiceCategory) => {
    if (sysCat === selectedPlatform) return true;
    if (selectedPlatform === 'PS5' && sysCat === 'PlayStation') return true;
    if (selectedPlatform === 'PlayStation' && sysCat === 'PS5') return true;
    return false;
  };

  const platformSystems = systems.filter(s => isTargetCategory(s.category));
  const availableRigsCount = platformSystems.filter(s => s.status === 'AVAILABLE').length;
  const currentRate = getRateForService(selectedPlatform);

  return (
    <div className="flex flex-col space-y-8 animate-fadeIn text-white">
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-red-500" />
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {availableRigsCount} Rigs Available Now
          </span>
          <span className="text-xs font-mono font-bold text-white/70">
            ₹{currentRate}/hr
          </span>
        </div>
      </div>

      {/* SECTION 1: 4K GAMEPLAY VIDEO REEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-red-500 font-bold">
              [ DIRECT FEED ]
            </span>
            <span className="text-xs text-white/40">|</span>
            <span className="text-xs text-white/60 font-medium">
              4K 60FPS Pro Live Capture
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>&lt; 5ms LAN Ping</span>
          </div>
        </div>

        {/* Video Canvas Box */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-white/15 aspect-[16/9] shadow-2xl group">
          <video
            ref={videoRef}
            src={currentVideoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          />

          {/* Video Overlay Top Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-red-600/90 text-white px-3 py-1 rounded-md shadow-lg backdrop-blur-sm">
              Live Reel
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white/80 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-sm">
              {game.title}
            </span>
          </div>

          {/* Video Playback Controls Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 opacity-90 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title={isPlaying ? 'Pause Video' : 'Play Video'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white/70" /> : <Volume2 className="w-4 h-4 text-red-400" />}
              </button>

              <span className="text-[11px] font-mono text-white/60 hidden sm:inline">
                {isMuted ? 'Muted (Click to hear in-game audio)' : 'Sound On'}
              </span>
            </div>

            {/* Video Clip Switchers */}
            <div className="flex items-center gap-1.5">
              {media.videoClips.map((clip, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentVideoUrl(clip.url)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    currentVideoUrl === clip.url
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-white/5 hover:bg-white/15 text-white/70'
                  }`}
                >
                  {clip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 5 IN-GAME PHOTOS TRACK & GALLERY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              In-Game 4K Photos Track ({gamePhotos.length} Captures)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 hidden sm:inline">
              Click photo to enlarge
            </span>
            <button
              onClick={() => setShowManageModal(true)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-white/80 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-red-400" />
              <span>Manage Photos</span>
            </button>
          </div>
        </div>

        {/* 5-Photo Interactive Carousel Track */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {gamePhotos.slice(0, 5).map((photo, index) => (
            <div
              key={photo.id || index}
              onClick={() => setSelectedPhotoIndex(index)}
              className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-red-500/50 aspect-[4/3] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-xl"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                <span className="self-end p-1 rounded-full bg-black/60 text-white">
                  <Eye className="w-3 h-3" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-white line-clamp-1">
                    {photo.title}
                  </p>
                  <p className="text-[9px] text-white/60 line-clamp-1">
                    {photo.location}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-1.5 left-2 text-[9px] font-mono font-bold text-white/80 bg-black/60 px-1.5 py-0.5 rounded group-hover:opacity-0 transition-opacity">
                Shot #{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: GAME STORYLINE & DESCRIPTION ("des like the games available on hero screen") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20">
              {game.category}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              ★ {game.rating}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
              4K HDR Edition
            </span>
            {game.multiplayerType && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
                {game.multiplayerType}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {game.title}
            </h2>
            {game.tagline && (
              <p className="text-sm font-semibold text-red-500 tracking-wide mt-1">
                "{game.tagline}"
              </p>
            )}
          </div>

          <div className="text-sm text-white/80 leading-relaxed font-light space-y-3">
            <p>{game.description}</p>
            <p className="text-xs text-white/60">
              Pre-installed and optimized on Nexus Arena high-spec hardware with ultra-low latency gigabit optical fiber routing, cloud save synchronization, and zero shader compile stutters.
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {game.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold bg-white/5 text-white/80 border border-white/10"
              >
                {tag}
              </span>
            ))}
            <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Esports Verified
            </span>
            <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Full Controller Support
            </span>
          </div>
        </div>

        {/* Rig & Hardware Specification Card */}
        <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-widest text-white/60">
                Selected Rig
              </span>
              <span className="text-xs font-mono font-bold text-red-400">
                {selectedPlatform}
              </span>
            </div>

            {/* Platform Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Choose Station Platform:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['PS5', 'Xbox', 'Gaming PC', 'Sim Racing', 'VR', 'VIP Room'] as GamingServiceCategory[]).map(
                  plat => (
                    <button
                      key={plat}
                      onClick={() => setSelectedPlatform(plat)}
                      className={`px-2.5 py-2 text-xs font-bold rounded-lg border transition text-left cursor-pointer ${
                        selectedPlatform === plat
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {plat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Hardware telemetry perks */}
            <div className="space-y-2 pt-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>4K 120Hz HDR Pro Displays</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dedicated 1Gbps Fiber (&lt;5ms ping)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clean Sanitized Controllers</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/50">Lounge Hourly Rate</span>
            <span className="text-base font-black text-white font-mono">
              ₹{currentRate}/hr
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: BUTTON AT THE BOTTOM TO BOOK SLOT */}
      <div
        id="book-slot-bottom-banner"
        className="sticky bottom-2 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-7 rounded-2xl bg-[#111111]/95 backdrop-blur-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
      >
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-500 block mb-1">
            Ready to Boot Up?
          </span>
          <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight">
            Reserve Your Slot for {game.title} on {selectedPlatform} Rig
          </h3>
          <p className="text-xs text-white/60 font-light mt-0.5">
            Instant booking confirmation with high-priority queue and preloaded save files.
          </p>
        </div>

        <button
          id="btn-book-slot-bottom"
          onClick={() => onBookSlot(game, selectedPlatform)}
          className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-black uppercase tracking-widest py-4 px-8 rounded-xl transition transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
        >
          <span>Book Slot • Reserve Now (₹{currentRate}/hr)</span>
          <ChevronRight className="w-5 h-5 text-red-600" />
        </button>
      </div>

      {/* LIGHTBOX MODAL (Enlarged view of clicked photo) */}
      {selectedPhotoIndex !== null && (
        <div
          id="lightbox-photo-modal"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#0d0d0d] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20">
                  Photo #{selectedPhotoIndex + 1} of {gamePhotos.length}
                </span>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">
                    {gamePhotos[selectedPhotoIndex]?.title}
                  </h4>
                  <p className="text-xs text-white/50">
                    {gamePhotos[selectedPhotoIndex]?.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={gamePhotos[selectedPhotoIndex]?.url}
                alt={gamePhotos[selectedPhotoIndex]?.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() =>
                  setSelectedPhotoIndex(
                    (selectedPhotoIndex - 1 + gamePhotos.length) % gamePhotos.length
                  )
                }
                className="absolute left-4 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setSelectedPhotoIndex((selectedPhotoIndex + 1) % gamePhotos.length)
                }
                className="absolute right-4 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE / ADD PHOTOS MODAL */}
      {showManageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowManageModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-[#111111] border border-white/20 rounded-2xl p-6 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-500" />
                Manage In-Game Photo Track
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-white/70 block font-medium">
                Add / Replace Photo:
              </label>
              <input
                type="text"
                placeholder="Image URL (Unsplash, Direct JPG/PNG)"
                value={newPhotoUrl}
                onChange={e => setNewPhotoUrl(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Photo Title (e.g. Skyline)"
                  value={newPhotoTitle}
                  onChange={e => setNewPhotoTitle(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Location (e.g. Sector A)"
                  value={newPhotoLocation}
                  onChange={e => setNewPhotoLocation(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-white/50">Replace Slot:</span>
                <select
                  value={replaceIndex}
                  onChange={e => setReplaceIndex(Number(e.target.value))}
                  className="bg-black border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                >
                  {gamePhotos.map((_, i) => (
                    <option key={i} value={i}>
                      Slot #{i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (!newPhotoUrl.trim()) return;
                  const updated = [...gamePhotos];
                  updated[replaceIndex] = {
                    id: `custom-photo-${Date.now()}`,
                    url: newPhotoUrl.trim(),
                    title: newPhotoTitle.trim() || `Custom Photo #${replaceIndex + 1}`,
                    location: newPhotoLocation.trim() || 'Nexus Arena Capture'
                  };
                  savePhotos(updated);
                  setNewPhotoUrl('');
                  setNewPhotoTitle('');
                  setNewPhotoLocation('');
                  setShowManageModal(false);
                }}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer shadow"
              >
                Save Photo to Track
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between">
              <button
                onClick={() => {
                  savePhotos(media.defaultPhotos);
                  setShowManageModal(false);
                }}
                className="text-[11px] text-white/50 hover:text-red-400 transition underline cursor-pointer"
              >
                Reset to Default Photos
              </button>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-xs text-white/80 hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
