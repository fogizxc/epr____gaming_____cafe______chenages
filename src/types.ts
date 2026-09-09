export type Role = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  name: string;
  emailOrPhone?: string;
  role: Role;
  avatar?: string;
  gamerTag?: string;
}

export interface RegisteredAccount {
  id: string;
  name: string;
  gamerTag: string;
  email: string;
  phone: string;
  password: string; // Saved in database and synced to Google Sheets as requested
  role: Role;
  createdAt: string;
  isWhatsappVerified: boolean;
  isEmailVerified: boolean;
  avatar?: string;
  syncedToGoogleSheet?: boolean;
}

export type GamingServiceCategory =
  | 'PS5'
  | 'Xbox'
  | 'PS4'
  | 'Gaming PC'
  | 'VIP Room'
  | 'VR'
  | 'Pool Table'
  | 'Sim Racing'
  | 'PlayStation';

export type StationStatus = 'AVAILABLE' | 'ACTIVE' | 'RESERVED' | 'MAINTENANCE' | 'OFFLINE';

export interface GamingSystem {
  id: string;
  name: string;
  category: GamingServiceCategory;
  status: StationStatus;
  hourlyRate: number;
  specs: string;
  installedGames: string[];
  location: string;
  totalUsageHours: number;
  totalRevenue: number;
  activeSessionId?: string;
  currentCustomerName?: string;
  currentCustomerPhone?: string;
  sessionEndTime?: number; // timestamp in ms
  ipAddress: string;
  ping: number;
  temp: number;
}

export interface PricingRule {
  id: string;
  service: GamingServiceCategory;
  normalPrice: number;
  peakPrice: number;
  weekendPrice: number;
  isPeakEnabled: boolean;
  peakHoursStart: string;
  peakHoursEnd: string;
  peakDays: string[];
  lastUpdatedBy: string;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  id: string;
  service: string;
  previousPrice: number;
  newPrice: number;
  adminName: string;
  date: string;
  time: string;
  reason: string;
}

