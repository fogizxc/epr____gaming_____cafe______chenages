import React, { useState, useEffect, useRef } from 'react';
import { useCafe } from '../context/CafeContext';
import { HeroGameSlide, GamingServiceCategory } from '../types';
import {
  Star,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Radio
} from 'lucide-react';

interface HeroSliderProps {
  onSelectGameForBooking?: (game: HeroGameSlide, category?: GamingServiceCategory) => void;
  onOpenOverview: (game: HeroGameSlide) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  onSelectGameForBooking,
  onOpenOverview
}) => {
  const { heroGames, systems } = useCafe();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);

  // Drag / swipe states
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGame = heroGames[currentIndex] || heroGames[0];
  const SLIDE_DURATION = 7000; // 7.0s per slide (extended video time)

  // Active Auto-sliding timer that runs reliably
  useEffect(() => {
    if (isDragging) return;

    const stepMs = 50;
    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((curr) => (curr + 1) % heroGames.length);
          return 0;
        }
        return prev + (stepMs / SLIDE_DURATION) * 100;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [isDragging, heroGames.length]);

  // Reset slide progress and video state when slide index changes
  useEffect(() => {
    setSlideProgress(0);
    setIsVideoLoaded(false);

    // Auto-play the video when slide changes
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {
        // Fallback for browser autoplay policies
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [currentIndex, isMuted]);

  // Handle Mute / Unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Next / Previous Slide
  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + heroGames.length) % heroGames.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % heroGames.length);
  };

  // Pointer / Mouse drag and click handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
    setCurrentTranslate(0);
    setHasMoved(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const diffX = e.clientX - startX;
    if (Math.abs(diffX) > 8) {
      setHasMoved(true);
    }
    setCurrentTranslate(diffX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const diffX = e.clientX - startX;
    const diffY = e.clientY - startY;

    // If pointer was simply clicked without dragging -> redirect to overview page!
    if (!hasMoved && Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
      setCurrentTranslate(0);
      onOpenOverview(currentGame);
      return;
    }

    // Swipe threshold
    if (currentTranslate < -60) {
      // Swiped left -> next
      setCurrentIndex((prev) => (prev + 1) % heroGames.length);
    } else if (currentTranslate > 60) {
      // Swiped right -> prev
      setCurrentIndex((prev) => (prev - 1 + heroGames.length) % heroGames.length);
    }
    setCurrentTranslate(0);
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setCurrentTranslate(0);
    setHasMoved(false);
  };

  // Live available rigs for current game's platforms
  const availableRigsCount = systems.filter(
    (s) =>
      currentGame.platforms?.some(
        (p) =>
          s.category === p ||
          (p === 'PS5' && s.category === 'PlayStation') ||
          (p === 'PC' && s.category === 'Gaming PC')
      ) && s.status === 'AVAILABLE'
  ).length;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Full-width Panoramic Hero Screen - Auto-Sliding with Live Background Video */}
      <div
        id="hero-slider-main"
        ref={sliderRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#050505] border border-white/10 select-none cursor-pointer shadow-[0_0_35px_rgba(0,0,0,0.85)] hover:border-white/30 transition-all min-h-[460px] sm:min-h-[580px] lg:min-h-[700px] xl:min-h-[760px] flex flex-col justify-between p-5 sm:p-8 lg:p-14"
        style={{ touchAction: 'pan-y' }}
        title="Click anywhere to view game overview & gameplay reels"
      >
        {/* Background Media Container: Poster Fallback + Live 4K Video */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Fallback Artwork (loads instantly) */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url(${currentGame.bannerUrl})`,
              filter: 'brightness(0.62) contrast(1.15)',
              transform: `translateX(${currentTranslate}px)`
            }}
          />

          {/* Live Auto-Playing Background Video */}
          {currentGame.videoPreviewUrl && (
            <video
              ref={videoRef}
              key={currentGame.id + '-' + currentGame.videoPreviewUrl}
              src={currentGame.videoPreviewUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onLoadedData={() => setIsVideoLoaded(true)}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{
                filter: 'brightness(0.68) contrast(1.15)',
                transform: `translateX(${currentTranslate}px)`,
                opacity: isVideoLoaded ? 1 : 0.85
              }}
            />
          )}
        </div>

        {/* Gradient Overlays for deep contrast and cinematic typography */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

        {/* Auto-Slide Progress Bar at top of hero */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-400 transition-all duration-75"
            style={{ width: `${slideProgress}%` }}
          />
        </div>

        {/* Top Meta Bar: Category Tag, Live Status, Video Indicator & Audio Toggle */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 pointer-events-none">
            <span className="bg-red-600 text-white text-[11px] uppercase font-black tracking-widest px-3.5 py-1.5 rounded-full shadow-md">
              Featured Experience
            </span>
            {currentGame.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full font-bold bg-white/10 text-white/90 border border-white/15 backdrop-blur-md hidden sm:inline-block"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Real-time Status, Video Reel Indicator & Sound Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Live Reel Badge */}
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-white/90 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-red-500" />
                <span>Live 4K Reel</span>
              </span>
            </div>

            {/* Live Rigs Availability */}
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-white">
                {availableRigsCount > 0 ? `${availableRigsCount} Rigs Ready` : 'Stations Free'}
              </span>
            </div>

            {/* Video Sound Toggle Button */}
            <button
              id="btn-hero-toggle-sound"
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 bg-black/70 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition cursor-pointer active:scale-95 z-30"
              title={isMuted ? 'Unmute video reel audio' : 'Mute video reel audio'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/70" />
                  <span className="hidden sm:inline">Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span className="text-red-400 hidden sm:inline">Sound On</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center / Hero Information (Game Title & Subtitle) */}
        <div className="relative z-20 my-auto py-4 sm:py-8 max-w-3xl pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 text-red-500 mb-2 sm:mb-3 font-mono text-[11px] sm:text-xs uppercase tracking-widest font-semibold">
            <span>{currentGame.category}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>{currentGame.rating}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-white uppercase leading-[1.0] drop-shadow-2xl">
            {currentGame.title}
          </h1>

          <p className="mt-2.5 sm:mt-5 text-xs sm:text-base lg:text-lg text-white/80 font-light leading-relaxed tracking-wide drop-shadow-md max-w-2xl line-clamp-2 sm:line-clamp-3">
            {currentGame.tagline}
          </p>
        </div>

        {/* Bottom Bar: Platforms & Live Lounge Presence */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60 pt-4 sm:pt-6 border-t border-white/15 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-mono text-white/40">
              Available:
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentGame.platforms.map((plat) => (
                <span
                  key={plat}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-white/10 text-white text-[10px] sm:text-[11px] font-bold tracking-wider border border-white/10"
                >
                  {plat}
                </span>
              ))}
            </div>
          </div>

          {/* Active Player Stack */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px]">
            <div className="flex -space-x-1.5">
              <img
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-black object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
                alt="Player"
              />
              <img
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-black object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop"
                alt="Player"
              />
            </div>
            <span className="uppercase tracking-wider font-semibold text-white/90">
              17 in arena
            </span>
          </div>
        </div>

        {/* Left & Right Arrow Slide Navigation Buttons */}
        <button
          id="btn-hero-prev-slide"
          type="button"
          onClick={handlePrevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white flex items-center justify-center transition cursor-pointer shadow-xl active:scale-95"
          title="Previous game slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          id="btn-hero-next-slide"
          type="button"
          onClick={handleNextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white flex items-center justify-center transition cursor-pointer shadow-xl active:scale-95"
          title="Next game slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
