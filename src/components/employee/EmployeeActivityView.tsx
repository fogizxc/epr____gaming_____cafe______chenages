import React, { useState } from 'react';
import {
  Zap,
  Filter,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Coffee,
  DollarSign,
  ArrowRightLeft,
  Calendar
} from 'lucide-react';
import { EmployeeActivity } from '../../types';

interface EmployeeActivityViewProps {
  activities: EmployeeActivity[];
}

export const EmployeeActivityView: React.FC<EmployeeActivityViewProps> = ({
  activities
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredActivities = activities.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.actionType === filterType;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Operational Audit Trail
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Immutable log of all floor actions, financial transactions & session mutations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'WALK_IN', label: 'Walk-ins' },
            { id: 'EXTEND_SESSION', label: 'Extensions' },
            { id: 'TRANSFER_SESSION', label: 'Transfers' },
            { id: 'CHECK_IN_BOOKING', label: 'Check-Ins' },
            { id: 'FNB_ORDER', label: 'F&B' },
            { id: 'CASH_EXPENSE', label: 'Expenses' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === item.id
                  ? 'bg-white text-black font-black'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10">
        <div className="space-y-3">
          {filteredActivities.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-xs italic">
              No activity records match this filter.
            </div>
          ) : (
            filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0 font-mono text-[10px] font-bold">
                    {act.actionType.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-white/90">
                      {act.description}
                    </div>
                    <div className="text-[11px] text-white/40 font-mono mt-0.5">
                      Staff: <strong className="text-white/70">{act.employeeName}</strong>
                      {act.targetEntityId && (
                        <span> • Ref: <span className="text-cyan-400 font-mono">{act.targetEntityId}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-white/40 shrink-0 self-end sm:self-center">
                  {act.timestamp}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