export interface ActiveSession {
  id: string;
  systemId: string;
  systemName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  gameTitle?: string;
  startTime: number; // timestamp in ms
  endTime: number; // timestamp in ms
  durationHours: number;
  ratePerHour: number;
  membershipUsedHours: number;
  vipMembershipUsedHours: number;
  foodItems: { id: string; name: string; price: number; quantity: number }[];
  foodTotal: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING';
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership';
  employeeName: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXTENDED';
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  systemId: string;
  systemName: string;
  service: GamingServiceCategory;
  gameTitle?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  applicableRate: number;
  membershipUsedHours: number;
  vipMembershipUsedHours: number;
  discount: number;
  foodTotal: number;
  finalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  bookingStatus: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO-SHOW';
  qrCode: string;
  createdAt: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  normalHours: number;
  vipHours: number;
  durationMonths: number;
  benefits: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CustomerMembership {
  id: string;
  customerId: string;
  customerName: string;
  planName: string;
  pricePaid: number;
  purchaseDate: string;
  expiryDate: string;
  normalHoursAllocated: number;
  normalHoursUsed: number;
  normalHoursRemaining: number;
  vipHoursAllocated: number;
  vipHoursUsed: number;
  vipHoursRemaining: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED';
}

export interface Tournament {
  id: string;
  title: string;
  game: string;
  platform: 'PC' | 'Mobile' | 'Console';
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  entryFeePerTeam: number;
  teamSize: number;
  maxTeams: number;
  registeredTeamsCount: number;
  registrationDeadline: string;
  googleFormUrl: string;
  prizePool: { first: number; second: number; third: number };
  status: 'REGISTRATION OPEN' | 'REGISTRATION CLOSED' | 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  rules: string[];
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  players: { name: string; gameId: string }[];
  registrationDate: string;
  paymentStatus: 'PAID' | 'PENDING';
  checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'ABSENT';
  assignedStationRange?: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: 'Quarterfinal' | 'Semifinal' | 'Final';
  matchNumber: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner?: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  stationInfo?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerContact: string;
  bookingId: string;
  systemName: string;
  service: string;
  gameTitle?: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  ratePerHour: number;
  membershipHoursUsed: number;
  foodItems: { name: string; quantity: number; price: number }[];
  discount: number;
  subtotal: number;
  gstTax: number;
  total: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Wallet' | 'Membership';
  paymentStatus: 'PAID';
  employeeName: string;
}

export interface WalletTransaction {
  id: string;
  customerId: string;
  type: 'RECHARGE' | 'GAMING' | 'FOOD' | 'TOURNAMENT' | 'REFUND';
  amount: number;
  balanceAfter: number;
  timestamp: string;
  description: string;
}

export interface FnbProduct {
  id: string;
  name: string;
  category: 'Drinks' | 'Snacks' | 'Food' | 'Accessories';
  price: number;
  stock: number;
  iconName?: string;
}

export interface EmployeeShift {
  id: string;
  employeeName: string;
  shiftDate: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  walletSales: number;
  expenses: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  service: GamingServiceCategory;
  preferredTime: string;
  durationHours: number;
  queuePosition: number;
  status: 'WAITING' | 'NOTIFIED' | 'CLAIMED' | 'EXPIRED';
  joinedAt: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  role: Role;
  action: string;
  entity: string;
  previousValue?: string;
  newValue: string;
  timestamp: string;
}

export interface SystemReview {
  id: string;
  customerName: string;
  rating: number;
  gamingExp: number;
  staffRating: number;
  cleanliness: number;
  comment: string;
  date: string;
}

export interface HeroGameSlide {
  id: string;
  title: string;
  tagline: string;
  category: string;
  tags: string[];
  description: string;
  price: string;
  rating: string;
  platforms: string[];
  bannerUrl: string;
  coverUrl: string;
  videoPreviewUrl: string;
  thumbnails: string[];
  availableCount: number;
}

export interface ConsoleGameItem {
  id: string;
  title: string;
  category: string;
  platforms: GamingServiceCategory[];
  coverUrl: string;
  bannerUrl?: string;
  rating: string;
  tags: string[];
  multiplayerType: string;
  description: string;
  installedOnSystems?: string[];
}

export type SupportTicketCategory =
  | 'BOOKING'
  | 'PAYMENT'
  | 'STATION'
  | 'FNB'
  | 'MEMBERSHIP'
  | 'OTHER'
  | 'CONTROLLER'
  | 'NETWORK'
  | 'GAME_PROBLEM'
  | 'GENERAL';

export type SupportTicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'WAITING_FOR_STAFF';

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  stationId?: string;
  stationName?: string;
  category: SupportTicketCategory;
  issue: string;
  status: SupportTicketStatus;
  createdAt: string;
  messages?: { sender: string; text: string; time: string }[];
}

