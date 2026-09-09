import { Request, Response } from 'express';
import {
  GamingSystem,
  Booking,
  ActiveSession,
  WalletTransaction,
  CustomerMembership,
  SupportTicket,
  StationTransferRequest,
  FnbCustomerOrder,
  DailyChallenge,
  LoyaltyReward,
  CustomerReferralInfo,
  GamingServiceCategory
} from '../types';
import {
  INITIAL_SYSTEMS,
  INITIAL_BOOKINGS,
  INITIAL_ACTIVE_SESSIONS,
  INITIAL_WALLET_TRANSACTIONS,
  INITIAL_CUSTOMER_MEMBERSHIP,
  INITIAL_PRICING_RULES,
  INITIAL_MEMBERSHIP_PLANS
} from '../data/initialData';

// Operating hours & slot definitions (09:00 - 23:30 in 30-min intervals)
export const OPERATING_TIME_SLOTS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

// In-Memory Server State (Authoritative Backend Source of Truth)
let serverSystems: GamingSystem[] = JSON.parse(JSON.stringify(INITIAL_SYSTEMS));
let serverBookings: Booking[] = JSON.parse(JSON.stringify(INITIAL_BOOKINGS));
let serverActiveSessions: ActiveSession[] = JSON.parse(JSON.stringify(INITIAL_ACTIVE_SESSIONS));
let serverWalletTransactions: WalletTransaction[] = JSON.parse(JSON.stringify(INITIAL_WALLET_TRANSACTIONS));
let serverWalletBalance: number = 1240;
let serverCustomerMembership: CustomerMembership = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_MEMBERSHIP));
let serverLoyaltyPoints: number = 2850;
let serverProcessedIdempotencyKeys = new Set<string>();

let serverSupportTickets: SupportTicket[] = [
  {
    id: 'SUP-1029',
    customerId: 'cust-andy',
    customerName: 'Andy Patel',
    stationId: 'pc-01',
    stationName: 'PC-01',
    category: 'CONTROLLER',
    issue: 'DualSense controller trigger resistance calibration needed.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      { sender: 'Andy Patel', text: 'Left trigger resistance feels loose on DualSense.', time: '1h ago' },
      { sender: 'Staff (Dev)', text: 'On our way to swap with a fresh calibrated controller.', time: '45m ago' }
    ]
  }
];

let serverTransferRequests: StationTransferRequest[] = [];
let serverFnbOrders: FnbCustomerOrder[] = [];

export function getServerSystems(): GamingSystem[] { return serverSystems; }
export function setServerSystems(systems: GamingSystem[]) { serverSystems = systems; }
export function getServerBookings(): Booking[] { return serverBookings; }
export function setServerBookings(bookings: Booking[]) { serverBookings = bookings; }
export function getServerActiveSessions(): ActiveSession[] { return serverActiveSessions; }
export function setServerActiveSessions(sessions: ActiveSession[]) { serverActiveSessions = sessions; }
export function getServerFnbOrders(): FnbCustomerOrder[] { return serverFnbOrders; }
export function setServerFnbOrders(orders: FnbCustomerOrder[]) { serverFnbOrders = orders; }


let serverDailyChallenges: DailyChallenge[] = [
  {
    id: 'ch-1',
    title: 'Warm-Up Warrior',
    description: 'Play 2 consecutive hours on any PC or Console station',
    xpReward: 250,
    progress: 2,
    maxProgress: 2,
    target: 2,
    completed: true,
    isClaimed: true,
    category: 'ARENA PLAY'
  },
  {
    id: 'ch-2',
    title: 'Artisan Fuel',
    description: 'Order any artisan espresso or cold brew drink to your station',
    xpReward: 150,
    progress: 1,
    maxProgress: 1,
    target: 1,
    completed: true,
    isClaimed: false,
    category: 'F&B BAR'
  },
  {
    id: 'ch-3',
    title: 'Weekend Apex Striker',
    description: 'Log 5 total gaming hours across the weekend tournament sprint',
    xpReward: 500,
    progress: 3.5,
    maxProgress: 5,
    target: 5,
    completed: false,
    isClaimed: false,
    category: 'TOURNAMENT'
  },
  {
    id: 'ch-4',
    title: 'Squad Commander',
    description: 'Invite a fellow gamer using your personal referral code',
    xpReward: 400,
    progress: 0,
    maxProgress: 1,
    target: 1,
    completed: false,
    isClaimed: false,
    category: 'COMMUNITY'
  }
];

