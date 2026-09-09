import React, { useState } from 'react';
import { Invoice } from '../types';
import { Printer, Download, CheckCircle2, FileText, Receipt, Sparkles } from 'lucide-react';
import { downloadInvoiceReceipt } from '../utils/invoiceDownload';

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL'>('A4');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadInvoiceReceipt(invoice);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.03)] p-4 sm:p-8 my-auto max-h-[92vh] overflow-y-auto text-white backdrop-blur-md animate-in fade-in zoom-in-95">
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white/70 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block">
                Accounting
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Bill & Tax Invoice
              </h3>
              <span className="text-[10px] text-white/40 font-mono">
                {invoice.invoiceNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle: A4 vs Thermal */}
            <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex text-xs">
              <button
                onClick={() => setPrintFormat('A4')}
                className={`px-3 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px] transition cursor-pointer ${
                  printFormat === 'A4' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                A4 Standard
              </button>
              <button
                onClick={() => setPrintFormat('THERMAL')}
                className={`px-3 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px] transition cursor-pointer ${
                  printFormat === 'THERMAL' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                Thermal (80mm)
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs ml-2 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="my-6 overflow-y-auto max-h-[60vh] p-1">
          {printFormat === 'A4' ? (
            /* Standard A4 Layout */
            <div
              id="printable-invoice"
              className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl font-sans text-xs select-text"
            >
              {/* Top Banner */}
              <div className="flex items-start justify-between border-b pb-6">
                <div>
                  <h1 className="text-2xl font-black text-red-600 tracking-wider font-['Rajdhani']">
                    NEXUS ARENA
                  </h1>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">
                    Commercial Esports & Gaming Café
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Plot 42, Connaught Place, New Delhi - 110001
                    <br />
                    GSTIN: 07AAAAA0000A1Z5 • Phone: +91 11 4567 8900
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded uppercase">
                    PAID IN FULL
                  </span>
                  <p className="font-bold text-sm text-slate-800 mt-2 font-mono">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: {invoice.date} {invoice.time}
                  </p>
                </div>
              </div>

              {/* Customer & Station Details */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold uppercase block">Billed To:</span>
                  <span className="text-sm font-bold text-slate-900 block">{invoice.customerName}</span>
                  <span className="text-slate-600">{invoice.customerContact}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold uppercase block">Gaming Station:</span>
                  <span className="text-sm font-bold text-red-600 block">{invoice.systemName}</span>
                  <span className="text-slate-600 block">
                    Service: {invoice.service} ({invoice.startTime} to {invoice.endTime})
                  </span>
                  {invoice.gameTitle && (
                    <span className="text-red-600 font-bold text-[11px] block">
                      Game: {invoice.gameTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full my-4 text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Duration / Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  <tr>
                    <td className="py-2.5">
                      <span className="font-bold text-slate-900 block">Gaming Session ({invoice.systemName})</span>
                      {invoice.membershipHoursUsed > 0 && (
                        <span className="text-[10px] text-emerald-600 block">
                          Included {invoice.membershipHoursUsed}h from Membership Pass
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">{invoice.durationHours} hr(s)</td>
                    <td className="py-2.5 text-right font-mono">₹{invoice.ratePerHour}</td>
                    <td className="py-2.5 text-right font-bold font-mono">
                      ₹{Math.max(0, (invoice.durationHours - invoice.membershipHoursUsed) * invoice.ratePerHour)}
                    </td>
                  </tr>

                  {/* F&B Items */}
                  {invoice.foodItems && invoice.foodItems.map((f, i) => (
                    <tr key={i}>
                      <td className="py-2.5 font-medium text-slate-800">
                        {f.name} (Café Snack POS)
                      </td>
                      <td className="py-2.5 text-center">{f.quantity}</td>
                      <td className="py-2.5 text-right font-mono">₹{f.price}</td>
                      <td className="py-2.5 text-right font-bold font-mono">₹{f.price * f.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation (Section 41) */}
              <div className="border-t pt-4 flex justify-between items-start">
                <div className="text-[11px] text-slate-500 max-w-xs">
                  <p className="font-semibold text-slate-700">Payment Details:</p>
                  <p>Method: {invoice.paymentMethod} • Status: SUCCESS</p>
                  <p>Processed by Staff: {invoice.employeeName}</p>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Thank you for gaming with us! Every session earns Bytes & Brew Loyalty Rewards.
                  </p>
                </div>
                <div className="w-56 space-y-1.5 text-right text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">₹{invoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (5%):</span>
                    <span className="font-mono">₹{invoice.gstTax}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t">
                    <span>Grand Total:</span>
                    <span className="text-red-600 font-mono">₹{invoice.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Thermal 80mm Receipt (Section 44) */
            <div
              id="printable-invoice"
              className="bg-white text-slate-900 p-6 max-w-xs mx-auto rounded-lg font-mono text-[11px] select-text border border-dashed border-slate-400 shadow-md"
            >
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <h2 className="font-bold text-sm tracking-wider">*** NEXUS ARENA ***</h2>
                <p className="text-[10px]">Gaming Café & Esports Hub</p>
                <p className="text-[9px]">Connaught Place, New Delhi</p>
                <p className="text-[9px]">GSTIN: 07AAAAA0000A1Z5</p>
              </div>

              <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-slate-400">
                <div>Rcpt: {invoice.invoiceNumber}</div>
                <div>Date: {invoice.date} {invoice.time}</div>
                <div>Cust: {invoice.customerName}</div>
                <div>Station: {invoice.systemName}</div>
                {invoice.gameTitle && <div>Game: {invoice.gameTitle}</div>}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Gaming ({invoice.durationHours}h)</span>
                  <span>₹{Math.max(0, (invoice.durationHours - invoice.membershipHoursUsed) * invoice.ratePerHour)}</span>
                </div>
                {invoice.foodItems?.map((f, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span>{f.name} x{f.quantity}</span>
                    <span>₹{f.price * f.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 space-y-1 text-right border-b border-dashed border-slate-400">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>GST:</span>
                  <span>₹{invoice.gstTax}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1">
                  <span>TOTAL:</span>
                  <span>₹{invoice.total}</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[9px] text-slate-600">
                <p>PAID VIA {invoice.paymentMethod.toUpperCase()}</p>
                <p>CASHIER: {invoice.employeeName}</p>
                <p className="mt-1 font-bold">*** THANK YOU! GAME ON ***</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            Compliant with Section 42–44 commercial billing standards
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Downloaded' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)] transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
