import React, { useState } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  QrCode,
  Users,
  AlertCircle,
  Tv,
  Check,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { Booking } from '../../types';

interface EmployeeBookingsViewProps {
  bookings: Booking[];
  onCheckInBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
}

export const EmployeeBookingsView: React.FC<EmployeeBookingsViewProps> = ({
  bookings,
  onCheckInBooking
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; error?: string; success?: string } | null>(null);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.customerPhone && b.customerPhone.includes(searchQuery)) ||
      (b.systemName && b.systemName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'CHECKED_IN' ? b.status === 'CONFIRMED' : // or active session
      b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCheckIn = async (bookingId: string) => {
    setProcessingId(bookingId);
    setFeedback(null);
    const res = await onCheckInBooking(bookingId);
    setProcessingId(null);
    if (res.success) {
      setFeedback({ id: bookingId, success: 'Customer successfully checked in & seated on floor!' });
    } else {
      setFeedback({ id: bookingId, error: res.error || 'Check-in failed.' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters Header */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Reservations & Arrival Queue
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Validate booking QR codes, verify prepaid deposits & dispatch gaming stations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Name, Phone, QR..."
              className="w-full sm:w-64 bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['ALL', 'CONFIRMED', 'CANCELLED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-amber-400 text-black font-black'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
          No bookings found matching query.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const isProcessing = processingId === b.id;
            const hasSuccess = feedback?.id === b.id && feedback?.success;
            const hasError = feedback?.id === b.id && feedback?.error;

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {b.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-400'
                              : b.status === 'CANCELLED'
                              ? 'bg-red-950/80 border border-red-500/30 text-red-400'
                              : 'bg-white/10 text-white/70'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {b.customerName}
                      </h4>
                      <div className="text-xs text-white/40 font-mono mt-0.5">
                        {b.customerPhone} • {b.customerEmail}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">
                        {b.startTime} - {b.endTime}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">
                        {b.date} ({b.durationHours}h)
                      </div>
                    </div>
                  </div>

                  {/* Reserved Station & Squad */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <Tv className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-white/70">Station:</span>
                      <strong className="text-white">{b.systemName}</strong>
                    </div>
                    {b.squadSize && b.squadSize > 1 && (
                      <div className="flex items-center gap-1 text-[10px] text-purple-400 font-mono">
                        <Users className="w-3 h-3" />
                        <span>Squad: {b.squadSize} Players</span>
                      </div>
                    )}
                  </div>

                  {/* Deposit / Payment */}
                  <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                    <span>Payment Status:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {b.paymentStatus || 'Prepaid Online'} (₹{b.totalPrice})
                    </span>
                  </div>

                  {hasSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{feedback.success}</span>
                    </div>
                  )}

                  {hasError && (
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs mb-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{feedback.error}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">
                    Pass: {b.qrCode || `PASS-${b.id}`}
                  </span>

                  {b.status === 'CONFIRMED' ? (
                    <button
                      onClick={() => handleCheckIn(b.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'Checking in...' : 'Seat Customer'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-white/40 italic">
                      Check-in closed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
