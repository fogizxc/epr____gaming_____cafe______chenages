import type { Booking, GamingSystem } from "../types";

export type BookingFeedResponse = { success: boolean; bookings: Booking[]; count: number; source: "mongodb"; error?: string };
export type ProductionStationsResponse = { success: boolean; stations: GamingSystem[] };
export type AvailabilitySlot = { slot: string; endTime: string; available: boolean; status: string; reason?: string };
export type ProductionAvailabilityResponse = { success: boolean; station: GamingSystem; date: string; slots: AvailabilitySlot[] };
export type RazorpayOrderResponse = { success: boolean; payment: any; razorpay: { keyId: string; orderId: string; amount: number; currency: string } };
export type RazorpayVerifyResponse = { success: boolean; payment: any; invoice?: any; duplicate?: boolean };

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; }
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("nexus_gaming_cafe_v1_accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getProductionAccessToken() {
  return typeof window !== "undefined" ? localStorage.getItem("nexus_gaming_cafe_v1_accessToken") : null;
}

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) throw new Error(data?.error || `Request failed (${response.status})`);
  return data as T;
}

export async function fetchProductionStations() { return request<ProductionStationsResponse>("/api/stations"); }
export async function fetchProductionAvailability(systemId: string, date: string, durationHours: number) {
  const params = new URLSearchParams({ date, duration: String(durationHours) });
  return request<ProductionAvailabilityResponse>(`/api/stations/${encodeURIComponent(systemId)}/availability?${params}`);
}
export async function fetchMyBookings(options?: { status?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", String(options.limit));
  return request<BookingFeedResponse>(`/api/bookings/me${params.size ? `?${params}` : ""}`);
}
export async function cancelBookingOnServer(bookingId: string) {
  return request<{ success: boolean; booking?: Booking; refundPercentage?: number; refundAmount?: number; message?: string }>(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: "POST" });
}
export async function checkInBookingOnServer(bookingId: string) {
  return request<{ success: boolean; booking?: Booking; session?: unknown; message?: string }>(`/api/bookings/${encodeURIComponent(bookingId)}/check-in`, { method: "POST" });
}
export async function rescheduleBookingOnServer(bookingId: string, payload: { newDate: string; newStartTime: string; newSystemId?: string }) {
  return request<{ success: boolean; booking?: Booking; message?: string }>(`/api/bookings/${encodeURIComponent(bookingId)}/reschedule`, { method: "POST", body: JSON.stringify(payload) });
}
export async function createProductionBooking(payload: { systemId: string; date: string; startTime: string; durationHours: number; paymentMethod?: "Cash" | "UPI" | "Card" | "Wallet" | "Membership"; gameTitle?: string; idempotencyKey?: string }) {
  const key = payload.idempotencyKey || makeIdempotencyKey();
  return request<{ success: boolean; booking?: Booking; duplicate?: boolean; message?: string }>("/api/bookings", {
    method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify({ ...payload, idempotencyKey: key }),
  });
}
export async function createBookingPaymentOrder(bookingId: string) {
  return request<RazorpayOrderResponse>("/api/payments/create-order", { method: "POST", headers: { "Idempotency-Key": makeIdempotencyKey() }, body: JSON.stringify({ bookingId }) });
}
export async function verifyBookingPayment(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  return request<RazorpayVerifyResponse>("/api/payments/verify", { method: "POST", body: JSON.stringify(payload) });
}
export async function ensureRazorpayLoaded() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-razorpay]");
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("Unable to load payment checkout")), { once: true }); return; }
    const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.dataset.razorpay = "true"; script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load payment checkout")); document.head.appendChild(script);
  });
  return Boolean(window.Razorpay);
}
export async function payForBooking(booking: Booking, customer: { name?: string; email?: string; phone?: string }) {
  const order = await createBookingPaymentOrder(booking.id);
  const loaded = await ensureRazorpayLoaded();
  if (!loaded || !window.Razorpay) throw new Error("Payment checkout is unavailable");
  return await new Promise<RazorpayVerifyResponse>((resolve, reject) => {
    const checkout = new window.Razorpay!({ key: order.razorpay.keyId, amount: order.razorpay.amount, currency: order.razorpay.currency, name: "Bytes & Brew", description: `Gaming booking ${booking.id}`, order_id: order.razorpay.orderId, prefill: customer, theme: { color: "#e50914" }, modal: { ondismiss: () => reject(new Error("Payment window was closed")) }, handler: async (response: any) => { try { resolve(await verifyBookingPayment(response)); } catch (error) { reject(error); } } });
    checkout.open();
  });
}
