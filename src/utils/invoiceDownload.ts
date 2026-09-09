import { Invoice } from '../types';

/**
 * Downloads a single invoice as a self-contained, beautifully styled HTML receipt file
 * that can be opened in any browser, archived, or printed directly to PDF.
 */
export function downloadInvoiceReceipt(invoice: Invoice): void {
  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bytes & Brew Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    @media print {
      body { padding: 0 !important; background: #fff !important; }
      .no-print { display: none !important; }
      .invoice-card { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; padding: 20px !important; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 40px 16px;
      line-height: 1.5;
    }
    .invoice-card {
      background: #ffffff;
      max-width: 680px;
      margin: 0 auto;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
      padding: 36px 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #dc2626;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #dc2626;
      margin: 0;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
      color: #475569;
      margin-top: 4px;
    }
    .brand-address {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.4;
    }
    .inv-header-right {
      text-align: right;
    }
    .paid-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #bbf7d0;
    }
    .inv-number {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 8px;
      font-family: monospace;
    }
    .inv-date {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 28px;
      font-size: 13px;
    }
    .info-block strong {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    .table th {
      text-align: left;
      background: #f8fafc;
      padding: 12px 14px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    .table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .totals-wrapper {
      margin-left: auto;
      width: 280px;
      margin-bottom: 28px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .grand-total {
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      margin-top: 6px;
      font-size: 17px;
      font-weight: 900;
      color: #dc2626;
    }
    .footer-note {
      text-align: center;
      border-top: 1px dashed #cbd5e1;
      padding-top: 20px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .print-btn {
      display: inline-block;
      background: #dc2626;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 20px;
      cursor: pointer;
      border: none;
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 680px; margin: 0 auto 16px auto; text-align: right;">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="invoice-card" id="invoice">
    <div class="header">
      <div>
        <h1 class="brand-title">Bytes & Brew</h1>
        <div class="brand-sub">Gaming Café & Artisan Coffee Lounge</div>
        <div class="brand-address">
          Plot 42, Connaught Place, New Delhi - 110001<br>
          GSTIN: 07AAAAA0000A1Z5 • Phone: +91 11 4567 8900
        </div>
      </div>
      <div class="inv-header-right">
        <span class="paid-badge">PAID IN FULL</span>
        <div class="inv-number">${invoice.invoiceNumber}</div>
        <div class="inv-date">Date: ${invoice.date} ${invoice.time}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <strong>Customer Details</strong>
        <div style="font-weight: 700; font-size: 14px;">${invoice.customerName}</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 2px;">${invoice.customerContact}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Session ID: ${invoice.bookingId}</div>
      </div>
      <div class="info-block">
        <strong>Hardware Station</strong>
        <div style="font-weight: 700; font-size: 14px;">${invoice.systemName}</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Service: ${invoice.service}</div>
        ${invoice.gameTitle ? `<div style="color: #dc2626; font-size: 12px; font-weight: 600; margin-top: 2px;">Game: ${invoice.gameTitle}</div>` : ''}
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Time: ${invoice.startTime} – ${invoice.endTime} (${invoice.durationHours} hrs)</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Hours / Qty</th>
          <th style="text-align: right;">Unit Rate</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div style="font-weight: 600;">Gaming Station Access (${invoice.systemName})</div>
            <div style="font-size: 11px; color: #64748b;">${invoice.service}${invoice.gameTitle ? ' • ' + invoice.gameTitle : ''}</div>
          </td>
          <td style="text-align: center; font-weight: 600;">${invoice.durationHours} hrs</td>
          <td style="text-align: right;">₹${invoice.ratePerHour}</td>
          <td style="text-align: right; font-weight: 600;">₹${Math.max(0, (invoice.durationHours - invoice.membershipHoursUsed) * invoice.ratePerHour)}</td>
        </tr>
        ${invoice.membershipHoursUsed > 0 ? `
        <tr>
          <td style="color: #16a34a;">
            <div style="font-weight: 600;">↳ Membership Hour Credit</div>
            <div style="font-size: 11px;">Hours covered by active membership plan</div>
          </td>
          <td style="text-align: center; color: #16a34a; font-weight: 600;">-${invoice.membershipHoursUsed} hrs</td>
          <td style="text-align: right; color: #16a34a;">₹${invoice.ratePerHour}</td>
          <td style="text-align: right; color: #16a34a; font-weight: 600;">-₹${invoice.membershipHoursUsed * invoice.ratePerHour}</td>
        </tr>
        ` : ''}
        ${invoice.foodItems.map(f => `
        <tr>
          <td>
            <div style="font-weight: 600;">${f.name}</div>
            <div style="font-size: 11px; color: #64748b;">Café F&B Snack Bar</div>
          </td>
          <td style="text-align: center;">${f.quantity}</td>
          <td style="text-align: right;">₹${f.price}</td>
          <td style="text-align: right; font-weight: 600;">₹${f.price * f.quantity}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper">
      <div class="total-row">
        <span>Gaming & Refreshment Subtotal:</span>
        <span style="font-weight: 600;">₹${invoice.subtotal}</span>
      </div>
      <div class="total-row">
        <span>GST Tax (5% SGST + CGST):</span>
        <span>₹${invoice.gstTax}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Paid:</span>
        <span>₹${invoice.total}</span>
      </div>
    </div>

    <div class="footer-note">
      <strong>PAYMENT VERIFIED • ${invoice.paymentMethod.toUpperCase()}</strong><br>
      Attending Cashier: ${invoice.employeeName} • Commercial Gaming License #DEL-88219<br>
      This is a computer-generated tax invoice valid under commercial cafe regulations.<br>
      Keep this document for your personal gaming accounting and membership records.
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Bytes-Brew-Invoice-${invoice.invoiceNumber}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exports all past session invoices to a CSV spreadsheet file
 */
export function exportSessionsCsv(invoices: Invoice[]): void {
  const headers = [
    'Invoice Number',
    'Date',
    'Time',
    'Customer Name',
    'Contact',
    'Station',
    'Category',
    'Game Title',
    'Duration (Hours)',
    'Rate/Hour (INR)',
    'Membership Hours Used',
    'F&B Total Items',
    'Subtotal (INR)',
    'GST Tax (INR)',
    'Total Spent (INR)',
    'Payment Method',
    'Status',
    'Cashier'
  ];

  const rows = invoices.map(inv => {
    const fnbSummary = inv.foodItems.map(f => `${f.quantity}x ${f.name}`).join('; ');
    return [
      `"${inv.invoiceNumber}"`,
      `"${inv.date}"`,
      `"${inv.time}"`,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      `"${inv.customerContact}"`,
      `"${inv.systemName}"`,
      `"${inv.service}"`,
      `"${(inv.gameTitle || 'Standard Session').replace(/"/g, '""')}"`,
      inv.durationHours,
      inv.ratePerHour,
      inv.membershipHoursUsed,
      `"${fnbSummary.replace(/"/g, '""')}"`,
      inv.subtotal,
      inv.gstTax,
      inv.total,
      `"${inv.paymentMethod}"`,
      `"${inv.paymentStatus}"`,
      `"${inv.employeeName}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bytes-Brew-Gaming-Sessions-Ledger-${new Date().toISOString().substring(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
