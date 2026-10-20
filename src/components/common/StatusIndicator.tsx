import React from 'react';

interface StatusIndicatorProps {
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'LIVE' | 'DELAY';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showPulse = true
}) => {
  const getColor = () => {
    switch (status) {
      case 'ONLINE':
      case 'LIVE':
        return {
          dot: 'bg-emerald-500',
          ping: 'bg-emerald-400',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-950/40'
        };
      case 'WARNING':
      case 'DELAY':
        return {
          dot: 'bg-amber-500',
          ping: 'bg-amber-400',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
          bg: 'bg-amber-950/40'
        };
      case 'CRITICAL':
        return {
          dot: 'bg-red-500',
          ping: 'bg-red-400',
          text: 'text-red-400',
          border: 'border-red-500/30',
          bg: 'bg-red-950/40'
        };
      case 'OFFLINE':
      default:
        return {
          dot: 'bg-slate-500',
          ping: 'bg-slate-400',
          text: 'text-slate-400',
          border: 'border-slate-500/30',
          bg: 'bg-slate-900/40'
        };
    }
  };

  const style = getColor();
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  const textClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm font-semibold' : 'text-xs font-medium';

  const defaultLabel = {
    ONLINE: 'SYSTEM ONLINE',
    LIVE: 'LIVE',
    WARNING: 'SYSTEM WARNING',
    DELAY: 'DATA DELAY',
    CRITICAL: 'SYSTEM CRITICAL',
    OFFLINE: 'OFFLINE'
  }[status];

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${style.border} ${style.bg} ${textClass}`}>
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {showPulse && status !== 'OFFLINE' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.ping} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${style.dot}`} />
      </span>
      <span className={`tracking-wider uppercase font-mono ${style.text}`}>
        {label || defaultLabel}
      </span>
    </div>
  );
};
