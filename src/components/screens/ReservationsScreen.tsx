import React from 'react';
import { useCafe } from '../../context/CafeContext';
import { Calendar, QrCode, CheckCircle2, Clock, X, PlusCircle, AlertCircle } from 'lucide-react';
import { GamingServiceCategory } from '../../types';
import { ActiveSessionBanner } from '../ActiveSessionBanner';

interface ReservationsScreenProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
  onOpenFnB?: (sessionId: string) => void;
}

export const ReservationsScreen: React.FC<ReservationsScreenProps> = ({
  onOpenBooking,
  onOpenFnB
}) => {
  const { bookings, checkInBooking, cancelBooking, activeSessions } = useCafe();

  // Active customer session (if playing right now)
  const mySession = activeSessions.find(
    (s) => s.status === 'ACTIVE'
  );

  // Filter for customer upcoming & active bookings
  const upcomingBookings = bookings.filter(
    (b) => b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED'
  );

  return (
    <div id="screen-reservations" className="w-full flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Active In-Session Banner inside Reservations */}
      {mySession && onOpenFnB && (
        <div className="mb-2">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Currently Active Live Session</span>
          </div>
          <ActiveSessionBanner session={mySession} onOpenFnb={onOpenFnB} />
        </div>
      )}

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Station Passes & Entry Tickets
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-white/80" />
            <span>Reservations & Fast Check-in</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Scan your digital QR pass at reception or self-check-in to immediately boot up your gaming station.
          </p>
        </div>

        <button
          id="btn-reserve-new-station"
          onClick={() => onOpenBooking('Gaming PC')}
          className="bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider py-3 px-5 rounded-xl transition flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.05)] cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book New Station</span>
        </button>
      </div>

      {/* Bookings List */}
      {upcomingBookings.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center justify-center gap-4">
          <Calendar className="w-12 h-12 text-white/20" />
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              No Active Reservations
            </h3>
            <p className="text-xs text-white/40 mt-1">
              You do not have any upcoming bookings. Book a console, PC battle rig, or VIP suite now!
            </p>
          </div>
          <button
            onClick={() => onOpenBooking('PS5')}
            className="bg-white text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            Reserve a Rig
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingBookings.map((b) => (
            <div
              key={b.id}
              id={`booking-card-${b.id}`}
              className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col sm:flex-row items-start justify-between gap-6 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.02)] group"
            >
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/80 font-mono">{b.id}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {b.bookingStatus}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white uppercase tracking-tight mt-2">
                    {b.systemName} • {b.service}
                  </h3>

                  <div className="mt-3 space-y-1 text-xs text-white/60 font-light">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      <span>{b.date} from {b.startTime} to {b.endTime} ({b.durationHours}h)</span>
                    </p>
                    <p>Reserved for: <strong className="text-white">{b.customerName}</strong></p>
                    <p>
                      Amount Paid: <strong className="text-white font-mono">₹{b.finalAmount}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => checkInBooking(b.id)}
                    className="bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Check In & Start</span>
                  </button>

                  <button
                    onClick={() => cancelBooking(b.id)}
                    className="text-xs text-white/50 hover:text-white/80 uppercase tracking-wider font-bold py-2 px-3 rounded-xl border border-white/10 hover:border-white/25 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* QR Code Pass */}
              <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-md min-w-[130px] self-center sm:self-start">
                <QrCode className="w-24 h-24 text-black" />
                <span className="text-[10px] font-mono font-bold text-black mt-2 text-center break-all">
                  {b.qrCode}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-black/60 mt-0.5 font-bold">
                  Fast Check-in Pass
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservation Policies Notice */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3.5">
        <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-white/60 font-light space-y-1">
          <strong className="text-white block font-bold uppercase text-[11px]">
            Check-in Policy & Station Release
          </strong>
          <p>
            Please check in within 15 minutes of your reserved start time. If unclaimed after 15 minutes, the station will be released to the waitlist queue to ensure fair arena access. Free cancellation is permitted up to 1 hour prior to start time.
          </p>
        </div>
      </div>
    </div>
  );
};
