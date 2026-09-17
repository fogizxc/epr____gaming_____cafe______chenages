import React, { useState, useRef, useEffect } from 'react';
import { HeroGameSlide, GamingServiceCategory } from '../../types';
import { useCafe } from '../../context/CafeContext';
import { getGameMedia, GamePhotoItem } from '../../utils/gameMedia';
import { ArrowLeft, Star, Play, Pause, Volume2, VolumeX, Monitor, Gamepad2, Tv, CheckCircle2, Wifi, Sparkles, ChevronRight, ChevronLeft, Maximize2, Plus, X, Upload, RotateCcw, Camera } from 'lucide-react';

export type { GamePhotoItem };

interface GameOverviewScreenProps { game: HeroGameSlide; onBack: () => void; onBookSlot: (game: HeroGameSlide, category?: GamingServiceCategory) => void; }

export const GameOverviewScreen: React.FC<GameOverviewScreenProps> = ({ game, onBack, onBookSlot }) => {
  const { systems: contextSystems, getRateForService } = useCafe();
  // Never trust persisted/browser state to satisfy the array contract.
  const systems = Array.isArray(contextSystems) ? contextSystems : [];
  const safeGame = game || ({} as HeroGameSlide);
  const safePlatforms = Array.isArray(safeGame.platforms) ? safeGame.platforms : [];
  const safeTags = Array.isArray(safeGame.tags) ? safeGame.tags : [];
  const [selectedPlatform, setSelectedPlatform] = useState<GamingServiceCategory>('Gaming PC');
  const media = getGameMedia(safeGame);
  const safeVideoClips = Array.isArray(media?.videoClips) ? media.videoClips : [];
  const safeDefaultPhotos = Array.isArray(media?.defaultPhotos) ? media.defaultPhotos : [];
  const getInitialVideo = () => {
    const url = typeof safeGame.videoPreviewUrl === 'string' ? safeGame.videoPreviewUrl : '';
    if (url && !url.includes('commondatastorage.googleapis.com')) return url;
    return typeof media?.videoPreviewUrl === 'string' ? media.videoPreviewUrl : '';
  };
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(getInitialVideo);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const storageKey = `nexus_game_photos_${safeGame.id || 'unknown'}`;
  const [gamePhotos, setGamePhotos] = useState<GamePhotoItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0]?.url === 'string' && !parsed[0].url.includes('images.unsplash.com')) return parsed;
      }
    } catch {}
    return safeDefaultPhotos;
  });
  const savePhotos = (updated: GamePhotoItem[]) => { setGamePhotos(Array.isArray(updated) ? updated : []); try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {} };
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoLocation, setNewPhotoLocation] = useState('');
  const [replaceIndex, setReplaceIndex] = useState<number>(0);

  useEffect(() => {
    if (safePlatforms.includes('PS5')) setSelectedPlatform('PS5');
    else if (safePlatforms.includes('Xbox')) setSelectedPlatform('Xbox');
    else setSelectedPlatform('Gaming PC');
    setCurrentVideoUrl(getInitialVideo());
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0]?.url === 'string' && !parsed[0].url.includes('images.unsplash.com')) { setGamePhotos(parsed); return; }
      }
    } catch {}
    setGamePhotos(safeDefaultPhotos);
  }, [safeGame.id, safeGame.title]);

  const togglePlay = () => { if (!videoRef.current) return; if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); } else { void videoRef.current.play(); setIsPlaying(true); } };
  const toggleMute = () => { if (!videoRef.current) return; videoRef.current.muted = !isMuted; setIsMuted(!isMuted); };

  const availableCount = Array.isArray(systems) ? systems.filter((s) =>
    (s?.category === selectedPlatform ||
      (selectedPlatform === 'PS5' && s?.category === 'PlayStation') ||
      (selectedPlatform === 'Gaming PC' && s?.category === 'PC')) &&
    s?.status === 'AVAILABLE'
  ).length : 0;

  const currentRate = getRateForService(selectedPlatform);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (event) => { if (event.target?.result) { setNewPhotoUrl(event.target.result as string); if (!newPhotoTitle) setNewPhotoTitle(file.name.replace(/\.[^/.]+$/, '')); if (!newPhotoLocation) setNewPhotoLocation('Custom Capture'); } }; reader.readAsDataURL(file); };
  const handleSavePhoto = (e: React.FormEvent) => { e.preventDefault(); if (!newPhotoUrl) return; const newPhotoItem: GamePhotoItem = { id: 'photo-' + Date.now(), url: newPhotoUrl, title: newPhotoTitle || `${safeGame.title || 'Game'} Capture #${replaceIndex + 1}`, location: newPhotoLocation || 'In-Game Scene' }; const updated = [...(Array.isArray(gamePhotos) ? gamePhotos : [])]; if (replaceIndex >= 0 && replaceIndex < updated.length) updated[replaceIndex] = newPhotoItem; else updated.push(newPhotoItem); savePhotos(updated); setNewPhotoUrl(''); setNewPhotoTitle(''); setNewPhotoLocation(''); setShowManageModal(false); };
  const handleResetDefaults = () => { savePhotos(safeDefaultPhotos); setShowManageModal(false); };
  const gameTitle = typeof safeGame.title === 'string' ? safeGame.title : 'Game';
  const gameCategory = typeof safeGame.category === 'string' ? safeGame.category : 'Gaming';
  const isGtaGame = safeGame.id === 'game-gta-6' || gameTitle.toLowerCase().includes('grand theft auto') || gameTitle.toLowerCase().includes('gta');

  return (
    <div id="screen-game-overview" className="w-full flex flex-col gap-8 pb-16 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <button id="btn-back-to-arena" onClick={onBack} className="self-start flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition cursor-pointer active:scale-95 group"><ArrowLeft className="w-4 h-4 text-red-600 transition group-hover:-translate-x-1" /><span>← Back to Main Arena</span></button>
        <div className="flex items-center gap-3"><span className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">{gameCategory}</span><div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-mono"><Star className="w-3.5 h-3.5 fill-current" /><span>{safeGame.rating ?? '—'}</span></div><span className="text-xs font-mono text-white/50">4K HDR Edition</span></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div><div className="flex items-center gap-2 text-red-500 font-mono text-[11px] uppercase tracking-widest font-semibold mb-1"><span>{gameCategory}</span><span>•</span><span>Next-Gen Performance</span></div><h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">{gameTitle}</h1><p className="text-sm sm:text-base text-white/70 font-light mt-2 leading-relaxed">{safeGame.tagline || ''}</p></div>
          <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-[#0a0a0a] border border-white/10"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-600 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /><span>{isGtaGame ? 'Leonida Photo Track • 5 In-Game Shots' : `${gameTitle} Photo Track`}</span></span><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /></div><button id="btn-manage-game-photos" onClick={() => setShowManageModal(true)} className="text-[10px] uppercase tracking-wider font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 transition cursor-pointer"><Plus className="w-3 h-3 text-red-500" /><span>Add / Manage Photos</span></button></div>
            <div id="game-photos-auto-sliding-track" className="sliding-track-container relative w-full overflow-hidden rounded-xl bg-black/60 border border-white/10 p-2.5 select-none"><div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" /><div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" /><div className="sliding-track-content gap-3 items-center">{(Array.isArray(gamePhotos) ? gamePhotos : []).length > 0 ? [...gamePhotos, ...gamePhotos].map((photo, index) => { const actualIdx = index % gamePhotos.length; return <div key={`${photo.id || 'photo'}-${index}`} onClick={() => setSelectedPhotoIndex(actualIdx)} className="group/photocard relative w-44 sm:w-52 aspect-[16/10] rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-red-500 transition-all duration-300 cursor-pointer flex-shrink-0 shadow-lg"><img src={photo.url} alt={photo.title || gameTitle} className="w-full h-full object-cover group-hover/photocard:scale-108 transition-transform duration-500" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5 opacity-90"><span className="text-[9px] font-mono uppercase tracking-widest text-red-400 font-bold">Shot #{actualIdx + 1}</span><span className="text-xs font-bold text-white truncate block">{photo.title || 'In-Game Capture'}</span><span className="text-[10px] text-white/60 truncate font-light">{photo.location || 'In-Game Scene'}</span></div><div className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/80 border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/photocard:opacity-100"><Maximize2 className="w-3 h-3" /></div></div>; }) : <div className="p-8 text-sm text-white/40">No game photos available.</div>}</div></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10"><div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1"><Tv className="w-3.5 h-3.5 text-red-500" /><span>Display & Audio</span></div><span className="text-sm font-bold text-white block">4K 120Hz HDR</span><span className="text-xs text-white/50">Dolby Atmos Spatial Audio</span></div><div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10"><div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1"><Wifi className="w-3.5 h-3.5 text-emerald-400" /><span>Esports LAN</span></div><span className="text-sm font-bold text-white block">1 Gbps Dedicated</span><span className="text-xs text-white/50">Sub-5ms Ultra-Low Ping</span></div><div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10"><div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-mono mb-1"><Gamepad2 className="w-3.5 h-3.5 text-cyan-400" /><span>Pro Controller</span></div><span className="text-sm font-bold text-white block">DualSense Edge</span><span className="text-xs text-white/50">Haptic Feedback & Paddles</span></div></div>
          <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10"><div className="flex items-center justify-between mb-3"><span className="text-[10px] uppercase tracking-widest font-bold text-white/60">Available Stations</span><span className="text-emerald-400 font-bold">{availableCount}</span></div><div className="flex flex-wrap gap-2">{safePlatforms.map((platform) => <button key={platform} onClick={() => setSelectedPlatform(platform as GamingServiceCategory)} className={`px-3 py-2 rounded-lg border text-xs font-bold ${selectedPlatform === platform ? 'border-red-500 bg-red-500/20 text-white' : 'border-white/10 text-white/60'}`}>{platform}</button>)}{safePlatforms.length === 0 && <span className="text-xs text-white/40">Gaming PC</span>}</div><div className="mt-4 flex items-center justify-between"><span className="text-white/50 text-xs">Current rate</span><span className="text-white font-bold">₹{currentRate}/hr</span><button onClick={() => onBookSlot(safeGame, selectedPlatform)} className="ml-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase">Book Slot</button></div></div>
        </div>
        <div className="lg:col-span-5"><div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video">{currentVideoUrl ? <video ref={videoRef} src={currentVideoUrl} autoPlay muted={isMuted} loop playsInline className="w-full h-full object-cover" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} /> : <div className="w-full h-full flex items-center justify-center text-white/30">No preview video</div>}</div><div className="mt-3 flex gap-2"><button onClick={togglePlay} className="p-2 rounded-lg bg-white/10 text-white">{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button><button onClick={toggleMute} className="p-2 rounded-lg bg-white/10 text-white">{isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>{safeVideoClips.length > 0 && <span className="text-xs text-white/40 self-center">{safeVideoClips.length} video clips</span>}</div></div>
      </div>
      {showManageModal && <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"><div className="w-full max-w-lg rounded-2xl bg-[#101010] border border-white/10 p-6"><div className="flex justify-between"><h2 className="text-white font-bold">Manage Photos</h2><button onClick={() => setShowManageModal(false)}><X className="text-white" /></button></div><form onSubmit={handleSavePhoto} className="mt-5 space-y-3"><input value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} placeholder="Photo URL" className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10" /><input value={newPhotoTitle} onChange={e => setNewPhotoTitle(e.target.value)} placeholder="Title" className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10" /><input value={newPhotoLocation} onChange={e => setNewPhotoLocation(e.target.value)} placeholder="Location" className="w-full p-3 rounded-lg bg-white/5 text-white border border-white/10" /><label className="flex items-center gap-2 p-3 rounded-lg bg-white/5 text-white/70 cursor-pointer"><Upload className="w-4 h-4" /> Upload photo<input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" /></label><button type="submit" className="w-full py-3 rounded-lg bg-red-600 text-white font-bold">Save Photo</button><button type="button" onClick={handleResetDefaults} className="w-full py-3 rounded-lg bg-white/10 text-white">Reset Defaults</button></form></div></div>}
    </div>
  );
};
