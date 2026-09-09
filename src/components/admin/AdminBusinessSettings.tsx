import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Percent,
  Radio,
  Save,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  Volume2
} from 'lucide-react';
import { CafeBusinessSettings } from '../../types';
import { INITIAL_BUSINESS_SETTINGS } from '../../data/adminInitialData';

export const AdminBusinessSettings: React.FC = () => {
  const [settings, setSettings] = useState<CafeBusinessSettings>(INITIAL_BUSINESS_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {isSaved && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">Business settings, operating hours, and tax configurations updated successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Enterprise Configuration
            </span>
            <span className="text-xs text-white/50 font-mono">
              GSTIN: {settings.gstin}
            </span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-tight">
            Café Business Profile & Operating Policies
          </h2>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Configure legal establishment profile, GST invoicing numbers, operating timings, and floor broadcast banners.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-400/20 active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section 1: Business Identity & Legal GST */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Building2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              Establishment Identity & Invoicing Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 block mb-1">Café Brand Name</label>
              <input
                type="text"
                required
                value={settings.cafeName}
                onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Brand Tagline</label>
              <input
                type="text"
                value={settings.brandTagline}
                onChange={(e) => setSettings({ ...settings, brandTagline: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">GSTIN (Tax Identification Number)</label>
              <input
                type="text"
                required
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-white/60 block mb-1">Street Address</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">City / Hub</label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">State / Postal Code</label>
              <input
                type="text"
                value={`${settings.state} - ${settings.postalCode}`}
                onChange={(e) => {
                  const parts = e.target.value.split('-');
                  setSettings({
                    ...settings,
                    state: parts[0]?.trim() || settings.state,
                    postalCode: parts[1]?.trim() || settings.postalCode
                  });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Operating Timings & Hours */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              Operating Schedule & Facility Hours
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-white/60 block mb-1">Daily Opening Time</label>
              <input
                type="time"
                value={settings.operatingHours.open}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    operatingHours: { ...settings.operatingHours, open: e.target.value }
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Weekday Closing Time</label>
              <input
                type="time"
                value={settings.operatingHours.close}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    operatingHours: { ...settings.operatingHours, close: e.target.value }
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Weekend LAN Closing Time</label>
              <input
                type="time"
                value={settings.operatingHours.weekendClose}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    operatingHours: { ...settings.operatingHours, weekendClose: e.target.value }
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-cyan-400 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tax & Billing Policy */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Percent className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-black uppercase text-white tracking-wider">
              Tax Rates & Booking Policies
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">GST Tax Calculation</span>
                <span className="text-[11px] text-white/50">Apply GST on gaming & snacks</span>
              </div>
              <input
                type="checkbox"
                checked={settings.taxGstEnabled}
                onChange={(e) => setSettings({ ...settings, taxGstEnabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">GST Tax Percentage (%)</label>
              <input
                type="number"
                value={settings.taxGstPercentage}
                onChange={(e) => setSettings({ ...settings, taxGstPercentage: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-400 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Cancellation Grace Period (Mins)</label>
              <input
                type="number"
                value={settings.cancellationGracePeriodMins}
                onChange={(e) => setSettings({ ...settings, cancellationGracePeriodMins: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-400 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Floor Broadcast Message */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-black uppercase text-white tracking-wider">
                Emergency Floor Audio & Screen Announcement Ticker
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Live Ticker Status:</span>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, emergencyBroadcastActive: !settings.emergencyBroadcastActive })}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  settings.emergencyBroadcastActive
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {settings.emergencyBroadcastActive ? 'BROADCASTING LIVE' : 'MUTED'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60 block mb-1">Broadcast Banner Text</label>
            <input
              type="text"
              value={settings.emergencyBroadcastMessage || ''}
              onChange={(e) => setSettings({ ...settings, emergencyBroadcastMessage: e.target.value })}
              placeholder="e.g. Attention Gamers: Scheduled server maintenance in 15 minutes."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-red-400 outline-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
