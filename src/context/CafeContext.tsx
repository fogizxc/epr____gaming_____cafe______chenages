import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Role, AuthUser, GamingServiceCategory, StationStatus, GamingSystem, PricingRule, PriceHistoryEntry,
  ActiveSession, Booking, MembershipPlan, CustomerMembership, Tournament, TournamentTeam, TournamentMatch,
  Invoice, WalletTransaction, FnbProduct, EmployeeShift, WaitlistEntry, AuditLogEntry, HeroGameSlide, RegisteredAccount
} from '../types';

export const INITIAL_REGISTERED_ACCOUNTS: RegisteredAccount[] = [];

export const syncUserToGoogleSheet = async (
  account: RegisteredAccount,
  webhookUrl: string,
  action: 'CREATE_ACCOUNT' | 'UPDATE_PASSWORD' = 'CREATE_ACCOUNT'
) => {
  if (!webhookUrl) return false;
  try {
    await fetch(webhookUrl, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action, timestamp: new Date().toISOString(), id: account.id, name: account.name,
        gamerTag: account.gamerTag, email: account.email, phone: account.phone,
        role: account.role, isWhatsappVerified: account.isWhatsappVerified,
        isEmailVerified: account.isEmailVerified, createdAt: account.createdAt
      })
    });
    return true;
  } catch (err) { console.warn('Google Sheet sync notice:', err); return false; }
};

export const EMPLOYEE_CREDENTIALS = { id: '', password: '', name: '' };
export const ADMIN_CREDENTIALS = { id: '', password: '', name: '' };

import {
  INITIAL_HERO_GAMES, INITIAL_PRICING_RULES, INITIAL_PRICE_HISTORY, INITIAL_SYSTEMS, INITIAL_ACTIVE_SESSIONS,
  INITIAL_MEMBERSHIP_PLANS, INITIAL_CUSTOMER_MEMBERSHIP, INITIAL_TOURNAMENTS, INITIAL_TOURNAMENT_TEAMS,
  INITIAL_TOURNAMENT_MATCHES, INITIAL_FNB_PRODUCTS, INITIAL_BOOKINGS, INITIAL_INVOICES,
  INITIAL_WALLET_TRANSACTIONS, INITIAL_WAITLIST, INITIAL_EMPLOYEE_SHIFT, INITIAL_AUDIT_LOGS
} from '../data/initialData';

interface CafeContextType {
  isLoggedIn: boolean; currentUser: AuthUser | null; isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void; authModalReason: string; setAuthModalReason: (reason: string) => void;
  requireLogin: (onSuccess?: () => void, reason?: string) => boolean;
  loginUser: (params: { role?: Role; idOrUsername: string; password?: string; name?: string }) => { success: boolean; error?: string };
  loginAsAdmin: () => void; loginAsStaff: () => void; loginAsCustomer: () => void; logout: () => void;
  registeredAccounts: RegisteredAccount[];
  registerUser: (params: { name: string; gamerTag?: string; email: string; phone: string; password: string; isWhatsappVerified: boolean; isEmailVerified?: boolean }) => { success: boolean; error?: string; account?: RegisteredAccount };
  resetPassword: (emailOrPhone: string, newPassword: string) => { success: boolean; error?: string };
  findAccountByEmailOrPhone: (emailOrPhone: string) => RegisteredAccount | undefined;
  googleSheetWebhookUrl: string; setGoogleSheetWebhookUrl: (url: string) => void;
  syncAccountsToGoogleSheet: () => Promise<{ success: boolean; message: string; count: number }>;
  currentRole: Role; setCurrentRole: (role: Role) => void; activeNav: string; setActiveNav: (nav: string) => void;
  mobileMenuOpen: boolean; setMobileMenuOpen: (open: boolean) => void;
  selectedStationForBooking: GamingSystem | null; setSelectedStationForBooking: (system: GamingSystem | null) => void;
  selectedGameForBooking: { title: string; category?: GamingServiceCategory; coverUrl?: string } | null;
  setSelectedGameForBooking: (game: { title: string; category?: GamingServiceCategory; coverUrl?: string } | null) => void;
  activeConsoleForGamesModal: { category: GamingServiceCategory; systemId?: string } | null;
  setActiveConsoleForGamesModal: (modal: { category: GamingServiceCategory; systemId?: string } | null) => void;
  openConsoleGames: (category: GamingServiceCategory, systemId?: string) => void;
  activeInvoiceForModal: Invoice | null; setActiveInvoiceForModal: (invoice: Invoice | null) => void;
  quickWalkInModalOpen: boolean; setQuickWalkInModalOpen: (open: boolean) => void;
  heroGames: HeroGameSlide[]; pricingRules: PricingRule[]; priceHistory: PriceHistoryEntry[];
  updatePricing: (service: GamingServiceCategory, newNormal: number, newPeak: number, newWeekend: number, reason: string, isPeakEnabled: boolean, peakDays?: string[], peakHoursStart?: string, peakHoursEnd?: string) => { success: boolean; error?: string };
  getRateForService: (service: GamingServiceCategory) => number; systems: GamingSystem[];
  addSystem: (system: Omit<GamingSystem, 'id' | 'totalUsageHours' | 'totalRevenue' | 'ping' | 'temp'>) => void;
  updateSystem: (id: string, updates: Partial<GamingSystem>) => void; toggleMaintenance: (id: string, reason: string) => void;
  activeSessions: ActiveSession[];
  startWalkInSession: (params: { systemId: string; customerName: string; customerPhone: string; gameTitle?: string; durationHours: number; paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership'; employeeName: string; useMembership?: boolean }) => { success: boolean; error?: string; session?: ActiveSession };
  extendSession: (sessionId: string, extraHours: number) => { success: boolean; error?: string };
  addFoodToSession: (sessionId: string, productId: string, quantity: number) => { success: boolean; error?: string };
  endSession: (sessionId: string) => { success: boolean; invoice?: Invoice; error?: string };
  bookings: Booking[];
  createBooking: (params: { customerName: string; customerPhone: string; systemId: string; date: string; startTime: string; durationHours: number; useMembership?: boolean; gameTitle?: string }) => { success: boolean; error?: string; booking?: Booking };
  createSquadBooking: (params: { customerName: string; customerPhone: string; systemIds: string[]; date: string; startTime: string; durationHours: number }) => { success: boolean; error?: string; bookings?: Booking[] };
  cancelBooking: (bookingId: string) => { success: boolean; error?: string }; checkInBooking: (bookingIdOrQr: string) => { success: boolean; error?: string };
  findNextAvailableSlot: (service: GamingServiceCategory, durationHours: number) => { time: string; systemName: string };
  membershipPlans: MembershipPlan[]; customerMembership: CustomerMembership;
  purchaseMembership: (planId: string) => { success: boolean; error?: string }; updateMembershipHours: (normalDelta: number, vipDelta: number) => void;
  walletBalance: number; walletTransactions: WalletTransaction[]; rechargeWallet: (amount: number) => void;
  loyaltyPoints: number; redeemLoyaltyPoints: (points: number) => { success: boolean; discountVal: number };
  fnbProducts: FnbProduct[]; invoices: Invoice[]; employeeShift: EmployeeShift;
  startShift: (openingCash: number, employeeName: string) => void; endShift: (actualCash: number) => { expectedCash: number; difference: number };
  tournaments: Tournament[]; tournamentTeams: TournamentTeam[]; tournamentMatches: TournamentMatch[];
  createTournament: (tournament: Omit<Tournament, 'id' | 'registeredTeamsCount'>) => void;
  checkInTournamentTeam: (teamId: string, stationRange: string) => void; updateMatchScore: (matchId: string, scoreA: number, scoreB: number, winner: string) => void;
  waitlist: WaitlistEntry[]; joinWaitlist: (customerName: string, customerPhone: string, service: GamingServiceCategory, preferredTime: string, durationHours: number) => void; claimWaitlist: (id: string) => void;
  auditLogs: AuditLogEntry[]; notifications: { id: string; title: string; message: string; time: string; read: boolean; role: Role | 'ALL' }[]; markNotificationAsRead: (id: string) => void;
  financialSummary: { todayRevenue: number; weeklyRevenue: number; monthlyRevenue: number; netProfit: number; expenses: number; fnbRevenue: number; membershipRevenue: number; tournamentRevenue: number; serviceWiseRevenue: Record<string, number> };
  pricing: { rates: Record<GamingServiceCategory, number>; weekendSurgePercent: number; peakSurgePercent: number };
  updateFnbStock: (id: string, delta: number) => void; addFnbProduct: (product: Omit<FnbProduct, 'id'>) => void; deleteFnbProduct: (id: string) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void; updateSystemStatus: (id: string, status: StationStatus) => void;
  employees: { id: string; name: string; role: string; phone: string; shift: string; status: string }[];
  addEmployee: (emp: { name: string; role: string; phone: string; shift: string; status: string }) => void; clearAuditLogs: () => void; currentTimestamp: number;
}

const CafeContext = createContext<CafeContextType | null>(null);
const STORAGE_KEY_PREFIX = 'nexus_gaming_cafe_v1_';
function loadFromStorage<T>(key: string, fallback: T): T { try { const item = localStorage.getItem(STORAGE_KEY_PREFIX + key); return item ? JSON.parse(item) : fallback; } catch { return fallback; } }
function saveToStorage<T>(key: string, value: T) { try { localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value)); } catch {} }

