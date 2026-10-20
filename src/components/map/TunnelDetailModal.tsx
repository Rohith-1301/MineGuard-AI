import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Compass, 
  Users, 
  Wind, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets, 
  Radio, 
  ArrowRight, 
  ShieldAlert, 
  Volume2, 
  Navigation, 
  Crosshair, 
  Check, 
  Zap, 
  ExternalLink,
  ShieldCheck,
  MapPin,
  Clock,
  Battery
} from 'lucide-react';
import { TunnelNode, Worker } from '../../types';

interface TunnelDetailModalProps {
  tunnel: TunnelNode | null;
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onSelectWorker: (worker: Worker) => void;
  onDispatchRover: (tunnelId: string) => void;
  onSoundAlarm: () => void;
}

export const TunnelDetailModal: React.FC<TunnelDetailModalProps> = ({
  tunnel,
  isOpen,
  onClose,
  workers,
  onSelectWorker,
  onDispatchRover,
  onSoundAlarm
}) => {
  const [hapticPingedId, setHapticPingedId] = useState<string | null>(null);

  if (!isOpen || !tunnel) return null;

  // Find all workers in this tunnel
  const tunnelWorkers = workers.filter(
    w => w.zoneId === tunnel.id || tunnel.workersPresent.includes(w.id)
  );

  // Separate workers into warning/critical vs safe
  const warningWorkers = tunnelWorkers.filter(
    w => w.status === 'CRITICAL' || 
         w.status === 'WARNING' || 
         w.movement === 'POSSIBLE_FALL' || 
         w.movement === 'LOW_MOVEMENT' || 
         (w.vitals && w.vitals.heartRate > 90) || 
         w.environmentalExposure.methane > 1.0
  );

  const safeWorkers = tunnelWorkers.filter(
    w => !warningWorkers.some(warnW => warnW.id === w.id)
  );

  const isCritical = tunnel.status === 'CRITICAL' || tunnel.blocked;
  const isWarning = tunnel.status === 'WARNING';

  const handlePingHelmet = (workerId: string) => {
    setHapticPingedId(workerId);
    onSoundAlarm();
    setTimeout(() => {
      setHapticPingedId(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          isCritical 
            ? 'bg-red-950/50 border-red-500/40' 
            : isWarning 
            ? 'bg-amber-950/40 border-amber-500/40' 
            : 'bg-[#0d1422] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isCritical
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/20 text-mine-cyan border-cyan-500/40'
            }`}>
              <Layers className="w-5 h-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold font-mono text-white tracking-wide">
                  {tunnel.name}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  SECTOR: {tunnel.id}
                </span>
                <span className={`text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                  isCritical 
                    ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' 
                    : isWarning 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                }`}>
                  {isCritical ? 'CRITICAL HAZARD' : isWarning ? 'ELEVATED WARNING' : 'SAFE DRIFT'}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
                <span>Subsurface Horizon Level: <strong className="text-white">{tunnel.depthLevel ?? -180}m</strong></span>
                <span>•</span>
                <span>Zone: <strong className="text-cyan-300">{tunnel.zone}</strong></span>
                <span>•</span>
                <span>Ventilation: <strong className="text-emerald-400">{tunnel.airflowVelocity ?? 1.8} m/s ({tunnel.airflowDirection ?? 'INBYE'})</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Close Window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs font-mono">

          {/* Section 1: Rover & Hazard Warning Banner if Applicable */}
          {tunnel.blocked && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/70 text-red-200 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                <div>
                  <div className="font-bold text-sm text-red-100">TUNNEL PASSAGEWAY RESTRICTED BY SAFETY INTERLOCK</div>
                  <div className="text-xs text-red-300 mt-0.5">{tunnel.blockReason || 'Hazardous atmospheric condition detected. Statutory evacuation protocol active.'}</div>
                </div>
              </div>
              <button
                onClick={() => onDispatchRover(tunnel.id)}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold whitespace-nowrap shadow transition-colors"
              >
                Dispatch Rover Sweep
              </button>
            </div>
          )}

          {/* Section 2: Complete Tunnel Engineering & Atmospheric Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  TUNNEL PHYSICAL BLUEPRINT & GAS MATRIX
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Continuous Drift Sensor Array</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* CH4 */}
              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                tunnel.methane > 1.25 ? 'bg-red-950/40 border-red-500/60' : tunnel.methane > 0.8 ? 'bg-amber-950/30 border-amber-500/50' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <span className="text-[10px] text-slate-400 block uppercase">CH₄ Methane</span>
                <div className={`text-lg font-bold font-mono my-1 ${
                  tunnel.methane > 1.25 ? 'text-red-400' : tunnel.methane > 0.8 ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {tunnel.methane}%
                </div>
                <span className="text-[9px] text-slate-500">Statutory: &lt;1.0%</span>
              </div>

              {/* CO */}
              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                tunnel.co > 35 ? 'bg-red-950/40 border-red-500/60' : tunnel.co > 25 ? 'bg-amber-950/30 border-amber-500/50' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <span className="text-[10px] text-slate-400 block uppercase">CO Carbon Monoxide</span>
                <div className={`text-lg font-bold font-mono my-1 ${
                  tunnel.co > 35 ? 'text-red-400' : tunnel.co > 25 ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {tunnel.co} <span className="text-xs font-normal">ppm</span>
                </div>
                <span className="text-[9px] text-slate-500">Threshold: &lt;25 ppm</span>
              </div>

              {/* O2 */}
              <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                tunnel.o2 < 19.5 ? 'bg-red-950/40 border-red-500/60' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <span className="text-[10px] text-slate-400 block uppercase">O₂ Oxygen</span>
                <div className={`text-lg font-bold font-mono my-1 ${
                  tunnel.o2 < 19.5 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {tunnel.o2}%
                </div>
                <span className="text-[9px] text-slate-500">Normal: 19.5 - 23.5%</span>
              </div>

              {/* Temperature */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 block uppercase">Drift Temp</span>
                <div className="text-lg font-bold font-mono text-white my-1">
                  {tunnel.temp}°C
                </div>
                <span className="text-[9px] text-slate-500">Humidity: {tunnel.humidity ?? 68}%</span>
              </div>

              {/* Length & Profile */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 block uppercase">Total Drift Length</span>
                <div className="text-lg font-bold font-mono text-white my-1">
                  {tunnel.lengthMeters ?? 280}m
                </div>
                <span className="text-[9px] text-cyan-400 truncate">{tunnel.crossSection ?? '4.5m × 3.8m Arch'}</span>
              </div>

              {/* Strata Stability */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 block uppercase">RQD Strata Rating</span>
                <div className="text-lg font-bold font-mono text-emerald-400 my-1">
                  {tunnel.rqdStability ?? 88}%
                </div>
                <span className="text-[9px] text-slate-500">Dust: {tunnel.dustLevel ?? 1.8} mg/m³</span>
              </div>
            </div>
          </div>

          {/* Section 3: Engineering Tunnel Elevation & Cross-Section Graphic */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                TUNNEL ARCH CROSS-SECTION & LONGITUDINAL PROFILE
              </span>
              <span>Coordinates: X:{tunnel.coords.x} Y:{tunnel.coords.y}</span>
            </div>

            <div className="w-full h-32 bg-[#060a11] rounded border border-slate-800/80 relative flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 700 130" className="w-full h-full">
                {/* Subterranean strata background pattern */}
                <defs>
                  <pattern id="rockPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="20" y2="20" stroke="#1e293b" strokeWidth="1" />
                    <line x1="20" y1="0" x2="0" y2="20" stroke="#1e293b" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="700" height="130" fill="url(#rockPattern)" opacity="0.3" />

                {/* Tunnel Excavation Drift Body */}
                <path 
                  d="M 50 110 L 650 110 L 650 40 Q 350 20 50 40 Z" 
                  fill="#0b1329" 
                  stroke="#334155" 
                  strokeWidth="2" 
                />

                {/* Overhead Steel Arch Ribs */}
                {[90, 160, 230, 300, 370, 440, 510, 580, 640].map((x, idx) => (
                  <path 
                    key={idx} 
                    d={`M ${x} 110 L ${x} 45 Q ${x - 5} 35 ${x} 30`} 
                    stroke="#475569" 
                    strokeWidth="2.5" 
                    strokeDasharray="4 2" 
                    fill="none" 
                  />
                ))}

                {/* Overhead Ventilation Duct */}
                <rect x="50" y="32" width="600" height="10" rx="3" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1" />
                <text x="350" y="40" fill="#bae6fd" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  FORCED VENTILATION DUCT ({tunnel.airflowVelocity ?? 1.8} m/s {tunnel.airflowDirection ?? 'INBYE'}) ➔ ➔ ➔
                </text>

                {/* Rail Track Bed */}
                <line x1="50" y1="106" x2="650" y2="106" stroke="#64748b" strokeWidth="3" />
                {[70, 120, 170, 220, 270, 320, 370, 420, 470, 520, 570, 620].map((rx, idx) => (
                  <rect key={idx} x={rx} y="104" width="10" height="4" fill="#94a3b8" />
                ))}

                {/* Workers in the tunnel cross-section */}
                {tunnelWorkers.map((w, idx) => {
                  const wx = 140 + idx * 160;
                  const isWarn = w.status === 'WARNING' || w.status === 'CRITICAL' || w.movement === 'POSSIBLE_FALL';
                  return (
                    <g key={w.id} transform={`translate(${wx}, 76)`} className="cursor-pointer" onClick={() => onSelectWorker(w)}>
                      <circle cx="10" cy="8" r="7" fill={isWarn ? '#ef4444' : '#eab308'} />
                      <rect x="5" y="15" width="10" height="14" rx="2" fill={isWarn ? '#dc2626' : '#0284c7'} />
                      <text x="10" y="38" fill={isWarn ? '#f87171' : '#bae6fd'} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {w.id} {isWarn ? '⚠' : ''}
                      </text>
                    </g>
                  );
                })}

                {/* Rescue Rover if in zone */}
                {tunnel.hasRover && (
                  <g transform="translate(540, 78)">
                    <rect x="0" y="10" width="36" height="16" rx="4" fill="#00f0ff" fillOpacity="0.3" stroke="#00f0ff" strokeWidth="1.5" />
                    <circle cx="8" cy="26" r="4" fill="#00f0ff" />
                    <circle cx="28" cy="26" r="4" fill="#00f0ff" />
                    <text x="18" y="4" fill="#00f0ff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ROVER-01</text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Section 4: WORKER ROSTER & WARNING HIGHLIGHTING (USER PRIMARY REQUIREMENT) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold font-mono text-white tracking-wide">
                  PERSONNEL OPERATING IN THIS TUNNEL
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
                  {tunnelWorkers.length} {tunnelWorkers.length === 1 ? 'Miner' : 'Miners'} Active
                </span>
              </div>

              {warningWorkers.length > 0 ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/80 border border-red-500/80 text-red-300 text-xs font-bold animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>{warningWorkers.length} {warningWorkers.length === 1 ? 'Worker' : 'Workers'} in Warning / Danger Status</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All Assigned Personnel Nominal</span>
                </div>
              )}
            </div>

            {/* List of Workers in this Tunnel */}
            {tunnelWorkers.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>No personnel currently detected inside this sector.</p>
                <p className="text-[11px] text-slate-500 mt-1">Personnel positioning verified via underground UWB/BLE anchors.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 1. HIGHLIGHTED WARNING WORKERS FIRST */}
                {warningWorkers.map(worker => {
                  const isFall = worker.movement === 'POSSIBLE_FALL';
                  const isHighHR = worker.vitals && worker.vitals.heartRate > 90;
                  const isGasDanger = worker.environmentalExposure.methane > 1.0;

                  return (
                    <div
                      key={worker.id}
                      className="p-4 rounded-xl border-2 border-red-500 bg-red-950/35 shadow-[0_0_22px_rgba(239,68,68,0.45)] space-y-3 transition-all relative overflow-hidden"
                    >
                      {/* Warning Glow Corner Tag */}
                      <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white font-bold text-[10px] rounded-bl-lg uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>ACTION REQUIRED • {worker.status}</span>
                      </div>

                      {/* Header info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-28">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center font-bold text-red-200 text-sm">
                            {worker.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white font-mono">{worker.name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/50 font-bold">
                                {worker.role}
                              </span>
                            </div>
                            <div className="text-xs text-red-300 font-mono mt-0.5 flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-red-400" />
                              <span>{worker.location}</span>
                              <span>•</span>
                              <span>Last Beacon: {worker.lastUpdate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Highlighted Warning Summary Box */}
                      <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/60 text-xs font-mono text-red-200 space-y-1">
                        <div className="font-bold text-red-100 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span>SPECIFIC WARNING REASONS DETECTED:</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-red-200 space-y-0.5 pl-1">
                          {isFall && (
                            <li className="font-bold text-white">⚠ Worker Posture Alert: IMMOBILITY / POSSIBLE FALL</li>
                          )}
                          {isHighHR && (
                            <li>Elevated Heart Rate: <strong className="text-white">{worker.vitals?.heartRate} BPM</strong> (Tachycardia / Physical Stress)</li>
                          )}
                          {isGasDanger && (
                            <li>Dangerous Ambient Methane: <strong className="text-white">{worker.environmentalExposure.methane}% CH₄</strong> (Statutory Limit: 1.0%)</li>
                          )}
                          <li>Movement Index: <strong className="text-white">{worker.movement.replace('_', ' ')}</strong> ({worker.movementConfidence}% Confidence)</li>
                        </ul>
                      </div>

                      {/* Vitals Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-black/50 border border-red-500/40">
                          <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                          <span className="text-sm font-bold text-red-300 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                            {worker.vitals?.heartRate ?? 94} BPM
                          </span>
                        </div>

                        <div className="p-2 rounded bg-black/50 border border-red-500/40">
                          <span className="text-[10px] text-slate-400 block">Blood SpO₂</span>
                          <span className="text-sm font-bold text-white flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            {worker.vitals?.spO2 ?? 95}%
                          </span>
                        </div>

                        <div className="p-2 rounded bg-black/50 border border-red-500/40">
                          <span className="text-[10px] text-slate-400 block">Body Temp</span>
                          <span className="text-sm font-bold text-white flex items-center gap-1">
                            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                            {worker.vitals?.bodyTemperature ?? 37.2}°C
                          </span>
                        </div>

                        <div className="p-2 rounded bg-black/50 border border-red-500/40">
                          <span className="text-[10px] text-slate-400 block">Motion</span>
                          <span className="text-xs font-bold text-amber-300 truncate block mt-0.5">
                            {worker.movement.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-black/50 border border-red-500/40">
                          <span className="text-[10px] text-slate-400 block">Helmet Battery</span>
                          <span className="text-sm font-bold text-white flex items-center gap-1">
                            <Battery className="w-3.5 h-3.5 text-emerald-400" />
                            {worker.battery}%
                          </span>
                        </div>
                      </div>

                      {/* Interactive Actions for Warning Worker */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-500/40">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handlePingHelmet(worker.id)}
                            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                              hapticPingedId === worker.id
                                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                                : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{hapticPingedId === worker.id ? '✓ HAPTIC ALARM DISPATCHED!' : 'Ping Helmet Siren'}</span>
                          </button>

                          <button
                            onClick={() => onDispatchRover(tunnel.id)}
                            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Dispatch Rover-01</span>
                          </button>
                        </div>

                        <button
                          onClick={() => onSelectWorker(worker)}
                          className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5"
                        >
                          <span>Full Vitals Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 2. NOMINAL / SAFE WORKERS */}
                {safeWorkers.map(worker => (
                  <div
                    key={worker.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs">
                        {worker.id}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{worker.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {worker.role}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>NORMAL</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                          <span>Heart Rate: <strong className="text-white">{worker.vitals?.heartRate ?? 76} BPM</strong></span>
                          <span>•</span>
                          <span>SpO₂: <strong className="text-emerald-400">{worker.vitals?.spO2 ?? 98}%</strong></span>
                          <span>•</span>
                          <span>Movement: <strong className="text-cyan-300">{worker.movement.replace('_', ' ')}</strong></span>
                          <span>•</span>
                          <span>Helmet: {worker.battery}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePingHelmet(worker.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                        title="Ping Wearable"
                      >
                        Ping
                      </button>
                      <button
                        onClick={() => onSelectWorker(worker)}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1"
                      >
                        <span>View Vitals</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0d1422] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Telemetry Link: <strong className="text-white">Active Subsurface Wi-Fi Mesh</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => onDispatchRover(tunnel.id)}
              className="px-4 py-2 rounded-lg bg-mine-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-slate-950" />
              <span>Dispatch Rover to Sector</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
