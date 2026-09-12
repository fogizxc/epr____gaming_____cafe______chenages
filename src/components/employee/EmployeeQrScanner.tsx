import React, { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, QrCode, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

function authHeaders() { const token = typeof window !== "undefined" ? localStorage.getItem("nexus_gaming_cafe_v1_accessToken") : null; return token ? { Authorization: `Bearer ${token}` } : {}; }

export const EmployeeQrScanner: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const submit = async (value: string) => {
    if (processingRef.current || !value.trim()) return;
    processingRef.current = true; setBusy(true); setStatus(null);
    try {
      const response = await fetch("/api/employee/check-in/qr", { method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ qrValue: value.trim() }), cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "QR check-in failed");
      setStatus({ ok: true, text: `Check-in confirmed — ${data.booking?.systemName || "session"} is now ACTIVE.` });
      setManual("");
      window.setTimeout(() => setOpen(false), 1200);
    } catch (e: any) {
      setStatus({ ok: false, text: e?.message || "Invalid or expired QR pass." });
      window.setTimeout(() => { processingRef.current = false; setBusy(false); }, 900);
    }
    if (processingRef.current) setBusy(false);
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = async () => {
      await new Promise(r => setTimeout(r, 100));
      if (cancelled) return;
      const scanner = new Html5Qrcode("employee-qr-reader"); scannerRef.current = scanner;
      try {
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 }, decoded => void submit(decoded), () => undefined);
      } catch (e: any) {
        if (!cancelled) setStatus({ ok: false, text: "Camera could not start. Allow camera access or use manual QR input below." });
      }
    };
    void start();
    return () => { cancelled = true; const scanner = scannerRef.current; scannerRef.current = null; if (scanner) void scanner.stop().catch(() => undefined).finally(() => { scanner.clear().catch(() => undefined); }); };
  }, [open]);

  const close = () => { setOpen(false); setStatus(null); setManual(""); processingRef.current = false; setBusy(false); };

  return <>
    <button onClick={() => setOpen(true)} className="fixed right-5 bottom-5 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl border border-red-400/30"><Camera className="w-4 h-4" /> Scan Customer QR</button>
    {open && <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0b0b0b] border border-white/10 rounded-3xl p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-4"><div><div className="text-[10px] uppercase tracking-[0.3em] text-red-400 font-black">Employee Check-In</div><h2 className="text-xl font-black uppercase">Scan Live QR Pass</h2></div><button onClick={close} className="p-2 rounded-xl bg-white/5"><X /></button></div>
        <div id="employee-qr-reader" className="overflow-hidden rounded-2xl bg-black min-h-[300px]" />
        {busy && <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-400 font-bold"><Loader2 className="w-4 h-4 animate-spin" />Validating QR securely…</div>}
        {status && <div className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${status.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>{status.ok ? <CheckCircle2 className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}{status.text}</div>}
        <div className="mt-5 pt-5 border-t border-white/10"><label className="text-[10px] uppercase tracking-widest text-white/40 font-black">Manual fallback</label><div className="flex gap-2 mt-2"><input value={manual} onChange={e => setManual(e.target.value)} placeholder="Paste QR URL/token" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white font-mono outline-none" /><button disabled={busy || !manual.trim()} onClick={() => void submit(manual)} className="px-4 rounded-xl bg-white text-black text-xs font-black uppercase disabled:opacity-40">Check In</button></div></div>
        <p className="text-[10px] text-white/30 mt-4 text-center">Only active, unexpired, one-time QR passes linked to a valid booking can start a session.</p>
      </div>
    </div>}
  </>;
};
