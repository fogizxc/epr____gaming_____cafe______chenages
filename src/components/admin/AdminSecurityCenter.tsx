import React from 'react';
import { Activity, CheckCircle2, Cookie, Database, KeyRound, Lock, ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react';

type SecurityCheck = { label: string; detail: string; status: 'ready' | 'review' };

const checks: SecurityCheck[] = [
  { label: 'Server authentication', detail: 'Short-lived access sessions with server-side user revalidation.', status: 'ready' },
  { label: 'Refresh-token isolation', detail: 'Refresh sessions are designed for HttpOnly cookie transport.', status: 'ready' },
  { label: 'Abuse protection', detail: 'Login attempts are rate-limited and backed by a persistent login guard.', status: 'ready' },
  { label: 'Financial integrity', detail: 'Payments, invoices and business mutations stay behind protected API routes.', status: 'ready' },
  { label: 'MongoDB Atlas production gate', detail: 'Verify live Atlas connectivity, backups and restore drills before launch.', status: 'review' },
  { label: 'Payment provider production gate', detail: 'Run real webhook, refund and reconciliation tests in the production-like environment.', status: 'review' },
];

const iconMap = [ShieldCheck, Cookie, KeyRound, Database, TriangleAlert, Activity];

export const AdminSecurityCenter: React.FC = () => (
  <div className="space-y-6 text-white">
    <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-black to-black p-6 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-red-400"><ShieldCheck className="h-4 w-4" /> Security command</div>
          <h2 className="text-2xl font-black tracking-tight">Production Security Center</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">A single place for the admin team to understand which application security controls are automated and which launch gates still require real infrastructure verification.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Core controls active</div>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {checks.map((check, index) => { const Icon = iconMap[index]; const ready = check.status === 'ready'; return <article key={check.label} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-red-500/25 hover:bg-white/[.04]">
        <div className="mb-4 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30"><Icon className="h-5 w-5 text-red-400" /></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${ready ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{ready ? 'Active' : 'Verify'}</span></div>
        <h3 className="font-bold">{check.label}</h3><p className="mt-2 text-xs leading-5 text-white/40">{check.detail}</p>
      </article>; })}
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold"><Lock className="h-4 w-4 text-red-400" /> Session posture</div><p className="text-xs leading-5 text-white/40">Access tokens are intentionally short-lived. Refresh credentials should remain inaccessible to browser JavaScript.</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold"><Smartphone className="h-4 w-4 text-red-400" /> Device hygiene</div><p className="text-xs leading-5 text-white/40">Legacy browser storage is scrubbed so old builds cannot leave plaintext account passwords behind.</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="mb-3 flex items-center gap-2 text-xs font-bold"><Database className="h-4 w-4 text-red-400" /> Data boundary</div><p className="text-xs leading-5 text-white/40">Google Sheets is treated as catalog/business tooling, never as a password store.</p></div>
    </div>
  </div>
);
