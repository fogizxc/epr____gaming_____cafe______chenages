import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { Invoice } from '../../types';
import {
  FileText,
  Wallet,
  Receipt,
  Download,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Search,
  History
} from 'lucide-react';
import { downloadInvoiceReceipt } from '../../utils/invoiceDownload';

export const AccountsScreen: React.FC = () => {
  const {
    invoices,
    walletBalance,
    rechargeWallet,
    setActiveInvoiceForModal,
    loyaltyPoints,
    setActiveNav
  } = useCafe();

  const [filterMethod, setFilterMethod] = useState<'ALL' | 'UPI' | 'Cash' | 'Card' | 'Wallet'>('ALL');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [downloadedInvId, setDownloadedInvId] = useState<string | null>(null);

  const handleDownload = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadInvoiceReceipt(inv);
    setDownloadedInvId(inv.id);
    setTimeout(() => setDownloadedInvId(null), 2500);
  };

  const handleRecharge = (amount: number) => {
    rechargeWallet(amount);
    setRechargeSuccess(true);
    setTimeout(() => setRechargeSuccess(false), 2500);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesMethod = filterMethod === 'ALL' || inv.paymentMethod === filterMethod;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      inv.systemName.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchInvoice.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  const totalSpent = invoices.reduce((acc, inv) => acc + inv.total, 0);

  return (
    <div id="screen-accounts" className="w-full flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Financial Ledger & Payments
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-white/80" />
            <span>Accounts, Billing & Invoices</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Review official thermal receipts, top up your instant prepaid wallet, and audit your session expenses.
          </p>
        </div>

        {/* Quick Summary Pills & Session History Link */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActiveNav('history')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-600/15 hover:bg-red-600/25 border border-red-600/30 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span>Session History →</span>
          </button>
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-widest text-white/40 block font-mono">
              Total Spent (YTD)
            </span>
            <span className="text-xl font-black text-white font-mono">
              ₹{totalSpent.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-widest text-white/40 block font-mono">
              Rewards Balance
            </span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {loyaltyPoints} PTS
            </span>
          </div>
        </div>
      </div>

      {/* Prepaid Wallet Instant Top-Up Card */}
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                Prepaid Digital Wallet
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Instant Checkout Active
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono">
                ₹{walletBalance.toLocaleString()}
              </span>
              <span className="text-xs text-white/40">Available Balance</span>
            </div>
            <p className="text-xs text-white/50 mt-1 font-light">
              Use for fast 1-tap gaming sessions, instant booking confirmations, and Café F&B snack orders.
            </p>
          </div>

          {/* Quick Recharge Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              Instant Top-Up:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleRecharge(amt)}
                  className="py-2 px-3 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-white text-xs font-bold font-mono rounded-xl transition cursor-pointer active:scale-95"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
            {rechargeSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Wallet recharged successfully!</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Official Invoices & Receipts Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/60" />
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">
              Official Billing Invoices & Receipts
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-white/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-bold font-mono">
              {filteredInvoices.length} Records
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, rig..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 w-44 sm:w-56"
              />
            </div>

            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="ALL" className="bg-black text-white">All Payments</option>
              <option value="UPI" className="bg-black text-white">UPI</option>
              <option value="Cash" className="bg-black text-white">Cash</option>
              <option value="Card" className="bg-black text-white">Card</option>
              <option value="Wallet" className="bg-black text-white">Wallet</option>
            </select>
          </div>
        </div>

        {/* Invoices List / Cards */}
        {filteredInvoices.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-white/40 text-xs">
            No invoices found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                id={`invoice-card-${inv.id}`}
                onClick={() => setActiveInvoiceForModal(inv)}
                className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-white/25 flex flex-col justify-between cursor-pointer transition-all duration-200 group shadow-[0_0_15px_rgba(255,255,255,0.02)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-white/90">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <span className="text-base font-black text-white font-mono">
                      ₹{inv.total}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white uppercase tracking-tight mt-2">
                    {inv.systemName} • {inv.service} ({inv.durationHours}h)
                  </h3>
                  {inv.gameTitle && (
                    <div className="text-[11px] text-red-400 font-bold mt-0.5">
                      Game: {inv.gameTitle}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-white/50 space-y-0.5 font-light">
                    <p>Date: <strong className="text-white/80 font-mono">{inv.date} {inv.time}</strong></p>
                    <p>Billed to: <strong className="text-white/80">{inv.customerName}</strong></p>
                    <p>Payment: <strong className="text-white/80">{inv.paymentMethod}</strong> • GST (5%): ₹{inv.gstTax}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => handleDownload(inv, e)}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition cursor-pointer"
                    title="Download receipt file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadedInvId === inv.id ? 'Saved!' : 'Download'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveInvoiceForModal(inv);
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>View Bill →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