let serverLoyaltyRewards: LoyaltyReward[] = [
  {
    id: 'rew-1',
    title: '₹100 Wallet Credit',
    description: 'Instant credit added to your gaming balance for any station or rig.',
    xpCost: 800,
    pointCost: 800,
    category: 'WALLET',
    type: 'WALLET_CREDIT',
    value: 100,
    claimed: false
  },
  {
    id: 'rew-2',
    title: 'Free 30-Min Session',
    description: 'Bonus 30 minutes playtime on any standard PC or Console station.',
    xpCost: 1200,
    pointCost: 1200,
    category: 'STATION TIME',
    type: 'FREE_HOURS',
    value: 0.5,
    claimed: false
  },
  {
    id: 'rew-3',
    title: 'Artisan Cold Brew Voucher',
    description: 'Redeem for 1 specialty iced caramel macchiato or Nitro Cold Brew.',
    xpCost: 1000,
    pointCost: 1000,
    category: 'F&B BAR',
    type: 'FREE_DRINK',
    value: 180,
    claimed: false
  },
  {
    id: 'rew-4',
    title: 'Tournament Free Pass',
    description: '100% waiver on entry fee for upcoming weekly community cup.',
    xpCost: 2500,
    pointCost: 2500,
    category: 'EVENTS',
    type: 'TOURNAMENT_PASS',
    value: 499,
    claimed: false
  }
];

let serverReferralInfo: CustomerReferralInfo = {
  referralCode: 'RAGHAV-GC7X',
  code: 'RAGHAV-GC7X',
  friendsReferred: 4,
  successfulReferrals: 3,
  totalEarned: 300
};

// Helper: Customer-safe Station sanitization (strips internal IP address)
function sanitizeStationForCustomer(s: GamingSystem) {
  const { ipAddress, ...safeData } = s;
  return safeData;
}

// Helper: Calculate End Time string
function calculateEndTimeStr(startTimeStr: string, durationHours: number): string {
  if (!startTimeStr || !startTimeStr.includes(':')) return '';
  const [sh, sm] = startTimeStr.split(':').map(Number);
  const totalMins = sh * 60 + sm + Math.round(durationHours * 60);
  const eh = Math.floor(totalMins / 60) % 24;
  const em = totalMins % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

// Helper: Minute parser
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Helper: Check for overlapping slots on a station
function checkBookingConflict(systemId: string, date: string, startStr: string, endStr: string, excludeBookingId?: string): boolean {
  const reqStart = timeToMinutes(startStr);
  const reqEnd = timeToMinutes(endStr);

  return serverBookings.some((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.systemId !== systemId || b.date !== date) return false;
    if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'COMPLETED' || b.bookingStatus === 'NO-SHOW') return false;

    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);

    // Conflict occurs if intervals overlap
    return reqStart < bEnd && reqEnd > bStart;
  });
}

// -------------------------------------------------------------
// 1. GET /api/stations
// -------------------------------------------------------------
export function handleGetStations(req: Request, res: Response) {
  const safe = serverSystems.map(sanitizeStationForCustomer);
  res.json({ success: true, stations: safe });
}

// -------------------------------------------------------------
// 2. GET /api/stations/:id/availability?date=YYYY-MM-DD
// -------------------------------------------------------------
export function handleGetStationAvailability(req: Request, res: Response) {
  const systemId = req.params.id;
  const date = (req.query.date as string) || new Date().toISOString().substring(0, 10);
  const duration = parseFloat((req.query.duration as string) || '1');

  const station = serverSystems.find((s) => s.id === systemId);
  if (!station) {
    return res.status(404).json({ success: false, error: 'Station not found' });
  }

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const isToday = date === todayStr;
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const slots = OPERATING_TIME_SLOTS.map((slot) => {
    const startMins = timeToMinutes(slot);
    const endMins = startMins + Math.round(duration * 60);
    const slotEndStr = calculateEndTimeStr(slot, duration);

    // Is slot in past?
    if (isToday && startMins < currentMins - 5) {
      return {
        slot,
        endTime: slotEndStr,
        available: false,
        status: 'PAST',
        reason: 'Time slot has passed'
      };
    }

    // Check station maintenance
    if (station.status === 'MAINTENANCE' || station.status === 'OFFLINE') {
      return {
        slot,
        endTime: slotEndStr,
        available: false,
        status: 'MAINTENANCE',
        reason: 'Station undergoing scheduled maintenance'
      };
    }

    // Check active session collision if today
    if (isToday && station.status === 'ACTIVE' && station.sessionEndTime) {
      const slotTimeMs = new Date().setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);
      if (slotTimeMs < station.sessionEndTime) {
        return {
          slot,
          endTime: slotEndStr,
          available: false,
          status: 'ACTIVE_SESSION',
          reason: 'Station currently occupied by player'
        };
      }
    }

    // Check existing confirmed/upcoming bookings
    const isConflict = checkBookingConflict(systemId, date, slot, slotEndStr);
    if (isConflict) {
      return {
        slot,
        endTime: slotEndStr,
        available: false,
        status: 'BOOKED',
        reason: 'Reserved by another customer'
      };
    }

    return {
      slot,
      endTime: slotEndStr,
      available: true,
      status: 'AVAILABLE'
    };
  });

  res.json({
    success: true,
    station: sanitizeStationForCustomer(station),
    date,
    slots
  });
}

