import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Gamepad2,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EmployeeCustomerRecord } from '../../types';

interface EmployeeCustomersViewProps {
  onSelectCustomerForWalkIn: (customer: EmployeeCustomerRecord) => void;
}

export const EmployeeCustomersView: React.FC<EmployeeCustomersViewProps> = ({
  onSelectCustomerForWalkIn
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<EmployeeCustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCustomers = async (query = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employee/customers?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [searchQuery]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/employee/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          gamerTag: gamerTag.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setName('');
        setPhone('');
        setEmail('');
        setGamerTag('');
        fetchCustomers(searchQuery);
      } else {
        setErrorMsg(data.error || 'Failed to create customer.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Search */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Gamer Directory & Membership CRM
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Look up gamer profiles, verify membership perks & inspect visit histories.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, @tag..."
              className="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Gamer</span>
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-base font-bold text-white">{c.name}</h4>
                  {c.gamerTag && (
                    <span className="text-xs font-mono text-cyan-400">@{c.gamerTag}</span>
                  )}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 font-bold">
                  {c.membershipTier || 'Casual'}
                </span>
              </div>

              <div className="text-xs text-white/50 font-mono space-y-1 mb-3">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-white/30" />
                  <span>{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-white/30 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 grid grid-cols-2 gap-2 text-[11px] font-mono mb-3">
                <div>
                  <span className="text-white/40 block text-[9px] uppercase">Wallet</span>
                  <span className="text-emerald-400 font-bold">₹{c.walletBalance}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[9px] uppercase">Total Visits</span>
                  <span className="text-white font-bold">{c.totalVisits} sessions</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectCustomerForWalkIn(c)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Start Walk-In For Gamer
            </button>
          </div>
        ))}
      </div>

      {/* NEW GAMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">Register New Gamer</h3>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Phone Number (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">GamerTag / Discord Handle</label>
                <input
                  type="text"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  placeholder="e.g. shadow_sniper"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-cyan-600/30"
              >
                {isProcessing ? 'Enrolling...' : 'Enroll Gamer Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
