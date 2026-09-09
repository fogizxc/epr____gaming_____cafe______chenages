import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { CustomerHomeDashboard } from '../customer/CustomerHomeDashboard';
import { ExperienceDiscoveryView } from '../customer/ExperienceDiscoveryView';
import { GameDiscoveryView } from '../customer/GameDiscoveryView';
import { LiveSessionScreen } from '../customer/LiveSessionScreen';
import { MyBookingsScreen } from '../customer/MyBookingsScreen';
import { WalletScreen } from '../customer/WalletScreen';
import { RewardsScreen } from '../customer/RewardsScreen';
import { FnbOrderScreen } from '../customer/FnbOrderScreen';
import { SupportScreen } from '../customer/SupportScreen';
import { CustomerProfileScreen } from '../customer/CustomerProfileScreen';
import { TournamentsScreen } from '../screens/TournamentsScreen';
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
  const { activeNav, requireLogin, setSelectedGameForBooking } = useCafe();
  const [overviewGame, setOverviewGame] = useState<HeroGameSlide | null>(null);

  // If user navigates to another sidebar tab, reset the overview game view
  useEffect(() => {
    if (activeNav !== 'gamestore') {
      setOverviewGame(null);
    }
  }, [activeNav]);

  const handleSelectGameForBooking = (game: {
    title: string;
    category?: GamingServiceCategory;
    coverUrl?: string;
  }) => {
    if (setSelectedGameForBooking) {
      setSelectedGameForBooking(game as any);
    }
  };

  return (
    <div id="customer-portal-root" className="flex flex-col gap-8 pb-12">
      {/* 1. MAIN ARENA DASHBOARD OR DEDICATED GAME OVERVIEW SCREEN */}
      {activeNav === 'gamestore' && (
        overviewGame ? (
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
          <CustomerHomeDashboard
            onOpenBooking={onOpenBooking}
            onOpenFnB={onOpenFnB}
            onSelectGameForBooking={handleSelectGameForBooking}
            onViewGameOverview={(game) => {
              requireLogin(
                () => setOverviewGame(game),
                `Please log in to view ${game.title} details, gameplay reels, and reserve gaming stations.`
              );
            }}
          />
        )
      )}

      {/* 2. EXPERIENCES & HARDWARE DISCOVERY SCREEN */}
      {activeNav === 'discover' && (
        <ExperienceDiscoveryView
          onOpenBooking={onOpenBooking}
          onExploreGames={() => {}}
        />
      )}

      {/* 3. GAME DISCOVERY LIBRARY (PRE-INSTALLED 300+ TITLES) */}
      {activeNav === 'games' && (
        <GameDiscoveryView
          onOpenBooking={onOpenBooking}
          onSelectGameForBooking={handleSelectGameForBooking}
        />
      )}

      {/* 4. LIVE IN-SESSION CONTROLS & TELEMETRY */}
      {activeNav === 'livesession' && (
        <LiveSessionScreen
          onOpenBooking={onOpenBooking}
          onOpenFnB={onOpenFnB}
        />
      )}

      {/* 5. MY BOOKINGS & DIGITAL QR PASSES */}
      {(activeNav === 'reservations' || activeNav === 'mybookings') && (
        <MyBookingsScreen
          onOpenBooking={onOpenBooking}
          onOpenFnB={onOpenFnB}
        />
      )}

      {/* 6. ARTISAN CAFÉ FOOD & DRINKS MENU */}
      {activeNav === 'fnb' && (
        <FnbOrderScreen />
      )}

      {/* 7. CAFÉ WALLET & TRANSACTIONS LEDGER */}
      {(activeNav === 'wallet' || activeNav === 'accounts') && (
        <WalletScreen />
      )}

      {/* 8. NEXUS REWARDS, DAILY CHALLENGES & REFERRALS */}
      {activeNav === 'rewards' && (
        <RewardsScreen />
      )}

      {/* 9. TOURNAMENTS & ESPORTS EVENTS */}
      {activeNav === 'tournaments' && (
        <TournamentsScreen />
      )}

      {/* 10. MEMBERSHIP PASSES & TIERS */}
      {activeNav === 'membership' && (
        <MembershipScreen onOpenBooking={onOpenBooking} />
      )}

      {/* 11. FLOOR MAP & HARDWARE RIG MONITOR */}
      {activeNav === 'floormap' && (
        <FloorMapScreen onOpenBooking={onOpenBooking} />
      )}

      {/* 12. 24/7 FLOOR SUPPORT & ASSISTANCE DESK */}
      {activeNav === 'support' && (
        <SupportScreen />
      )}

      {/* 13. USER PROFILE & PREFERENCES */}
      {activeNav === 'profile' && (
        <CustomerProfileScreen />
      )}

      {/* 14. SESSION HISTORY */}
      {activeNav === 'history' && (
        <SessionHistoryScreen onOpenBooking={onOpenBooking} />
      )}

      {/* 15. SPECIAL OFFERS & PROMOTIONS */}
      {(activeNav === 'offers' || activeNav === 'news') && (
        <OffersScreen onOpenBooking={onOpenBooking} />
      )}
    </div>
  );
};