// -------------------------------------------------------------
// 3. POST /api/bookings (Atomic Server-Side Collision Check)
// -------------------------------------------------------------
export function handleCreateBooking(req: Request, res: Response) {
  try {
    const {
      customerName,
      customerPhone,
      systemId,
      date,
      startTime,
      durationHours,
      gameTitle,
      useMembership,
      foodItems,
      paymentMethod = 'UPI'
    } = req.body;

    if (!customerName || !systemId || !date || !startTime || !durationHours) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking parameters (name, system, date, time, duration).'
      });
    }

    const duration = parseFloat(durationHours);
    if (duration <= 0 || duration > 12) {
      return res.status(400).json({ success: false, error: 'Duration must be between 0.5 and 12 hours.' });
    }

    const station = serverSystems.find((s) => s.id === systemId);
    if (!station) {
      return res.status(404).json({ success: false, error: 'Target gaming station does not exist.' });
    }

    const endTime = calculateEndTimeStr(startTime, duration);

    // CRITICAL REQUIREMENT 8: Server-side atomic collision detection
    const isConflict = checkBookingConflict(systemId, date, startTime, endTime);
    if (isConflict) {
      return res.status(409).json({
        success: false,
        error: 'Sorry, this station was just booked by another customer.',
        conflict: true
      });
    }

    // Authoritative pricing calculation
    const pricingRule = INITIAL_PRICING_RULES.find((r) => r.service === station.category);
    let hourlyRate = station.hourlyRate;
    if (pricingRule) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
      const slotHour = parseInt(startTime.split(':')[0], 10);
      const isPeak = slotHour >= 18 && slotHour <= 23;

      if (isWeekend && pricingRule.weekendPrice) {
        hourlyRate = pricingRule.weekendPrice;
      } else if (isPeak && pricingRule.peakPrice) {
        hourlyRate = pricingRule.peakPrice;
      } else {
        hourlyRate = pricingRule.normalPrice;
      }
    }

    const gamingSubtotal = hourlyRate * duration;
    let membershipUsedHours = 0;
    let vipMembershipUsedHours = 0;
    let discount = 0;

    if (useMembership && serverCustomerMembership && serverCustomerMembership.status === 'ACTIVE') {
      const isVipStation = station.category === 'VIP Room' || station.category === 'Sim Racing';
      if (isVipStation && serverCustomerMembership.vipHoursRemaining > 0) {
        vipMembershipUsedHours = Math.min(duration, serverCustomerMembership.vipHoursRemaining);
        serverCustomerMembership.vipHoursRemaining -= vipMembershipUsedHours;
        serverCustomerMembership.vipHoursUsed += vipMembershipUsedHours;
        discount += vipMembershipUsedHours * hourlyRate;
      } else if (serverCustomerMembership.normalHoursRemaining > 0) {
        membershipUsedHours = Math.min(duration, serverCustomerMembership.normalHoursRemaining);
        serverCustomerMembership.normalHoursRemaining -= membershipUsedHours;
        serverCustomerMembership.normalHoursUsed += membershipUsedHours;
        discount += membershipUsedHours * hourlyRate;
      }
    }

    // Food add-ons calculation
    let foodTotal = 0;
    if (Array.isArray(foodItems)) {
      foodItems.forEach((f: any) => {
        foodTotal += (f.price || 0) * (f.quantity || 1);
      });
    }

    const finalAmount = Math.max(0, gamingSubtotal - discount + foodTotal);

    // If paid via wallet, ensure sufficient balance
    if (paymentMethod === 'Wallet') {
      if (serverWalletBalance < finalAmount) {
        return res.status(400).json({
          success: false,
          error: `Insufficient wallet balance (₹${serverWalletBalance}). Please recharge or choose another payment method.`
        });
      }
      serverWalletBalance -= finalAmount;
      serverWalletTransactions.unshift({
        id: `tx-${Date.now()}`,
        customerId: 'cust-andy',
        type: 'GAMING',
        amount: -finalAmount,
        balanceAfter: serverWalletBalance,
        timestamp: new Date().toISOString(),
        description: `Booking reservation on ${station.name} (${duration}h)`
      });
    }

    // Generate secure opaque QR Booking Pass payload
    const bookingId = `GC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
    const qrSignature = `SIG-BYTEBREW-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36)}`;
    const qrCode = `${bookingId}::${qrSignature}`;

    const newBooking: Booking = {
      id: bookingId,
      customerId: 'cust-andy',
      customerName,
      customerPhone,
      systemId: station.id,
      systemName: station.name,
      service: station.category,
      gameTitle: gameTitle || station.installedGames[0] || 'Selected at Station',
      date,
      startTime,
      endTime,
      durationHours: duration,
      applicableRate: hourlyRate,
      membershipUsedHours,
      vipMembershipUsedHours,
      discount,
      foodTotal,
      finalAmount,
      paymentStatus: 'PAID',
      bookingStatus: 'UPCOMING',
      qrCode,
      createdAt: new Date().toISOString()
    };

    serverBookings.unshift(newBooking);

    // Award loyalty points for booking (10 XP per ₹100 spent)
    const earnedXp = Math.floor(finalAmount / 10);
    serverLoyaltyPoints += earnedXp;

    return res.status(201).json({
      success: true,
      message: 'Station reservation confirmed!',
      booking: newBooking,
      earnedXp
    });
  } catch (err: any) {
    console.error('Create booking server error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal booking error' });
  }
}

// -------------------------------------------------------------
// 4. POST /api/bookings/:id/check-in (Check-in window validation)
// -------------------------------------------------------------
export function handleCheckInBooking(req: Request, res: Response) {
  const bookingId = req.params.id;
  const booking = serverBookings.find((b) => b.id === bookingId || b.qrCode.startsWith(bookingId));

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }

  if (booking.bookingStatus === 'ACTIVE' || booking.bookingStatus === 'COMPLETED') {
    return res.status(400).json({ success: false, error: 'QR Pass has already been checked in or completed.' });
  }

  if (booking.bookingStatus === 'CANCELLED') {
    return res.status(400).json({ success: false, error: 'This booking has been cancelled.' });
  }

  // Section 22: Check-in window validation (-15 min to +15 min from start)
  const now = new Date();
  const [bh, bm] = booking.startTime.split(':').map(Number);
  const bookingStartDate = new Date(booking.date);
  bookingStartDate.setHours(bh, bm, 0, 0);

  const diffMinutes = (now.getTime() - bookingStartDate.getTime()) / (1000 * 60);

  // If more than 15 minutes before
  if (diffMinutes < -15) {
    const minsUntilOpen = Math.round(-diffMinutes - 15);
    return res.status(400).json({
      success: false,
      error: `Your check-in window has not opened yet. Check-in opens 15 minutes before your start time (in ${minsUntilOpen} minutes).`
    });
  }

  // If more than 15 minutes after start time
  if (diffMinutes > 15) {
    booking.bookingStatus = 'NO-SHOW';
    return res.status(400).json({
      success: false,
      error: 'Your booking has passed the 15-minute check-in grace window and has expired.'
    });
  }

  // Update booking status
  booking.bookingStatus = 'ACTIVE';

  // Boot up active session
  const station = serverSystems.find((s) => s.id === booking.systemId);
  if (station) {
    station.status = 'ACTIVE';
    station.currentCustomerName = booking.customerName;
    station.currentCustomerPhone = booking.customerPhone;
    station.sessionEndTime = Date.now() + booking.durationHours * 3600 * 1000;
  }

  res.json({
    success: true,
    message: `Check-in successful! Station ${booking.systemName} is now booted and ready for ${booking.customerName}.`,
    booking
  });
}

// -------------------------------------------------------------
// 5. POST /api/bookings/:id/cancel (Configurable Tiered Refund Policy)
// -------------------------------------------------------------
export function handleCancelBooking(req: Request, res: Response) {
  const bookingId = req.params.id;
  const booking = serverBookings.find((b) => b.id === bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }

  if (booking.bookingStatus !== 'UPCOMING') {
    return res.status(400).json({
      success: false,
      error: `Cannot cancel a booking with status '${booking.bookingStatus}'.`
    });
  }

  // Calculate cancellation refund according to policy:
  // > 24 hours: 100% refund
  // 6 - 24 hours: 75% refund
  // 2 - 6 hours: 50% refund
  // < 2 hours: 0% refund
  const now = new Date();
  const [bh, bm] = booking.startTime.split(':').map(Number);
  const bookingStartDate = new Date(booking.date);
  bookingStartDate.setHours(bh, bm, 0, 0);

  const hoursRemaining = (bookingStartDate.getTime() - now.getTime()) / (1000 * 3600);

  let refundPercentage = 0;
  if (hoursRemaining >= 24) {
    refundPercentage = 100;
  } else if (hoursRemaining >= 6) {
    refundPercentage = 75;
  } else if (hoursRemaining >= 2) {
    refundPercentage = 50;
  } else {
    refundPercentage = 0;
  }

  const refundAmount = Math.round((booking.finalAmount * refundPercentage) / 100);

  booking.bookingStatus = 'CANCELLED';

  // Refund to wallet
  if (refundAmount > 0) {
    serverWalletBalance += refundAmount;
    serverWalletTransactions.unshift({
      id: `tx-ref-${Date.now()}`,
      customerId: booking.customerId,
      type: 'REFUND',
      amount: refundAmount,
      balanceAfter: serverWalletBalance,
      timestamp: new Date().toISOString(),
      description: `Refund (${refundPercentage}%) for cancelled booking ${booking.id} on ${booking.systemName}`
    });
  }

  res.json({
    success: true,
    message: `Booking ${booking.id} cancelled. ${refundPercentage}% refund (₹${refundAmount}) credited to your wallet.`,
    refundPercentage,
    refundAmount,
    newWalletBalance: serverWalletBalance
  });
}

// -------------------------------------------------------------
// 6. POST /api/bookings/:id/reschedule
// -------------------------------------------------------------
export function handleRescheduleBooking(req: Request, res: Response) {
  const bookingId = req.params.id;
  const { newDate, newStartTime, newSystemId } = req.body;

  const booking = serverBookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found.' });
  }

  const targetSystemId = newSystemId || booking.systemId;
  const targetEndTime = calculateEndTimeStr(newStartTime, booking.durationHours);

  // Check collision excluding current booking
  const hasConflict = checkBookingConflict(targetSystemId, newDate, newStartTime, targetEndTime, booking.id);
  if (hasConflict) {
    return res.status(409).json({
      success: false,
      error: 'The requested reschedule slot is already occupied on this station.'
    });
  }

  const targetStation = serverSystems.find((s) => s.id === targetSystemId);

  booking.date = newDate;
  booking.startTime = newStartTime;
  booking.endTime = targetEndTime;
  if (targetStation) {
    booking.systemId = targetStation.id;
    booking.systemName = targetStation.name;
    booking.service = targetStation.category;
  }

  res.json({
    success: true,
    message: `Booking successfully rescheduled to ${newDate} at ${newStartTime}.`,
    booking
  });
}

// -------------------------------------------------------------
// 7. POST /api/sessions/:id/extend (Availability collision check)
// -------------------------------------------------------------
export function handleExtendSession(req: Request, res: Response) {
  const sessionId = req.params.id;
  const extraHours = parseFloat(req.body.extraHours || '1');

  const session = serverActiveSessions.find((s) => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Active gaming session not found.' });
  }

  const station = serverSystems.find((s) => s.id === session.systemId);
  if (!station) {
    return res.status(404).json({ success: false, error: 'Station not found.' });
  }

  const currentEndMs = session.endTime;
  const newEndMs = currentEndMs + extraHours * 3600 * 1000;
  const newEndDate = new Date(newEndMs);
  const todayStr = new Date().toISOString().substring(0, 10);

  // Check if upcoming booking on this station conflicts
  const nextBooking = serverBookings.find((b) => {
    if (b.systemId === session.systemId && b.date === todayStr && b.bookingStatus === 'UPCOMING') {
      const [bh, bm] = b.startTime.split(':').map(Number);
      const bStartTimeMs = new Date().setHours(bh, bm, 0, 0);
      return bStartTimeMs < newEndMs && bStartTimeMs >= currentEndMs - 60000;
    }
    return false;
  });

  if (nextBooking) {
    return res.status(409).json({
      success: false,
      error: `Extension unavailable because another booking begins at ${nextBooking.startTime}.`
    });
  }

  const extraCost = session.ratePerHour * extraHours;
  session.durationHours += extraHours;
  session.endTime = newEndMs;
  session.totalAmount += extraCost;

  if (station) {
    station.sessionEndTime = newEndMs;
  }

  res.json({
    success: true,
    message: `Session extended by ${extraHours} hour(s).`,
    session,
    extraCost
  });
}

// -------------------------------------------------------------
// 8. POST /api/sessions/:id/transfer-request
// -------------------------------------------------------------
export function handleTransferRequest(req: Request, res: Response) {
  const sessionId = req.params.id;
  const { requestedStationId, reason } = req.body;

  const session = serverActiveSessions.find((s) => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found.' });
  }

  const targetStation = serverSystems.find((s) => s.id === requestedStationId);
  if (!targetStation) {
    return res.status(404).json({ success: false, error: 'Requested station does not exist.' });
  }

  if (targetStation.status !== 'AVAILABLE') {
    return res.status(400).json({ success: false, error: `Station ${targetStation.name} is currently ${targetStation.status}.` });
  }

  const transferReq: StationTransferRequest = {
    id: `TR-${Date.now().toString(36).toUpperCase()}`,
    sessionId,
    customerId: session.customerId,
    customerName: session.customerName,
    currentStationId: session.systemId,
    currentStationName: session.systemName,
    requestedStationId: targetStation.id,
    requestedStationName: targetStation.name,
    reason: reason || 'Gamer requested station switch',
    status: 'REQUESTED',
    createdAt: new Date().toISOString()
  };

  serverTransferRequests.unshift(transferReq);

  res.json({
    success: true,
    message: `Transfer request submitted for employee approval. Target: ${targetStation.name}.`,
    transferRequest: transferReq
  });
}

// -------------------------------------------------------------
// 9. POST /api/sessions/:id/call-staff
// -------------------------------------------------------------
export function handleCallStaff(req: Request, res: Response) {
  const sessionId = req.params.id;
  const { issue, category = 'GENERAL' } = req.body;

  const session = serverActiveSessions.find((s) => s.id === sessionId);
  const stationName = session ? session.systemName : 'General Arena';

  const ticketId = `SUP-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticket: SupportTicket = {
    id: ticketId,
    customerId: session ? session.customerId : 'cust-andy',
    customerName: session ? session.customerName : 'Andy Patel',
    stationId: session ? session.systemId : undefined,
    stationName,
    category,
    issue: issue || 'Assistance requested at station',
    status: 'WAITING_FOR_STAFF',
    createdAt: new Date().toISOString(),
    messages: [
      {
        sender: session ? session.customerName : 'Customer',
        text: issue || 'Requested staff assistance at station.',
        time: 'Just now'
      }
    ]
  };

  serverSupportTickets.unshift(ticket);

  res.json({
    success: true,
    message: `Staff alerted! Request #${ticketId} is queued. A technician is walking over.`,
    ticket
  });
}

