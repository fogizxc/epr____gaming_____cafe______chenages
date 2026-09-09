import React, { useState } from 'react';
import {
  Tv,
  Gamepad2,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  User,
  PlusCircle,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { GamingSystem, ActiveSession } from '../../types';

interface EmployeeFloorMapViewProps {
  systems: GamingSystem[];
  activeSessions: ActiveSession[];
  onStartWalkInForStation: (systemId: string) => void;
  onOpenSessionDetails: (sessionId: string) => void;
  onToggleMaintenance: (systemId: string) => void;
}

export const EmployeeFloorMapView: React.FC<EmployeeFloorMapViewProps> = ({
  systems,
  activeSessions,
  onStartWalkInForStation,
  onOpenSessionDetails,
  onToggleMaintenance
}) => {
  const [selectedZone, setSelectedZone] = useState<'ALL' | 'PC' | 'CONSOLE' | 'SIM_VR'>('ALL');
  const [selectedSystem, setSelectedSystem] = useState<GamingSystem | null>(null);

  const zones = [
    { id: 'ALL', label: 'All Floor Zones' },
    { id: 'PC', label: 'Zone A: Elite PC Arena' },
    { id: 'CONSOLE', label: 'Zone B: Console Pods' },
    { id: 'SIM_VR', label: 'Zone C: Sim Racing & VR' }
  ];

  const filteredSystems = systems.filter((s) => {
    if (selectedZone === 'PC') return s.category === 'PC_GAMING';
    if (selectedZone === 'CONSOLE') return s.category === 'PS5_CONSOLE' || s.category === 'XBOX_CONSOLE';
    if (selectedZone === 'SIM_VR') return s.category === 'SIM_RACING' || s.category === 'VR_RIGS';
    return true;
  });

  const getSystemSession = (systemId: string) => {
    return activeSessions.find((s) => s.systemId === systemId);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Floor Map Header & Zone Filters */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Visual Arena Floor Map
            </h2>
          </div>
          <p className="text-xs text-white/50 font-light mt-0.5">
            Real-time station occupancy, hardware diagnostic telemetry & floor dispatch.
          </p>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap shrink-0 ${
                selectedZone === zone.id
                  ? 'bg-white text-black font-black shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {zone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSystems.map((sys) => {
          const session = getSystemSession(sys.id);
          const isOccupied = sys.status === 'ACTIVE' || Boolean(session);
          const isMaintenance = sys.status === 'MAINTENANCE';
          const isReserved = sys.status === 'RESERVED';
          const isAvailable = sys.status === 'AVAILABLE' && !session;

          return (
            <div
              key={sys.id}
              onClick={() => setSelectedSystem(sys)}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                isMaintenance
                  ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                  : isOccupied
                  ? 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-500/60'
                  : isReserved
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                  : 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50'
              }`}
            >
              <div>
                {/* Station Tag & Status Pill */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white uppercase tracking-tight">
                        {sys.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/50 font-mono block mt-0.5">
                      {sys.category.replace('_', ' ')} • ₹{sys.hourlyRate}/hr
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-black tracking-wider ${
                      isMaintenance
                        ? 'bg-red-600 text-white'
                        : isOccupied
                        ? 'bg-cyan-600 text-white animate-pulse'
                        : isReserved
                        ? 'bg-amber-500 text-black'
                        : 'bg-emerald-500 text-black'
                    }`}
                  >
                    {isOccupied ? 'ACTIVE' : sys.status}
                  </span>
                </div>

                {/* Live Occupant / Status Info */}
                {isOccupied && session ? (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 mb-3">
                    <div className="text-xs font-bold text-white truncate">
                      {session.customerName}
                    </div>
                    <div className="text-[11px] text-cyan-400 font-mono flex items-center justify-between">
                      <span>Ends: {session.endTime}</span>
                      <span>₹{session.totalCharge}</span>
                    </div>
                    <div className="text-[10px] text-white/40 truncate">
                      Game: {session.gameTitle || 'Active Game'}
                    </div>
                  </div>
                ) : isMaintenance ? (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4 shrink-0 text-red-400" />
                    <span>Station under diagnostic / repair</span>
                  </div>
                ) : isReserved ? (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs mb-3">
                    Reserved for upcoming player
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Cleaned, sanitized & ready to play</span>
                  </div>
                )}

                {/* Specs snapshot */}
                <div className="text-[11px] text-white/50 font-mono space-y-0.5 mb-3">
                  <div>GPU: {sys.specs.gpu}</div>
                  <div>Disp: {sys.specs.display}</div>
                </div>
              </div>

              {/* Station Quick Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                {isAvailable ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartWalkInForStation(sys.id);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Seat Walk-in</span>
                  </button>
                ) : isOccupied && session ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSessionDetails(session.id);
                    }}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Manage Player
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMaintenance(sys.id);
                    }}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    {isMaintenance ? 'Release Rig' : 'Mark Issue'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
