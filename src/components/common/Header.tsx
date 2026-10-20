import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Bell, 
  Volume2, 
  VolumeX, 
  Settings, 
  Flame, 
  RefreshCw, 
  UserCheck, 
  Compass, 
  Activity,
  Zap
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { StatusIndicator } from './StatusIndicator';

export const Header: React.FC = () => {
  const {
    demoMode,
    toggleDemoMode,
    emergencySimulated,
    simulateEmergency,
    resetSimulation,
    alerts,
    aiDetection,
    setActiveTab,
    setIsStreamSettingsOpen,
    buzzerAudioEnabled,
    setBuzzerAudioEnabled
  } = useMine();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeCriticalAlerts = alerts.filter(a => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'HIGH_RISK'));
  const overallSystemStatus = emergencySimulated ? 'CRITICAL' : activeCriticalAlerts.length > 0 ? 'WARNING' : 'ONLINE';

  return (
    <header className="bg-mine-header border-b border-mine-border px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-40 shadow-lg">
      {/* Left: Brand, Tagline & Project */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div 
          onClick={() => setActiveTab('command-center')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative p-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-mine-cyan shadow-[0_0_12px_rgba(0,240,255,0.25)] group-hover:border-cyan-400 flex items-center justify-center">
            <img 
              src="/minesyntra_logo.png" 
              alt="MineSyntra Logo" 
              className="w-9 h-9 object-contain rounded" 
            />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-wider font-mono bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                MINESYNTRA AI
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span>“Sense. Predict. Locate. Rescue.”</span>
              <span className="text-slate-600">•</span>
              <span className="hidden sm:inline text-slate-400">Integrated Mine Safety Systems</span>
            </div>
          </div>
        </div>

        {/* Mobile persistent status */}
        <div className="md:hidden">
          <StatusIndicator status={overallSystemStatus} size="sm" />
        </div>
      </div>

      {/* Middle: Mine Site & Live System Status */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mine:</span>
          <span className="text-white font-semibold">Horizon #4 Deep Shaft Adit</span>
        </div>

        <StatusIndicator status={overallSystemStatus} size="md" />

        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-white font-semibold">{currentTime}</span>
          <span className="text-slate-500">{currentDate}</span>
        </div>
      </div>

      {/* Right Controls: Emergency Trigger, Demo Mode, Alerts & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
        {/* Hackathon Emergency Simulation Trigger Button */}
        {emergencySimulated ? (
          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-slate-200 shadow transition-all"
            title="Reset simulation to normal baseline"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="hidden sm:inline">Reset System</span>
          </button>
        ) : (
          <button
            onClick={simulateEmergency}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 border border-red-400/50 text-xs font-mono text-white font-semibold shadow-[0_0_15px_rgba(239,68,68,0.35)] transition-all animate-pulse-subtle"
            title="Trigger simulated gas anomaly and worker incident for safety emergency drill"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>SIMULATE EMERGENCY</span>
          </button>
        )}

        {/* Mode Indicator */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
          <button
            onClick={toggleDemoMode}
            className={`text-[11px] font-mono px-2 py-0.5 rounded transition-all font-semibold flex items-center gap-1.5 ${
              demoMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{demoMode ? 'DEMO MODE' : 'LIVE HARDWARE'}</span>
          </button>
        </div>

        {/* Buzzer Audio Toggle */}
        <button
          onClick={() => setBuzzerAudioEnabled(!buzzerAudioEnabled)}
          className={`p-1.5 rounded-lg border transition-colors ${
            buzzerAudioEnabled 
              ? 'bg-cyan-500/20 text-mine-cyan border-cyan-500/40' 
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title={buzzerAudioEnabled ? 'Alarm Sound: Enabled' : 'Alarm Sound: Muted'}
        >
          {buzzerAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Alert Bell with Counter */}
        <button
          onClick={() => setActiveTab('alerts')}
          className="relative p-1.5 rounded-lg bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors"
          title="Open Alerts & Incidents"
        >
          <Bell className="w-4 h-4" />
          {activeCriticalAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">
              {activeCriticalAlerts.length}
            </span>
          )}
        </button>

        {/* Camera & Hardware Settings Modal Trigger */}
        <button
          onClick={() => setIsStreamSettingsOpen(true)}
          className="p-1.5 rounded-lg bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-mine-cyan transition-colors"
          title="Hardware & Camera Stream Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Operator Profile */}
        <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs font-mono">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-white font-medium">R. Sharma</div>
            <div className="text-[10px] text-slate-500 font-mono">Safety Operator #04</div>
          </div>
        </div>
      </div>
    </header>
  );
};
