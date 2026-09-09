import { Request, Response } from 'express';
import {
  EmployeeShift,
  CashLedgerEntry,
  CashLedgerType,
  RefundRequest,
  RefundStatus,
  OperationalAlert,
  EmployeeActivity,
  EmployeeDashboardStats,
  EmployeeCustomerRecord,
  MaintenanceTicket,
  WaitlistEntry,
  ActiveSession,
  GamingSystem,
  Booking,
  Invoice,
  GamingServiceCategory
} from '../types';
import {
  getServerSystems,
  setServerSystems,
  getServerBookings,
  setServerBookings,
  getServerActiveSessions,
  setServerActiveSessions,
  getServerFnbOrders,
  setServerFnbOrders
} from './apiHandlers';
import { INITIAL_FNB_PRODUCTS, INITIAL_PRICING_RULES } from '../data/initialData';

// -------------------------------------------------------------
// In-Memory Server-Authoritative State for Employee Portal
// -------------------------------------------------------------

let currentShift: EmployeeShift = {
  id: 'shift-' + new Date().toISOString().slice(0, 10),
  employeeName: 'Staff (Dev / Lead)',
  shiftDate: new Date().toISOString().slice(0, 10),
  startTime: '09:00 AM',
  openingCash: 2500,
  cashSales: 840,
  upiSales: 1620,
  cardSales: 450,
  walletSales: 320,
  expenses: 150,
  status: 'OPEN'
};