// -------------------------------------------------------------
// 10. POST /api/wallet/recharge (Idempotent server-side processing)
// -------------------------------------------------------------
export function handleWalletRecharge(req: Request, res: Response) {
  const { amount, idempotencyKey, paymentMethod = 'UPI' } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount < 10 || numAmount > 50000) {
    return res.status(400).json({ success: false, error: 'Recharge amount must be between ₹10 and ₹50,000.' });
  }

  // Idempotency check to prevent duplicate charge
  if (idempotencyKey) {
    if (serverProcessedIdempotencyKeys.has(idempotencyKey)) {
      return res.json({
        success: true,
        message: 'Recharge was already processed.',
        walletBalance: serverWalletBalance,
        duplicate: true
      });
    }
    serverProcessedIdempotencyKeys.add(idempotencyKey);
  }

  serverWalletBalance += numAmount;

  const transaction: WalletTransaction = {
    id: `tx-rec-${Date.now()}`,
    customerId: 'cust-andy',
    type: 'RECHARGE',
    amount: numAmount,
    balanceAfter: serverWalletBalance,
    timestamp: new Date().toISOString(),
    description: `Wallet top-up via ${paymentMethod}`
  };

  serverWalletTransactions.unshift(transaction);

  res.json({
    success: true,
    message: `Successfully added ₹${numAmount} to your wallet!`,
    walletBalance: serverWalletBalance,
    transaction
  });
}

