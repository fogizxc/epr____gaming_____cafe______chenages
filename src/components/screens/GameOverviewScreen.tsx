import React, { useState, useRef, useEffect } from 'react';
import { HeroGameSlide, GamingServiceCategory } from '../../types';
import { useCafe } from '../../context/CafeContext';
import { getGameMedia, GamePhotoItem } from '../../utils/gameMedia';
import {
  ArrowLeft,
  Star,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Monitor,
  Gamepad2,
  Tv,
  CheckCircle2,
  Wifi,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Plus,
  X,
  Upload,
  RotateCcw,
  Camera
} from 'lucide-react';

export type { GamePhotoItem };

interface GameOverviewScreenProps {
  game: HeroGameSlide;
  onBack: () => void;
  onBookSlot: (game: HeroGameSlide, category?: GamingServiceCategory) => void;
}

export const GameOverviewScreen: React.FC<GameOverviewScreenProps> = ({
  game,
  onBack,
  onBookSlot
}) => {
  const { systems, getRateForService } = useCafe();
  const [selectedPlatform, setSelectedPlatform] = useState<GamingServiceCategory>('Gaming PC');

  // Authentic game media resolution
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

  // 5 In-game photos state with persistence
  const storageKey = `nexus_game_photos_${game.id}`;
  const [gamePhotos, setGamePhotos] = useState<GamePhotoItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].url.includes('images.unsplash.com')) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return media.defaultPhotos;
  });

  // Save to localStorage when updated
  const savePhotos = (updated: GamePhotoItem[]) => {
    setGamePhotos(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignored
    }
  };

  // Lightbox & Add/Manage Photo Modals
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);

  // Form states for adding custom photo
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoLocation, setNewPhotoLocation] = useState('');
  const [replaceIndex, setReplaceIndex] = useState<number>(0);

  // Set default platform based on game platforms
  useEffect(() => {
    if (game.platforms?.includes('PS5')) {
      setSelectedPlatform('PS5');
    } else if (game.platforms?.includes('Xbox')) {
      setSelectedPlatform('Xbox');
    } else {
      setSelectedPlatform('Gaming PC');
    }
    setCurrentVideoUrl(getInitialVideo());

    // Refresh photos when game changes
    try {
      const saved = localStorage.getItem(`nexus_game_photos_${game.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed[0].url.includes('images.unsplash.com')) {
          setGamePhotos(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }
    setGamePhotos(media.defaultPhotos);
  }, [game.id, game.title]);

  // Video play/pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Available rigs count for selected platform
  const availableCount = systems.filter(
    (s) =>
      (s.category === selectedPlatform ||
        (selectedPlatform === 'PS5' && s.category === 'PlayStation') ||
        (selectedPlatform === 'Gaming PC' && s.category === 'PC')) &&
      s.status === 'AVAILABLE'
  ).length;

  const currentRate = getRateForService(selectedPlatform);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPhotoUrl(event.target.result as string);
          if (!newPhotoTitle) {
            setNewPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
          }
          if (!newPhotoLocation) {
            setNewPhotoLocation('Custom Capture');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle saving new or replaced photo
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl) return;

    const newPhotoItem: GamePhotoItem = {
      id: 'photo-' + Date.now(),
      url: newPhotoUrl,
      title: newPhotoTitle || `${game.title} Capture #${replaceIndex + 1}`,
      location: newPhotoLocation || 'In-Game Scene'
    };

    const updated = [...gamePhotos];
    if (replaceIndex >= 0 && replaceIndex < updated.length) {
      updated[replaceIndex] = newPhotoItem;
    } else {
      updated.push(newPhotoItem);
    }

    savePhotos(updated);
    setNewPhotoUrl('');
    setNewPhotoTitle('');
    setNewPhotoLocation('');
    setShowManageModal(false);
  };

  // Reset photos back to authentic default
  const handleResetDefaults = () => {
    savePhotos(media.defaultPhotos);
    setShowManageModal(false);
  };

  const isGtaGame =
    game.id === 'game-gta-6' ||
    game.title.toLowerCase().includes('grand theft auto') ||
    game.title.toLowerCase().includes('gta');

  return (
    <div id="screen-game-overview" className="w-full flex flex-col gap-8 pb-16 animate-fadeIn">
      {/* Top Navigation Bar: Back to Main Arena & Game Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <button
          id="btn-back-to-arena"
          onClick={onBack}
          className="self-start flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition cursor-pointer active:scale-95 group"
        >
          <ArrowLeft className="w-4 h-4 text-red-600 transition group-hover:-translate-x-1" />
          <span>← Back to Main Arena</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
            {game.category}
          </span>
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-mono">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{game.rating}</span>
          </div>
          <span className="text-xs font-mono text-white/50">4K HDR Edition</span>
        </div>
      </div>

      {/* SECTION 1: OVERVIEW WITH VIDEO BESIDE IT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Game Overview, Tagline, Auto-Sliding Photos & Station Specs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2 text-red-500 font-mono text-[11px] uppercase tracking-widest font-semibold mb-1">
              <span>{game.category}</span>
              <span>•</span>
              <span>Next-Gen Performance</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
              {game.title}
            </h1>
            <p className="text-sm sm:text-base text-white/70 font-light mt-2 leading-relaxed">
              {game.tagline}
            </p>
          </div>

          {/* AUTO-SLIDING PHOTOS TRACK UNDER GRAND THEFT AUTO VI / Welcome to Leonida */}
          <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-600 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>
                    {isGtaGame ? 'Leonida Photo Track • 5 In-Game Shots' : `${game.title} Photo Track`}
                  </span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-white/40 hidden sm:inline">
                  Auto-Sliding • Hover to Pause
                </span>
                <button
                  id="btn-manage-game-photos"
                  onClick={() => setShowManageModal(true)}
                  className="text-[10px] uppercase tracking-wider font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 transition cursor-pointer"
                  title="Add, replace, or upload your 5 photos"
                >
                  <Plus className="w-3 h-3 text-red-500" />
                  <span>Add / Manage Photos</span>
                </button>
              </div>
            </div>

            {/* Seamless Auto-Sliding Horizontal Marquee Track */}
            <div
              id="game-photos-auto-sliding-track"
              className="sliding-track-container relative w-full overflow-hidden rounded-xl bg-black/60 border border-white/10 p-2.5 select-none"
            >
              {/* Edge gradient fade masks for polished cinema look */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />

              {/* Infinite sliding track with duplicated photo cards */}
              <div className="sliding-track-content gap-3 items-center">
                {[...gamePhotos, ...gamePhotos].map((photo, index) => {
                  const actualIdx = index % gamePhotos.length;
                  return (
                    <div
                      key={`${photo.id}-${index}`}
                      onClick={() => setSelectedPhotoIndex(actualIdx)}
                      className="group/photocard relative w-44 sm:w-52 aspect-[16/10] rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-red-500 transition-all duration-300 cursor-pointer flex-shrink-0 shadow-lg"
                      title={`Click to enlarge: ${photo.title}`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover/photocard:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Gradient bottom overlay with title & location */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5 opacity-90 group-hover/photocard:opacity-100 transition-opacity">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 font-bold">
                          Shot #{actualIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-white truncate block">
                          {photo.title}
                        </span>
                        <span className="text-[10px] text-white/60 truncate font-light">
                          {photo.location}
                        </span>
                      </div>

                      {/* Hover Zoom Icon */}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/80 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/photocard:opacity-100 transition-opacity">
                        <Maximize2 className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Arena Hardware Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1">
                <Tv className="w-3.5 h-3.5 text-red-500" />
                <span>Display & Audio</span>
              </div>
              <span className="text-sm font-bold text-white block">4K 120Hz HDR</span>
              <span className="text-xs text-white/50">Dolby Atmos Spatial Audio</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Esports LAN</span>
              </div>
              <span className="text-sm font-bold text-white block">1 Gbps Dedicated</span>
              <span className="text-xs text-white/50">Sub-5ms Ultra-Low Ping</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pro Controller</span>
              </div>
              <span className="text-sm font-bold text-white block">DualSense Edge</span>
              <span className="text-xs text-white/50">Haptic Feedback & Paddles</span>
            </div>
          </div>

          {/* Platform Station Selector & Live Pricing */}
          <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-600 block">
                Select Platform Station to Play
              </span>
              <span className="text-xs text-white/60 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{availableCount > 0 ? `${availableCount} Stations Free` : 'Ready to Book'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {game.platforms.map((plat) => {
                const platCategory: GamingServiceCategory =
                  plat === 'PS5' ? 'PS5' : plat === 'Xbox' ? 'Xbox' : 'Gaming PC';
                const rate = getRateForService(platCategory);
                const isSelected = selectedPlatform === platCategory;

                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setSelectedPlatform(platCategory)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-white/15 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.06)]'
                        : 'bg-white/[0.03] border-white/10 text-white/60 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plat === 'PS5' ? (
                          <Gamepad2 className="w-4 h-4 text-red-500" />
                        ) : plat === 'Xbox' ? (
                          <Gamepad2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Monitor className="w-4 h-4 text-cyan-400" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">{plat} Rig</span>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-red-500 bg-red-600' : 'border-white/20'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-sm font-black font-mono text-white">₹{rate}/hr</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: High-Definition Video Reel Beside It (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-600 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Gameplay Video Reel (4K 60FPS)</span>
            </span>
            <button
              onClick={toggleMute}
              className="text-xs text-white/70 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 transition cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Sound On</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive 16:9 Video Canvas */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl group">
            <video
              ref={videoRef}
              src={currentVideoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover cursor-pointer"
              onClick={togglePlay}
            />

            {/* Video Play Overlay Button */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition"
              >
                <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl">
                  <Play className="w-6 h-6 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Bottom Floating Video Meta */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono font-bold text-white/80 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 pointer-events-none">
              <span>NEXUS ARENA CAPTURE</span>
              <span className="text-emerald-400">4K HDR • LIVE DIRECT FEED</span>
            </div>
          </div>

          {/* Video Reel Clip Switchers */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Available Gameplay Clips ({media.videoClips.length} Verified Clips):
            </span>
            <div className="grid grid-cols-3 gap-2">
              {media.videoClips.map((clip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentVideoUrl(clip.url);
                    setIsPlaying(true);
                  }}
                  className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 overflow-hidden ${
                    currentVideoUrl === clip.url
                      ? 'border-red-500 bg-white/10 text-white'
                      : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                  }`}
                >
                  <span className="text-[10px] font-bold truncate block">{clip.label}</span>
                  <span className="text-[9px] font-mono text-white/40">Watch Clip →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SHORT DESCRIPTION OF THE GAME */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-2">
          Game Storyline & Experience
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-3">
          About {game.title}
        </h2>
        <p className="text-sm sm:text-base text-white/80 leading-relaxed font-light">
          {game.description}
        </p>

        {/* Feature Tags */}
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono mr-1">
            Tags & Features:
          </span>
          {game.tags.map((tag, idx) => (
            <span
              key={idx}
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

      {/* SECTION 3: BUTTON TO BOOK SLOT */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#121212] via-[#0d0d0d] to-[#121212] border border-white/20 shadow-2xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-500 block mb-1">
            Ready to Boot Up?
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Reserve Your Slot on {selectedPlatform} Rig
          </h3>
          <p className="text-xs sm:text-sm text-white/60 font-light mt-0.5">
            Instant booking confirmation with high-priority queue and preloaded save files.
          </p>
        </div>

        <button
          id="btn-book-slot-game-overview"
          onClick={() => onBookSlot(game, selectedPlatform)}
          className="w-full sm:w-auto bg-white text-black hover:bg-white/90 text-sm font-black uppercase tracking-widest py-4 px-8 rounded-2xl transition transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.2)]"
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20">
                  Photo #{selectedPhotoIndex + 1} of {gamePhotos.length}
                </span>
                <div>
                  <h4 className="text-base font-bold text-white leading-tight">
                    {gamePhotos[selectedPhotoIndex]?.title}
                  </h4>
                  <p className="text-xs text-white/50">
                    {gamePhotos[selectedPhotoIndex]?.location} • 4K Photo Capture
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* High-res Image Display */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              <img
                src={gamePhotos[selectedPhotoIndex]?.url}
                alt={gamePhotos[selectedPhotoIndex]?.title}
                className="w-full h-full object-contain"
              />

              {/* Prev / Next navigation buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex(
                    (prev) => ((prev ?? 0) - 1 + gamePhotos.length) % gamePhotos.length
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex(
                    (prev) => ((prev ?? 0) + 1) % gamePhotos.length
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/95 text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE / ADD 5 PHOTOS MODAL */}
      {showManageModal && (
        <div
          id="manage-game-photos-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowManageModal(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0d0d0d] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-500 block mb-1">
                  Photo Track Customization
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Add or Replace Game Photos
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Upload local files or paste image URLs to customize the auto-sliding track.
                </p>
              </div>

              <button
                onClick={() => setShowManageModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current 5 Photos Quick Slot Grid */}
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-white/70 block mb-2.5">
                Current Photos in Track ({gamePhotos.length} active) - Select slot to replace:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {gamePhotos.map((photo, idx) => (
                  <button
                    key={photo.id || idx}
                    type="button"
                    onClick={() => setReplaceIndex(idx)}
                    className={`relative aspect-[16/10] rounded-xl overflow-hidden border text-left transition cursor-pointer ${
                      replaceIndex === idx
                        ? 'border-red-500 ring-2 ring-red-500/50 scale-102'
                        : 'border-white/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] font-mono font-bold bg-black/80 px-1.5 py-0.5 rounded text-white">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add / Replace Form */}
            <form onSubmit={handleSavePhoto} className="flex flex-col gap-4 border-t border-white/10 pt-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Update Photo Slot #{replaceIndex + 1}</span>
                <span className="text-white/40 normal-case font-normal text-[11px]">
                  (Will replace current Shot #{replaceIndex + 1})
                </span>
              </div>

              {/* Upload from device or enter URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/25 hover:border-red-500 bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer text-center">
                  <Upload className="w-5 h-5 text-red-500" />
                  <span className="text-xs font-bold text-white">Upload from Computer</span>
                  <span className="text-[10px] text-white/40">PNG, JPG, WebP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/60">
                    Or Paste Image URL
                  </label>
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://.../photo.jpg"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
                  />
                  {newPhotoUrl && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Image source ready!
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/60">
                    Photo Title / Landmark
                  </label>
                  <input
                    type="text"
                    value={newPhotoTitle}
                    onChange={(e) => setNewPhotoTitle(e.target.value)}
                    placeholder="e.g. Ocean Drive Neon Run"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/60">
                    District / Location
                  </label>
                  <input
                    type="text"
                    value={newPhotoLocation}
                    onChange={(e) => setNewPhotoLocation(e.target.value)}
                    placeholder="e.g. Vice Beach Boulevard"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to 5 Original Shots</span>
                </button>

                <button
                  type="submit"
                  disabled={!newPhotoUrl}
                  className="bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition cursor-pointer shadow-md"
                >
                  Save to Photo Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
