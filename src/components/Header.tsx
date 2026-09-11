import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useCafe } from '../context/CafeContext';

const SPIDER_MAN_ART = 'https://img.favpng.com/10/16/8/watercolor-spiderman-spider-man-sitting-in-classic-pose-sZsjjn9u.jpg';

export const Header: React.FC = () => {
  const { notifications, markNotificationAsRead } = useCafe();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur-2xl sm:px-6 sm:py-4 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-3">
        <div className="flex h-[74px] items-end justify-center sm:h-[86px] sm:justify-start">
          <div className="relative select-none pb-1 text-xl font-black uppercase tracking-[-0.04em] text-white sm:text-2xl">
            <span className="relative z-10">Bytes &amp; Brew<span className="text-red-500">.</span></span>
            <img
              src={SPIDER_MAN_ART}
              alt="Spider-Man sitting above the Bytes & Brew logo"
              aria-hidden="true"
              loading="eager"
              className="pointer-events-none absolute bottom-[58%] left-1/2 z-20 h-[72px] w-[118px] -translate-x-1/2 object-contain object-bottom mix-blend-screen drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)] sm:h-[88px] sm:w-[145px]"
            />
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              id="global-search-input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search games, arenas, tournaments..."
              aria-label="Search games, arenas, tournaments"
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.045] pl-11 pr-10 text-sm text-white outline-none transition placeholder:text-white/35 hover:border-white/15 hover:bg-white/[0.06] focus:border-red-500/50 focus:bg-white/[0.07] sm:h-12 sm:rounded-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs text-white/35 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              id="btn-notifications"
              type="button"
              onClick={() => setShowNotifs((current) => !current)}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={showNotifs}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-white/65 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-95 sm:h-12 sm:w-12 sm:rounded-full"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#050505] bg-red-600 px-1 text-[9px] font-black text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-white/15 bg-[#0b0b0b]/98 p-4 shadow-2xl backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-white">Notifications</span>
                  <span className="text-[10px] font-mono text-white/40">{unreadCount} unread</span>
                </div>
                <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-white/35">No notifications yet</div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          notification.read
                            ? 'border-white/5 bg-white/[0.01] opacity-50'
                            : 'border-red-500/25 bg-white/[0.04] hover:border-red-500/50 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-xs font-bold text-white">{notification.title}</span>
                          <span className="shrink-0 text-[9px] font-mono text-white/35">{notification.time}</span>
                        </div>
                        <p className="text-[11px] leading-5 text-white/65">{notification.message}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
