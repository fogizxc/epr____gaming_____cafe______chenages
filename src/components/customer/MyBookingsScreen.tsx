import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { Booking, GamingServiceCategory } from '../../types';
import {
  Calendar,
  QrCode,
  CheckCircle2,
  Clock,
  X,
  PlusCircle,
  AlertCircle,
  Repeat,
  Trash2,
  Tv,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { OPERATING_TIME_SLOTS } from '../../services/apiHandlers';

interface MyBookingsScreenProps {
  onOpenBooking: (category?: GamingServiceCategory) => void;
  onOpenFnB?: (sessionId: string) => void;
}

export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({
  onOpenBooking,
  onOpenFnB
}) => {
  const { bookings, systems, cancelBooking } = useCafe();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL'>('UPCOMING');
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(null);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<Booking | null>(null);

  // Cancellation state
  const [cancellationResult, setCancellationResult] = useState<{
    refundPercentage: number;
    refundAmount: number;
    message: string;
  } | null>(null);

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('18:00');
  const [rescheduleTargetSystemId, setRescheduleTargetSystemId] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  // Check-in feedback
  const [checkInMessage, setCheckInMessage] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Filter bookings according to active tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED';
    if (activeTab === 'ACTIVE') return b.bookingStatus === 'ACTIVE' || b.bookingStatus === 'CHECKED_IN';
    if (activeTab === 'COMPLETED') return b.bookingStatus === 'COMPLETED';
    if (activeTab === 'CANCELLED') return b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'NO-SHOW';
    return true;
  });

  const getTabCount = (tab: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ALL') => {
    if (tab === 'ALL') return bookings.length;
    if (tab === 'UPCOMING') return bookings.filter((b) => b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED').length;
    if (tab === 'ACTIVE') return bookings.filter((b) => b.bookingStatus === 'ACTIVE' || b.bookingStatus === 'CHECKED_IN').length;
    if (tab === 'COMPLETED') return bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
    if (tab === 'CANCELLED') return bookings.filter((b) => b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'NO-SHOW').length;
    return 0;
  };

  // Perform server-authoritative Check-In
  const handleCheckIn = async (b: Booking) => {
    try {
      const res = await fetch(`/api/bookings/${b.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckInMessage({ id: b.id, success: false, message: data.error || 'Check-in failed.' });
      } else {
        b.bookingStatus = 'ACTIVE';
        setCheckInMessage({ id: b.id, success: true, message: data.message });
      }
    } catch (err: any) {
      setCheckInMessage({ id: b.id, success: false, message: 'Server communication error.' });
    }
  };

  // Perform server-authoritative Cancel
  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForCancel.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        selectedBookingForCancel.bookingStatus = 'CANCELLED';
        setCancellationResult({
          refundPercentage: data.refundPercentage,
          refundAmount: data.refundAmount,
          message: data.message
        });
        cancelBooking(selectedBookingForCancel.id);
        setTimeout(() => {
          setSelectedBookingForCancel(null);
          setCancellationResult(null);
        }, 2500);
      }
    } catch (err: any) {
      console.error('Cancel booking error:', err);
    }
  };

  // Perform server-authoritative Reschedule
  const handleConfirmReschedule = async () => {
    if (!selectedBookingForReschedule || !rescheduleDate || !rescheduleTime) return;
    setRescheduleError(null);
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForReschedule.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: rescheduleDate,
          newStartTime: rescheduleTime,
          newSystemId: rescheduleTargetSystemId || selectedBookingForReschedule.systemId
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRescheduleError(data.error || 'Reschedule slot is unavailable.');
      } else {
        setRescheduleSuccess(true);
        selectedBookingForReschedule.date = rescheduleDate;
        selectedBookingForReschedule.startTime = rescheduleTime;
        setTimeout(() => {
          setSelectedBookingForReschedule(null);
          setRescheduleSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setRescheduleError('Server communication error.');
    }
  };

  return (
    <div id="screen-my-bookings" className="flex flex-col gap-6 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Station Passes & Entry Tickets
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-white/80" />
            <span>My Bookings & QR Passes</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            View your upcoming sessions, access digital entrance QR passes, reschedule station slots, or self-check-in upon arrival.
          </p>
        </div>

        <button
          onClick={() => onOpenBooking('Gaming PC')}
          className="bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider py-3 px-6 rounded-xl transition flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer active:scale-98 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book New Station</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-none">
        {(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ALL'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const count = getTabCount(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-black shadow-md'
                  : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                isSelected ? 'bg-black/10 text-black' : 'bg-white/10 text-white/60'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Check-In Feedback Alert if Triggered */}
      {checkInMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
          checkInMessage.success
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30'
        }`}>
          <span>{checkInMessage.message}</span>
          <button onClick={() => setCheckInMessage(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#0c0c0c] border border-white/10 text-center flex flex-col items-center justify-center gap-4">
          <Calendar className="w-12 h-12 text-white/20" />
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              No {activeTab.toLowerCase()} reservations
            </h3>
            <p className="text-xs text-white/50 mt-1 max-w-sm">
              You don't have any bookings in this section. Ready to lock in your next gaming session?
            </p>
          </div>
          <button
            onClick={() => onOpenBooking('Gaming PC')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            Reserve a Rig
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings.map((b) => {
            const isUpcoming = b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED';
            const isActive = b.bookingStatus === 'ACTIVE' || b.bookingStatus === 'CHECKED_IN';

            return (
              <div
                key={b.id}
                className="p-6 rounded-3xl bg-[#0c0c0c] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-6 shadow-xl"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white/80">{b.id}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : b.bookingStatus === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : b.bookingStatus === 'CANCELLED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">
                      {b.systemName} • {b.service}
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Playing: <strong className="text-white/80">{b.gameTitle || 'Selected at Station'}</strong>
                    </p>
                  </div>

                  {/* QR Pass Action */}
                  <button
                    onClick={() => setSelectedBookingForQr(b)}
                    className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white flex flex-col items-center justify-center gap-1 cursor-pointer transition shrink-0 group"
                    title="View Digital QR Pass"
                  >
                    <QrCode className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white/60">QR Pass</span>
                  </button>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Date</span>
                    <span className="font-bold text-white">{b.date}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Time Window</span>
                    <span className="font-bold text-white">{b.startTime} - {b.endTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Duration</span>
                    <span className="font-bold text-white">{b.durationHours} Hour{b.durationHours > 1 ? 's' : ''}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Total Paid</span>
                    <span className="font-bold font-mono text-emerald-400 text-sm">₹{b.finalAmount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Rate</span>
                    <span className="font-mono text-white/80">₹{b.applicableRate}/h</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Location</span>
                    <span className="text-white/80">Bytes & Brew HQ</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {isUpcoming && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBookingForReschedule(b);
                            setRescheduleDate(b.date);
                            setRescheduleTime(b.startTime);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Repeat className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          onClick={() => setSelectedBookingForCancel(b)}
                          className="px-3.5 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>

                  {isUpcoming && (
                    <button
                      onClick={() => handleCheckIn(b)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Check In Now</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIGITAL QR PASS MODAL */}
      {selectedBookingForQr && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedBookingForQr(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0e0e0e] border border-white/15 rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBookingForQr(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pass Header */}
            <div className="text-center">
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-red-500 block mb-1">
                Bytes & Brew Arena Pass
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {selectedBookingForQr.systemName}
              </h3>
              <p className="text-xs text-white/60 font-mono mt-0.5">
                Pass ID: {selectedBookingForQr.id}
              </p>
            </div>

            {/* High-Contrast QR Code Block */}
            <div className="p-5 rounded-2xl bg-white flex flex-col items-center justify-center shadow-xl">
              <QrCode className="w-44 h-44 text-black stroke-[2.5]" />
              <span className="text-[10px] font-mono text-black font-bold tracking-widest mt-2 uppercase">
                {selectedBookingForQr.qrCode.split('::')[0]}
              </span>
            </div>

            {/* Booking Details on Ticket */}
            <div className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-white/70">
                <span>Date & Time:</span>
                <strong className="text-white">{selectedBookingForQr.date} @ {selectedBookingForQr.startTime}</strong>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Duration:</span>
                <strong className="text-white">{selectedBookingForQr.durationHours} Hours</strong>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Customer:</span>
                <strong className="text-white">{selectedBookingForQr.customerName}</strong>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Check-in Window:</span>
                <span className="text-amber-400 font-bold">15m before start</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBookingForQr(null)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL WITH TIERED REFUND POLICY */}
      {selectedBookingForCancel && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedBookingForCancel(null)}
        >
          <div
            className="w-full max-w-md bg-[#0e0e0e] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 text-red-500">
                <Trash2 className="w-5 h-5" />
                <span>Cancel Reservation</span>
              </h3>
              <button onClick={() => setSelectedBookingForCancel(null)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to cancel booking <strong className="text-white">{selectedBookingForCancel.id}</strong> on station <strong className="text-white">{selectedBookingForCancel.systemName}</strong>?
            </p>

            {/* Cancellation Policy Table */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Tiered Refund Policy
              </span>
              <div className="flex items-center justify-between text-white/60">
                <span>More than 24 hours prior:</span>
                <span className="text-emerald-400 font-bold">100% Wallet Refund</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>6 to 24 hours prior:</span>
                <span className="text-amber-400 font-bold">75% Wallet Refund</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>2 to 6 hours prior:</span>
                <span className="text-orange-400 font-bold">50% Wallet Refund</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>Less than 2 hours prior:</span>
                <span className="text-red-400 font-bold">0% Non-refundable</span>
              </div>
            </div>

            {cancellationResult && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                {cancellationResult.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {selectedBookingForReschedule && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedBookingForReschedule(null)}
        >
          <div
            className="w-full max-w-md bg-[#0e0e0e] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Repeat className="w-5 h-5 text-cyan-400" />
                <span>Reschedule Booking</span>
              </h3>
              <button onClick={() => setSelectedBookingForReschedule(null)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Pick a new date and time for booking <strong className="text-white">{selectedBookingForReschedule.id}</strong> ({selectedBookingForReschedule.systemName}):
            </p>

            {/* Date Input */}
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Select New Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().substring(0, 10)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Time Slot Input */}
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Select New Start Time</label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {OPERATING_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold">
                {rescheduleError}
              </div>
            )}

            {rescheduleSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                Booking successfully rescheduled!
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedBookingForReschedule(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
