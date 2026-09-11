import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Gamepad2, KeyRound, Lock, Mail, ShieldCheck, Smartphone, Sparkles, User, X } from 'lucide-react';
import { useCafe } from '../context/CafeContext';
import { serverRegister } from '../services/serverAuth';

type Mode = 'LOGIN' | 'CREATE_ACCOUNT' | 'FORGOT_PASSWORD';

const inputClass = 'w-full h-12 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-red-500/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-red-500/10';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalReason, loginUser } = useCafe();
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [name, setName] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) { setMode('LOGIN'); setError(''); setSuccess(''); setSubmitting(false); }
  }, [isAuthModalOpen]);

  const resetMessages = () => { setError(''); setSuccess(''); };
  const close = () => { setIsAuthModalOpen(false); setMode('LOGIN'); resetMessages(); };
  const switchMode = (next: Mode) => { setMode(next); resetMessages(); };

  const passwordScore = useMemo(() => {
    if (!password) return 0;
    return [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); resetMessages();
    if (!identifier.trim()) return setError('Enter your email, phone, GamerTag, or staff ID.');
    if (!loginPassword) return setError('Enter your password.');
    const result = loginUser({ idOrUsername: identifier.trim(), password: loginPassword });
    if (!result.success) setError(result.error || 'Unable to sign in.');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); resetMessages();
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (phone.trim().length > 30) return setError('Enter a valid phone number.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      const result = await serverRegister({ name: name.trim(), gamerTag: gamerTag.trim() || undefined, email: email.trim(), phone: phone.trim() || undefined, password });
      if (!result.success) throw new Error(result.error || 'Unable to create account.');
      setSuccess('Account created. Welcome to Bytes & Brew.');
      window.setTimeout(() => window.location.reload(), 350);
    } catch (err: any) { setError(err?.message || 'Unable to create account.'); }
    finally { setSubmitting(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); resetMessages();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) return setError('Enter your registered email address.');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/password-reset/request', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: forgotEmail.trim() }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Unable to start password recovery.');
      setSuccess(payload?.message || 'If the account exists, recovery instructions have been sent.');
    } catch (err: any) { setError(err?.message || 'Unable to start password recovery.'); }
    finally { setSubmitting(false); }
  };

  if (!isAuthModalOpen) return null;

  const isLogin = mode === 'LOGIN';
  const isSignup = mode === 'CREATE_ACCOUNT';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-xl sm:p-6" onMouseDown={(e) => { if (e.currentTarget === e.target) close(); }}>
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#090909] shadow-[0_30px_100px_rgba(0,0,0,.7)] md:grid-cols-[.82fr_1.18fr]">
        <button type="button" onClick={close} aria-label="Close authentication" className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>

        <aside className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-red-950/60 via-[#100707] to-black p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-600/15 blur-3xl" />
          <div>
            <div className="mb-8 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-950"><Gamepad2 className="h-5 w-5 text-white" /></div><div><div className="text-sm font-black uppercase tracking-tight text-white">Bytes & Brew</div><div className="text-[10px] uppercase tracking-[.25em] text-white/35">Gaming Cafe</div></div></div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-300"><Sparkles className="h-3 w-3" /> Player access</div>
            <h1 className="mt-5 text-4xl font-black leading-[.95] tracking-tight text-white">PLAY.<br /><span className="text-red-500">COMPETE.</span><br />REPEAT.</h1>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/45">One secure account for bookings, memberships, tournaments, gaming sessions and your player profile.</p>
          </div>
          <div className="space-y-3 text-xs text-white/45"><Trust icon={<ShieldCheck />} text="Server-side authentication" /><Trust icon={<Lock />} text="Protected sessions & payments" /><Trust icon={<Gamepad2 />} text="Your gaming profile, one place" /></div>
        </aside>

        <section className="max-h-[92vh] overflow-y-auto p-5 sm:p-8 md:p-10">
          <div className="mb-7 md:hidden"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600"><Gamepad2 className="h-5 w-5" /></div><div><div className="font-black text-white">BYTES & BREW</div><div className="text-[10px] uppercase tracking-[.25em] text-white/35">Gaming Cafe</div></div></div></div>
          {mode !== 'LOGIN' && <button type="button" onClick={() => switchMode('LOGIN')} className="mb-5 flex items-center gap-2 text-xs font-semibold text-white/45 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</button>}
          <div className="mb-7"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.28em] text-red-400">{isLogin ? 'Welcome back' : isSignup ? 'Create player account' : 'Account recovery'}</p><h2 className="text-3xl font-black tracking-tight text-white">{isLogin ? 'Sign in.' : isSignup ? 'Join the squad.' : 'Reset access.'}</h2><p className="mt-2 text-sm text-white/40">{isLogin ? 'Enter your details and get back into the action.' : isSignup ? 'Create your profile in under a minute.' : 'We will guide you through secure recovery.'}</p></div>

          {authModalReason && isLogin && <Notice type="info">{authModalReason}</Notice>}
          {error && <Notice type="error">{error}</Notice>}
          {success && <Notice type="success">{success}</Notice>}

          {isLogin && <form onSubmit={handleLogin} className="space-y-5">
            <Field icon={<User />} label="Email, phone, GamerTag or staff ID"><input autoFocus value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" className={inputClass} placeholder="you@example.com" /></Field>
            <Field icon={<Lock />} label="Password"><PasswordInput value={loginPassword} onChange={setLoginPassword} visible={showLoginPassword} onToggle={() => setShowLoginPassword(v => !v)} autoComplete="current-password" placeholder="Enter your password" /></Field>
            <div className="flex items-center justify-end"><button type="button" onClick={() => { setForgotEmail(identifier.includes('@') ? identifier : ''); switchMode('FORGOT_PASSWORD'); }} className="text-xs font-semibold text-white/45 hover:text-red-400">Forgot password?</button></div>
            <button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-red-600 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">Sign in</button>
            <div className="relative py-1"><div className="absolute inset-x-0 top-1/2 border-t border-white/10" /><span className="relative mx-auto block w-fit bg-[#090909] px-3 text-[10px] uppercase tracking-widest text-white/25">New player?</span></div>
            <button type="button" onClick={() => switchMode('CREATE_ACCOUNT')} className="h-12 w-full rounded-xl border border-white/10 bg-white/[.025] text-sm font-bold text-white transition hover:border-red-500/40 hover:bg-red-500/5">Create an account</button>
          </form>}

          {isSignup && <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><Field icon={<User />} label="Full name"><input autoFocus value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={inputClass} placeholder="Your name" /></Field><Field icon={<Gamepad2 />} label="GamerTag · optional"><input value={gamerTag} onChange={e => setGamerTag(e.target.value)} autoComplete="nickname" className={inputClass} placeholder="Your player tag" /></Field></div>
            <Field icon={<Mail />} label="Email address"><input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" /></Field>
            <Field icon={<Smartphone />} label="Phone · optional"><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" className={inputClass} placeholder="+91 98XXXXXXXX" /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field icon={<KeyRound />} label="Password"><PasswordInput value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword(v => !v)} autoComplete="new-password" placeholder="8+ characters" /></Field><Field icon={<KeyRound />} label="Confirm password"><PasswordInput value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} autoComplete="new-password" placeholder="Repeat password" /></Field></div>
            <div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/35"><span>Password strength</span><span>{passwordScore >= 4 ? 'Strong' : passwordScore >= 2 ? 'Good' : password ? 'Needs work' : '—'}</span></div><div className="grid grid-cols-4 gap-1">{[0,1,2,3].map(i => <div key={i} className={`h-1 rounded-full ${i < passwordScore ? 'bg-red-500' : 'bg-white/10'}`} />)}</div><p className="mt-2 text-[10px] text-white/30">Use 8+ characters with a number, uppercase letter and symbol for a stronger password.</p></div>
            <p className="flex items-center gap-2 text-[10px] leading-4 text-white/30"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Passwords are hashed server-side. They are never stored in Google Sheets.</p>
            <button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-red-600 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Creating account…' : 'Create player account'}</button>
          </form>}

          {mode === 'FORGOT_PASSWORD' && <form onSubmit={handleForgot} className="space-y-5"><Field icon={<Mail />} label="Registered email"><input autoFocus value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" /></Field><p className="text-xs leading-5 text-white/35">For security, we do not reveal whether an email is registered. If an account exists, recovery instructions will be sent.</p><button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-red-600 text-sm font-black uppercase tracking-wider text-white disabled:opacity-50">{submitting ? 'Sending…' : 'Send recovery instructions'}</button></form>}
        </section>
      </div>
    </div>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => <label className="block"><span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/55">{React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-3.5 w-3.5' })}{label}</span>{children}</label>;
const Trust: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => <div className="flex items-center gap-3">{React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-4 w-4 text-red-400' })}<span>{text}</span></div>;
const Notice: React.FC<{ type: 'info' | 'error' | 'success'; children: React.ReactNode }> = ({ type, children }) => <div className={`mb-5 flex gap-2 rounded-xl border p-3 text-xs leading-5 ${type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' : type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/[.04] text-white/55'}`}>{type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}{children}</div>;
const PasswordInput: React.FC<{ value: string; onChange: (v: string) => void; visible: boolean; onToggle: () => void; autoComplete: string; placeholder: string }> = ({ value, onChange, visible, onToggle, autoComplete, placeholder }) => <div className="relative"><input value={value} onChange={e => onChange(e.target.value)} type={visible ? 'text' : 'password'} autoComplete={autoComplete} className={`${inputClass} pr-12`} placeholder={placeholder} /><button type="button" onClick={onToggle} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-white/35 hover:text-white">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>;
