import React, { useState } from 'react';
import { 
  Map, 
  Compass, 
  Navigation, 
  Radio, 
  Users, 
  Flame, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Crosshair, 
  Layers, 
  Maximize2,
  CheckCircle2,
  Info,
  ExternalLink,
  Sparkles,
  Heart,
  Activity,
  Zap,
  Volume2
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { TunnelNode, Worker } from '../../types';
import { TunnelDetailModal } from './TunnelDetailModal';
import { WorkerProfileModal } from '../workers/WorkerProfileModal';
import { LiveMapComponent } from './LiveMapComponent';
import { SubterraneanDriftTopology } from './SubterraneanDriftTopology';

export const MineMapDashboard: React.FC = () => {
  const { 
    tunnels, 
    rover, 
    workers, 
    selectedTunnel, 
    setSelectedTunnel, 
    emergencySimulated,
    setActiveTab,
    sendRoverCommand,
    deviceLocation
  } = useMine();

  const [mapViewMode, setMapViewMode] = useState<'live-gps' | 'schematic'>('schematic');
  const [destination, setDestination] = useState<string>('T-B');
  const [showAirflow, setShowAirflow] = useState<boolean>(true);
  const [showSensorNodes, setShowSensorNodes] = useState<boolean>(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedModalWorker, setSelectedModalWorker] = useState<Worker | null>(null);

  // Active tunnel inspector target (default to selectedTunnel or Tunnel B)
  const currentInspector = selectedTunnel || tunnels.find(t => t.id === 'T-B') || tunnels[0];

  // Workers inside the active inspector tunnel
  const inspectorWorkers = workers.filter(
    w => w.zoneId === currentInspector.id || currentInspector.workersPresent.includes(w.id)
  );
  const warningInspectorWorkers = inspectorWorkers.filter(
    w => w.status === 'CRITICAL' || 
         w.status === 'WARNING' || 
         w.movement === 'POSSIBLE_FALL' || 
         w.movement === 'LOW_MOVEMENT' || 
         (w.vitals && w.vitals.heartRate > 90) || 
         w.environmentalExposure.methane > 1.0
  );
  const safeInspectorWorkers = inspectorWorkers.filter(
    w => !warningInspectorWorkers.some(warnW => warnW.id === w.id)
  );

  // Route evaluation
  const targetTunnel = tunnels.find(t => t.id === destination);
  const isTargetBlocked = targetTunnel?.blocked || targetTunnel?.status === 'CRITICAL';

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mine-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-mine-cyan" />
            <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
              UNDERGROUND MINE SCHEMATIC & TUNNEL MAP
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-mine-cyan">
              HORIZON #4 SECTOR ADIT
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Engineering subterranean schematic, live atmospheric hazard zones, rover position & route navigation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <button
            onClick={() => setShowAirflow(!showAirflow)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              showAirflow
                ? 'bg-cyan-500/20 text-mine-cyan border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Airflow Vectors
          </button>
          <button
            onClick={() => setShowSensorNodes(!showSensorNodes)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              showSensorNodes
                ? 'bg-cyan-500/20 text-mine-cyan border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Sensor Nodes
          </button>
        </div>
      </div>

      {/* Interactive Tunnel Drifts & Sectors Selector */}
      <div className="rounded-xl bg-mine-card border border-mine-border p-3.5 space-y-2 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              TUNNEL DRIFTS & SECTORS (CLICK TO SELECT & VIEW COMPLETE TUNNEL)
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            Click any drift card below to inspect blueprint, live gases & assigned workers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
          {tunnels.map((t) => {
            const isSelected = currentInspector.id === t.id;
            const tWorkers = workers.filter(w => w.zoneId === t.id || t.workersPresent.includes(w.id));
            const hasWarningWorker = tWorkers.some(
              w => w.status === 'WARNING' || w.status === 'CRITICAL' || w.movement === 'POSSIBLE_FALL' || (w.vitals && w.vitals.heartRate > 90)
            );
            const isCritical = t.status === 'CRITICAL' || t.blocked;
            const isWarning = t.status === 'WARNING' || hasWarningWorker;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTunnel(t)}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 group relative ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                    : isCritical
                    ? 'bg-red-950/30 border-red-500/50 hover:border-red-400'
                    : isWarning
                    ? 'bg-amber-950/25 border-amber-500/40 hover:border-amber-400'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono font-bold text-xs text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                    <span>{t.id}</span>
                    {t.hasRover && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-normal">ROVER</span>
                    )}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    isCritical
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isCritical ? 'HAZARD' : isWarning ? 'WARN' : 'SAFE'}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-300 truncate font-medium">
                  {t.name.split(' (')[0]}
                </div>

                <div className="flex items-center justify-between gap-1 mt-2 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span>{tWorkers.length} {tWorkers.length === 1 ? 'Miner' : 'Miners'}</span>
                  </span>
                  {hasWarningWorker && (
                    <span className="text-red-400 font-bold animate-pulse flex items-center gap-0.5">
                      <span>⚠ Warning</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTunnel(t);
                    setIsDetailModalOpen(true);
                  }}
                  className={`w-full mt-2 py-1 px-1.5 rounded font-bold text-[10px] font-mono flex items-center justify-center gap-1 transition-colors shadow ${
                    isSelected
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>View Complete Tunnel</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* View Mode Switcher Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-mine-cyan" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-white uppercase tracking-wider">
                {mapViewMode === 'schematic' ? 'SUBTERRANEAN DRIFT TOPOLOGY (LEVEL -180M)' : 'LIVE SURFACE GPS & ESP32-CAM TRACKING'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                mapViewMode === 'schematic'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {mapViewMode === 'schematic' ? 'ENGINEERING SCHEMATIC' : 'GPS REAL-TIME'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              {mapViewMode === 'schematic' 
                ? 'Underground drift network, ventilation airflow, rescue rover, and hazard zones' 
                : 'Real-time geographic tracking for ESP32-CAM and surface autonomous rovers'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-[#070d1a] p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setMapViewMode('schematic')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
              mapViewMode === 'schematic'
                ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subterranean Schematic</span>
          </button>
          <button
            type="button"
            onClick={() => setMapViewMode('live-gps')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
              mapViewMode === 'live-gps'
                ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Live GPS Map</span>
          </button>
        </div>
      </div>

      {/* Dynamic Map Mode View */}
      {mapViewMode === 'schematic' ? (
        <SubterraneanDriftTopology 
          onSelectWorker={(w) => setSelectedModalWorker(w)}
          onSelectTunnel={(t) => setSelectedTunnel(t)}
        />
      ) : (
        /* View Mode 2: Live GPS Surface Map with Route Navigator (8 cols + 4 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Vector Tunnel Map (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl bg-mine-card border border-mine-border p-4 shadow-xl relative overflow-hidden">
            {/* Map Canvas Header with View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-mine-cyan" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  LIVE ESP32-CAM / ROVER SURFACE GPS MAP
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-bold bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                  REAL-TIME TRACKING
                </span>
              </div>

              {/* View Mode Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setMapViewMode('schematic')}
                  className="px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors text-slate-400 hover:text-white"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Subterranean Schematic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('live-gps')}
                  className="px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors bg-cyan-500/20 text-mine-cyan border border-cyan-500/40 font-bold"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Live GPS Map</span>
                </button>
              </div>
            </div>

            {/* View 1: Modern Interactive Leaflet Live GPS Map */}
            {true ? (
              <LiveMapComponent 
                deviceLabel="ESP32-CAM / ROVER #01"
                initialZoom={16}
                className="h-[520px]"
              />
            ) : (
              /* View 2: Subterranean Engineering Schematic */
              <div className="relative w-full aspect-[16/10] bg-[#070b12] rounded-lg border border-slate-800 overflow-hidden bg-tech-grid flex items-center justify-center select-none">
              <svg viewBox="0 0 920 560" className="w-full h-full">
                <defs>
                  {/* Glowing filters */}
                  <filter id="hazardGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="roverGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* 1. TUNNEL CONNECTIONS (TRACKS & CORRIDORS) */}
                {/* Main Adit Path: ENT-00 -> MAIN-01 -> J-01 */}
                <path d="M 120 280 L 260 280 L 420 280" stroke="#334155" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M 120 280 L 260 280 L 420 280" stroke="#00f0ff" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />

                {/* Tunnel A Path: J-01 -> T-A -> ST-04 */}
                <path d="M 420 280 L 580 140 L 800 140" stroke="#334155" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M 420 280 L 580 140 L 800 140" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />

                {/* Tunnel B Path: J-01 -> T-B -> J-02 (HAZARDOUS IF EMERGENCY) */}
                <path 
                  d="M 420 280 L 620 280 L 790 280" 
                  stroke={emergencySimulated ? '#ef4444' : '#f59e0b'} 
                  strokeWidth="18" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  fill="none" 
                  opacity={emergencySimulated ? '0.85' : '0.4'}
                  filter={emergencySimulated ? 'url(#hazardGlow)' : undefined}
                />
                <path d="M 420 280 L 620 280 L 790 280" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.7" />

                {/* Tunnel C Path: J-01 -> T-C -> REFUGE-01 */}
                <path d="M 420 280 L 560 440 L 750 440" stroke="#334155" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M 420 280 L 560 440 L 750 440" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" fill="none" opacity="0.6" />

                {/* Substation Loop Path: J-02 -> REFUGE-01 */}
                <path d="M 790 280 L 750 440" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" fill="none" />

                {/* 2. AIRFLOW VECTOR ARROWS */}
                {showAirflow && (
                  <g opacity="0.75">
                    {/* Inbye airflow entrance */}
                    <text x="175" y="272" fill="#38bdf8" fontSize="12" fontFamily="monospace">➔ ➔</text>
                    <text x="325" y="272" fill="#38bdf8" fontSize="12" fontFamily="monospace">➔ ➔</text>
                    {/* Tunnel A airflow */}
                    <text x="490" y="200" fill="#38bdf8" fontSize="11" transform="rotate(-40 490 200)" fontFamily="monospace">➔ ➔</text>
                    <text x="680" y="132" fill="#38bdf8" fontSize="11" fontFamily="monospace">➔ ➔</text>
                    {/* Tunnel B return airflow */}
                    <text x="500" y="292" fill="#f87171" fontSize="12" fontFamily="monospace">➔ ➔</text>
                    {/* Tunnel C airflow */}
                    <text x="475" y="375" fill="#38bdf8" fontSize="11" transform="rotate(40 475 375)" fontFamily="monospace">➔ ➔</text>
                  </g>
                )}

                {/* 3. TUNNEL SECTORS / NODES */}
                {tunnels.map((node) => {
                  const isSelected = currentInspector.id === node.id;
                  const isCritical = node.status === 'CRITICAL';
                  const isWarning = node.status === 'WARNING';
                  const nodeFill = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedTunnel(node)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      {/* Selection ring */}
                      {isSelected && (
                        <circle
                          cx={node.coords.x}
                          cy={node.coords.y}
                          r={28}
                          fill="none"
                          stroke="#00f0ff"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          className="animate-spin"
                          style={{ transformOrigin: `${node.coords.x}px ${node.coords.y}px` }}
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={node.coords.x}
                        cy={node.coords.y}
                        r={18}
                        fill="#0d1422"
                        stroke={nodeFill}
                        strokeWidth={3}
                        filter={isCritical ? 'url(#hazardGlow)' : undefined}
                      />

                      {/* Node Inner Label / Icon */}
                      <text
                        x={node.coords.x}
                        y={node.coords.y + 4}
                        fill="#f8fafc"
                        fontSize={9}
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {node.id}
                      </text>

                      {/* Node Title Text Below */}
                      <text
                        x={node.coords.x}
                        y={node.coords.y + 30}
                        fill={isSelected ? '#00f0ff' : '#94a3b8'}
                        fontSize={10}
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {node.name.split(' (')[0]}
                      </text>

                      {/* Hazard indicator flag */}
                      {isCritical && (
                        <g transform={`translate(${node.coords.x - 7}, ${node.coords.y - 36})`}>
                          <rect width="14" height="14" rx="3" fill="#ef4444" />
                          <text x="7" y="11" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">⚠</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 4. WORKER POSITION MARKERS ON MAP */}
                <g>
                  {/* Workers in Tunnel A */}
                  <g transform="translate(630, 125)" className="cursor-pointer">
                    <rect width="46" height="18" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                    <text x="23" y="12" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      👥 W-01,03
                    </text>
                  </g>

                  {/* Workers in Tunnel B (Amit Singh - Possible Fall if Emergency) */}
                  <g transform="translate(670, 265)" className="cursor-pointer">
                    <rect 
                      width="46" 
                      height="18" 
                      rx="4" 
                      fill={emergencySimulated ? '#b91c1c' : '#b45309'} 
                      stroke={emergencySimulated ? '#f87171' : '#fde047'} 
                      strokeWidth="1" 
                    />
                    <text x="23" y="12" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {emergencySimulated ? '⚠ W-02' : '👥 W-02,05'}
                    </text>
                  </g>

                  {/* Worker in Junction 01 */}
                  <g transform="translate(395, 248)" className="cursor-pointer">
                    <rect width="36" height="16" rx="3" fill="#059669" stroke="#34d399" strokeWidth="1" />
                    <text x="18" y="11" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      👤 W-04
                    </text>
                  </g>
                </g>

                {/* 5. ROVER LIVE POSITION MARKER */}
                <g transform="translate(540, 160)" filter="url(#roverGlow)">
                  <circle cx="16" cy="16" r="14" fill="#00f0ff" fillOpacity="0.2" stroke="#00f0ff" strokeWidth="2" />
                  <circle cx="16" cy="16" r="6" fill="#00f0ff" />
                  {/* Radar ping */}
                  <circle cx="16" cy="16" r="22" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
                  <rect x="0" y="34" width="70" height="16" rx="3" fill="#0d1422" stroke="#00f0ff" strokeWidth="1" />
                  <text x="35" y="45" fill="#00f0ff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    ROVER-01 (LIVE)
                  </text>
                </g>
              </svg>
            </div>
            )}

            {/* Bottom Map Controls Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>GPS Telemetry Fix: <strong className="text-cyan-300 font-bold">LOCKED ({deviceLocation.accuracyMeters?.toFixed(1) ?? '2.5'}m Acc)</strong></span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span>Lat: {deviceLocation.latitude.toFixed(6)}°</span>
                <span>Lng: {deviceLocation.longitude.toFixed(6)}°</span>
                <span>Alt: {deviceLocation.altitude?.toFixed(1) ?? '180.0'}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tunnel Node Inspector & Route Pathfinder (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Node Telemetry Inspector */}
          <div className="rounded-xl bg-mine-card border border-mine-border p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-mine-cyan" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  SECTOR TELEMETRY INSPECTOR
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                currentInspector.status === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : currentInspector.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                {currentInspector.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-bold font-mono text-white">
                {currentInspector.name}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Zone: <span className="text-white">{currentInspector.zone}</span> • Sector ID: <code className="text-cyan-400">{currentInspector.id}</code>
              </div>

              {/* View Complete Tunnel Trigger Button */}
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all"
              >
                <Layers className="w-4 h-4 text-slate-950" />
                <span>View Complete Tunnel & Workers</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-950" />
              </button>
            </div>

            {/* Gas readings inside sector */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CH₄ (Methane)</span>
                <span className={`text-base font-bold ${currentInspector.methane > 1.25 ? 'text-red-400' : 'text-white'}`}>
                  {currentInspector.methane}%
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CO (Carbon Monoxide)</span>
                <span className={`text-base font-bold ${currentInspector.co > 25 ? 'text-amber-400' : 'text-white'}`}>
                  {currentInspector.co} ppm
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">O₂ (Oxygen)</span>
                <span className={`text-base font-bold ${currentInspector.o2 < 19.5 ? 'text-red-400' : 'text-white'}`}>
                  {currentInspector.o2}%
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Dry Temp</span>
                <span className="text-base font-bold text-white">
                  {currentInspector.temp}°C
                </span>
              </div>
            </div>

            {/* Sector Physical Specs & Rover Status */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Workers Tracked:</span>
                <strong className="text-white font-bold">{inspectorWorkers.length} Miners Active</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Rescue Rover:</span>
                <span className={currentInspector.hasRover ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                  {currentInspector.hasRover ? 'LOCATED IN ZONE' : 'Out of Zone'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Airflow Velocity:</span>
                <span className="text-white">{currentInspector.airflowVelocity} m/s ({currentInspector.airflowDirection})</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Drift Profile:</span>
                <span className="text-cyan-300 truncate">{currentInspector.crossSection || '4.5m × 3.8m Arch'}</span>
              </div>

              {currentInspector.blocked && (
                <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-[10px] text-red-300 font-mono mt-2">
                  <strong>HAZARD BLOCKAGE:</strong> {currentInspector.blockReason || 'Hazardous atmospheric condition.'}
                </div>
              )}
            </div>

            {/* Sector Workers Roster with Warning Highlighting */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  SECTOR PERSONNEL ({inspectorWorkers.length})
                </span>
                {warningInspectorWorkers.length > 0 && (
                  <span className="text-[10px] text-red-400 font-bold animate-pulse">
                    ⚠ {warningInspectorWorkers.length} In Warning
                  </span>
                )}
              </div>

              {inspectorWorkers.length === 0 ? (
                <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-center text-[11px] text-slate-500 font-mono">
                  No active personnel registered in this sector.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {/* Warning workers highlighted first */}
                  {warningInspectorWorkers.map(w => (
                    <div
                      key={w.id}
                      className="p-2.5 rounded-lg border-2 border-red-500 bg-red-950/40 text-xs font-mono space-y-1.5 shadow-[0_0_15px_rgba(239,68,68,0.35)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <strong className="text-white">{w.name}</strong>
                          <span className="text-[10px] text-red-300 font-bold">({w.id})</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold uppercase">
                          {w.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-red-300 font-mono">
                        ⚠ {w.movement === 'POSSIBLE_FALL' ? 'IMMOBILITY / FALL DETECTED' : 'Elevated Hazard / Stress'} • HR: {w.vitals?.heartRate ?? 94} BPM • CH₄: {w.environmentalExposure.methane}%
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-red-500/30 text-[10px]">
                        <span className="text-slate-400 truncate">{w.role}</span>
                        <button
                          onClick={() => setSelectedModalWorker(w)}
                          className="text-cyan-300 hover:text-white font-bold underline shrink-0"
                        >
                          View Vitals ➔
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Safe workers */}
                  {safeInspectorWorkers.map(w => (
                    <div
                      key={w.id}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-mono flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-white font-medium">{w.name}</span>
                          <span className="text-slate-400 text-[10px]">({w.id})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          HR: {w.vitals?.heartRate ?? 76} BPM • SpO₂: {w.vitals?.spO2 ?? 98}% • {w.role}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedModalWorker(w)}
                        className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold"
                      >
                        Vitals
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 17. Tunnel Routes & Navigation Panel */}
          <div className="rounded-xl bg-mine-card border border-mine-border p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-mine-cyan" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  TUNNEL ROUTE PATHFINDER
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                A* SAFETY MESH
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Current Rover Origin</span>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-white font-bold flex items-center justify-between">
                  <span>{rover.location}</span>
                  <span className="text-[10px] text-emerald-400 font-normal">● Online</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Target Sector Destination</span>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-mine-cyan"
                >
                  <option value="T-B">Tunnel B (East Development)</option>
                  <option value="ST-04">Stope 04 (Drilling Face)</option>
                  <option value="REFUGE-01">Refuge Chamber (South)</option>
                  <option value="ENT-00">Portal Surface Adit</option>
                </select>
              </div>

              {/* Path calculation status */}
              <div className={`p-3 rounded-lg border space-y-2 ${
                isTargetBlocked
                  ? 'bg-red-950/30 border-red-500/50 text-red-200'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Navigation Route:</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    isTargetBlocked
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {isTargetBlocked ? 'ROUTE BLOCKED' : 'ROUTE CLEAR'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300">
                  {destination === 'T-B' ? (
                    isTargetBlocked ? (
                      <>
                        <div className="text-red-400 font-bold mb-1">Reason: High Methane Spike & Low O₂</div>
                        <div className="text-slate-400">Path A → J-01 → Tunnel B is restricted by statutory safety interlock. Autonomous sweep required.</div>
                      </>
                    ) : (
                      <div>Path: Tunnel A → Junction 01 → Tunnel B (Clear • 140m)</div>
                    )
                  ) : destination === 'REFUGE-01' ? (
                    <div>Safe Path: Tunnel A → Junction 01 → Tunnel C → Refuge (Clear • 210m)</div>
                  ) : (
                    <div>Alternative evacuation paths verified.</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('rover-live')}
                className="w-full py-2.5 rounded-lg bg-mine-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-colors flex items-center justify-center gap-2"
              >
                <Radio className="w-3.5 h-3.5 text-slate-950" />
                <span>Execute Remote Inspection Drive</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Complete Tunnel Inspection Modal */}
      <TunnelDetailModal
        tunnel={currentInspector}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        workers={workers}
        onSelectWorker={(w) => setSelectedModalWorker(w)}
        onDispatchRover={(tunnelId) => {
          setIsDetailModalOpen(false);
          setActiveTab('rover-live');
        }}
        onSoundAlarm={() => {
          sendRoverCommand('BUZZER_ON');
          setTimeout(() => sendRoverCommand('BUZZER_OFF'), 800);
        }}
      />

      {/* Individual Worker Profile Modal */}
      {selectedModalWorker && (
        <WorkerProfileModal
          worker={selectedModalWorker}
          onClose={() => setSelectedModalWorker(null)}
          onLocateOnMap={(zoneId) => {
            const t = tunnels.find(tun => tun.id === zoneId);
            if (t) setSelectedTunnel(t);
            setSelectedModalWorker(null);
          }}
        />
      )}
    </div>
  );
};
