import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { CustomerHomeDashboard } from '../customer/CustomerHomeDashboard';
import { MainPageBottomCTA } from '../customer/MainPageBottomCTA';
import { ExperienceDiscoveryView } from '../customer/ExperienceDiscoveryView';
import { GameDiscoveryView } from '../customer/GameDiscoveryView';
import { LiveSessionScreen } from '../customer/LiveSessionScreen';
import { ProductionMyBookingsScreen } from '../customer/ProductionMyBookingsScreen';
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

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onOpenBooking, onOpenFnB }) => {
  const { activeNav, requireLogin, setSelectedGameForBooking, setActiveNav } = useCafe();
  const [overviewGame, setOverviewGame] = useState<HeroGameSlide | null>(null);

  useEffect(() => {
    if (activeNav !== 'gamestore') setOverviewGame(null);
  }, [activeNav]);

  const handleSelectGameForBooking = (game: { title: string; category?: GamingServiceCategory; coverUrl?: string }) => {
    setSelectedGameForBooking(game as any);
  };

  return (
    <div id="customer-portal-root" className="flex flex-col gap-8 pb-12">
      {activeNav === 'gamestore' && (
        overviewGame ? (
          <GameOverviewScreen game={overviewGame} onBack={() => setOverviewGame(null)} onBookSlot={(game, category) => {
            requireLogin(() => {
              const targetCategory = category || (game?.platforms?.includes('PS5') ? 'PS5' : game?.platforms?.includes('Xbox') ? 'Xbox' : 'Gaming PC');
              onOpenBooking(targetCategory);
            }, `Please log in to reserve your station for ${game?.title}.`);
          }} />
        ) : (
          <>
            <CustomerHomeDashboard onOpenBooking={onOpenBooking} onOpenFnB={onOpenFnB} onSelectGameForBooking={handleSelectGameForBooking} onViewGameOverview={(game) => {
              requireLogin(() => setOverviewGame(game), `Please log in to view ${game.title} details, gameplay reels, and reserve gaming stations.`);
            }} />
            <MainPageBottomCTA onOpenBooking={onOpenBooking} onOpenGames={() => setActiveNav('games')} onOpenTournaments={() => setActiveNav('tournaments')} />
          </>
        )
      )}
      {activeNav === 'discover' && <ExperienceDiscoveryView onOpenBooking={onOpenBooking} onExploreGames={() => {}} />}
      {activeNav === 'games' && <GameDiscoveryView onOpenBooking={onOpenBooking} onSelectGameForBooking={handleSelectGameForBooking} />}
      {activeNav === 'livesession' && <LiveSessionScreen onOpenBooking={onOpenBooking} onOpenFnB={onOpenFnB} />}
      {(activeNav === 'reservations' || activeNav === 'mybookings') && <ProductionMyBookingsScreen onOpenBooking={onOpenBooking} />}
      {activeNav === 'fnb' && <FnbOrderScreen />}
      {(activeNav === 'wallet' || activeNav === 'accounts') && <WalletScreen />}
      {activeNav === 'rewards' && <RewardsScreen />}
      {activeNav === 'tournaments' && <TournamentsScreen />}
      {activeNav === 'membership' && <MembershipScreen onOpenBooking={onOpenBooking} />}
      {activeNav === 'floormap' && <FloorMapScreen onOpenBooking={onOpenBooking} />}
      {activeNav === 'support' && <SupportScreen />}
      {activeNav === 'profile' && <CustomerProfileScreen />}
      {activeNav === 'history' && <SessionHistoryScreen onOpenBooking={onOpenBooking} />}
      {(activeNav === 'offers' || activeNav === 'news') && <OffersScreen onOpenBooking={onOpenBooking} />}
    </div>
  );
};
