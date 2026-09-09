import React, { useState, useMemo } from 'react';
import { useCafe } from '../../context/CafeContext';
import { Invoice, GamingServiceCategory } from '../../types';
import {
  History,
  Clock,
  Download,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Gamepad2,
  Tv,
  CheckCircle2,
  Utensils,
  CreditCard,
  Wallet,
  Calendar,
  Layers,
  ChevronRight,
  Printer
} from 'lucide-react';
import { downloadInvoiceReceipt, exportSessionsCsv } from '../../utils/invoiceDownload';

interface SessionHistoryScreenProps {
  onOpenBooking?: (category?: GamingServiceCategory) => void;
}

export const SessionHistoryScreen: React.FC<SessionHistoryScreenProps> = ({
  onOpenBooking
}) => {
  const { invoices, setActiveInvoiceForModal } = useCafe();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | '7DAYS' | '30DAYS'>('ALL');
  const [downloadedInvoiceId, setDownloadedInvoiceId] = useState<string | null>(null);

  // Available platform categories in historical data
  const categories = ['ALL', 'Gaming PC', 'PlayStation', 'VIP Room', 'Sim Racing', 'Pool Table'];

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const matchesCategory =
          inv.service === selectedCategory ||
          (selectedCategory === 'PlayStation' && (inv.service === 'PS5' || inv.service === 'PlayStation')) ||
          (selectedCategory === 'Gaming PC' && (inv.service === 'PC' || inv.service === 'Gaming PC'));
        if (!matchesCategory) return false;
      }

      // Time filter
      if (timeFilter !== 'ALL') {
        const invDate = new Date(inv.date);
        const now = new Date();
        const diffDays = (now.getTime() - invDate.getTime()) / (1000 * 3600 * 24);
        if (timeFilter === '7DAYS' && diffDays > 7) return false;
        if (timeFilter === '30DAYS' && diffDays > 30) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.systemName.toLowerCase().includes(q) ||
          inv.service.toLowerCase().includes(q) ||
          (inv.gameTitle && inv.gameTitle.toLowerCase().includes(q)) ||
          inv.customerName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, selectedCategory, timeFilter, searchQuery]);

  // Telemetry Aggregates
  const stats = useMemo(() => {
    const totalSessions = invoices.length;
    const totalHours = invoices.reduce((acc, inv) => acc + inv.durationHours, 0);
    const totalSpent = invoices.reduce((acc, inv) => acc + inv.total, 0);
    const membershipHoursSaved = invoices.reduce((acc, inv) => acc + (inv.membershipHoursUsed || 0), 0);
    const estimatedSavings = invoices.reduce((acc, inv) => acc + ((inv.membershipHoursUsed || 0) * inv.ratePerHour), 0);

    return {
      totalSessions,
      totalHours,
      totalSpent,
      membershipHoursSaved,
      estimatedSavings
    };
  }, [invoices]);

  const handleDownloadInvoice = (inv: Invoice) => {
    downloadInvoiceReceipt(inv);
    setDownloadedInvoiceId(inv.id);
    setTimeout(() => {
      setDownloadedInvoiceId(null);
    }, 3000);
  };

  const handleExportCsv = () => {
    exportSessionsCsv(filteredInvoices.length > 0 ? filteredInvoices : invoices);
  };

  // Helper to resolve service category for re-booking
  const resolveCategory = (service: string): GamingServiceCategory => {
    if (service.includes('VIP')) return 'VIP Room';
    if (service.includes('PlayStation') || service.includes('PS5')) return 'PlayStation';
    if (service.includes('Xbox')) return 'Xbox';
    if (service.includes('Sim')) return 'Sim Racing';
    if (service.includes('Pool')) return 'Pool Table';
    return 'Gaming PC';
  };

  return (
    <div id="screen-session-history" className="w-full flex flex-col gap-6 pb-16 animate-fadeIn">
      {/* 1. EDITORIAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block">
              Gaming History & Billing Records
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-600/30 text-[9px] font-bold text-red-400 uppercase tracking-widest">
              Live Ledger
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-white/90" />
            <span>Session History</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-2xl">
            Review your completed gaming sessions across all stations, track hours and total spend,
            and download official past invoices for your records.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-export-sessions-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white transition cursor-pointer"
            title="Download full history as CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-white/60" />
            <span>Export CSV</span>
          </button>

          {onOpenBooking && (
            <button
              id="btn-book-new-session"
              onClick={() => onOpenBooking()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-[0_0_20px_rgba(220,38,38,0.35)]"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Book New Session</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TELEMETRY AGGREGATES CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest">Sessions Completed</span>
            <Layers className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats.totalSessions}
          </div>
          <div className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>All invoices verified & paid</span>
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest">Total Playtime</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {stats.totalHours.toFixed(1)} <span className="text-sm text-white/50">hrs</span>
          </div>
          <div className="text-[11px] text-white/50 mt-1">
            Across Arena PCs & Consoles
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest">Total Spent (YTD)</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ₹{stats.totalSpent.toLocaleString()}
          </div>
          <div className="text-[11px] text-white/50 mt-1">
            Includes station time & F&B
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest">Membership Savings</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            ₹{stats.estimatedSavings.toLocaleString()}
          </div>
          <div className="text-[11px] text-white/50 mt-1">
            {stats.membershipHoursSaved} membership hrs used
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH CONTROLS */}
      <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="session-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by rig, game title, or invoice #..."
            className="w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] text-xs sm:text-sm text-white pl-10 pr-8 py-2.5 rounded-xl border border-white/10 focus:border-white/30 focus:outline-none transition-all placeholder:text-white/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category & Date Range Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'All Rigs' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setTimeFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                timeFilter === 'ALL' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('30DAYS')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                timeFilter === '30DAYS' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeFilter('7DAYS')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
                timeFilter === '7DAYS' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
      </div>

      {/* 4. PAST SESSIONS LIST */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs uppercase font-mono tracking-widest text-white/50">
            Showing {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Session' : 'Sessions'}
          </span>
          <span className="text-[11px] text-white/40">
            Click &apos;Download Invoice&apos; to archive tax receipts
          </span>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white uppercase tracking-tight">
              No matching sessions found
            </h3>
            <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'ALL' || timeFilter !== 'ALL'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'You have no recorded past gaming sessions yet.'}
            </p>
            {(searchQuery || selectedCategory !== 'ALL' || timeFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setTimeFilter('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold uppercase tracking-wider text-white transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isJustDownloaded = downloadedInvoiceId === inv.id;
            const hasFood = inv.foodItems && inv.foodItems.length > 0;
            const hasMembershipDeduction = inv.membershipHoursUsed > 0;

            return (
              <div
                key={inv.id}
                id={`session-card-${inv.id}`}
                className="group p-5 sm:p-6 rounded-2xl bg-[#0a0a0a] hover:bg-[#0f0f0f] border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden"
              >
                {/* Station & Game Information */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 group-hover:scale-105 transition-transform shrink-0">
                    {inv.service.includes('VIP') ? (
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    ) : inv.service.includes('PlayStation') || inv.service.includes('PS5') ? (
                      <Gamepad2 className="w-6 h-6 text-blue-400" />
                    ) : inv.service.includes('Sim') ? (
                      <Tv className="w-6 h-6 text-red-400" />
                    ) : (
                      <Gamepad2 className="w-6 h-6 text-white/80" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                        {inv.systemName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/15">
                        {inv.service}
                      </span>
                      {inv.gameTitle && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-600/30">
                          {inv.gameTitle}
                        </span>
                      )}
                    </div>

                    {/* Date & Time Slot */}
                    <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-white/40" />
                        {inv.date}
                      </span>
                      <span>•</span>
                      <span className="font-mono">
                        {inv.startTime} – {inv.endTime}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-white/40">
                        Inv: {inv.invoiceNumber}
                      </span>
                    </div>

                    {/* F&B Ordered during session */}
                    {hasFood && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-amber-400/80" />
                          Snack Bar:
                        </span>
                        {inv.foodItems.map((f, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] text-white/70 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5"
                          >
                            {f.quantity}x {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Duration & Total Spend Details */}
                <div className="flex items-center justify-between lg:justify-end gap-6 sm:gap-8 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                  {/* Duration breakdown */}
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block">
                      Duration
                    </span>
                    <div className="text-base font-black text-white font-mono mt-0.5">
                      {inv.durationHours} hrs
                    </div>
                    {hasMembershipDeduction ? (
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        {inv.membershipHoursUsed}h Membership Pass
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/40 block">
                        @ ₹{inv.ratePerHour}/hr
                      </span>
                    )}
                  </div>

                  {/* Total spent */}
                  <div className="text-right min-w-[5rem]">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block">
                      Total Spent
                    </span>
                    <div className="text-xl font-black text-white font-mono mt-0.5">
                      ₹{inv.total.toLocaleString()}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block">
                      via {inv.paymentMethod}
                    </span>
                  </div>

                  {/* Links to Download Past Invoices */}
                  <div className="flex items-center gap-2">
                    {/* Direct Download Invoice Button */}
                    <button
                      id={`btn-download-inv-${inv.id}`}
                      onClick={() => handleDownloadInvoice(inv)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                        isJustDownloaded
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : 'bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border-white/15'
                      }`}
                      title="Download full tax invoice file for your records"
                    >
                      {isJustDownloaded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-white/70" />
                          <span>Download</span>
                        </>
                      )}
                    </button>

                    {/* View Tax Bill Modal Button */}
                    <button
                      id={`btn-view-inv-${inv.id}`}
                      onClick={() => setActiveInvoiceForModal(inv)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white transition cursor-pointer"
                      title="View & print full tax invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Quick Re-book Rig Button */}
                    {onOpenBooking && (
                      <button
                        onClick={() => onOpenBooking(resolveCategory(inv.service))}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-red-600/20 hover:border-red-600/40 border border-white/15 text-white/70 hover:text-red-400 transition cursor-pointer"
                        title="Book this station again"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. TAX INVOICE COMPLIANCE FOOTER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/40" />
          <span>
            All invoices generated under GSTIN: 07AAAAA0000A1Z5. Invoices are stored permanently in local ledger.
          </span>
        </div>
        <div className="text-[11px] font-mono text-white/40">
          Need physical duplicate? Visit the Front Desk.
        </div>
      </div>
    </div>
  );
};
