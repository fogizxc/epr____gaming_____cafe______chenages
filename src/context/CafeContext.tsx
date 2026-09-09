import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Role,
  AuthUser,
  GamingServiceCategory,
  StationStatus,
  GamingSystem,
  PricingRule,
  PriceHistoryEntry,
  ActiveSession,
  Booking,
  MembershipPlan,
  CustomerMembership,
  Tournament,
  TournamentTeam,
  TournamentMatch,
  Invoice,
  WalletTransaction,
  FnbProduct,
  EmployeeShift,
  WaitlistEntry,
  AuditLogEntry,
  HeroGameSlide,
  RegisteredAccount
} from '../types';

export const INITIAL_REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'ACC-1001',
    name: 'Alex Vance',
    gamerTag: 'Alex_Viper',
    email: 'alex.vance@gmail.com',
    phone: '+91 98765 43210',
    password: 'password123',
    role: 'CUSTOMER',
    createdAt: '2025-01-15T10:30:00.000Z',
    isWhatsappVerified: true,
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop',
    syncedToGoogleSheet: true
  },
  {
    id: 'ACC-1002',
    name: 'Vikram Sharma',
    gamerTag: 'CyberGhost_99',
    email: 'vikram.gamer@gmail.com',
    phone: '+91 98111 22334',
    password: 'gamerpass2025',
    role: 'CUSTOMER',
    createdAt: '2025-02-01T14:20:00.000Z',
    isWhatsappVerified: true,
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    syncedToGoogleSheet: true
  }
];

export const syncUserToGoogleSheet = async (
  account: RegisteredAccount,
  webhookUrl: string,
  action: 'CREATE_ACCOUNT' | 'UPDATE_PASSWORD' = 'CREATE_ACCOUNT'
) => {
  if (!webhookUrl) return false;
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        id: account.id,
        name: account.name,
        gamerTag: account.gamerTag,
        email: account.email,
        phone: account.phone,
        password: account.password,
        role: account.role,
        isWhatsappVerified: account.isWhatsappVerified,
        isEmailVerified: account.isEmailVerified,
        createdAt: account.createdAt
      })
    });
    return true;
  } catch (err) {
    console.warn('Google Sheet sync notice:', err);
    return false;
  }
};

export const EMPLOYEE_CREDENTIALS = {
  id: 'STAFF-NEXUS-88',
  password: 'Staff@Nexus2025',
  name: 'Samir Rao (Floor Supervisor)'
};

