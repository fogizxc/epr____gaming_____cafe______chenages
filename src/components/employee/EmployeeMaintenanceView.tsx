import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Tv,
  Clock,
  User,
  Check,
  RotateCw
} from 'lucide-react';
import { MaintenanceTicket, GamingSystem } from '../../types';

interface EmployeeMaintenanceViewProps {
  tickets: MaintenanceTicket[];
  systems: GamingSystem[];
  onReportIssue: (data: { systemId: string; issueCategory: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; description: string }) => Promise<{ success: boolean; error?: string }>;
  onResolveTicket: (ticketId: string, resolutionNotes: string) => Promise<{ success: boolean; error?: string }>;
}

export const EmployeeMaintenanceView: React.FC<EmployeeMaintenanceViewProps> = ({
  tickets,
  systems,
  onReportIssue,
  onResolveTicket
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [systemId, setSystemId] = useState(systems[0]?.id || '');
  const [issueCategory, setIssueCategory] = useState('Hardware / Peripherals');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [description, setDescription] = useState('');

  // Resolve modal
  const [resolvingTicket, setResolvingTicket] = useState<MaintenanceTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('Cleaned, tested & benchmarked. 100% operational.');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemId || !description.trim()) return;
    setIsProcessing(true);
    setErrorMsg('');
    const res = await onReportIssue({
      systemId,
      issueCategory,
      severity,
      description
    });
    setIsProcessing(false);
    if (res.success) {
      setShowReportModal(false);
      setDescription('');
    } else {
      setErrorMsg(res.error || 'Failed to report ticket.');
    }
  };

  const handleResolve = async () => {
    if (!resolvingTicket) return;
    setIsProcessing(true);
    setErrorMsg('');
    const res = await onResolveTicket(resolvingTicket.id, resolutionNotes);
    setIsProcessing(false);
    if (res.success) {
      setResolvingTicket(null);
    } else {
      setErrorMsg(res.error || 'Failed to resolve ticket.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-red-400" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Hardware Maintenance & Diagnostics
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Flag malfunctioning rigs, log peripheral defects & restore stations to service.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-red-600/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Report Rig Defect</span>
        </button>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
          All gaming stations and peripherals are currently in pristine operating condition.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-red-400">{t.id}</span>
                      <h4 className="text-base font-bold text-white">{t.systemName}</h4>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">
                      Category: {t.issueCategory}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                      t.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : t.severity === 'HIGH'
                        ? 'bg-orange-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {t.severity}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/80 my-3">
                  {t.description}
                </div>

                <div className="text-[11px] text-white/40 font-mono flex items-center justify-between">
                  <span>Reported by: {t.reportedBy}</span>
                  <span>{t.createdAt}</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/70">
                  Status: {t.status}
                </span>

                {t.status !== 'RESOLVED' ? (
                  <button
                    onClick={() => {
                      setResolvingTicket(t);
                      setErrorMsg('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Resolve & Reopen Rig</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolved</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORT DEFECT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">Report Rig Malfunction</h3>
              <button onClick={() => setShowReportModal(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleReport} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Target Station *</label>
                <select
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {systems.map((s) => (
                    <option key={s.id} value={s.id} className="bg-black text-white">
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Issue Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Hardware / Peripherals" className="bg-black text-white">Hardware / Peripherals (Mouse, Keyboard, Headset)</option>
                  <option value="Display / 240Hz Monitor" className="bg-black text-white">Display / Monitor / Cable Glitch</option>
                  <option value="Game Crash / OS BSOD" className="bg-black text-white">Game Crash / Windows Blue Screen / Steam</option>
                  <option value="Controller / Steering Wheel" className="bg-black text-white">Controller / Sim Steering Wheel Calibration</option>
                  <option value="Sanitization / Spill" className="bg-black text-white">Sanitization / Beverage Spill</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Severity (Auto-Offlines Station if Critical/High)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition ${
                        severity === sev
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the exact error, symptoms, or affected hardware..."
                  className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isProcessing ? 'Submitting...' : 'Submit Ticket & Offline Rig'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE MODAL */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black uppercase tracking-tight">Resolve Maintenance Ticket</h3>
              <button onClick={() => setResolvingTicket(null)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">✕</button>
            </div>

            <div className="text-xs text-white/60">
              Rig: <strong className="text-white">{resolvingTicket.systemName}</strong>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Resolution & Diagnostic Notes</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleResolve}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              {isProcessing ? 'Resolving...' : 'Confirm Resolved & Set Rig Available'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
