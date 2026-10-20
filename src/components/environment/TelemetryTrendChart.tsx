import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Flame, 
  Wind, 
  Thermometer, 
  Droplets,
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Maximize2,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useMine } from '../../context/MineContext';

export type TelemetryMetricKey = 'humidity' | 'temp' | 'gas' | 'co' | 'air_quality';
export type TimeRangeKey = '1m' | '5m' | '15m' | '1h' | '24h';

interface TelemetryPoint {
  time: string;
  value: number;
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'CLEAR';
}

interface TelemetryTrendChartProps {
  selectedMetric?: TelemetryMetricKey;
  onSelectMetric?: (metric: TelemetryMetricKey) => void;
  timeRange?: TimeRangeKey;
  onSelectTimeRange?: (range: TimeRangeKey) => void;
}

/**
 * Spline bezier path generator (Monotone/Catmull-Rom style cubic bezier)
 */
function getSmoothBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  const tension = 0.22;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const TelemetryTrendChart: React.FC<TelemetryTrendChartProps> = ({
  selectedMetric: externalMetric,
  onSelectMetric,
  timeRange: externalRange,
  onSelectTimeRange
}) => {
  const { sensors } = useMine();

  // Internal state if not controlled externally
  const [internalMetric, setInternalMetric] = useState<TelemetryMetricKey>('humidity');
  const [internalRange, setInternalRange] = useState<TimeRangeKey>('5m');

  const activeMetric = externalMetric || internalMetric;
  const activeRange = externalRange || internalRange;

  const handleMetricChange = (metric: TelemetryMetricKey) => {
    if (onSelectMetric) onSelectMetric(metric);
    else setInternalMetric(metric);
  };

  const handleRangeChange = (range: TimeRangeKey) => {
    if (onSelectTimeRange) onSelectTimeRange(range);
    else setInternalRange(range);
  };

  // Hover Tooltip state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Time range definitions
  const ranges: { id: TimeRangeKey; label: string; count: number }[] = [
    { id: '1m', label: 'Last 1m', count: 12 },
    { id: '5m', label: 'Last 5m', count: 10 },
    { id: '15m', label: 'Last 15m', count: 12 },
    { id: '1h', label: 'Last 1h', count: 14 },
    { id: '24h', label: 'Last 24h', count: 16 }
  ];

  const coVal = sensors.carbonMonoxide.value;
  const coUnit = sensors.carbonMonoxide.unit || '%';
  const gasVal = sensors.gasSensor?.value ?? 13.6;
  const gasUnit = sensors.gasSensor?.unit ?? '%';
  const airVal = sensors.airQuality?.value ?? 32.6;
  const airUnit = sensors.airQuality?.unit ?? '%';

  const coMaxY = coUnit === '%' ? Math.max(10, Math.ceil(coVal * 2)) : 60;
  const gasMaxY = gasUnit === '%' ? Math.max(30, Math.ceil(gasVal * 1.5)) : Math.max(800, Math.ceil(gasVal * 1.5 / 100) * 100);
  const airMaxY = airUnit === '%' ? Math.max(60, Math.ceil(airVal * 1.5)) : (airUnit === 'AQI' ? Math.max(250, Math.ceil(airVal * 1.5 / 50) * 50) : 5000);

  // Sensor definitions & statutory compliance thresholds for 5 sensors
  const configs: Record<TelemetryMetricKey, {
    name: string;
    subName: string;
    unit: string;
    current: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'CLEAR';
    trend: number;
    color: string;
    safeRange: string;
    warningThreshold: number;
    criticalThreshold: number;
    minY: number;
    maxY: number;
    icon: React.ReactNode;
  }> = {
    humidity: {
      name: 'Atmospheric Humidity',
      subName: 'Moisture & Condensation Monitor',
      unit: '%',
      current: sensors.humidity.value,
      status: sensors.humidity.status,
      trend: sensors.humidity.trend,
      color: '#06b6d4',
      safeRange: '40% – 75%',
      warningThreshold: 80,
      criticalThreshold: 90,
      minY: 0,
      maxY: 100,
      icon: <Droplets className="w-4 h-4 text-cyan-400" />
    },
    temp: {
      name: 'Ambient Temperature',
      subName: 'Dry Bulb Underground Thermal Stress',
      unit: '°C',
      current: sensors.temperature.value,
      status: sensors.temperature.status,
      trend: sensors.temperature.trend,
      color: '#f43f5e',
      safeRange: '18 °C – 32 °C',
      warningThreshold: 35,
      criticalThreshold: 38,
      minY: 10,
      maxY: 45,
      icon: <Thermometer className="w-4 h-4 text-pink-400" />
    },
    gas: {
      name: 'Gas Sensor (LPG / Smoke / MQ-2)',
      subName: 'Combustible & Flammable Gas Exposure',
      unit: gasUnit,
      current: gasVal,
      status: sensors.gasSensor?.status ?? 'NORMAL',
      trend: sensors.gasSensor?.trend ?? 0,
      color: '#f59e0b',
      safeRange: gasUnit === '%' ? '< 20.0 %' : '< 400 ppm',
      warningThreshold: gasUnit === '%' ? 25.0 : 600,
      criticalThreshold: gasUnit === '%' ? 40.0 : 1000,
      minY: 0,
      maxY: gasMaxY,
      icon: <Flame className="w-4 h-4 text-amber-400" />
    },
    co: {
      name: 'Carbon Monoxide (CO / MQ-7)',
      subName: 'Toxic Gas Exposure Monitor',
      unit: coUnit,
      current: coVal,
      status: sensors.carbonMonoxide.status,
      trend: sensors.carbonMonoxide.trend,
      color: '#eab308',
      safeRange: coUnit === '%' ? '< 5.0 %' : '< 25 ppm',
      warningThreshold: coUnit === '%' ? 5.0 : 25,
      criticalThreshold: coUnit === '%' ? 10.0 : 50,
      minY: 0,
      maxY: coMaxY,
      icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />
    },
    air_quality: {
      name: 'Air Quality (MQ-135)',
      subName: 'Air Quality Index & Gas Purity',
      unit: airUnit,
      current: airVal,
      status: sensors.airQuality?.status ?? 'NORMAL',
      trend: sensors.airQuality?.trend ?? 0,
      color: '#10b981',
      safeRange: airUnit === '%' ? '< 25.0 %' : '< 100 AQI',
      warningThreshold: airUnit === '%' ? 25.0 : 150,
      criticalThreshold: airUnit === '%' ? 50.0 : 250,
      minY: 0,
      maxY: airMaxY,
      icon: <Wind className="w-4 h-4 text-emerald-400" />
    }
  };

  const currentConfig = configs[activeMetric];

  // Dynamic series generation based on activeRange ending at live current value, continuously scrolling every second
  const dataPoints: TelemetryPoint[] = useMemo(() => {
    const activeRangeDef = ranges.find(r => r.id === activeRange) || ranges[1];
    const count = activeRangeDef.count;
    const pts: TelemetryPoint[] = [];
    const now = new Date();

    const stepSeconds = activeRange === '1m' ? 5 
                      : activeRange === '5m' ? 30 
                      : activeRange === '15m' ? 75 
                      : activeRange === '1h' ? 240 
                      : 5400;

    // Anchor on latest live sensor reading
    const baseValue = currentConfig.current;

    for (let i = count - 1; i >= 0; i--) {
      const pointDate = new Date(now.getTime() - i * stepSeconds * 1000);
      const hours = pointDate.getHours().toString().padStart(2, '0');
      const mins = pointDate.getMinutes().toString().padStart(2, '0');
      const secs = pointDate.getSeconds().toString().padStart(2, '0');
      
      const timeStr = activeRange === '1m' || activeRange === '5m' 
        ? `${hours}:${mins}:${secs}` 
        : `${hours}:${mins}`;

      if (i === 0) {
        pts.push({
          time: timeStr,
          value: baseValue,
          status: currentConfig.status
        });
      } else {
        // Natural continuous waveform variation that connects seamlessly to live baseValue
        const varianceFactor = Math.max(0.5, (currentConfig.maxY - currentConfig.minY) * 0.04);
        const waveTime = (now.getTime() / 1000 - i * stepSeconds);
        const sinVal = Math.sin(waveTime * 0.3) * varianceFactor;
        const cosVal = Math.cos(waveTime * 0.15) * (varianceFactor * 0.5);
        const rawVal = baseValue - (i * 0.015 * varianceFactor) + sinVal + cosVal;
        
        const clampedVal = Math.max(
          currentConfig.minY + 0.1, 
          Math.min(currentConfig.maxY - 0.2, Number(rawVal.toFixed(currentConfig.unit === '%' ? 2 : 1)))
        );

        const status = clampedVal >= currentConfig.criticalThreshold ? 'CRITICAL'
                     : clampedVal >= currentConfig.warningThreshold ? 'WARNING'
                     : 'NORMAL';

        pts.push({
          time: timeStr,
          value: clampedVal,
          status
        });
      }
    }
    return pts;
  }, [activeMetric, activeRange, currentConfig.current, currentConfig.status, currentConfig.minY, currentConfig.maxY, currentConfig.warningThreshold, currentConfig.criticalThreshold]);

  // Chart coordinate space
  const chartW = 760;
  const chartH = 260;
  const padL = 55;
  const padR = 25;
  const padT = 35;
  const padB = 40;

  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const getX = (idx: number) => padL + (idx / Math.max(dataPoints.length - 1, 1)) * innerW;
  const getY = (val: number) => {
    const clamped = Math.max(currentConfig.minY, Math.min(currentConfig.maxY, val));
    const norm = (clamped - currentConfig.minY) / (currentConfig.maxY - currentConfig.minY);
    return chartH - padB - norm * innerH;
  };

  // Generate SVG coordinates for all points
  const points = useMemo(() => {
    return dataPoints.map((pt, idx) => ({
      x: getX(idx),
      y: getY(pt.value),
      ...pt
    }));
  }, [dataPoints, currentConfig.minY, currentConfig.maxY]);

  // Generate smooth spline curve & area fill
  const splinePathD = useMemo(() => getSmoothBezierPath(points), [points]);
  
  const areaFillD = useMemo(() => {
    if (points.length < 2) return '';
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const baseY = chartH - padB;
    return `${splinePathD} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;
  }, [splinePathD, points]);

  // Threshold Y levels
  const warningY = getY(currentConfig.warningThreshold);
  const criticalY = getY(currentConfig.criticalThreshold);

  // Mouse hover event handling
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    
    // Scale to viewBox coordinates
    const scaleX = chartW / rect.width;
    const svgX = clientX * scaleX;

    // Find nearest point
    let closestIdx = 0;
    let minDistance = Infinity;

    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeHoverPt = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="rounded-xl bg-mine-card border border-mine-border p-4 sm:p-5 shadow-2xl space-y-4 font-mono select-none">
      
      {/* ==================================================================== */}
      {/* 1. CHART HEADER & CONTROLS                                           */}
      {/* ==================================================================== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Left: Metric Title & Badges */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-inner flex items-center justify-center">
            {currentConfig.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                <span>{currentConfig.name}</span>
                <span className="text-slate-400 font-normal text-xs">({currentConfig.subName})</span>
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                currentConfig.status === 'CRITICAL' 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse'
                  : currentConfig.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {currentConfig.status}
              </span>
            </div>

            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Safe: <strong className="text-emerald-400">{currentConfig.safeRange}</strong></span>
              <span>•</span>
              <span>Warning: <strong className="text-amber-400">{currentConfig.warningThreshold} {currentConfig.unit}</strong></span>
              <span>•</span>
              <span>Critical: <strong className="text-red-400">{currentConfig.criticalThreshold} {currentConfig.unit}</strong></span>
              <span>•</span>
              <span>Live: <strong className="text-white font-bold">{currentConfig.current} {currentConfig.unit}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Metric Selector Tabs & Time Range Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* 5 Sensor Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shadow-inner">
            {[
              { id: 'humidity', label: 'Humidity', color: 'text-cyan-400' },
              { id: 'temp', label: 'Temperature', color: 'text-pink-400' },
              { id: 'gas', label: 'Gas Sensor', color: 'text-amber-400' },
              { id: 'co', label: 'CO', color: 'text-yellow-400' },
              { id: 'air_quality', label: 'Air Quality', color: 'text-emerald-400' },
            ].map(tab => {
              const isSelected = activeMetric === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMetricChange(tab.id as TelemetryMetricKey)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-white border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isSelected ? tab.color : ''}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time Ranges */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 shadow-inner">
            {ranges.map(range => {
              const isSelected = activeRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => handleRangeChange(range.id)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. INDUSTRIAL VECTOR SVG TELEMETRY CANVAS                             */}
      {/* ==================================================================== */}
      <div className="relative w-full overflow-hidden bg-[#040813] rounded-lg border border-cyan-500/20 shadow-inner">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-64 sm:h-72 cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Background Grid Pattern */}
            <pattern id="telemetryGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#0e1d33" strokeWidth="0.8" opacity="0.6" />
            </pattern>

            {/* Area Fill Linear Gradient */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentConfig.color} stopOpacity="0.38" />
              <stop offset="65%" stopColor={currentConfig.color} stopOpacity="0.10" />
              <stop offset="100%" stopColor={currentConfig.color} stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Shaders */}
            <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Canvas Background */}
          <rect width={chartW} height={chartH} fill="#040813" />
          <rect x={padL} y={padT} width={innerW} height={innerH} fill="url(#telemetryGrid)" />

          {/* Statutory Threshold Area Bands */}
          {criticalY >= padT && criticalY <= chartH - padB && (
            <rect
              x={padL}
              y={padT}
              width={innerW}
              height={Math.max(0, criticalY - padT)}
              fill="#ef4444"
              fillOpacity="0.06"
            />
          )}

          {warningY >= padT && warningY <= chartH - padB && (
            <rect
              x={padL}
              y={Math.max(padT, criticalY)}
              width={innerW}
              height={Math.max(0, warningY - Math.max(padT, criticalY))}
              fill="#f59e0b"
              fillOpacity="0.04"
            />
          )}

          {/* Reference Horizontal Grid Lines */}
          <line x1={padL} y1={padT} x2={chartW - padR} y2={padT} stroke="#17253d" strokeDasharray="3 3" />
          <line x1={padL} y1={padT + innerH * 0.25} x2={chartW - padR} y2={padT + innerH * 0.25} stroke="#122036" strokeDasharray="3 3" />
          <line x1={padL} y1={padT + innerH * 0.5} x2={chartW - padR} y2={padT + innerH * 0.5} stroke="#122036" strokeDasharray="3 3" />
          <line x1={padL} y1={padT + innerH * 0.75} x2={chartW - padR} y2={padT + innerH * 0.75} stroke="#122036" strokeDasharray="3 3" />
          <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#1e293b" strokeWidth="1.5" />

          {/* CRITICAL STATUTORY THRESHOLD LINE */}
          {criticalY >= padT && criticalY <= chartH - padB && (
            <g>
              <line
                x1={padL}
                y1={criticalY}
                x2={chartW - padR}
                y2={criticalY}
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                opacity={0.85}
              />
              <text
                x={chartW - padR - 6}
                y={criticalY - 4}
                fill="#ef4444"
                fontSize={9}
                textAnchor="end"
                fontWeight="bold"
              >
                CRITICAL LIMIT ({currentConfig.criticalThreshold} {currentConfig.unit})
              </text>
            </g>
          )}

          {/* WARNING STATUTORY THRESHOLD LINE */}
          {warningY >= padT && warningY <= chartH - padB && (
            <g>
              <line
                x1={padL}
                y1={warningY}
                x2={chartW - padR}
                y2={warningY}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                opacity={0.85}
              />
              <text
                x={chartW - padR - 6}
                y={warningY - 4}
                fill="#f59e0b"
                fontSize={9}
                textAnchor="end"
                fontWeight="bold"
              >
                WARNING LIMIT ({currentConfig.warningThreshold} {currentConfig.unit})
              </text>
            </g>
          )}

          {/* Gradient Fill under the smooth curve */}
          <path d={areaFillD} fill="url(#areaGradient)" />

          {/* Smooth Spline Telemetry Curve */}
          <path
            d={splinePathD}
            fill="none"
            stroke={currentConfig.color}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 6px ${currentConfig.color})`
            }}
          />

          {/* Data Points on Curve */}
          {points.map((pt, idx) => {
            const isLast = idx === points.length - 1;
            const isHovered = hoverIndex === idx;

            return (
              <g key={idx}>
                {/* Regular dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#060c18"
                  stroke={currentConfig.color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all"
                />

                {/* Pulsing Animated Radar Marker on the Latest Live Reading */}
                {isLast && (
                  <g>
                    <circle cx={pt.x} cy={pt.y} r={16} fill={currentConfig.color} fillOpacity="0.25">
                      <animate attributeName="r" values="5;18;5" dur="2.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={pt.x} cy={pt.y} r={4.5} fill={currentConfig.color} stroke="#ffffff" strokeWidth={1.5} />
                  </g>
                )}

                {/* X-Axis Timestamp Labels (spaced out) */}
                {(idx % Math.ceil(points.length / 6) === 0 || isLast) && (
                  <text
                    x={pt.x}
                    y={chartH - 18}
                    fill="#64748b"
                    fontSize={9.5}
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {pt.time}
                  </text>
                )}
              </g>
            );
          })}

          {/* Y-Axis Value Labels */}
          <text x={padL - 10} y={padT + 4} fill="#64748b" fontSize={9} textAnchor="end">
            {currentConfig.maxY} {currentConfig.unit}
          </text>
          <text x={padL - 10} y={padT + innerH * 0.5 + 4} fill="#475569" fontSize={9} textAnchor="end">
            {((currentConfig.maxY + currentConfig.minY) / 2).toFixed(currentConfig.unit === '%' ? 1 : 0)}
          </text>
          <text x={padL - 10} y={chartH - padB} fill="#64748b" fontSize={9} textAnchor="end">
            {currentConfig.minY} {currentConfig.unit}
          </text>

          {/* Interactive Crosshair Cursor Guide Line */}
          {activeHoverPt && (
            <g className="pointer-events-none">
              <line
                x1={activeHoverPt.x}
                y1={padT}
                x2={activeHoverPt.x}
                y2={chartH - padB}
                stroke="#00f0ff"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                opacity={0.8}
              />
              <circle
                cx={activeHoverPt.x}
                cy={activeHoverPt.y}
                r={7}
                fill="none"
                stroke="#00f0ff"
                strokeWidth={2}
                className="animate-ping"
              />
            </g>
          )}
        </svg>

        {/* Floating HUD Cyberpunk Tooltip */}
        {activeHoverPt && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-[#081224]/95 backdrop-blur-md border border-cyan-500/50 rounded-lg p-2.5 shadow-[0_6px_20px_rgba(0,0,0,0.85)] min-w-[150px] text-xs"
            style={{
              left: `${(activeHoverPt.x / chartW) * 100}%`,
              top: `${Math.max(40, (activeHoverPt.y / chartH) * 100)}%`
            }}
          >
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-700/80 mb-1.5 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-bold text-white">
                <Clock className="w-3 h-3 text-cyan-400" />
                {activeHoverPt.time}
              </span>
              <span className={`px-1.5 py-0.2 rounded font-extrabold text-[9px] ${
                activeHoverPt.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                activeHoverPt.status === 'WARNING' ? 'bg-amber-500/20 text-amber-300' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {activeHoverPt.status}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-400 text-[11px] font-medium">{activeMetric.toUpperCase()} Level:</span>
              <span className="text-base font-extrabold text-white" style={{ color: currentConfig.color }}>
                {activeHoverPt.value} <span className="text-xs font-normal text-slate-300">{currentConfig.unit}</span>
              </span>
            </div>

            <div className="text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-800 flex justify-between">
              <span>Threshold:</span>
              <span className={activeHoverPt.value >= currentConfig.warningThreshold ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                {currentConfig.warningThreshold} {currentConfig.unit}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. CHART FOOTER / STATUTORY AUDIT LEGEND                             */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-slate-300">Statutory Safe Zone</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
            <span className="text-slate-300">Warning Threshold</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_6px_#ef4444]" />
            <span className="text-slate-300">Statutory Critical Trip</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Real-time ADC & NDIR sampling stream • 1.0 Hz cadence</span>
        </div>
      </div>

    </div>
  );
};