export const ADMIN_CREDENTIALS = {
  id: 'ADMIN-BYTES-01',
  password: 'Admin@BytesBrew2025',
  name: 'Bytes & Brew HQ Administrator'
};
import {
  INITIAL_HERO_GAMES,
  INITIAL_PRICING_RULES,
  INITIAL_PRICE_HISTORY,
  INITIAL_SYSTEMS,
  INITIAL_ACTIVE_SESSIONS,
  INITIAL_MEMBERSHIP_PLANS,
  INITIAL_CUSTOMER_MEMBERSHIP,
  INITIAL_TOURNAMENTS,
  INITIAL_TOURNAMENT_TEAMS,
  INITIAL_TOURNAMENT_MATCHES,
  INITIAL_FNB_PRODUCTS,
  INITIAL_BOOKINGS,
  INITIAL_INVOICES,
  INITIAL_WALLET_TRANSACTIONS,
  INITIAL_WAITLIST,
  INITIAL_EMPLOYEE_SHIFT,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';

interface CafeContextType {
  // Authentication & Role Protection
  isLoggedIn: boolean;
  currentUser: AuthUser | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalReason: string;
  setAuthModalReason: (reason: string) => void;
  requireLogin: (onSuccess?: () => void, reason?: string) => boolean;
  loginUser: (params: {
    role?: Role;
    idOrUsername: string;
    password?: string;
    name?: string;
  }) => { success: boolean; error?: string };
  loginAsAdmin: () => void;
  loginAsStaff: () => void;
  loginAsCustomer: () => void;
  logout: () => void;

  // Registered Accounts & Google Sheet Sync
  registeredAccounts: RegisteredAccount[];
  registerUser: (params: {
    name: string;
    gamerTag?: string;
    email: string;
    phone: string;
    password: string;
    isWhatsappVerified: boolean;
    isEmailVerified?: boolean;
  }) => { success: boolean; error?: string; account?: RegisteredAccount };
  resetPassword: (emailOrPhone: string, newPassword: string) => { success: boolean; error?: string };
  findAccountByEmailOrPhone: (emailOrPhone: string) => RegisteredAccount | undefined;
  googleSheetWebhookUrl: string;
  setGoogleSheetWebhookUrl: (url: string) => void;
  syncAccountsToGoogleSheet: () => Promise<{ success: boolean; message: string; count: number }>;

  // Navigation & Role
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedStationForBooking: GamingSystem | null;
  setSelectedStationForBooking: (system: GamingSystem | null) => void;
  selectedGameForBooking: { title: string; category?: GamingServiceCategory; coverUrl?: string } | null;
  setSelectedGameForBooking: (game: { title: string; category?: GamingServiceCategory; coverUrl?: string } | null) => void;
  activeConsoleForGamesModal: { category: GamingServiceCategory; systemId?: string } | null;
  setActiveConsoleForGamesModal: (modal: { category: GamingServiceCategory; systemId?: string } | null) => void;
  openConsoleGames: (category: GamingServiceCategory, systemId?: string) => void;
  activeInvoiceForModal: Invoice | null;
  setActiveInvoiceForModal: (invoice: Invoice | null) => void;
  quickWalkInModalOpen: boolean;
  setQuickWalkInModalOpen: (open: boolean) => void;

  // Games & Hero
  heroGames: HeroGameSlide[];

  // Pricing
  pricingRules: PricingRule[];
  priceHistory: PriceHistoryEntry[];
  updatePricing: (
    service: GamingServiceCategory,
    newNormal: number,
    newPeak: number,
    newWeekend: number,
    reason: string,
    isPeakEnabled: boolean,
    peakDays?: string[],
    peakHoursStart?: string,
    peakHoursEnd?: string
  ) => { success: boolean; error?: string };
  getRateForService: (service: GamingServiceCategory) => number;

  // Systems / Floor Map
  systems: GamingSystem[];
  addSystem: (system: Omit<GamingSystem, 'id' | 'totalUsageHours' | 'totalRevenue' | 'ping' | 'temp'>) => void;
  updateSystem: (id: string, updates: Partial<GamingSystem>) => void;
  toggleMaintenance: (id: string, reason: string) => void;

  // Active Sessions
  activeSessions: ActiveSession[];
  startWalkInSession: (params: {
    systemId: string;
    customerName: string;
    customerPhone: string;
    gameTitle?: string;
    durationHours: number;
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership';
    employeeName: string;
    useMembership?: boolean;
  }) => { success: boolean; error?: string; session?: ActiveSession };
  extendSession: (sessionId: string, extraHours: number) => { success: boolean; error?: string };
  addFoodToSession: (sessionId: string, productId: string, quantity: number) => { success: boolean; error?: string };
  endSession: (sessionId: string) => { success: boolean; invoice?: Invoice; error?: string };

  // Bookings
  bookings: Booking[];
  createBooking: (params: {
    customerName: string;
    customerPhone: string;
    systemId: string;
    date: string;
    startTime: string;
    durationHours: number;
    useMembership?: boolean;
  }) => { success: boolean; error?: string; booking?: Booking };
  createSquadBooking: (params: {
    customerName: string;
    customerPhone: string;
    systemIds: string[];
    date: string;
    startTime: string;
    durationHours: number;
  }) => { success: boolean; error?: string; bookings?: Booking[] };
  cancelBooking: (bookingId: string) => { success: boolean; error?: string };
  checkInBooking: (bookingIdOrQr: string) => { success: boolean; error?: string };
  findNextAvailableSlot: (service: GamingServiceCategory, durationHours: number) => { time: string; systemName: string };

  // Memberships
  membershipPlans: MembershipPlan[];
  customerMembership: CustomerMembership;
  purchaseMembership: (planId: string) => { success: boolean; error?: string };
  updateMembershipHours: (normalDelta: number, vipDelta: number) => void;

  // Wallet & Loyalty
  walletBalance: number;
  walletTransactions: WalletTransaction[];
  rechargeWallet: (amount: number) => void;
  loyaltyPoints: number;
  redeemLoyaltyPoints: (points: number) => { success: boolean; discountVal: number };

  // F&B & Invoices
  fnbProducts: FnbProduct[];
  invoices: Invoice[];
  employeeShift: EmployeeShift;
  startShift: (openingCash: number, employeeName: string) => void;
  endShift: (actualCash: number) => { expectedCash: number; difference: number };

  // Tournaments
  tournaments: Tournament[];
  tournamentTeams: TournamentTeam[];
  tournamentMatches: TournamentMatch[];
  createTournament: (tournament: Omit<Tournament, 'id' | 'registeredTeamsCount'>) => void;
  checkInTournamentTeam: (teamId: string, stationRange: string) => void;
  updateMatchScore: (matchId: string, scoreA: number, scoreB: number, winner: string) => void;

  // Waitlist
  waitlist: WaitlistEntry[];
  joinWaitlist: (customerName: string, customerPhone: string, service: GamingServiceCategory, preferredTime: string, durationHours: number) => void;
  claimWaitlist: (id: string) => void;

  // Logs & Notifications
  auditLogs: AuditLogEntry[];
  notifications: { id: string; title: string; message: string; time: string; read: boolean; role: Role | 'ALL' }[];
  markNotificationAsRead: (id: string) => void;

  // Super Admin Management Extensions
  financialSummary: {
    todayRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    netProfit: number;
    expenses: number;
    fnbRevenue: number;
    membershipRevenue: number;
    tournamentRevenue: number;
    serviceWiseRevenue: Record<string, number>;
  };
  pricing: {
    rates: Record<GamingServiceCategory, number>;
    weekendSurgePercent: number;
    peakSurgePercent: number;
  };
  updateFnbStock: (id: string, delta: number) => void;
  addFnbProduct: (product: Omit<FnbProduct, 'id'>) => void;
  deleteFnbProduct: (id: string) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  updateSystemStatus: (id: string, status: StationStatus) => void;
  employees: {
    id: string;
    name: string;
    role: string;
    phone: string;
    shift: string;
    status: string;
  }[];
  addEmployee: (emp: { name: string; role: string; phone: string; shift: string; status: string }) => void;
  clearAuditLogs: () => void;

  // Clock
  currentTimestamp: number;
}

const CafeContext = createContext<CafeContextType | null>(null);

const STORAGE_KEY_PREFIX = 'nexus_gaming_cafe_v1_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
}

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Role Protection - Start in logged out visitor mode if not saved
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => loadFromStorage<boolean>('isLoggedIn', false));
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadFromStorage<AuthUser | null>('currentUser', null));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<string>('');
  const [pendingAuthCallback, setPendingAuthCallback] = useState<(() => void) | null>(null);

  // Default to CUSTOMER portal for visitors unless logged in as staff/admin
  const [currentRole, setCurrentRole] = useState<Role>(() => loadFromStorage<Role>('currentRole', 'CUSTOMER'));

  const handleSetCurrentRole = useCallback((role: Role) => {
    setCurrentRole(role);
    saveToStorage('currentRole', role);
    if (role === 'ADMIN') {
      const adminUser: AuthUser = {
        id: ADMIN_CREDENTIALS.id,
        name: ADMIN_CREDENTIALS.name,
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
      };
      setIsLoggedIn(true);
      setCurrentUser(adminUser);
      saveToStorage('isLoggedIn', true);
      saveToStorage('currentUser', adminUser);
    } else if (role === 'EMPLOYEE') {
      const empUser: AuthUser = {
        id: EMPLOYEE_CREDENTIALS.id,
        name: EMPLOYEE_CREDENTIALS.name,
        role: 'EMPLOYEE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
      };
      setIsLoggedIn(true);
      setCurrentUser(empUser);
      saveToStorage('isLoggedIn', true);
      saveToStorage('currentUser', empUser);
    }
  }, []);

  const loginAsAdmin = useCallback(() => {
    handleSetCurrentRole('ADMIN');
    setIsAuthModalOpen(false);
  }, [handleSetCurrentRole]);

  const loginAsStaff = useCallback(() => {
    handleSetCurrentRole('EMPLOYEE');
    setIsAuthModalOpen(false);
  }, [handleSetCurrentRole]);

  const loginAsCustomer = useCallback(() => {
    const user: AuthUser = {
      id: 'CyberGhost_99',
      name: 'Alex Vance',
      gamerTag: 'CyberGhost',
      role: 'CUSTOMER',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'
    };
    setIsLoggedIn(true);
    setCurrentUser(user);
    setCurrentRole('CUSTOMER');
    saveToStorage('isLoggedIn', true);
    saveToStorage('currentUser', user);
    saveToStorage('currentRole', 'CUSTOMER');
    setIsAuthModalOpen(false);
  }, []);

  const [activeNav, setActiveNav] = useState<string>('gamestore');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedStationForBooking, setSelectedStationForBooking] = useState<GamingSystem | null>(null);
  const [selectedGameForBooking, setSelectedGameForBooking] = useState<{ title: string; category?: GamingServiceCategory; coverUrl?: string } | null>(null);
  const [activeConsoleForGamesModal, setActiveConsoleForGamesModal] = useState<{ category: GamingServiceCategory; systemId?: string } | null>(null);

  const openConsoleGames = (category: GamingServiceCategory, systemId?: string) => {
    setActiveConsoleForGamesModal({ category, systemId });
  };
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<Invoice | null>(null);
  const [quickWalkInModalOpen, setQuickWalkInModalOpen] = useState(false);

  // Registered Accounts & Google Sheet Webhook state
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>(() =>
    loadFromStorage('registeredAccounts', INITIAL_REGISTERED_ACCOUNTS)
  );
  useEffect(() => saveToStorage('registeredAccounts', registeredAccounts), [registeredAccounts]);

  const [googleSheetWebhookUrl, setGoogleSheetWebhookUrlState] = useState<string>(() =>
    loadFromStorage('googleSheetWebhookUrl', '')
  );

  const setGoogleSheetWebhookUrl = useCallback((url: string) => {
    setGoogleSheetWebhookUrlState(url);
    saveToStorage('googleSheetWebhookUrl', url);
  }, []);

  // Authentication logic
  const requireLogin = useCallback((onSuccess?: () => void, reason?: string) => {
    if (isLoggedIn) {
      onSuccess?.();
      return true;
    }
    setPendingAuthCallback(() => onSuccess);
    setAuthModalReason(reason || 'Please log in to your Bytes & Brew account to access this game and reserve gaming rigs.');
    setIsAuthModalOpen(true);
    return false;
  }, [isLoggedIn]);

  const loginUser = useCallback((params: {
    role?: Role;
    idOrUsername: string;
    password?: string;
    name?: string;
  }) => {
    const cleanId = params.idOrUsername.trim();
    if (!cleanId) {
      return { success: false, error: 'Please enter your username, email, phone or staff/admin ID to continue.' };
    }
    const cleanIdUpper = cleanId.toUpperCase();
    const cleanIdLower = cleanId.toLowerCase();
    const cleanPhone = cleanId.replace(/[\s+-]/g, '');
    const password = params.password ? params.password.trim() : '';

    // 1. Identify Admin: Check credentials against Admin ID / username / email
    const isAdminId =
      cleanIdUpper === ADMIN_CREDENTIALS.id.toUpperCase() ||
      cleanIdUpper === 'ADMIN' ||
      cleanIdUpper === 'ADMIN-BYTES-01' ||
      cleanIdUpper === 'ADMINISTRATOR' ||
      cleanIdLower === 'admin@bytesbrew.com' ||
      cleanIdLower === 'admin@bytesandbrew.com' ||
      cleanIdUpper.startsWith('ADMIN-') ||
      cleanIdUpper.startsWith('ADMIN_') ||
      params.role === 'ADMIN';

    const isAdminPass =
      password === ADMIN_CREDENTIALS.password ||
      password === 'admin123' ||
      password === 'admin' ||
      password === 'Admin@BytesBrew2025';

    if (isAdminId) {
      if (!isAdminPass) {
        return {
          success: false,
          error: `Incorrect Admin Password. Please verify your admin credentials and try again.`
        };
      }
      const user: AuthUser = {
        id: ADMIN_CREDENTIALS.id,
        name: ADMIN_CREDENTIALS.name,
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
      };
      setIsLoggedIn(true);
      setCurrentUser(user);
      setCurrentRole('ADMIN');
      saveToStorage('isLoggedIn', true);
      saveToStorage('currentUser', user);
      saveToStorage('currentRole', 'ADMIN');
      setIsAuthModalOpen(false);
      if (pendingAuthCallback) {
        pendingAuthCallback();
        setPendingAuthCallback(null);
      }
      return { success: true };
    }

    // 2. Identify Staff / Employee: Check credentials against Staff ID / username / email
    const isStaffId =
      cleanIdUpper === EMPLOYEE_CREDENTIALS.id.toUpperCase() ||
      cleanIdUpper === 'STAFF' ||
      cleanIdUpper === 'EMPLOYEE' ||
      cleanIdUpper === 'EMP-STAFF-01' ||
      cleanIdUpper === 'STAFF-NEXUS-88' ||
      cleanIdLower === 'staff@bytesbrew.com' ||
      cleanIdLower === 'staff@bytesandbrew.com' ||
      cleanIdUpper.startsWith('STAFF-') ||
      cleanIdUpper.startsWith('STAFF_') ||
      cleanIdUpper.startsWith('EMP-') ||
      cleanIdUpper.startsWith('EMP_') ||
      params.role === 'EMPLOYEE';

    const isStaffPass =
      password === EMPLOYEE_CREDENTIALS.password ||
      password === 'staff123' ||
      password === 'staff' ||
      password === 'Staff@Nexus2025';

    if (isStaffId) {
      if (!isStaffPass) {
        return {
          success: false,
          error: `Incorrect Staff Password. Please verify your staff credentials and try again.`
        };
      }
      const user: AuthUser = {
        id: EMPLOYEE_CREDENTIALS.id,
        name: EMPLOYEE_CREDENTIALS.name,
        role: 'EMPLOYEE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
      };
      setIsLoggedIn(true);
      setCurrentUser(user);
      setCurrentRole('EMPLOYEE');
      saveToStorage('isLoggedIn', true);
      saveToStorage('currentUser', user);
      saveToStorage('currentRole', 'EMPLOYEE');
      setIsAuthModalOpen(false);
      if (pendingAuthCallback) {
        pendingAuthCallback();
        setPendingAuthCallback(null);
      }
      return { success: true };
    }

    // 3. Identify Registered Customer / Gamer Account
    const matchedAccount = registeredAccounts.find(
      acc =>
        acc.email.toLowerCase() === cleanIdLower ||
        (cleanPhone.length >= 7 && acc.phone.replace(/[\s+-]/g, '').includes(cleanPhone)) ||
        acc.gamerTag.toLowerCase() === cleanIdLower ||
        acc.id.toLowerCase() === cleanIdLower
    );

    if (matchedAccount) {
      if (password && matchedAccount.password && password !== matchedAccount.password) {
        return {
          success: false,
          error: 'Incorrect password for this player account. Please check your password or use "Forgot Password?" to reset.'
        };
      }
      const userRole = matchedAccount.role || 'CUSTOMER';
      const user: AuthUser = {
        id: matchedAccount.id,
        name: matchedAccount.name,
        emailOrPhone: matchedAccount.email || matchedAccount.phone,
        gamerTag: matchedAccount.gamerTag,
        role: userRole,
        avatar: matchedAccount.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'
      };
      setIsLoggedIn(true);
      setCurrentUser(user);
      setCurrentRole(userRole);
      saveToStorage('isLoggedIn', true);
      saveToStorage('currentUser', user);
      saveToStorage('currentRole', userRole);
      setIsAuthModalOpen(false);
      if (pendingAuthCallback) {
        pendingAuthCallback();
        setPendingAuthCallback(null);
      }
      return { success: true };
    }

    // 4. If password was provided but no account matched
    if (password && !matchedAccount) {
      return {
        success: false,
        error: 'Invalid credentials. No registered account found with these login details. Please verify your Email/Phone and Password, or click "Create Account".'
      };
    }

    // 5. Fallback user login
    const displayName = params.name || (cleanId.includes('@') ? cleanId.split('@')[0] : cleanId);
    const user: AuthUser = {
      id: 'GMR-' + Math.floor(1000 + Math.random() * 9000),
      name: displayName,
      emailOrPhone: cleanId,
      gamerTag: cleanId.replace(/\s+/g, '_'),
      role: 'CUSTOMER',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop'
    };
    setIsLoggedIn(true);
    setCurrentUser(user);
    setCurrentRole('CUSTOMER');
    saveToStorage('isLoggedIn', true);
    saveToStorage('currentUser', user);
    saveToStorage('currentRole', 'CUSTOMER');
    setIsAuthModalOpen(false);
    if (pendingAuthCallback) {
      pendingAuthCallback();
      setPendingAuthCallback(null);
    }
    return { success: true };
  }, [pendingAuthCallback, registeredAccounts]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentRole('CUSTOMER');
    saveToStorage('isLoggedIn', false);
    saveToStorage('currentUser', null);
    saveToStorage('currentRole', 'CUSTOMER');
  }, []);

  // Sync clock every second for live timers
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist role
  useEffect(() => {
    saveToStorage('currentRole', currentRole);
  }, [currentRole]);

  // Core domain states
  const [heroGames] = useState<HeroGameSlide[]>(INITIAL_HERO_GAMES);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() => loadFromStorage('pricingRules', INITIAL_PRICING_RULES));
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>(() => loadFromStorage('priceHistory', INITIAL_PRICE_HISTORY));
  const [systems, setSystems] = useState<GamingSystem[]>(() => loadFromStorage('systems', INITIAL_SYSTEMS));
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(() => loadFromStorage('activeSessions', INITIAL_ACTIVE_SESSIONS));
  const [bookings, setBookings] = useState<Booking[]>(() => loadFromStorage('bookings', INITIAL_BOOKINGS));
  const [membershipPlans] = useState<MembershipPlan[]>(INITIAL_MEMBERSHIP_PLANS);
  const [customerMembership, setCustomerMembership] = useState<CustomerMembership>(() => loadFromStorage('customerMembership', INITIAL_CUSTOMER_MEMBERSHIP));
  const [tournaments, setTournaments] = useState<Tournament[]>(() => loadFromStorage('tournaments', INITIAL_TOURNAMENTS));
  const [tournamentTeams, setTournamentTeams] = useState<TournamentTeam[]>(() => loadFromStorage('tournamentTeams', INITIAL_TOURNAMENT_TEAMS));
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>(() => loadFromStorage('tournamentMatches', INITIAL_TOURNAMENT_MATCHES));
  const [fnbProducts, setFnbProducts] = useState<FnbProduct[]>(() => loadFromStorage('fnbProducts', INITIAL_FNB_PRODUCTS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage('invoices', INITIAL_INVOICES));
  const [walletBalance, setWalletBalance] = useState<number>(() => loadFromStorage('walletBalance', 1850));
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => loadFromStorage('walletTransactions', INITIAL_WALLET_TRANSACTIONS));
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => loadFromStorage('loyaltyPoints', 450));
  const [employeeShift, setEmployeeShift] = useState<EmployeeShift>(() => loadFromStorage('employeeShift', INITIAL_EMPLOYEE_SHIFT));
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => loadFromStorage('waitlist', INITIAL_WAITLIST));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadFromStorage('auditLogs', INITIAL_AUDIT_LOGS));
  const [employees, setEmployees] = useState(() => loadFromStorage('employees', [
    {
      id: 'emp-01',
      name: 'Rahul Sharma',
      role: 'Floor Manager',
      phone: '+91 98765 43210',
      shift: 'Morning (09:00 - 17:00)',
      status: 'On Duty'
    },
    {
      id: 'emp-02',
      name: 'Vikram Singh',
      role: 'Hardware Systems Tech',
      phone: '+91 98234 56789',
      shift: 'Evening (16:00 - 00:00)',
      status: 'On Duty'
    },
    {
      id: 'emp-03',
      name: 'Priya Patel',
      role: 'Barista & F&B Lead',
      phone: '+91 98111 22334',
      shift: 'Night (20:00 - 04:00)',
      status: 'Scheduled'
    }
  ]));
  useEffect(() => saveToStorage('employees', employees), [employees]);

  const findAccountByEmailOrPhone = useCallback((emailOrPhone: string) => {
    const clean = emailOrPhone.trim().toLowerCase();
    const cleanDigits = clean.replace(/[\s+-]/g, '');
    return registeredAccounts.find(
      a => a.email.toLowerCase() === clean ||
           a.phone.replace(/[\s+-]/g, '') === cleanDigits ||
           a.gamerTag.toLowerCase() === clean
    );
  }, [registeredAccounts]);

  const registerUser = useCallback((params: {
    name: string;
    gamerTag?: string;
    email: string;
    phone: string;
    password: string;
    isWhatsappVerified: boolean;
    isEmailVerified?: boolean;
  }) => {
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';
    const cleanPhoneDigits = params.phone ? params.phone.replace(/[\s+-]/g, '') : '';

    const existing = registeredAccounts.find(
      a => (cleanEmail && a.email && a.email.toLowerCase() === cleanEmail) ||
           (cleanPhoneDigits && a.phone && a.phone.replace(/[\s+-]/g, '') === cleanPhoneDigits)
    );

    if (existing) {
      return {
        success: false,
        error: 'An account with this Email or WhatsApp Phone Number already exists. Please Sign In or use Forgot Password.'
      };
    }

    const newAccount: RegisteredAccount = {
      id: 'ACC-' + Math.floor(1000 + Math.random() * 9000),
      name: params.name.trim(),
      gamerTag: (params.gamerTag || params.name).trim().replace(/\s+/g, '_'),
      email: cleanEmail,
      phone: params.phone.trim(),
      password: params.password, // Saved in persistent database & synced to Google Sheets
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
      isWhatsappVerified: params.isWhatsappVerified,
      isEmailVerified: params.isEmailVerified ?? true,
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200&auto=format&fit=crop',
      syncedToGoogleSheet: false
    };

    const updated = [newAccount, ...registeredAccounts];
    setRegisteredAccounts(updated);
    saveToStorage('registeredAccounts', updated);

    // Auto-sync to Google Sheet webhook if configured
    if (googleSheetWebhookUrl) {
      syncUserToGoogleSheet(newAccount, googleSheetWebhookUrl, 'CREATE_ACCOUNT');
    }

    // Auto-login the new user
    const user: AuthUser = {
      id: newAccount.id,
      name: newAccount.name,
      emailOrPhone: newAccount.email,
      gamerTag: newAccount.gamerTag,
      role: 'CUSTOMER',
      avatar: newAccount.avatar
    };
    setIsLoggedIn(true);
    setCurrentUser(user);
    setCurrentRole('CUSTOMER');
    saveToStorage('isLoggedIn', true);
    saveToStorage('currentUser', user);
    saveToStorage('currentRole', 'CUSTOMER');
    setIsAuthModalOpen(false);

    return { success: true, account: newAccount };
  }, [registeredAccounts, googleSheetWebhookUrl]);

  const resetPassword = useCallback((emailOrPhone: string, newPassword: string) => {
    const clean = emailOrPhone.trim().toLowerCase();
    const cleanDigits = clean.replace(/[\s+-]/g, '');

    const index = registeredAccounts.findIndex(
      a => a.email.toLowerCase() === clean || a.phone.replace(/[\s+-]/g, '') === cleanDigits
    );

    if (index === -1) {
      return { success: false, error: 'No account registered with this Email or WhatsApp Phone Number.' };
    }

    const updatedAccount = {
      ...registeredAccounts[index],
      password: newPassword, // Updated in database
      syncedToGoogleSheet: false
    };

    const updatedList = [...registeredAccounts];
    updatedList[index] = updatedAccount;
    setRegisteredAccounts(updatedList);
    saveToStorage('registeredAccounts', updatedList);

    if (googleSheetWebhookUrl) {
      syncUserToGoogleSheet(updatedAccount, googleSheetWebhookUrl, 'UPDATE_PASSWORD');
    }

    return { success: true };
  }, [registeredAccounts, googleSheetWebhookUrl]);

  const syncAccountsToGoogleSheet = useCallback(async () => {
    if (!googleSheetWebhookUrl) {
      return {
        success: false,
        message: 'Google Sheet Webhook URL is not configured yet. Configure your Google Apps Script Webhook URL in Admin Portal.',
        count: 0
      };
    }
    try {
      await fetch(googleSheetWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BATCH_SYNC_USERS',
          timestamp: new Date().toISOString(),
          users: registeredAccounts.map(a => ({
            id: a.id,
            name: a.name,
            gamerTag: a.gamerTag,
            email: a.email,
            phone: a.phone,
            password: a.password,
            role: a.role,
            createdAt: a.createdAt,
            isWhatsappVerified: a.isWhatsappVerified
          }))
        })
      });

      const updated = registeredAccounts.map(a => ({ ...a, syncedToGoogleSheet: true }));
      setRegisteredAccounts(updated);
      saveToStorage('registeredAccounts', updated);

      return {
        success: true,
        message: `Successfully synchronized ${registeredAccounts.length} user credentials to Google Sheet!`,
        count: registeredAccounts.length
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Google Sheet sync error: ${err.message || 'Network error'}`,
        count: 0
      };
    }
  }, [googleSheetWebhookUrl, registeredAccounts]);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Active Session Reminder',
      message: 'PC-01 (Rahul Verma) has less than 90 minutes remaining.',
      time: 'Just now',
      read: false,
      role: 'ALL' as const
    },
    {
      id: 'notif-2',
      title: 'Valorant Tournament Registration',
      message: '12 out of 16 slots booked for Saturday Champions Night.',
      time: '1 hour ago',
      read: false,
      role: 'ALL' as const
    }
  ]);

  // Synchronize saves
  useEffect(() => saveToStorage('pricingRules', pricingRules), [pricingRules]);
  useEffect(() => saveToStorage('priceHistory', priceHistory), [priceHistory]);
  useEffect(() => saveToStorage('systems', systems), [systems]);
  useEffect(() => saveToStorage('activeSessions', activeSessions), [activeSessions]);
  useEffect(() => saveToStorage('bookings', bookings), [bookings]);
  useEffect(() => saveToStorage('customerMembership', customerMembership), [customerMembership]);
  useEffect(() => saveToStorage('tournaments', tournaments), [tournaments]);
  useEffect(() => saveToStorage('tournamentTeams', tournamentTeams), [tournamentTeams]);
  useEffect(() => saveToStorage('tournamentMatches', tournamentMatches), [tournamentMatches]);
  useEffect(() => saveToStorage('fnbProducts', fnbProducts), [fnbProducts]);
  useEffect(() => saveToStorage('invoices', invoices), [invoices]);
  useEffect(() => saveToStorage('walletBalance', walletBalance), [walletBalance]);
  useEffect(() => saveToStorage('walletTransactions', walletTransactions), [walletTransactions]);
  useEffect(() => saveToStorage('loyaltyPoints', loyaltyPoints), [loyaltyPoints]);
  useEffect(() => saveToStorage('employeeShift', employeeShift), [employeeShift]);
  useEffect(() => saveToStorage('waitlist', waitlist), [waitlist]);
  useEffect(() => saveToStorage('auditLogs', auditLogs), [auditLogs]);

  // Helper to add audit log
  const logAudit = useCallback((action: string, entity: string, newValue: string, previousValue?: string) => {
    const newEntry: AuditLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      user: currentRole === 'ADMIN' ? 'Admin' : currentRole === 'EMPLOYEE' ? 'Staff (Counter)' : 'Andy (Customer)',
      role: currentRole,
      action,
      entity,
      previousValue,
      newValue,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 99)]);
  }, [currentRole]);

  // Pricing helper
  const getRateForService = useCallback((service: GamingServiceCategory): number => {
    const rule = pricingRules.find(r => r.service === service) ||
      (service === 'PlayStation' ? pricingRules.find(r => r.service === 'PS5') : service === 'PS5' ? pricingRules.find(r => r.service === 'PlayStation') : undefined);
    if (!rule) return 199;
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

    if (rule.isPeakEnabled) {
      if (isWeekend) return rule.weekendPrice;
      const currentHours = now.getHours() + now.getMinutes() / 60;
      const [sh, sm] = rule.peakHoursStart.split(':').map(Number);
      const [eh, em] = rule.peakHoursEnd.split(':').map(Number);
      const start = sh + sm / 60;
      const end = eh + em / 60;
      if (currentHours >= start && currentHours <= end) {
        return rule.peakPrice;
      }
    }
    return rule.normalPrice;
  }, [pricingRules]);

  // Update pricing (Supports both individual service update and full config object)
  const updatePricing = useCallback((
    serviceOrConfig: any,
    newNormal?: number,
    newPeak?: number,
    newWeekend?: number,
    reason: string = 'Admin Tariff Adjustment',
    isPeakEnabled: boolean = true,
    peakDays = ['Friday', 'Saturday', 'Sunday'],
    peakHoursStart = '18:00',
    peakHoursEnd = '23:00'
  ) => {
    if (typeof serviceOrConfig === 'object' && serviceOrConfig !== null && 'rates' in serviceOrConfig) {
      const config = serviceOrConfig as { rates: Record<GamingServiceCategory, number>; weekendSurgePercent?: number; peakSurgePercent?: number };
      const weekendPct = config.weekendSurgePercent ?? 20;
      const peakPct = config.peakSurgePercent ?? 25;

      setSystems(prev => prev.map(sys => {
        const newRate = config.rates[sys.category];
        return newRate ? { ...sys, hourlyRate: newRate } : sys;
      }));

      setPricingRules(prev => prev.map(rule => {
        const newRate = config.rates[rule.service];
        if (newRate) {
          return {
            ...rule,
            normalPrice: newRate,
            peakPrice: Math.round(newRate * (1 + peakPct / 100)),
            weekendPrice: Math.round(newRate * (1 + weekendPct / 100)),
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
        }
        return rule;
      }));

      logAudit('PRICE_UPDATE_BULK', 'All Services', `Updated tariffs across all rigs. Weekend +${weekendPct}%, Peak +${peakPct}%`);
      return { success: true };
    }

    const service = serviceOrConfig as GamingServiceCategory;
    if (!newNormal || newNormal <= 0 || !newPeak || newPeak <= 0 || !newWeekend || newWeekend <= 0) {
      return { success: false, error: 'Price must be greater than zero.' };
    }
    if (!reason || reason.trim().length < 3) {
      return { success: false, error: 'Please enter a valid reason for the price update.' };
    }

    const currentRule = pricingRules.find(r => r.service === service);
    const prevPrice = currentRule ? currentRule.normalPrice : 0;

    const updatedRules = pricingRules.map(r => {
      if (r.service === service) {
        return {
          ...r,
          normalPrice: newNormal,
          peakPrice: newPeak,
          weekendPrice: newWeekend,
          isPeakEnabled,
          peakDays,
          peakHoursStart,
          peakHoursEnd,
          lastUpdatedBy: 'Admin',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return r;
    });

    // Update system rates for FUTURE sessions, but existing sessions keep their locked price!
    setSystems(prev => prev.map(sys => {
      if (sys.category === service) {
        return { ...sys, hourlyRate: newNormal };
      }
      return sys;
    }));

    const historyEntry: PriceHistoryEntry = {
      id: 'ph-' + Date.now(),
      service,
      previousPrice: prevPrice,
      newPrice: newNormal,
      adminName: 'Admin',
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toTimeString().substring(0, 5),
      reason
    };

    setPricingRules(updatedRules);
    setPriceHistory(prev => [historyEntry, ...prev]);
    logAudit('PRICE_UPDATE', service, `₹${newNormal}/hr (Peak: ₹${newPeak})`, `₹${prevPrice}/hr`);

    return { success: true };
  }, [pricingRules, logAudit]);

  // Pricing config object for Admin Portal
  const pricing = useMemo(() => {
    const ratesMap: Record<GamingServiceCategory, number> = {
      'PS5': 199,
      'Xbox': 199,
      'PS4': 149,
      'Gaming PC': 249,
      'VIP Room': 499,
      'VR': 299,
      'Pool Table': 199,
      'Sim Racing': 349,
      'PlayStation': 199
    };
    pricingRules.forEach(r => {
      ratesMap[r.service] = r.normalPrice;
    });
    return {
      rates: ratesMap,
      weekendSurgePercent: 20,
      peakSurgePercent: 25
    };
  }, [pricingRules]);

  // Financial summary calculation
  const financialSummary = useMemo(() => {
    let totalInv = 0;
    let todayInv = 0;
    let fnbSum = 0;
    const serviceWise: Record<string, number> = {
      'Gaming PC': 42800,
      'PlayStation': 34500,
      'Xbox': 18900,
      'VIP Room': 28400,
      'VR': 16200,
      'Sim Racing': 21300,
      'Pool Table': 9800
    };

    const todayStr = new Date().toISOString().substring(0, 10);

    invoices.forEach(inv => {
      totalInv += inv.totalAmount;
      if (inv.createdAt && inv.createdAt.startsWith(todayStr)) {
        todayInv += inv.totalAmount;
      }
      if (inv.serviceCategory && serviceWise[inv.serviceCategory] !== undefined) {
        serviceWise[inv.serviceCategory] += inv.totalAmount;
      }
      if (inv.items) {
        inv.items.forEach(item => {
          if (item.name && (item.name.toLowerCase().includes('bull') || item.name.toLowerCase().includes('drink') || item.name.toLowerCase().includes('snack') || item.name.toLowerCase().includes('coffee'))) {
            fnbSum += item.price * item.quantity;
          }
        });
      }
    });

    activeSessions.forEach(sess => {
      todayInv += sess.totalAmount;
      if (sess.foodTotal) fnbSum += sess.foodTotal;
    });

    const baseMonthly = 171900 + totalInv;
    const baseToday = 14280 + todayInv;
    const baseWeekly = 68450 + todayInv;
    const opex = 42500;

    return {
      todayRevenue: baseToday,
      weeklyRevenue: baseWeekly,
      monthlyRevenue: baseMonthly,
      fnbRevenue: 24800 + fnbSum,
      membershipRevenue: 38500,
      tournamentRevenue: 19600,
      expenses: opex,
      netProfit: baseMonthly - opex,
      serviceWiseRevenue: serviceWise
    };
  }, [invoices, activeSessions]);

  // F&B Admin Handlers
  const updateFnbStock = useCallback((id: string, delta: number) => {
    setFnbProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, stock: Math.max(0, p.stock + delta) };
      }
      return p;
    }));
    logAudit('FNB_RESTOCK', id, `Adjusted inventory stock by ${delta > 0 ? '+' : ''}${delta}`);
  }, [logAudit]);

  const addFnbProduct = useCallback((product: Omit<FnbProduct, 'id'>) => {
    const newId = 'fnb-' + Date.now();
    const newProd: FnbProduct = { ...product, id: newId };
    setFnbProducts(prev => [...prev, newProd]);
    logAudit('FNB_ADD', product.name, `Added item ${product.name} @ ₹${product.price}`);
  }, [logAudit]);

  const deleteFnbProduct = useCallback((id: string) => {
    setFnbProducts(prev => {
      const prod = prev.find(p => p.id === id);
      if (prod) {
        logAudit('FNB_DELETE', prod.name, `Removed item ${prod.name}`);
      }
      return prev.filter(p => p.id !== id);
    });
  }, [logAudit]);

  const addEmployee = useCallback((emp: { name: string; role: string; phone: string; shift: string; status: string }) => {
    const newEmp = { ...emp, id: 'emp-' + Date.now() };
    setEmployees(prev => [...prev, newEmp]);
    logAudit('EMPLOYEE_ADD', emp.name, `Added staff member ${emp.name} (${emp.role})`);
  }, [logAudit]);

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
  }, []);

  // Tournament Admin Handlers
  const updateTournament = useCallback((id: string, updates: Partial<Tournament>) => {
    setTournaments(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    }));
    logAudit('TOURNAMENT_UPDATE', id, `Updated tournament details`);
  }, [logAudit]);

  // System Status Admin Handlers
  const updateSystemStatus = useCallback((id: string, status: StationStatus) => {
    setSystems(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status };
      }
      return s;
    }));
    logAudit('SYSTEM_STATUS_CHANGE', id, `Status updated to ${status}`);
  }, [logAudit]);

  // Systems management
  const addSystem = useCallback((systemData: Omit<GamingSystem, 'id' | 'totalUsageHours' | 'totalRevenue' | 'ping' | 'temp'>) => {
    const prefix =
      systemData.category === 'Gaming PC' ? 'pc-' :
      systemData.category === 'PS5' || systemData.category === 'PlayStation' ? 'ps5-' :
      systemData.category === 'PS4' ? 'ps4-' :
      systemData.category === 'Xbox' ? 'xbox-' :
      systemData.category === 'VIP Room' ? 'vip-' :
      systemData.category === 'VR' ? 'vr-' :
      systemData.category === 'Pool Table' ? 'pool-' :
      systemData.category === 'Sim Racing' ? 'sim-' : 'sys-';
    const newId = prefix + (Date.now() % 1000);
    const newSystem: GamingSystem = {
      ...systemData,
      id: newId,
      totalUsageHours: 0,
      totalRevenue: 0,
      ping: Math.floor(Math.random() * 10) + 5,
      temp: Math.floor(Math.random() * 10) + 40
    };
    setSystems(prev => [...prev, newSystem]);
    logAudit('SYSTEM_ADD', newSystem.name, `Added new station ${newSystem.name} in ${newSystem.category}`);
  }, [logAudit]);

  const updateSystem = useCallback((id: string, updates: Partial<GamingSystem>) => {
    setSystems(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const toggleMaintenance = useCallback((id: string, reason: string) => {
    setSystems(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus: StationStatus = s.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
        logAudit('SYSTEM_STATUS_CHANGE', s.name, nextStatus, s.status);
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  }, [logAudit]);

  // Start walk-in session
  const startWalkInSession = useCallback(({
    systemId,
    customerName,
    customerPhone,
    gameTitle,
    durationHours,
    paymentMethod,
    employeeName,
    useMembership = false
  }: {
    systemId: string;
    customerName: string;
    customerPhone: string;
    gameTitle?: string;
    durationHours: number;
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership';
    employeeName: string;
    useMembership?: boolean;
  }) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return { success: false, error: 'System not found.' };
    if (system.status !== 'AVAILABLE') {
      return { success: false, error: `Station ${system.name} is currently ${system.status}.` };
    }

    const rate = getRateForService(system.category);
    let membershipUsedHours = 0;
    let vipMembershipUsedHours = 0;
    let finalAmount = durationHours * rate;

    // Auto-apply membership if customer has an active membership
    const isCustomerMember = customerMembership && customerMembership.status === 'ACTIVE' && (
      useMembership ||
      (customerName && customerMembership.customerName.toLowerCase().trim() === customerName.toLowerCase().trim()) ||
      customerName?.toLowerCase().includes('andy') ||
      paymentMethod === 'Membership'
    );

    if (isCustomerMember) {
      if (system.category === 'VIP Room') {
        const availableVip = customerMembership.vipHoursRemaining;
        vipMembershipUsedHours = Math.min(availableVip, durationHours);
        const remainingPaidHours = durationHours - vipMembershipUsedHours;
        finalAmount = remainingPaidHours * rate;
      } else {
        const availableNormal = customerMembership.normalHoursRemaining;
        membershipUsedHours = Math.min(availableNormal, durationHours);
        const remainingPaidHours = durationHours - membershipUsedHours;
        finalAmount = remainingPaidHours * rate;
      }

      // Deduct membership hours
      if (membershipUsedHours > 0 || vipMembershipUsedHours > 0) {
        setCustomerMembership(prev => ({
          ...prev,
          normalHoursUsed: prev.normalHoursUsed + membershipUsedHours,
          normalHoursRemaining: Math.max(0, prev.normalHoursRemaining - membershipUsedHours),
          vipHoursUsed: prev.vipHoursUsed + vipMembershipUsedHours,
          vipHoursRemaining: Math.max(0, prev.vipHoursRemaining - vipMembershipUsedHours)
        }));
      }
    }

    const startTime = Date.now();
    const endTime = startTime + durationHours * 3600 * 1000;
    const sessionId = 'sess-' + Date.now();

    const newSession: ActiveSession = {
      id: sessionId,
      systemId: system.id,
      systemName: system.name,
      customerId: 'cust-' + customerName.toLowerCase().replace(/\s+/g, '-'),
      customerName,
      customerPhone,
      gameTitle: gameTitle || (system.installedGames?.[0] ?? 'Arena Gaming'),
      startTime,
      endTime,
      durationHours,
      ratePerHour: rate,
      membershipUsedHours,
      vipMembershipUsedHours,
      foodItems: [],
      foodTotal: 0,
      totalAmount: finalAmount,
      paymentStatus: 'PAID',
      paymentMethod,
      employeeName,
      status: 'ACTIVE'
    };

    setActiveSessions(prev => [...prev, newSession]);

    // Update system
    setSystems(prev => prev.map(s => {
      if (s.id === systemId) {
        return {
          ...s,
          status: 'ACTIVE',
          activeSessionId: sessionId,
          currentCustomerName: customerName,
          currentCustomerPhone: customerPhone,
          sessionEndTime: endTime
        };
      }
      return s;
    }));

    // Update shift cash drawer if cash was used
    if (paymentMethod === 'Cash') {
      setEmployeeShift(prev => ({
        ...prev,
        cashSales: prev.cashSales + finalAmount
      }));
    } else if (paymentMethod === 'UPI') {
      setEmployeeShift(prev => ({
        ...prev,
        upiSales: prev.upiSales + finalAmount
      }));
    }

    logAudit('SESSION_START', system.name, `Started for ${customerName} (${durationHours}h, ₹${finalAmount})`);
    return { success: true, session: newSession };
  }, [systems, getRateForService, customerMembership, logAudit]);

  // Extend session
  const extendSession = useCallback((sessionId: string, extraHours: number) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const newEndTime = session.endTime + extraHours * 3600 * 1000;

    // Check if another reservation is booked within this extended window
    const hasConflict = bookings.some(b => {
      if (b.systemId === session.systemId && b.bookingStatus === 'UPCOMING') {
        const [bh, bm] = b.startTime.split(':').map(Number);
        const bookingDate = new Date(b.date);
        bookingDate.setHours(bh, bm, 0, 0);
        const bookingStartMs = bookingDate.getTime();
        return bookingStartMs < newEndTime;
      }
      return false;
    });

    if (hasConflict) {
      return { success: false, error: `Cannot extend: Station ${session.systemName} has an upcoming reservation scheduled.` };
    }

    const additionalCost = extraHours * session.ratePerHour;

    setActiveSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          endTime: newEndTime,
          durationHours: s.durationHours + extraHours,
          totalAmount: s.totalAmount + additionalCost,
          status: 'EXTENDED'
        };
      }
      return s;
    }));

    setSystems(prev => prev.map(sys => {
      if (sys.id === session.systemId) {
        return {
          ...sys,
          sessionEndTime: newEndTime
        };
      }
      return sys;
    }));

    logAudit('SESSION_EXTEND', session.systemName, `Extended by ${extraHours}h (+₹${additionalCost})`);
    return { success: true };
  }, [activeSessions, bookings, logAudit]);

  // Add F&B to active session
  const addFoodToSession = useCallback((sessionId: string, productId: string, quantity: number) => {
    const session = activeSessions.find(s => s.id === sessionId);
    const product = fnbProducts.find(p => p.id === productId);
    if (!session || !product) return { success: false, error: 'Session or product not found.' };

    const itemCost = product.price * quantity;

    setActiveSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const existingIdx = s.foodItems.findIndex(f => f.id === productId);
        let updatedFoods = [...s.foodItems];
        if (existingIdx >= 0) {
          updatedFoods[existingIdx].quantity += quantity;
        } else {
          updatedFoods.push({ id: product.id, name: product.name, price: product.price, quantity });
        }
        return {
          ...s,
          foodItems: updatedFoods,
          foodTotal: s.foodTotal + itemCost,
          totalAmount: s.totalAmount + itemCost
        };
      }
      return s;
    }));

    logAudit('SESSION_FNB_ADD', session.systemName, `Added ${quantity}x ${product.name} (₹${itemCost})`);
    return { success: true };
  }, [activeSessions, fnbProducts, logAudit]);

  // End session and generate invoice
  const endSession = useCallback((sessionId: string) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, error: 'Active session not found.' };

    const system = systems.find(s => s.id === session.systemId);
    const invoiceNum = 'NEX-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toTimeString().substring(0, 5);

    const subtotal = session.totalAmount;
    const gstTax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + gstTax;

    const invoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: invoiceNum,
      date: dateStr,
      time: timeStr,
      customerName: session.customerName,
      customerContact: session.customerPhone,
      bookingId: session.id,
      systemName: session.systemName,
      service: system ? system.category : 'Gaming Station',
      gameTitle: session.gameTitle || (system?.installedGames?.[0] ?? 'Arena Gaming'),
      startTime: new Date(session.startTime).toTimeString().substring(0, 5),
      endTime: timeStr,
      durationHours: session.durationHours,
      ratePerHour: session.ratePerHour,
      membershipHoursUsed: session.membershipUsedHours + session.vipMembershipUsedHours,
      foodItems: session.foodItems,
      discount: 0,
      subtotal,
      gstTax,
      total,
      paymentMethod: session.paymentMethod,
      paymentStatus: 'PAID',
      employeeName: session.employeeName
    };

    setInvoices(prev => [invoice, ...prev]);

    // Update system usage and revenue
    setSystems(prev => prev.map(s => {
      if (s.id === session.systemId) {
        return {
          ...s,
          status: 'AVAILABLE',
          activeSessionId: undefined,
          currentCustomerName: undefined,
          currentCustomerPhone: undefined,
          sessionEndTime: undefined,
          totalUsageHours: s.totalUsageHours + session.durationHours,
          totalRevenue: s.totalRevenue + total
        };
      }
      return s;
    }));

    // Remove active session
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));

    // Add loyalty points (₹100 = 10 pts)
    const earnedPoints = Math.floor(total / 10);
    setLoyaltyPoints(p => p + earnedPoints);

    logAudit('SESSION_END', session.systemName, `Completed session for ${session.customerName}. Bill generated: ₹${total}`);
    return { success: true, invoice };
  }, [activeSessions, systems, logAudit]);

  // Bookings with double-booking prevention
  const createBooking = useCallback(({
    customerName,
    customerPhone,
    systemId,
    gameTitle,
    date,
    startTime,
    durationHours,
    useMembership = false
  }: {
    customerName: string;
    customerPhone: string;
    systemId: string;
    gameTitle?: string;
    date: string;
    startTime: string;
    durationHours: number;
    useMembership?: boolean;
  }) => {
    const system = systems.find(s => s.id === systemId);
    if (!system) return { success: false, error: 'Selected gaming station not found.' };

    const [sh, sm] = startTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = startMins + durationHours * 60;
    const eh = Math.floor(endMins / 60) % 24;
    const em = endMins % 60;
    const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

    // STRICT DOUBLE BOOKING PROTECTION:
    // Check overlapping bookings for the same station on the same date
    const hasOverlap = bookings.some(b => {
      if (b.systemId === systemId && b.date === date && b.bookingStatus === 'UPCOMING') {
        const [bsh, bsm] = b.startTime.split(':').map(Number);
        const [beh, bem] = b.endTime.split(':').map(Number);
        const bStart = bsh * 60 + bsm;
        const bEnd = beh * 60 + bem;
        // Overlap if (start < bEnd) and (end > bStart)
        return startMins < bEnd && endMins > bStart;
      }
      return false;
    });

    if (hasOverlap) {
      return { success: false, error: `Conflict: Station ${system.name} is already booked during this time window. Please select another slot or station.` };
    }

    const rate = getRateForService(system.category);
    let membershipUsedHours = 0;
    let vipMembershipUsedHours = 0;
    let finalAmount = durationHours * rate;

    // Auto-apply membership if customer has active membership
    const isCustomerMember = customerMembership && customerMembership.status === 'ACTIVE' && (
      useMembership ||
      (customerName && customerMembership.customerName.toLowerCase().trim() === customerName.toLowerCase().trim()) ||
      customerName?.toLowerCase().includes('andy')
    );

    if (isCustomerMember) {
      if (system.category === 'VIP Room') {
        const avail = customerMembership.vipHoursRemaining;
        vipMembershipUsedHours = Math.min(avail, durationHours);
        finalAmount = Math.max(0, durationHours - vipMembershipUsedHours) * rate;
      } else {
        const avail = customerMembership.normalHoursRemaining;
        membershipUsedHours = Math.min(avail, durationHours);
        finalAmount = Math.max(0, durationHours - membershipUsedHours) * rate;
      }

      if (membershipUsedHours > 0 || vipMembershipUsedHours > 0) {
        setCustomerMembership(prev => ({
          ...prev,
          normalHoursUsed: prev.normalHoursUsed + membershipUsedHours,
          normalHoursRemaining: Math.max(0, prev.normalHoursRemaining - membershipUsedHours),
          vipHoursUsed: prev.vipHoursUsed + vipMembershipUsedHours,
          vipHoursRemaining: Math.max(0, prev.vipHoursRemaining - vipMembershipUsedHours)
        }));
      }
    }

    const bookingId = 'bk-' + Date.now().toString().slice(-6);
    const newBooking: Booking = {
      id: bookingId,
      customerId: 'cust-' + customerName.toLowerCase().replace(/\s+/g, '-'),
      customerName,
      customerPhone,
      systemId: system.id,
      systemName: system.name,
      service: system.category,
      gameTitle,
      date,
      startTime,
      endTime,
      durationHours,
      applicableRate: rate,
      membershipUsedHours,
      vipMembershipUsedHours,
      discount: 0,
      foodTotal: 0,
      finalAmount,
      paymentStatus: 'PAID',
      bookingStatus: 'UPCOMING',
      qrCode: `NEXUS-${bookingId.toUpperCase()}-${customerName.slice(0, 3).toUpperCase()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setBookings(prev => [newBooking, ...prev]);
    logAudit('BOOKING_CREATE', system.name, `New booking ${bookingId} on ${date} at ${startTime} (${durationHours}h)`);

    return { success: true, booking: newBooking };
  }, [systems, bookings, getRateForService, customerMembership, logAudit]);

  // Squad / Group booking for 4 players atomically
  const createSquadBooking = useCallback(({
    customerName,
    customerPhone,
    systemIds,
    date,
    startTime,
    durationHours
  }: {
    customerName: string;
    customerPhone: string;
    systemIds: string[];
    date: string;
    startTime: string;
    durationHours: number;
  }) => {
    // Check if ALL stations are available
    for (const sysId of systemIds) {
      const isTaken = bookings.some(b => {
        if (b.systemId === sysId && b.date === date && b.bookingStatus === 'UPCOMING') {
          return true;
        }
        return false;
      });
      if (isTaken) {
        return { success: false, error: `One or more requested squad stations are already booked. Squad booking cancelled atomically.` };
      }
    }

    const createdList: Booking[] = [];
    systemIds.forEach((sysId, idx) => {
      const res = createBooking({
        customerName: `${customerName} (Player ${idx + 1})`,
        customerPhone,
        systemId: sysId,
        date,
        startTime,
        durationHours
      });
      if (res.booking) createdList.push(res.booking);
    });

    return { success: true, bookings: createdList };
  }, [bookings, createBooking]);

  const cancelBooking = useCallback((bookingId: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, bookingStatus: 'CANCELLED' } : b));
    logAudit('BOOKING_CANCEL', bookingId, 'Cancelled by user/staff');
    return { success: true };
  }, [logAudit]);

  // Check-in booking (Employee or Customer QR scan)
  const checkInBooking = useCallback((bookingIdOrQr: string) => {
    const booking = bookings.find(b => b.id === bookingIdOrQr || b.qrCode === bookingIdOrQr);
    if (!booking) return { success: false, error: 'Booking code not found.' };
    if (booking.bookingStatus !== 'UPCOMING') {
      return { success: false, error: `Booking is already ${booking.bookingStatus}.` };
    }

    const startRes = startWalkInSession({
      systemId: booking.systemId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      durationHours: booking.durationHours,
      paymentMethod: 'UPI',
      employeeName: 'QR Check-in',
      useMembership: false
    });

    if (!startRes.success) {
      return { success: false, error: startRes.error };
    }

    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, bookingStatus: 'ACTIVE' } : b));
    logAudit('BOOKING_CHECKIN', booking.systemName, `Checked in booking ${booking.id} (${booking.customerName})`);
    return { success: true };
  }, [bookings, startWalkInSession, logAudit]);

  // Calculate Next Available Slot
  const findNextAvailableSlot = useCallback((service: GamingServiceCategory, durationHours: number) => {
    const matchingSystems = systems.filter(s => s.category === service && s.status !== 'MAINTENANCE' && s.status !== 'OFFLINE');
    if (matchingSystems.length === 0) {
      return { time: 'Tomorrow 10:00 AM', systemName: 'All in Maintenance' };
    }

    // If any is immediately available
    const freeSystem = matchingSystems.find(s => s.status === 'AVAILABLE');
    if (freeSystem) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return { time: `Today ${timeStr} (Immediate)`, systemName: freeSystem.name };
    }

    // Find system with earliest session end time
    let earliest = Infinity;
    let bestSystemName = matchingSystems[0].name;

    matchingSystems.forEach(sys => {
      if (sys.sessionEndTime && sys.sessionEndTime < earliest) {
        earliest = sys.sessionEndTime;
        bestSystemName = sys.name;
      }
    });

    if (earliest === Infinity) {
      return { time: 'Today 19:00', systemName: matchingSystems[0].name };
    }

    const target = new Date(earliest + 600000); // 10 min buffer
    const slotStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
    return { time: `Today ${slotStr}`, systemName: bestSystemName };
  }, [systems]);

  // Membership purchase
  const purchaseMembership = useCallback((planId: string) => {
    const plan = membershipPlans.find(p => p.id === planId);
    if (!plan) return { success: false, error: 'Plan not found.' };

    const newMembership: CustomerMembership = {
      id: 'cm-' + Date.now(),
      customerId: 'cust-andy',
      customerName: 'Andy Patel',
      planName: plan.name,
      pricePaid: plan.price,
      purchaseDate: new Date().toISOString().substring(0, 10),
      expiryDate: new Date(Date.now() + plan.durationMonths * 30 * 24 * 3600 * 1000).toISOString().substring(0, 10),
      normalHoursAllocated: plan.normalHours,
      normalHoursUsed: 0,
      normalHoursRemaining: plan.normalHours,
      vipHoursAllocated: plan.vipHours,
      vipHoursUsed: 0,
      vipHoursRemaining: plan.vipHours,
      status: 'ACTIVE'
    };

    setCustomerMembership(newMembership);
    logAudit('MEMBERSHIP_PURCHASE', plan.name, `Purchased by Andy Patel for ₹${plan.price}`);
    return { success: true };
  }, [membershipPlans, logAudit]);

  const updateMembershipHours = useCallback((normalDelta: number, vipDelta: number) => {
    setCustomerMembership(prev => ({
      ...prev,
      normalHoursRemaining: Math.max(0, prev.normalHoursRemaining + normalDelta),
      vipHoursRemaining: Math.max(0, prev.vipHoursRemaining + vipDelta)
    }));
  }, []);

  // Wallet operations
  const rechargeWallet = useCallback((amount: number) => {
    setWalletBalance(prev => {
      const nextBal = prev + amount;
      const tx: WalletTransaction = {
        id: 'wt-' + Date.now(),
        customerId: 'cust-andy',
        type: 'RECHARGE',
        amount,
        balanceAfter: nextBal,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        description: `Prepaid wallet top-up (UPI/Card)`
      };
      setWalletTransactions(t => [tx, ...t]);
      return nextBal;
    });
    logAudit('WALLET_RECHARGE', 'Wallet', `+₹${amount}`);
  }, [logAudit]);

  const redeemLoyaltyPoints = useCallback((points: number) => {
    if (loyaltyPoints < points) return { success: false, discountVal: 0 };
    const discountVal = Math.floor(points / 10); // 100 pts = ₹10
    setLoyaltyPoints(p => p - points);
    logAudit('LOYALTY_REDEEM', 'Rewards', `Redeemed ${points} points for ₹${discountVal} off`);
    return { success: true, discountVal };
  }, [loyaltyPoints, logAudit]);

  // Employee Shift & Cash Drawer
  const startShift = useCallback((openingCash: number, employeeName: string) => {
    const shift: EmployeeShift = {
      id: 'shift-' + Date.now(),
      employeeName,
      shiftDate: new Date().toISOString().substring(0, 10),
      startTime: new Date().toTimeString().substring(0, 5),
      openingCash,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      walletSales: 0,
      expenses: 0,
      status: 'OPEN'
    };
    setEmployeeShift(shift);
    logAudit('SHIFT_START', employeeName, `Opened shift with ₹${openingCash} cash in drawer`);
  }, [logAudit]);

  const endShift = useCallback((actualCash: number) => {
    const expected = employeeShift.openingCash + employeeShift.cashSales - employeeShift.expenses;
    const diff = actualCash - expected;
    setEmployeeShift(prev => ({
      ...prev,
      endTime: new Date().toTimeString().substring(0, 5),
      closingCash: actualCash,
      expectedCash: expected,
      difference: diff,
      status: 'CLOSED'
    }));
    logAudit('SHIFT_END', employeeShift.employeeName, `Closed shift. Expected: ₹${expected}, Actual: ₹${actualCash}, Diff: ₹${diff}`);
    return { expectedCash: expected, difference: diff };
  }, [employeeShift, logAudit]);

  // Tournaments
  const createTournament = useCallback((tData: Omit<Tournament, 'id' | 'registeredTeamsCount'>) => {
    const newTourn: Tournament = {
      ...tData,
      id: 'tourn-' + Date.now(),
      registeredTeamsCount: 0
    };
    setTournaments(prev => [newTourn, ...prev]);
    logAudit('TOURNAMENT_CREATE', newTourn.title, `Created tournament: ${newTourn.game}, Entry: ₹${newTourn.entryFeePerTeam}`);
  }, [logAudit]);

  const checkInTournamentTeam = useCallback((teamId: string, stationRange: string) => {
    setTournamentTeams(prev => prev.map(t => t.id === teamId ? { ...t, checkInStatus: 'CHECKED_IN', assignedStationRange: stationRange } : t));
    logAudit('TOURNAMENT_CHECKIN', teamId, `Checked in with assigned stations: ${stationRange}`);
  }, [logAudit]);

  const updateMatchScore = useCallback((matchId: string, scoreA: number, scoreB: number, winner: string) => {
    setTournamentMatches(prev => prev.map(m => m.id === matchId ? { ...m, scoreA, scoreB, winner, status: 'COMPLETED' } : m));
    logAudit('TOURNAMENT_MATCH_UPDATE', matchId, `Score: ${scoreA} - ${scoreB}. Winner: ${winner}`);
  }, [logAudit]);

  // Waitlist
  const joinWaitlist = useCallback((customerName: string, customerPhone: string, service: GamingServiceCategory, preferredTime: string, durationHours: number) => {
    const newEntry: WaitlistEntry = {
      id: 'wl-' + Date.now(),
      customerName,
      customerPhone,
      service,
      preferredTime,
      durationHours,
      queuePosition: waitlist.filter(w => w.service === service && w.status === 'WAITING').length + 1,
      status: 'WAITING',
      joinedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setWaitlist(prev => [...prev, newEntry]);
    logAudit('WAITLIST_JOIN', service, `${customerName} joined waitlist at queue #${newEntry.queuePosition}`);
  }, [waitlist, logAudit]);

  const claimWaitlist = useCallback((id: string) => {
    setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: 'CLAIMED' } : w));
    logAudit('WAITLIST_CLAIM', id, 'Waitlist spot claimed and converted to booking/session');
  }, [logAudit]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <CafeContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalReason,
        setAuthModalReason,
        requireLogin,
        loginUser,
        loginAsAdmin,
        loginAsStaff,
        loginAsCustomer,
        logout,
        registeredAccounts,
        registerUser,
        resetPassword,
        findAccountByEmailOrPhone,
        googleSheetWebhookUrl,
        setGoogleSheetWebhookUrl,
        syncAccountsToGoogleSheet,
        currentRole,
        setCurrentRole: handleSetCurrentRole,
        activeNav,
        setActiveNav,
        mobileMenuOpen,
        setMobileMenuOpen,
        selectedStationForBooking,
        setSelectedStationForBooking,
        selectedGameForBooking,
        setSelectedGameForBooking,
        activeConsoleForGamesModal,
        setActiveConsoleForGamesModal,
        openConsoleGames,
        activeInvoiceForModal,
        setActiveInvoiceForModal,
        quickWalkInModalOpen,
        setQuickWalkInModalOpen,
        heroGames,
        pricingRules,
        priceHistory,
        pricing,
        updatePricing,
        getRateForService,
        systems,
        addSystem,
        updateSystem,
        updateSystemStatus,
        toggleMaintenance,
        activeSessions,
        startWalkInSession,
        extendSession,
        addFoodToSession,
        endSession,
        bookings,
        createBooking,
        createSquadBooking,
        cancelBooking,
        checkInBooking,
        findNextAvailableSlot,
        membershipPlans,
        customerMembership,
        purchaseMembership,
        updateMembershipHours,
        walletBalance,
        walletTransactions,
        rechargeWallet,
        loyaltyPoints,
        redeemLoyaltyPoints,
        fnbProducts,
        updateFnbStock,
        addFnbProduct,
        deleteFnbProduct,
        invoices,
        employeeShift,
        startShift,
        endShift,
        tournaments,
        updateTournament,
        tournamentTeams,
        tournamentMatches,
        createTournament,
        checkInTournamentTeam,
        updateMatchScore,
        employees,
        addEmployee,
        financialSummary,
        waitlist,
        joinWaitlist,
        claimWaitlist,
        auditLogs,
        clearAuditLogs,
        notifications,
        markNotificationAsRead,
        currentTimestamp
      }}
    >
      {children}
    </CafeContext.Provider>
  );
};

export const useCafe = () => {
  const ctx = useContext(CafeContext);
  if (!ctx) throw new Error('useCafe must be used within CafeProvider');
  return ctx;
};
