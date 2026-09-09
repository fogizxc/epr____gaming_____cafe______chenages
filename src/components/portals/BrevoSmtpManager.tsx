import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Server,
  KeyRound,
  Inbox,
  Sparkles
} from 'lucide-react';
import { getBrevoStatus, sendBrevoEmail, sendBrevoTestEmail, BrevoStatusResponse } from '../../services/emailService';

export const BrevoSmtpManager: React.FC = () => {
  const [status, setStatus] = useState<BrevoStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [testEmail, setTestEmail] = useState('raghav45078@gmail.com');
  const [testSubject, setTestSubject] = useState('Brevo SMTP Live Test • Bytes & Brew');
  const [testTemplate, setTestTemplate] = useState<'OTP_VERIFICATION' | 'BOOKING_CONFIRMATION' | 'CUSTOM'>('OTP_VERIFICATION');
  const [testOtpCode, setTestOtpCode] = useState('849201');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; method?: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [recentDispatches, setRecentDispatches] = useState<Array<{
    id: string;
    to: string;
    type: string;
    status: 'SENT' | 'FAILED';
    time: string;
    method?: string;
  }>>([]);

  const refreshStatus = async () => {
    setIsLoadingStatus(true);
    const data = await getBrevoStatus();
    setStatus(data);
    setIsLoadingStatus(false);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVar(label);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendBrevoEmail({
        to: testEmail.trim(),
        toName: 'Bytes & Brew Gamer',
        subject: testSubject,
        type: testTemplate,
        otpCode: testTemplate === 'OTP_VERIFICATION' ? testOtpCode : undefined,
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `Email successfully delivered to ${testEmail} via ${res.deliveryMethod || 'Brevo'}!`,
          method: res.deliveryMethod,
        });
        setRecentDispatches((prev) => [
          {
            id: res.messageId || Math.random().toString(),
            to: testEmail.trim(),
            type: testTemplate,
            status: 'SENT',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            method: res.deliveryMethod,
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Failed to dispatch email. Please check your Brevo credentials in .env.',
        });
        setRecentDispatches((prev) => [
          {
            id: Math.random().toString(),
            to: testEmail.trim(),
            type: testTemplate,
            status: 'FAILED',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network exception while dispatching test email.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.25em] font-black px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center gap-1.5 shadow-sm">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Brevo Transactional SMTP Relay</span>
            </span>
            <span className="text-xs text-white/50 font-mono">smtp-relay.brevo.com:587</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Brevo (Sendinblue) SMTP Operations Hub
          </h2>
          <p className="text-xs text-white/60 font-light mt-1 max-w-2xl leading-relaxed">
            Manage high-deliverability transactional emails for gamer account verification OTPs, password recoveries, and esports booking receipts via Brevo SMTP &amp; REST relay.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshStatus}
            disabled={isLoadingStatus}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-amber-400' : 'text-white/70'}`} />
            <span>{isLoadingStatus ? 'Checking...' : 'Ping Relay'}</span>
          </button>
          <a
            href="https://app.brevo.com/settings/keys/smtp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg active:scale-95"
          >
            <span>Brevo Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Connectivity Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Box 1: Configuration State */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">Relay Service</span>
            <span className={`w-2.5 h-2.5 rounded-full ${status?.smtpVerified ? 'bg-emerald-400 animate-pulse' : status?.configured ? 'bg-amber-400' : 'bg-red-400'}`} />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              {status?.smtpVerified ? 'Brevo Relay Authenticated' : status?.configured ? 'Credentials Detected' : 'Credentials Awaited'}
            </div>
            <p className="text-xs text-white/60 mt-1">
              {status?.configured
                ? `Login user: ${status.user || 'configured'}`
                : 'Set BREVO_SMTP_USER & BREVO_SMTP_KEY in .env to activate direct relay.'}
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
            <span>Relay Host:</span>
            <span className="text-white/80">{status?.host || 'smtp-relay.brevo.com'}</span>
          </div>
        </div>

        {/* Status Box 2: Port & Protocol */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">Port &amp; Security</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white">
              Port {status?.port || 587} (STARTTLS)
            </div>
            <p className="text-xs text-white/60 mt-1">
              Dual-Path: SMTP Relay with automatic HTTPS API (Port 443) fallback.
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
            <span>Auth State:</span>
            <span className={status?.smtpVerified ? 'text-emerald-400' : 'text-amber-400'}>
              {status?.smtpVerified ? 'Verified' : status?.smtpError?.includes('525') ? 'IP Approval Needed' : 'Checking'}
            </span>
          </div>
        </div>

        {/* Status Box 3: Verified Sender */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">Sender Profile</span>
            <Inbox className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-black text-white truncate">
              {status?.fromEmail || 'noreply@bytesandbrew.com'}
            </div>
            <p className="text-xs text-white/60 mt-1 truncate">
              Name: {status?.fromName || 'Bytes & Brew Gaming Café'}
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
            <span>API Key Auth:</span>
            <span className={status?.hasKey ? 'text-emerald-400' : 'text-amber-400'}>
              {status?.hasKey ? 'Installed' : 'Pending in .env'}
            </span>
          </div>
        </div>
      </div>

      {/* IP Authorization Alert if 525 Unauthorized IP is detected */}
      {status?.smtpError && status.smtpError.includes('525') && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-300 uppercase tracking-tight">
                Brevo Security: Authorize Cloud Server IP (Error 525)
              </h4>
              <p className="text-xs text-white/80 mt-1 max-w-2xl leading-relaxed">
                Brevo has detected an attempt from your cloud server IP. To allow emails to send, please choose one of these quick options in your Brevo account:
              </p>
              <div className="mt-2.5 flex flex-col gap-1.5 text-xs text-white/70">
                <p>
                  <strong>Option A (Easiest):</strong> Go to Brevo <a href="https://app.brevo.com/security/ip-whitelist" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">Settings &gt; Security &gt; Authorized IPs</a> and click <strong>Deactivate</strong> under <em>"Blocking unauthorized IP addresses for SMTP keys"</em>.
                </p>
                <p>
                  <strong>Option B:</strong> Add your server outbound IP <code className="bg-black/40 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">34.34.244.120</code> to your Authorized IPs list in Brevo.
                </p>
                <p>
                  <strong>Option C:</strong> Check your inbox (<strong className="text-white">raghav45078@gmail.com</strong>) for an email from Brevo titled <em>"Validate your IP address"</em> and click the confirmation link.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('34.34.244.120', 'SERVER_IP')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-xs font-mono text-amber-300 transition cursor-pointer"
          >
            {copiedVar === 'SERVER_IP' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedVar === 'SERVER_IP' ? 'IP Copied!' : 'Copy Server IP (34.34.244.120)'}</span>
          </button>
        </div>
      )}

      {/* Main Dual Grid: Test Dispatcher & Environment Configuration Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Test Email Sender */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                <span>Live Brevo SMTP Dispatch Tester</span>
              </h3>
              <p className="text-xs text-white/50 mt-1">
                Dispatch an immediate test message through Brevo SMTP relay to verify inbox arrival.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/70">
              Live Sandbox
            </span>
          </div>

          <form onSubmit={handleSendTest} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">
                Recipient Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">
                  Email Template
                </label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition cursor-pointer"
                >
                  <option value="OTP_VERIFICATION">Gamer Verification OTP Passcode</option>
                  <option value="BOOKING_CONFIRMATION">Station Booking Confirmation</option>
                  <option value="CUSTOM">Custom System Ping</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">
                  Sample OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={testOtpCode}
                  onChange={(e) => setTestOtpCode(e.target.value)}
                  disabled={testTemplate !== 'OTP_VERIFICATION'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none disabled:opacity-40 font-mono tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-white/70 mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition"
              />
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
                  testResult.success
                    ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/50 border-red-500/30 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.method && (
                    <p className="text-[11px] opacity-75 mt-0.5 font-mono">Dispatched via: {testResult.method}</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingTest}
              className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg transition cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSendingTest ? 'animate-bounce' : ''}`} />
              <span>{isSendingTest ? 'Relaying via Brevo SMTP...' : 'Dispatch Test Email Through Brevo'}</span>
            </button>
          </form>

          {/* Session Dispatch History */}
          {recentDispatches.length > 0 && (
            <div className="mt-2 pt-4 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase text-white/50 block mb-2">Session Dispatch Log</span>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {recentDispatches.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white/[0.02] p-2 rounded-lg border border-white/5">
                    <span className="text-white/80 font-mono truncate max-w-[200px]">{d.to}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">{d.time}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        d.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Brevo Credentials & Configuration Guide */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Brevo SMTP Setup Guide
              </h3>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Connect your Brevo account to send high-deliverability emails straight from your domain name.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                  1. Get Brevo SMTP Key
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Log in to <strong className="text-white">Brevo.com</strong> → Navigate to <strong className="text-blue-400">SMTP &amp; API</strong> → Select <strong className="text-white">SMTP</strong> → Click <em>Generate a new SMTP key</em>.
                </p>
              </div>

              <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                  2. Required Environment Variables
                </div>
                <p className="text-[11px] text-white/60 leading-normal mb-2">
                  Define these variables in your environment or Secrets panel:
                </p>
                
                <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                  {[
                    { key: 'BREVO_SMTP_HOST', val: 'smtp-relay.brevo.com' },
                    { key: 'BREVO_SMTP_PORT', val: '587' },
                    { key: 'BREVO_SMTP_USER', val: 'raghav45078@gmail.com' },
                    { key: 'BREVO_SMTP_KEY', val: 'xsmtpsib-your-key-here' },
                    { key: 'BREVO_FROM_EMAIL', val: 'raghav45078@gmail.com' },
                    { key: 'BREVO_FROM_NAME', val: 'Bytes & Brew Gaming Café' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleCopy(`${item.key}="${item.val}"`, item.key)}
                      className="flex items-center justify-between p-2 bg-black/40 hover:bg-black/70 rounded-lg border border-white/5 cursor-pointer group transition"
                    >
                      <span className="text-amber-300 font-bold">{item.key}</span>
                      <div className="flex items-center gap-1 text-white/40 group-hover:text-white">
                        <span className="text-[9px]">{copiedVar === item.key ? 'Copied' : 'Copy'}</span>
                        {copiedVar === item.key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
`BREVO_SMTP_HOST="smtp-relay.brevo.com"
BREVO_SMTP_PORT="587"
BREVO_SMTP_USER="raghav45078@gmail.com"
BREVO_SMTP_KEY="xsmtpsib-your-key-here"
BREVO_FROM_EMAIL="raghav45078@gmail.com"
BREVO_FROM_NAME="Bytes & Brew Gaming Café"`,
                      'ALL_ENV'
                    )
                  }
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-white/80 transition cursor-pointer"
                >
                  {copiedVar === 'ALL_ENV' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVar === 'ALL_ENV' ? 'All Variables Copied to Clipboard!' : 'Copy All .env Lines'}</span>
                </button>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dual SMTP &amp; REST Fallback</span>
                </div>
                <p className="text-[11px] text-blue-200/70 leading-normal">
                  The backend connects via Nodemailer to <code className="text-white">smtp-relay.brevo.com:587</code>. If outbound socket ports are firewalled by your cloud host, it seamlessly dispatches via Brevo’s HTTPS API on Port 443 with zero downtime!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs text-white/50">
            <span>Powered by Brevo Relay</span>
            <span className="text-emerald-400 font-mono text-[11px]">v3 Transactional Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
