import PDFDocument from "pdfkit";
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { AuthenticatedRequest } from "../server/auth.js";
import { getMongoDb } from "../server/mongodb.js";

const actor = (req: Request) => (req as AuthenticatedRequest).user;
const money = (paise: unknown) => `₹${(Number(paise || 0) / 100).toFixed(2)}`;
const findInvoice = async (db: any, id: string) => {
  const clauses: any[] = [{ id }];
  if (ObjectId.isValid(id)) clauses.push({ _id: new ObjectId(id) });
  return db.collection("invoices").findOne({ $or: clauses });
};

export async function handleInvoicePdf(req: Request, res: Response) {
  const u = actor(req);
  if (!u) return res.status(401).json({ success: false, error: "Authentication required" });
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ success: false, error: "Invoice id is required" });
  try {
    const db = await getMongoDb();
    const invoice: any = await findInvoice(db, id);
    if (!invoice) return res.status(404).json({ success: false, error: "Invoice not found" });
    const isStaff = ["EMPLOYEE", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(String(u.role));
    if (!isStaff && String(invoice.customerId || "") !== String(u.id)) return res.status(403).json({ success: false, error: "Invoice access denied" });
    if (String(invoice.status) === "VOID") return res.status(409).json({ success: false, error: "Void invoices cannot be downloaded" });

    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Invoice ${invoice.invoiceNumber || invoice.id}`, Author: "Gaming Cafe EPR" } });
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${String(invoice.invoiceNumber || invoice.id).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).text("GAMING CAFE", { align: "center" });
    doc.fontSize(10).text("TAX INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(`Invoice: ${invoice.invoiceNumber || invoice.id}`);
    doc.text(`Issued: ${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleString("en-IN") : "—"}`);
    doc.text(`Payment: ${invoice.paymentStatus || "—"}`);
    doc.moveDown();
    doc.fontSize(12).text("Bill To");
    doc.fontSize(10).text(String(invoice.customerName || invoice.customerEmail || invoice.customerId || "Customer"));
    doc.moveDown();

    const left = 48;
    let y = doc.y;
    doc.fontSize(10).text("Item", left, y);
    doc.text("Qty", 330, y, { width: 45, align: "right" });
    doc.text("Amount", 405, y, { width: 100, align: "right" });
    y += 18;
    doc.moveTo(left, y - 4).lineTo(505, y - 4).stroke();
    for (const item of Array.isArray(invoice.items) ? invoice.items : []) {
      const description = String(item.description || item.name || "Gaming service").slice(0, 80);
      const qty = Number(item.quantity || 1);
      const amount = Number(item.amountPaise || 0);
      doc.fontSize(10).text(description, left, y, { width: 270 });
      doc.text(String(qty), 330, y, { width: 45, align: "right" });
      doc.text(money(amount), 405, y, { width: 100, align: "right" });
      y += 18;
      if (y > 710) { doc.addPage(); y = 55; }
    }
    doc.moveTo(left, y + 2).lineTo(505, y + 2).stroke();
    y += 18;
    doc.text("Subtotal", 330, y, { width: 75, align: "right" }); doc.text(money(invoice.subtotalPaise), 405, y, { width: 100, align: "right" }); y += 18;
    doc.text("Discount", 330, y, { width: 75, align: "right" }); doc.text(`-${money(invoice.discountPaise)}`, 405, y, { width: 100, align: "right" }); y += 18;
    doc.text("Tax", 330, y, { width: 75, align: "right" }); doc.text(money(invoice.taxPaise), 405, y, { width: 100, align: "right" }); y += 22;
    doc.fontSize(12).text("Total", 330, y, { width: 75, align: "right" }); doc.text(money(invoice.totalPaise), 405, y, { width: 100, align: "right" });
    doc.fontSize(8).text("This is a system-generated invoice. Paid invoices are immutable; refunds are represented by separate refund/credit-note records.", 48, 760, { width: 457, align: "center" });
    doc.end();
  } catch (error) {
    console.error("invoice/pdf", error);
    if (!res.headersSent) return res.status(500).json({ success: false, error: "Unable to generate invoice PDF" });
  }
}
