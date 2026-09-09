import React, { useState } from 'react';
import { useCafe } from '../context/CafeContext';
import {
  Search,
  Bell,
  Users,
  PlusCircle,
  CheckCircle2,
  Menu,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRole,
    isLoggedIn,
    currentUser,
    setIsAuthModalOpen,
    setAuthModalReason,
    logout,
    notifications,
    markNotificationAsRead,
    setQuickWalkInModalOpen,
    mobileMenuOpen,
    setMobileMenuOpen
  } = useCafe();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      id="main-header"
      className="h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 border-b border-white/5 bg-[#050505]/95 backdrop-blur-md sticky top-0 z-40"
    >
      {/* Mobile Hamburger & Logo (Visible on mobile/tablets where sidebar is hidden) */}
      <div className="flex items-center gap-2.5 md:hidden">
        <button
          id="btn-mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition cursor-pointer active:scale-95"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-baseline gap-1 select-none">
          <span className="text-base font-black tracking-tight text-white uppercase">Bytes & Brew</span>
          <span className="text-base font-black text-amber-500">.</span>
        </div>
      </div>

      {/* Responsive Search Bar */}
      <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search games, rigs, tournaments..."
          className="w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.07] text-xs sm:text-sm text-[#e0e0e0] pl-9 sm:pl-11 pr-7 sm:pr-8 py-2 sm:py-2.5 rounded-full border border-white/10 focus:border-white/30 focus:outline-none transition-all placeholder:text-white/40 truncate"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Right Controls & Role Indicators */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* If Not Logged In: Sleek Sign In Button */}
        {!isLoggedIn ? (
          <button
            id="btn-header-login"
            type="button"
            onClick={() => {
              setAuthModalReason('');
              setIsAuthModalOpen(true);
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-full transition cursor-pointer shadow-lg shadow-red-600/25 active:scale-95"
            title="Sign in to Bytes & Brew"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : (
          /* If Logged In: User Profile & Role Controls */
          <div className="flex items-center gap-2 sm:gap-3">
            {/* If Staff: Walk-in Quick Action & Desk Indicator */}
            {currentRole === 'EMPLOYEE' && (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[10px] uppercase font-mono font-bold text-cyan-300">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Staff Desk</span>
                </div>

                <button
                  id="btn-quick-walkin"
                  type="button"
                  onClick={() => setQuickWalkInModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 bg-white text-black hover:bg-white/90 text-[10px] uppercase tracking-wider font-black px-3.5 py-2 rounded-full transition cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Walk-in</span>
                </button>
              </>
            )}

            {/* If Admin: Command Indicator */}
            {currentRole === 'ADMIN' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-[10px] uppercase font-mono font-bold text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Root</span>
              </div>
            )}

            {/* User Avatar & Name */}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-full">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'}
                alt={currentUser?.name || 'User'}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
              />
              <span className="text-[11px] font-bold text-white max-w-[90px] sm:max-w-[120px] truncate hidden sm:inline">
                {currentUser?.gamerTag || currentUser?.name || 'Gamer'}
              </span>
              <button
                id="btn-header-logout"
                type="button"
                onClick={logout}
                className="text-white/40 hover:text-red-400 p-1 transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-[#0c0c0c] border border-white/15 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-white">Notifications</span>
                <span className="text-[10px] font-mono text-white/40">{unreadCount} unread</span>
              </div>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      notif.read
                        ? 'bg-white/[0.01] border-white/5 opacity-50'
                        : 'bg-white/[0.04] border-red-500/30 hover:border-red-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate block">{notif.title}</span>
                      <span className="text-[9px] font-mono text-white/40">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-snug">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
