import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Wind, 
  Users, 
  Map, 
  AlertTriangle, 
  BarChart3, 
  Cpu, 
  Wifi,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useMine } from '../../context/MineContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, rover, systemStatus } = useMine();

  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;

  const navItems = [
    {
      id: 'command-center',
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'rover-live',
      label: 'Rover Live',
      icon: Video,
      badge: rover.status === 'ONLINE' ? 'LIVE' : rover.status,
      badgeColor: rover.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    {
      id: 'environment',
      label: 'Mine Environment',
      icon: Wind,
      badge: null
    },
    {
      id: 'workers',
      label: 'Workers',
      icon: Users,
      badge: '24',
      badgeColor: 'bg-cyan-500/20 text-mine-cyan border-cyan-500/30'
    },
    {
      id: 'map',
      label: 'Tunnel & Mine Map',
      icon: Map,
      badge: '9 ZONES',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    },
    {
      id: 'alerts',
      label: 'Alerts & Incidents',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? `${activeAlertsCount}` : null,
      badgeColor: activeAlertsCount > 0 ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : ''
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'system-status',
      label: 'System Status',
      icon: Cpu,
      badge: systemStatus.backend.online ? 'OK' : 'ERR',
      badgeColor: systemStatus.backend.online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/20 text-red-400'
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-mine-header/90 border-r border-mine-border flex flex-col justify-between shrink-0 h-auto lg:h-[calc(100vh-61px)] select-none">
      {/* Navigation List */}
      <div className="p-3 space-y-1 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto flex lg:flex-col gap-1 lg:gap-1">
        <div className="hidden lg:block px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
          Navigation Modules
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all group shrink-0 ${
                isActive
                  ? 'bg-cyan-500/10 text-mine-cyan border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.12)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-mine-cyan' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span className="whitespace-nowrap tracking-wide">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`hidden lg:block w-3.5 h-3.5 transition-transform ${
                  isActive ? 'text-mine-cyan translate-x-0.5' : 'text-slate-700 opacity-0 group-hover:opacity-100'
                }`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Hardware & Connection Teaser */}
      <div className="hidden lg:block p-3 border-t border-mine-border/80 bg-slate-950/40 text-xs font-mono space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
          <span>Telemetry Links</span>
          <Wifi className="w-3 h-3 text-emerald-400" />
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${systemStatus.esp32.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              ESP32 Node:
            </span>
            <span className="text-white font-semibold">{systemStatus.esp32.ip}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${rover.streamStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              Rover Cam:
            </span>
            <span className="text-emerald-400 font-semibold">{rover.streamStatus}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              AI Core:
            </span>
            <span className="text-cyan-400 font-semibold">ONLINE</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
          <span>MineSyntra OS v2.4</span>
          <span className="text-cyan-500/80">ONLINE</span>
        </div>
      </div>
    </aside>
  );
};
