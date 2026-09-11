import React, { useEffect, useState } from 'react';
import { CafeProvider, useCafe } from './context/CafeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CustomerPortal } from './components/portals/CustomerPortal';
import { EmployeePortal } from './components/portals/EmployeePortal';
import { AdminPortal } from './components/portals/AdminPortal';
import { BookingModal } from './components/BookingModal';
import { QuickWalkInModal } from './components/QuickWalkInModal';
import { InvoiceModal } from './components/InvoiceModal';
import { FnbModal } from './components/FnbModal';
import { ProductionConsoleGamesModal } from './components/ProductionConsoleGamesModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { CafeStatusBar } from './components/CafeStatusBar';
import { PasswordResetPage } from './components/PasswordResetPage';
import { GamingServiceCategory } from './types';

const MainAppLayout: React.FC = () => {
  const { activeNav, currentRole, isLoggedIn, selectedStationForBooking, setSelectedStationForBooking, activeInvoiceForModal, setActiveInvoiceForModal, activeConsoleForGamesModal, setActiveConsoleForGamesModal } = useCafe();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [fnbSessionId, setFnbSessionId] = useState<string | null>(null);
  const handleOpenBooking = (_category?: GamingServiceCategory) => setShowBookingModal(true);
  const handleOpenQuickWalkIn = () => setShowWalkInModal(true);
  const handleOpenFnb = (sessionId: string) => setFnbSessionId(sessionId);

  // Every in-app section/navigation change starts at the top of the new page.
  // This prevents the previous section's scroll position from carrying over.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeNav, currentRole]);

  return <div className="flex min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-red-600 selection:text-white">
    <Sidebar onOpenQuickWalkIn={handleOpenQuickWalkIn} />
    <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pb-20 md:pb-0">
      <Header />
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {(!isLoggedIn || currentRole === 'CUSTOMER') && <CustomerPortal onOpenBooking={handleOpenBooking} onOpenFnB={handleOpenFnb} />}
        {isLoggedIn && currentRole === 'EMPLOYEE' && <EmployeePortal onOpenFnB={handleOpenFnb} onOpenQuickWalkIn={handleOpenQuickWalkIn} />}
        {isLoggedIn && currentRole === 'ADMIN' && <AdminPortal />}
      </main>
      <Footer onOpenBooking={() => handleOpenBooking()} />
    </div>
    {(showBookingModal || selectedStationForBooking) && <BookingModal initialSystem={selectedStationForBooking} onClose={() => { setShowBookingModal(false); setSelectedStationForBooking(null); }} />}
    {showWalkInModal && <QuickWalkInModal onClose={() => setShowWalkInModal(false)} />}
    {activeInvoiceForModal && <InvoiceModal invoice={activeInvoiceForModal} onClose={() => setActiveInvoiceForModal(null)} />}
    {fnbSessionId && <FnbModal sessionId={fnbSessionId} onClose={() => setFnbSessionId(null)} />}
    {activeConsoleForGamesModal && <ProductionConsoleGamesModal category={activeConsoleForGamesModal.category} initialStationId={activeConsoleForGamesModal.systemId} onClose={() => setActiveConsoleForGamesModal(null)} onBookStation={() => { setActiveConsoleForGamesModal(null); setShowBookingModal(true); }} />}
    <AuthModal />
    <CafeStatusBar />
  </div>;
};

export default function App() {
  const resetToken = new URLSearchParams(window.location.search).get('resetToken');
  return <CafeProvider>{resetToken ? <PasswordResetPage token={resetToken} /> : <MainAppLayout />}</CafeProvider>;
}