export interface StationTransferRequest {
  id: string;
  sessionId: string;
  customerId: string;
  customerName: string;
  currentStationId: string;
  currentStationName: string;
  requestedStationId: string;
  requestedStationName: string;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

export type FnbOrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface FnbCustomerOrder {
  id: string;
  sessionId?: string;
  stationName?: string;
  customerId: string;
  customerName: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  gst: number;
  total: number;
  paymentMethod: 'Wallet' | 'UPI' | 'Card' | 'BillToSession';
  status: FnbOrderStatus;
  orderTime: string;
  estimatedDeliveryMins: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  target?: number;
  completed: boolean;
  isClaimed?: boolean;
  category?: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  xpCost: number;
  pointCost?: number;
  category?: string;
  type: 'WALLET_CREDIT' | 'FREE_HOURS' | 'FREE_DRINK' | 'TOURNAMENT_PASS' | 'DISCOUNT_VOUCHER';
  value: number;
  claimed: boolean;
}

export interface CustomerReferralInfo {
  referralCode: string;
  code?: string;
  friendsReferred: number;
  successfulReferrals: number;
  totalEarned: number;
}

export interface SupplierVendor {
  id: string;
  name: string;
  category: 'BEVERAGES' | 'SNACKS' | 'HARDWARE' | 'PERIPHERALS' | 'FURNITURE' | 'DAIRY_BAKERY';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  leadTimeDays: number;
  paymentTerms: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';
  lastOrderDate: string;
  pendingOrdersCount: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: { name: string; quantity: number; unitCost: number; totalCost: number }[];
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  status: 'ORDERED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
}

export interface PromotionCode {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minSpend: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  description: string;
  applicableServices: string[];
}

export interface MaintenanceTicket {
  id: string;
  stationId: string;
  stationName: string;
  issueCategory: 'CONTROLLER_DRIFT' | 'DISPLAY_GLITCH' | 'AUDIO_FAILURE' | 'GAME_UPDATE' | 'NETWORK_PING' | 'PERIPHERAL_REPLACE' | 'CLEANING';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  reportedBy: string;
  reportedAt: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTechnician?: string;
  description: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface CafeBusinessSettings {
  cafeName: string;
  brandTagline: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  gstin: string;
  contactPhone: string;
  contactEmail: string;
  operatingHours: {
    open: string;
    close: string;
    weekendClose: string;
  };
  taxGstEnabled: boolean;
  taxGstPercentage: number;
  currencySymbol: string;
  cancellationGracePeriodMins: number;
  maxAdvanceBookingDays: number;
  walkInDepositRequired: boolean;
  emergencyBroadcastMessage?: string;
  emergencyBroadcastActive?: boolean;
}

// -------------------------------------------------------------
// Employee Portal Production Data Structures
// -------------------------------------------------------------

export type CashLedgerType =
  | 'OPENING'
  | 'SALE_CASH'
  | 'SALE_UPI'
  | 'EXPENSE'
  | 'REFUND'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT';

export interface CashLedgerEntry {
  id: string;
  shiftId: string;
  type: CashLedgerType;
  amount: number;
  runningBalance: number;
  description: string;
  referenceId?: string;
  employeeName: string;
  timestamp: string;
}

export type RefundStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'REFUNDED'
  | 'REJECTED';

export interface RefundRequest {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: RefundStatus;
  requestedAt: string;
  processedAt?: string;
}

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  stationId?: string;
  timestamp: string;
  resolved: boolean;
}

export interface EmployeeActivity {
  id: string;
  employeeName: string;
  role: Role;
  action: string;
  details: string;
  resource: string;
  timestamp: string;
}

export type EmployeeTab =
  | 'DASHBOARD'
  | 'WALKIN'
  | 'BOOKINGS'
  | 'SESSIONS'
  | 'FLOOR'
  | 'CUSTOMERS'
  | 'FNB'
  | 'BILLING'
  | 'WAITLIST'
  | 'TOURNAMENTS'
  | 'MAINTENANCE'
  | 'SHIFT'
  | 'ALERTS'
  | 'ACTIVITY';

export interface EmployeeDashboardStats {
  activeSessionsCount: number;
  availableStationsCount: number;
  reservedStationsCount: number;
  maintenanceStationsCount: number;
  upcomingBookingsCount: number;
  waitlistCount: number;
  todayWalkInsCount: number;
  openFnbOrdersCount: number;
  shiftCashCollected: number;
  shiftTotalRevenue: number;
  shiftStatus: 'OPEN' | 'CLOSED';
}

export interface EmployeeCustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gamerTag?: string;
  membershipTier?: string;
  membershipExpiry?: string;
  remainingHours?: number;
  walletBalance: number;
  totalVisits: number;
  totalSpend: number;
  lastVisit: string;
  hasActiveSession?: boolean;
  upcomingBookingsCount?: number;
}

