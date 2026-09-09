import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import {
  Gamepad2,
  Calendar,
  Wallet,
  Coffee,
  Trophy,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  Tv,
  CheckCircle2,
  QrCode,
  ShieldAlert,
  ChevronRight,
  PlusCircle,
  Play,
  Zap,
  Star
} from 'lucide-react';
import { GamingServiceCategory, HeroGameSlide } from '../../types';
import { HeroSlider } from '../HeroSlider';
import { FuzzyConsoleButtons } from '../FuzzyConsoleButtons';
import { CONSOLE_GAMES_DATABASE } from '../../data/consoleGamesData';

interface CustomerHomeDashboardProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
  onOpenFnB?: (sessionId: string) => void;
  onSelectGameForBooking?: (game: { title: string; category?: GamingServiceCategory; coverUrl?: string }) => void;
  onViewGameOverview?: (game: HeroGameSlide) => void;
}

export const CustomerHomeDashboard: React.FC<CustomerHomeDashboardProps> = ({
  onOpenBooking,
  onOpenFnB,
  onSelectGameForBooking,
  onViewGameOverview
}) => {
  const {
    currentUser,
    currentRole,
    walletBalance,
    loyaltyPoints,
    customerMembership,
    activeSessions,
    bookings,
    systems,
    setActiveNav,
    setSelectedGameForBooking,
    requireLogin
  } = useCafe();

  // Find active live session for this customer
  const myActiveSession = activeSessions.find(
    (s) => s.status === 'ACTIVE'
  );

  // Find next upcoming booking
  const nextBooking = bookings.find(
    (b) => b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED'
  );

  // Time remaining countdown for active session
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(() => {
    if (myActiveSession?.endTime) {
      return Math.max(0, Math.floor((myActiveSession.endTime - Date.now()) / 1000));
    }
    return 0;
  });

  useEffect(() => {
    if (!myActiveSession?.endTime) return;
    const interval = setInterval(() => {
      setSessionSecondsLeft(Math.max(0, Math.floor((myActiveSession.endTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [myActiveSession?.endTime]);

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Top trending games list
  const trendingGames = CONSOLE_GAMES_DATABASE.slice(0, 8);

  return (
    <div id="customer-home-dashboard" className="flex flex-col gap-8 pb-12 animate-fadeIn select-none">
      {/* 1. HERO SLIDER */}
      <section>
        <HeroSlider
          onOpenOverview={(game) => {
            if (onViewGameOverview) {
              onViewGameOverview(game);
            } else {
              setActiveNav('games');
            }
          }}
          onSelectGameForBooking={(game, category) => {
            requireLogin(() => {
              if (onSelectGameForBooking) {
                onSelectGameForBooking({
                  title: game.title,
                  category: category || 'Gaming PC',
                  coverUrl: game.coverUrl
                });
              }
              onOpenBooking(category || 'Gaming PC');
            }, `Please log in to reserve a station for ${game?.title}.`);
          }}
        />
      </section>

      {/* 2. CUSTOMER WELCOME BANNER & STATS BAR */}
      <section className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.4)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'}
              alt="Avatar"
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-red-600/50 shadow-lg shadow-red-600/10"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0d0d0d] rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                Welcome Back, {currentUser?.gamerTag || currentUser?.name || 'Gamer'}
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {customerMembership?.planName || 'Elite Member'}
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5 flex items-center gap-2">
              <span>Gamer ID: <strong className="text-white/80 font-mono">GC-8921</strong></span>
              <span className="text-white/20">•</span>
              <span className="text-emerald-400 font-bold">● High-Speed Fiber Active</span>
              <span className="text-white/20">•</span>
              <span className="text-white/60">Bytes & Brew Mumbai Arena</span>
            </p>
          </div>
        </div>

        {/* Quick Balance & XP Badges */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Wallet Balance Card */}
          <div className="flex-1 sm:flex-none p-3.5 px-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3 min-w-[150px]">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Wallet Balance</span>
              <span className="text-lg font-black text-white font-mono tracking-tight">₹{walletBalance.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setActiveNav('wallet')}
              className="ml-auto p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="Recharge Wallet"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Loyalty Points Card */}
          <div className="flex-1 sm:flex-none p-3.5 px-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3 min-w-[150px]">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Nexus Rewards</span>
              <span className="text-lg font-black text-amber-400 font-mono tracking-tight">{loyaltyPoints.toLocaleString()} <span className="text-[10px] text-white/50">XP</span></span>
            </div>
            <button
              onClick={() => setActiveNav('rewards')}
              className="ml-auto p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
              title="View Rewards"
            >
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Membership Hours Card */}
          <div className="flex-1 sm:flex-none p-3.5 px-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3 min-w-[150px]">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Available Hours</span>
              <span className="text-lg font-black text-white font-mono tracking-tight">
                {customerMembership?.normalHoursRemaining || 12}h <span className="text-[10px] text-white/40">VIP {customerMembership?.vipHoursRemaining || 4}h</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE SESSION ALERT BANNER (IF CUSTOMER HAS ACTIVE SESSION) */}
      {myActiveSession && (
        <section className="p-6 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#120a0a] to-[#0c0c0c] border-2 border-red-600/40 shadow-[0_0_30px_rgba(220,38,38,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500">
              <Tv className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-red-500">
                  Live Session In Progress
                </span>
                <span className="text-xs font-mono font-bold text-white/60">
                  Station: <strong className="text-white font-black">{myActiveSession.systemName}</strong>
                </span>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
                Currently Playing: {myActiveSession.gameTitle || 'Apex Legends / Valorant'}
              </h3>
              <p className="text-xs text-white/60 font-light mt-0.5">
                Started {new Date(myActiveSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Gaming: ₹{myActiveSession.totalAmount - myActiveSession.foodTotal} • F&B Orders: ₹{myActiveSession.foodTotal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Live Countdown Timer */}
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-white/50 block font-bold">Time Left</span>
              <span className="text-2xl font-black text-red-400 font-mono tracking-wider">
                {formatCountdown(sessionSecondsLeft)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenFnB && (
                <button
                  onClick={() => onOpenFnB(myActiveSession.id)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Order F&B</span>
                </button>
              )}
              <button
                onClick={() => setActiveNav('livesession')}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Live Controls</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. UPCOMING BOOKING NOTIFICATION CARD (IF EXISTS) */}
      {nextBooking && !myActiveSession && (
        <section className="p-5 px-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                Upcoming Reservation
              </span>
              <h4 className="text-sm font-bold text-white">
                {nextBooking.systemName} • {nextBooking.date} at {nextBooking.startTime} ({nextBooking.durationHours}h)
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setActiveNav('reservations')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>View QR Pass</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. QUICK ACTION HUB (5 ONE-CLICK ACTIONS) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          id="btn-quick-book"
          onClick={() => onOpenBooking('Gaming PC')}
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-red-600/10 border border-white/10 hover:border-red-600/40 transition-all flex flex-col items-start gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">Book Station</span>
            <span className="text-[10px] text-white/50">Instant rig reservation</span>
          </div>
        </button>

        <button
          id="btn-quick-games"
          onClick={() => setActiveNav('games')}
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 transition-all flex flex-col items-start gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">Browse Games</span>
            <span className="text-[10px] text-white/50">300+ Pre-installed titles</span>
          </div>
        </button>

        <button
          id="btn-quick-fnb"
          onClick={() => setActiveNav('fnb')}
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-amber-600/10 border border-white/10 hover:border-amber-600/40 transition-all flex flex-col items-start gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">Artisan Café</span>
            <span className="text-[10px] text-white/50">Cold brews, burgers & snacks</span>
          </div>
        </button>

        <button
          id="btn-quick-wallet"
          onClick={() => setActiveNav('wallet')}
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-emerald-600/10 border border-white/10 hover:border-emerald-600/40 transition-all flex flex-col items-start gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">Top-up Wallet</span>
            <span className="text-[10px] text-white/50">Get up to 15% bonus</span>
          </div>
        </button>

        <button
          id="btn-quick-tournaments"
          onClick={() => setActiveNav('tournaments')}
          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-purple-600/10 border border-white/10 hover:border-purple-600/40 transition-all flex flex-col items-start gap-2.5 group cursor-pointer text-left col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">Tournaments</span>
            <span className="text-[10px] text-white/50">₹50K+ Monthly prize pool</span>
          </div>
        </button>
      </section>

      {/* 6. CONSOLE STATION ACCESS - FUZZY BUTTONS WITH VIDEO FEEDS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-600 block">Hardware Fleets</span>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Reserve by Gaming Platform
            </h2>
          </div>
          <button
            onClick={() => setActiveNav('discover')}
            className="text-xs text-white/60 hover:text-white transition flex items-center gap-1 font-bold uppercase tracking-wider"
          >
            <span>All Platforms</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <FuzzyConsoleButtons
          onSelectConsole={(category) => {
            requireLogin(
              () => onOpenBooking(category),
              `Please log in to reserve a ${category} station.`
            );
          }}
        />
      </section>

      {/* 7. TOP TRENDING GAMES GRID */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-red-600 block">Verified & Installed</span>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Top Trending Arena Games
            </h2>
          </div>
          <button
            onClick={() => setActiveNav('games')}
            className="text-xs text-white/60 hover:text-white transition flex items-center gap-1 font-bold uppercase tracking-wider"
          >
            <span>View All 300+ Games</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {trendingGames.map((game) => (
            <div
              key={game.id}
              className="group relative rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-white/30 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl"
            >
              {/* Cover Art (600x900 Steam / Official Ratio) */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
                <img
                  src={game.coverUrl}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Rating Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-black/80 text-amber-400 border border-amber-500/30 backdrop-blur-sm flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{game.rating}</span>
                  </span>
                </div>

                {/* Platform Badges */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1">
                  {game.platforms.slice(0, 2).map((p) => (
                    <span
                      key={p}
                      className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title & Quick Action */}
              <div className="p-3 flex flex-col gap-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate group-hover:text-red-400 transition-colors">
                  {game.title}
                </h4>
                <div className="flex items-center justify-between text-[9px] text-white/50">
                  <span>{game.category}</span>
                  <span className="text-emerald-400 font-bold">● Ready to Play</span>
                </div>

                <button
                  onClick={() => {
                    requireLogin(() => {
                      if (onSelectGameForBooking) {
                        onSelectGameForBooking({
                          title: game.title,
                          category: game.platforms[0] || 'Gaming PC',
                          coverUrl: game.coverUrl
                        });
                      }
                      onOpenBooking(game.platforms[0] || 'Gaming PC');
                    }, `Please log in to book a station for ${game.title}.`);
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold text-[10px] uppercase tracking-wider transition text-center cursor-pointer active:scale-98"
                >
                  Book This Game
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
