import React, { useEffect, useRef, useState } from 'react';
import { useCafe } from '../context/CafeContext';
import { GamingServiceCategory } from '../types';
import { Monitor, Gamepad2, Gauge, Glasses, Volume2, VolumeX, ArrowUpRight, Radio, Sparkles, Zap, Play } from 'lucide-react';

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
  objectPosition: string;
}

const FEATURED_CATEGORIES: CategoryCard[] = [
  { category: 'PS5', title: 'PlayStation 5', eyebrow: 'CONSOLE / 4K 120HZ', description: 'DualSense gaming, cinematic exclusives and competitive couch play.', specs: 'Spider-Man 2 • FC 26 • Tekken 8', videoUrl: '/videos/ps5.mp4', fallbackPoster: '/videos/ps5_thumb.jpg', accent: 'red', icon: <Gamepad2 className="h-5 w-5" />, objectPosition: '50% 48%' },
  { category: 'Xbox', title: 'Xbox Series X', eyebrow: 'CONSOLE / GAME PASS', description: 'Fast loading, HDR gaming and a huge multiplayer library.', specs: 'Forza • Halo • EA FC', videoUrl: '/videos/xbox.mp4', fallbackPoster: '/videos/xbox_thumb.jpg', accent: 'emerald', icon: <Gamepad2 className="h-5 w-5" />, objectPosition: '54% 48%' },
  { category: 'Gaming PC', title: 'Battle Rigs', eyebrow: 'PC / ESPORTS', description: 'High-refresh competitive rigs built for serious sessions.', specs: 'Valorant • CS2 • GTA V • Warzone', videoUrl: '/videos/pc_rig.mp4', fallbackPoster: 'https://shared.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg', accent: 'cyan', icon: <Monitor className="h-5 w-5" />, objectPosition: '52% 45%' },
  { category: 'VR', title: 'VR Arena', eyebrow: 'IMMERSIVE / 6DOF', description: 'Step inside the game with room-scale virtual reality.', specs: 'Beat Saber • Alyx • Motion Arena', videoUrl: '/videos/vr.mp4', fallbackPoster: 'https://shared.steamstatic.com/store_item_assets/steam/apps/620980/library_hero.jpg', accent: 'violet', icon: <Glasses className="h-5 w-5" />, objectPosition: '50% 42%' },
  { category: 'Sim Racing', title: 'Sim Racing', eyebrow: 'DIRECT DRIVE / TRIPLE SCREEN', description: 'Get behind the wheel with force feedback and race-ready hardware.', specs: 'F1 • Assetto Corsa • iRacing', videoUrl: '/videos/sim_racing.mp4', fallbackPoster: '/videos/sim_racing_thumb.jpg', accent: 'orange', icon: <Gauge className="h-5 w-5" />, objectPosition: '50% 50%' }
];

const accentStyles: Record<string, { text: string; border: string; glow: string; wash: string }> = {
  red: { text: 'text-red-400', border: 'group-hover:border-red-500/60', glow: 'group-hover:shadow-[0_30px_100px_rgba(220,38,38,0.25)]', wash: 'bg-red-500/10' },
  emerald: { text: 'text-emerald-400', border: 'group-hover:border-emerald-500/50', glow: 'group-hover:shadow-[0_30px_100px_rgba(16,185,129,0.18)]', wash: 'bg-emerald-500/10' },
  cyan: { text: 'text-cyan-400', border: 'group-hover:border-cyan-500/50', glow: 'group-hover:shadow-[0_30px_100px_rgba(6,182,212,0.18)]', wash: 'bg-cyan-500/10' },
  violet: { text: 'text-violet-400', border: 'group-hover:border-violet-500/50', glow: 'group-hover:shadow-[0_30px_100px_rgba(139,92,246,0.18)]', wash: 'bg-violet-500/10' },
  orange: { text: 'text-orange-400', border: 'group-hover:border-orange-500/50', glow: 'group-hover:shadow-[0_30px_100px_rgba(249,115,22,0.18)]', wash: 'bg-orange-500/10' }
};

