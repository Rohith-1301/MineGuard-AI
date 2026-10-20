import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  status?: 'NORMAL' | 'SAFE' | 'WARNING' | 'CRITICAL' | 'CLEAR';
  trend?: number;
  trendUnit?: string;
  lastUpdated?: string;
  icon?: React.ReactNode;
  thresholdNote?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  description,
  status = 'NORMAL',
  trend,
  trendUnit = '',
  lastUpdated,
  icon,
  thresholdNote,
  badge,
  onClick,
  className = ''
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          border: 'border-red-500/50 hover:border-red-400',
          bg: 'bg-red-950/10 hover:bg-red-950/20',
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
          glow: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
        };
      case 'WARNING':
        return {
          border: 'border-amber-500/50 hover:border-amber-400',
          bg: 'bg-amber-950/10 hover:bg-amber-950/20',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          glow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
        };
      case 'SAFE':
      case 'CLEAR':
      case 'NORMAL':
      default:
        return {
          border: 'border-slate-800 hover:border-cyan-500/40',
          bg: 'bg-[#111827] hover:bg-[#152033]',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          glow: 'hover:shadow-[0_0_15px_rgba(0,240,255,0.08)]'
        };
    }
  };

  const style = getStatusStyles();

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border ${style.border} ${style.bg} ${style.glow} p-4 transition-all duration-200 relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Top Header with title and status badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-mine-cyan">{icon}</span>}
          <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <div>{badge}</div>
          )}
          {status && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold tracking-wider ${style.badgeBg}`}>
              {status}
            </span>
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-2 my-1">
        <span 
          key={String(value)}
          className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-white reading-smooth-change inline-block"
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-mono font-semibold text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Description or Threshold note */}
      {description && (
        <div className="text-xs text-slate-400 line-clamp-1 mb-2">
          {description}
        </div>
      )}

      {/* Footer with Trend & Last Updated */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-1">
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-0.5 font-medium ${
              trend > 0 ? 'text-amber-400' : trend < 0 ? 'text-emerald-400' : 'text-slate-400'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : trend < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {trend > 0 ? `+${trend}` : trend} {trendUnit}
            </span>
          )}
          {thresholdNote && !trend && (
            <span className="text-slate-400">{thresholdNote}</span>
          )}
        </div>

        {lastUpdated && (
          <span className="text-slate-500">
            {lastUpdated}
          </span>
        )}
      </div>
    </div>
  );
};
