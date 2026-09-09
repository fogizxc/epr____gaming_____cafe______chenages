import React, { useState, useEffect, useMemo } from 'react';
import { useCafe } from '../context/CafeContext';
import { GamingServiceCategory, GamingSystem, Booking } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  CreditCard,
  QrCode,
  ShieldAlert,
  ArrowRight,
  Gamepad2
} from 'lucide-react';

const OPERATING_TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

const formatTime12h = (time24: string) => {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${mStr} ${period}`;
};

const calculateEndTime = (startTimeStr: string, duration: number) => {
  if (!startTimeStr || !startTimeStr.includes(':')) return '';
  const [sh, sm] = startTimeStr.split(':').map(Number);
  const totalMins = sh * 60 + sm + duration * 60;
  const eh = Math.floor(totalMins / 60) % 24;
  const em = totalMins % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
};

interface BookingModalProps {
  initialSystem?: GamingSystem | null;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ initialSystem, onClose }) => {
  const {
    systems,
    getRateForService,
    createBooking,
    createSquadBooking,
    findNextAvailableSlot,
    customerMembership,
    joinWaitlist,
    bookings,
    openConsoleGames
  } = useCafe();

  const [service, setService] = useState<GamingServiceCategory>(
    initialSystem ? initialSystem.category : 'Gaming PC'
  );
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    initialSystem ? initialSystem.id : ''
  );
  const [isSquadMode, setIsSquadMode] = useState(false);
  const [selectedSquadIds, setSelectedSquadIds] = useState<string[]>([]);

  const todayStr = new Date().toISOString().substring(0, 10);
  const [bookingDate, setBookingDate] = useState<string>(todayStr);

  // Default to next hour slot
  const now = new Date();
  const nextHour = (now.getHours() + 1) % 24;
  const defaultTimeStr = `${String(nextHour).padStart(2, '0')}:00`;
  const [startTime, setStartTime] = useState<string>(defaultTimeStr);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);

  const [customerName, setCustomerName] = useState('Andy Patel');
  const [customerPhone, setCustomerPhone] = useState('+91 98991 12233');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  // Filter systems by service
  const filteredSystems = systems.filter(
    s => s.category === service || (service === 'PS5' && s.category === 'PlayStation') || (service === 'PlayStation' && s.category === 'PS5')
  );

  // Calculate detailed availability for all operational time slots
  const slotStatuses = useMemo(() => {
    const isToday = bookingDate === todayStr;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    return OPERATING_TIME_SLOTS.map((slot) => {
      const [sh, sm] = slot.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = startMins + durationHours * 60;

      // Check if slot has already passed today
      const isPast = isToday && startMins < currentMins - 5;

      let isBooked = false;
      let conflictReason = '';

      if (isSquadMode) {
        // In squad mode, all 4 stations must be free
        isBooked = selectedSquadIds.some((sysId) => {
          const hasBooking = bookings.some((b) => {
            if (b.systemId === sysId && b.date === bookingDate && (b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED')) {
              const [bsh, bsm] = b.startTime.split(':').map(Number);
              const [beh, bem] = b.endTime.split(':').map(Number);
              return startMins < (beh * 60 + bem) && endMins > (bsh * 60 + bsm);
            }
            return false;
          });

          let hasActiveSession = false;
          if (isToday) {
            const sys = systems.find((s) => s.id === sysId);
            if (sys && sys.status === 'ACTIVE' && sys.sessionEndTime) {
              const slotDate = new Date();
              slotDate.setHours(sh, sm, 0, 0);
              if (slotDate.getTime() < sys.sessionEndTime) {
                hasActiveSession = true;
              }
            }
          }

          return hasBooking || hasActiveSession;
        });

        if (isBooked) {
          conflictReason = 'Squad station conflict';
        }
      } else if (selectedSystemId) {
        // Single station conflict check
        const hasBooking = bookings.some((b) => {
          if (b.systemId === selectedSystemId && b.date === bookingDate && (b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED')) {
            const [bsh, bsm] = b.startTime.split(':').map(Number);
            const [beh, bem] = b.endTime.split(':').map(Number);
            return startMins < (beh * 60 + bem) && endMins > (bsh * 60 + bsm);
          }
          return false;
        });

        let hasActiveSession = false;
        if (isToday) {
          const sys = systems.find((s) => s.id === selectedSystemId);
          if (sys && sys.status === 'ACTIVE' && sys.sessionEndTime) {
            const slotDate = new Date();
            slotDate.setHours(sh, sm, 0, 0);
            if (slotDate.getTime() < sys.sessionEndTime) {
              hasActiveSession = true;
            }
          }
        }

        isBooked = hasBooking || hasActiveSession;
        if (isBooked) {
          conflictReason = 'Station already booked';
        }
      } else {
        // No single station selected: check if ANY station in category is free
        const hasAvailableStation = filteredSystems.some((sys) => {
          const hasBooking = bookings.some((b) => {
            if (b.systemId === sys.id && b.date === bookingDate && (b.bookingStatus === 'UPCOMING' || b.bookingStatus === 'CONFIRMED')) {
              const [bsh, bsm] = b.startTime.split(':').map(Number);
              const [beh, bem] = b.endTime.split(':').map(Number);
              return startMins < (beh * 60 + bem) && endMins > (bsh * 60 + bsm);
            }
            return false;
          });
          return !hasBooking;
        });

        isBooked = !hasAvailableStation && filteredSystems.length > 0;
        if (isBooked) {
          conflictReason = 'All rigs booked in category';
        }
      }

      const isAvailable = !isPast && !isBooked;
      const isPeak = sh >= 18 && sh < 23;

      return {
        time: slot,
        displayTime: formatTime12h(slot),
        isPast,
        isBooked,
        isAvailable,
        isPeak,
        conflictReason
      };
    });
  }, [bookingDate, todayStr, now, durationHours, isSquadMode, selectedSquadIds, selectedSystemId, bookings, systems, filteredSystems]);

  const availableSlots = useMemo(() => slotStatuses.filter((s) => s.isAvailable), [slotStatuses]);
  const unavailableSlots = useMemo(() => slotStatuses.filter((s) => !s.isAvailable), [slotStatuses]);
  const selectedSlotStatus = slotStatuses.find((s) => s.time === startTime);

  // Auto-select first available time slot if current selected startTime is unavailable
  useEffect(() => {
    if (availableSlots.length > 0) {
      const isCurrentValid = availableSlots.some((s) => s.time === startTime);
      if (!isCurrentValid) {
        setStartTime(availableSlots[0].time);
      }
    }
  }, [availableSlots, startTime]);

  // Auto-select first available system if not set
  useEffect(() => {
    if (!selectedSystemId || !filteredSystems.some(s => s.id === selectedSystemId)) {
      const avail = filteredSystems.find(s => s.status === 'AVAILABLE');
      if (avail) {
        setSelectedSystemId(avail.id);
      } else if (filteredSystems.length > 0) {
        setSelectedSystemId(filteredSystems[0].id);
      }
    }
  }, [service, filteredSystems, selectedSystemId]);

  // Handle squad multi-select
  useEffect(() => {
    if (isSquadMode) {
      const pcSystems = systems.filter(s => s.category === 'Gaming PC' && s.status !== 'MAINTENANCE');
      const fourIds = pcSystems.slice(0, 4).map(s => s.id);
      setSelectedSquadIds(fourIds);
    }
  }, [isSquadMode, systems]);

  const currentRate = getRateForService(service);

  // Auto-apply membership if the customer has an active membership
  const hasActiveMembership = Boolean(
    customerMembership &&
    customerMembership.status === 'ACTIVE' &&
    (
      customerName.trim().toLowerCase() === customerMembership.customerName.trim().toLowerCase() ||
      customerName.trim().toLowerCase().includes('andy') ||
      customerMembership.customerName.toLowerCase().includes(customerName.trim().toLowerCase())
    )
  );

  const membershipAvail = hasActiveMembership
    ? (service === 'VIP Room'
        ? customerMembership.vipHoursRemaining
        : customerMembership.normalHoursRemaining)
    : 0;

  const membershipHoursCovered = Math.min(membershipAvail, durationHours);

  const payableHours = durationHours - membershipHoursCovered;
  const baseCost = isSquadMode
    ? durationHours * currentRate * 4
    : payableHours * currentRate;

  // Find next available slot smart helper
  const handleFindNextSlot = () => {
    const res = findNextAvailableSlot(service, durationHours);
    const match = res.time.match(/(\d{1,2}:\d{2})/);
    const timeOnly = match ? match[1].padStart(5, '0') : (availableSlots[0]?.time || defaultTimeStr);
    setStartTime(timeOnly);
    const targetSys = systems.find(s => s.name === res.systemName);
    if (targetSys) {
      setSelectedSystemId(targetSys.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName || !customerPhone) {
      setErrorMsg('Please enter customer name and contact phone.');
      return;
    }

    if (isSquadMode) {
      if (selectedSquadIds.length < 4) {
        setErrorMsg('Please select exactly 4 gaming systems for Squad Booking.');
        return;
      }
      const res = createSquadBooking({
        customerName,
        customerPhone,
        systemIds: selectedSquadIds,
        date: bookingDate,
        startTime,
        durationHours
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to complete squad booking.');
      } else if (res.bookings && res.bookings.length > 0) {
        setConfirmedBooking(res.bookings[0]);
      }
      return;
    }

    if (!selectedSystemId) {
      setErrorMsg('Please select an available gaming station.');
      return;
    }

    const res = createBooking({
      customerName,
      customerPhone,
      systemId: selectedSystemId,
      date: bookingDate,
      startTime,
      durationHours,
      useMembership: hasActiveMembership && membershipHoursCovered > 0
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Booking conflict detected.');
    } else if (res.booking) {
      setConfirmedBooking(res.booking);
    }
  };

  const handleJoinWaitlist = () => {
    joinWaitlist(customerName, customerPhone, service, startTime, durationHours);
    setWaitlistJoined(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.03)] p-4 sm:p-8 my-auto max-h-[92vh] overflow-y-auto text-white backdrop-blur-md animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
        >
          ✕
        </button>

        {/* Confirmed Booking View */}
        {confirmedBooking ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">
              Booking Confirmed
            </h3>
            <p className="text-xs text-white/50 mt-1 max-w-sm font-light">
              Your station is secured. Present this QR pass at the café reception for instant check-in.
            </p>

            {/* QR Card */}
            <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
              <div className="w-36 h-36 bg-white p-3 rounded-xl flex items-center justify-center shadow-lg">
                <QrCode className="w-28 h-28 text-black" />
              </div>
              <span className="font-mono text-xs font-black text-white mt-3 uppercase tracking-widest">
                {confirmedBooking.qrCode}
              </span>
              <div className="grid grid-cols-2 gap-4 text-xs text-left mt-4 pt-4 border-t border-white/10 w-full">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block">Station:</span>
                  <span className="font-bold text-white text-sm uppercase">{confirmedBooking.systemName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block">Date & Time:</span>
                  <span className="font-bold text-white">{confirmedBooking.date} • {confirmedBooking.startTime}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block">Duration:</span>
                  <span className="font-bold text-white">{confirmedBooking.durationHours} Hours</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 block">Amount Paid:</span>
                  <span className="font-black text-white font-mono">
                    {confirmedBooking.finalAmount === 0 ? '₹0 (Pass)' : `₹${confirmedBooking.finalAmount}`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer"
            >
              Done & Return to Lounge
            </button>
          </div>
        ) : (
          /* Form View */
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block">
                  Reservation
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  Reserve Station
                </h3>
              </div>
            </div>

            {/* Mode Switcher: Single vs Squad Booking */}
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setIsSquadMode(false)}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition cursor-pointer ${
                  !isSquadMode
                    ? 'bg-white text-black shadow'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Single Station
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSquadMode(true);
                  setService('Gaming PC');
                }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isSquadMode
                    ? 'bg-white text-black shadow'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Squad (4 Rigs)</span>
              </button>
            </div>

            {/* Service Category Buttons */}
            {!isSquadMode && (
              <div className="mb-5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-2">
                  Select Gaming Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['PS5', 'Xbox', 'PS4', 'Gaming PC', 'VIP Room', 'VR', 'Pool Table', 'Sim Racing'] as GamingServiceCategory[]).map(
                    (cat) => {
                      const rate = getRateForService(cat);
                      const isSelected = service === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setService(cat)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-white/10 border-white/40 text-white shadow-sm'
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase tracking-tight block truncate">{cat}</span>
                          <span className="text-sm font-black font-mono text-white block mt-0.5">
                            ₹{rate}
                            <span className="text-[10px] font-normal text-white/40">/hr</span>
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Smart Next Available Slot Bar (Section 17) */}
            <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-white/60" />
                <span className="text-white/60 font-light">
                  Next Free Slot for {service}:
                </span>
                <span className="font-bold text-white font-mono">
                  {findNextAvailableSlot(service, durationHours).time}
                </span>
              </div>
              <button
                type="button"
                onClick={handleFindNextSlot}
                className="text-[10px] font-black uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                Auto-Select Slot
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Date & Time & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label htmlFor="booking-date-input" className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">
                    Booking Date
                  </label>
                  <input
                    id="booking-date-input"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={todayStr}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="time-slot-dropdown" className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-500" />
                      <span>Available Time Slot</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {availableSlots.length} Open
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      id="time-slot-dropdown"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/20 hover:border-white/40 focus:border-white/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition cursor-pointer appearance-none pr-8 font-mono shadow-sm"
                      required
                    >
                      {showOnlyAvailable ? (
                        availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <option
                              key={slot.time}
                              value={slot.time}
                              className="bg-[#0e0e0e] text-white py-1"
                            >
                              {slot.displayTime} ({slot.time}) {slot.isPeak ? '• Available (Peak)' : '• Available'}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled className="bg-[#0e0e0e] text-red-400">
                            No Slots Available for this Date
                          </option>
                        )
                      ) : (
                        <>
                          <optgroup label={`AVAILABLE SLOTS (${availableSlots.length})`} className="bg-[#0e0e0e] text-emerald-400 font-bold">
                            {availableSlots.map((slot) => (
                              <option
                                key={slot.time}
                                value={slot.time}
                                className="bg-[#0e0e0e] text-white py-1"
                              >
                                {slot.displayTime} ({slot.time}) {slot.isPeak ? '• Available (Peak)' : '• Available'}
                              </option>
                            ))}
                          </optgroup>

                          {unavailableSlots.length > 0 && (
                            <optgroup label={`OCCUPIED / PAST SLOTS (${unavailableSlots.length})`} className="bg-[#0e0e0e] text-neutral-500 font-normal">
                              {unavailableSlots.map((slot) => (
                                <option
                                  key={slot.time}
                                  value={slot.time}
                                  disabled
                                  className="bg-[#0e0e0e] text-neutral-500 py-1"
                                >
                                  {slot.displayTime} ({slot.time}) {slot.isPast ? '• Passed' : '• Booked'}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      )}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="duration-hours-select" className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">
                    Duration
                  </label>
                  <select
                    id="duration-hours-select"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-white/30 focus:outline-none cursor-pointer"
                  >
                    <option value={1} className="bg-[#0a0a0a] text-white">1 Hour</option>
                    <option value={2} className="bg-[#0a0a0a] text-white">2 Hours (Standard)</option>
                    <option value={3} className="bg-[#0a0a0a] text-white">3 Hours (Long Haul)</option>
                    <option value={4} className="bg-[#0a0a0a] text-white">4 Hours (LAN Grind)</option>
                  </select>
                </div>
              </div>

              {/* Slot Live Status Banner & Filter Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  {selectedSlotStatus?.isAvailable ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                      <span className="font-mono font-bold">
                        {formatTime12h(startTime)} - {formatTime12h(calculateEndTime(startTime, durationHours))}
                      </span>
                      <span className="text-white/60 font-light">
                        ({durationHours}h slot ready to book)
                      </span>
                    </div>
                  ) : selectedSlotStatus?.isPast ? (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>This time slot has passed today. Please select an available slot.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Slot occupied or conflicting. Please choose an open slot from the dropdown.</span>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white cursor-pointer select-none ml-auto">
                  <input
                    type="checkbox"
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-red-600 focus:ring-0 w-3 h-3 cursor-pointer"
                  />
                  <span>Show available only</span>
                </label>
              </div>

              {/* Station Selection Grid (Section 18) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                  {isSquadMode
                    ? 'Squad Stations (PC-01 to PC-04 Auto-Allocated)'
                    : `Select Available Station in ${service}`}
                </label>
                {!isSquadMode ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                    {filteredSystems.map((sys) => {
                      const isAvail = sys.status === 'AVAILABLE';
                      const isSelected = selectedSystemId === sys.id;
                      return (
                        <button
                          key={sys.id}
                          type="button"
                          onClick={() => setSelectedSystemId(sys.id)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-white/10 border-white/40 text-white ring-1 ring-white/30'
                              : isAvail
                              ? 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                              : 'bg-white/[0.02] border-white/5 text-white/20 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs uppercase">{sys.name}</span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isAvail
                                  ? 'bg-white'
                                  : sys.status === 'ACTIVE'
                                  ? 'bg-red-600'
                                  : 'bg-white/30'
                              }`}
                            />
                          </div>
                          <span className="text-[9px] uppercase font-mono tracking-widest block mt-1 text-white/50">
                            {sys.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white uppercase tracking-wider">4 Rigs Selected:</span>
                      <span className="text-white/80 font-mono ml-2">
                        {selectedSquadIds.join(', ')}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">
                      Atomic Lock Guaranteed
                    </span>
                  </div>
                )}

                {/* Selected Station Installed Games Box */}
                {!isSquadMode && (() => {
                  const selectedSys = systems.find(s => s.id === selectedSystemId);
                  if (selectedSys) {
                    return (
                      <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase tracking-widest font-mono text-white/60 flex items-center gap-1.5">
                            <Gamepad2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Installed on {selectedSys.name} ({selectedSys.installedGames.length} Games):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openConsoleGames(service, selectedSys.id)}
                            className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 transition cursor-pointer"
                          >
                            View Full Catalog →
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSys.installedGames.map((game, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80"
                            >
                              {game}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-2.5 flex items-center justify-between px-1">
                      <span className="text-[10px] text-white/40">Want to see what games are installed?</span>
                      <button
                        type="button"
                        onClick={() => openConsoleGames(service)}
                        className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Gamepad2 className="w-3 h-3" />
                        <span>Browse Available {service} Games</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Customer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">
                    Mobile Phone (For SMS Pass)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              {/* Price & Summary Breakdown */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/50 uppercase tracking-widest block">
                    Total Estimated Amount
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">
                      ₹{baseCost}
                    </span>
                    {membershipHoursCovered > 0 && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ({membershipHoursCovered}h auto-applied from {customerMembership.planName})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-white/50 font-light">
                  <span>Rate: ₹{currentRate}/hr</span>
                  <br />
                  <span>Duration: {durationHours}h</span>
                </div>
              </div>

              {/* Error Alert with Waitlist option (Section 20) */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  {!waitlistJoined ? (
                    <button
                      type="button"
                      onClick={handleJoinWaitlist}
                      className="self-start bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition cursor-pointer"
                    >
                      Join Waitlist for This Slot
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-semibold text-[11px]">
                      ✓ You have joined the priority waitlist! We will notify you when a rig opens.
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center gap-2"
                >
                  <span>Confirm & Generate Pass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
