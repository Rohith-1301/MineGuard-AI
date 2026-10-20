import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Users, 
  Radio, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Wind, 
  Thermometer, 
  Activity, 
  Heart, 
  Crosshair, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Navigation, 
  Zap,
  Shield,
  LifeBuoy
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { Worker, TunnelNode } from '../../types';

export interface TopologySensor {
  id: string;
  name: string;
  tunnel: string;
  type: 'gas' | 'temperature' | 'airflow' | 'structural';
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  x: number;
  y: number;
}

export interface TopologyRover {
  id: string;
  label: string;
  tunnel: string;
  status: 'rescue' | 'active' | 'standby';
  x: number;
  y: number;
  battery: number;
  speed: string;
}

interface SubterraneanDriftTopologyProps {
  onSelectWorker?: (worker: Worker) => void;
  onSelectTunnel?: (tunnel: TunnelNode) => void;
}

/**
 * Pre-defined coordinate mapping for the 12 active workers to place them
 * accurately along their assigned canonical tunnel drift paths.
 */
const WORKER_COORDINATES: Record<string, { x: number; y: number }> = {
  'W-009': { x: 260, y: 160 }, // ENT-00 (Surface Adit)
  'W-010': { x: 500, y: 100 }, // MAIN-01 (Main Decline Shaft)
  'W-004': { x: 470, y: 195 }, // J-01 (Central Hub)
  'W-001': { x: 620, y: 160 }, // T-A (North Extraction)
  'W-003': { x: 720, y: 160 }, // T-A (North Extraction)
  'W-008': { x: 840, y: 160 }, // ST-04 (Drill & Blast Face)
  'W-011': { x: 890, y: 160 }, // ST-04 (Drill & Blast Face)
  'W-002': { x: 580, y: 250 }, // T-B (East Development Inbye)
  'W-005': { x: 740, y: 340 }, // T-B (East Development Hazard)
  'W-006': { x: 690, y: 375 }, // J-02 (Substation Vault)
  'W-012': { x: 630, y: 375 }, // J-02 (Substation Vault)
  'W-007': { x: 380, y: 445 }, // T-C (South Ventilation Drift)
};

/**
 * ============================================================================
 * SUBTERRANEAN DRIFT TOPOLOGY COMPONENT
 * ============================================================================
 * High-fidelity interactive subterranean mine schematic visualization.
 * Fully synchronized with canonical tunnel IDs:
 * ENT-00, MAIN-01, J-01, T-A, T-B, T-C, ST-04, J-02, REFUGE-01
 */
