import React, { useState, useEffect } from 'react';
import { useCafe } from '../context/CafeContext';
import { X, Lock, User, LogIn, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, Mail, Smartphone, Shield } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalReason, loginUser } = useCafe();
  const [modalMode, setModalMode] = useState<'LOGIN' | 'CREATE_ACCOUNT' | 'FORGOT_PASSWORD'>('LOGIN');
  const [loginIdentifier, setLoginIdentifier] = useState(''); const [loginPassword, setLoginPassword] = useState(''); const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [regName, setRegName] = useState(''); const [regGamerTag, setRegGamerTag] = useState(''); const [regEmail, setRegEmail] = useState(''); const [regPhone, setRegPhone] = useState(''); const [regPassword, setRegPassword] = useState(''); const [regConfirmPassword, setRegConfirmPassword] = useState(''); const [showRegPassword, setShowRegPassword] = useState(false); const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); const [successMessage, setSuccessMessage] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (isAuthModalOpen) { setModalMode('LOGIN'); setErrorMessage(''); setSuccessMessage(''); setIsSubmitting(false); } }, [isAuthModalOpen]);
  const handleCloseModal = () => { setIsAuthModalOpen(false); setModalMode('LOGIN'); setErrorMessage(''); setSuccessMessage(''); };
  const switchMode = (mode: 'LOGIN' | 'CREATE_ACCOUNT' | 'FORGOT_PASSWORD') => { setModalMode(mode); setErrorMessage(''); setSuccessMessage(''); };

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault(); setErrorMessage(''); setSuccessMessage(''); const id = loginIdentifier.trim();
    if (!id) return setErrorMessage('Please enter your Email, Phone Number, GamerTag or Staff/Admin ID.');
    if (!loginPassword) return setErrorMessage('Please enter your security password.');
    const result = loginUser({ idOrUsername: id, password: loginPassword }); if (!result.success) setErrorMessage(result.error || 'Unable to authenticate.');
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMessage(''); setSuccessMessage('');
    if (regName.trim().length < 2) return setErrorMessage('Please provide your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) return setErrorMessage('Please enter a valid email address.');
    if (regPhone.trim().length > 30) return setErrorMessage('Please enter a valid phone number.');
    if (regPassword.length < 8) return setErrorMessage('Password must be at least 8 characters.');
    if (regPassword !== regConfirmPassword) return setErrorMessage('Password and confirmation password do not match.');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: regName.trim(), email: regEmail.trim(), phone: regPhone.trim() || undefined, gamerTag: regGamerTag.trim() || undefined, password: regPassword }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.accessToken) throw new Error(payload?.error || 'Unable to create account.');
      localStorage.setItem('nexus_gaming_cafe_v1_accessToken', payload.accessToken); localStorage.setItem('nexus_gaming_cafe_v1_refreshToken', payload.refreshToken || '');
      setSuccessMessage('Account created securely. Signing you in…'); window.setTimeout(() => window.location.reload(), 400);
    } catch (error: any) { setErrorMessage(error?.message || 'Unable to create account.'); } finally { setIsSubmitting(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMessage(''); setSuccessMessage(''); if (!forgotIdentifier.trim()) return setErrorMessage('Enter your registered email address.');
    try {
      const response = await fetch('/api/auth/password-reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: forgotIdentifier.trim() }) });
      const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload?.error || 'Unable to start password recovery.');
      setSuccessMessage(payload?.message || 'If the account exists, recovery instructions have been sent.');
    } catch (error: any) { setErrorMessage(error?.message || 'Unable to start password recovery.'); }
  };

  if (!isAuthModalOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" onClick={handleCloseModal}>
    <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/15 rounded-3xl p-7 sm:p-10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={handleCloseModal} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 text-white/70 flex items-center justify-center"><X className="w-4 h-4" /></button>
      <div className="flex items-center gap-3 mb-7 pr-10"><div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div><div><h2 className="text-xl font-black uppercase text-white">Bytes & Brew Authentication</h2><p className="text-xs text-white/45 font-mono">Secure server-side account access</p></div></div>
      {authModalReason && modalMode === 'LOGIN' && <div className="mb-5 p-3 rounded-xl bg-red-600/15 border border-red-500/30 text-xs text-red-200"><b className="text-white">Authorization required:</b> {authModalReason}</div>}
      {errorMessage && <div className="mb-5 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-sm text-red-300 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMessage}</div>}
      {successMessage && <div className="mb-5 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-sm text-emerald-300 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{successMessage}</div>}
      {modalMode === 'LOGIN' && <form onSubmit={handleLogin} className="space-y-5"><Field icon={<User className="w-4 h-4" />} label="Email / Phone / GamerTag / Staff ID"><input value={loginIdentifier} onChange={e=>setLoginIdentifier(e.target.value)} autoComplete="username" className="auth-input" placeholder="you@example.com or Staff ID" /></Field><Field icon={<Lock className="w-4 h-4" />} label="Password"><div className="relative"><input value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} type={showLoginPassword?'text':'password'} autoComplete="current-password" className="auth-input pr-12" placeholder="Your password" /><button type="button" onClick={()=>setShowLoginPassword(v=>!v)} className="eye-btn">{showLoginPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></Field><button disabled={isSubmitting} className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black uppercase">{isSubmitting?'Signing in…':'Sign in'}</button><div className="flex justify-between text-sm"><button type="button" onClick={()=>switchMode('CREATE_ACCOUNT')} className="text-red-400">Create account</button><button type="button" onClick={()=>{setForgotIdentifier(loginIdentifier);switchMode('FORGOT_PASSWORD')}} className="text-white/60">Forgot password?</button></div></form>}
      {modalMode === 'CREATE_ACCOUNT' && <form onSubmit={handleCreateAccountSubmit} className="space-y-4"><Field icon={<User className="w-4 h-4" />} label="Full name"><input value={regName} onChange={e=>setRegName(e.target.value)} autoComplete="name" className="auth-input" /></Field><Field icon={<User className="w-4 h-4" />} label="Gamer tag (optional)"><input value={regGamerTag} onChange={e=>setRegGamerTag(e.target.value)} className="auth-input" /></Field><Field icon={<Mail className="w-4 h-4" />} label="Email"><input value={regEmail} onChange={e=>setRegEmail(e.target.value)} type="email" autoComplete="email" className="auth-input" /></Field><Field icon={<Smartphone className="w-4 h-4" />} label="Phone (optional)"><input value={regPhone} onChange={e=>setRegPhone(e.target.value)} type="tel" autoComplete="tel" className="auth-input" /></Field><Field icon={<KeyRound className="w-4 h-4" />} label="Password"><div className="relative"><input value={regPassword} onChange={e=>setRegPassword(e.target.value)} type={showRegPassword?'text':'password'} autoComplete="new-password" className="auth-input pr-12" /><button type="button" onClick={()=>setShowRegPassword(v=>!v)} className="eye-btn">{showRegPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></Field><Field icon={<KeyRound className="w-4 h-4" />} label="Confirm password"><div className="relative"><input value={regConfirmPassword} onChange={e=>setRegConfirmPassword(e.target.value)} type={showRegConfirmPassword?'text':'password'} autoComplete="new-password" className="auth-input pr-12" /><button type="button" onClick={()=>setShowRegConfirmPassword(v=>!v)} className="eye-btn">{showRegConfirmPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></Field><p className="text-xs text-white/40">Passwords are hashed server-side and are never stored in Google Sheets.</p><button disabled={isSubmitting} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black uppercase">{isSubmitting?'Creating…':'Create secure account'}</button><button type="button" onClick={()=>switchMode('LOGIN')} className="w-full text-sm text-white/50">Back to login</button></form>}
      {modalMode === 'FORGOT_PASSWORD' && <form onSubmit={handleForgotPassword} className="space-y-5"><p className="text-sm text-white/60">Enter your registered email. The recovery service does not disclose whether an account exists.</p><Field icon={<Mail className="w-4 h-4" />} label="Registered email"><input value={forgotIdentifier} onChange={e=>setForgotIdentifier(e.target.value)} type="email" autoComplete="email" className="auth-input" /></Field><button className="w-full py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase">Send recovery instructions</button><button type="button" onClick={()=>switchMode('LOGIN')} className="w-full text-sm text-white/50">Back to login</button></form>}
    </div><style>{`.auth-input{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;padding:.9rem 1rem;border-radius:1rem;outline:none}.auth-input:focus{border-color:#ef4444}.auth-input::placeholder{color:rgba(255,255,255,.3)}.eye-btn{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.5)}`}</style>
  </div>;
};
const Field: React.FC<{icon:React.ReactNode;label:string;children:React.ReactNode}> = ({icon,label,children}) => <label className="block"><span className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70 mb-2">{icon}{label}</span>{children}</label>;
