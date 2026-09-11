import React, { useState, useEffect, useRef } from 'react';
import { useCafe } from '../context/CafeContext';
import { HeroGameSlide, GamingServiceCategory } from '../types';
import { Star } from 'lucide-react';

interface HeroSliderProps {
  onSelectGameForBooking?: (game: HeroGameSlide, category?: GamingServiceCategory) => void;
  onOpenOverview: (game: HeroGameSlide) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  onSelectGameForBooking,
  onOpenOverview
}) => {
  const { heroGames } = useCafe();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Touch / pointer swipe states
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGame = heroGames[currentIndex] || heroGames[0];
  const SLIDE_DURATION = 5000;

  // Automatic hero rotation stays enabled without a visible progress bar.
  useEffect(() => {
    if (heroGames.length <= 1 || isDragging) return;

    const timer = window.setTimeout(() => {
      setCurrentIndex((curr) => (curr + 1) % heroGames.length);
    }, SLIDE_DURATION);

    return () => window.clearTimeout(timer);
  }, [currentIndex, isDragging, heroGames.length]);

  // Restart the background video when the hero changes.
  useEffect(() => {
    setIsVideoLoaded(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    sliderRef.current?.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
    setCurrentTranslate(0);
    setHasMoved(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const diffX = e.clientX - startX;
    const diffY = e.clientY - startY;

    // Ignore mostly-vertical movement so normal page scrolling still works.
    if (!hasMoved && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
      return;
    }

    if (Math.abs(diffX) > 8) setHasMoved(true);
    setCurrentTranslate(diffX);
  };

  const finishSwipe = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const diffX = e.clientX - startX;
    const diffY = e.clientY - startY;
    const wasClick = !hasMoved && Math.abs(diffX) < 10 && Math.abs(diffY) < 10;
    const swipeThreshold = Math.max(50, Math.min(100, (sliderRef.current?.clientWidth || 400) * 0.12));

    setIsDragging(false);

    if (sliderRef.current?.hasPointerCapture?.(e.pointerId)) {
      sliderRef.current.releasePointerCapture(e.pointerId);
    }

    if (wasClick) {
      setCurrentTranslate(0);
      setHasMoved(false);
      onOpenOverview(currentGame);
      return;
    }

    if (Math.abs(diffX) >= swipeThreshold && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        setCurrentIndex((prev) => (prev + 1) % heroGames.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + heroGames.length) % heroGames.length);
      }
    }

    setCurrentTranslate(0);
    setHasMoved(false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => finishSwipe(e);

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sliderRef.current?.hasPointerCapture?.(e.pointerId)) {
      sliderRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    setCurrentTranslate(0);
    setHasMoved(false);
  };

  if (!currentGame) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        id="hero-slider-main"
        ref={sliderRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#050505] border border-white/10 select-none cursor-pointer shadow-[0_0_35px_rgba(0,0,0,0.85)] hover:border-white/30 transition-all min-h-[460px] sm:min-h-[580px] lg:min-h-[700px] xl:min-h-[760px] flex flex-col justify-between p-5 sm:p-8 lg:p-14"
        style={{ touchAction: 'pan-y' }}
        title="Swipe left or right to change games • Tap to view game overview"
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url(${currentGame.bannerUrl})`,
              filter: 'brightness(0.62) contrast(1.15)',
              transform: `translateX(${currentTranslate}px)`
            }}
          />

          {currentGame.videoPreviewUrl && (
            <video
              ref={videoRef}
              key={currentGame.id + '-' + currentGame.videoPreviewUrl}
              src={currentGame.videoPreviewUrl}
              autoPlay
              loop
              muted
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

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

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
        </div>

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
      </div>
    </div>
  );
};