export const SubterraneanDriftTopology: React.FC<SubterraneanDriftTopologyProps> = ({
  onSelectWorker,
  onSelectTunnel
}) => {
  const { 
    workers, 
    tunnels, 
    rover, 
    sensors, 
    selectedTunnel, 
    setSelectedTunnel, 
    setSelectedWorker 
  } = useMine();

  // Active tunnel inspector target (bidirectionally synchronized with cards & context)
  const activeTunnel: TunnelNode = selectedTunnel || tunnels.find(t => t.id === 'T-B') || tunnels[0];

  // Pan and Zoom Transformation State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selected Interactive Entity Modal/Popover State
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'worker' | 'sensor' | 'rover' | 'junction' | 'tunnel' | 'refuge';
    data: any;
  } | null>(null);

  // Dynamic sensors state
  const topologySensors: TopologySensor[] = [
    { 
      id: 'S-001', 
      name: 'Optical Methane CH₄', 
      tunnel: 'ENT-00 (Portal Adit)', 
      type: 'gas', 
      value: '0.05%', 
      unit: 'CH₄', 
      status: 'normal', 
      x: 370, 
      y: 160 
    },
    { 
      id: 'S-002', 
      name: 'Barometric / Temp', 
      tunnel: 'MAIN-01 (Decline Shaft)', 
      type: 'temperature', 
      value: `${tunnels.find(t => t.id === 'MAIN-01')?.temp ?? 27.8}°C`, 
      unit: '°C', 
      status: 'normal', 
      x: 500, 
      y: 130 
    },
    { 
      id: 'S-003', 
      name: 'Intake Anemometer', 
      tunnel: 'T-A (North Extraction)', 
      type: 'airflow', 
      value: '2.8 m/s', 
      unit: 'm/s', 
      status: 'normal', 
      x: 660, 
      y: 160 
    },
    { 
      id: 'S-004', 
      name: 'Toxic CO Sentinel', 
      tunnel: 'T-B (East Development)', 
      type: 'gas', 
      value: `${sensors.carbonMonoxide.value} ppm`, 
      unit: 'CO', 
      status: sensors.carbonMonoxide.status === 'WARNING' || sensors.carbonMonoxide.status === 'CRITICAL' ? 'warning' : 'normal', 
      x: 580, 
      y: 285 
    },
    { 
      id: 'S-005', 
      name: 'Hazard Gas Sniffer', 
      tunnel: 'T-B (Hazard Section)', 
      type: 'gas', 
      value: `${sensors.methane.value}%`, 
      unit: 'CH₄', 
      status: sensors.methane.status === 'CRITICAL' ? 'critical' : sensors.methane.status === 'WARNING' ? 'warning' : 'normal', 
      x: 800, 
      y: 340 
    },
    { 
      id: 'S-006', 
      name: 'Exhaust Anemometer', 
      tunnel: 'T-C (South Vent Drift)', 
      type: 'airflow', 
      value: '2.1 m/s', 
      unit: 'm/s', 
      status: 'normal', 
      x: 470, 
      y: 415 
    },
  ];

  // Handler for clicking any tunnel or junction on the SVG map
  const handleSelectTunnelNode = useCallback((tunnelId: string) => {
    const node = tunnels.find(t => t.id === tunnelId);
    if (node) {
      setSelectedTunnel(node);
      if (onSelectTunnel) onSelectTunnel(node);
      
      const assignedWorkers = workers.filter(
        w => w.zoneId === node.id || node.workersPresent?.includes(w.id)
      );

      setSelectedEntity({
        type: node.type === 'refuge' ? 'refuge' : node.type === 'junction' ? 'junction' : 'tunnel',
        data: {
          id: node.id,
          name: node.name,
          code: node.id,
          depth: `${node.depthLevel ?? -180}m`,
          status: node.status,
          length: `${node.lengthMeters}m`,
          airflow: `${node.airflowVelocity} m/s ${node.airflowDirection}`,
          methane: `${node.methane}%`,
          co: `${node.co} ppm`,
          temp: `${node.temp}°C`,
          workersCount: assignedWorkers.length,
          connections: node.connections,
          capacity: node.type === 'refuge' ? '16 Personnel' : undefined,
          airSupply: node.type === 'refuge' ? '96 Hours O₂ Tank Reserve' : undefined,
          alert: node.status === 'CRITICAL' ? 'CRITICAL ATMOSPHERIC HAZARD' : node.status === 'WARNING' ? 'ELEVATED GAS WARNING' : undefined
        }
      });
    }
  }, [tunnels, workers, setSelectedTunnel, onSelectTunnel]);

  // Pan & Zoom Event Handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const isMouseDownRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | SVGElement;
    const isBackground = target.id === 'map-background-rect' || 
                         target.tagName.toLowerCase() === 'svg';

    if (isBackground) {
      isMouseDownRef.current = true;
      isDraggingRef.current = false;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDownRef.current) {
      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      if (!isDraggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
      if (isDraggingRef.current) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Derive workers inside the active selected sector
  const activeSectorWorkers = workers.filter(
    w => w.zoneId === activeTunnel.id || activeTunnel.workersPresent?.includes(w.id)
  );

  return (
    <div className="flex flex-col w-full bg-[#1B201D] rounded-[6px] border border-[#303631] overflow-hidden shadow-md select-none font-sans">
      
      {/* ==================================================================== */}
      {/* 1. TOP MAP HEADER & LEGEND                                           */}
      {/* ==================================================================== */}
      <div className="bg-[#202522] border-b border-[#303631] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#F4F1EA]">
        {/* Left Title & Level */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base text-industrial-copper">▣</span>
            <span className="font-bold tracking-wider text-sm sm:text-base text-[#F4F1EA]">
              SUBTERRANEAN DRIFT TOPOLOGY
            </span>
          </div>
          <span className="text-[#68706A] font-light text-base">|</span>
          <span className="bg-[#303631] border border-[#404842] text-industrial-copper font-bold px-2 py-0.5 rounded-[3px] text-[11px] tracking-widest">
            LEVEL {activeTunnel.depthLevel ?? -180}M
          </span>
        </div>

        {/* Center / Right Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#D2CEC4]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#4F7A58]"></span>
            <span>Safe Drift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D99A35]"></span>
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#B8443D]"></span>
            <span>Hazard Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-blue-300 font-bold">👤</span>
            <span>Worker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-industrial-copper font-bold">🚙</span>
            <span>Rover</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">◎</span>
            <span>Sensor</span>
          </div>

          {/* Far Right: North / Compass & Zoom Controls */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#303631]">
            <div className="flex items-center gap-1 text-industrial-copper px-2 py-0.5 rounded-[3px] bg-[#303631] border border-[#404842] font-bold text-[11px]" title="Grid North Indicator">
              <Compass className="w-3.5 h-3.5 text-industrial-copper" />
              <span>▲ N</span>
            </div>
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#303631] border border-[#404842] rounded-[3px] p-0.5">
              <button 
                onClick={handleZoomIn} 
                className="p-1 hover:bg-[#404842] text-[#D2CEC4] hover:text-white rounded-[2px] transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] px-1 text-[#D2CEC4] font-bold min-w-[34px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={handleZoomOut} 
                className="p-1 hover:bg-[#404842] text-[#D2CEC4] hover:text-white rounded-[2px] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleResetZoom} 
                className="p-1 hover:bg-[#404842] text-[#D2CEC4] hover:text-white rounded-[2px] transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MAIN LAYOUT: LEFT SCHEMATIC (75-80%) + RIGHT SIDEBAR (20-25%)      */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-0 relative">
        
        {/* ================================================================== */}
        {/* LEFT / CENTER: LARGE UNDERGROUND MINE SCHEMATIC (9 Cols / ~75%)   */}
        {/* ================================================================== */}
        <div 
          className={`xl:col-span-9 relative bg-[#161B18] overflow-hidden min-h-[580px] h-[640px] flex items-center justify-center border-b xl:border-b-0 xl:border-r border-[#303631] ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* FLOATING MINE SECTOR CARD (Upper-Left Overlay, synchronized with activeTunnel) */}
          <div className="absolute top-4 left-4 z-20 bg-[#202522]/95 border border-[#404842] rounded-[4px] p-3 text-xs font-mono shadow-lg pointer-events-auto min-w-[220px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#303631] mb-2">
              <span className="text-[10px] uppercase font-bold text-industrial-copper tracking-wider flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  activeTunnel.status === 'CRITICAL' ? 'bg-[#B8443D] animate-ping' :
                  activeTunnel.status === 'WARNING' ? 'bg-[#D99A35] animate-ping' :
                  'bg-[#4F7A58] animate-ping'
                }`}></span>
                MINE SECTOR
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-[2px] font-bold border ${
                activeTunnel.status === 'CRITICAL' ? 'bg-[#B8443D]/20 text-[#B8443D] border-[#B8443D]/40' :
                activeTunnel.status === 'WARNING' ? 'bg-[#D99A35]/20 text-[#D99A35] border-[#D99A35]/40' :
                'bg-[#4F7A58]/20 text-[#4F7A58] border-[#4F7A58]/40'
              }`}>
                {activeTunnel.status}
              </span>
            </div>
            <div className="text-[#F4F1EA] font-bold text-sm mb-2 truncate">
              {activeTunnel.id}: {activeTunnel.name.split(' (')[0]}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#303631]">
              <div>
                <span className="text-[#68706A] text-[9px] block uppercase">DEPTH</span>
                <span className="text-[#F4F1EA] font-bold">{activeTunnel.depthLevel ?? -180} m</span>
              </div>
              <div>
                <span className="text-[#68706A] text-[9px] block uppercase">MINERS</span>
                <span className="text-industrial-copper font-bold">
                  {activeSectorWorkers.length} Active
                </span>
              </div>
            </div>
          </div>

          {/* SVG UNDERGROUND TOPOLOGY CANVAS */}
          <svg 
            viewBox="0 0 1000 640" 
            className="w-full h-full select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
          >
            <defs>
              {/* Technical Blueprint Grid Pattern */}
              <pattern id="topoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0b1b33" strokeWidth="0.8" opacity="0.45" />
                <circle cx="0" cy="0" r="1" fill="#00f0ff" opacity="0.3" />
              </pattern>

              {/* Glowing Shader Filters */}
              <filter id="safeCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="warningAmberGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="hazardRedGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="refugeGreenGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="selectionHalo" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* BACKGROUND RECTANGLE */}
            <rect id="map-background-rect" width="1000" height="640" fill="#040711" />
            <rect width="1000" height="640" fill="url(#topoGrid)" />

            {/* FAINT UNDERGROUND CONTOUR / TOPOGRAPHIC ELEVATION STRATA LINES */}
            <g opacity="0.12" fill="none" stroke="#00f0ff" strokeWidth="1">
              <path d="M -50 120 Q 200 40, 500 100 T 1050 80" strokeDasharray="3 3" />
              <path d="M -50 220 Q 250 180, 520 230 T 1050 190" strokeDasharray="4 2" />
              <path d="M -50 360 Q 320 280, 680 380 T 1050 320" strokeDasharray="3 3" />
              <path d="M -50 510 Q 280 430, 640 530 T 1050 490" strokeDasharray="4 2" />
              {/* Geological strata rings */}
              <ellipse cx="500" cy="320" rx="380" ry="240" stroke="#0284c7" strokeWidth="0.8" strokeDasharray="6 4" />
              <ellipse cx="680" cy="340" rx="220" ry="140" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5" />
            </g>

            {/* CORNER HUD RETICLES */}
            <g stroke="#00f0ff" strokeWidth="1.5" opacity="0.4" fill="none">
              <path d="M 20 40 L 20 20 L 40 20" />
              <path d="M 980 40 L 980 20 L 960 20" />
              <path d="M 20 600 L 20 620 L 40 620" />
              <path d="M 980 600 L 980 620 L 960 620" />
            </g>

            {/* ============================================================== */}
            {/* UNDERGROUND TUNNEL NETWORK PATHWAYS                            */}
            {/* ============================================================== */}

            {/* 1. MAIN DECLINE SHAFT (MAIN-01) (Vertical descending to Junction 01) */}
            <g 
              className="cursor-pointer group" 
              onClick={() => handleSelectTunnelNode('MAIN-01')}
            >
              {/* Active Selection Glow Ring */}
              {activeTunnel.id === 'MAIN-01' && (
                <line x1="500" y1="20" x2="500" y2="160" stroke="#00f0ff" strokeWidth="32" strokeLinecap="round" opacity="0.4" filter="url(#selectionHalo)" />
              )}
              <line x1="500" y1="20" x2="500" y2="160" stroke="#07192f" strokeWidth="22" strokeLinecap="round" />
              <line x1="500" y1="20" x2="500" y2="160" stroke="#00f0ff" strokeWidth="4" strokeLinecap="round" filter="url(#safeCyanGlow)" />
              <line x1="500" y1="20" x2="500" y2="160" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.8" />
              
              {/* Shaft Label & Directional Arrows */}
              <rect 
                x="410" 
                y="45" 
                width="180" 
                height="24" 
                rx="4" 
                fill={activeTunnel.id === 'MAIN-01' ? '#0d223f' : '#081426'} 
                stroke="#00f0ff" 
                strokeWidth={activeTunnel.id === 'MAIN-01' ? 2 : 1} 
              />
              <text x="500" y="61" fill="#00f0ff" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Main Decline (MAIN-01)
              </text>
              <text x="500" y="105" fill="#38bdf8" fontSize="13" fontFamily="monospace" textAnchor="middle" opacity="0.9">
                ▼ ▼ ▼
              </text>
            </g>

            {/* 2. SURFACE PORTAL ADIT (ENT-00) (Horizontal left from Junction 01 to Surface Portal) */}
            <g 
              className="cursor-pointer group" 
              onClick={() => handleSelectTunnelNode('ENT-00')}
            >
              {/* Active Selection Glow Ring */}
              {activeTunnel.id === 'ENT-00' && (
                <line x1="500" y1="160" x2="160" y2="160" stroke="#00f0ff" strokeWidth="30" strokeLinecap="round" opacity="0.4" filter="url(#selectionHalo)" />
              )}
              <line x1="500" y1="160" x2="160" y2="160" stroke="#07192f" strokeWidth="20" strokeLinecap="round" />
              <line x1="500" y1="160" x2="160" y2="160" stroke="#00f0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#safeCyanGlow)" />
              <line x1="500" y1="160" x2="160" y2="160" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
              
              {/* Surface Portal Adit Label & Arrows */}
              <rect 
                x="260" 
                y="125" 
                width="155" 
                height="20" 
                rx="3" 
                fill={activeTunnel.id === 'ENT-00' ? '#0d223f' : '#081426'} 
                stroke="#00f0ff" 
                strokeWidth={activeTunnel.id === 'ENT-00' ? 2 : 1} 
              />
              <text x="337" y="139" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Portal Adit (ENT-00)
              </text>
              <text x="440" y="164" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle">
                ◀ ◀
              </text>
            </g>

            {/* 3. TUNNEL A (T-A) (Horizontal right from Junction 01 to Stope 04) */}
            <g 
              className="cursor-pointer group" 
              onClick={() => handleSelectTunnelNode('T-A')}
            >
              {/* Active Selection Glow Ring */}
              {activeTunnel.id === 'T-A' && (
                <line x1="500" y1="160" x2="780" y2="160" stroke="#00f0ff" strokeWidth="30" strokeLinecap="round" opacity="0.4" filter="url(#selectionHalo)" />
              )}
              <line x1="500" y1="160" x2="780" y2="160" stroke="#07192f" strokeWidth="20" strokeLinecap="round" />
              <line x1="500" y1="160" x2="780" y2="160" stroke="#00f0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#safeCyanGlow)" />
              <line x1="500" y1="160" x2="780" y2="160" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
              
              {/* Tunnel A Label & Arrows */}
              <rect 
                x="565" 
                y="125" 
                width="125" 
                height="20" 
                rx="3" 
                fill={activeTunnel.id === 'T-A' ? '#0d223f' : '#081426'} 
                stroke="#00f0ff" 
                strokeWidth={activeTunnel.id === 'T-A' ? 2 : 1} 
              />
              <text x="627" y="139" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Tunnel A (T-A)
              </text>
              <text x="540" y="164" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle">
                ▶ ▶
              </text>
            </g>

            {/* 4. STOPE 04 (ST-04) (Production Face at Far Right of North Drift) */}
            <g 
              className="cursor-pointer group" 
              onClick={() => handleSelectTunnelNode('ST-04')}
            >
              {/* Active Selection Glow Ring */}
              {activeTunnel.id === 'ST-04' && (
                <line x1="780" y1="160" x2="920" y2="160" stroke="#00f0ff" strokeWidth="30" strokeLinecap="round" opacity="0.4" filter="url(#selectionHalo)" />
              )}
              <line x1="780" y1="160" x2="920" y2="160" stroke="#07192f" strokeWidth="20" strokeLinecap="round" />
              <line x1="780" y1="160" x2="920" y2="160" stroke="#00f0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#safeCyanGlow)" />
              <line x1="780" y1="160" x2="920" y2="160" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
              
              {/* Stope 04 Label */}
              <rect 
                x="810" 
                y="125" 
                width="105" 
                height="20" 
                rx="3" 
                fill={activeTunnel.id === 'ST-04' ? '#0d223f' : '#081426'} 
                stroke="#00f0ff" 
                strokeWidth={activeTunnel.id === 'ST-04' ? 2 : 1} 
              />
              <text x="862" y="139" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Stope 04 (ST-04)
              </text>
            </g>

            {/* 5. TUNNEL B (T-B) (WARNING & HAZARD STATUS - From Junction 01 to Junction 02) */}
            <g 
              className="cursor-pointer group" 
              onClick={() => handleSelectTunnelNode('T-B')}
            >
              {/* Active Selection Glow Ring */}
              {activeTunnel.id === 'T-B' && (
                <>
                  <line x1="500" y1="160" x2="660" y2="340" stroke="#f59e0b" strokeWidth="30" strokeLinecap="round" opacity="0.35" filter="url(#selectionHalo)" />
                  <line x1="660" y1="340" x2="920" y2="340" stroke="#ef4444" strokeWidth="32" strokeLinecap="round" opacity="0.4" filter="url(#selectionHalo)" />
                </>
              )}

              {/* Section 1: Inbye Warning Incline (J-01 to J-02) */}
              <line x1="500" y1="160" x2="660" y2="340" stroke="#261b04" strokeWidth="20" strokeLinecap="round" />
              <line x1="500" y1="160" x2="660" y2="340" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" filter="url(#warningAmberGlow)" />
              <line x1="500" y1="160" x2="660" y2="340" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.9" />

              {/* Section 2: Hazard Development Section (J-02 East to Dead End) */}
              <line x1="660" y1="340" x2="920" y2="340" stroke="#2d0a0a" strokeWidth="22" strokeLinecap="round" />
              <line x1="660" y1="340" x2="920" y2="340" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" filter="url(#hazardRedGlow)" />
              <line x1="660" y1="340" x2="920" y2="340" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.85" />
              <line x1="670" y1="340" x2="910" y2="340" stroke="#ef4444" strokeWidth="10" strokeDasharray="10 10" opacity="0.35" />

              {/* Inbye Drift Label & Warning Amber Arrows */}
              <rect 
                x="505" 
                y="265" 
                width="115" 
                height="20" 
                rx="3" 
                fill={activeTunnel.id === 'T-B' ? '#291802' : '#1c1303'} 
                stroke="#f59e0b" 
                strokeWidth={activeTunnel.id === 'T-B' ? 2 : 1.2} 
              />
              <text x="562" y="279" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ⚠ Tunnel B (T-B)
              </text>
              <text x="620" y="260" fill="#f59e0b" fontSize="12" fontFamily="monospace" textAnchor="middle">
                ↘ ↘
              </text>

              {/* Hazard Zone Label */}
              <rect 
                x="710" 
                y="300" 
                width="145" 
                height="22" 
                rx="3" 
                fill={activeTunnel.id === 'T-B' ? '#3b0d0d' : '#1e0505'} 
                stroke="#ef4444" 
                strokeWidth={activeTunnel.id === 'T-B' ? 2 : 1.5} 
              />
              <text x="782" y="315" fill="#f87171" fontSize="9.5" fontWeight="extrabold" fontFamily="monospace" textAnchor="middle">
                ⚡ HAZARD ZONE (T-B)
              </text>
              <text x="700" y="344" fill="#ef4444" fontSize="13" fontFamily="monospace" textAnchor="middle">
                ➔ ➔
              </text>
            </g>

            {/* 6. EASTERN VENTILATION BYPASS (Connecting Stope 04 to T-B Hazard Drift) */}
            <g opacity="0.75">
              <path d="M 780 160 Q 920 200 920 340" fill="none" stroke="#07192f" strokeWidth="16" strokeLinecap="round" />
              <path d="M 780 160 Q 920 200 920 340" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeDasharray="5 5" opacity="0.8" />
            </g>

            {/* 7. TUNNEL C (T-C) (South Ventilation Drift from Junction 02 to Return Exhaust) */}
            <g 
              className="cursor-pointer group" 
              onClick={() => handleSelectTunnelNode('T-C')}
            >
              {/* Active Selection Glow Ring */}
              {activeTunnel.id === 'T-C' && (
                <line x1="660" y1="340" x2="220" y2="500" stroke="#00f0ff" strokeWidth="30" strokeLinecap="round" opacity="0.4" filter="url(#selectionHalo)" />
              )}
              <line x1="660" y1="340" x2="220" y2="500" stroke="#07192f" strokeWidth="20" strokeLinecap="round" />
              <line x1="660" y1="340" x2="220" y2="500" stroke="#00f0ff" strokeWidth="3.5" strokeLinecap="round" filter="url(#safeCyanGlow)" />
              <line x1="660" y1="340" x2="220" y2="500" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />

              {/* Tunnel C Label & Arrows */}
              <rect 
                x="380" 
                y="405" 
                width="120" 
                height="18" 
                rx="3" 
                fill={activeTunnel.id === 'T-C' ? '#0d223f' : '#081426'} 
                stroke="#00f0ff" 
                strokeWidth={activeTunnel.id === 'T-C' ? 2 : 1} 
              />
              <text x="440" y="417" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Tunnel C (T-C)
              </text>
              <text x="520" y="415" fill="#38bdf8" fontSize="12" fontFamily="monospace" textAnchor="middle">
                ↙ ↙
              </text>
            </g>

            {/* 8. RETURN VENTILATION LOOP (Exhaust loop back to Portal) */}
            <g opacity="0.6">
              <path d="M 220 500 Q 140 330 160 160" fill="none" stroke="#07192f" strokeWidth="16" strokeLinecap="round" />
              <path d="M 220 500 Q 140 330 160 160" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.6" />
            </g>

            {/* 9. REFUGE CHAMBER (REFUGE-01) (Vertical Branch Down from Junction 02) */}
            <g 
              className="cursor-pointer group" 
              onClick={() => handleSelectTunnelNode('REFUGE-01')}
            >
              {/* Connecting shaft */}
              <line x1="660" y1="340" x2="660" y2="520" stroke="#052e16" strokeWidth="18" strokeLinecap="round" />
              <line x1="660" y1="340" x2="660" y2="520" stroke="#10b981" strokeWidth="3" strokeLinecap="round" filter="url(#refugeGreenGlow)" />
              <line x1="660" y1="340" x2="660" y2="520" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" />

              {/* Active Selection Glow Ring */}
              {activeTunnel.id === 'REFUGE-01' && (
                <rect x="590" y="490" width="140" height="68" rx="12" fill="none" stroke="#34d399" strokeWidth="3" filter="url(#selectionHalo)" />
              )}

              {/* Refuge Bunker Room Node */}
              <rect x="600" y="500" width="120" height="48" rx="8" fill="#022c22" stroke="#10b981" strokeWidth="2" filter="url(#refugeGreenGlow)" />
              <rect x="597" y="497" width="126" height="54" rx="10" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="4 4" opacity="0.75" />
              
              {/* Refuge Shelter Icon & Label */}
              <text x="660" y="522" fill="#34d399" fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ⛨
              </text>
              <text x="660" y="538" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Refuge Chamber (REFUGE-01)
              </text>
            </g>

            {/* ============================================================== */}
            {/* JUNCTION NODES (J-01, J-02)                                    */}
            {/* ============================================================== */}

            {/* JUNCTION 01 (J-01) — CENTRAL HUB */}
            <g 
              transform="translate(500, 160)" 
              className="cursor-pointer" 
              onClick={() => handleSelectTunnelNode('J-01')}
            >
              {activeTunnel.id === 'J-01' && (
                <circle r="34" fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="4 3" opacity="0.8" className="animate-spin" />
              )}
              <circle r="18" fill="#00f0ff" fillOpacity="0.25" stroke="#00f0ff" strokeWidth="2.5" filter="url(#safeCyanGlow)" />
              <circle r="8" fill="#00f0ff" />
              <circle r="26" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
              <rect 
                x="-52" 
                y="-36" 
                width="104" 
                height="18" 
                rx="3" 
                fill={activeTunnel.id === 'J-01' ? '#0d223f' : '#091322'} 
                stroke="#00f0ff" 
                strokeWidth={activeTunnel.id === 'J-01' ? 2 : 1} 
              />
              <text x="0" y="-24" fill="#00f0ff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Junction 01 (J-01)
              </text>
            </g>

            {/* JUNCTION 02 (J-02) — SUBSTATION VAULT */}
            <g 
              transform="translate(660, 340)" 
              className="cursor-pointer" 
              onClick={() => handleSelectTunnelNode('J-02')}
            >
              {activeTunnel.id === 'J-02' && (
                <circle r="34" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" opacity="0.8" className="animate-spin" />
              )}
              <circle r="18" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2.5" filter="url(#warningAmberGlow)" />
              <circle r="8" fill="#f59e0b" />
              <circle r="26" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <rect 
                x="-52" 
                y="24" 
                width="104" 
                height="18" 
                rx="3" 
                fill={activeTunnel.id === 'J-02' ? '#291802' : '#1b1203'} 
                stroke="#f59e0b" 
                strokeWidth={activeTunnel.id === 'J-02' ? 2 : 1} 
              />
              <text x="0" y="36" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Junction 02 (J-02)
              </text>
            </g>

            {/* VENTILATION RETURN EXHAUST JUNCTION */}
            <g transform="translate(220, 500)" className="cursor-pointer" onClick={() => handleSelectTunnelNode('T-C')}>
              <circle r="15" fill="#00f0ff" fillOpacity="0.2" stroke="#00f0ff" strokeWidth="2" filter="url(#safeCyanGlow)" />
              <circle r="6" fill="#00f0ff" />
              <rect x="-45" y="18" width="90" height="16" rx="3" fill="#091322" stroke="#00f0ff" strokeWidth="1" />
              <text x="0" y="29" fill="#00f0ff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Vent Return (T-C)
              </text>
            </g>

            {/* ============================================================== */}
            {/* VENTILATION INDICATORS                                         */}
            {/* ============================================================== */}
            <g transform="translate(350, 35)">
              <rect width="115" height="18" rx="3" fill="#061224" stroke="#00f0ff" strokeWidth="0.8" opacity="0.85" />
              <text x="57" y="12" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                Intake Downcast ➔
              </text>
            </g>

            <g transform="translate(90, 490)">
              <rect width="115" height="18" rx="3" fill="#061224" stroke="#00f0ff" strokeWidth="0.8" opacity="0.85" />
              <text x="57" y="12" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ◀ Exhaust Return
              </text>
            </g>

            {/* ============================================================== */}
            {/* SENSORS (Concentric Cyan / Amber Rings)                        */}
            {/* ============================================================== */}
            {topologySensors.map(s => {
              const isWarning = s.status === 'warning';
              const isCritical = s.status === 'critical';
              const color = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#00f0ff';

              return (
                <g 
                  key={s.id} 
                  transform={`translate(${s.x}, ${s.y})`}
                  className="cursor-pointer group/sensor"
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedEntity({ type: 'sensor', data: s });
                  }}
                  style={{ pointerEvents: 'all' }}
                >
                  {/* Generous invisible hit-box */}
                  <rect x="-24" y="-24" width="48" height="48" fill="white" fillOpacity="0.001" style={{ cursor: 'pointer' }} />
                  <circle r="10" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" className="group-hover/sensor:stroke-white transition-colors" />
                  <circle r="4" fill={color} />
                  <circle r="15" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
                  
                  {/* Hover Floating Mini Badge */}
                  <g className="opacity-0 group-hover/sensor:opacity-100 transition-opacity pointer-events-none">
                    <rect x="-42" y="-24" width="84" height="15" rx="3" fill="#0a1222" stroke={color} strokeWidth="1" />
                    <text x="0" y="-13" fill={color} fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {s.id}: {s.value}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* ============================================================== */}
            {/* WORKERS (Dynamically mapped from context workers array)        */}
            {/* ============================================================== */}
            {workers.map(w => {
              const coords = WORKER_COORDINATES[w.id] || { x: 500, y: 160 };
              const isHazard = w.status === 'CRITICAL' || w.movement === 'POSSIBLE_FALL';
              const isWarn = w.status === 'WARNING';
              const badgeFill = isHazard ? '#ef4444' : isWarn ? '#f59e0b' : '#0284c7';
              const strokeColor = isHazard ? '#f87171' : isWarn ? '#fbbf24' : '#38bdf8';

              return (
                <g 
                  key={w.id} 
                  transform={`translate(${coords.x}, ${coords.y})`} 
                  className="cursor-pointer group/worker select-none"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onSelectWorker) onSelectWorker(w);
                    setSelectedWorker(w);
                    setSelectedEntity({ 
                      type: 'worker', 
                      data: {
                        id: w.id,
                        name: w.name,
                        role: w.role,
                        tunnel: w.location,
                        status: w.status.toLowerCase(),
                        heartRate: w.vitals?.heartRate ?? 78,
                        spO2: w.vitals?.spO2 ?? 98,
                        battery: w.battery
                      }
                    });
                  }}
                  style={{ pointerEvents: 'all' }}
                >
                  <title>Click to view {w.name} ({w.id}) health details</title>
                  
                  {/* Generous transparent hit-box capturing all clicks and touches without jitter */}
                  <rect 
                    x="-32" 
                    y="-22" 
                    width="64" 
                    height="58" 
                    rx="8" 
                    fill="white" 
                    fillOpacity="0.001" 
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Outer Pulsing Radar Beacon */}
                  <circle 
                    r="16" 
                    fill={badgeFill} 
                    fillOpacity="0.3" 
                    stroke={strokeColor} 
                    strokeWidth="1.5" 
                    className="transition-all duration-150 group-hover/worker:stroke-white group-hover/worker:fill-opacity-50"
                  />
                  
                  {/* Worker Silhouette Badge */}
                  <rect 
                    x="-18" 
                    y="-10" 
                    width="36" 
                    height="20" 
                    rx="4" 
                    fill="#091426" 
                    stroke={strokeColor} 
                    strokeWidth="1.5" 
                    className="transition-all duration-150 group-hover/worker:stroke-cyan-300 group-hover/worker:fill-slate-900"
                  />
                  <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    👤 {w.id.replace('W-', '')}
                  </text>

                  {/* Vitals Indicator Pill */}
                  <rect 
                    x="-24" 
                    y="14" 
                    width="48" 
                    height="13" 
                    rx="2" 
                    fill="#070c18" 
                    stroke={strokeColor} 
                    strokeWidth="0.8" 
                    className="transition-all duration-150 group-hover/worker:stroke-white"
                  />
                  <text x="0" y="23" fill={strokeColor} fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    {w.vitals?.heartRate ?? 78} bpm
                  </text>

                  {/* Tooltip on hover indicating clickable action */}
                  <g className="opacity-0 group-hover/worker:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <rect x="-48" y="-38" width="96" height="15" rx="3" fill="#030712" stroke="#00f0ff" strokeWidth="1" />
                    <text x="0" y="-27" fill="#00f0ff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      Click for Vitals
                    </text>
                  </g>
                </g>
              );
            })}

            {/* ============================================================== */}
            {/* RESCUE ROVER #4 (Stationed in Tunnel B Hazard Zone)             */}
            {/* ============================================================== */}
            <g 
              transform="translate(850, 340)"
              className="cursor-pointer group/rover"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setSelectedEntity({ 
                  type: 'rover', 
                  data: {
                    id: 'ROVER-04',
                    label: 'Rescue Rover #4',
                    tunnel: 'Tunnel B (T-B) Hazard Section',
                    status: 'rescue',
                    battery: rover.battery || 78,
                    speed: `${rover.speed.toFixed(1)} m/s`,
                    heading: rover.gpsLocation?.heading ? `${rover.gpsLocation.heading}°` : '42° NE',
                    mode: rover.mode
                  }
                });
              }}
              style={{ pointerEvents: 'all' }}
            >
              {/* Invisible Hitbox */}
              <rect x="-35" y="-35" width="70" height="70" fill="white" fillOpacity="0.001" style={{ cursor: 'pointer' }} />
              {/* Outer Pulsing Halo */}
              <circle r="22" fill="#00f0ff" fillOpacity="0.15" stroke="#00f0ff" strokeWidth="1.5" filter="url(#safeCyanGlow)">
                <animate attributeName="r" values="20;26;20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Inner Chassis Icon Circle */}
              <circle r="12" fill="#08182b" stroke="#00f0ff" strokeWidth="2" className="group-hover/rover:stroke-white transition-colors" />
              <text x="0" y="4" fill="#00f0ff" fontSize="11" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                🚙
              </text>
              {/* Rover Label */}
              <rect x="-45" y="-32" width="90" height="18" rx="3" fill="#071220" stroke="#00f0ff" strokeWidth="1" />
              <text x="0" y="-20" fill="#00f0ff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                Rescue Rover #4
              </text>
            </g>

          </svg>

          {/* ================================================================ */}
          {/* BOTTOM STATUS BAR (Underground Mesh & Airflow)                   */}
          {/* ================================================================ */}
          <div className="absolute bottom-0 inset-x-0 bg-[#070e1e]/95 backdrop-blur-md border-t border-cyan-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-cyan-300">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-extrabold tracking-wider text-white">UNDERGROUND MESH:</span>
              <span className="text-cyan-300 font-bold">6 DRIFT BEACONS ACTIVE • CANONICAL TOPOLOGY LINKED</span>
            </div>
            <div className="flex items-center gap-5 text-[11px]">
              <div>
                <span className="text-slate-400">ACTIVE DRIFT: </span>
                <strong className="text-white">{activeTunnel.id}</strong>
              </div>
              <div>
                <span className="text-slate-400">AIRFLOW: </span>
                <strong className="text-cyan-300">{activeTunnel.airflowVelocity} m/s ({activeTunnel.airflowDirection})</strong>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* MODAL / POPOVER FOR CLICKED ENTITIES                             */}
          {/* ================================================================ */}
          {selectedEntity && (
            <div className="absolute top-4 right-4 z-30 bg-[#081224]/95 backdrop-blur-md border border-cyan-400/60 rounded-xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.9)] max-w-xs w-full text-xs font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-3">
                <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <Crosshair className="w-3.5 h-3.5" />
                  {selectedEntity.type.toUpperCase()} TELEMETRY
                </span>
                <button 
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Worker Telemetry */}
              {selectedEntity.type === 'worker' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-sm">{selectedEntity.data.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedEntity.data.status === 'critical' || selectedEntity.data.status === 'hazard' || selectedEntity.data.status === 'fall'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : selectedEntity.data.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {selectedEntity.data.id} • {selectedEntity.data.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{selectedEntity.data.role}</div>
                  <div className="text-[11px] pt-1">
                    <span className="text-slate-400">Tunnel: </span>
                    <strong className="text-cyan-300">{selectedEntity.data.tunnel}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" /> Heart Rate
                      </span>
                      <span className="text-white font-bold text-sm">{selectedEntity.data.heartRate} bpm</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-400" /> SpO₂
                      </span>
                      <span className="text-white font-bold text-sm">{selectedEntity.data.spO2}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sensor Telemetry */}
              {selectedEntity.type === 'sensor' && (
                <div className="space-y-2">
                  <div className="text-white font-extrabold text-sm">{selectedEntity.data.name}</div>
                  <div className="text-slate-400 text-[11px]">{selectedEntity.data.id} in {selectedEntity.data.tunnel}</div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px]">CURRENT READING</span>
                    <span className="text-mine-cyan font-extrabold text-base">{selectedEntity.data.value}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    STATUS: <strong className={selectedEntity.data.status === 'critical' ? 'text-red-400' : selectedEntity.data.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}>{selectedEntity.data.status.toUpperCase()}</strong>
                  </div>
                </div>
              )}

              {/* Rover Telemetry */}
              {selectedEntity.type === 'rover' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-sm">{selectedEntity.data.label}</span>
                    <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold border border-cyan-500/40">
                      RESCUE MODE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Position: {selectedEntity.data.tunnel}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Battery</span>
                      <span className="text-cyan-300 font-bold text-sm block">{selectedEntity.data.battery}%</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Drive Speed</span>
                      <span className="text-white font-bold text-sm block">{selectedEntity.data.speed}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tunnel Telemetry */}
              {selectedEntity.type === 'tunnel' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-sm">{selectedEntity.data.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedEntity.data.status === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : selectedEntity.data.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {selectedEntity.data.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Code: <strong className="text-white">{selectedEntity.data.code}</strong> • Length: {selectedEntity.data.length} • Depth: {selectedEntity.data.depth}</div>
                  <div className="text-[11px] text-slate-400">Airflow: <strong className="text-white">{selectedEntity.data.airflow}</strong></div>
                  <div className="text-[11px] text-slate-400">Atmosphere: <strong className="text-cyan-300">CH₄ {selectedEntity.data.methane} • CO {selectedEntity.data.co} • {selectedEntity.data.temp}</strong></div>
                  {selectedEntity.data.alert && (
                    <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-[10px]">
                      ⚠ {selectedEntity.data.alert}
                    </div>
                  )}
                </div>
              )}

              {/* Refuge Telemetry */}
              {selectedEntity.type === 'refuge' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-sm">{selectedEntity.data.name}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/40">
                      SAFE ZONE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">Capacity: <strong>{selectedEntity.data.capacity}</strong></div>
                  <div className="text-[11px] text-slate-300">Reserve: <strong>{selectedEntity.data.airSupply}</strong></div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Positive Pressure Sealed & Verified
                  </div>
                </div>
              )}

              {/* Junction Telemetry */}
              {selectedEntity.type === 'junction' && (
                <div className="space-y-2">
                  <div className="text-white font-extrabold text-sm">{selectedEntity.data.name} ({selectedEntity.data.code})</div>
                  <div className="text-slate-400 text-[10px] uppercase">CONNECTING DRIFTS:</div>
                  <ul className="text-[11px] text-cyan-300 space-y-0.5 list-disc pl-4">
                    {selectedEntity.data.connections?.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ================================================================== */}
        {/* RIGHT: VERTICAL INFORMATION / TELEMETRY PANEL (3 Cols / ~25%)       */}
        {/* Synchronized with activeTunnel                                     */}
        {/* ================================================================== */}
        <div className="xl:col-span-3 bg-[#1B201D] p-4 space-y-3.5 border-t xl:border-t-0 border-[#303631] text-xs font-mono">
          
          {/* CARD 1 — SECTOR STATUS */}
          <div className="bg-[#202522] rounded-[4px] border border-[#303631] p-3 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-industrial-copper font-bold text-xs tracking-wider border-b border-[#303631] pb-2">
              <span className={`w-2 h-2 rounded-full ${
                activeTunnel.status === 'CRITICAL' ? 'bg-[#B8443D] animate-pulse' :
                activeTunnel.status === 'WARNING' ? 'bg-[#D99A35] animate-pulse' :
                'bg-[#4F7A58] animate-pulse'
              }`}></span>
              <span>SECTOR STATUS</span>
            </div>
            
            <div className="text-[#F4F1EA] font-bold text-[11px] flex items-center gap-1 truncate">
              <span className="text-industrial-copper">▼</span>
              <span>{activeTunnel.id}: {activeTunnel.name.toUpperCase()}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {/* Safe Drift */}
              <div className="flex items-center justify-between p-2 rounded-[3px] bg-[#2A302B] border border-[#3A423C]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#4F7A58]"></span>
                  <span className="text-[#D2CEC4]">Safe Drift</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#88908A]">{activeTunnel.safeKm ?? 2.8} km</span>
                  <span className="text-[#4F7A58] font-bold">68%</span>
                </div>
              </div>

              {/* Warning Zone */}
              <div className="flex items-center justify-between p-2 rounded-[3px] bg-[#2A302B] border border-[#3A423C]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D99A35]"></span>
                  <span className="text-[#D2CEC4]">Warning Zone</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#88908A]">{activeTunnel.warningKm ?? 0.6} km</span>
                  <span className="text-[#D99A35] font-bold">15%</span>
                </div>
              </div>

              {/* Hazard Zone */}
              <div className="flex items-center justify-between p-2 rounded-[3px] bg-[#2A302B] border border-[#3A423C]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[#B8443D]"></span>
                  <span className="text-[#D2CEC4]">Hazard Zone</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#88908A]">{activeTunnel.hazardKm ?? 0.4} km</span>
                  <span className="text-[#B8443D] font-bold">10%</span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2 — ACTIVE ENTITIES */}
          <div className="bg-[#202522] rounded-[4px] border border-[#303631] p-3 shadow-xs space-y-3">
            <div className="text-industrial-copper font-bold text-xs tracking-wider border-b border-[#303631] pb-2">
              ACTIVE ENTITIES
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Workers */}
              <div className="bg-[#2A302B] p-2.5 rounded-[3px] border border-[#3A423C] text-center">
                <div className="text-[#88908A] text-[10px] mb-1">Workers</div>
                <div className="text-base text-blue-300">👤</div>
                <div className="text-white font-bold text-base">{activeSectorWorkers.length}</div>
                <div className="text-[9px] text-[#D99A35] mt-0.5">
                  ({workers.filter(w => w.status === 'WARNING' || w.status === 'CRITICAL').length} in hazard)
                </div>
              </div>

              {/* Rover */}
              <div className="bg-[#2A302B] p-2.5 rounded-[3px] border border-[#3A423C] text-center">
                <div className="text-[#88908A] text-[10px] mb-1">Rover</div>
                <div className="text-base text-industrial-copper">🚙</div>
                <div className="text-white font-bold text-base">1</div>
                <div className="text-[9px] text-industrial-copper mt-0.5">
                  ({activeTunnel.hasRover ? 'Stationed' : 'Patrol'})
                </div>
              </div>

              {/* Sensors */}
              <div className="bg-[#2A302B] p-2.5 rounded-[3px] border border-[#3A423C] text-center">
                <div className="text-[#88908A] text-[10px] mb-1">Sensors</div>
                <div className="text-base text-emerald-400">◎</div>
                <div className="text-white font-bold text-base">6</div>
                <div className="text-[9px] text-[#4F7A58] mt-0.5">(Online)</div>
              </div>
            </div>
          </div>

          {/* CARD 3 — KEY LOCATIONS */}
          <div className="bg-[#202522] rounded-[4px] border border-[#303631] p-3 shadow-xs space-y-2.5">
            <div className="text-industrial-copper font-bold text-xs tracking-wider border-b border-[#303631] pb-2">
              KEY LOCATIONS (CLICK TO INSPECT)
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div 
                onClick={() => handleSelectTunnelNode('MAIN-01')}
                className={`flex items-center justify-between p-2 rounded-[3px] border cursor-pointer transition-colors ${
                  activeTunnel.id === 'MAIN-01' ? 'bg-industrial-copper/20 border-industrial-copper text-industrial-copper font-bold' : 'bg-[#2A302B] border-[#3A423C] hover:bg-[#323A33] text-[#D2CEC4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-industrial-copper" />
                  <span>Main Decline (MAIN-01)</span>
                </div>
                <span className="text-industrial-copper font-mono font-bold">-80 m</span>
              </div>

              <div 
                onClick={() => handleSelectTunnelNode('REFUGE-01')}
                className={`flex items-center justify-between p-2 rounded-[3px] border cursor-pointer transition-colors ${
                  activeTunnel.id === 'REFUGE-01' ? 'bg-[#4F7A58]/20 border-[#4F7A58] text-[#4F7A58] font-bold' : 'bg-[#2A302B] border-[#3A423C] hover:bg-[#323A33] text-[#D2CEC4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4F7A58]" />
                  <span>Refuge Chamber (REFUGE-01)</span>
                </div>
                <span className="text-[#4F7A58] font-mono font-bold">-180 m</span>
              </div>

              <div 
                onClick={() => handleSelectTunnelNode('J-01')}
                className={`flex items-center justify-between p-2 rounded-[3px] border cursor-pointer transition-colors ${
                  activeTunnel.id === 'J-01' ? 'bg-industrial-copper/20 border-industrial-copper text-industrial-copper font-bold' : 'bg-[#2A302B] border-[#3A423C] hover:bg-[#323A33] text-[#D2CEC4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-industrial-copper" />
                  <span>Junction 01 (Central Hub)</span>
                </div>
                <span className="text-industrial-copper font-mono font-bold">-140 m</span>
              </div>

              <div 
                onClick={() => handleSelectTunnelNode('J-02')}
                className={`flex items-center justify-between p-2 rounded-[3px] border cursor-pointer transition-colors ${
                  activeTunnel.id === 'J-02' ? 'bg-[#D99A35]/20 border-[#D99A35] text-[#D99A35] font-bold' : 'bg-[#2A302B] border-[#3A423C] hover:bg-[#323A33] text-[#D2CEC4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-[#D99A35]" />
                  <span>Junction 02 (Substation)</span>
                </div>
                <span className="text-[#D99A35] font-mono font-bold">-180 m</span>
              </div>
            </div>
          </div>

          {/* CARD 4 — ENVIRONMENT */}
          <div className="bg-[#202522] rounded-[4px] border border-[#303631] p-3 shadow-xs space-y-2.5">
            <div className="text-industrial-copper font-bold text-xs tracking-wider border-b border-[#303631] pb-2">
              ENVIRONMENT ({activeTunnel.id})
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-[3px] bg-[#2A302B] border border-[#3A423C]">
                <div className="flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-industrial-copper" />
                  <span className="text-[#D2CEC4]">Air Flow</span>
                </div>
                <span className="text-white font-bold">{activeTunnel.airflowVelocity} m/s ({activeTunnel.airflowDirection})</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[3px] bg-[#2A302B] border border-[#3A423C]">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-3.5 h-3.5 text-[#D99A35]" />
                  <span className="text-[#D2CEC4]">Temperature</span>
                </div>
                <span className="text-white font-bold">{activeTunnel.temp}°C</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[3px] bg-[#2A302B] border border-[#3A423C]">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-[#4F7A58]" />
                  <span className="text-[#D2CEC4]">Atmosphere</span>
                </div>
                <span className={`font-bold ${
                  activeTunnel.status === 'CRITICAL' ? 'text-[#B8443D]' :
                  activeTunnel.status === 'WARNING' ? 'text-[#D99A35]' :
                  'text-[#4F7A58]'
                }`}>
                  CH₄: {activeTunnel.methane}% • CO: {activeTunnel.co} ppm
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
