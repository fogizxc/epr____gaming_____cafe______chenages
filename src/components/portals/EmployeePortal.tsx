import React, { useState } from 'react';
import { useCafe } from '../../context/CafeContext';
import { ActiveSessionBanner } from '../ActiveSessionBanner';
import {
  Zap,
  Users,
  Clock,
  PlusCircle,
  Search,
  CheckCircle2,
  Printer,
  DollarSign,
  Coffee,
  Trophy,
  AlertCircle,
  FileText
} from 'lucide-react';

interface EmployeePortalProps {
  onOpenFnB: (sessionId: string) => void;
  onOpenQuickWalkIn: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  onOpenFnB,
  onOpenQuickWalkIn
}) => {
  const {
    systems,
    activeSessions,
    bookings,
    checkInBooking,
    employeeShift,
    startShift,
    endShift,
    tournaments,
    tournamentTeams,
    checkInTournamentTeam,
    invoices,
    setActiveInvoiceForModal
  } = useCafe();

  const [qrInput, setQrInput] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Tournament check-in search
  const [tournSearch, setTournSearch] = useState('');
  const [assignedStationInput, setAssignedStationInput] = useState('PC-01 to PC-04');

  // Shift cash close modal
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<number>(employeeShift.openingCash + employeeShift.cashSales);
  const [shiftResult, setShiftResult] = useState<{ expected: number; diff: number } | null>(null);

  // System counts
  const totalSystems = systems.length;
  const activeCount = systems.filter(s => s.status === 'ACTIVE').length;
  const availableCount = systems.filter(s => s.status === 'AVAILABLE').length;
  const reservedCount = systems.filter(s => s.status === 'RESERVED').length;
  const maintenanceCount = systems.filter(s => s.status === 'MAINTENANCE').length;

  const handleQrCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInMsg(null);
    if (!qrInput.trim()) return;

    const res = checkInBooking(qrInput.trim());
    if (res.success) {
      setCheckInMsg({ success: true, text: `✓ Check-in confirmed! Session started successfully.` });
      setQrInput('');
    } else {
      setCheckInMsg({ success: false, text: res.error || 'Invalid booking code.' });
    }
  };

  const handleTournamentTeamCheckIn = (teamId: string) => {
    checkInTournamentTeam(teamId, assignedStationInput);
  };

  const handleEndShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = endShift(Number(actualCashInput));
    setShiftResult({ expected: res.expectedCash, diff: res.difference });
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Banner: Fast Counter Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.02)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white">
              Operational Desk
            </span>
            <span className="text-[11px] text-white/50 font-light">
              Shift Lead: <strong className="text-white font-medium">{employeeShift.employeeName}</strong>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Front-Desk Operations
          </h2>
          <p className="text-xs text-white/50 font-light mt-1 max-w-xl">
            Speed-optimized counter workflow for instant customer walk-ins, station timers, and bill printing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick 1-Click Walk-in */}
          <button
            id="employee-walkin-btn"
            onClick={onOpenQuickWalkIn}
            className="flex items-center gap-2 bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)] transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Walk-in Session</span>
          </button>

          {/* Cash Drawer summary button */}
          <button
            onClick={() => setShowCloseShift(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-3 rounded-xl transition cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-white/70" />
            <span>Cash Drawer (₹{employeeShift.openingCash + employeeShift.cashSales})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Section 13) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">Active Sessions</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{activeCount}</div>
          <span className="text-[10px] text-white/40 font-light">Live players on floor</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">Available Rigs</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{availableCount}</div>
          <span className="text-[10px] text-white/40 font-light">Ready for walk-ins</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">Today's Bookings</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{bookings.length}</div>
          <span className="text-[10px] text-white/40 font-light">{reservedCount} reserved upcoming</span>
        </div>
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 block">Shift Cash Collected</span>
          <div className="text-2xl font-black text-white font-mono mt-1">₹{employeeShift.cashSales}</div>
          <span className="text-[10px] text-white/40 font-light">Total Sales: ₹{employeeShift.cashSales + employeeShift.upiSales}</span>
        </div>
      </div>

      {/* Fast QR Check-In Scanner & Search Input (Section 21) */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-white/70" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Fast QR Check-in & Customer Arrival
          </h3>
        </div>
        <form onSubmit={handleQrCheckIn} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Scan or enter Booking ID or QR pass (e.g. bk-2026-101 or NEXUS-BK-101-ANDY)"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            className="bg-white text-black hover:bg-white/90 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            Check In
          </button>
        </form>

        {checkInMsg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              checkInMsg.success
                ? 'bg-white/10 border border-white/20 text-white'
                : 'bg-red-950/70 border border-red-500/50 text-red-300'
            }`}
          >
            <span>{checkInMsg.text}</span>
          </div>
        )}
      </div>

      {/* Live Active Sessions on Floor with Timers (Section 22-25) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <span>Active Live Sessions ({activeSessions.length})</span>
          </h3>
          <span className="text-xs text-white/40 font-light">
            Real-time synchronized countdown timers
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-white/40 text-xs font-light">
            No active sessions on floor right now. Start one using Quick Walk-in above.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeSessions.map((session) => (
              <ActiveSessionBanner
                key={session.id}
                session={session}
                onOpenFnBModal={onOpenFnB}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tournament Teams Check-In & Station Assignment (Section 58 & 59) */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-white/70" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Tournament Team Check-In & Rig Assignment
            </h3>
          </div>
          <span className="text-xs text-white/40 font-light">
            Valorant / BGMI LAN Matches
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tournamentTeams.map((team) => (
            <div
              key={team.id}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                    {team.teamName}
                  </h4>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      team.checkInStatus === 'CHECKED_IN'
                        ? 'bg-white/10 text-white border border-white/15'
                        : 'bg-white/5 text-white/50 border border-white/10'
                    }`}
                  >
                    {team.checkInStatus}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1 font-light">
                  Captain: {team.captainName} ({team.captainPhone})
                </p>
                <p className="text-[11px] text-white/40 font-light">
                  4 Squad Players: {team.players.map(p => p.name).join(', ')}
                </p>
                {team.assignedStationRange && (
                  <p className="text-xs text-white font-mono font-bold mt-1">
                    Assigned: {team.assignedStationRange}
                  </p>
                )}
              </div>

              {team.checkInStatus !== 'CHECKED_IN' && (
                <button
                  onClick={() => handleTournamentTeamCheckIn(team.id)}
                  className="bg-white text-black hover:bg-white/90 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                >
                  Check In Team
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Print Recent Bills (Section 44: Employee Print Option) */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-white/60" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Counter Print Station (A4 & Thermal 80mm)
            </h3>
          </div>
          <span className="text-xs text-white/40 font-light">
            No Admin credentials needed to print customer receipts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {invoices.slice(0, 4).map((inv) => (
            <div
              key={inv.id}
              className="p-3.5 bg-white/[0.03] rounded-xl border border-white/10 flex items-center justify-between"
            >
              <div>
                <span className="font-mono text-xs font-bold text-white">{inv.invoiceNumber}</span>
                <p className="text-xs text-white/70 font-light">{inv.customerName} • {inv.systemName}</p>
                <span className="text-[10px] text-white/40">Total: ₹{inv.total}</span>
              </div>
              <button
                onClick={() => setActiveInvoiceForModal(inv)}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* End Shift / Cash Drawer Modal (Section 69 & 70) */}
      {showCloseShift && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-white backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.03)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Shift End Cash Reconciliation
              </h3>
              <button
                onClick={() => setShowCloseShift(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs text-white/60 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-2 text-xs">
              <div className="flex justify-between text-white/50">
                <span>Opening Cash in Drawer:</span>
                <span className="font-mono text-white">₹{employeeShift.openingCash}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Cash Sales this Shift:</span>
                <span className="font-mono text-white">₹{employeeShift.cashSales}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Expenses / Payouts:</span>
                <span className="font-mono text-white">-₹{employeeShift.expenses}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-white/10">
                <span>Expected Cash Total:</span>
                <span className="font-mono text-white">
                  ₹{employeeShift.openingCash + employeeShift.cashSales - employeeShift.expenses}
                </span>
              </div>
            </div>

            <form onSubmit={handleEndShiftSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-1">
                  Actual Cash Counted in Drawer (₹)
                </label>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-white/30 focus:outline-none"
                  required
                />
              </div>

              {shiftResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    shiftResult.diff === 0
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-red-950/70 text-red-300 border border-red-500/50'
                  }`}
                >
                  {shiftResult.diff === 0
                    ? '✓ Cash drawer matches perfectly (Difference: ₹0).'
                    : `Discrepancy: ${shiftResult.diff > 0 ? `+₹${shiftResult.diff} Surplus` : `-₹${Math.abs(shiftResult.diff)} Shortage`}`}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.05)] transition cursor-pointer"
              >
                Confirm & Reconcile Shift
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
