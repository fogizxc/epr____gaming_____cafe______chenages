import React, { useState, useEffect } from 'react';
import { useCafe } from '../../context/CafeContext';
import { SupportTicket, SupportTicketCategory } from '../../types';
import {
  Headphones,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  X,
  PhoneCall,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const SupportScreen: React.FC = () => {
  const { activeSessions, requireLogin } = useCafe();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New ticket state
  const [category, setCategory] = useState<SupportTicketCategory>('CONTROLLER');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedSystemName, setSelectedSystemName] = useState('');

  // Selected ticket for thread
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const mySession = activeSessions.find((s) => s.status === 'ACTIVE');

  // Load tickets from server
  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
        if (activeTicket) {
          const updated = data.tickets.find((t: SupportTicket) => t.id === activeTicket.id);
          if (updated) setActiveTicket(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) return;

    requireLogin(async () => {
      try {
        const res = await fetch('/api/support/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            subject,
            message,
            systemId: mySession?.systemId,
            systemName: mySession ? mySession.systemName : selectedSystemName || 'General Lounge'
          })
        });
        const data = await res.json();
        if (data.success) {
          setIsCreateOpen(false);
          setSubject('');
          setMessage('');
          loadTickets();
        }
      } catch (err) {
        console.error(err);
      }
    }, 'Please log in to submit a support request.');
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;

    try {
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'ANDY PATEL',
          senderRole: 'CUSTOMER',
          message: replyText
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        loadTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="screen-support" className="flex flex-col gap-8 pb-12 animate-fadeIn select-none">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-purple-400 block mb-1">
            24/7 Floor Support & Technician Concierge
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Headphones className="w-8 h-8 text-purple-400" />
            <span>Assistance & Help Center</span>
          </h1>
          <p className="text-sm text-white/60 font-light mt-1 max-w-xl">
            Request peripheral replacements, report network pings, query game updates, or communicate directly with floor technicians in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={loadTickets}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition flex items-center gap-2 text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Support Request</span>
          </button>
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tickets List */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block">
            Your Support Requests ({tickets.length})
          </span>

          {tickets.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#0c0c0c] border border-white/10 text-center text-xs text-white/40">
              No support tickets found. Everything is running smoothly!
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = activeTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTicket(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 shadow-md'
                      : 'bg-[#0c0c0c] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-purple-400 font-bold">{t.id}</span>
                    <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1">
                    {t.subject}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                    <span>{t.systemName || 'Arena Floor'}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 2 Cols: Active Ticket Conversation Thread */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0c0c0c] border border-white/10 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl min-h-[400px]">
          {activeTicket ? (
            <div className="flex flex-col justify-between h-full gap-6">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-400">{activeTicket.id}</span>
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        {activeTicket.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mt-1">
                      {activeTicket.subject}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-white/40 block">Assigned To</span>
                    <span className="text-xs font-bold text-white">{activeTicket.assignedStaffName || 'Floor Technician'}</span>
                  </div>
                </div>

                {/* Conversation Messages */}
                <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                  {activeTicket.messages.map((m) => {
                    const isStaff = m.senderRole === 'STAFF' || m.senderRole === 'ADMIN';
                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-2xl text-xs max-w-md ${
                          isStaff
                            ? 'bg-purple-950/40 border border-purple-500/30 text-white self-start'
                            : 'bg-white/10 text-white self-end'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] text-white/40 mb-1">
                          <span className="font-bold text-white/80">{m.sender}</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="font-light leading-relaxed">{m.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Input */}
              <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder="Type message to technician..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSendReply}
                  className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-3">
              <MessageSquare className="w-12 h-12 text-white/20" />
              <h3 className="text-base font-bold text-white uppercase tracking-tight">
                Select a Support Request
              </h3>
              <p className="text-xs text-white/40 max-w-sm">
                Choose a ticket from the left panel to inspect live technician updates or send responses.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW TICKET MODAL */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0e0e0e] border border-white/15 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Headphones className="w-5 h-5 text-purple-400" />
                <span>New Assistance Request</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Submit an issue directly to floor staff. Technicians are immediately notified on their terminal.
            </p>

            {/* Category selection */}
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Issue Category</label>
              <div className="grid grid-cols-2 gap-2">
                {(['CONTROLLER', 'NETWORK', 'GAME_PROBLEM', 'FOOD', 'STATION', 'GENERAL'] as SupportTicketCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer text-left ${
                      category === cat
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Subject Summary</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., PS5 Controller Stick Drift, Discord audio issue..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Detailed description */}
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">Details / Error Code</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what happened or what assistance you require..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-600/30"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
