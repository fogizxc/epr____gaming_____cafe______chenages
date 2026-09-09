import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { WalletTransaction } from '../../types';
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronRight
} from 'lucide-react';

export const WalletScreen: React.FC = () => {
  const { walletBalance, setWalletBalance } = useCafe();

  const [selectedPreset, setSelectedPreset] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);

  // Transactions ledger
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Fetch initial ledger
  const loadLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await fetch('/api/wallet/transactions');
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const rechargePresets = [
    { amount: 250, bonus: 0, tag: 'Starter' },
    { amount: 500, bonus: 50, tag: '+₹50 Extra' },
    { amount: 1000, bonus: 150, tag: 'Most Popular (+15%)' },
    { amount: 2000, bonus: 350, tag: 'Pro Pack (+17.5%)' },
    { amount: 5000, bonus: 1000, tag: 'Squad Pack (+20%)' }
  ];

  const getRechargeAmount = () => {
    if (customAmount && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    return selectedPreset;
  };

  const currentBonus = () => {
    const amt = getRechargeAmount();
    const preset = rechargePresets.find((p) => p.amount === amt);
    if (preset) return preset.bonus;
    if (amt >= 2000) return Math.floor(amt * 0.175);
    if (amt >= 1000) return Math.floor(amt * 0.15);
    if (amt >= 500) return Math.floor(amt * 0.10);
    return 0;
  };

  const handleRecharge = async () => {
    const amountToRecharge = getRechargeAmount();
    if (!amountToRecharge || amountToRecharge < 50) return;

    setIsProcessing(true);
    setRechargeSuccess(null);

    try {
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountToRecharge,
          method: paymentMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.newBalance);
        setRechargeSuccess(`Successfully credited ₹${data.totalCredited} (including ₹${data.bonus} bonus) to your wallet!`);
        setCustomAmount('');
        loadLedger();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="screen-wallet" className="flex flex-col gap-8 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-emerald-500 block mb-1">
            Nexus Digital Credits
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-400" />
            <span>Café Wallet & Payments</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Instant 1-click station checkouts, café food orders, auto-refunds, and exclusive recharge bonuses up to 20%.
          </p>
        </div>

        <button
          onClick={loadLedger}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition flex items-center gap-2 text-xs font-mono self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingLedger ? 'animate-spin' : ''}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* Cybernetic Balance Card & Recharge Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cybernetic Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#121c15] via-[#0c130e] to-[#070b08] border border-emerald-500/30 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-emerald-400">
                Nexus Gaming Wallet
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="mt-6">
              <span className="text-xs text-white/50 block font-light">Available Total Balance</span>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight mt-1 flex items-baseline gap-1">
                <span>₹{walletBalance.toLocaleString()}</span>
                <span className="text-xs font-sans font-normal text-emerald-400">INR</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-emerald-500/20 flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between text-white/70">
              <span>Promotional Bonus Credits</span>
              <span className="font-mono text-emerald-400 font-bold">₹150</span>
            </div>
            <div className="flex items-center justify-between text-white/70">
              <span>Card Holder</span>
              <span className="text-white font-bold">ANDY PATEL (GC-8921)</span>
            </div>
            <div className="flex items-center justify-between text-white/70">
              <span>Auto-Debit on Session End</span>
              <span className="text-emerald-400 font-bold">ENABLED</span>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Instant Top-Up Panel */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>Instant Wallet Top-Up</span>
              </h3>
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bonus Credits Included</span>
              </span>
            </div>

            {/* Presets Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rechargePresets.map((preset) => {
                const isSelected = selectedPreset === preset.amount && !customAmount;
                return (
                  <button
                    key={preset.amount}
                    onClick={() => {
                      setSelectedPreset(preset.amount);
                      setCustomAmount('');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black font-mono">₹{preset.amount}</span>
                      <div className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-emerald-400 border-emerald-400' : 'border-white/30'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="mt-4">
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Or Enter Custom Amount (Min ₹50)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-mono font-bold">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Payment Gateway Options */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/40 block mb-2">Select Payment Mode</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'UPI' ? 'bg-white text-black font-black' : 'bg-white/5 text-white/70 border-white/10'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'CARD' ? 'bg-white text-black font-black' : 'bg-white/5 text-white/70 border-white/10'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'NETBANKING' ? 'bg-white text-black font-black' : 'bg-white/5 text-white/70 border-white/10'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Netbanking</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback & Confirmation */}
          <div>
            {rechargeSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{rechargeSuccess}</span>
              </div>
            )}

            <button
              onClick={handleRecharge}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{getRechargeAmount()} & Add ₹{getRechargeAmount() + currentBonus()} to Wallet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-white/60" />
              <span>Wallet Activity Ledger</span>
            </h3>
            <p className="text-xs text-white/50">Comprehensive log of credits, refunds, and station checkouts.</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-white/40">
            No transactions found yet.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'RECHARGE' || tx.type === 'REFUND';
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isCredit
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <span className="font-bold text-white block">{tx.description}</span>
                      <span className="text-[10px] text-white/40 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Ref: {tx.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-mono font-black text-sm block ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
                      {isCredit ? '+' : '-'}₹{tx.amount}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      Bal: ₹{tx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
