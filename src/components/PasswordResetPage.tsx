import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Gamepad2, KeyRound, Lock, ShieldCheck } from 'lucide-react';

const inputClass = 'w-full h-12 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-red-500/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/10';

export const PasswordResetPage: React.FC<{ token: string }> = ({ token }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const score = useMemo(() => [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length, [password]);

  const finish = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('resetToken');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (token.length < 20) return setError('This reset link is invalid.');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/password-reset/complete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || 'Unable to reset password.');
      setSuccess('Password updated successfully. You can sign in with your new password.');
      finish();
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <section className="w-full rounded-[28px] border border-white/10 bg-[#090909] p-6 shadow-[0_30px_100px_rgba(0,0,0,.7)] sm:p-9">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-950"><Gamepad2 className="h-5 w-5" /></div>
            <div><div className="font-black tracking-tight">BYTES & BREW</div><div className="text-[10px] uppercase tracking-[.25em] text-white/35">Secure account recovery</div></div>
          </div>
          <div className="mb-7"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.28em] text-red-400">Password recovery</p><h1 className="text-3xl font-black tracking-tight">Choose a new password.</h1><p className="mt-2 text-sm leading-5 text-white/40">Your reset link is single-use and expires after 15 minutes.</p></div>
          {error && <div className="mb-5 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          {success && <div className="mb-5 flex gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}
          {!success && <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block"><span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/55"><Lock className="h-3.5 w-3.5" />New password</span><div className="relative"><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`${inputClass} pr-12`} placeholder="8+ characters" autoFocus /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:bg-white/5 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/55"><KeyRound className="h-3.5 w-3.5" />Confirm password</span><div className="relative"><input value={confirm} onChange={e => setConfirm(e.target.value)} type={showConfirm ? 'text' : 'password'} autoComplete="new-password" className={`${inputClass} pr-12`} placeholder="Repeat your password" /><button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/35 hover:bg-white/5 hover:text-white" aria-label={showConfirm ? 'Hide password' : 'Show password'}>{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            <div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/35"><span>Password strength</span><span>{score >= 4 ? 'Strong' : score >= 2 ? 'Good' : password ? 'Needs work' : '—'}</span></div><div className="grid grid-cols-4 gap-1">{[0,1,2,3].map(i => <div key={i} className={`h-1 rounded-full ${i < score ? 'bg-red-500' : 'bg-white/10'}`} />)}</div></div>
            <p className="flex items-center gap-2 text-[10px] leading-4 text-white/30"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Passwords are hashed server-side and never sent to Google Sheets.</p>
            <button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-red-600 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Updating password…' : 'Set new password'}</button>
          </form>}
          {success && <button type="button" onClick={() => { window.location.href = '/'; }} className="mt-4 h-12 w-full rounded-xl border border-white/10 bg-white/[.03] text-sm font-bold text-white hover:bg-white/[.06]">Return to sign in</button>}
        </section>
      </div>
    </main>
  );
};
