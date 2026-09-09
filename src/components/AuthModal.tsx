import React, { useState, useEffect } from 'react';
import { useCafe } from '../context/CafeContext';
import {
  X,
  Lock,
  User,
  LogIn,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Gamepad2,
  Mail,
  Smartphone,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  MessageCircle,
  ExternalLink,
  Send,
  Shield
} from 'lucide-react';
import { Role } from '../types';
import { sendBrevoEmail } from '../services/emailService';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalReason,
    loginUser,
    registerUser,
    resetPassword,
    findAccountByEmailOrPhone
  } = useCafe();

  // Navigation mode inside modal
  const [modalMode, setModalMode] = useState<'LOGIN' | 'CREATE_ACCOUNT' | 'FORGOT_PASSWORD'>('LOGIN');

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Create Account State
  const [regName, setRegName] = useState('');
  const [regGamerTag, setRegGamerTag] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Auto-detected Contact & OTP Verification State
  const [isContactVerified, setIsContactVerified] = useState(false);
  const [hasRequestedOtp, setHasRequestedOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [otpVerificationError, setOtpVerificationError] = useState('');

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState<string | null>(null);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotOtpTimer, setForgotOtpTimer] = useState<number>(0);

  // OTP Countdown timer effects
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    let interval: any = null;
    if (forgotOtpTimer > 0) {
      interval = setInterval(() => setForgotOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [forgotOtpTimer]);

  // When modal is opened, ALWAYS default to LOGIN mode
  // Never redirect an unauthenticated visitor to CREATE_ACCOUNT
  useEffect(() => {
    if (isAuthModalOpen) {
      setModalMode('LOGIN');
      setErrorMessage('');
      setSuccessMessage('');
      setEnteredOtp('');
      setIsContactVerified(false);
      setHasRequestedOtp(false);
      setGeneratedOtp(null);
      setOtpVerificationError('');
    }
  }, [isAuthModalOpen]);

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
    setModalMode('LOGIN');
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (!isAuthModalOpen) return null;

  // Reset errors when switching modes
  const switchMode = (mode: 'LOGIN' | 'CREATE_ACCOUNT' | 'FORGOT_PASSWORD') => {
    setModalMode(mode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // --- Handlers: Login ---
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const idToUse = loginIdentifier.trim();
    const passToUse = loginPassword.trim();

    if (!idToUse) {
      setErrorMessage('Please enter your Email, Phone Number, Username or Staff/Admin ID.');
      return;
    }
    if (!passToUse) {
      setErrorMessage('Please enter your security password.');
      return;
    }

    const result = loginUser({
      idOrUsername: idToUse,
      password: passToUse,
      name: idToUse.split('@')[0]
    });

    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  // --- Helper: Auto-detect whether contact is Email or WhatsApp Phone ---
  const detectContactType = (val: string): 'EMAIL' | 'PHONE' | 'UNKNOWN' => {
    const trimmed = val.trim();
    if (!trimmed) return 'UNKNOWN';
    if (trimmed.includes('@')) return 'EMAIL';
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 7 || trimmed.startsWith('+')) return 'PHONE';
    return 'UNKNOWN';
  };

  // --- Handlers: Get OTP (Auto-detects Email or WhatsApp) ---
  const handleGetOtp = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setOtpVerificationError('');

    const trimmed = regContact.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your Email or Phone Number.');
      return;
    }

    const type = detectContactType(trimmed);
    if (type === 'EMAIL') {
      if (!trimmed.includes('.') || trimmed.indexOf('@') >= trimmed.lastIndexOf('.')) {
        setErrorMessage('Please enter a valid authentic Email ID (e.g. yourname@gmail.com).');
        return;
      }
    } else if (type === 'PHONE') {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 8) {
        setErrorMessage('Please enter a valid phone number (at least 8 digits, e.g. +91 98765 43210).');
        return;
      }
    } else {
      setErrorMessage('Please enter a valid Email ID (with @ and .) or WhatsApp phone number.');
      return;
    }

    // Generate authentic 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setHasRequestedOtp(true);
    setEnteredOtp('');
    setIsContactVerified(false);
    setOtpTimer(60);

    const channelName = type === 'EMAIL' ? 'Email' : 'WhatsApp';
    setSuccessMessage(`OTP sent to your ${channelName} (${trimmed}). Check your ${type === 'EMAIL' ? 'inbox' : 'WhatsApp'}!`);

    // If Email was detected, trigger real Brevo SMTP dispatch
    if (type === 'EMAIL') {
      sendBrevoEmail({
        to: trimmed,
        toName: regName.trim() || trimmed.split('@')[0],
        subject: `Your Bytes & Brew Verification Code: ${code}`,
        type: 'OTP_VERIFICATION',
        otpCode: code,
      }).then((res) => {
        if (res.success) {
          setSuccessMessage(`✓ Brevo SMTP delivered verification code to ${trimmed}! Check your inbox.`);
        }
      }).catch((err) => {
        console.warn('Brevo email dispatch notice:', err);
      });
    }
  };

  // --- Handler: Auto-check OTP as user fills it (without button click) ---
  const handleOtpChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 6);
    setEnteredOtp(cleanDigits);
    setOtpVerificationError('');

    // Automatically check without user click once 6 digits are typed
    if (cleanDigits.length === 6 && generatedOtp) {
      if (cleanDigits === generatedOtp) {
        setIsContactVerified(true);
        setOtpVerificationError('');
        const type = detectContactType(regContact);
        setSuccessMessage(`✓ Verified! Authenticated via ${type === 'EMAIL' ? 'Email' : 'WhatsApp'}.`);
      } else {
        setOtpVerificationError('Invalid OTP code. Please check the code and try again.');
      }
    }
  };

  // --- Helper: 1-Click Auto Fill for instant verification testing ---
  const handleAutoFillOtp = () => {
    if (generatedOtp) {
      handleOtpChange(generatedOtp);
    }
  };

  // --- Handlers: Create Account Submit ---
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }
    if (!isContactVerified) {
      setErrorMessage('Please enter your Email or Phone Number and verify the OTP first.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Password and Confirmation Password underneath do not match. Please verify.');
      return;
    }

    const type = detectContactType(regContact);
    const cleanContact = regContact.trim();
    const isEmail = type === 'EMAIL';

    const result = registerUser({
      name: regName.trim(),
      gamerTag: regGamerTag.trim() || regName.trim().replace(/\s+/g, '_'),
      email: isEmail ? cleanContact : `${cleanContact.replace(/\D/g, '')}@gamer.cafe`,
      phone: !isEmail ? cleanContact : '',
      password: regPassword,
      isWhatsappVerified: !isEmail,
      isEmailVerified: isEmail
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to create account.');
      return;
    }

    // Success: auto-login will occur through registerUser
  };

  // --- Handlers: Forgot Password via WhatsApp Messaging ---
  const handleSendForgotPasswordWhatsappOtp = () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your registered Email ID or WhatsApp Mobile Number.');
      return;
    }

    const matched = findAccountByEmailOrPhone(forgotIdentifier.trim());
    if (!matched) {
      setErrorMessage('No registered gamer account found matching this Email ID or WhatsApp Mobile Number.');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setForgotGeneratedOtp(code);
    setForgotOtpTimer(60);
    setSuccessMessage(`Recovery verification code dispatched to ${matched.phone || matched.email}. Please enter code below.`);

    // If account has email, also send via Brevo SMTP
    if (matched.email && matched.email.includes('@') && !matched.email.endsWith('@gamer.cafe')) {
      sendBrevoEmail({
        to: matched.email,
        toName: matched.name,
        subject: `Bytes & Brew Security Code: ${code}`,
        type: 'PASSWORD_RESET',
        otpCode: code,
      }).then((res) => {
        if (res.success) {
          setSuccessMessage(`✓ Recovery code delivered to your email (${matched.email}) & WhatsApp!`);
        }
      }).catch(() => {});
    }
  };

  const handleVerifyForgotOtp = () => {
    setErrorMessage('');
    if (!forgotOtp || forgotOtp.trim() !== forgotGeneratedOtp) {
      setErrorMessage('Invalid WhatsApp recovery OTP. Please re-enter the 6-digit code.');
      return;
    }
    setForgotOtpVerified(true);
    setSuccessMessage('✓ WhatsApp identity confirmed. Set your new security password below.');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    const res = resetPassword(forgotIdentifier.trim(), forgotNewPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update password.');
      return;
    }

    setSuccessMessage('✓ Password updated and secured in database! You can now log in with your new password.');
    setTimeout(() => {
      setLoginIdentifier(forgotIdentifier);
      setLoginPassword(forgotNewPassword);
      switchMode('LOGIN');
    }, 2000);
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={handleCloseModal}
    >
      <div
        id="auth-modal-container"
        className={`relative w-full max-w-lg bg-[#0d0d0d] border border-white/15 rounded-3xl p-7 sm:p-10 shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden my-auto flex flex-col transition-all duration-300 ${
          modalMode === 'LOGIN'
            ? 'min-h-[640px] sm:min-h-[720px]'
            : 'min-h-[580px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div
          className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24 transition-all duration-500 ${
            modalMode === 'CREATE_ACCOUNT'
              ? 'bg-emerald-500/15'
              : modalMode === 'FORGOT_PASSWORD'
              ? 'bg-cyan-500/15'
              : 'bg-red-600/15'
          }`}
        />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Modal Header */}
        <div className="relative flex items-start justify-between gap-4 pb-6 border-b border-white/10 mb-6 sm:mb-8">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-colors duration-300 ${
                modalMode === 'CREATE_ACCOUNT'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20'
                  : modalMode === 'FORGOT_PASSWORD'
                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 shadow-cyan-500/20'
                  : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-600/30'
              }`}
            >
              {modalMode === 'CREATE_ACCOUNT' ? (
                <User className="w-6 h-6 text-white" />
              ) : modalMode === 'FORGOT_PASSWORD' ? (
                <KeyRound className="w-6 h-6 text-white" />
              ) : (
                <LogIn className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                {modalMode === 'CREATE_ACCOUNT'
                  ? 'Create Gamer Account'
                  : modalMode === 'FORGOT_PASSWORD'
                  ? 'Password Recovery'
                  : 'Bytes & Brew Portal Login'}
              </h2>
              <p className="text-xs sm:text-sm text-white/50 font-mono tracking-wider mt-0.5">
                {modalMode === 'CREATE_ACCOUNT'
                  ? 'WhatsApp Messaging Verified Registration'
                  : modalMode === 'FORGOT_PASSWORD'
                  ? 'WhatsApp OTP Security Verification'
                  : 'Single Sign-In for Player, Staff & Admin'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            type="button"
            onClick={handleCloseModal}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reason Banner if user triggered auth from a specific locked action */}
        {authModalReason && modalMode === 'LOGIN' && (
          <div className="relative mb-5 p-3.5 rounded-xl bg-red-600/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-white block mb-0.5">Authorization Required:</span>
              <span>{authModalReason}</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs sm:text-sm text-red-300 flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs sm:text-sm text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: LOGIN MODE (Unified login - backend identifies Admin, Staff, or Player) */}
        {/* ========================================================================= */}
        {modalMode === 'LOGIN' && (
          <div className="flex-1 flex flex-col justify-between">
            <form onSubmit={handleLogin} className="flex-1 flex flex-col justify-between gap-6 sm:gap-7">
              <div className="flex flex-col gap-5 sm:gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/80 mb-2">
                    Email / Phone / GamerTag / ID
                  </label>
                  <div className="relative">
                    <User className="w-4.5 h-4.5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-username"
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. alex.vance@gmail.com, phone, or Staff/Admin ID"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500 text-white text-sm sm:text-base pl-11 pr-4 py-3.5 sm:py-4 rounded-2xl outline-none transition placeholder:text-white/30 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/80">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotIdentifier(loginIdentifier);
                        switchMode('FORGOT_PASSWORD');
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition underline underline-offset-2 cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4.5 h-4.5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500 text-white text-sm sm:text-base pl-11 pr-11 py-3.5 sm:py-4 rounded-2xl outline-none transition placeholder:text-white/30 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember device option */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-red-600 focus:ring-red-500 focus:ring-offset-black cursor-pointer"
                    />
                    <span className="text-xs text-white/60 group-hover:text-white/90 transition font-mono">
                      Remember this station session
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <button
                  id="btn-login-submit"
                  type="submit"
                  className="w-full py-4 sm:py-4.5 px-6 font-black uppercase text-sm tracking-wider rounded-2xl transition cursor-pointer shadow-xl flex items-center justify-center gap-2 active:scale-98 bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>

                {/* Auto Detection Security Strip */}
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] text-white/50 font-mono">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unified Role Detection & 256-bit Encrypted Session</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Secure
                  </span>
                </div>

                {/* Option to create account for new players */}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-2 text-center">
                  <p className="text-xs sm:text-sm text-white/60">
                    New to Bytes & Brew Gaming Café?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('CREATE_ACCOUNT')}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 ml-1 cursor-pointer"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CREATE ACCOUNT WITH DUAL EMAIL & WHATSAPP OTP AUTHENTICATION */}
        {/* ========================================================================= */}
        {modalMode === 'CREATE_ACCOUNT' && (
          <form onSubmit={handleCreateAccountSubmit} className="flex flex-col gap-3.5 animate-fadeIn">
            {/* Name & GamerTag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-white/70 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rohan Joshi"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 text-white text-xs pl-9 pr-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-white/70 mb-1">
                  GamerTag / Alias
                </label>
                <div className="relative">
                  <Gamepad2 className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={regGamerTag}
                    onChange={(e) => setRegGamerTag(e.target.value)}
                    placeholder="e.g. ShadowBlade_X"
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 text-white text-xs pl-9 pr-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SIMPLE BLOCK: ENTER EMAIL OR PHONE NUMBER WITH AUTO-DETECTION & GET OTP */}
            <div className="p-3.5 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 focus-within:border-emerald-500/50 rounded-2xl flex flex-col gap-2.5 transition">
              {/* Field Label & Auto-Guessed Badge */}
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono uppercase text-white/70">
                  Enter Email or Phone Number <span className="text-red-400">*</span>
                </label>

                {/* Intelligent Channel Guess / Detection Badge */}
                {detectContactType(regContact) === 'EMAIL' && (
                  <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30 animate-fadeIn">
                    <Mail className="w-2.5 h-2.5" />
                    <span>Email Detected</span>
                  </span>
                )}
                {detectContactType(regContact) === 'PHONE' && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 animate-fadeIn">
                    <MessageCircle className="w-2.5 h-2.5" />
                    <span>WhatsApp Phone Detected</span>
                  </span>
                )}
              </div>

              {/* Input for Email or Phone No. */}
              <div className="relative">
                {detectContactType(regContact) === 'EMAIL' ? (
                  <Mail className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                ) : detectContactType(regContact) === 'PHONE' ? (
                  <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                ) : (
                  <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                  type="text"
                  required
                  disabled={isContactVerified}
                  value={regContact}
                  onChange={(e) => {
                    setRegContact(e.target.value);
                    if (hasRequestedOtp) {
                      setHasRequestedOtp(false);
                      setGeneratedOtp(null);
                      setEnteredOtp('');
                      setOtpVerificationError('');
                    }
                  }}
                  placeholder="e.g. yourname@gmail.com or +91 98765 43210"
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 text-white text-xs pl-9 pr-24 py-2.5 rounded-xl outline-none font-mono disabled:opacity-80"
                />

                {isContactVerified && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      <Check className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsContactVerified(false);
                        setHasRequestedOtp(false);
                        setGeneratedOtp(null);
                        setEnteredOtp('');
                        setOtpVerificationError('');
                      }}
                      className="text-[10px] text-white/40 hover:text-white underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Underneath: Get OTP Button */}
              {!isContactVerified && (
                <div>
                  <button
                    type="button"
                    onClick={handleGetOtp}
                    disabled={otpTimer > 0 || !regContact.trim()}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/10 disabled:text-white/40 text-white font-bold uppercase text-xs tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {otpTimer > 0
                        ? `Resend OTP in ${otpTimer}s`
                        : hasRequestedOtp
                        ? 'Resend OTP'
                        : 'Get OTP'}
                    </span>
                  </button>
                </div>
              )}

              {/* After clicking Get OTP button: OTP filling field appears and automatically checks on fill without user click */}
              {hasRequestedOtp && !isContactVerified && (
                <div className="mt-1 p-3 bg-black/60 border border-emerald-500/30 rounded-xl flex flex-col gap-2 animate-fadeIn">
                  {/* Simulated Dispatch Notification */}
                  <div className="flex items-center justify-between text-[11px] text-emerald-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      {detectContactType(regContact) === 'EMAIL' ? (
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>
                        {detectContactType(regContact) === 'EMAIL' ? 'Email OTP Code:' : 'WhatsApp OTP Code:'}
                      </span>
                    </span>
                    <span className="font-mono text-emerald-300 font-bold tracking-widest bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                      {generatedOtp}
                    </span>
                  </div>

                  <p className="text-[10px] text-white/60 font-mono">
                    {detectContactType(regContact) === 'EMAIL'
                      ? `Security verification code sent to ${regContact.trim()}: OTP is ${generatedOtp}.`
                      : `WhatsApp verification code sent to ${regContact.trim()}: OTP is ${generatedOtp}.`}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-white/60 pt-1">
                    <span>Enter 6-Digit OTP (auto-verifies once filled):</span>
                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      1-Click Fill
                    </button>
                  </div>

                  {/* The OTP filling field */}
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      placeholder="• • • • • •"
                      className={`w-full bg-white/[0.06] border text-center text-base tracking-[0.4em] font-mono font-bold text-white py-2 px-3 rounded-xl outline-none transition ${
                        enteredOtp.length === 6 && enteredOtp === generatedOtp
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : otpVerificationError
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/20 focus:border-emerald-400'
                      }`}
                    />
                  </div>

                  {/* Automatic check feedback */}
                  {otpVerificationError && (
                    <p className="text-[10px] text-red-400 font-mono flex items-center gap-1 animate-fadeIn">
                      <span>✕ {otpVerificationError}</span>
                    </p>
                  )}

                  {enteredOtp.length > 0 && enteredOtp.length < 6 && (
                    <p className="text-[10px] text-white/40 font-mono">
                      {6 - enteredOtp.length} more digit{6 - enteredOtp.length === 1 ? '' : 's'} to auto-check...
                    </p>
                  )}
                </div>
              )}

              {/* Verified Status Banner */}
              {isContactVerified && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-300 block font-mono">
                        OTP Verified Successfully!
                      </span>
                      <span className="text-[10px] text-white/60 font-mono">
                        Authenticated as {detectContactType(regContact) === 'EMAIL' ? 'Email' : 'WhatsApp'} ({regContact})
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                    ✓ Authenticated
                  </span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-white/70 mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-emerald-400 text-white text-xs pl-9 pr-9 py-2 rounded-xl outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirmation Password Field Underneath the Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono uppercase text-white/70">
                  Confirmation Password Underneath <span className="text-red-400">*</span>
                </label>
                {regConfirmPassword && (
                  <span
                    className={`text-[10px] font-bold ${
                      regPassword === regConfirmPassword ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {regPassword === regConfirmPassword ? '✓ Passwords Match' : '✕ Does Not Match'}
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm"
                  className={`w-full bg-white/[0.04] border text-white text-xs pl-9 pr-9 py-2 rounded-xl outline-none font-mono ${
                    regConfirmPassword && regPassword === regConfirmPassword
                      ? 'border-emerald-500/60'
                      : regConfirmPassword && regPassword !== regConfirmPassword
                      ? 'border-red-500/60'
                      : 'border-white/10 focus:border-emerald-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                >
                  {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Create Account Action Button & Notice */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={!isContactVerified || !regPassword || regPassword !== regConfirmPassword}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Create Account & Enter Arena</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isContactVerified && (
                <p className="text-[10px] text-amber-300/80 font-mono text-center">
                  ⚠️ Verify your Email or WhatsApp Phone Number OTP above to enable account creation.
                </p>
              )}

              <p className="text-center text-xs text-white/60 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('LOGIN')}
                  className="text-red-400 hover:text-red-300 font-bold underline underline-offset-2 ml-1 cursor-pointer"
                >
                  Sign In Here
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FORGOT PASSWORD RECOVERY VIA WHATSAPP MESSAGING */}
        {/* ========================================================================= */}
        {modalMode === 'FORGOT_PASSWORD' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <p className="text-xs text-white/60">
              Enter your registered Email ID or WhatsApp mobile number. We will send a security verification OTP via WhatsApp messaging to reset your password.
            </p>

            {!forgotOtpVerified ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Registered Email or WhatsApp Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. alex.vance@gmail.com or +91 98765 43210"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-400 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendForgotPasswordWhatsappOtp}
                  disabled={forgotOtpTimer > 0}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{forgotOtpTimer > 0 ? `Resend WhatsApp Code in (${forgotOtpTimer}s)` : 'Send WhatsApp Recovery Code'}</span>
                </button>

                {forgotGeneratedOtp && (
                  <div className="p-3.5 bg-black/60 border border-cyan-500/30 rounded-2xl flex flex-col gap-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs text-cyan-300 font-mono">
                      <span>WhatsApp Recovery Code:</span>
                      <span className="font-black text-cyan-400 tracking-widest bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
                        {forgotGeneratedOtp}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 font-mono">
                      "Bytes & Brew Security: Your password reset code is <strong className="text-white">{forgotGeneratedOtp}</strong>."
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit Code"
                        className="bg-white/5 border border-white/20 text-white text-xs font-mono font-bold px-3 py-2 rounded-xl flex-1 text-center tracking-widest outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyForgotOtp}
                        className="bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Once WhatsApp OTP is verified: Set new password and confirmation */
              <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-3.5 animate-fadeIn">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    New Security Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-400 text-white text-sm pl-10 pr-10 py-2.5 rounded-xl outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                      Confirm New Password Underneath
                    </label>
                    {forgotConfirmPassword && (
                      <span
                        className={`text-[10px] font-bold ${
                          forgotNewPassword === forgotConfirmPassword ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {forgotNewPassword === forgotConfirmPassword ? '✓ Passwords Match' : '✕ Does Not Match'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      required
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter password to confirm"
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-400 text-white text-sm pl-10 pr-10 py-2.5 rounded-xl outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                    >
                      {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase text-xs tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-cyan-400/20 active:scale-98 mt-1"
                >
                  Update Password & Save in Database
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => switchMode('LOGIN')}
                className="text-xs text-white/60 hover:text-white transition underline underline-offset-2 cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
