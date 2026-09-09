import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { HeroSlider } from '../HeroSlider';
import { FuzzyConsoleButtons } from '../FuzzyConsoleButtons';
import { TournamentsScreen } from '../screens/TournamentsScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import { MembershipScreen } from '../screens/MembershipScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { FloorMapScreen } from '../screens/FloorMapScreen';
import { GameOverviewScreen } from '../screens/GameOverviewScreen';
import { SessionHistoryScreen } from '../screens/SessionHistoryScreen';
import { GamingServiceCategory, HeroGameSlide } from '../../types';

interface CustomerPortalProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
  onOpenFnB: (sessionId: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onOpenBooking,
  onOpenFnB
}) => {
  const { activeNav, requireLogin } = useCafe();
  const [overviewGame, setOverviewGame] = useState<HeroGameSlide | null>(null);

  // If user navigates to another sidebar tab, reset the overview game view
  useEffect(() => {
    if (activeNav !== 'gamestore') {
      setOverviewGame(null);
    }
  }, [activeNav]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* SCREEN 1: MAIN ARENA / GAME STORE (Main Screen) OR DEDICATED GAME OVERVIEW SCREEN */}
      {activeNav === 'gamestore' && (
        overviewGame ? (
          /* Dedicated Game Overview Page (Overview with video beside it, short description, and button to book slot) */
          <GameOverviewScreen
            game={overviewGame}
            onBack={() => setOverviewGame(null)}
            onBookSlot={(game, category) => {
              requireLogin(() => {
                const targetCategory =
                  category ||
                  (game?.platforms?.includes('PS5')
                    ? 'PS5'
                    : game?.platforms?.includes('Xbox')
                    ? 'Xbox'
                    : 'Gaming PC');
                onOpenBooking(targetCategory);
              }, `Please log in to reserve your station for ${game?.title}.`);
            }}
          />
        ) : (
          /* Main Arena Screen: Stretched Hero Slider & Station Console Access Buttons */
          <div id="main-screen-arena" className="flex flex-col gap-10 animate-fadeIn">
            <section>
              <HeroSlider
                onOpenOverview={(game) => {
                  requireLogin(
                    () => setOverviewGame(game),
                    `Please log in to view ${game.title} details, gameplay reels, and reserve gaming stations.`
                  );
                }}
                onSelectGameForBooking={(game, category) => {
                  requireLogin(() => {
                    const targetCategory =
                      category ||
                      (game?.platforms?.includes('PS5')
                        ? 'PS5'
                        : game?.platforms?.includes('Xbox')
                        ? 'Xbox'
                        : 'Gaming PC');
                    onOpenBooking(targetCategory);
                  }, `Please log in to reserve a gaming rig for ${game?.title || 'this game'}.`);
                }}
              />
            </section>

            {/* Fuzzy Console Buttons with Live Video Feeds */}
            <section>
              <FuzzyConsoleButtons
                onSelectConsole={(category) => {
                  requireLogin(
                    () => onOpenBooking(category),
                    `Please log in to reserve a ${category} station.`
                  );
                }}
              />
            </section>
          </div>
        )
      )}

      {/* SCREEN 2: DEDICATED SESSION HISTORY SCREEN */}
      {activeNav === 'history' && (
        <SessionHistoryScreen onOpenBooking={onOpenBooking} />
      )}

      {/* SCREEN 3: DEDICATED TOURNAMENTS SCREEN */}
      {activeNav === 'tournaments' && <TournamentsScreen />}

      {/* SCREEN 3: DEDICATED ACCOUNTS & BILLING SCREEN */}
      {activeNav === 'accounts' && <AccountsScreen />}

      {/* SCREEN 4: DEDICATED RESERVATIONS & QR PASSES SCREEN */}
      {activeNav === 'reservations' && (
        <ReservationsScreen
          onOpenBooking={onOpenBooking}
          onOpenFnB={onOpenFnB}
        />
      )}

      {/* SCREEN 5: DEDICATED MEMBERSHIP & PERKS SCREEN */}
      {activeNav === 'membership' && (
        <MembershipScreen onOpenBooking={onOpenBooking} />
      )}

      {/* SCREEN 6: DEDICATED CURATED EXPERIENCES & SPECIAL OFFERS SCREEN */}
      {(activeNav === 'offers' || activeNav === 'news') && (
        <OffersScreen onOpenBooking={onOpenBooking} />
      )}

      {/* SCREEN 7: DEDICATED STATIONS FLOOR MAP SCREEN */}
      {activeNav === 'floormap' && (
        <FloorMapScreen onOpenBooking={onOpenBooking} />
      )}
    </div>
  );
};
