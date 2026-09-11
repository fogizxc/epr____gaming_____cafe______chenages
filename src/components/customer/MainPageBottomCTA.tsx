import React from 'react';
import { ArrowRight, Calendar, Gamepad2, Headphones, Monitor, Sparkles, Trophy } from 'lucide-react';
import { GamingServiceCategory } from '../../types';

interface MainPageBottomCTAProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
  onOpenGames: () => void;
  onOpenTournaments: () => void;
}

/**
 * Cinematic end-of-page CTA inspired by the supplied Bytes & Brew gaming
 * reference: black/red lighting, hero monitor composition and strong CTA.
 */
export const MainPageBottomCTA: React.FC<MainPageBottomCTAProps> = ({
  onOpenBooking,
  onOpenGames,
  onOpenTournaments
}) => {
  return (
    <section
      id="main-page-bottom-cta"
      className="relative isolate overflow-hidden rounded-[2rem] border border-red-500/20 bg-[#030303] min-h-[430px] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
    >
      {/* Cinematic lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(220,38,38,0.20),transparent_30%),radial-gradient(circle_at_12%_70%,rgba(220,38,38,0.14),transparent_25%),radial-gradient(circle_at_88%_70%,rgba(220,38,38,0.14),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-red-950/30 to-transparent" />

      {/* Vertical RGB light columns */}
      <div className="pointer-events-none absolute left-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-red-500/70 to-transparent shadow-[0_0_25px_rgba(239,68,68,0.7)]" />
      <div className="pointer-events-none absolute left-[18%] top-8 h-[78%] w-px bg-gradient-to-b from-transparent via-red-600/50 to-transparent" />
      <div className="pointer-events-none absolute right-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-red-500/70 to-transparent shadow-[0_0_25px_rgba(239,68,68,0.7)]" />
      <div className="pointer-events-none absolute right-[18%] top-8 h-[78%] w-px bg-gradient-to-b from-transparent via-red-600/50 to-transparent" />

      {/* Background hardware silhouettes */}
      <div className="pointer-events-none absolute -left-20 bottom-[-80px] h-[330px] w-[250px] rounded-[45%_45%_15%_15%] border border-red-500/20 bg-black shadow-[inset_-12px_0_30px_rgba(220,38,38,0.12)] rotate-[-5deg]" />
      <div className="pointer-events-none absolute -right-16 bottom-[-30px] h-[280px] w-[190px] rounded-[35px] border border-red-500/20 bg-black shadow-[inset_15px_0_35px_rgba(220,38,38,0.12)]" />
      <div className="pointer-events-none absolute right-[-8px] top-[27%] h-28 w-28 rounded-full border border-red-500/20 bg-black/80 shadow-[0_0_45px_rgba(220,38,38,0.12)]" />

      <div className="relative z-10 flex min-h-[430px] flex-col items-center justify-center px-5 py-14 text-center sm:px-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.28em] text-red-400 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
          Bytes &amp; Brew Gaming Arena
        </div>

        {/* Monitor-inspired content frame */}
        <div className="relative w-full max-w-4xl rounded-[1.5rem] border border-white/10 bg-black/55 px-5 py-8 shadow-[0_0_70px_rgba(220,38,38,0.13)] backdrop-blur-sm sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_25%,transparent_75%,rgba(220,38,38,0.05))]" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.35em] text-white/55">
              <span>Play</span><span className="text-red-500">•</span>
              <span>Compete</span><span className="text-red-500">•</span>
              <span>Connect</span>
            </div>

            <h2 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.045em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] sm:text-6xl lg:text-7xl">
              The Ultimate
              <span className="block text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.25)]">Gaming Experience</span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Console. PC. VR. Sim Racing. Everything you need for your next session,
              one premium arena and one tap away.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                id="bottom-cta-book-now"
                onClick={() => onOpenBooking('Gaming PC')}
                className="group inline-flex items-center gap-3 rounded-xl bg-red-600 px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_12px_35px_rgba(220,38,38,0.28)] transition-all hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_16px_45px_rgba(220,38,38,0.4)] active:scale-[0.98]"
              >
                <Calendar className="h-4 w-4" />
                Book Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="bottom-cta-explore-games"
                onClick={onOpenGames}
                className="inline-flex items-center gap-3 rounded-xl border border-white/25 bg-black/40 px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/10 active:scale-[0.98]"
              >
                <Gamepad2 className="h-4 w-4" />
                Explore Games
              </button>
            </div>
          </div>
        </div>

        {/* Bottom hardware feature rail */}
        <div className="mt-7 grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: Monitor, label: 'Gaming PC', value: 'High FPS rigs' },
            { icon: Gamepad2, label: 'Console', value: 'PS5 + Xbox' },
            { icon: Headphones, label: 'Immersive', value: 'VR ready' },
            { icon: Trophy, label: 'Compete', value: 'Live tournaments' }
          ].map(({ icon: Icon, label, value }) => (
            <button
              key={label}
              onClick={label === 'Compete' ? onOpenTournaments : label === 'Gaming PC' ? () => onOpenBooking('Gaming PC') : onOpenGames}
              className="group rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 text-left transition hover:border-red-500/30 hover:bg-red-500/[0.06]"
            >
              <Icon className="mb-2 h-4 w-4 text-red-400 transition-transform group-hover:scale-110" />
              <span className="block text-[10px] font-black uppercase tracking-wider text-white">{label}</span>
              <span className="mt-0.5 block text-[9px] text-white/40">{value}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">
          <Sparkles className="h-3 w-3 text-red-500/70" />
          Built for gamers • Designed for the next session
        </div>
      </div>
    </section>
  );
};
