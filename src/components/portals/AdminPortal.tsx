import React, { useState, useMemo } from 'react';
import { useCafe } from '../../context/CafeContext';
import { GamingServiceCategory, StationStatus, Tournament } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Trophy,
  Activity,
  Download,
  Plus,
  CheckCircle2,
  Zap,
  Coffee,
  Clock,
  FileText,
  RotateCcw,
  Calendar,
  Layers,
  Search,
  Trash2,
  Edit3,
  Server,
  Filter,
  Check,
  X,
  AlertTriangle,
  Monitor,
  Phone,
  Gamepad2,
  Sliders,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  Database,
  Eye,
  EyeOff,
  Copy,
  MessageCircle,
  Mail,
  LayoutDashboard,
  Radio,
  Truck,
  Wrench,
  Tag,
  Building2
} from 'lucide-react';
import { BrevoSmtpManager } from './BrevoSmtpManager';
import { AdminDashboard } from '../admin/AdminDashboard';
import { AdminLiveOps } from '../admin/AdminLiveOps';
import { AdminSuppliers } from '../admin/AdminSuppliers';
import { AdminMaintenance } from '../admin/AdminMaintenance';
import { AdminPromotions } from '../admin/AdminPromotions';
import { AdminBusinessSettings } from '../admin/AdminBusinessSettings';
import { AdminWalkInModal } from '../admin/AdminWalkInModal';

export type AdminTab =
  | 'DASHBOARD'
  | 'LIVE_OPS'
  | 'FINANCES'
  | 'PRICING'
  | 'INVENTORY'
  | 'SUPPLIERS'
  | 'SYSTEMS'
  | 'MAINTENANCE'
  | 'BOOKINGS'
  | 'TOURNAMENTS'
  | 'PROMOTIONS'
  | 'STAFF'
  | 'SETTINGS'
  | 'ACCOUNTS'
  | 'LOGS'
  | 'BREVO_SMTP';