export const FuzzyConsoleButtons: React.FC<FuzzyConsoleButtonsProps> = ({ onSelectConsole }) => {
  const { getRateForService, systems } = useCafe();
  const wallRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURED_CATEGORIES.map((item) => [item.category, true]))
  );
  const [activeIndex, setActiveIndex] = useState(0);

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

  useEffect(() => {
    const wall = wallRef.current;
    if (!wall) return;
    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    wall.addEventListener('mouseenter', pause);
    wall.addEventListener('mouseleave', resume);
    wall.addEventListener('focusin', pause);
    wall.addEventListener('focusout', resume);

    const timer = window.setInterval(() => {
      if (paused) return;
      setActiveIndex((current) => {
        const next = (current + 1) % FEATURED_CATEGORIES.length;
        const card = wall.querySelector<HTMLElement>(`[data-arena-index="${next}"]`);
        if (card) {
          const targetLeft = card.offsetLeft - Math.max(0, (wall.clientWidth - card.offsetWidth) / 2);
          wall.scrollTo({ left: targetLeft, behavior: 'smooth' });
        }
        return next;
      });
    }, 5000);

    return () => {
      window.clearInterval(timer);
      wall.removeEventListener('mouseenter', pause);
      wall.removeEventListener('mouseleave', resume);
      wall.removeEventListener('focusin', pause);
      wall.removeEventListener('focusout', resume);
    };
  }, []);

  useEffect(() => {
    FEATURED_CATEGORIES.forEach((item) => {
      const video = videoRefs.current[item.category];
      if (video) video.playbackRate = 0.88;
    });
  }, []);

  return (
    <section id="console-fuzzy-buttons-section" className="relative mt-8 w-full sm:mt-12 lg:mt-16">
      <div className="mb-7 flex flex-col gap-5 px-1 sm:mb-9 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.42em] text-red-500"><Sparkles className="h-3.5 w-3.5" />Choose your arena</div>
          <h2 className="text-[clamp(2.25rem,5vw,4.75rem)] font-black uppercase leading-[0.9] tracking-[-0.055em] text-white">Your game.<br /><span className="text-white/35">Your arena.</span></h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">Cinematic arena previews. Swipe to explore.</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/45"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>Auto preview</div>
      </div>

      <div ref={wallRef} className="category-wall flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-6 sm:gap-5 lg:gap-6" style={{ scrollbarWidth: 'none', touchAction: 'pan-x' }}>
        {FEATURED_CATEGORIES.map((item, index) => {
          const style = accentStyles[item.accent];
          const availableCount = getAvailableCount(item.category);
          const isMuted = mutedStates[item.category];
          const isActive = activeIndex === index;

          return (
            <button key={item.category} data-arena-index={index} type="button" onClick={() => onSelectConsole(item.category)} onFocus={() => setActiveIndex(index)} onMouseEnter={() => setActiveIndex(index)} className={`category-card group relative h-[min(82vh,900px)] min-h-[650px] w-[min(76vw,900px)] min-w-[320px] shrink-0 snap-center overflow-hidden rounded-[32px] border border-white/10 bg-[#050505] text-left shadow-[0_25px_90px_rgba(0,0,0,0.6)] outline-none transition-all duration-700 ease-out sm:w-[min(68vw,920px)] lg:w-[min(62vw,960px)] ${style.border} ${style.glow} ${isActive ? 'scale-[1.015] opacity-100' : 'scale-[0.97] opacity-70 hover:scale-[0.99] hover:opacity-90'}`}>
              <div className="absolute inset-0 overflow-hidden bg-black">
                <video
                  ref={(node) => { videoRefs.current[item.category] = node; }}
                  src={item.videoUrl}
                  poster={item.fallbackPoster}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  className={`h-full w-full object-cover transition-[transform,filter,opacity] duration-[1800ms] ease-out ${isActive ? 'scale-[1.09] opacity-95 saturate-[1.12] contrast-[1.08] brightness-[0.78]' : 'scale-100 opacity-60 saturate-[0.75] contrast-[1.04] brightness-[0.62] group-hover:scale-[1.07] group-hover:opacity-85'}`}
                  style={{ objectPosition: item.objectPosition }}
                />

                {/* Cinematic color grade + anamorphic lighting */}
                <div className={`absolute inset-0 ${style.wash} mix-blend-screen opacity-25`} />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,255,255,0.16),transparent_20%),radial-gradient(circle_at_20%_80%,rgba(220,38,38,0.12),transparent_32%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,transparent_30%,transparent_55%,rgba(0,0,0,0.94)_100%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.2)_100%)]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-black/35" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-black/55" />
                <div className="cinematic-film-grain pointer-events-none absolute inset-0 opacity-[0.10]" />
                <div className="cinematic-scanlines pointer-events-none absolute inset-0 opacity-[0.06]" />
                <div className="cinematic-light-sweep pointer-events-none absolute -inset-y-1/2 -left-1/3 w-1/3 rotate-[18deg] bg-white/10 blur-3xl" />
              </div>

              <div className="absolute left-5 right-5 top-5 z-10 flex items-center justify-between sm:left-7 sm:right-7 sm:top-7">
                <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.22em] text-white/75 backdrop-blur-xl"><Radio className="h-3 w-3 text-red-500" />Cinematic preview</span>
                <span onClick={(event) => toggleMute(event, item.category)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/70 backdrop-blur-xl transition hover:bg-white/15 hover:text-white" role="button" aria-label={isMuted ? 'Unmute video' : 'Mute video'}>{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className={`h-4 w-4 ${style.text}`} />}</span>
              </div>

              <div className="absolute left-6 right-6 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between pointer-events-none sm:left-8 sm:right-8">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 backdrop-blur-xl transition duration-500 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-40'}`}><Play className="ml-0.5 h-5 w-5 fill-current" /></div>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/45 backdrop-blur-xl">Preview {String(index + 1).padStart(2, '0')} / 05</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-8 lg:p-9">
                <div className="mb-4 flex flex-wrap items-center gap-2"><span className={`text-[9px] font-black uppercase tracking-[0.3em] ${style.text}`}>{item.eyebrow}</span>{index === 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-white">Most popular</span>}</div>
                <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/45 text-white backdrop-blur-xl transition group-hover:scale-105">{item.icon}</span><h3 className="text-3xl font-black uppercase leading-none tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">{item.title}</h3></div>
                <p className="mt-5 max-w-[580px] text-sm leading-7 text-white/60 sm:text-base">{item.description}</p>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-white/30">{item.specs}</p>
                <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between"><div><span className="block text-[8px] font-bold uppercase tracking-[0.25em] text-white/30">From</span><span className="font-mono text-2xl font-black text-white">₹{getRateForService(item.category)}<span className="text-[10px] font-normal text-white/35"> / hr</span></span></div><span className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.16em] text-white/65 transition group-hover:border-white/20 group-hover:bg-white/10"><span className={`h-1.5 w-1.5 rounded-full ${availableCount > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />{availableCount > 0 ? `${availableCount} ready` : 'Check availability'}<ArrowUpRight className={`h-3.5 w-3.5 ${style.text}`} /></span></div>
                <div className="mt-4 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/25 transition group-hover:text-white/50"><Zap className={`h-3 w-3 ${style.text}`} />Tap to enter game library</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