export const CafeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('');
  const [pendingAuthCallback, setPendingAuthCallback] = useState<(() => void) | null>(null);
  const [currentRole, setCurrentRoleState] = useState<Role>('CUSTOMER');

  const handleServerLogin = useCallback(async (idOrUsername: string, password: string) => {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idOrUsername, password }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success || !payload?.accessToken || !payload?.user) throw new Error(payload?.error || 'Unable to authenticate');
    localStorage.setItem(STORAGE_KEY_PREFIX + 'accessToken', payload.accessToken);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'refreshToken', payload.refreshToken || '');
    const user = payload.user as AuthUser;
    setCurrentUser(user); setIsLoggedIn(true); setCurrentRoleState(user.role);
    saveToStorage('currentUser', user); saveToStorage('isLoggedIn', true); saveToStorage('currentRole', user.role);
    setIsAuthModalOpen(false);
    const callback = pendingAuthCallback; setPendingAuthCallback(null); callback?.();
    return user;
  }, [pendingAuthCallback]);

  useEffect(() => {
    const accessToken = localStorage.getItem(STORAGE_KEY_PREFIX + 'accessToken');
    const refreshToken = localStorage.getItem(STORAGE_KEY_PREFIX + 'refreshToken');
    if (!accessToken && !refreshToken) return;
    let cancelled = false;
    (async () => {
      try {
        let token = accessToken;
        let response = token ? await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }) : new Response(null, { status: 401 });
        if (response.status === 401 && refreshToken) {
          const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
          const refreshPayload = await refreshResponse.json().catch(() => ({}));
          if (refreshResponse.ok && refreshPayload?.success && refreshPayload.accessToken) {
            token = refreshPayload.accessToken;
            localStorage.setItem(STORAGE_KEY_PREFIX + 'accessToken', token);
            if (refreshPayload.refreshToken) localStorage.setItem(STORAGE_KEY_PREFIX + 'refreshToken', refreshPayload.refreshToken);
            response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
          }
        }
        const payload = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && payload?.success && payload.user) {
          const user = payload.user as AuthUser;
          setCurrentUser(user); setIsLoggedIn(true); setCurrentRoleState(user.role);
          saveToStorage('currentUser', user); saveToStorage('isLoggedIn', true); saveToStorage('currentRole', user.role);
        } else if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY_PREFIX + 'accessToken'); localStorage.removeItem(STORAGE_KEY_PREFIX + 'refreshToken');
          saveToStorage('currentUser', null); saveToStorage('isLoggedIn', false); saveToStorage('currentRole', 'CUSTOMER');
          setCurrentUser(null); setIsLoggedIn(false); setCurrentRoleState('CUSTOMER');
        }
      } catch {
        if (!cancelled) { setCurrentUser(null); setIsLoggedIn(false); setCurrentRoleState('CUSTOMER'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSetCurrentRole = useCallback((role: Role) => {
    if (!isLoggedIn || !currentUser || currentUser.role !== role) return;
    setCurrentRoleState(role); saveToStorage('currentRole', role);
  }, [isLoggedIn, currentUser]);

  const loginAsAdmin = useCallback(() => { setAuthModalReason('Admin access requires server authentication.'); setIsAuthModalOpen(true); }, []);
  const loginAsStaff = useCallback(() => { setAuthModalReason('Employee access requires server authentication.'); setIsAuthModalOpen(true); }, []);
  const loginAsCustomer = useCallback(() => { setAuthModalReason('Customer access requires server authentication.'); setIsAuthModalOpen(true); }, []);

  const [activeNav, setActiveNav] = useState('gamestore');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedStationForBooking, setSelectedStationForBooking] = useState<GamingSystem | null>(null);
  const [selectedGameForBooking, setSelectedGameForBooking] = useState<{ title: string; category?: GamingServiceCategory; coverUrl?: string } | null>(null);
  const [activeConsoleForGamesModal, setActiveConsoleForGamesModal] = useState<{ category: GamingServiceCategory; systemId?: string } | null>(null);
  const openConsoleGames = (category: GamingServiceCategory, systemId?: string) => setActiveConsoleForGamesModal({ category, systemId });
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<Invoice | null>(null);
  const [quickWalkInModalOpen, setQuickWalkInModalOpen] = useState(false);

  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>(() => loadFromStorage('registeredAccounts', INITIAL_REGISTERED_ACCOUNTS));
  useEffect(() => saveToStorage('registeredAccounts', registeredAccounts), [registeredAccounts]);
  const [googleSheetWebhookUrl, setGoogleSheetWebhookUrlState] = useState<string>(() => loadFromStorage('googleSheetWebhookUrl', ''));
  const setGoogleSheetWebhookUrl = useCallback((url: string) => { setGoogleSheetWebhookUrlState(url); saveToStorage('googleSheetWebhookUrl', url); }, []);

  const requireLogin = useCallback((onSuccess?: () => void, reason?: string) => {
    if (isLoggedIn && currentUser) { onSuccess?.(); return true; }
    setPendingAuthCallback(() => onSuccess); setAuthModalReason(reason || 'Please log in to your Bytes & Brew account to access this game and reserve gaming rigs.'); setIsAuthModalOpen(true); return false;
  }, [isLoggedIn, currentUser]);

  const loginUser = useCallback((params: { role?: Role; idOrUsername: string; password?: string; name?: string }) => {
    if (!params.idOrUsername?.trim() || !params.password) return { success: false, error: 'Please enter your login ID and password.' };
    void handleServerLogin(params.idOrUsername.trim(), params.password).catch((error: any) => {
      setAuthModalReason(error?.message || 'Invalid credentials');
      setIsAuthModalOpen(true);
    });
    return { success: true };
  }, [handleServerLogin]);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(STORAGE_KEY_PREFIX + 'refreshToken');
    if (refreshToken) void fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => {});
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'accessToken'); localStorage.removeItem(STORAGE_KEY_PREFIX + 'refreshToken');
    setIsLoggedIn(false); setCurrentUser(null); setCurrentRoleState('CUSTOMER');
    saveToStorage('isLoggedIn', false); saveToStorage('currentUser', null); saveToStorage('currentRole', 'CUSTOMER'); setPendingAuthCallback(null);
  }, []);

  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  useEffect(() => { const interval = setInterval(() => setCurrentTimestamp(Date.now()), 1000); return () => clearInterval(interval); }, []);
  useEffect(() => { if (!isLoggedIn || !currentUser) setCurrentRoleState('CUSTOMER'); }, [isLoggedIn, currentUser]);

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
  const [walletBalance, setWalletBalance] = useState(() => loadFromStorage('walletBalance', 1850));
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => loadFromStorage('walletTransactions', INITIAL_WALLET_TRANSACTIONS));
  const [loyaltyPoints, setLoyaltyPoints] = useState(() => loadFromStorage('loyaltyPoints', 450));
  const [employeeShift, setEmployeeShift] = useState<EmployeeShift>(() => loadFromStorage('employeeShift', INITIAL_EMPLOYEE_SHIFT));
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => loadFromStorage('waitlist', INITIAL_WAITLIST));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadFromStorage('auditLogs', INITIAL_AUDIT_LOGS));
  const [employees, setEmployees] = useState(() => loadFromStorage('employees', [
    { id: 'emp-01', name: 'Rahul Sharma', role: 'Floor Manager', phone: '+91 98765 43210', shift: 'Morning (09:00 - 17:00)', status: 'On Duty' },
    { id: 'emp-02', name: 'Vikram Singh', role: 'Hardware Systems Tech', phone: '+91 98234 56789', shift: 'Evening (16:00 - 00:00)', status: 'On Duty' },
    { id: 'emp-03', name: 'Priya Patel', role: 'Barista & F&B Lead', phone: '+91 98111 22334', shift: 'Night (20:00 - 04:00)', status: 'Scheduled' }
  ]));
  useEffect(() => saveToStorage('employees', employees), [employees]);

  const findAccountByEmailOrPhone = useCallback((emailOrPhone: string) => {
    const clean = emailOrPhone.trim().toLowerCase(); const cleanDigits = clean.replace(/[\s+-]/g, '');
    return registeredAccounts.find(a => a.email.toLowerCase() === clean || a.phone.replace(/[\s+-]/g, '') === cleanDigits || a.gamerTag.toLowerCase() === clean);
  }, [registeredAccounts]);
  const registerUser = useCallback((_params: { name: string; gamerTag?: string; email: string; phone: string; password: string; isWhatsappVerified: boolean; isEmailVerified?: boolean }) => ({ success: false, error: 'Account creation is handled by the production authentication service.' }), []);
  const resetPassword = useCallback((_emailOrPhone: string, _newPassword: string) => ({ success: false, error: 'Password reset is handled by the production authentication service.' }), []);
  const syncAccountsToGoogleSheet = useCallback(async () => ({ success: false, message: 'Password/account synchronization is disabled. Google Sheets must not be used as an authentication store.', count: 0 }), []);

  const [notifications, setNotifications] = useState([
    { id: 'notif-1', title: 'Active Session Reminder', message: 'PC-01 has less than 90 minutes remaining.', time: 'Just now', read: false, role: 'ALL' as const },
    { id: 'notif-2', title: 'Valorant Tournament Registration', message: '12 out of 16 slots booked for Saturday Champions Night.', time: '1 hour ago', read: false, role: 'ALL' as const }
  ]);
  useEffect(() => saveToStorage('pricingRules', pricingRules), [pricingRules]); useEffect(() => saveToStorage('priceHistory', priceHistory), [priceHistory]); useEffect(() => saveToStorage('systems', systems), [systems]);
  useEffect(() => saveToStorage('activeSessions', activeSessions), [activeSessions]); useEffect(() => saveToStorage('bookings', bookings), [bookings]);
  useEffect(() => saveToStorage('customerMembership', customerMembership), [customerMembership]); useEffect(() => saveToStorage('tournaments', tournaments), [tournaments]);
  useEffect(() => saveToStorage('tournamentTeams', tournamentTeams), [tournamentTeams]); useEffect(() => saveToStorage('tournamentMatches', tournamentMatches), [tournamentMatches]);
  useEffect(() => saveToStorage('fnbProducts', fnbProducts), [fnbProducts]); useEffect(() => saveToStorage('invoices', invoices), [invoices]);
  useEffect(() => saveToStorage('walletBalance', walletBalance), [walletBalance]); useEffect(() => saveToStorage('walletTransactions', walletTransactions), [walletTransactions]);
  useEffect(() => saveToStorage('loyaltyPoints', loyaltyPoints), [loyaltyPoints]); useEffect(() => saveToStorage('employeeShift', employeeShift), [employeeShift]);
  useEffect(() => saveToStorage('waitlist', waitlist), [waitlist]); useEffect(() => saveToStorage('auditLogs', auditLogs), [auditLogs]);

  const logAudit = useCallback((action: string, entity: string, newValue: string, previousValue?: string) => { const newEntry: AuditLogEntry = { id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000), user: currentRole === 'ADMIN' ? 'Admin' : currentRole === 'EMPLOYEE' ? 'Staff (Counter)' : 'Customer', role: currentRole, action, entity, previousValue, newValue, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) }; setAuditLogs(prev => [newEntry, ...prev.slice(0, 99)]); }, [currentRole]);
  const getRateForService = useCallback((service: GamingServiceCategory) => { const rule = pricingRules.find(r => r.service === service) || (service === 'PlayStation' ? pricingRules.find(r => r.service === 'PS5') : service === 'PS5' ? pricingRules.find(r => r.service === 'PlayStation') : undefined); if (!rule) return 199; const now = new Date(); const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }); const isWeekend = dayName === 'Saturday' || dayName === 'Sunday'; if (rule.isPeakEnabled) { if (isWeekend) return rule.weekendPrice; const currentHours = now.getHours() + now.getMinutes() / 60; const [sh, sm] = rule.peakHoursStart.split(':').map(Number); const [eh, em] = rule.peakHoursEnd.split(':').map(Number); if (currentHours >= sh + sm / 60 && currentHours <= eh + em / 60) return rule.peakPrice; } return rule.normalPrice; }, [pricingRules]);
  const updatePricing = useCallback((serviceOrConfig: any, newNormal?: number, newPeak?: number, newWeekend?: number, reason = 'Admin Tariff Adjustment', isPeakEnabled = true, peakDays = ['Friday', 'Saturday', 'Sunday'], peakHoursStart = '18:00', peakHoursEnd = '23:00') => { if (typeof serviceOrConfig === 'object' && serviceOrConfig !== null && 'rates' in serviceOrConfig) { const config = serviceOrConfig as { rates: Record<GamingServiceCategory, number>; weekendSurgePercent?: number; peakSurgePercent?: number }; const weekendPct = config.weekendSurgePercent ?? 20; const peakPct = config.peakSurgePercent ?? 25; setSystems(prev => prev.map(sys => { const newRate = config.rates[sys.category]; return newRate ? { ...sys, hourlyRate: newRate } : sys; })); setPricingRules(prev => prev.map(rule => { const newRate = config.rates[rule.service]; return newRate ? { ...rule, normalPrice: newRate, peakPrice: Math.round(newRate * (1 + peakPct / 100)), weekendPrice: Math.round(newRate * (1 + weekendPct / 100)), updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : rule; })); logAudit('PRICE_UPDATE_BULK', 'All Services', `Updated tariffs across all rigs. Weekend +${weekendPct}%, Peak +${peakPct}%`); return { success: true }; } const service = serviceOrConfig as GamingServiceCategory; if (!newNormal || newNormal <= 0 || !newPeak || newPeak <= 0 || !newWeekend || newWeekend <= 0) return { success: false, error: 'Price must be greater than zero.' }; if (!reason || reason.trim().length < 3) return { success: false, error: 'Please enter a valid reason for the price update.' }; const currentRule = pricingRules.find(r => r.service === service); const prevPrice = currentRule ? currentRule.normalPrice : 0; const updatedRules = pricingRules.map(r => r.service === service ? { ...r, normalPrice: newNormal, peakPrice: newPeak, weekendPrice: newWeekend, isPeakEnabled, peakDays, peakHoursStart, peakHoursEnd, lastUpdatedBy: 'Admin', updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : r); setSystems(prev => prev.map(sys => sys.category === service ? { ...sys, hourlyRate: newNormal } : sys)); const historyEntry: PriceHistoryEntry = { id: 'ph-' + Date.now(), service, previousPrice: prevPrice, newPrice: newNormal, adminName: 'Admin', date: new Date().toISOString().substring(0, 10), time: new Date().toTimeString().substring(0, 5), reason }; setPricingRules(updatedRules); setPriceHistory(prev => [historyEntry, ...prev]); logAudit('PRICE_UPDATE', service, `₹${newNormal}/hr (Peak: ₹${newPeak})`, `₹${prevPrice}/hr`); return { success: true }; }, [pricingRules, logAudit]);
  const pricing = useMemo(() => { const ratesMap: Record<GamingServiceCategory, number> = { PS5: 199, Xbox: 199, PS4: 149, 'Gaming PC': 249, 'VIP Room': 499, VR: 299, 'Pool Table': 199, 'Sim Racing': 349, PlayStation: 199 }; pricingRules.forEach(r => { ratesMap[r.service] = r.normalPrice; }); return { rates: ratesMap, weekendSurgePercent: 20, peakSurgePercent: 25 }; }, [pricingRules]);
  const financialSummary = useMemo(() => { let totalInv = 0, todayInv = 0, fnbSum = 0; const serviceWise: Record<string, number> = { 'Gaming PC': 42800, PlayStation: 34500, Xbox: 18900, 'VIP Room': 28400, VR: 16200, 'Sim Racing': 21300, 'Pool Table': 9800 }; const todayStr = new Date().toISOString().substring(0, 10); invoices.forEach(inv => { totalInv += inv.totalAmount; if (inv.createdAt && inv.createdAt.startsWith(todayStr)) todayInv += inv.totalAmount; if (inv.serviceCategory && serviceWise[inv.serviceCategory] !== undefined) serviceWise[inv.serviceCategory] += inv.totalAmount; if (inv.items) inv.items.forEach(item => { if (item.name && ['bull','drink','snack','coffee'].some(x => item.name.toLowerCase().includes(x))) fnbSum += item.price * item.quantity; }); }); activeSessions.forEach(sess => { todayInv += sess.totalAmount; if (sess.foodTotal) fnbSum += sess.foodTotal; }); const baseMonthly = 171900 + totalInv, baseToday = 14280 + todayInv, baseWeekly = 68450 + todayInv, opex = 42500; return { todayRevenue: baseToday, weeklyRevenue: baseWeekly, monthlyRevenue: baseMonthly, fnbRevenue: 24800 + fnbSum, membershipRevenue: 38500, tournamentRevenue: 19600, expenses: opex, netProfit: baseMonthly - opex, serviceWiseRevenue: serviceWise }; }, [invoices, activeSessions]);
  const updateFnbStock = useCallback((id: string, delta: number) => { setFnbProducts(prev => prev.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)); logAudit('FNB_RESTOCK', id, `Adjusted inventory stock by ${delta > 0 ? '+' : ''}${delta}`); }, [logAudit]);
  const addFnbProduct = useCallback((product: Omit<FnbProduct, 'id'>) => { const newId = 'fnb-' + Date.now(); setFnbProducts(prev => [...prev, { ...product, id: newId }]); logAudit('FNB_ADD', product.name, `Added item ${product.name} @ ₹${product.price}`); }, [logAudit]);
  const deleteFnbProduct = useCallback((id: string) => { setFnbProducts(prev => { const prod = prev.find(p => p.id === id); if (prod) logAudit('FNB_DELETE', prod.name, `Removed item ${prod.name}`); return prev.filter(p => p.id !== id); }); }, [logAudit]);
  const addEmployee = useCallback((emp: { name: string; role: string; phone: string; shift: string; status: string }) => { const newEmp = { ...emp, id: 'emp-' + Date.now() }; setEmployees(prev => [...prev, newEmp]); logAudit('EMPLOYEE_ADD', emp.name, `Added staff member ${emp.name} (${emp.role})`); }, [logAudit]);
  const clearAuditLogs = useCallback(() => setAuditLogs([]), []);
  const updateTournament = useCallback((id: string, updates: Partial<Tournament>) => { setTournaments(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); logAudit('TOURNAMENT_UPDATE', id, 'Updated tournament details'); }, [logAudit]);
  const updateSystemStatus = useCallback((id: string, status: StationStatus) => { setSystems(prev => prev.map(s => s.id === id ? { ...s, status } : s)); logAudit('SYSTEM_STATUS_CHANGE', id, `Status updated to ${status}`); }, [logAudit]);
  const addSystem = useCallback((systemData: Omit<GamingSystem, 'id' | 'totalUsageHours' | 'totalRevenue' | 'ping' | 'temp'>) => { const prefix = systemData.category === 'Gaming PC' ? 'pc-' : systemData.category === 'PS5' || systemData.category === 'PlayStation' ? 'ps5-' : systemData.category === 'PS4' ? 'ps4-' : systemData.category === 'Xbox' ? 'xbox-' : systemData.category === 'VIP Room' ? 'vip-' : systemData.category === 'VR' ? 'vr-' : systemData.category === 'Pool Table' ? 'pool-' : systemData.category === 'Sim Racing' ? 'sim-' : 'sys-'; const newSystem: GamingSystem = { ...systemData, id: prefix + (Date.now() % 1000), totalUsageHours: 0, totalRevenue: 0, ping: Math.floor(Math.random() * 10) + 5, temp: Math.floor(Math.random() * 10) + 40 }; setSystems(prev => [...prev, newSystem]); logAudit('SYSTEM_ADD', newSystem.name, `Added new station ${newSystem.name} in ${newSystem.category}`); }, [logAudit]);
  const updateSystem = useCallback((id: string, updates: Partial<GamingSystem>) => setSystems(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s)), []);
  const toggleMaintenance = useCallback((id: string, reason: string) => { setSystems(prev => prev.map(s => { if (s.id !== id) return s; const nextStatus: StationStatus = s.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'; logAudit('SYSTEM_STATUS_CHANGE', s.name, nextStatus, s.status); return { ...s, status: nextStatus }; })); }, [logAudit]);
  const startWalkInSession = useCallback(({ systemId, customerName, customerPhone, gameTitle, durationHours, paymentMethod, employeeName, useMembership = false }: { systemId: string; customerName: string; customerPhone: string; gameTitle?: string; durationHours: number; paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership'; employeeName: string; useMembership?: boolean }) => { const system = systems.find(s => s.id === systemId); if (!system) return { success: false, error: 'System not found.' }; if (system.status !== 'AVAILABLE') return { success: false, error: `Station ${system.name} is currently ${system.status}.` }; const rate = getRateForService(system.category); let membershipUsedHours = 0, vipMembershipUsedHours = 0, finalAmount = durationHours * rate; const isCustomerMember = customerMembership && customerMembership.status === 'ACTIVE' && (useMembership || (customerName && customerMembership.customerName.toLowerCase().trim() === customerName.toLowerCase().trim()) || customerName?.toLowerCase().includes('andy') || paymentMethod === 'Membership'); if (isCustomerMember) { if (system.category === 'VIP Room') { vipMembershipUsedHours = Math.min(customerMembership.vipHoursRemaining, durationHours); finalAmount = (durationHours - vipMembershipUsedHours) * rate; } else { membershipUsedHours = Math.min(customerMembership.normalHoursRemaining, durationHours); finalAmount = (durationHours - membershipUsedHours) * rate; } if (membershipUsedHours > 0 || vipMembershipUsedHours > 0) setCustomerMembership(prev => ({ ...prev, normalHoursUsed: prev.normalHoursUsed + membershipUsedHours, normalHoursRemaining: Math.max(0, prev.normalHoursRemaining - membershipUsedHours), vipHoursUsed: prev.vipHoursUsed + vipMembershipUsedHours, vipHoursRemaining: Math.max(0, prev.vipHoursRemaining - vipMembershipUsedHours) })); } const startTime = Date.now(), endTime = startTime + durationHours * 3600000, sessionId = 'sess-' + Date.now(); const newSession: ActiveSession = { id: sessionId, systemId: system.id, systemName: system.name, customerId: 'cust-' + customerName.toLowerCase().replace(/\s+/g, '-'), customerName, customerPhone, gameTitle: gameTitle || (system.installedGames?.[0] ?? 'Arena Gaming'), startTime, endTime, durationHours, ratePerHour: rate, membershipUsedHours, vipMembershipUsedHours, foodItems: [], foodTotal: 0, totalAmount: finalAmount, paymentStatus: 'PAID', paymentMethod, employeeName, status: 'ACTIVE' }; setActiveSessions(prev => [...prev, newSession]); setSystems(prev => prev.map(s => s.id === systemId ? { ...s, status: 'ACTIVE', activeSessionId: sessionId, currentCustomerName: customerName, currentCustomerPhone: customerPhone, sessionEndTime: endTime } : s)); if (paymentMethod === 'Cash') setEmployeeShift(prev => ({ ...prev, cashSales: prev.cashSales + finalAmount })); else if (paymentMethod === 'UPI') setEmployeeShift(prev => ({ ...prev, upiSales: prev.upiSales + finalAmount })); logAudit('SESSION_START', system.name, `Started for ${customerName} (${durationHours}h, ₹${finalAmount})`); return { success: true, session: newSession }; }, [systems, getRateForService, customerMembership, logAudit]);
  const extendSession = useCallback((sessionId: string, extraHours: number) => { const session = activeSessions.find(s => s.id === sessionId); if (!session) return { success: false, error: 'Session not found.' }; const newEndTime = session.endTime + extraHours * 3600000; const hasConflict = bookings.some(b => b.systemId === session.systemId && b.bookingStatus === 'UPCOMING' && new Date(`${b.date}T${b.startTime}:00`).getTime() < newEndTime); if (hasConflict) return { success: false, error: `Cannot extend: Station ${session.systemName} has an upcoming reservation scheduled.` }; const additionalCost = extraHours * session.ratePerHour; setActiveSessions(prev => prev.map(s => s.id === sessionId ? { ...s, endTime: newEndTime, durationHours: s.durationHours + extraHours, totalAmount: s.totalAmount + additionalCost, status: 'EXTENDED' } : s)); setSystems(prev => prev.map(sys => sys.id === session.systemId ? { ...sys, sessionEndTime: newEndTime } : sys)); logAudit('SESSION_EXTEND', session.systemName, `Extended by ${extraHours}h (+₹${additionalCost})`); return { success: true }; }, [activeSessions, bookings, logAudit]);
  const addFoodToSession = useCallback((sessionId: string, productId: string, quantity: number) => { const session = activeSessions.find(s => s.id === sessionId), product = fnbProducts.find(p => p.id === productId); if (!session || !product) return { success: false, error: 'Session or product not found.' }; const itemCost = product.price * quantity; setActiveSessions(prev => prev.map(s => { if (s.id !== sessionId) return s; const existingIdx = s.foodItems.findIndex(f => f.id === productId); const updatedFoods = [...s.foodItems]; if (existingIdx >= 0) updatedFoods[existingIdx].quantity += quantity; else updatedFoods.push({ id: product.id, name: product.name, price: product.price, quantity }); return { ...s, foodItems: updatedFoods, foodTotal: s.foodTotal + itemCost, totalAmount: s.totalAmount + itemCost }; })); logAudit('SESSION_FNB_ADD', session.systemName, `Added ${quantity}x ${product.name} (₹${itemCost})`); return { success: true }; }, [activeSessions, fnbProducts, logAudit]);
  const endSession = useCallback((sessionId: string) => { const session = activeSessions.find(s => s.id === sessionId); if (!session) return { success: false, error: 'Active session not found.' }; const system = systems.find(s => s.id === session.systemId); const invoiceNum = 'NEX-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000); const now = new Date(), dateStr = now.toISOString().substring(0, 10), timeStr = now.toTimeString().substring(0, 5), subtotal = session.totalAmount, gstTax = Math.round(subtotal * 0.05), total = subtotal + gstTax; const invoice: Invoice = { id: 'inv-' + Date.now(), invoiceNumber: invoiceNum, date: dateStr, time: timeStr, customerName: session.customerName, customerContact: session.customerPhone, bookingId: session.id, systemName: session.systemName, service: system ? system.category : 'Gaming Station', gameTitle: session.gameTitle || (system?.installedGames?.[0] ?? 'Arena Gaming'), startTime: new Date(session.startTime).toTimeString().substring(0, 5), endTime: timeStr, durationHours: session.durationHours, ratePerHour: session.ratePerHour, membershipHoursUsed: session.membershipUsedHours + session.vipMembershipUsedHours, foodItems: session.foodItems, discount: 0, subtotal, gstTax, total, paymentMethod: session.paymentMethod, paymentStatus: 'PAID', employeeName: session.employeeName }; setInvoices(prev => [invoice, ...prev]); setSystems(prev => prev.map(s => s.id === session.systemId ? { ...s, status: 'AVAILABLE', activeSessionId: undefined, currentCustomerName: undefined, currentCustomerPhone: undefined, sessionEndTime: undefined, totalUsageHours: s.totalUsageHours + session.durationHours, totalRevenue: s.totalRevenue + total } : s)); setActiveSessions(prev => prev.filter(s => s.id !== sessionId)); setLoyaltyPoints(p => p + Math.floor(total / 10)); logAudit('SESSION_END', session.systemName, `Completed session for ${session.customerName}. Bill generated: ₹${total}`); return { success: true, invoice }; }, [activeSessions, systems, logAudit]);
  const createBooking = useCallback(({ customerName, customerPhone, systemId, date, startTime, durationHours, useMembership = false, gameTitle }: { customerName: string; customerPhone: string; systemId: string; date: string; startTime: string; durationHours: number; useMembership?: boolean; gameTitle?: string }) => { const system = systems.find(s => s.id === systemId); if (!system) return { success: false, error: 'Selected gaming station not found.' }; const [sh, sm] = startTime.split(':').map(Number), startMins = sh * 60 + sm, endMins = startMins + durationHours * 60, endTime = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`; const hasOverlap = bookings.some(b => b.systemId === systemId && b.date === date && b.bookingStatus === 'UPCOMING' && startMins < ((+b.endTime.split(':')[0]) * 60 + (+b.endTime.split(':')[1])) && endMins > ((+b.startTime.split(':')[0]) * 60 + (+b.startTime.split(':')[1]))); if (hasOverlap) return { success: false, error: `Conflict: Station ${system.name} is already booked during this time window. Please select another slot or station.` }; const rate = getRateForService(system.category); let membershipUsedHours = 0, vipMembershipUsedHours = 0, finalAmount = durationHours * rate; const isCustomerMember = customerMembership && customerMembership.status === 'ACTIVE' && (useMembership || (customerName && customerMembership.customerName.toLowerCase().trim() === customerName.toLowerCase().trim()) || customerName?.toLowerCase().includes('andy')); if (isCustomerMember) { if (system.category === 'VIP Room') { vipMembershipUsedHours = Math.min(customerMembership.vipHoursRemaining, durationHours); finalAmount = Math.max(0, durationHours - vipMembershipUsedHours) * rate; } else { membershipUsedHours = Math.min(customerMembership.normalHoursRemaining, durationHours); finalAmount = Math.max(0, durationHours - membershipUsedHours) * rate; } if (membershipUsedHours > 0 || vipMembershipUsedHours > 0) setCustomerMembership(prev => ({ ...prev, normalHoursUsed: prev.normalHoursUsed + membershipUsedHours, normalHoursRemaining: Math.max(0, prev.normalHoursRemaining - membershipUsedHours), vipHoursUsed: prev.vipHoursUsed + vipMembershipUsedHours, vipHoursRemaining: Math.max(0, prev.vipHoursRemaining - vipMembershipUsedHours) })); } const bookingId = 'bk-' + Date.now().toString().slice(-6); const newBooking: Booking = { id: bookingId, customerId: 'cust-' + customerName.toLowerCase().replace(/\s+/g, '-'), customerName, customerPhone, systemId: system.id, systemName: system.name, service: system.category, date, startTime, endTime, durationHours, applicableRate: rate, membershipUsedHours, vipMembershipUsedHours, discount: 0, foodTotal: 0, finalAmount, paymentStatus: 'PAID', bookingStatus: 'UPCOMING', qrCode: `NEXUS-${bookingId.toUpperCase()}-${customerName.slice(0, 3).toUpperCase()}`, createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16), gameTitle }; setBookings(prev => [newBooking, ...prev]); logAudit('BOOKING_CREATE', system.name, `New booking ${bookingId} on ${date} at ${startTime} (${durationHours}h)`); return { success: true, booking: newBooking }; }, [systems, bookings, getRateForService, customerMembership, logAudit]);
  const createSquadBooking = useCallback(({ customerName, customerPhone, systemIds, date, startTime, durationHours }: { customerName: string; customerPhone: string; systemIds: string[]; date: string; startTime: string; durationHours: number }) => { for (const sysId of systemIds) if (bookings.some(b => b.systemId === sysId && b.date === date && b.bookingStatus === 'UPCOMING')) return { success: false, error: 'One or more requested squad stations are already booked. Squad booking cancelled atomically.' }; const createdList: Booking[] = []; systemIds.forEach((sysId, idx) => { const res = createBooking({ customerName: `${customerName} (Player ${idx + 1})`, customerPhone, systemId: sysId, date, startTime, durationHours }); if (res.booking) createdList.push(res.booking); }); return { success: true, bookings: createdList }; }, [bookings, createBooking]);
  const cancelBooking = useCallback((bookingId: string) => { setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, bookingStatus: 'CANCELLED' } : b)); logAudit('BOOKING_CANCEL', bookingId, 'Cancelled by user/staff'); return { success: true }; }, [logAudit]);
  const checkInBooking = useCallback((bookingIdOrQr: string) => { const booking = bookings.find(b => b.id === bookingIdOrQr || b.qrCode === bookingIdOrQr); if (!booking) return { success: false, error: 'Booking code not found.' }; if (booking.bookingStatus !== 'UPCOMING') return { success: false, error: `Booking is already ${booking.bookingStatus}.` }; const startRes = startWalkInSession({ systemId: booking.systemId, customerName: booking.customerName, customerPhone: booking.customerPhone, durationHours: booking.durationHours, paymentMethod: 'UPI', employeeName: 'QR Check-in', useMembership: false }); if (!startRes.success) return { success: false, error: startRes.error }; setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, bookingStatus: 'ACTIVE' } : b)); logAudit('BOOKING_CHECKIN', booking.systemName, `Checked in booking ${booking.id} (${booking.customerName})`); return { success: true }; }, [bookings, startWalkInSession, logAudit]);
  const findNextAvailableSlot = useCallback((service: GamingServiceCategory, durationHours: number) => { const matchingSystems = systems.filter(s => s.category === service && s.status !== 'MAINTENANCE' && s.status !== 'OFFLINE'); if (!matchingSystems.length) return { time: 'Tomorrow 10:00 AM', systemName: 'All in Maintenance' }; const freeSystem = matchingSystems.find(s => s.status === 'AVAILABLE'); if (freeSystem) { const now = new Date(); now.setMinutes(now.getMinutes() + 5); return { time: `Today ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} (Immediate)`, systemName: freeSystem.name }; } let earliest = Infinity, bestSystemName = matchingSystems[0].name; matchingSystems.forEach(sys => { if (sys.sessionEndTime && sys.sessionEndTime < earliest) { earliest = sys.sessionEndTime; bestSystemName = sys.name; } }); if (earliest === Infinity) return { time: 'Today 19:00', systemName: matchingSystems[0].name }; const target = new Date(earliest + 600000); return { time: `Today ${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`, systemName: bestSystemName }; }, [systems]);
  const purchaseMembership = useCallback((planId: string) => { const plan = membershipPlans.find(p => p.id === planId); if (!plan) return { success: false, error: 'Plan not found.' }; const newMembership: CustomerMembership = { id: 'cm-' + Date.now(), customerId: 'cust-andy', customerName: 'Andy Patel', planName: plan.name, pricePaid: plan.price, purchaseDate: new Date().toISOString().substring(0, 10), expiryDate: new Date(Date.now() + plan.durationMonths * 30 * 24 * 3600000).toISOString().substring(0, 10), normalHoursAllocated: plan.normalHours, normalHoursUsed: 0, normalHoursRemaining: plan.normalHours, vipHoursAllocated: plan.vipHours, vipHoursUsed: 0, vipHoursRemaining: plan.vipHours, status: 'ACTIVE' }; setCustomerMembership(newMembership); logAudit('MEMBERSHIP_PURCHASE', plan.name, `Purchased by Andy Patel for ₹${plan.price}`); return { success: true }; }, [membershipPlans, logAudit]);
  const updateMembershipHours = useCallback((normalDelta: number, vipDelta: number) => setCustomerMembership(prev => ({ ...prev, normalHoursRemaining: Math.max(0, prev.normalHoursRemaining + normalDelta), vipHoursRemaining: Math.max(0, prev.vipHoursRemaining + vipDelta) })), []);
  const rechargeWallet = useCallback((amount: number) => { setWalletBalance(prev => { const nextBal = prev + amount; const tx: WalletTransaction = { id: 'wt-' + Date.now(), customerId: 'cust-andy', type: 'RECHARGE', amount, balanceAfter: nextBal, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), description: 'Prepaid wallet top-up (UPI/Card)' }; setWalletTransactions(t => [tx, ...t]); return nextBal; }); logAudit('WALLET_RECHARGE', 'Wallet', `+₹${amount}`); }, [logAudit]);
  const redeemLoyaltyPoints = useCallback((points: number) => { if (loyaltyPoints < points) return { success: false, discountVal: 0 }; const discountVal = Math.floor(points / 10); setLoyaltyPoints(p => p - points); logAudit('LOYALTY_REDEEM', 'Rewards', `Redeemed ${points} points for ₹${discountVal} off`); return { success: true, discountVal }; }, [loyaltyPoints, logAudit]);
  const startShift = useCallback((openingCash: number, employeeName: string) => { const shift: EmployeeShift = { id: 'shift-' + Date.now(), employeeName, shiftDate: new Date().toISOString().substring(0, 10), startTime: new Date().toTimeString().substring(0, 5), openingCash, cashSales: 0, upiSales: 0, cardSales: 0, walletSales: 0, expenses: 0, status: 'OPEN' }; setEmployeeShift(shift); logAudit('SHIFT_START', employeeName, `Opened shift with ₹${openingCash} cash in drawer`); }, [logAudit]);
  const endShift = useCallback((actualCash: number) => { const expected = employeeShift.openingCash + employeeShift.cashSales - employeeShift.expenses, diff = actualCash - expected; setEmployeeShift(prev => ({ ...prev, endTime: new Date().toTimeString().substring(0, 5), closingCash: actualCash, expectedCash: expected, difference: diff, status: 'CLOSED' })); logAudit('SHIFT_END', employeeShift.employeeName, `Closed shift. Expected: ₹${expected}, Actual: ₹${actualCash}, Diff: ₹${diff}`); return { expectedCash: expected, difference: diff }; }, [employeeShift, logAudit]);
  const createTournament = useCallback((tData: Omit<Tournament, 'id' | 'registeredTeamsCount'>) => { const newTourn: Tournament = { ...tData, id: 'tourn-' + Date.now(), registeredTeamsCount: 0 }; setTournaments(prev => [newTourn, ...prev]); logAudit('TOURNAMENT_CREATE', newTourn.title, `Created tournament: ${newTourn.game}, Entry: ₹${newTourn.entryFeePerTeam}`); }, [logAudit]);
  const checkInTournamentTeam = useCallback((teamId: string, stationRange: string) => { setTournamentTeams(prev => prev.map(t => t.id === teamId ? { ...t, checkInStatus: 'CHECKED_IN', assignedStationRange: stationRange } : t)); logAudit('TOURNAMENT_CHECKIN', teamId, `Checked in with assigned stations: ${stationRange}`); }, [logAudit]);
  const updateMatchScore = useCallback((matchId: string, scoreA: number, scoreB: number, winner: string) => { setTournamentMatches(prev => prev.map(m => m.id === matchId ? { ...m, scoreA, scoreB, winner, status: 'COMPLETED' } : m)); logAudit('TOURNAMENT_MATCH_UPDATE', matchId, `Score: ${scoreA} - ${scoreB}. Winner: ${winner}`); }, [logAudit]);
  const joinWaitlist = useCallback((customerName: string, customerPhone: string, service: GamingServiceCategory, preferredTime: string, durationHours: number) => { const newEntry: WaitlistEntry = { id: 'wl-' + Date.now(), customerName, customerPhone, service, preferredTime, durationHours, queuePosition: waitlist.filter(w => w.service === service && w.status === 'WAITING').length + 1, status: 'WAITING', joinedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }; setWaitlist(prev => [...prev, newEntry]); logAudit('WAITLIST_JOIN', service, `${customerName} joined waitlist at queue #${newEntry.queuePosition}`); }, [waitlist, logAudit]);
  const claimWaitlist = useCallback((id: string) => { setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: 'CLAIMED' } : w)); logAudit('WAITLIST_CLAIM', id, 'Waitlist spot claimed and converted to booking/session'); }, [logAudit]);
  const markNotificationAsRead = useCallback((id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), []);

  return <CafeContext.Provider value={{
    isLoggedIn, currentUser, isAuthModalOpen, setIsAuthModalOpen, authModalReason, setAuthModalReason, requireLogin, loginUser, loginAsAdmin, loginAsStaff, loginAsCustomer, logout,
    registeredAccounts, registerUser, resetPassword, findAccountByEmailOrPhone, googleSheetWebhookUrl, setGoogleSheetWebhookUrl, syncAccountsToGoogleSheet,
    currentRole, setCurrentRole: handleSetCurrentRole, activeNav, setActiveNav, mobileMenuOpen, setMobileMenuOpen, selectedStationForBooking, setSelectedStationForBooking,
    selectedGameForBooking, setSelectedGameForBooking, activeConsoleForGamesModal, setActiveConsoleForGamesModal, openConsoleGames, activeInvoiceForModal, setActiveInvoiceForModal,
    quickWalkInModalOpen, setQuickWalkInModalOpen, heroGames, pricingRules, priceHistory, pricing, updatePricing, getRateForService, systems, addSystem, updateSystem, updateSystemStatus,
    toggleMaintenance, activeSessions, startWalkInSession, extendSession, addFoodToSession, endSession, bookings, createBooking, createSquadBooking, cancelBooking, checkInBooking,
    findNextAvailableSlot, membershipPlans, customerMembership, purchaseMembership, updateMembershipHours, walletBalance, walletTransactions, rechargeWallet, loyaltyPoints,
    redeemLoyaltyPoints, fnbProducts, updateFnbStock, addFnbProduct, deleteFnbProduct, invoices, employeeShift, startShift, endShift, tournaments, updateTournament,
    tournamentTeams, tournamentMatches, createTournament, checkInTournamentTeam, updateMatchScore, employees, addEmployee, financialSummary, waitlist, joinWaitlist,
    claimWaitlist, auditLogs, clearAuditLogs, notifications, markNotificationAsRead, currentTimestamp
  }}>{children}</CafeContext.Provider>;
};
export const useCafe = () => { const ctx = useContext(CafeContext); if (!ctx) throw new Error('useCafe must be used within CafeProvider'); return ctx; };
