import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  RotateCcw,
  FileText
} from 'lucide-react';
import { Invoice, RefundRequest } from '../../types';

interface EmployeeBillingViewProps {
  invoices: Invoice[];
  refundRequests: RefundRequest[];
  onRequestRefund: (invoiceId: string, amount: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  onProcessRefund: (refundId: string, action: 'APPROVE' | 'REJECT') => Promise<{ success: boolean; error?: string }>;
}

export const EmployeeBillingView: React.FC<EmployeeBillingViewProps> = ({
  invoices,
  refundRequests,
  onRequestRefund,
  onProcessRefund
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Refund Modal
  const [refundModalInvoice, setRefundModalInvoice] = useState<Invoice | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Hardware technical fault');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundMsg, setRefundMsg] = useState('');

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.includes(searchQuery))
  );

  const handleOpenRefundModal = (inv: Invoice) => {
    setRefundModalInvoice(inv);
    setRefundAmount(inv.totalAmount);
    setRefundReason('Hardware / rig technical glitch');
    setRefundMsg('');
  };

  const handleSubmitRefund = async () => {
    if (!refundModalInvoice) return;
    setIsRefunding(true);
    setRefundMsg('');
    const res = await onRequestRefund(refundModalInvoice.id, refundAmount, refundReason);
    setIsRefunding(false);
    if (res.success) {
      setRefundMsg('Refund processed successfully!');
      setTimeout(() => setRefundModalInvoice(null), 1200);
    } else {
      setRefundMsg(res.error || 'Failed to submit refund.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Billing Ledger & Invoices
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Audit gaming time tabs, generate thermal 80mm receipts & issue supervisor refunds.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, customer..."
            className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase tracking-wider font-mono">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3 font-bold text-white">{inv.id}</td>
                  <td className="py-3 px-3 font-sans text-white/90">
                    <div>{inv.customerName}</div>
                    <div className="text-[10px] text-white/40 font-mono">{inv.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-white/50 text-[11px]">{inv.date}</td>
                  <td className="py-3 px-3 text-white/70">{inv.paymentMethod}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                          : 'bg-red-950/60 border border-red-500/40 text-red-400'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-400">
                    ₹{inv.totalAmount}
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-sans text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Receipt
                    </button>
                    {inv.status === 'PAID' && (
                      <button
                        onClick={() => handleOpenRefundModal(inv)}
                        className="px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 font-sans text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* THERMAL RECEIPT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-black rounded-2xl p-6 font-mono text-xs shadow-2xl space-y-4">
            {/* Receipt Header */}
            <div className="text-center border-b border-black/20 pb-3">
              <h3 className="font-black text-base uppercase tracking-tight">BYTES & BREW</h3>
              <p className="text-[10px] text-black/60 uppercase">High-Performance Gaming Lounge & Café</p>
              <p className="text-[10px] text-black/40">Cyber City Hub • GSTIN: 07AAACB1234F1Z5</p>
            </div>

            {/* Meta */}
            <div className="text-[11px] space-y-0.5 border-b border-black/10 pb-2">
              <div>Invoice: #{selectedInvoice.id}</div>
              <div>Date: {selectedInvoice.date}</div>
              <div>Customer: {selectedInvoice.customerName} ({selectedInvoice.customerPhone})</div>
              <div>Payment: {selectedInvoice.paymentMethod}</div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5 border-b border-black/10 pb-3">
              <div className="flex justify-between font-bold text-[10px] text-black/60 uppercase">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between">
                <span>Gaming Session Hours</span>
                <span>₹{selectedInvoice.gamingCharge}</span>
              </div>
              {selectedInvoice.fnbCharge > 0 && (
                <div className="flex justify-between">
                  <span>Café Refreshments</span>
                  <span>₹{selectedInvoice.fnbCharge}</span>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="pt-1 text-sm font-black flex justify-between">
              <span>TOTAL PAID:</span>
              <span>₹{selectedInvoice.totalAmount}</span>
            </div>

            {/* QR Barcode placeholder */}
            <div className="text-center pt-2 text-[10px] text-black/50 border-t border-black/10">
              <div className="tracking-widest font-bold">||| |||| | ||||| || ||||</div>
              <div className="mt-1">Thank you for gaming at Bytes & Brew!</div>
            </div>

            {/* Print & Close */}
            <div className="pt-3 border-t border-black/10 flex gap-2 font-sans">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2 bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-black/20 text-black font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-500" />
                <h3 className="text-base font-black uppercase tracking-tight">
                  Authorize Refund: #{refundModalInvoice.id}
                </h3>
              </div>
              <button
                onClick={() => setRefundModalInvoice(null)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-white/60 space-y-1">
              <div>Customer: <strong className="text-white">{refundModalInvoice.customerName}</strong></div>
              <div>Original Bill Total: <strong className="text-emerald-400 font-mono">₹{refundModalInvoice.totalAmount}</strong></div>
            </div>

            {refundMsg && (
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs">
                {refundMsg}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                Refund Amount (₹)
              </label>
              <input
                type="number"
                value={refundAmount}
                max={refundModalInvoice.totalAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                Reason for Refund *
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Hardware / rig technical glitch" className="bg-black text-white">Hardware / rig technical glitch</option>
                <option value="Game crash / server disconnect" className="bg-black text-white">Game crash / server disconnect</option>
                <option value="Accidental duplicate charge" className="bg-black text-white">Accidental duplicate charge</option>
                <option value="Customer had to leave early (Goodwill)" className="bg-black text-white">Customer had to leave early (Goodwill)</option>
              </select>
            </div>

            <button
              onClick={handleSubmitRefund}
              disabled={isRefunding || refundAmount <= 0}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50"
            >
              {isRefunding ? 'Processing Refund...' : 'Authorize Refund'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
