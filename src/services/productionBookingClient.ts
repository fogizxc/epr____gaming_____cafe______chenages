import type { Booking, GamingSystem } from "../types";

export type BookingFeedResponse = { success: boolean; bookings: Booking[]; count: number; source: "mongodb"; error?: string };
export type ProductionStationsResponse = { success: boolean; stations: GamingSystem[] };
export type AvailabilitySlot = { slot: string; endTime: string; available: boolean; status: string; reason?: string };
export type ProductionAvailabilityResponse = { success: boolean; station: GamingSystem; date: string; slots: AvailabilitySlot[] };

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

export async function fetchProductionStations() {
  return request<ProductionStationsResponse>("/api/stations");
}

export async function fetchProductionAvailability(systemId: string, date: string, durationHours: number) {
  const params = new URLSearchParams({ date, duration: String(durationHours) });
  return request<ProductionAvailabilityResponse>(`/api/stations/${encodeURIComponent(systemId)}/availability?${params.toString()}`);
}

export async function fetchMyBookings(options?: { status?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", String(options.limit));
  return request<BookingFeedResponse>(`/api/bookings/me${params.size ? `?${params.toString()}` : ""}`);
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
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: JSON.stringify({ ...payload, idempotencyKey: key }),
  });
}
