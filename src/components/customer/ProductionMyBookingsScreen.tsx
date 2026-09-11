import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Clock3, QrCode, RefreshCw, Repeat, Trash2, X } from "lucide-react";
import type { Booking } from "../../types";
import { cancelBookingOnServer, checkInBookingOnServer, fetchMyBookings, rescheduleBookingOnServer } from "../../services/productionBookingClient";

interface Props { onOpenBooking: (category?: any) => void; }

type Tab = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "ALL";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("nexus_gaming_cafe_v1_accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const statusClass = (status: string) => status === "ACTIVE" || status === "CHECKED_IN" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : status === "CANCELLED" || status === "NO-SHOW" ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30";

export const ProductionMyBookingsScreen: React.FC<Props> = ({ onOpenBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<Tab>("UPCOMING");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedQr, setSelectedQr] = useState<Booking | null>(null);
  const [selectedCancel, setSelectedCancel] = useState<Booking | null>(null);
  const [selectedReschedule, setSelectedReschedule] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("18:00");
  const [newSystemId, setNewSystemId] = useState("");
  const [clock, setClock] = useState(Date.now());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexus_gaming_cafe_v1_accessToken") : null;
      if (!token) throw new Error("Please sign in to load your live bookings.");
      const data = await fetchMyBookings({ limit: 100 });
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (e: any) {
      setError(e?.message || "Unable to load live bookings.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); const id = window.setInterval(() => void load(true), 30000); return () => window.clearInterval(id); }, [load]);
  useEffect(() => { const id = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(id); }, []);

  const filtered = useMemo(() => bookings.filter(b => tab === "ALL" ? true : tab === "UPCOMING" ? ["UPCOMING", "CONFIRMED"].includes(b.bookingStatus) : tab === "ACTIVE" ? ["ACTIVE", "CHECKED_IN"].includes(b.bookingStatus) : tab === "COMPLETED" ? b.bookingStatus === "COMPLETED" : ["CANCELLED", "NO-SHOW"].includes(b.bookingStatus)), [bookings, tab]);
  const count = (t: Tab) => t === "ALL" ? bookings.length : t === "UPCOMING" ? bookings.filter(b => ["UPCOMING", "CONFIRMED"].includes(b.bookingStatus)).length : t === "ACTIVE" ? bookings.filter(b => ["ACTIVE", "CHECKED_IN"].includes(b.bookingStatus)).length : t === "COMPLETED" ? bookings.filter(b => b.bookingStatus === "COMPLETED").length : bookings.filter(b => ["CANCELLED", "NO-SHOW"].includes(b.bookingStatus)).length;

  const doCancel = async () => {
    if (!selectedCancel) return;
    try {
      const data = await cancelBookingOnServer(selectedCancel.id);
      setNotice(data.message || "Booking cancelled successfully.");
      setSelectedCancel(null);
      await load(true);
    } catch (e: any) { setError(e?.message || "Cancellation failed."); }
  };
  const doCheckIn = async (b: Booking) => {
    try { const data = await checkInBookingOnServer(b.id); setNotice(data.message || "Check-in successful."); await load(true); }
    catch (e: any) { setError(e?.message || "Check-in failed."); }
  };
  const doReschedule = async () => {
    if (!selectedReschedule || !newDate || !newTime) return;
    try {
      const data = await rescheduleBookingOnServer(selectedReschedule.id, { newDate, newStartTime: newTime, newSystemId: newSystemId || undefined });
      setNotice(data.message || "Booking rescheduled successfully."); setSelectedReschedule(null); await load(true);
    } catch (e: any) { setError(e?.message || "Reschedule failed."); }
  };

  return <div className="flex flex-col gap-6 pb-12 animate-fadeIn select-none">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
      <div><span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600">Live MongoDB Booking Feed</span><h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3 mt-1"><Calendar className="w-8 h-8" />My Bookings</h1><p className="text-sm text-white/50 mt-1">Server-authoritative reservations, check-in, cancellation and rescheduling.</p></div>
      <div className="flex gap-2"><button onClick={() => void load(true)} disabled={refreshing} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />Sync</button><button onClick={() => onOpenBooking("Gaming PC")} className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase">Book New Station</button></div>
    </div>
    {(error || notice) && <div className={`p-4 rounded-2xl border text-xs font-bold ${error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>{error || notice}<button className="float-right text-white/50" onClick={() => { setError(null); setNotice(null); }}><X className="w-4 h-4" /></button></div>}
    <div className="flex gap-2 overflow-x-auto pb-2">{(["UPCOMING","ACTIVE","COMPLETED","CANCELLED","ALL"] as Tab[]).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap ${tab === t ? "bg-white text-black" : "bg-white/5 text-white/60"}`}>{t} <span className="ml-1 opacity-60">{count(t)}</span></button>)}</div>
    {loading ? <div className="p-16 rounded-3xl bg-[#0c0c0c] border border-white/10 text-center text-white/50 text-sm">Loading live reservations…</div> : filtered.length === 0 ? <div className="p-16 rounded-3xl bg-[#0c0c0c] border border-white/10 text-center"><Calendar className="w-12 h-12 mx-auto text-white/15 mb-4" /><h3 className="text-white font-black uppercase">No {tab.toLowerCase()} bookings</h3><button onClick={() => onOpenBooking("Gaming PC")} className="mt-5 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase">Reserve a Rig</button></div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{filtered.map(b => {
      const upcoming = ["UPCOMING","CONFIRMED"].includes(b.bookingStatus), active = ["ACTIVE","CHECKED_IN"].includes(b.bookingStatus);
      const end = new Date(`${b.date}T${b.endTime}:00+05:30`).getTime(); const remaining = end - clock;
      return <div key={b.id} className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 flex flex-col gap-5 shadow-xl">
        <div className="flex justify-between gap-4"><div><div className="flex gap-2 items-center"><span className="font-mono text-xs text-white/60">{b.id}</span><span className={`px-2 py-1 rounded-full border text-[9px] font-black uppercase ${statusClass(b.bookingStatus)}`}>{b.bookingStatus}</span></div><h3 className="text-xl font-black text-white uppercase mt-2">{b.systemName}</h3><p className="text-xs text-white/50">{b.service} · {b.gameTitle || "Selected at station"}</p></div><button onClick={() => setSelectedQr(b)} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-amber-400"><QrCode /></button></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-white/[.02] border border-white/5 p-4 text-xs"><div><span className="block text-white/40">DATE</span><b>{b.date}</b></div><div><span className="block text-white/40">TIME</span><b>{b.startTime}–{b.endTime}</b></div><div><span className="block text-white/40">DURATION</span><b>{b.durationHours}h</b></div><div><span className="block text-white/40">PAID</span><b className="text-emerald-400">₹{b.finalAmount}</b></div><div><span className="block text-white/40">RATE</span><b>₹{b.applicableRate}/h</b></div><div><span className="block text-white/40">SOURCE</span><b className="text-cyan-400">LIVE</b></div></div>
        {active && remaining > 0 && <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-400 text-xs font-black"><Clock3 className="w-4 h-4" /> {Math.floor(remaining / 3600000)}h {Math.floor((remaining % 3600000) / 60000)}m remaining</div>}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">{upcoming && <><button onClick={() => { setSelectedReschedule(b); setNewDate(b.date); setNewTime(b.startTime); setNewSystemId(b.systemId); }} className="px-3 py-2 rounded-xl bg-white/5 text-white text-xs font-bold flex items-center gap-2"><Repeat className="w-4 h-4 text-cyan-400" />Reschedule</button><button onClick={() => setSelectedCancel(b)} className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold flex items-center gap-2"><Trash2 className="w-4 h-4" />Cancel</button><button onClick={() => void doCheckIn(b)} className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Check In</button></>}</div>
      </div>;
    })}</div>}
    {selectedCancel && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"><div className="w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-3xl p-6"><h3 className="text-xl font-black text-white uppercase">Cancel booking?</h3><p className="text-sm text-white/60 mt-2">{selectedCancel.id} · {selectedCancel.systemName}</p><div className="flex gap-3 mt-6"><button onClick={() => setSelectedCancel(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-white text-xs font-bold">Keep</button><button onClick={() => void doCancel()} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-black">Confirm Cancellation</button></div></div></div>}
    {selectedReschedule && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"><div className="w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-3xl p-6"><h3 className="text-xl font-black text-white uppercase">Reschedule</h3><p className="text-sm text-white/50 mt-2">{selectedReschedule.id} · choose a new slot.</p><div className="grid grid-cols-1 gap-3 mt-5"><input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" /><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" /><input value={newSystemId} onChange={e => setNewSystemId(e.target.value)} placeholder="Station ID (optional)" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" /></div><div className="flex gap-3 mt-6"><button onClick={() => setSelectedReschedule(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-white text-xs font-bold">Close</button><button onClick={() => void doReschedule()} className="flex-1 py-3 rounded-xl bg-cyan-600 text-white text-xs font-black">Save Slot</button></div></div></div>}
    {selectedQr && <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedQr(null)}><div className="w-full max-w-sm bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 text-center" onClick={e => e.stopPropagation()}><QrCode className="w-48 h-48 mx-auto bg-white text-black p-5 rounded-2xl" /><h3 className="mt-5 text-xl font-black text-white uppercase">{selectedQr.systemName}</h3><p className="text-xs text-white/50 font-mono mt-1">{selectedQr.id}</p><p className="text-sm text-white/70 mt-4">{selectedQr.date} · {selectedQr.startTime}–{selectedQr.endTime}</p><button onClick={() => setSelectedQr(null)} className="mt-6 w-full py-3 rounded-xl bg-white/10 text-white text-xs font-bold">Close</button></div></div>}
  </div>;
};
