import React from 'react';
import { RiskLevel } from '../../types';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: number;
  showDetails?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  level,
  size = 180,
  showDetails = true
}) => {
  // SVG arc calculation (semi-circle / 240 deg arc)
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  
  // Circumference of 240 degrees (4/6 of a circle)
  const arcLength = 2 * Math.PI * radius * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  const getColor = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          stroke: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.4)',
          text: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400 border-red-500/40'
        };
      case 'HIGH':
        return {
          stroke: '#f97316',
          glow: 'rgba(249, 115, 22, 0.4)',
          text: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40'
        };
      case 'MODERATE':
        return {
          stroke: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.4)',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
        };
      case 'LOW':
      default:
        return {
          stroke: '#10b981',
          glow: 'rgba(16, 185, 129, 0.4)',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
        };
    }
  };

  const theme = getColor();

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Background track arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(150 ${center} ${center})`}
          />
          {/* Active progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(150 ${center} ${center})`}
            style={{
              filter: `drop-shadow(0 0 8px ${theme.glow})`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease'
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center top-2">
          <span className="text-xs uppercase tracking-widest font-mono text-slate-400 font-semibold">
            AI Risk Score
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${theme.text}`}>
              {score}
            </span>
            <span className="text-sm font-mono text-slate-500 font-bold">
              / 100
            </span>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold tracking-wider border ${theme.badge}`}>
            {level}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="w-full grid grid-cols-4 gap-1 text-center mt-1 text-[11px] font-mono text-slate-400">
          <div className={`p-1 rounded bg-slate-900/60 border ${score <= 25 ? 'border-emerald-500/40 text-emerald-400 font-bold' : 'border-slate-800'}`}>
            0-25<br/><span className="text-[10px]">LOW</span>
          </div>
          <div className={`p-1 rounded bg-slate-900/60 border ${score > 25 && score <= 50 ? 'border-amber-500/40 text-amber-400 font-bold' : 'border-slate-800'}`}>
            26-50<br/><span className="text-[10px]">MOD</span>
          </div>
          <div className={`p-1 rounded bg-slate-900/60 border ${score > 50 && score <= 75 ? 'border-orange-500/40 text-orange-400 font-bold' : 'border-slate-800'}`}>
            51-75<br/><span className="text-[10px]">HIGH</span>
          </div>
          <div className={`p-1 rounded bg-slate-900/60 border ${score > 75 ? 'border-red-500/40 text-red-400 font-bold' : 'border-slate-800'}`}>
            76-100<br/><span className="text-[10px]">CRIT</span>
          </div>
        </div>
      )}
    </div>
  );
};
