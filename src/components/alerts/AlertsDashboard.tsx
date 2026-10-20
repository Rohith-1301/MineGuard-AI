import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Flame, 
  Wind, 
  UserX, 
  Filter, 
  Clock, 
  MapPin, 
  Check, 
  Volume2, 
  VolumeX,
  Radio,
  ArrowRight
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { AlertSeverity } from '../../types';

export const AlertsDashboard: React.FC = () => {
  const { 
    alerts, 
    acknowledgeAlert, 
    setActiveTab, 
    setSelectedTunnel, 
    tunnels,
    buzzerAudioEnabled,
    setBuzzerAudioEnabled
  } = useMine();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const filteredAlerts = alerts.filter(a => {
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && !a.acknowledged) || 
      (statusFilter === 'RESOLVED' && a.acknowledged);
    return matchesSeverity && matchesStatus;
  });

  const criticalCount = alerts.filter(a => !a.acknowledged && a.severity === 'CRITICAL').length;
  const highRiskCount = alerts.filter(a => !a.acknowledged && a.severity === 'HIGH_RISK').length;
  const warningCount = alerts.filter(a => !a.acknowledged && a.severity === 'WARNING').length;
  const infoCount = alerts.filter(a => !a.acknowledged && a.severity === 'INFO').length;

  const handleLocateAlert = (zoneId: string) => {
    const tunnel = tunnels.find(t => t.id === zoneId);
    if (tunnel) {
      setSelectedTunnel(tunnel);
    }
    setActiveTab('map');
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          label: '🔴 CRITICAL',
          bg: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
          border: 'border-red-500/60',
          cardBg: 'bg-red-950/20'
        };
      case 'HIGH_RISK':
        return {
          label: '🟠 HIGH RISK',
          bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          border: 'border-orange-500/50',
          cardBg: 'bg-orange-950/20'
        };
      case 'WARNING':
        return {
          label: '🟡 WARNING',
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          border: 'border-amber-500/50',
          cardBg: 'bg-amber-950/15'
        };
      case 'INFO':
      default:
        return {
          label: '🟢 INFORMATION',
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          border: 'border-emerald-500/40',
          cardBg: 'bg-slate-900/40'
        };
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mine-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
              ALERTS & INCIDENT MANAGEMENT SYSTEM
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-bold">
              REAL-TIME DISPATCH
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Automated sensor anomalies, posture fall alerts, operator acknowledgment audit log, and standard operating procedures (SOP)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBuzzerAudioEnabled(!buzzerAudioEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              buzzerAudioEnabled
                ? 'bg-cyan-500/20 text-mine-cyan border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {buzzerAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{buzzerAudioEnabled ? 'Audio Buzzer: Active' : 'Audio Buzzer: Muted'}</span>
          </button>
        </div>
      </div>

      {/* KPI Severity Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setSeverityFilter('CRITICAL')}
          className="p-4 rounded-xl bg-red-950/20 border border-red-500/40 cursor-pointer hover:border-red-400 transition-all text-xs font-mono"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span>CRITICAL</span>
            <span className="text-red-400 text-base">🔴</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-red-400 my-1">
            {criticalCount}
          </div>
          <div className="text-[10px] text-slate-400">Immediate hazard intervention</div>
        </div>

        <div 
          onClick={() => setSeverityFilter('HIGH_RISK')}
          className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/40 cursor-pointer hover:border-orange-400 transition-all text-xs font-mono"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span>HIGH RISK</span>
            <span className="text-orange-400 text-base">🟠</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-orange-400 my-1">
            {highRiskCount}
          </div>
          <div className="text-[10px] text-slate-400">Threshold breach advisory</div>
        </div>

        <div 
          onClick={() => setSeverityFilter('WARNING')}
          className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 cursor-pointer hover:border-amber-400 transition-all text-xs font-mono"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span>WARNING</span>
            <span className="text-amber-400 text-base">🟡</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 my-1">
            {warningCount}
          </div>
          <div className="text-[10px] text-slate-400">Pre-cautionary tracking</div>
        </div>

        <div 
          onClick={() => setSeverityFilter('INFO')}
          className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 cursor-pointer hover:border-emerald-400 transition-all text-xs font-mono"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span>INFORMATION</span>
            <span className="text-emerald-400 text-base">🟢</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 my-1">
            {infoCount}
          </div>
          <div className="text-[10px] text-slate-400">Routine system handshakes</div>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>
          {['ALL', 'CRITICAL', 'HIGH_RISK', 'WARNING', 'INFO'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded transition-colors ${
                severityFilter === sev
                  ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/40 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Status:</span>
          {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/40 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-mine-card border border-mine-border text-slate-500 font-mono text-xs">
            No incidents found matching the selected filter criteria.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const badge = getSeverityBadge(alert.severity);
            return (
              <div
                key={alert.id}
                className={`rounded-xl border ${badge.border} ${badge.cardBg} p-5 shadow-lg transition-all space-y-3.5`}
              >
                {/* Alert Top Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-sm font-bold font-mono text-white">
                      {alert.sensorOrEvent}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ID: {alert.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {alert.timestamp}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {alert.location}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  {/* Current Reading */}
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">
                      Current Telemetry Value
                    </span>
                    <div className="text-sm font-bold text-white">
                      {alert.currentValue}
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className="md:col-span-2 p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                    <span className="text-[10px] text-mine-cyan font-bold uppercase block mb-1">
                      RECOMMENDED ACTION (SOP PROTOCOL):
                    </span>
                    <div className="text-xs text-slate-300 leading-relaxed">
                      {alert.recommendedAction}
                    </div>
                  </div>
                </div>

                {/* Footer with Acknowledge Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 text-xs font-mono">
                  <div className="text-slate-400">
                    {alert.acknowledged ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Acknowledged by <strong>{alert.acknowledgedBy}</strong> at {alert.acknowledgedAt}</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Awaiting control room operator sign-off</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLocateAlert(alert.zoneId)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pin on Map</span>
                    </button>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono shadow transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Acknowledge Incident</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
