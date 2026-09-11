import type { Booking } from "../types";

export type BookingFeedResponse = { success: boolean; bookings: Booking[]; count: number; source: "mongodb"; error?: string };

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("nexus_gaming_cafe_v1_accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
