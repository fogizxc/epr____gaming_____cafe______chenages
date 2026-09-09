import React from 'react';
import { useCafe } from '../context/CafeContext';
import {
  Gamepad2,
  Trophy,
  Receipt,
  Calendar,
  Crown,
  Flame,
  Tv,
  X,
  Menu,
  Sparkles,
  Users,
  ChevronRight,
  History,
  Lock,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  onOpenQuickWalkIn?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const {
    activeNav,
    setActiveNav,
    currentRole,
    isLoggedIn,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalReason,
    logout,
    mobileMenuOpen,
    setMobileMenuOpen
  } = useCafe();

  const navItems = [
    { id: 'gamestore', label: 'Main Arena', icon: Gamepad2 },
    { id: 'history', label: 'Session History', icon: History },
    { id: 'reservations', label: 'Reservations', icon: Calendar, badge: '2' },
    { id: 'accounts', label: 'Accounts & Bills', icon: Receipt },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, badge: 'LIVE' },
    { id: 'membership', label: 'Membership & Perks', icon: Crown },
    { id: 'offers', label: 'Trending & Offers', icon: Flame },
    { id: 'floormap', label: 'Stations Floor', icon: Tv },
  ];

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* 1. DESKTOP / LAPTOP / TABLET STATIC SIDEBAR */}
      <aside
        id="main-sidebar"
        className="hidden md:flex md:w-56 lg:w-64 min-w-[14rem] lg:min-w-[16rem] bg-[#080808] border-r border-white/5 flex-col justify-between p-5 select-none sticky top-0 h-screen z-30"
      >
        {/* Top Logo */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-1 pt-1">
            <div>
              <div className="text-xl lg:text-2xl font-black tracking-tight text-white uppercase">
                Bytes & Brew<span className="text-amber-500">.</span>
              </div>
              <span className="text-[9px] uppercase font-bold text-amber-500/90 tracking-[0.25em] block">
                Gaming Café & Lounge
              </span>
            </div>
            {/* Minimalist Accent Indicator */}
            <div className="w-5 h-5 border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex flex-col gap-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] uppercase tracking-[0.22em] font-medium transition-all duration-200 text-left cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/15 shadow-[0_0_15px_rgba(255,255,255,0.04)]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? 'text-red-500 scale-110' : 'text-white/50'
                    }`}
                  />
                  <span className={isActive ? 'font-bold text-white tracking-[0.24em]' : ''}>
                    {item.label}
                  </span>
                  {item.id === 'gamestore' && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-600 shadow-sm shadow-red-600" />
                  )}
                  {item.badge && (
                    <span className="ml-auto text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold tracking-widest">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area: Auth & Terminal Access */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
          {!isLoggedIn ? (
            <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/10 flex flex-col gap-2.5">
              <button
                id="sidebar-btn-signin"
                type="button"
                onClick={() => {
                  setAuthModalReason('');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthModalReason('Staff / Admin authorized identity verification required.');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-1.5 px-2 text-[10px] text-white/40 hover:text-white/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3 h-3 text-white/30" />
                <span>Authorized Staff Terminal</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'}
                    alt="User Avatar"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white truncate max-w-[110px]">
                      {currentUser?.gamerTag || currentUser?.name}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wider font-mono font-bold ${
                      currentRole === 'ADMIN'
                        ? 'text-amber-400'
                        : currentRole === 'EMPLOYEE'
                        ? 'text-cyan-400'
                        : 'text-red-400'
                    }`}>
                      {currentRole === 'ADMIN' ? 'Admin Root' : currentRole === 'EMPLOYEE' ? 'Staff Desk' : 'Player'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-red-400 transition cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Friends & Activity */}
          <button
            id="btn-friend-chat"
            onClick={() => handleNavClick('tournaments')}
            className="w-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-3 flex items-center justify-between text-left transition group cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <span>Lounge Players</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/50">17 online now</span>
            </div>
            <div className="w-6 h-6 rounded-full border border-white/20 group-hover:bg-white group-hover:text-black flex items-center justify-center text-white/70 transition text-xs font-bold">
              +
            </div>
          </button>
        </div>
      </aside>

      {/* 2. PHONE-ORIENTED MOBILE SLIDE-OUT DRAWER (when hamburger is clicked) */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            id="mobile-drawer-content"
            className="w-4/5 max-w-sm h-full bg-[#0a0a0a] border-r border-white/15 p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-xl font-black tracking-tight text-white uppercase">
                    Bytes & Brew<span className="text-amber-500">.</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-amber-500/90 tracking-[0.25em] block">
                    Gaming Café & Lounge
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1 px-1">
                  Arena Navigation
                </span>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs uppercase tracking-wider font-bold transition-all text-left min-h-[46px] cursor-pointer ${
                        isActive
                          ? 'bg-white text-black shadow-lg'
                          : 'bg-white/[0.03] text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-white/60'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                          isActive ? 'bg-red-600 text-white' : 'bg-red-600/20 text-red-400 border border-red-500/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-white/10 text-white/40 text-[10px] font-mono text-center">
              Bytes & Brew Mobile Terminal • v2.4
            </div>
          </div>
        </div>
      )}

      {/* 3. PHONE-ORIENTED MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly on phones) */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around select-none shadow-[0_-5px_25px_rgba(0,0,0,0.8)]"
      >
        <button
          onClick={() => handleNavClick('gamestore')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] cursor-pointer ${
            activeNav === 'gamestore' ? 'text-red-500' : 'text-white/50 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Arena</span>
        </button>

        <button
          onClick={() => handleNavClick('tournaments')}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] cursor-pointer ${
            activeNav === 'tournaments' ? 'text-red-500' : 'text-white/50 hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Events</span>
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-600 animate-pulse" />
        </button>

        <button
          onClick={() => handleNavClick('floormap')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] cursor-pointer ${
            activeNav === 'floormap' ? 'text-red-500' : 'text-white/50 hover:text-white'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Stations</span>
        </button>

        <button
          onClick={() => handleNavClick('reservations')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] cursor-pointer ${
            activeNav === 'reservations' ? 'text-red-500' : 'text-white/50 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Passes</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-white/50 hover:text-white transition min-w-[56px] min-h-[44px] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Menu</span>
        </button>
      </nav>
    </>
  );
};
