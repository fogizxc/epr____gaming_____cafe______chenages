import React from 'react';
import {
  PlusCircle,
  QrCode,
  Clock,
  Tv,
  Coffee,
  Receipt,
  Users,
  Wrench,
  DollarSign,
  Search,
  Zap
} from 'lucide-react';
import { EmployeeTab } from '../../types';

interface EmployeeQuickActionsProps {
  currentTab: EmployeeTab;
  onSelectTab: (tab: EmployeeTab) => void;
  onOpenWalkInModal: () => void;
  onOpenShiftModal: () => void;
}

export const EmployeeQuickActions: React.FC<EmployeeQuickActionsProps> = ({
  currentTab,
  onSelectTab,
  onOpenWalkInModal,
  onOpenShiftModal
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Primary Walk-in & Scan Strip */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Main High-Priority 1-Click Walk-in */}
        <button
          id="btn-emp-quick-walkin"
          onClick={onOpenWalkInModal}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-5 py-3.5 rounded-xl shadow-lg shadow-red-600/25 transition cursor-pointer active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Walk-in Session</span>
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono font-normal bg-black/30 rounded border border-white/20">
            N
          </kbd>
        </button>

        {/* QR Scan & Arrival Check-in */}
        <button
          id="btn-emp-quick-checkin"
          onClick={() => onSelectTab('BOOKINGS')}
          className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider px-4 py-3.5 rounded-xl border transition cursor-pointer active:scale-98 ${
            currentTab === 'BOOKINGS'
              ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
              : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
          }`}
        >
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span>Booking QR Check-In</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono font-normal bg-black/40 rounded border border-white/10 text-white/70">
            B
          </kbd>
        </button>

        {/* Fast Cash Drawer */}
        <button
          id="btn-emp-quick-shift"
          onClick={onOpenShiftModal}
          className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition cursor-pointer active:scale-98"
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Shift Drawer</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs Bar (Scrollable for tablet/mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-white/5">
        {[
          { id: 'DASHBOARD' as EmployeeTab, label: 'Overview', icon: Zap },
          { id: 'SESSIONS' as EmployeeTab, label: 'Live Sessions', icon: Clock, keyHint: 'S' },
          { id: 'FLOOR' as EmployeeTab, label: 'Floor Map', icon: Tv, keyHint: 'F' },
          { id: 'BOOKINGS' as EmployeeTab, label: 'Bookings', icon: QrCode, keyHint: 'B' },
          { id: 'FNB' as EmployeeTab, label: 'F&B POS', icon: Coffee, keyHint: 'O' },
          { id: 'BILLING' as EmployeeTab, label: 'Invoices & Billing', icon: Receipt, keyHint: 'P' },
          { id: 'WAITLIST' as EmployeeTab, label: 'Waitlist', icon: Users, keyHint: 'W' },
          { id: 'CUSTOMERS' as EmployeeTab, label: 'Gamers CRM', icon: Users },
          { id: 'MAINTENANCE' as EmployeeTab, label: 'Maintenance', icon: Wrench, keyHint: 'M' },
          { id: 'SHIFT' as EmployeeTab, label: 'Cash Ledger', icon: DollarSign },
          { id: 'ACTIVITY' as EmployeeTab, label: 'Audit Trail', icon: Zap }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`emp-tab-${item.id.toLowerCase()}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-white/40'}`} />
              <span>{item.label}</span>
              {item.keyHint && (
                <span className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-white/40">
                  {item.keyHint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