let cashLedger: CashLedgerEntry[] = [
  {
    id: 'cld-001',
    shiftId: currentShift.id,
    type: 'OPENING',
    amount: 2500,
    runningBalance: 2500,
    description: 'Starting morning cash drawer float',
    employeeName: currentShift.employeeName,
    timestamp: new Date(Date.now() - 4 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'cld-002',
    shiftId: currentShift.id,
    type: 'SALE_CASH',
    amount: 250,
    runningBalance: 2750,
    description: 'Walk-in session 1hr PC-02 (Player: Rahul K.)',
    referenceId: 'INV-2026-081',
    employeeName: currentShift.employeeName,
    timestamp: new Date(Date.now() - 3 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'cld-003',
    shiftId: currentShift.id,
    type: 'SALE_CASH',
    amount: 140,
    runningBalance: 2890,
    description: 'Counter F&B order: 2x Cold Brew & Doritos',
    referenceId: 'INV-2026-085',
    employeeName: currentShift.employeeName,
    timestamp: new Date(Date.now() - 2.5 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'cld-004',
    shiftId: currentShift.id,
    type: 'EXPENSE',
    amount: -150,
    runningBalance: 2740,
    description: 'Emergency disinfectant wipes & cable ties from local mart',
    referenceId: 'EXP-109',
    employeeName: currentShift.employeeName,
    timestamp: new Date(Date.now() - 1.5 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'cld-005',
    shiftId: currentShift.id,
    type: 'SALE_CASH',
    amount: 450,
    runningBalance: 3190,
    description: 'Walk-in session 2hr PS5-01 (Squad play)',
    referenceId: 'INV-2026-092',
    employeeName: currentShift.employeeName,
    timestamp: new Date(Date.now() - 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

let operationalAlerts: OperationalAlert[] = [
  {
    id: 'alt-01',
    severity: 'WARNING',
    title: 'Session Ending in 10 Minutes',
    message: 'Station PC-03 (Customer: Sarah Chen) timer will reach 00:00 soon. Check with customer for extension or wrap-up.',
    stationId: 'pc-03',
    timestamp: '5 mins ago',
    resolved: false
  },
  {
    id: 'alt-02',
    severity: 'INFO',
    title: 'Upcoming Reservation Inbound',
    message: 'Booking BK-109 arriving in 15 mins for Sim Racing Pod SR-01. Ensure rig wheel calibration is verified.',
    stationId: 'sim-01',
    timestamp: '12 mins ago',
    resolved: false
  },
  {
    id: 'alt-03',
    severity: 'CRITICAL',
    title: 'Low Inventory Alert',
    message: 'Red Bull Energy 250ml has reached critical threshold (only 2 cans remaining in refrigeration unit).',
    timestamp: '35 mins ago',
    resolved: false
  }
];

let maintenanceTickets: MaintenanceTicket[] = [
  {
    id: 'maint-01',
    systemId: 'pc-04',
    systemName: 'PC-04 (Elite RTX 4080)',
    issueCategory: 'HARDWARE',
    severity: 'HIGH',
    reportedBy: 'Staff (Dev)',
    reportedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: 'IN_PROGRESS',
    assignedTechnician: 'Hardware Team (Vikram)',
    description: 'Rear chassis fan emitting high-pitch rattle under full load. Marked for fan bearing swap.'
  },
  {
    id: 'maint-02',
    systemId: 'ps5-02',
    systemName: 'PS5-02 (4K OLED Pod)',
    issueCategory: 'ACCESSORY',
    severity: 'MEDIUM',
    reportedBy: 'Staff (Dev)',
    reportedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'OPEN',
    description: 'DualSense controller #2 left analog stick slight left drift detected by user.'
  }
];

let waitlistEntries: WaitlistEntry[] = [
  {
    id: 'wait-01',
    customerName: 'Kunal Verma',
    customerPhone: '+91 98765 43210',
    service: 'PC_GAMING',
    preferredTime: 'Immediate',
    durationHours: 2,
    queuePosition: 1,
    status: 'WAITING',
    joinedAt: '15 mins ago'
  },
  {
    id: 'wait-02',
    customerName: 'Aarav Mehta & Squad',
    customerPhone: '+91 98112 34567',
    service: 'PS5_CONSOLE',
    preferredTime: 'Next 30 mins',
    durationHours: 3,
    queuePosition: 2,
    status: 'WAITING',
    joinedAt: '35 mins ago'
  }
];

let refundRequests: RefundRequest[] = [
  {
    id: 'ref-01',
    invoiceId: 'INV-2026-074',
    customerName: 'Aditya Roy',
    customerPhone: '+91 97654 32109',
    amount: 250,
    reason: 'Power surge brief reboot on PC-07 after 15 mins. Offered full 1hr credit or refund.',
    requestedBy: 'Staff (Dev)',
    status: 'REQUESTED',
    requestedAt: '1 hour ago'
  }
];

let employeeActivityLog: EmployeeActivity[] = [
  {
    id: 'act-01',
    employeeName: 'Staff (Dev)',
    role: 'EMPLOYEE',
    action: 'START_SHIFT',
    details: 'Opened morning counter shift with opening drawer float of ₹2,500',
    resource: 'Shift Register',
    timestamp: '4 hours ago'
  },
  {
    id: 'act-02',
    employeeName: 'Staff (Dev)',
    role: 'EMPLOYEE',
    action: 'WALKIN_SESSION',
    details: 'Assigned PC-02 for 1.0 hr (Rahul K., Cash ₹250 paid)',
    resource: 'PC-02',
    timestamp: '3 hours ago'
  },
  {
    id: 'act-03',
    employeeName: 'Staff (Dev)',
    role: 'EMPLOYEE',
    action: 'FNB_ORDER',
    details: 'Placed F&B counter sale: 2x Cold Brew, ₹140 Cash',
    resource: 'Cafe POS',
    timestamp: '2.5 hours ago'
  },
  {
    id: 'act-04',
    employeeName: 'Staff (Dev)',
    role: 'EMPLOYEE',
    action: 'BOOKING_CHECKIN',
    details: 'Verified QR pass and checked in Booking BK-101 on PC-01',
    resource: 'PC-01',
    timestamp: '2 hours ago'
  },
  {
    id: 'act-05',
    employeeName: 'Staff (Dev)',
    role: 'EMPLOYEE',
    action: 'EXPENSE_LOG',
    details: 'Recorded petty cash expense: -₹150 for disinfectant wipes',
    resource: 'Cash Drawer',
    timestamp: '1.5 hours ago'
  }
];

let registeredCustomers: EmployeeCustomerRecord[] = [
  {
    id: 'cust-andy',
    name: 'Andy Patel',
    phone: '+91 98765 43210',
    email: 'andy.patel@gmail.com',
    gamerTag: 'ApexGhost',
    membershipTier: 'VIP Pro Tier',
    membershipExpiry: '2026-12-31',
    remainingHours: 14.5,
    walletBalance: 1240,
    totalVisits: 28,
    totalSpend: 14850,
    lastVisit: 'Today (Active on PC-01)',
    hasActiveSession: true,
    upcomingBookingsCount: 1
  },
  {
    id: 'cust-sarah',
    name: 'Sarah Chen',
    phone: '+91 98223 34455',
    email: 'sarah.chen@tech.io',
    gamerTag: 'Valkyrie99',
    membershipTier: 'Elite Squad Tier',
    membershipExpiry: '2026-11-15',
    remainingHours: 22.0,
    walletBalance: 3100,
    totalVisits: 45,
    totalSpend: 26400,
    lastVisit: 'Today (Active on PC-03)',
    hasActiveSession: true,
    upcomingBookingsCount: 0
  },
  {
    id: 'cust-raghav',
    name: 'Raghav Sharma',
    phone: '+91 98101 22334',
    email: 'raghav45078@gmail.com',
    gamerTag: 'CyberKnight',
    membershipTier: 'Standard Member',
    membershipExpiry: '2026-10-01',
    remainingHours: 8.0,
    walletBalance: 850,
    totalVisits: 16,
    totalSpend: 8900,
    lastVisit: 'Yesterday',
    hasActiveSession: false,
    upcomingBookingsCount: 1
  },
  {
    id: 'cust-vikram',
    name: 'Vikram Malhotra',
    phone: '+91 98999 11223',
    email: 'vikram.m@domain.com',
    gamerTag: 'ShadowReaper',
    membershipTier: 'Non-Member (Casual)',
    walletBalance: 120,
    totalVisits: 6,
    totalSpend: 2400,
    lastVisit: '3 days ago',
    hasActiveSession: false,
    upcomingBookingsCount: 0
  },
  {
    id: 'cust-priya',
    name: 'Priya Nair',
    phone: '+91 98450 98765',
    email: 'priya.nair@corp.com',
    gamerTag: 'PixelQueen',
    membershipTier: 'VIP Pro Tier',
    membershipExpiry: '2027-01-20',
    remainingHours: 19.5,
    walletBalance: 2450,
    totalVisits: 31,
    totalSpend: 18200,
    lastVisit: 'Today (Active on Sim Racing Pod)',
    hasActiveSession: true,
    upcomingBookingsCount: 2
  }
];

// Helper to log employee activity
function logActivity(action: string, details: string, resource: string, employeeName = currentShift.employeeName) {
  employeeActivityLog.unshift({
    id: 'act-' + Date.now(),
    employeeName,
    role: 'EMPLOYEE',
    action,
    details,
    resource,
    timestamp: 'Just now'
  });
  if (employeeActivityLog.length > 50) {
    employeeActivityLog.pop();
  }
}

// -------------------------------------------------------------
// 1. Employee Dashboard Overview
// -------------------------------------------------------------
export function handleGetEmployeeDashboard(req: Request, res: Response) {
  const systems = getServerSystems();
  const activeSessions = getServerActiveSessions();
  const bookings = getServerBookings();

  const activeSessionsCount = activeSessions.filter(s => s.status === 'ACTIVE').length;
  const availableStationsCount = systems.filter(s => s.status === 'AVAILABLE').length;
  const reservedStationsCount = systems.filter(s => s.status === 'RESERVED').length;
  const maintenanceStationsCount = systems.filter(s => s.status === 'MAINTENANCE').length;
  const upcomingBookingsCount = bookings.filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'UPCOMING').length;
  const waitlistCount = waitlistEntries.filter(w => w.status === 'WAITING').length;
  const todayWalkInsCount = activeSessions.filter(s => s.paymentMethod !== undefined).length;
  const openFnbOrdersCount = getServerFnbOrders().filter(o => o.status !== 'DELIVERED').length;

  const stats: EmployeeDashboardStats = {
    activeSessionsCount,
    availableStationsCount,
    reservedStationsCount,
    maintenanceStationsCount,
    upcomingBookingsCount,
    waitlistCount,
    todayWalkInsCount,
    openFnbOrdersCount,
    shiftCashCollected: currentShift.cashSales,
    shiftTotalRevenue: currentShift.cashSales + currentShift.upiSales + currentShift.cardSales + currentShift.walletSales,
    shiftStatus: currentShift.status
  };

  const expectedCash = currentShift.openingCash + currentShift.cashSales - currentShift.expenses;

  return res.json({
    success: true,
    data: {
      stats,
      shift: {
        ...currentShift,
        expectedCash,
        currentCashInDrawer: expectedCash
      },
      recentAlerts: operationalAlerts.filter(a => !a.resolved).slice(0, 5),
      activeSessions: activeSessions.filter(s => s.status === 'ACTIVE'),
      systems
    }
  });
}

// -------------------------------------------------------------
// 2. Shift & Cash Drawer Ledger Handlers
// -------------------------------------------------------------
export function handleGetShiftStatus(req: Request, res: Response) {
  const expectedCash = currentShift.openingCash + currentShift.cashSales - currentShift.expenses;
  return res.json({
    success: true,
    data: {
      shift: {
        ...currentShift,
        expectedCash,
        currentCashInDrawer: expectedCash
      },
      ledger: cashLedger
    }
  });
}

export function handleStartShift(req: Request, res: Response) {
  const { openingCash, employeeName } = req.body;
  const float = Number(openingCash) || 0;
  const emp = employeeName?.trim() || 'Front Desk Staff';

  currentShift = {
    id: 'shift-' + Date.now(),
    employeeName: emp,
    shiftDate: new Date().toISOString().slice(0, 10),
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    openingCash: float,
    cashSales: 0,
    upiSales: 0,
    cardSales: 0,
    walletSales: 0,
    expenses: 0,
    status: 'OPEN'
  };

  const entry: CashLedgerEntry = {
    id: 'cld-' + Date.now(),
    shiftId: currentShift.id,
    type: 'OPENING',
    amount: float,
    runningBalance: float,
    description: `Opening cash drawer float by ${emp}`,
    employeeName: emp,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  cashLedger.unshift(entry);
  logActivity('START_SHIFT', `Shift started with opening drawer float of ₹${float}`, 'Cash Drawer', emp);

  return res.json({
    success: true,
    message: `Shift started successfully for ${emp} with ₹${float} float.`,
    data: { shift: currentShift }
  });
}

export function handleEndShift(req: Request, res: Response) {
  const { actualCashCounted, notes } = req.body;
  if (actualCashCounted === undefined || actualCashCounted === null) {
    return res.status(400).json({ success: false, error: 'actualCashCounted is required.' });
  }

  const expectedCash = currentShift.openingCash + currentShift.cashSales - currentShift.expenses;
  const actual = Number(actualCashCounted);
  const diff = actual - expectedCash;

  currentShift.status = 'CLOSED';
  currentShift.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  currentShift.closingCash = actual;
  currentShift.expectedCash = expectedCash;
  currentShift.difference = diff;

  if (diff !== 0) {
    const entry: CashLedgerEntry = {
      id: 'cld-' + Date.now(),
      shiftId: currentShift.id,
      type: 'ADJUSTMENT',
      amount: diff,
      runningBalance: actual,
      description: `Shift closing variance: ${diff > 0 ? `+₹${diff} surplus` : `-₹${Math.abs(diff)} shortage`}. Note: ${notes || 'Reconciled'}`,
      employeeName: currentShift.employeeName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    cashLedger.unshift(entry);
  }

  logActivity(
    'END_SHIFT',
    `Shift reconciled: Expected ₹${expectedCash}, Counted ₹${actual}, Variance ₹${diff} ${notes ? `(${notes})` : ''}`,
    'Shift Reconciliation'
  );

  return res.json({
    success: true,
    data: {
      shift: currentShift,
      expectedCash,
      actualCash: actual,
      difference: diff,
      reconciled: diff === 0
    }
  });
}

export function handleGetCashLedger(req: Request, res: Response) {
  const expectedCash = currentShift.openingCash + currentShift.cashSales - currentShift.expenses;
  return res.json({
    success: true,
    data: {
      ledger: cashLedger,
      currentBalance: expectedCash,
      shiftId: currentShift.id
    }
  });
}

export function handleAddCashLedgerEntry(req: Request, res: Response) {
  const { type, amount, description, referenceId } = req.body;
  const numAmount = Number(amount);

  if (!type || isNaN(numAmount) || !description) {
    return res.status(400).json({ success: false, error: 'type, valid amount, and description are required.' });
  }

  const prevBalance = currentShift.openingCash + currentShift.cashSales - currentShift.expenses;
  const newBalance = prevBalance + numAmount;

  if (type === 'EXPENSE') {
    currentShift.expenses += Math.abs(numAmount);
  } else if (type === 'SALE_CASH') {
    currentShift.cashSales += Math.abs(numAmount);
  }

  const entry: CashLedgerEntry = {
    id: 'cld-' + Date.now(),
    shiftId: currentShift.id,
    type,
    amount: numAmount,
    runningBalance: newBalance,
    description: description.trim(),
    referenceId,
    employeeName: currentShift.employeeName,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  cashLedger.unshift(entry);
  logActivity('CASH_LEDGER', `${type}: ₹${numAmount} - ${description}`, 'Cash Ledger');

  return res.json({
    success: true,
    data: { entry, currentBalance: newBalance }
  });
}

// -------------------------------------------------------------
// 3. Walk-In Counter Session Creation (Server-Authoritative)
// -------------------------------------------------------------
export function handleEmployeeWalkIn(req: Request, res: Response) {
  const {
    systemId,
    customerName,
    customerPhone,
    durationHours,
    paymentMethod,
    useMembership,
    gameTitle,
    fnbItems
  } = req.body;

  if (!systemId || !customerName || !customerPhone || !durationHours || !paymentMethod) {
    return res.status(400).json({
      success: false,
      error: 'systemId, customerName, customerPhone, durationHours, and paymentMethod are required.'
    });
  }

  const systems = getServerSystems();
  const system = systems.find(s => s.id === systemId);
  if (!system) {
    return res.status(404).json({ success: false, error: `Station ${systemId} not found.` });
  }
  if (system.status !== 'AVAILABLE') {
    return res.status(409).json({
      success: false,
      error: `Station ${system.name} is currently ${system.status} and cannot be assigned for a walk-in.`
    });
  }

  // Calculate pricing server-authoritative
  const rateRule = INITIAL_PRICING_RULES.find(r => r.service === system.category);
  const hourlyRate = rateRule ? rateRule.normalRate : (system.category === 'PC_GAMING' ? 250 : 350);
  const hours = Number(durationHours);
  const gamingCharge = Math.round(hourlyRate * hours * (useMembership ? 0.8 : 1.0));

  // Compute F&B charge if items attached
  let fnbCharge = 0;
  if (Array.isArray(fnbItems)) {
    for (const item of fnbItems) {
      const prod = INITIAL_FNB_PRODUCTS.find(p => p.id === item.productId);
      if (prod) {
        fnbCharge += prod.price * (item.quantity || 1);
      }
    }
  }

  const totalAmount = gamingCharge + fnbCharge;

  // Update System status
  system.status = 'ACTIVE';
  system.totalUsageHours += hours;
  system.totalRevenue += totalAmount;
  setServerSystems(systems);

  // Generate Session
  const now = new Date();
  const end = new Date(now.getTime() + hours * 3600000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const startTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const endTimeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  const newSession: ActiveSession = {
    id: `sess-${Date.now()}`,
    systemId: system.id,
    systemName: system.name,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    gameTitle: gameTitle || system.activeGameTitle || 'Apex Legends / Counter-Strike 2',
    startTime: startTimeStr,
    endTime: endTimeStr,
    durationHours: hours,
    gamingCharge,
    fnbOrders: fnbItems || [],
    fnbTotalCharge: fnbCharge,
    totalCharge: totalAmount,
    status: 'ACTIVE',
    paymentMethod,
    employeeName: currentShift.employeeName,
    paymentStatus: 'PAID'
  };

  const currentSessions = getServerActiveSessions();
  currentSessions.unshift(newSession);
  setServerActiveSessions(currentSessions);

  // Update shift sales and cash ledger
  if (paymentMethod === 'Cash') {
    currentShift.cashSales += totalAmount;
    const ledgerEntry: CashLedgerEntry = {
      id: 'cld-' + Date.now(),
      shiftId: currentShift.id,
      type: 'SALE_CASH',
      amount: totalAmount,
      runningBalance: currentShift.openingCash + currentShift.cashSales - currentShift.expenses,
      description: `Walk-in ${hours}hr on ${system.name} (${customerName})`,
      referenceId: newSession.id,
      employeeName: currentShift.employeeName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    cashLedger.unshift(ledgerEntry);
  } else if (paymentMethod === 'UPI') {
    currentShift.upiSales += totalAmount;
  } else if (paymentMethod === 'Card') {
    currentShift.cardSales += totalAmount;
  } else if (paymentMethod === 'Wallet') {
    currentShift.walletSales += totalAmount;
  }

  // Update customer record if exists or add minimal
  let existingCust = registeredCustomers.find(c => c.phone.replace(/\D/g, '') === customerPhone.replace(/\D/g, ''));
  if (existingCust) {
    existingCust.totalVisits += 1;
    existingCust.totalSpend += totalAmount;
    existingCust.lastVisit = `Today (Active on ${system.name})`;
    existingCust.hasActiveSession = true;
  } else {
    registeredCustomers.push({
      id: 'cust-' + Date.now(),
      name: customerName.trim(),
      phone: customerPhone.trim(),
      gamerTag: customerName.trim().replace(/\s+/g, ''),
      walletBalance: 0,
      totalVisits: 1,
      totalSpend: totalAmount,
      lastVisit: `Today (Active on ${system.name})`,
      hasActiveSession: true
    });
  }

  logActivity('WALKIN_SESSION', `Walk-in started on ${system.name} for ${hours}hr (₹${totalAmount}, ${paymentMethod})`, system.name);

  return res.json({
    success: true,
    message: `Walk-in session started on ${system.name} for ${customerName}.`,
    data: {
      session: newSession,
      system
    }
  });
}

// -------------------------------------------------------------
// 4. Session Operations: Extend, Transfer, End
// -------------------------------------------------------------
export function handleEmployeeExtendSession(req: Request, res: Response) {
  const { sessionId } = req.params;
  const { extraHours, paymentMethod } = req.body;
  const added = Number(extraHours);

  if (!sessionId || isNaN(added) || added <= 0) {
    return res.status(400).json({ success: false, error: 'Valid sessionId and extraHours required.' });
  }

  const sessions = getServerActiveSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'ACTIVE') {
    return res.status(404).json({ success: false, error: 'Active session not found.' });
  }

  const systems = getServerSystems();
  const system = systems.find(s => s.id === session.systemId);
  const hourlyRate = system ? (INITIAL_PRICING_RULES.find(r => r.service === system.category)?.normalRate || 250) : 250;
  const addCost = Math.round(hourlyRate * added);

  // Extend end time
  const [endH, endM] = session.endTime.split(':').map(Number);
  const newEndMinutes = (endH * 60 + endM) + added * 60;
  const finH = Math.floor(newEndMinutes / 60) % 24;
  const finM = newEndMinutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  session.endTime = `${pad(finH)}:${pad(finM)}`;
  session.durationHours += added;
  session.gamingCharge += addCost;
  session.totalCharge += addCost;

  if (paymentMethod === 'Cash') {
    currentShift.cashSales += addCost;
    cashLedger.unshift({
      id: 'cld-' + Date.now(),
      shiftId: currentShift.id,
      type: 'SALE_CASH',
      amount: addCost,
      runningBalance: currentShift.openingCash + currentShift.cashSales - currentShift.expenses,
      description: `Session Extension +${added}hr on ${session.systemName} (${session.customerName})`,
      referenceId: session.id,
      employeeName: currentShift.employeeName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } else if (paymentMethod === 'UPI') {
    currentShift.upiSales += addCost;
  }

  setServerActiveSessions(sessions);
  logActivity('EXTEND_SESSION', `Extended +${added}hr on ${session.systemName} (Added ₹${addCost})`, session.systemName);

  return res.json({
    success: true,
    message: `Session extended by ${added} hours. New end time: ${session.endTime}`,
    data: { session }
  });
}

export function handleEmployeeTransferSession(req: Request, res: Response) {
  const { sessionId } = req.params;
  const { targetSystemId, reason } = req.body;

  if (!sessionId || !targetSystemId) {
    return res.status(400).json({ success: false, error: 'sessionId and targetSystemId are required.' });
  }

  const sessions = getServerActiveSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'ACTIVE') {
    return res.status(404).json({ success: false, error: 'Active session not found.' });
  }

  const systems = getServerSystems();
  const fromSystem = systems.find(s => s.id === session.systemId);
  const toSystem = systems.find(s => s.id === targetSystemId);

  if (!toSystem) {
    return res.status(404).json({ success: false, error: 'Target station not found.' });
  }
  if (toSystem.status !== 'AVAILABLE') {
    return res.status(409).json({ success: false, error: `Target station ${toSystem.name} is not available (${toSystem.status}).` });
  }

  // Atomic Station Swap
  if (fromSystem) {
    fromSystem.status = 'AVAILABLE';
  }
  toSystem.status = 'ACTIVE';

  const oldSystemName = session.systemName;
  session.systemId = toSystem.id;
  session.systemName = toSystem.name;

  setServerSystems(systems);
  setServerActiveSessions(sessions);

  logActivity(
    'TRANSFER_SESSION',
    `Transferred ${session.customerName} from ${oldSystemName} to ${toSystem.name}. Reason: ${reason || 'Customer request'}`,
    toSystem.name
  );

  return res.json({
    success: true,
    message: `Session transferred successfully to ${toSystem.name}.`,
    data: { session, fromSystem, toSystem }
  });
}

export function handleEmployeeEndSession(req: Request, res: Response) {
  const { sessionId } = req.params;
  const sessions = getServerActiveSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found.' });
  }

  session.status = 'COMPLETED';
  const systems = getServerSystems();
  const system = systems.find(s => s.id === session.systemId);
  if (system) {
    system.status = 'AVAILABLE';
    setServerSystems(systems);
  }

  // Find customer and clear active session flag
  const cust = registeredCustomers.find(c => c.name.toLowerCase() === session.customerName.toLowerCase() || c.phone === session.customerPhone);
  if (cust) {
    cust.hasActiveSession = false;
  }

  // Create final Invoice
  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `BB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().slice(0, 10),
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    systemId: session.systemId,
    systemName: session.systemName,
    hoursUsed: session.durationHours,
    hourlyRate: session.durationHours > 0 ? Math.round(session.gamingCharge / session.durationHours) : 250,
    gamingTotal: session.gamingCharge,
    fnbItems: session.fnbOrders || [],
    fnbTotal: session.fnbTotalCharge,
    subtotal: session.totalCharge,
    discountAmount: 0,
    taxAmount: Math.round(session.totalCharge * 0.18),
    total: Math.round(session.totalCharge * 1.18),
    paymentMethod: session.paymentMethod || 'Cash',
    paymentStatus: 'PAID',
    employeeName: currentShift.employeeName
  };

  setServerActiveSessions(sessions);
  logActivity('END_SESSION', `Terminated session on ${session.systemName} for ${session.customerName}. Bill: ₹${invoice.total}`, session.systemName);

  return res.json({
    success: true,
    message: `Session on ${session.systemName} ended. Station is now available.`,
    data: { session, invoice }
  });
}

// -------------------------------------------------------------
// 5. Booking Check-In from Counter
// -------------------------------------------------------------
export function handleEmployeeBookingCheckIn(req: Request, res: Response) {
  const { bookingIdOrQr } = req.body;
  if (!bookingIdOrQr) {
    return res.status(400).json({ success: false, error: 'bookingIdOrQr code is required.' });
  }

  const query = bookingIdOrQr.trim().toUpperCase();
  const bookings = getServerBookings();
  const booking = bookings.find(
    b => b.id.toUpperCase() === query || (b.qrCodePass && b.qrCodePass.toUpperCase().includes(query))
  );

  if (!booking) {
    return res.status(404).json({ success: false, error: `No reservation found matching code '${bookingIdOrQr}'.` });
  }

  if (booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED') {
    return res.status(400).json({
      success: false,
      error: `Reservation ${booking.id} is already ${booking.bookingStatus}.`
    });
  }

  const systems = getServerSystems();
  const system = systems.find(s => s.id === booking.systemId);
  if (!system) {
    return res.status(404).json({ success: false, error: 'Reserved station not found.' });
  }

  // Start active session
  booking.bookingStatus = 'CHECKED_IN';
  system.status = 'ACTIVE';
  setServerSystems(systems);
  setServerBookings(bookings);

  const now = new Date();
  const end = new Date(now.getTime() + booking.durationHours * 3600000);
  const pad = (n: number) => String(n).padStart(2, '0');

  const newSession: ActiveSession = {
    id: `sess-bk-${Date.now()}`,
    systemId: system.id,
    systemName: system.name,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    gameTitle: system.activeGameTitle || 'Tournament Arena / Competitive',
    startTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    durationHours: booking.durationHours,
    gamingCharge: booking.totalAmount,
    fnbOrders: [],
    fnbTotalCharge: 0,
    totalCharge: booking.totalAmount,
    status: 'ACTIVE',
    paymentMethod: 'UPI',
    employeeName: currentShift.employeeName,
    paymentStatus: 'PAID'
  };

  const activeSessions = getServerActiveSessions();
  activeSessions.unshift(newSession);
  setServerActiveSessions(activeSessions);

  logActivity('BOOKING_CHECKIN', `Checked in Booking ${booking.id} for ${booking.customerName} on ${system.name}`, system.name);

  return res.json({
    success: true,
    message: `Check-in confirmed for ${booking.customerName}! Station ${system.name} is now active.`,
    data: { booking, session: newSession, system }
  });
}

// -------------------------------------------------------------
// 6. Waitlist Management
// -------------------------------------------------------------
export function handleGetWaitlist(req: Request, res: Response) {
  return res.json({ success: true, data: waitlistEntries });
}

export function handleAddWaitlist(req: Request, res: Response) {
  const { customerName, customerPhone, service, durationHours, preferredTime } = req.body;
  if (!customerName || !customerPhone || !service) {
    return res.status(400).json({ success: false, error: 'customerName, customerPhone, and service are required.' });
  }

  const newEntry: WaitlistEntry = {
    id: 'wait-' + Date.now(),
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    service,
    durationHours: Number(durationHours) || 2,
    preferredTime: preferredTime || 'Next available',
    queuePosition: waitlistEntries.filter(w => w.status === 'WAITING').length + 1,
    status: 'WAITING',
    joinedAt: 'Just now'
  };

  waitlistEntries.push(newEntry);
  logActivity('WAITLIST_ADD', `Added ${customerName} to waitlist for ${service}`, 'Waitlist');

  return res.json({ success: true, data: newEntry });
}

export function handleAssignWaitlistStation(req: Request, res: Response) {
  const { waitlistId } = req.params;
  const { systemId } = req.body;

  const entry = waitlistEntries.find(w => w.id === waitlistId);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Waitlist entry not found.' });
  }

  entry.status = 'CLAIMED';
  logActivity('WAITLIST_ASSIGN', `Assigned station to ${entry.customerName} from waitlist`, 'Waitlist');

  return res.json({ success: true, message: `${entry.customerName} claimed station.`, data: entry });
}

export function handleRemoveWaitlist(req: Request, res: Response) {
  const { waitlistId } = req.params;
  const index = waitlistEntries.findIndex(w => w.id === waitlistId);
  if (index !== -1) {
    const removed = waitlistEntries.splice(index, 1);
    return res.json({ success: true, data: removed[0] });
  }
  return res.status(404).json({ success: false, error: 'Waitlist entry not found.' });
}

// -------------------------------------------------------------
// 7. Maintenance Reporting & Hardware Status
// -------------------------------------------------------------
export function handleGetMaintenanceTickets(req: Request, res: Response) {
  return res.json({ success: true, data: maintenanceTickets });
}

export function handleCreateMaintenanceTicket(req: Request, res: Response) {
  const { systemId, issueCategory, severity, description, markMaintenance } = req.body;
  if (!systemId || !description) {
    return res.status(400).json({ success: false, error: 'systemId and description are required.' });
  }

  const systems = getServerSystems();
  const system = systems.find(s => s.id === systemId);
  const sysName = system ? system.name : systemId;

  const ticket: MaintenanceTicket = {
    id: 'maint-' + Date.now(),
    systemId,
    systemName: sysName,
    issueCategory: issueCategory || 'HARDWARE',
    severity: severity || 'MEDIUM',
    reportedBy: currentShift.employeeName,
    reportedAt: new Date().toISOString(),
    status: 'OPEN',
    description: description.trim()
  };

  maintenanceTickets.unshift(ticket);

  if (markMaintenance && system) {
    system.status = 'MAINTENANCE';
    setServerSystems(systems);
  }

  logActivity('MAINTENANCE_REPORT', `Reported ${ticket.severity} issue on ${sysName}: ${ticket.description}`, sysName);

  return res.json({ success: true, message: `Maintenance ticket #${ticket.id} filed.`, data: ticket });
}

export function handleUpdateMaintenanceStatus(req: Request, res: Response) {
  const { ticketId } = req.params;
  const { status, resolutionNotes, releaseStation } = req.body;

  const ticket = maintenanceTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, error: 'Ticket not found.' });
  }

  if (status) ticket.status = status;
  if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
  if (status === 'RESOLVED') {
    ticket.resolvedAt = new Date().toISOString();
  }

  if (releaseStation && ticket.systemId) {
    const systems = getServerSystems();
    const system = systems.find(s => s.id === ticket.systemId);
    if (system && system.status === 'MAINTENANCE') {
      system.status = 'AVAILABLE';
      setServerSystems(systems);
    }
  }

  logActivity('MAINTENANCE_UPDATE', `Updated ticket ${ticket.id} to ${ticket.status}`, ticket.systemName);

  return res.json({ success: true, data: ticket });
}

// -------------------------------------------------------------
// 8. Operational Alerts Handlers
// -------------------------------------------------------------
export function handleGetOperationalAlerts(req: Request, res: Response) {
  return res.json({ success: true, data: operationalAlerts });
}

export function handleResolveOperationalAlert(req: Request, res: Response) {
  const { alertId } = req.params;
  const alert = operationalAlerts.find(a => a.id === alertId);
  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found.' });
  }

  alert.resolved = true;
  return res.json({ success: true, message: 'Alert resolved.', data: alert });
}

// -------------------------------------------------------------
// 9. Employee Activity Audit Log
// -------------------------------------------------------------
export function handleGetEmployeeActivity(req: Request, res: Response) {
  return res.json({ success: true, data: employeeActivityLog });
}

// -------------------------------------------------------------
// 10. Refund Request Management
// -------------------------------------------------------------
export function handleGetRefundRequests(req: Request, res: Response) {
  return res.json({ success: true, data: refundRequests });
}

export function handleRequestRefund(req: Request, res: Response) {
  const { invoiceId, customerName, customerPhone, amount, reason } = req.body;
  if (!invoiceId || !customerName || !amount || !reason) {
    return res.status(400).json({ success: false, error: 'invoiceId, customerName, amount, and reason are required.' });
  }

  const newRef: RefundRequest = {
    id: 'ref-' + Date.now(),
    invoiceId,
    customerName,
    customerPhone: customerPhone || '',
    amount: Number(amount),
    reason: reason.trim(),
    requestedBy: currentShift.employeeName,
    status: 'REQUESTED',
    requestedAt: 'Just now'
  };

  refundRequests.unshift(newRef);
  logActivity('REFUND_REQUESTED', `Requested ₹${amount} refund for ${customerName} (${reason})`, invoiceId);

  return res.json({ success: true, message: `Refund request submitted for approval.`, data: newRef });
}

export function handleProcessRefund(req: Request, res: Response) {
  const { refundId } = req.params;
  const { action, approvedBy } = req.body; // 'APPROVE' | 'REJECT'

  const ref = refundRequests.find(r => r.id === refundId);
  if (!ref) {
    return res.status(404).json({ success: false, error: 'Refund request not found.' });
  }

  if (action === 'APPROVE') {
    ref.status = 'APPROVED';
    ref.approvedBy = approvedBy || 'Shift Supervisor';
    ref.processedAt = new Date().toISOString();

    // Deduct from cash drawer ledger if paid in cash
    currentShift.expenses += ref.amount;
    cashLedger.unshift({
      id: 'cld-' + Date.now(),
      shiftId: currentShift.id,
      type: 'REFUND',
      amount: -ref.amount,
      runningBalance: currentShift.openingCash + currentShift.cashSales - currentShift.expenses,
      description: `Customer refund approved: ${ref.customerName} (Inv: ${ref.invoiceId})`,
      referenceId: ref.id,
      employeeName: currentShift.employeeName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    logActivity('REFUND_APPROVED', `Approved ₹${ref.amount} refund for ${ref.customerName}`, ref.invoiceId);
  } else {
    ref.status = 'REJECTED';
    ref.processedAt = new Date().toISOString();
    logActivity('REFUND_REJECTED', `Rejected refund request for ${ref.customerName}`, ref.invoiceId);
  }

  return res.json({ success: true, data: ref });
}

// -------------------------------------------------------------
// 11. Customer Search & Fast Registration
// -------------------------------------------------------------
export function handleSearchCustomers(req: Request, res: Response) {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  if (!q) {
    return res.json({ success: true, data: registeredCustomers.slice(0, 10) });
  }

  const results = registeredCustomers.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    (c.email && c.email.toLowerCase().includes(q)) ||
    (c.gamerTag && c.gamerTag.toLowerCase().includes(q))
  );

  return res.json({ success: true, data: results });
}

export function handleCreateCustomer(req: Request, res: Response) {
  const { name, phone, email, gamerTag } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'name and phone are required.' });
  }

  const existing = registeredCustomers.find(c => c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
  if (existing) {
    return res.json({ success: true, message: 'Customer already exists', data: existing });
  }

  const newCustomer: EmployeeCustomerRecord = {
    id: 'cust-' + Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    gamerTag: gamerTag ? gamerTag.trim() : name.trim().replace(/\s+/g, ''),
    walletBalance: 0,
    totalVisits: 0,
    totalSpend: 0,
    lastVisit: 'First visit today',
    hasActiveSession: false
  };

  registeredCustomers.unshift(newCustomer);
  logActivity('CREATE_CUSTOMER', `Registered new counter gamer: ${newCustomer.name} (${newCustomer.phone})`, 'Customer Records');

  return res.json({ success: true, message: 'Customer registered successfully.', data: newCustomer });
}

// -------------------------------------------------------------
// 12. F&B POS Order Placement
// -------------------------------------------------------------
export function handleEmployeeFnbOrder(req: Request, res: Response) {
  const { items, sessionId, customerName, paymentMethod } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'items array is required.' });
  }

  let total = 0;
  for (const item of items) {
    const prod = INITIAL_FNB_PRODUCTS.find(p => p.id === item.productId);
    if (prod) {
      total += prod.price * (item.quantity || 1);
    }
  }

  // If attached to active session
  if (sessionId) {
    const sessions = getServerActiveSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.fnbOrders = session.fnbOrders ? [...session.fnbOrders, ...items] : [...items];
      session.fnbTotalCharge += total;
      session.totalCharge += total;
      setServerActiveSessions(sessions);
    }
  }

  // If paid directly at counter
  if (paymentMethod === 'Cash') {
    currentShift.cashSales += total;
    cashLedger.unshift({
      id: 'cld-' + Date.now(),
      shiftId: currentShift.id,
      type: 'SALE_CASH',
      amount: total,
      runningBalance: currentShift.openingCash + currentShift.cashSales - currentShift.expenses,
      description: `F&B Counter Sale (${items.length} items for ${customerName || 'Walk-in'})`,
      referenceId: 'FNB-' + Date.now(),
      employeeName: currentShift.employeeName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } else if (paymentMethod === 'UPI') {
    currentShift.upiSales += total;
  }

  logActivity('FNB_ORDER', `Sold F&B items totaling ₹${total} (${paymentMethod || 'Session Tab'})`, 'Artisan Cafe POS');

  return res.json({
    success: true,
    message: `F&B order of ₹${total} placed successfully.`,
    data: { total, items, sessionId }
  });
}