// -------------------------------------------------------------
// 11. POST /api/membership/purchase
// -------------------------------------------------------------
export function handlePurchaseMembership(req: Request, res: Response) {
  const { planId, paymentMethod = 'Wallet' } = req.body;
  const plan = INITIAL_MEMBERSHIP_PLANS.find((p) => p.id === planId);

  if (!plan) {
    return res.status(404).json({ success: false, error: 'Membership plan not found.' });
  }

  if (paymentMethod === 'Wallet') {
    if (serverWalletBalance < plan.price) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance (₹${serverWalletBalance}) for ${plan.name} (₹${plan.price}). Please top up first.`
      });
    }
    serverWalletBalance -= plan.price;
    serverWalletTransactions.unshift({
      id: `tx-mem-${Date.now()}`,
      customerId: 'cust-andy',
      type: 'GAMING',
      amount: -plan.price,
      balanceAfter: serverWalletBalance,
      timestamp: new Date().toISOString(),
      description: `Purchased ${plan.name} plan`
    });
  }

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + plan.durationMonths);

  serverCustomerMembership = {
    id: `mem-${Date.now()}`,
    customerId: 'cust-andy',
    customerName: 'Andy Patel',
    planName: plan.name,
    pricePaid: plan.price,
    purchaseDate: new Date().toISOString().substring(0, 10),
    expiryDate: expiry.toISOString().substring(0, 10),
    normalHoursAllocated: plan.normalHours,
    normalHoursUsed: 0,
    normalHoursRemaining: plan.normalHours,
    vipHoursAllocated: plan.vipHours,
    vipHoursUsed: 0,
    vipHoursRemaining: plan.vipHours,
    status: 'ACTIVE'
  };

  // Bonus XP
  serverLoyaltyPoints += 500;

  res.json({
    success: true,
    message: `Congratulations! ${plan.name} is now activated. Enjoy premium gaming perks.`,
    membership: serverCustomerMembership,
    walletBalance: serverWalletBalance
  });
}

// -------------------------------------------------------------
// 12. POST /api/rewards/redeem
// -------------------------------------------------------------
export function handleRedeemReward(req: Request, res: Response) {
  const { rewardId } = req.body;
  const reward = serverLoyaltyRewards.find((r) => r.id === rewardId);

  if (!reward) {
    return res.status(404).json({ success: false, error: 'Reward not found.' });
  }

  if (serverLoyaltyPoints < reward.xpCost) {
    return res.status(400).json({
      success: false,
      error: `You need ${reward.xpCost} XP to redeem this perk. You currently have ${serverLoyaltyPoints} XP.`
    });
  }

  serverLoyaltyPoints -= reward.xpCost;
  reward.claimed = true;

  if (reward.type === 'WALLET_CREDIT') {
    serverWalletBalance += reward.value;
    serverWalletTransactions.unshift({
      id: `tx-rew-${Date.now()}`,
      customerId: 'cust-andy',
      type: 'RECHARGE',
      amount: reward.value,
      balanceAfter: serverWalletBalance,
      timestamp: new Date().toISOString(),
      description: `Redeemed ${reward.title} loyalty perk`
    });
  }

  res.json({
    success: true,
    message: `Successfully redeemed ${reward.title}!`,
    remainingXp: serverLoyaltyPoints,
    newPointsBalance: serverLoyaltyPoints,
    newWalletBalance: serverWalletBalance,
    rewardTitle: reward.title,
    reward
  });
}

// -------------------------------------------------------------
// 13. POST /api/fnb/orders & /api/fnb/order (In-session F&B kitchen order)
// -------------------------------------------------------------
export function handleCreateFnbOrder(req: Request, res: Response) {
  const {
    items,
    sessionId,
    targetSystemId,
    targetLocation,
    notes,
    payWithWallet,
    paymentMethod = 'Wallet'
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Cart has no items.' });
  }

  let subtotal = 0;
  items.forEach((item: any) => {
    subtotal += (item.price || 0) * (item.quantity || 1);
  });

  const gst = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + gst;
  const isWalletPayment = payWithWallet || paymentMethod === 'Wallet';

  if (isWalletPayment) {
    if (serverWalletBalance < total) {
      return res.status(400).json({
        success: false,
        error: `Insufficient wallet balance (₹${serverWalletBalance}) for F&B order (₹${total}).`
      });
    }
    serverWalletBalance -= total;
    serverWalletTransactions.unshift({
      id: `tx-fnb-${Date.now()}`,
      customerId: 'cust-andy',
      type: 'FOOD',
      amount: -total,
      balanceAfter: serverWalletBalance,
      timestamp: new Date().toISOString(),
      description: `Artisan Café F&B order (${items.length} items)`
    });
  }

  const effectiveSessionId = sessionId || targetSystemId;
  const session = serverActiveSessions.find((s) => s.id === effectiveSessionId || s.systemId === effectiveSessionId);
  const stationName = session ? session.systemName : (targetLocation || 'Lounge Counter');

  const orderId = `F${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrder: FnbCustomerOrder = {
    id: orderId,
    sessionId: session ? session.id : undefined,
    stationName,
    customerId: 'cust-andy',
    customerName: 'Andy Patel',
    items,
    subtotal,
    gst,
    total,
    paymentMethod: isWalletPayment ? 'Wallet' : 'UPI',
    status: 'PLACED',
    orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    estimatedDeliveryMins: 12
  };

  serverFnbOrders.unshift(newOrder);

  // If active session exists, attach food items to session ledger
  if (session) {
    items.forEach((item: any) => {
      session.foodItems.push({
        id: item.id || `item-${Date.now()}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
      session.foodTotal += item.price * item.quantity;
      session.totalAmount += item.price * item.quantity;
    });
  }

  res.status(201).json({
    success: true,
    message: `Order #${orderId} sent to the barista kitchen! Estimated delivery: 10-15 mins.`,
    order: newOrder,
    walletBalance: serverWalletBalance
  });
}

// -------------------------------------------------------------
// 14. Support Tickets: GET & POST
// -------------------------------------------------------------
export function handleGetSupportTickets(req: Request, res: Response) {
  res.json({ success: true, tickets: serverSupportTickets });
}

export function handleCreateSupportTicket(req: Request, res: Response) {
  const { category, issue, stationId } = req.body;
  if (!issue) {
    return res.status(400).json({ success: false, error: 'Issue description is required.' });
  }

  const station = serverSystems.find((s) => s.id === stationId);
  const ticketId = `SUP-${Math.floor(1000 + Math.random() * 9000)}`;

  const ticket: SupportTicket = {
    id: ticketId,
    customerId: 'cust-andy',
    customerName: 'Andy Patel',
    stationId,
    stationName: station ? station.name : undefined,
    category: category || 'GENERAL',
    issue,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    messages: [{ sender: 'Andy Patel', text: issue, time: 'Just now' }]
  };

  serverSupportTickets.unshift(ticket);

  res.status(201).json({
    success: true,
    message: `Support ticket #${ticketId} created.`,
    ticket
  });
}

// -------------------------------------------------------------
// 15. GET /api/me (Aggregated Customer Dashboard Data)
// -------------------------------------------------------------
export function handleGetCustomerData(req: Request, res: Response) {
  // Find customer's active session if any
  const myActiveSession = serverActiveSessions.find(
    (s) => s.status === 'ACTIVE' && (s.customerId === 'cust-andy' || s.customerName.includes('Andy') || s.customerName.includes('Rahul'))
  ) || serverActiveSessions[0] || null;

  // Customer's upcoming bookings
  const myBookings = serverBookings.filter(
    (b) => b.customerId === 'cust-andy' || b.customerName.includes('Andy')
  );

  res.json({
    success: true,
    customer: {
      id: 'cust-andy',
      name: 'Andy Patel',
      gamerTag: 'SHADOW_VIPER',
      email: 'andy.patel@gamer.io',
      phone: '+91 98991 12233',
      tier: 'ELITE MEMBER',
      loyaltyLevel: 'Nexus Elite',
      wallet: {
        total: serverWalletBalance,
        available: serverWalletBalance,
        promotional: 150,
        refundable: serverWalletBalance
      },
      loyalty: {
        points: serverLoyaltyPoints,
        level: 'ELITE',
        nextLevelXp: 3000,
        challenges: serverDailyChallenges,
        rewards: serverLoyaltyRewards
      },
      membership: serverCustomerMembership,
      referral: serverReferralInfo,
      activeSession: myActiveSession,
      bookings: myBookings,
      fnbOrders: serverFnbOrders,
      tickets: serverSupportTickets,
      walletTransactions: serverWalletTransactions
    }
  });
}

// -------------------------------------------------------------
// 16. GET /api/rewards/challenges
// -------------------------------------------------------------
export function handleGetChallenges(req: Request, res: Response) {
  res.json({
    success: true,
    challenges: serverDailyChallenges
  });
}

// -------------------------------------------------------------
// 17. GET /api/rewards/catalog
// -------------------------------------------------------------
export function handleGetRewardCatalog(req: Request, res: Response) {
  res.json({
    success: true,
    rewards: serverLoyaltyRewards
  });
}

// -------------------------------------------------------------
// 18. GET /api/referrals/me
// -------------------------------------------------------------
export function handleGetReferralInfo(req: Request, res: Response) {
  res.json({
    success: true,
    referralInfo: serverReferralInfo
  });
}

// -------------------------------------------------------------
// 19. POST /api/rewards/claim-challenge
// -------------------------------------------------------------
export function handleClaimChallenge(req: Request, res: Response) {
  const { challengeId } = req.body;
  const challenge = serverDailyChallenges.find((c) => c.id === challengeId);

  if (!challenge) {
    return res.status(404).json({ success: false, error: 'Challenge not found.' });
  }

  if (challenge.isClaimed) {
    return res.status(400).json({ success: false, error: 'Challenge reward has already been claimed.' });
  }

  challenge.completed = true;
  challenge.isClaimed = true;
  if (challenge.target) {
    challenge.progress = challenge.target;
  }
  serverLoyaltyPoints += challenge.xpReward;

  res.json({
    success: true,
    message: `Successfully claimed +${challenge.xpReward} XP for '${challenge.title}'!`,
    claimedXp: challenge.xpReward,
    newTotalPoints: serverLoyaltyPoints,
    challenge
  });
}

// -------------------------------------------------------------
// 20. GET /api/wallet/transactions
// -------------------------------------------------------------
export function handleGetWalletTransactions(req: Request, res: Response) {
  res.json({
    success: true,
    balance: serverWalletBalance,
    transactions: serverWalletTransactions
  });
}

// -------------------------------------------------------------
// 21. POST /api/support/tickets/:id/reply
// -------------------------------------------------------------
export function handleSupportTicketReply(req: Request, res: Response) {
  const { id } = req.params;
  const { message, sender } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message content is required.' });
  }

  const ticket = serverSupportTickets.find((t) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ success: false, error: 'Support ticket not found.' });
  }

  const newMsg = {
    sender: sender || 'Andy Patel',
    text: message.trim(),
    time: 'Just now'
  };

  ticket.messages.push(newMsg);
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    ticket.status = 'IN_PROGRESS';
  }

  res.json({
    success: true,
    message: 'Reply sent successfully.',
    ticket
  });
}

