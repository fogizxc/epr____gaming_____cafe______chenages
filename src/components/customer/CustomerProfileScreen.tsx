import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import {
  User,
  Shield,
  Gamepad2,
  Lock,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Trophy,
  Wallet,
  LogOut,
  Edit2,
  Save,
  X
} from 'lucide-react';

export const CustomerProfileScreen: React.FC = () => {
  const { currentUser, customerMembership, walletBalance, loyaltyPoints, logout } = useCafe();

  const [gamerTag, setGamerTag] = useState(currentUser?.gamerTag || 'ApexStriker99');
  const [fullName, setFullName] = useState(currentUser?.name || 'Andy Patel');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98991 12233');
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveProfile = () => {
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSavePassword = () => {
    if (!newPassword) return;
    setPasswordSuccess(true);
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setPasswordSuccess(false);
      setOldPassword('');
      setNewPassword('');
    }, 1500);
  };

  return (
    <div id="screen-customer-profile" className="flex flex-col gap-8 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-red-600 block mb-1">
            Gamer Identity & Security
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <User className="w-8 h-8 text-white/80" />
            <span>Profile & Account Preferences</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Manage your arena gamer tag, hardware preferences, contact information, and authentication security.
          </p>
        </div>

        <button
          onClick={logout}
          className="px-5 py-3 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/20 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Gamer Avatar & Quick Stats Card */}
        <div className="rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-2xl">
          <div className="relative">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=300&auto=format&fit=crop'}
              alt="Avatar"
              className="w-28 h-28 rounded-3xl object-cover ring-4 ring-red-600/30 shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-[#0c0c0c] rounded-full" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {gamerTag}
            </h2>
            <span className="text-xs text-white/50 block mt-0.5">{fullName}</span>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>{customerMembership?.planName || 'Elite Tier Member'}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="w-full grid grid-cols-2 gap-3 pt-6 border-t border-white/10 text-left">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Wallet</span>
              <span className="text-lg font-black text-emerald-400 font-mono">₹{walletBalance}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold">Nexus XP</span>
              <span className="text-lg font-black text-amber-400 font-mono">{loyaltyPoints}</span>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Account Details & Preferences Form */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Account Information
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              )}
            </div>

            {savedSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            {/* Inputs Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Gamer Tag</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] disabled:opacity-70 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] disabled:opacity-70 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || 'andy@example.com'}
                  className="w-full px-4 py-3 bg-white/[0.02] opacity-60 border border-white/5 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] disabled:opacity-70 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Security Section */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Security & Credentials</span>
                </h4>
                <p className="text-xs text-white/50 mt-0.5">Protect your wallet credits and saved payment tokens.</p>
              </div>

              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0e0e0e] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Update Account Password</span>
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">New Secure Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