export const AdminPortal: React.FC = () => {
  const {
    financialSummary,
    pricing,
    updatePricing,
    fnbProducts,
    updateFnbStock,
    addFnbProduct,
    deleteFnbProduct,
    tournaments,
    updateTournament,
    createTournament,
    tournamentTeams,
    checkInTournamentTeam,
    systems,
    updateSystemStatus,
    addSystem,
    employees,
    addEmployee,
    employeeShift,
    bookings,
    checkInBooking,
    cancelBooking,
    createBooking,
    auditLogs,
    clearAuditLogs,
    registeredAccounts,
    registerUser,
    googleSheetWebhookUrl,
    setGoogleSheetWebhookUrl,
    syncAccountsToGoogleSheet
  } = useCafe();

  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  // ===================== TAB 1: FINANCES STATE =====================
  const [financialTimeframe, setFinancialTimeframe] = useState<'today' | 'week' | 'month' | 'ytd'>('today');

  const timeframeMultiplier = useMemo(() => {
    switch (financialTimeframe) {
      case 'today': return 1;
      case 'week': return 6.8;
      case 'month': return 28.5;
      case 'ytd': return 92;
      default: return 1;
    }
  }, [financialTimeframe]);

  // ===================== TAB 2: PRICING STATE =====================
  const [rates, setRates] = useState<Record<GamingServiceCategory, number>>({
    PS5: pricing?.rates?.PS5 || 199,
    Xbox: pricing?.rates?.Xbox || 199,
    PS4: pricing?.rates?.PS4 || 149,
    'Gaming PC': pricing?.rates?.['Gaming PC'] || 249,
    'VIP Room': pricing?.rates?.['VIP Room'] || 499,
    VR: pricing?.rates?.VR || 299,
    'Pool Table': pricing?.rates?.['Pool Table'] || 199,
    'Sim Racing': pricing?.rates?.['Sim Racing'] || 349,
    PlayStation: pricing?.rates?.PlayStation || 199
  });
  const [weekendSurge, setWeekendSurge] = useState(pricing?.weekendSurgePercent ?? 20);
  const [peakSurge, setPeakSurge] = useState(pricing?.peakSurgePercent ?? 25);
  const [pricingSavedMsg, setPricingSavedMsg] = useState(false);

  // Live price simulator
  const [simCategory, setSimCategory] = useState<GamingServiceCategory>('Gaming PC');
  const [simHours, setSimHours] = useState(2);
  const [simIsPeak, setSimIsPeak] = useState(true);
  const [simIsWeekend, setSimIsWeekend] = useState(false);

  // ===================== TAB 3: INVENTORY STATE =====================
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<'ALL' | 'Drinks' | 'Snacks' | 'Food' | 'Accessories'>('ALL');
  const [showAddFnb, setShowAddFnb] = useState(false);
  const [newFnbName, setNewFnbName] = useState('');
  const [newFnbCategory, setNewFnbCategory] = useState<'Drinks' | 'Snacks' | 'Food' | 'Accessories'>('Drinks');
  const [newFnbBuyPrice, setNewFnbBuyPrice] = useState(40);
  const [newFnbSellPrice, setNewFnbSellPrice] = useState(70);
  const [newFnbStock, setNewFnbStock] = useState(30);

  // ===================== TAB 4: SYSTEMS STATE =====================
  const [systemStatusFilter, setSystemStatusFilter] = useState<'ALL' | StationStatus>('ALL');
  const [rebootingId, setRebootingId] = useState<string | null>(null);
  const [rebootMsg, setRebootMsg] = useState<string | null>(null);
  const [showAddSystemModal, setShowAddSystemModal] = useState(false);
  const [newSysName, setNewSysName] = useState('');
  const [newSysCategory, setNewSysCategory] = useState<GamingServiceCategory>('Gaming PC');
  const [newSysSpecs, setNewSysSpecs] = useState('Core i7 14700K, RTX 4070 Ti, 32GB DDR5, 240Hz OLED');
  const [newSysRate, setNewSysRate] = useState(249);
  const [newSysLocation, setNewSysLocation] = useState('Zone A - Pro Tier');

  // ===================== TAB 5: BOOKINGS STATE =====================
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED'>('ALL');
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookPhone, setNewBookPhone] = useState('');
  const [newBookSysId, setNewBookSysId] = useState(systems[0]?.id || '');
  const [newBookDate, setNewBookDate] = useState(new Date().toISOString().slice(0, 10));
  const [newBookTime, setNewBookTime] = useState('18:00');
  const [newBookHours, setNewBookHours] = useState(2);

  // ===================== TAB 6: TOURNAMENTS STATE =====================
  const [selectedTournId, setSelectedTournId] = useState(tournaments[0]?.id || '');
  const [editGoogleFormUrl, setEditGoogleFormUrl] = useState(tournaments[0]?.googleFormUrl || '');
  const [editTournTitle, setEditTournTitle] = useState(tournaments[0]?.title || '');
  const [editTournEntry, setEditTournEntry] = useState(tournaments[0]?.entryFeePerTeam || 500);
  const [tournSavedMsg, setTournSavedMsg] = useState(false);

  const [showAddTournModal, setShowAddTournModal] = useState(false);
  const [newTournTitle, setNewTournTitle] = useState('');
  const [newTournGame, setNewTournGame] = useState('Valorant');
  const [newTournPlatform, setNewTournPlatform] = useState<'PC' | 'Console' | 'Mobile'>('PC');
  const [newTournDate, setNewTournDate] = useState('2025-04-12');
  const [newTournEntryFee, setNewTournEntryFee] = useState(600);
  const [newTournMaxTeams, setNewTournMaxTeams] = useState(16);
  const [newTournFormUrl, setNewTournFormUrl] = useState('https://forms.gle/officialEsportsRegistration');

  // ===================== TAB 7: STAFF STATE =====================
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Floor Supervisor');
  const [newStaffPhone, setNewStaffPhone] = useState('+91 98765 00000');
  const [newStaffShift, setNewStaffShift] = useState('Evening (16:00 - 00:00)');
  const [reconcileCashInput, setReconcileCashInput] = useState<number>(employeeShift?.openingCash + employeeShift?.cashSales || 6850);
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState(false);

  // ===================== TAB 8: AUDIT LOGS STATE =====================
  const [logsSearch, setLogsSearch] = useState('');
  const [logsActionFilter, setLogsActionFilter] = useState<'ALL' | 'PRICE' | 'FNB' | 'SYSTEM' | 'BOOKING' | 'SHIFT' | 'AUTH'>('ALL');

  // ===================== TAB 9: USER DIRECTORY & GOOGLE SHEETS STATE =====================
  const [accountSearch, setAccountSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [sheetWebhookInput, setSheetWebhookInput] = useState(googleSheetWebhookUrl || '');
  const [sheetSyncing, setSheetSyncing] = useState(false);
  const [sheetSyncMsg, setSheetSyncMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showAddGamerModal, setShowAddGamerModal] = useState(false);
  const [newGamerName, setNewGamerName] = useState('');
  const [newGamerTag, setNewGamerTag] = useState('');
  const [newGamerEmail, setNewGamerEmail] = useState('');
  const [newGamerPhone, setNewGamerPhone] = useState('');
  const [newGamerPass, setNewGamerPass] = useState('');

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSyncToGoogleSheet = async () => {
    if (!sheetWebhookInput.trim()) {
      setSheetSyncMsg({ text: 'Please configure a valid Google Apps Script Webhook URL first.', error: true });
      return;
    }
    setSheetSyncing(true);
    setSheetSyncMsg(null);
    setGoogleSheetWebhookUrl(sheetWebhookInput.trim());
    const result = await syncAccountsToGoogleSheet();
    setSheetSyncing(false);
    setSheetSyncMsg({ text: result.message, error: !result.success });
    setTimeout(() => setSheetSyncMsg(null), 5000);
  };

  const handleCopyAppsScript = () => {
    const scriptCode = `// Google Apps Script for Bytes & Brew Gaming Cafe
// 1. Open your Google Sheet -> Extensions -> Apps Script
// 2. Replace Code.gs with this code and click Deploy -> New deployment -> Web app -> Anyone -> Deploy
// 3. Paste the Web app URL into the Bytes & Brew Admin Portal!

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  if (data.action === 'BATCH_SYNC_USERS' && data.users) {
    data.users.forEach(function(u) {
      sheet.appendRow([new Date(), u.id, u.name, u.gamerTag, u.email, u.phone, u.password, u.isEmailVerified, u.isWhatsappVerified]);
    });
  } else {
    sheet.appendRow([new Date(), data.id, data.name, data.gamerTag, data.email, data.phone, data.password, data.isEmailVerified, data.isWhatsappVerified]);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', synced: true })).setMimeType(ContentService.MimeType.JSON);
}`;
    navigator.clipboard.writeText(scriptCode);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 3000);
  };

  const handleExportUsersCsv = () => {
    const header = 'ID,Name,GamerTag,Email,WhatsApp_Phone,Saved_Password,Created_At,Email_Verified,WhatsApp_Verified,Synced_To_Google_Sheet\n';
    const rows = registeredAccounts.map(a =>
      `"${a.id}","${a.name}","${a.gamerTag}","${a.email}","${a.phone}","${a.password}","${a.createdAt}","${a.isEmailVerified !== false}","${a.isWhatsappVerified}","${a.syncedToGoogleSheet || false}"`
    ).join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + header + rows);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bytes_brew_users_database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddGamerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGamerName.trim() || !newGamerEmail.trim() || !newGamerPhone.trim() || !newGamerPass.trim()) return;
    registerUser({
      name: newGamerName.trim(),
      gamerTag: newGamerTag.trim() || newGamerName.trim().replace(/\s+/g, '_'),
      email: newGamerEmail.trim(),
      phone: newGamerPhone.trim(),
      password: newGamerPass,
      isWhatsappVerified: true,
      isEmailVerified: true
    });
    setNewGamerName('');
    setNewGamerTag('');
    setNewGamerEmail('');
    setNewGamerPhone('');
    setNewGamerPass('');
    setShowAddGamerModal(false);
  };

  // ===================== HANDLERS =====================
  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricing({
      rates,
      weekendSurgePercent: weekendSurge,
      peakSurgePercent: peakSurge
    });
    setPricingSavedMsg(true);
    setTimeout(() => setPricingSavedMsg(false), 2500);
  };

  const applyPricingPreset = (type: 'DEFAULT' | 'TOURNAMENT' | 'HAPPY_HOUR') => {
    if (type === 'DEFAULT') {
      setRates({
        PS5: 199,
        Xbox: 199,
        PS4: 149,
        'Gaming PC': 249,
        'VIP Room': 499,
        VR: 299,
        'Pool Table': 199,
        'Sim Racing': 349,
        PlayStation: 199
      });
      setWeekendSurge(20);
      setPeakSurge(25);
    } else if (type === 'TOURNAMENT') {
      setRates({
        PS5: 249,
        Xbox: 249,
        PS4: 179,
        'Gaming PC': 299,
        'VIP Room': 599,
        VR: 349,
        'Pool Table': 249,
        'Sim Racing': 399,
        PlayStation: 249
      });
      setWeekendSurge(30);
      setPeakSurge(35);
    } else {
      setRates({
        PS5: 169,
        Xbox: 169,
        PS4: 119,
        'Gaming PC': 199,
        'VIP Room': 399,
        VR: 239,
        'Pool Table': 159,
        'Sim Racing': 279,
        PlayStation: 169
      });
      setWeekendSurge(10);
      setPeakSurge(15);
    }
  };

  const handleAddFnbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFnbName.trim()) return;
    addFnbProduct({
      name: newFnbName.trim(),
      category: newFnbCategory,
      costPrice: newFnbBuyPrice,
      price: newFnbSellPrice,
      stock: newFnbStock,
      lowStockThreshold: 10
    });
    setNewFnbName('');
    setShowAddFnb(false);
  };

  const handleSimulateReboot = (systemId: string) => {
    setRebootingId(systemId);
    setRebootMsg(`Sending hard reboot packet to rig ${systemId}...`);
    setTimeout(() => {
      setRebootingId(null);
      setRebootMsg(`Rig ${systemId} rebooted successfully. Telemetry normal.`);
      setTimeout(() => setRebootMsg(null), 3500);
    }, 2000);
  };

  const handleAddSystemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSysName.trim()) return;
    addSystem({
      name: newSysName.trim(),
      category: newSysCategory,
      specs: newSysSpecs,
      hourlyRate: newSysRate,
      status: 'AVAILABLE',
      location: newSysLocation,
      installedGames: ['Valorant', 'CS2', 'Cyberpunk 2077', 'Apex Legends', 'GTA V', 'EA FC 25'],
      ipAddress: `192.168.1.${100 + systems.length}`
    });
    setNewSysName('');
    setShowAddSystemModal(false);
  };

  const handleAddBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookName.trim() || !newBookPhone.trim()) return;
    createBooking({
      customerName: newBookName.trim(),
      phone: newBookPhone.trim(),
      systemId: newBookSysId,
      date: newBookDate,
      startTime: newBookTime,
      durationHours: newBookHours,
      paymentMethod: 'CASH',
      amountPaid: 398
    });
    setNewBookName('');
    setNewBookPhone('');
    setShowAddBookingModal(false);
  };

  const handleSaveTournConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateTournament(selectedTournId, {
      googleFormUrl: editGoogleFormUrl,
      title: editTournTitle,
      entryFeePerTeam: editTournEntry
    });
    setTournSavedMsg(true);
    setTimeout(() => setTournSavedMsg(false), 2500);
  };

  const handleAddTournSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournTitle.trim()) return;
    createTournament({
      title: newTournTitle.trim(),
      game: newTournGame,
      platform: newTournPlatform,
      date: newTournDate,
      startTime: '11:00 AM',
      endTime: '08:00 PM',
      venue: 'Main Esports Arena LAN Stage',
      entryFeePerTeam: newTournEntryFee,
      teamSize: 5,
      maxTeams: newTournMaxTeams,
      registrationDeadline: '2025-04-10',
      googleFormUrl: newTournFormUrl,
      prizePool: { first: 25000, second: 12000, third: 5000 },
      status: 'REGISTRATION OPEN',
      rules: ['Standard Competitive Rules', 'Anti-cheat required', 'Zero toxic conduct']
    });
    setNewTournTitle('');
    setShowAddTournModal(false);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    addEmployee({
      name: newStaffName.trim(),
      role: newStaffRole,
      phone: newStaffPhone,
      shift: newStaffShift,
      status: 'On Duty'
    });
    setNewStaffName('');
    setShowAddStaffModal(false);
  };

  const handleReconcileRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setReconcileSuccessMsg(true);
    setTimeout(() => setReconcileSuccessMsg(false), 3000);
  };

  const handleExportCsv = () => {
    const csvContent = `data:text/csv;charset=utf-8,Metric,Value\nTimeframe,${financialTimeframe.toUpperCase()}\nToday Revenue,${financialSummary?.todayRevenue || 0}\nWeekly Revenue,${financialSummary?.weeklyRevenue || 0}\nMonthly Revenue,${financialSummary?.monthlyRevenue || 0}\nGaming PC Revenue,${financialSummary?.serviceWiseRevenue?.['Gaming PC'] || 0}\nPlayStation Revenue,${financialSummary?.serviceWiseRevenue?.['PlayStation'] || 0}\nXbox Revenue,${financialSummary?.serviceWiseRevenue?.['Xbox'] || 0}\nVIP Room Revenue,${financialSummary?.serviceWiseRevenue?.['VIP Room'] || 0}\nFnB Revenue,${financialSummary?.fnbRevenue || 0}\nExpenses,${financialSummary?.expenses || 0}\nNet Profit,${financialSummary?.netProfit || 0}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAuditLogs = () => {
    const header = 'ID,Timestamp,User,Role,Action,Entity,Details\n';
    const rows = auditLogs.map(l => `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.entity}","${l.newValue || ''}"`).join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + header + rows);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredFnb = useMemo(() => {
    return fnbProducts.filter(p => {
      const matchCat = inventoryCategoryFilter === 'ALL' || p.category === inventoryCategoryFilter;
      const matchSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [fnbProducts, inventoryCategoryFilter, inventorySearch]);

  const filteredSystems = useMemo(() => {
    return systems.filter(s => {
      if (systemStatusFilter === 'ALL') return true;
      return s.status === systemStatusFilter;
    });
  }, [systems, systemStatusFilter]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
      const matchSearch = b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.phone.includes(bookingSearch) ||
        (b.systemName || '').toLowerCase().includes(bookingSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [bookings, bookingStatusFilter, bookingSearch]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l => {
      const matchSearch = l.user.toLowerCase().includes(logsSearch.toLowerCase()) ||
        l.entity.toLowerCase().includes(logsSearch.toLowerCase()) ||
        (l.newValue || '').toLowerCase().includes(logsSearch.toLowerCase());
      if (!matchSearch) return false;
      if (logsActionFilter === 'ALL') return true;
      return l.action.toUpperCase().includes(logsActionFilter);
    });
  }, [auditLogs, logsSearch, logsActionFilter]);

  const filteredAccounts = useMemo(() => {
    return registeredAccounts.filter(acc => {
      const q = accountSearch.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.gamerTag.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.phone.includes(q) ||
        acc.id.toLowerCase().includes(q)
      );
    });
  }, [registeredAccounts, accountSearch]);

  // Selected tournament details
  const currentTourn = useMemo(() => {
    return tournaments.find(t => t.id === selectedTournId) || tournaments[0];
  }, [tournaments, selectedTournId]);

  const currentTournTeams = useMemo(() => {
    if (!currentTourn) return [];
    return tournamentTeams.filter(team => team.tournamentId === currentTourn.id);
  }, [tournamentTeams, currentTourn]);

  return (
    <div className="flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.25em] font-black px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Admin Master Root</span>
            </span>
            <span className="text-xs text-white/50 font-mono">Floor Operations & Commercial Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Commercial Operations & Control Center
          </h1>
          <p className="text-xs text-white/60 font-light mt-1 max-w-2xl leading-relaxed">
            Configure dynamic tariff rates, monitor live rig telemetry, replenish café inventory, manage walk-in reservations, and audit cash register reconciliations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-4 py-3 rounded-xl shadow-lg transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Financials</span>
          </button>
          <button
            onClick={handleExportAuditLogs}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-black uppercase tracking-wider px-4 py-3 rounded-xl shadow-lg transition cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4 text-white/80" />
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Admin Section Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
        {[
          { id: 'DASHBOARD', label: 'Executive Pulse', icon: LayoutDashboard },
          { id: 'LIVE_OPS', label: 'Floor Operations', icon: Radio },
          { id: 'FINANCES', label: 'Financial Analytics', icon: TrendingUp },
          { id: 'PRICING', label: 'Tariffs & Surge Engine', icon: DollarSign },
          { id: 'INVENTORY', label: 'F&B POS Inventory', icon: Package },
          { id: 'SUPPLIERS', label: 'Suppliers & Restock PO', icon: Truck },
          { id: 'SYSTEMS', label: 'Hardware Rigs & Assets', icon: Activity },
          { id: 'MAINTENANCE', label: 'Tech & Maintenance', icon: Wrench },
          { id: 'BOOKINGS', label: 'Reservations Queue', icon: Calendar },
          { id: 'TOURNAMENTS', label: 'Esports Tournaments', icon: Trophy },
          { id: 'PROMOTIONS', label: 'Promos & Loyalty', icon: Tag },
          { id: 'STAFF', label: 'Staff & Cash Register', icon: Users },
          { id: 'SETTINGS', label: 'Business Profile & GST', icon: Building2 },
          { id: 'ACCOUNTS', label: 'Users & Google Sheets', icon: FileSpreadsheet },
          { id: 'LOGS', label: 'Audit Trail', icon: FileText },
          { id: 'BREVO_SMTP', label: 'Brevo SMTP Relay', icon: Mail }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Toast Notice */}
      {adminToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{adminToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 0: Real-Time Executive Dashboard Pulse */}
      {/* ========================================================================= */}
      {activeTab === 'DASHBOARD' && (
        <AdminDashboard
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onOpenWalkInModal={() => setShowWalkInModal(true)}
          onToggleSurge={(preset) => {
            if (preset === 'NORMAL') {
              updatePricing({ ...pricing, peakSurgePercent: 0, weekendSurgePercent: 0 });
            } else if (preset === 'PEAK') {
              updatePricing({ ...pricing, peakSurgePercent: 15 });
            } else if (preset === 'WEEKEND') {
              updatePricing({ ...pricing, weekendSurgePercent: 25 });
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 0.5: Live Floor Operations & Active Station Controls */}
      {/* ========================================================================= */}
      {activeTab === 'LIVE_OPS' && (
        <AdminLiveOps
          onOpenWalkInModal={() => setShowWalkInModal(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: Financial Analytics */}
      {/* ========================================================================= */}
      {activeTab === 'FINANCES' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Timeframe Selector Pill */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/70 font-bold uppercase tracking-wider">Analysis Window:</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              {[
                { id: 'today', label: 'Today (Live)' },
                { id: 'week', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'ytd', label: 'Year To Date' }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setFinancialTimeframe(tf.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    financialTimeframe === tf.id
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Gross Revenue</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                ₹{Math.round((financialSummary?.todayRevenue || 4280) * timeframeMultiplier).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium mt-1.5 block">
                +18.4% vs benchmark period
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Operational OPEX</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                ₹{Math.round((financialSummary?.expenses || 1200) * timeframeMultiplier).toLocaleString()}
              </div>
              <span className="text-[11px] text-white/50 font-light mt-1.5 block">
                Power, bandwidth & concessions
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Net Profit</span>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                ₹{Math.round((financialSummary?.netProfit || 3080) * timeframeMultiplier).toLocaleString()}
              </div>
              <span className="text-[11px] text-white/50 font-light mt-1.5 block">
                Profit Margin: ~72%
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Average Ticket Size</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                ₹{Math.round(485 + (timeframeMultiplier > 1 ? 25 : 0))}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium mt-1.5 block">
                Gaming + F&B Cross-Sell Active
              </span>
            </div>
          </div>

          {/* 24-Hour Arena Hourly Velocity SVG Curve */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  24-Hour Floor Occupancy & Hourly Traffic Flow
                </h3>
                <span className="text-xs text-white/50 font-light">Peak surge multiplier activates automatically between 18:00 – 23:00 daily</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-white/70">
                  <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                  Active Traffic
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  Surge Window
                </span>
              </div>
            </div>

            {/* SVG Wave Visualization */}
            <div className="w-full h-44 relative">
              <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <rect x="520" y="0" width="220" height="160" fill="rgba(245, 158, 11, 0.08)" />
                <path
                  d="M0,130 C80,125 150,140 220,105 C300,70 380,85 450,60 C530,30 620,15 700,20 C750,25 780,60 800,90 L800,160 L0,160 Z"
                  fill="url(#areaGrad)"
                />
                <path
                  d="M0,130 C80,125 150,140 220,105 C300,70 380,85 450,60 C530,30 620,15 700,20 C750,25 780,60 800,90"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                />
              </svg>
              <div className="flex justify-between text-[11px] text-white/50 font-mono mt-2 px-1">
                <span>10:00 AM (Open)</span>
                <span>14:00 (Afternoon)</span>
                <span className="text-amber-400 font-bold">18:00 (Surge Peak)</span>
                <span className="text-amber-400 font-bold">22:00 (LAN Prime)</span>
                <span>02:00 AM (Late Shift)</span>
              </div>
            </div>
          </div>

          {/* Service-wise Breakdown & Ancillary Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                Service-Wise Revenue Distribution
              </h3>
              <div className="space-y-4">
                {Object.entries(financialSummary?.serviceWiseRevenue || {}).map(([serv, rev]) => (
                  <div key={serv}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/80 font-bold uppercase tracking-tight">{serv}</span>
                      <span className="font-mono font-bold text-white">
                        ₹{Math.round(Number(rev) * timeframeMultiplier).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (Number(rev) / ((financialSummary?.monthlyRevenue || 1) * 0.35)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                Ancillary Income Channels
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coffee className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-tight block">Food & Beverage Café Bar</span>
                      <span className="text-[11px] text-white/40 font-light">Energy drinks, snacks, gourmet coffee</span>
                    </div>
                  </div>
                  <span className="text-lg font-black text-white font-mono">
                    ₹{Math.round((financialSummary?.fnbRevenue || 1450) * timeframeMultiplier).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-tight block">Memberships & Season Passes</span>
                      <span className="text-[11px] text-white/40 font-light">Gold, Platinum & Pro Gamer Subscriptions</span>
                    </div>
                  </div>
                  <span className="text-lg font-black text-white font-mono">
                    ₹{Math.round((financialSummary?.membershipRevenue || 3499) * timeframeMultiplier).toLocaleString()}
                  </span>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-tight block">Tournament Entry Collections</span>
                      <span className="text-[11px] text-white/40 font-light">LAN registration fees & tournament seats</span>
                    </div>
                  </div>
                  <span className="text-lg font-black text-white font-mono">
                    ₹{Math.round((financialSummary?.tournamentRevenue || 1200) * timeframeMultiplier).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Tariffs & Dynamic Surge Pricing Engine */}
      {/* ========================================================================= */}
      {activeTab === 'PRICING' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Quick Presets Bar */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Fast Tariff Presets</h3>
              <p className="text-[11px] text-white/50">Instantly switch between standard weekday, weekend tournament, or off-peak promotions.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyPricingPreset('DEFAULT')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Standard Floor Rates
              </button>
              <button
                type="button"
                onClick={() => applyPricingPreset('TOURNAMENT')}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Esports LAN Weekend (+15%)
              </button>
              <button
                type="button"
                onClick={() => applyPricingPreset('HAPPY_HOUR')}
                className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Night Owl Discount (-15%)
              </button>
            </div>
          </div>

          <form onSubmit={handleSavePricing} className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-6">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Hourly Station Rates Configuration
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                Rates update instantly in the Customer Booking Portal, Desk Point of Sale, and billing timers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['PS5', 'Xbox', 'PS4', 'Gaming PC', 'VIP Room', 'VR', 'Pool Table', 'Sim Racing'] as GamingServiceCategory[]).map(cat => (
                <div key={cat} className="p-4 bg-white/[0.02] rounded-xl border border-white/10 hover:border-amber-400/40 transition">
                  <label className="text-xs font-bold text-white/80 block mb-1 uppercase tracking-tight">
                    {cat} (₹ / Hour)
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-white/40 font-bold">₹</span>
                    <input
                      type="number"
                      value={rates[cat] || 199}
                      onChange={(e) => setRates(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Surge Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-white uppercase tracking-tight">Weekend Surge Tariff (%)</label>
                  <span className="text-xs font-mono font-bold text-amber-400">+{weekendSurge}%</span>
                </div>
                <p className="text-[11px] text-white/50 font-light mb-3">
                  Applied to Saturday & Sunday bookings during high traffic.
                </p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={weekendSurge}
                  onChange={(e) => setWeekendSurge(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-white uppercase tracking-tight">Evening Peak Hours Surge (%)</label>
                  <span className="text-xs font-mono font-bold text-amber-400">+{peakSurge}%</span>
                </div>
                <p className="text-[11px] text-white/50 font-light mb-3">
                  Applied daily between 18:00 and 23:00 automatically.
                </p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={peakSurge}
                  onChange={(e) => setPeakSurge(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Live Customer Fare Calculator Preview */}
            <div className="p-5 rounded-2xl bg-amber-400/5 border border-amber-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Simulated Customer Fare Preview
                </span>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <select
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value as any)}
                    className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    {(['PS5', 'Xbox', 'PS4', 'Gaming PC', 'VIP Room', 'VR', 'Pool Table', 'Sim Racing'] as GamingServiceCategory[]).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span>for</span>
                  <select
                    value={simHours}
                    onChange={(e) => setSimHours(Number(e.target.value))}
                    className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                    <option value={5}>5 Hours</option>
                  </select>
                  <label className="flex items-center gap-1 cursor-pointer text-xs ml-2">
                    <input
                      type="checkbox"
                      checked={simIsPeak}
                      onChange={(e) => setSimIsPeak(e.target.checked)}
                      className="accent-amber-400"
                    />
                    <span>Peak Surge (+{peakSurge}%)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-xs ml-2">
                    <input
                      type="checkbox"
                      checked={simIsWeekend}
                      onChange={(e) => setSimIsWeekend(e.target.checked)}
                      className="accent-amber-400"
                    />
                    <span>Weekend (+{weekendSurge}%)</span>
                  </label>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-white/40 uppercase font-mono block">Estimated Customer Total</span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  ₹{Math.round(
                    (rates[simCategory] || 199) *
                    simHours *
                    (1 + (simIsPeak ? peakSurge / 100 : 0) + (simIsWeekend ? weekendSurge / 100 : 0))
                  )}
                </div>
              </div>
            </div>

            {pricingSavedMsg && (
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ New rates and dynamic surges applied and broadcasted across all terminals!</span>
              </div>
            )}

            <button
              type="submit"
              className="self-end bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-amber-400/20 transition cursor-pointer active:scale-95"
            >
              Apply & Broadcast New Rates
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: F&B POS Inventory Tracker */}
      {/* ========================================================================= */}
      {activeTab === 'INVENTORY' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Food & Beverage Café Bar Inventory
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                Real-time stock levels, margin tracking, low-inventory triggers, and fast restocks.
              </p>
            </div>
            <button
              onClick={() => setShowAddFnb(true)}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'Drinks', 'Snacks', 'Food', 'Accessories'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setInventoryCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    inventoryCategoryFilter === cat
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Add product modal/box */}
          {showAddFnb && (
            <form onSubmit={handleAddFnbSubmit} className="p-5 bg-black/60 rounded-2xl border border-amber-400/30 flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Register New Concession Item</h4>
                <button
                  type="button"
                  onClick={() => setShowAddFnb(false)}
                  className="text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-white/50 block mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Red Bull Peach Edition"
                    value={newFnbName}
                    onChange={(e) => setNewFnbName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Category</label>
                  <select
                    value={newFnbCategory}
                    onChange={(e) => setNewFnbCategory(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Drinks">Drinks</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Food">Food</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={newFnbBuyPrice}
                    onChange={(e) => setNewFnbBuyPrice(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={newFnbSellPrice}
                    onChange={(e) => setNewFnbSellPrice(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="text-xs text-white/60">
                  <span>Calculated Margin: </span>
                  <span className="font-bold text-amber-400 font-mono">
                    {newFnbSellPrice > 0 ? Math.round(((newFnbSellPrice - newFnbBuyPrice) / newFnbSellPrice) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFnb(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px]">
                  <th className="py-3">Product Name</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Cost Price</th>
                  <th className="py-3">Retail Price</th>
                  <th className="py-3">Margin</th>
                  <th className="py-3">Stock Units</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Quick Restock / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFnb.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  const marginPercent = Math.round(((p.price - p.costPrice) / p.price) * 100);
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 font-bold text-white uppercase tracking-tight">{p.name}</td>
                      <td className="py-3.5 text-white/50">{p.category}</td>
                      <td className="py-3.5 font-mono text-white/50">₹{p.costPrice}</td>
                      <td className="py-3.5 font-mono text-white font-bold">₹{p.price}</td>
                      <td className="py-3.5 font-mono text-amber-400 font-bold">{marginPercent}%</td>
                      <td className="py-3.5 font-mono font-bold text-white">{p.stock} units</td>
                      <td className="py-3.5">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-500/40 text-[9px] font-bold uppercase tracking-wider">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider">
                            HEALTHY
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updateFnbStock(p.id, 10)}
                            className="bg-white/10 hover:bg-white/20 border border-white/15 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => updateFnbStock(p.id, 25)}
                            className="bg-white/10 hover:bg-white/20 border border-white/15 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                            title="Add 25 units"
                          >
                            +25
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${p.name} from inventory?`)) {
                                deleteFnbProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer ml-1"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Suppliers, Wholesale Vendors & Purchase Orders */}
      {/* ========================================================================= */}
      {activeTab === 'SUPPLIERS' && (
        <AdminSuppliers />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: Hardware Rigs, Assets & Telemetry */}
      {/* ========================================================================= */}
      {activeTab === 'SYSTEMS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Gaming Rig Telemetry & Floor Asset Management
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                Monitor live rig temperatures, ping latencies, and simulate remote station resets.
              </p>
            </div>
            <button
              onClick={() => setShowAddSystemModal(true)}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy New Rig</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'AVAILABLE', 'ACTIVE', 'MAINTENANCE', 'RESERVED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setSystemStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    systemStatusFilter === st
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/40 font-mono">{filteredSystems.length} stations matching</span>
          </div>

          {rebootMsg && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
              <RotateCcw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{rebootMsg}</span>
            </div>
          )}

          {/* Add System Modal */}
          {showAddSystemModal && (
            <form onSubmit={handleAddSystemSubmit} className="p-5 bg-black/60 rounded-2xl border border-amber-400/30 flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Deploy New Station Rig</h4>
                <button
                  type="button"
                  onClick={() => setShowAddSystemModal(false)}
                  className="text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Station Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. PC-17 or PS5-09"
                    value={newSysName}
                    onChange={(e) => setNewSysName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Hardware Category</label>
                  <select
                    value={newSysCategory}
                    onChange={(e) => setNewSysCategory(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    {(['PS5', 'Xbox', 'PS4', 'Gaming PC', 'VIP Room', 'VR', 'Pool Table', 'Sim Racing'] as GamingServiceCategory[]).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Hourly Base Rate (₹)</label>
                  <input
                    type="number"
                    value={newSysRate}
                    onChange={(e) => setNewSysRate(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Floor Zone</label>
                  <input
                    type="text"
                    value={newSysLocation}
                    onChange={(e) => setNewSysLocation(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-[10px] text-white/50 block mb-1">Hardware Specifications</label>
                  <input
                    type="text"
                    value={newSysSpecs}
                    onChange={(e) => setNewSysSpecs(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddSystemModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow"
                >
                  Deploy Station
                </button>
              </div>
            </form>
          )}

          {/* Rig Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredSystems.map((s) => {
              const isRebooting = rebootingId === s.id;
              return (
                <div
                  key={s.id}
                  className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 flex flex-col justify-between hover:border-white/25 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-white/60" />
                        <span className="font-black text-white text-sm uppercase tracking-wider">{s.name}</span>
                      </div>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          s.status === 'AVAILABLE'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                            : s.status === 'ACTIVE'
                            ? 'bg-red-950/70 text-red-400 border border-red-500/40'
                            : s.status === 'RESERVED'
                            ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/40'
                            : 'bg-amber-950/70 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {isRebooting ? 'REBOOTING...' : s.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-white/60 font-light mt-1.5 line-clamp-1">{s.specs}</p>

                    <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-white/[0.02] rounded-xl border border-white/5 text-[10px] font-mono text-white/60">
                      <div>
                        <span className="text-[9px] text-white/30 block">GPU</span>
                        <span className="font-bold text-white">{s.gpuTemp || `${s.temp || 52}°C`}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/30 block">CPU</span>
                        <span className="font-bold text-white">{s.cpuTemp || `${(s.temp || 50) + 4}°C`}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-white/30 block">PING</span>
                        <span className="font-bold text-emerald-400">{s.ping || 6}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center gap-2">
                    <button
                      onClick={() => handleSimulateReboot(s.id)}
                      disabled={isRebooting}
                      className="text-[10px] font-bold text-white/70 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                      title="Send hardware reboot signal"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRebooting ? 'animate-spin text-amber-400' : ''}`} />
                      <span>{isRebooting ? 'Resetting...' : 'Reboot Rig'}</span>
                    </button>

                    <button
                      onClick={() =>
                        updateSystemStatus(
                          s.id,
                          s.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
                        )
                      }
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer ${
                        s.status === 'MAINTENANCE'
                          ? 'bg-white text-black hover:bg-white/90'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                    >
                      {s.status === 'MAINTENANCE' ? 'Mark Available' : 'Lock Rig'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Hardware Maintenance & Technician Ticketing */}
      {/* ========================================================================= */}
      {activeTab === 'MAINTENANCE' && (
        <AdminMaintenance />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: Reservations & Walk-in Queue */}
      {/* ========================================================================= */}
      {activeTab === 'BOOKINGS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Customer Reservations & Front Desk Queue
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                Review bookings, check-in players arriving at the desk, or add phone/walk-in reservations.
              </p>
            </div>
            <button
              onClick={() => setShowAddBookingModal(true)}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Reservation</span>
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search by customer, phone, rig..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['ALL', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setBookingStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    bookingStatusFilter === st
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Add Booking Modal */}
          {showAddBookingModal && (
            <form onSubmit={handleAddBookingSubmit} className="p-5 bg-black/60 rounded-2xl border border-amber-400/30 flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Book Station for Walk-in or VIP</h4>
                <button
                  type="button"
                  onClick={() => setShowAddBookingModal(false)}
                  className="text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Gamer / Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Mehta"
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newBookPhone}
                    onChange={(e) => setNewBookPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Assigned Station</label>
                  <select
                    value={newBookSysId}
                    onChange={(e) => setNewBookSysId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    {systems.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Booking Date</label>
                  <input
                    type="date"
                    value={newBookDate}
                    onChange={(e) => setNewBookDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newBookTime}
                    onChange={(e) => setNewBookTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Duration (Hours)</label>
                  <select
                    value={newBookHours}
                    onChange={(e) => setNewBookHours(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddBookingModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          )}

          {/* Bookings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px]">
                  <th className="py-3">Gamer Details</th>
                  <th className="py-3">Station</th>
                  <th className="py-3">Date & Slot</th>
                  <th className="py-3">Duration</th>
                  <th className="py-3">Total Fare</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5">
                      <span className="font-bold text-white block uppercase tracking-tight">{b.customerName}</span>
                      <span className="text-[11px] text-white/40 font-mono">{b.phone}</span>
                    </td>
                    <td className="py-3.5 text-white/80 font-bold">{b.systemName || b.systemId}</td>
                    <td className="py-3.5 font-mono text-white/60">{b.date} • {b.startTime}</td>
                    <td className="py-3.5 font-mono text-white/70">{b.durationHours} hrs</td>
                    <td className="py-3.5 font-mono font-bold text-white">₹{b.totalPrice}</td>
                    <td className="py-3.5">
                      <span
                        className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          b.status === 'CONFIRMED'
                            ? 'bg-amber-950/70 text-amber-400 border border-amber-500/40'
                            : b.status === 'CHECKED_IN'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                            : 'bg-red-950/70 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {b.status === 'CONFIRMED' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => checkInBooking(b.id)}
                            className="bg-emerald-400 hover:bg-emerald-300 text-black text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition cursor-pointer shadow"
                          >
                            Check In
                          </button>
                          <button
                            onClick={() => cancelBooking(b.id)}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30 font-mono">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: Esports Tournaments Management */}
      {/* ========================================================================= */}
      {activeTab === 'TOURNAMENTS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Esports Tournament Administration
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                Configure Google Form registration URLs, prize pools, and check in competing LAN teams.
              </p>
            </div>
            <button
              onClick={() => setShowAddTournModal(true)}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Host New Tournament</span>
            </button>
          </div>

          {/* Create Tournament Modal */}
          {showAddTournModal && (
            <form onSubmit={handleAddTournSubmit} className="p-5 bg-black/60 rounded-2xl border border-amber-400/30 flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Host New LAN Tournament</h4>
                <button
                  type="button"
                  onClick={() => setShowAddTournModal(false)}
                  className="text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-white/50 block mb-1">Tournament Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Valorant Masters Mumbai 2025"
                    value={newTournTitle}
                    onChange={(e) => setNewTournTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Esports Title</label>
                  <input
                    type="text"
                    value={newTournGame}
                    onChange={(e) => setNewTournGame(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Platform</label>
                  <select
                    value={newTournPlatform}
                    onChange={(e) => setNewTournPlatform(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="PC">PC</option>
                    <option value="Console">Console</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Entry Fee per Team (₹)</label>
                  <input
                    type="number"
                    value={newTournEntryFee}
                    onChange={(e) => setNewTournEntryFee(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Max Teams Slot</label>
                  <input
                    type="number"
                    value={newTournMaxTeams}
                    onChange={(e) => setNewTournMaxTeams(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-white/50 block mb-1">Google Form Registration Link</label>
                  <input
                    type="url"
                    value={newTournFormUrl}
                    onChange={(e) => setNewTournFormUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTournModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow"
                >
                  Publish Tournament
                </button>
              </div>
            </form>
          )}

          {/* Tournament Live Editor Card */}
          <form onSubmit={handleSaveTournConfig} className="p-6 bg-white/[0.02] rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-amber-400">
                Active Tournament Settings
              </label>
              <span className="text-xs text-white/40 font-mono">
                {currentTournTeams.length} Registered Teams
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-white/50 block mb-1">Select Tournament</label>
                <select
                  value={selectedTournId}
                  onChange={(e) => {
                    setSelectedTournId(e.target.value);
                    const found = tournaments.find(t => t.id === e.target.value);
                    if (found) {
                      setEditGoogleFormUrl(found.googleFormUrl);
                      setEditTournTitle(found.title);
                      setEditTournEntry(found.entryFeePerTeam);
                    }
                  }}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0a0a0a] text-white">
                      {t.title} ({t.game})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/50 block mb-1">Tournament Title</label>
                <input
                  type="text"
                  value={editTournTitle}
                  onChange={(e) => setEditTournTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/50 block mb-1">Entry Fee (₹ / Team)</label>
                <input
                  type="number"
                  value={editTournEntry}
                  onChange={(e) => setEditTournEntry(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] text-white/50 block mb-1">
                  Official Registration Google Form Link
                </label>
                <input
                  type="url"
                  value={editGoogleFormUrl}
                  onChange={(e) => setEditGoogleFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            {tournSavedMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Tournament settings and Google Form URL updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="self-end bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer shadow active:scale-95"
            >
              Update Registration Link
            </button>
          </form>

          {/* Registered Teams Table */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">
              Registered Teams Roster ({currentTourn?.title})
            </h4>
            <div className="overflow-x-auto border border-white/10 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px] bg-white/[0.02]">
                    <th className="py-3 px-4">Team Name</th>
                    <th className="py-3 px-4">Captain</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Check-In Status</th>
                    <th className="py-3 px-4 text-right">Desk Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentTournTeams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-white/40 text-xs">
                        No teams registered yet. Share the Google Form link with gamers!
                      </td>
                    </tr>
                  ) : (
                    currentTournTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-white">{team.teamName}</td>
                        <td className="py-3 px-4 text-white/80">{team.captainName}</td>
                        <td className="py-3 px-4 font-mono text-white/60">{team.captainPhone}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            team.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {team.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            team.checkInStatus === 'CHECKED_IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'
                          }`}>
                            {team.checkInStatus === 'CHECKED_IN' ? 'CHECKED IN' : 'WAITING'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => checkInTournamentTeam(team.id)}
                            className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg transition cursor-pointer ${
                              team.checkInStatus === 'CHECKED_IN'
                                ? 'bg-white/10 text-white/60 hover:bg-white/20'
                                : 'bg-amber-400 text-black hover:bg-amber-300 font-black'
                            }`}
                          >
                            {team.checkInStatus === 'CHECKED_IN' ? 'Checked In' : 'Check In'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Promotional Campaigns, Discount Coupons & Referrals */}
      {/* ========================================================================= */}
      {activeTab === 'PROMOTIONS' && (
        <AdminPromotions />
      )}

      {/* ========================================================================= */}
      {/* TAB 7: Staff Roster & Cash Register Till Audit */}
      {/* ========================================================================= */}
      {activeTab === 'STAFF' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Employee Roster */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Staff Shift Roster & Operators
                </h3>
                <p className="text-xs text-white/50 font-light mt-1">
                  Manage active employees, assign shifts, and verify duty statuses.
                </p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {/* Add Staff Modal */}
            {showAddStaffModal && (
              <form onSubmit={handleAddStaffSubmit} className="p-5 bg-black/60 rounded-2xl border border-amber-400/30 flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Register New Employee / Operator</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="text-white/40 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rohan Joshi"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Assigned Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="Floor Supervisor">Floor Supervisor</option>
                      <option value="Hardware Systems Tech">Hardware Systems Tech</option>
                      <option value="Barista & F&B Lead">Barista & F&B Lead</option>
                      <option value="Front Desk Cashier">Front Desk Cashier</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Shift Timing</label>
                    <select
                      value={newStaffShift}
                      onChange={(e) => setNewStaffShift(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="Morning (09:00 - 17:00)">Morning (09:00 - 17:00)</option>
                      <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                      <option value="Night (20:00 - 04:00)">Night (20:00 - 04:00)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow"
                  >
                    Save Employee
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {employees.map(emp => (
                <div key={emp.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 hover:border-white/20 transition">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{emp.name}</h4>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                      {emp.status}
                    </span>
                  </div>
                  <span className="text-xs text-amber-400/90 font-medium block mt-1">{emp.role}</span>
                  <p className="text-xs text-white/50 mt-1 font-mono">{emp.phone}</p>
                  <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-white/40 font-light flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-white/50" />
                    <span>{emp.shift}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Register Till Audit Tool */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-5">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Counter Cash Register & Drawer Reconciliation
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                Audit cash float, cash collections, and verify drawer balance at shift end.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase font-mono block">Opening Float</span>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  ₹{(employeeShift?.openingCash || 2000).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase font-mono block">Cash Collected</span>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  ₹{(employeeShift?.cashSales || 4850).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase font-mono block">Card / UPI Collected</span>
                <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                  ₹{(employeeShift?.cardSales || 11300).toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/10">
                <span className="text-[10px] text-white/40 uppercase font-mono block">Expected Drawer Till</span>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  ₹{((employeeShift?.openingCash || 2000) + (employeeShift?.cashSales || 4850)).toLocaleString()}
                </div>
              </div>
            </div>

            <form onSubmit={handleReconcileRegister} className="p-5 bg-white/[0.02] rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <label className="text-xs font-black text-white uppercase tracking-wider block mb-1">
                  Actual Physical Cash Counted (₹)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={reconcileCashInput}
                    onChange={(e) => setReconcileCashInput(Number(e.target.value))}
                    className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono font-bold focus:border-amber-400 focus:outline-none w-48"
                  />
                  {(() => {
                    const expected = (employeeShift?.openingCash || 2000) + (employeeShift?.cashSales || 4850);
                    const diff = reconcileCashInput - expected;
                    if (diff === 0) {
                      return <span className="text-xs font-bold text-emerald-400">✓ Drawer Balanced (₹0 diff)</span>;
                    } else if (diff > 0) {
                      return <span className="text-xs font-bold text-cyan-400">+₹{diff} (Surplus Float)</span>;
                    } else {
                      return <span className="text-xs font-bold text-red-400">-₹{Math.abs(diff)} (Cash Discrepancy)</span>;
                    }
                  })()}
                </div>
              </div>

              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
              >
                Reconcile & Audit Drawer
              </button>
            </form>

            {reconcileSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>✓ Cash register audited and reconciliation statement committed to immutable audit log!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Business Profile, Operating Hours & Legal GST Settings */}
      {/* ========================================================================= */}
      {activeTab === 'SETTINGS' && (
        <AdminBusinessSettings />
      )}

      {/* ========================================================================= */}
      {/* TAB 8: System Security Audit Trail */}
      {/* ========================================================================= */}
      {activeTab === 'LOGS' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Security Audit Trail & Administrative Logs
              </h3>
              <p className="text-xs text-white/50 font-light mt-1">
                Immutable event recording of tariff adjustments, drawer reconciliations, stock updates, and rig status locks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAuditLogs}
                className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear non-critical cached audit logs?')) {
                    clearAuditLogs();
                  }
                }}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/10 font-bold text-xs uppercase tracking-wider px-3 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </div>
          </div>

          {/* Search and Category Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'PRICE', 'FNB', 'SYSTEM', 'BOOKING', 'SHIFT', 'AUTH'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setLogsActionFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    logsActionFilter === cat
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px]">
                  <th className="py-3">Timestamp</th>
                  <th className="py-3">User & Authority</th>
                  <th className="py-3">Action Event</th>
                  <th className="py-3">Entity</th>
                  <th className="py-3">Details / Value Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40 text-xs">
                      No logs matching the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 font-mono text-white/50">{log.timestamp}</td>
                      <td className="py-3 font-bold text-white">
                        {log.user} <span className="text-[10px] text-white/40 font-normal">({log.role})</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-mono font-bold border border-white/10">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-amber-400/90 font-mono font-bold">{log.entity}</td>
                      <td className="py-3 text-white/70">
                        {log.newValue}
                        {log.previousValue && (
                          <span className="text-white/40 text-[10px] ml-2 line-through font-mono">
                            ({log.previousValue})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: USER DIRECTORY & GOOGLE SHEETS SYNC */}
      {/* ========================================================================= */}
      {activeTab === 'ACCOUNTS' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Top Info & Sync Overview */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  User Database & Cloud Sync
                </span>
                <span className="text-xs text-white/50 font-mono">
                  {registeredAccounts.length} Total Registered Accounts
                </span>
              </div>
              <h2 className="text-xl font-black uppercase text-white tracking-tight">
                Gamer Accounts, Stored Passwords & Google Sheets Sync
              </h2>
              <p className="text-xs text-white/60 max-w-2xl mt-1 leading-relaxed">
                All registered accounts are authenticated via WhatsApp messaging. User passwords and contact records are saved in the database and can be synchronized directly to your Google Sheet webhook.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExportUsersCsv}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-black uppercase tracking-wider px-4 py-3 rounded-xl shadow-lg transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-white/80" />
                <span>Download Users CSV</span>
              </button>
              <button
                onClick={() => setShowAddGamerModal(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider px-4 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Gamer Account</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Total Registered Users</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {registeredAccounts.length}
              </div>
              <span className="text-[11px] text-white/50 mt-1 block">Active gamer profiles</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">WhatsApp Verified</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                {registeredAccounts.filter(a => a.isWhatsappVerified).length}
              </div>
              <span className="text-[11px] text-emerald-400/80 mt-1 block">100% Authentic phone & email</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Synced to Google Sheet</span>
              <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
                {registeredAccounts.filter(a => a.syncedToGoogleSheet).length}
              </div>
              <span className="text-[11px] text-cyan-400/80 mt-1 block">Backed up in spreadsheet</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Pending Cloud Sync</span>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                {registeredAccounts.filter(a => !a.syncedToGoogleSheet).length}
              </div>
              <span className="text-[11px] text-amber-400/80 mt-1 block">Ready to sync</span>
            </div>
          </div>

          {/* Google Sheets Webhook Integration Card */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-emerald-500/30 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    Google Sheets Real-time Synchronization
                  </h3>
                  <p className="text-xs text-white/60">
                    Connect your Google Sheet via Webhook (Google Apps Script). All registered accounts and passwords sync automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAppsScript}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-white/80 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {scriptCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{scriptCopied ? 'Script Copied!' : 'Copy Apps Script'}</span>
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={sheetWebhookInput}
                  onChange={(e) => {
                    setSheetWebhookInput(e.target.value);
                    setGoogleSheetWebhookUrl(e.target.value);
                  }}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec (Google Apps Script Webhook URL)"
                  className="w-full bg-black/40 border border-white/15 focus:border-emerald-400 text-white text-xs pl-4 pr-4 py-3 rounded-xl outline-none font-mono"
                />
              </div>

              <button
                onClick={handleSyncToGoogleSheet}
                disabled={sheetSyncing}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black uppercase text-xs tracking-wider px-6 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
              >
                {sheetSyncing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Sync Database to Google Sheet</span>
                  </>
                )}
              </button>
            </div>

            {sheetSyncMsg && (
              <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                sheetSyncMsg.error ? 'bg-red-950/60 border border-red-500/40 text-red-300' : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              }`}>
                {sheetSyncMsg.error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{sheetSyncMsg.text}</span>
              </div>
            )}
          </div>

          {/* User Accounts Directory Table */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-tight">
                  Registered Accounts Database
                </h3>
                <p className="text-xs text-white/50">
                  Secure record of all registered gamers with passwords stored for recovery and Google Sheet synchronization.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Search name, tag, email, phone..."
                  className="w-full bg-white/5 border border-white/10 focus:border-white/25 text-white text-xs pl-9 pr-3 py-2 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/80">
                <thead className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="pb-3">User & GamerTag</th>
                    <th className="pb-3">Authentic Email</th>
                    <th className="pb-3">WhatsApp Number</th>
                    <th className="pb-3">Stored Password</th>
                    <th className="pb-3">Identity Auth (OTP)</th>
                    <th className="pb-3">Google Sheet</th>
                    <th className="pb-3">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-white/40">
                        No registered accounts found matching "{accountSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const isRevealed = revealedPasswords[acc.id];
                      return (
                        <tr key={acc.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-white text-xs font-bold font-mono">
                                {acc.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{acc.name}</span>
                                <span className="text-[10px] text-white/40 font-mono">@{acc.gamerTag}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 font-mono text-white/90">
                            {acc.email}
                          </td>

                          <td className="py-3.5 font-mono text-white/90">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{acc.phone}</span>
                            </span>
                          </td>

                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs px-2 py-1 rounded bg-black/50 border border-white/10 text-amber-300">
                                {isRevealed ? acc.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordReveal(acc.id)}
                                className="text-white/40 hover:text-white transition cursor-pointer"
                                title={isRevealed ? "Hide Password" : "Show Password"}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold w-fit ${
                                acc.isEmailVerified !== false
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : 'bg-white/10 text-white/50'
                              }`}>
                                <Check className="w-2.5 h-2.5" />
                                <span>Email OTP: {acc.isEmailVerified !== false ? 'Verified' : 'Pending'}</span>
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold w-fit ${
                                acc.isWhatsappVerified
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-white/10 text-white/50'
                              }`}>
                                <Check className="w-2.5 h-2.5" />
                                <span>WhatsApp: {acc.isWhatsappVerified ? 'Verified' : 'Pending'}</span>
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5">
                            {acc.syncedToGoogleSheet ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                                <Check className="w-3 h-3" />
                                <span>Synced</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 text-white/40 font-mono text-[11px]">
                            {new Date(acc.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Gamer Account Modal */}
          {showAddGamerModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#111] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <h3 className="text-lg font-black uppercase text-white">Add Gamer User</h3>
                  <button
                    onClick={() => setShowAddGamerModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 text-white/60 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddGamerSubmit} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/70 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newGamerName}
                      onChange={(e) => setNewGamerName(e.target.value)}
                      placeholder="e.g. Aryan Khan"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-white/70 mb-1">GamerTag / Alias</label>
                    <input
                      type="text"
                      value={newGamerTag}
                      onChange={(e) => setNewGamerTag(e.target.value)}
                      placeholder="e.g. Aryan_Vanguard"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-white/70 mb-1">Authentic Email ID</label>
                    <input
                      type="email"
                      required
                      value={newGamerEmail}
                      onChange={(e) => setNewGamerEmail(e.target.value)}
                      placeholder="e.g. aryan.gamer@gmail.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-white/70 mb-1">WhatsApp Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={newGamerPhone}
                      onChange={(e) => setNewGamerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-white/70 mb-1">Security Password</label>
                    <input
                      type="text"
                      required
                      value={newGamerPass}
                      onChange={(e) => setNewGamerPass(e.target.value)}
                      placeholder="e.g. securePass2025"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddGamerModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'BREVO_SMTP' && (
        <BrevoSmtpManager />
      )}

      {/* Global Admin Walk-In Session Launch Modal */}
      <AdminWalkInModal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        onSuccess={(msg) => {
          setAdminToast(msg);
          setTimeout(() => setAdminToast(null), 3500);
        }}
      />
    </div>
  );
};
