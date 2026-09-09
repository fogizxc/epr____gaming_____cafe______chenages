import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  User,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  FileSpreadsheet,
  Receipt
} from 'lucide-react';
import { EmployeeShift, CashLedgerEntry } from '../../types';

interface EmployeeShiftViewProps {
  shift: EmployeeShift;
  cashLedger: CashLedgerEntry[];
  onAddLedgerEntry: (type: 'PAYOUT' | 'FLOAT_ADD' | 'FLOAT_DROP', amount: number, description: string) => Promise<{ success: boolean; error?: string }>;
  onEndShift: (data: { physicalCountedCash: number; supervisorNotes?: string }) => Promise<{ success: boolean; error?: string }>;
}

export const EmployeeShiftView: React.FC<EmployeeShiftViewProps> = ({
  shift,
  cashLedger,
  onAddLedgerEntry,
  onEndShift
}) => {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseType, setExpenseType] = useState<'PAYOUT' | 'FLOAT_ADD' | 'FLOAT_DROP'>('PAYOUT');

  // End Shift Reconciliation Modal
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [countedCash, setCountedCash] = useState('');
  const [supervisorNotes, setSupervisorNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const expectedCashInDrawer = shift.openingCash + shift.cashSales - shift.expenses;
  const countedNum = Number(countedCash) || 0;
  const variance = countedNum - expectedCashInDrawer;

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || !expenseDesc.trim()) return;
    setIsProcessing(true);
    setActionError('');
    const res = await onAddLedgerEntry(expenseType, amt, expenseDesc.trim());
    setIsProcessing(false);
    if (res.success) {
      setShowExpenseModal(false);
      setExpenseAmount('');
      setExpenseDesc('');
    } else {
      setActionError(res.error || 'Failed to record entry.');
    }
  };

  const handleReconcileShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countedCash) return;
    setIsProcessing(true);
    setActionError('');
    const res = await onEndShift({
      physicalCountedCash: countedNum,
      supervisorNotes: supervisorNotes.trim()
    });
    setIsProcessing(false);
    if (res.success) {
      setShowEndShiftModal(false);
    } else {
      setActionError(res.error || 'Failed to close shift.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Shift Overview Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-black to-white/[0.02] border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Shift ID: {shift.id}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              {shift.status === 'OPEN' ? 'SHIFT ACTIVE' : 'SHIFT CLOSED'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
            Cash Drawer & Shift Financials
          </h2>
          <div className="text-xs text-white/50 font-light mt-1 flex items-center gap-2">
            <span>Employee: <strong className="text-white">{shift.employeeName}</strong></span>
            <span>•</span>
            <span>Started: <strong className="font-mono text-white/80">{shift.startTime}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payout / Float</span>
          </button>

          {shift.status === 'OPEN' && (
            <button
              onClick={() => {
                setShowEndShiftModal(true);
                setCountedCash(String(expectedCashInDrawer));
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>End Shift & Reconcile</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
            Opening Float
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">
            ₹{shift.openingCash}
          </div>
          <div className="text-[10px] text-white/40 mt-1">Base drawer starting cash</div>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
            Cash Collected
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            +₹{shift.cashSales}
          </div>
          <div className="text-[10px] text-white/40 mt-1">Walk-ins & F&B cash tabs</div>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
            UPI / Digital Sales
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
            ₹{shift.upiSales}
          </div>
          <div className="text-[10px] text-white/40 mt-1">Direct merchant QR & Card</div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/40">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            Net Cash in Drawer
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300">
            ₹{expectedCashInDrawer}
          </div>
          <div className="text-[10px] text-emerald-400/60 mt-1">Target reconciliation total</div>
        </div>
      </div>

      {/* Cash Ledger Transactions Table */}
      <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Shift Cash Ledger Audit Trail
            </h3>
          </div>
          <span className="text-xs font-mono text-white/40">{cashLedger.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Handled By</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {cashLedger.map((entry) => {
                const isPositive = entry.amount > 0;
                return (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-2.5 px-3 text-white/50 text-[11px]">{entry.timestamp}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-white/10 text-white/80 font-bold">
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-white/90">{entry.description}</td>
                    <td className="py-2.5 px-3 text-white/50 font-sans">{entry.performedBy}</td>
                    <td className={`py-2.5 px-3 text-right font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? `+₹${entry.amount}` : `-₹${Math.abs(entry.amount)}`}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">
                      ₹{entry.runningBalance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYOUT / FLOAT MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">Record Cash Entry</h3>
              <button onClick={() => setShowExpenseModal(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Transaction Category</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'PAYOUT' as const, label: 'Expense Payout' },
                    { id: 'FLOAT_ADD' as const, label: 'Add Float' },
                    { id: 'FLOAT_DROP' as const, label: 'Safe Drop' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setExpenseType(t.id)}
                      className={`py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition ${
                        expenseType === t.id
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Reason / Item Description *</label>
                <input
                  type="text"
                  required
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="e.g. Milk & ice restock / courier fee"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-white text-black font-black uppercase tracking-wider transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isProcessing ? 'Recording...' : 'Commit to Cash Ledger'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* END SHIFT RECONCILIATION MODAL */}
      {showEndShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">End Shift & Cash Reconciliation</h3>
              <button onClick={() => setShowEndShiftModal(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Expected Drawer Balance:</span>
                <span className="font-mono font-bold text-white">₹{expectedCashInDrawer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Physically Counted:</span>
                <span className="font-mono font-bold text-emerald-400">₹{countedNum}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                <span>Reconciliation Variance:</span>
                <span
                  className={`font-mono ${
                    variance === 0
                      ? 'text-emerald-400'
                      : variance < 0
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                >
                  {variance === 0 ? '₹0 (Exact Match)' : variance > 0 ? `+₹${variance} (Surplus)` : `-₹${Math.abs(variance)} (Shortage)`}
                </span>
              </div>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleReconcileShift} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                  Physically Counted Cash in Drawer (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                  Supervisor Sign-Off / Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  placeholder="Notes for next shift lead or management..."
                  className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isProcessing ? 'Reconciling...' : 'Confirm Cash Count & Close Shift'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
