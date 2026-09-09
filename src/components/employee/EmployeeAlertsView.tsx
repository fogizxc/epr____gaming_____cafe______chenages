import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Check
} from 'lucide-react';
import { OperationalAlert } from '../../types';

interface EmployeeAlertsViewProps {
  alerts: OperationalAlert[];
  onResolveAlert: (alertId: string) => void;
}

export const EmployeeAlertsView: React.FC<EmployeeAlertsViewProps> = ({
  alerts,
  onResolveAlert
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Operational Real-Time Alerts
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Monitor station expiring warnings, collision notices, hardware alerts and customer calls.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                filterSeverity === sev
                  ? 'bg-white text-black font-black'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
            No active alerts matching filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                alert.resolved
                  ? 'bg-white/[0.01] border-white/5 opacity-50'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-red-950/20 border-red-500/40'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-cyan-950/20 border-cyan-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-600/30 text-red-400'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-600/30 text-amber-400'
                      : 'bg-cyan-600/30 text-cyan-400'
                  }`}
                >
                  {alert.severity === 'CRITICAL' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : alert.severity === 'WARNING' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-600 text-white'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-600 text-white'
                          : 'bg-cyan-600 text-white'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-1 font-light">{alert.message}</p>
                  <div className="text-[10px] text-white/40 font-mono mt-1">
                    {alert.timestamp} {alert.systemId && `• Target: ${alert.systemId}`}
                  </div>
                </div>
              </div>

              {!alert.resolved && (
                <button
                  onClick={() => onResolveAlert(alert.id)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer self-end sm:self-center shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
