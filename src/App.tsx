import React, { useState } from 'react';
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
import { ConsoleGamesModal } from './components/ConsoleGamesModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { GamingServiceCategory } from './types';

const MainAppLayout: React.FC = () => {
  const {
    currentRole,
    isLoggedIn,
    currentUser,
    selectedStationForBooking,
    setSelectedStationForBooking,
    activeInvoiceForModal,
    setActiveInvoiceForModal,
    activeConsoleForGamesModal,
    setActiveConsoleForGamesModal
  } = useCafe();

  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [fnbSessionId, setFnbSessionId] = useState<string | null>(null);

  const handleOpenBooking = (category?: GamingServiceCategory) => {
    setShowBookingModal(true);
  };

  const handleOpenQuickWalkIn = () => {
    setShowWalkInModal(true);
  };

  const handleOpenFnb = (sessionId: string) => {
    setFnbSessionId(sessionId);
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-red-600 selection:text-white">
      {/* Minimalist Dark Mode Navigation Sidebar */}
      <Sidebar onOpenQuickWalkIn={handleOpenQuickWalkIn} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden pb-20 md:pb-0">
        {/* Header */}
        <Header />

        {/* Dynamic Portal Body - User Portal visible to all by default; Staff & Admin require authenticated credentials */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {(!isLoggedIn || currentRole === 'CUSTOMER') && (
            <CustomerPortal
              onOpenBooking={handleOpenBooking}
              onOpenFnB={handleOpenFnb}
            />
          )}

          {isLoggedIn && currentRole === 'EMPLOYEE' && (
            <EmployeePortal
              onOpenFnB={handleOpenFnb}
              onOpenQuickWalkIn={handleOpenQuickWalkIn}
            />
          )}

          {isLoggedIn && currentRole === 'ADMIN' && (
            <AdminPortal />
          )}
        </main>

        {/* Footer with requested links: For designers, Hire talent, Inspiration, Advertising, Blog, About, Support */}
        <Footer onOpenBooking={() => handleOpenBooking()} />
      </div>

      {/* Booking Modal (Customer Station Reservation) */}
      {(showBookingModal || selectedStationForBooking) && (
        <BookingModal
          initialSystem={selectedStationForBooking}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedStationForBooking(null);
          }}
        />
      )}

      {/* Quick Walk-in Modal (Counter Fast-Lane) */}
      {showWalkInModal && (
        <QuickWalkInModal onClose={() => setShowWalkInModal(false)} />
      )}

      {/* Invoice & Thermal Bill Modal (Section 42-44) */}
      {activeInvoiceForModal && (
        <InvoiceModal
          invoice={activeInvoiceForModal}
          onClose={() => setActiveInvoiceForModal(null)}
        />
      )}

      {/* F&B POS Modal (Section 40) */}
      {fnbSessionId && (
        <FnbModal
          sessionId={fnbSessionId}
          onClose={() => setFnbSessionId(null)}
        />
      )}

      {/* Console & Rig Games Library Modal */}
      {activeConsoleForGamesModal && (
        <ConsoleGamesModal
          category={activeConsoleForGamesModal.category}
          initialStationId={activeConsoleForGamesModal.systemId}
          onClose={() => setActiveConsoleForGamesModal(null)}
          onBookStation={(category, systemId) => {
            setActiveConsoleForGamesModal(null);
            setShowBookingModal(true);
          }}
        />
      )}

      {/* Authentication Gateway Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <CafeProvider>
      <MainAppLayout />
    </CafeProvider>
  );
}
