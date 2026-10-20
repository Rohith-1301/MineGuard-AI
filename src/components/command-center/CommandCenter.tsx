import React from 'react';
import { 
  Users, 
  Radio, 
  ShieldAlert, 
  AlertTriangle, 
  Wind, 
  Flame, 
  Compass, 
  Eye, 
  CheckCircle2, 
  ArrowRight,
  Activity,
  Cpu,
  ChevronRight,
  Send,
  Zap
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { MetricCard } from '../common/MetricCard';
import { RiskGauge } from '../common/RiskGauge';
import { StatusIndicator } from '../common/StatusIndicator';

export const CommandCenter: React.FC = () => {
  const { 
    sensors, 
    rover, 
    aiDetection, 
    workers, 
    alerts, 
    tunnels, 
    setActiveTab, 
    setSelectedTunnel,
    emergencySimulated,
    acknowledgeAlert
  } = useMine();

  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const criticalAlerts = alerts.filter(a => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'HIGH_RISK'));

  const overallSafetyStatus = emergencySimulated ? 'CRITICAL' : aiDetection.riskLevel === 'CRITICAL' ? 'CRITICAL' : aiDetection.riskLevel === 'HIGH' ? 'WARNING' : 'SAFE';

  // Complete MineGuard AI 7-Stage Workflow
  const workflowStages = [
    {
      id: 'sense',
      step: '01',
      name: 'SENSE',
      title: 'Multigas & Telemetry',
      desc: 'Rover & drift sensors capture CH₄, CO, O₂, Temp & Distance.',
      active: true,
      icon: Wind
    },
    {
      id: 'communicate',
      step: '02',
      name: 'COMMUNICATE',
      title: 'ESP32 Wi-Fi Mesh',
      desc: 'Packets transmitted via robust underground LAN/WebSocket.',
      active: true,
      icon: Radio
    },
    {
      id: 'analyze',
      step: '03',
      name: 'ANALYZE',
      title: 'AI Inference Engine',
      desc: 'Real-time multi-variate risk scoring & sensor trend modeling.',
      active: true,
      icon: Cpu
    },
    {
      id: 'detect',
      step: '04',
      name: 'DETECT',
      title: 'Computer Vision & CV',
      desc: 'YOLO detects workers, postures, possible falls & hazards.',
      active: true,
      icon: Eye
    },
    {
      id: 'alert',
      step: '05',
      name: 'ALERT',
      title: 'Instant Warning Dispatch',
      desc: 'Immediate audio buzzer & visual priority alert broadcast.',
      active: emergencySimulated || activeAlertsCount > 0,
      icon: AlertTriangle
    },
    {
      id: 'locate',
      step: '06',
      name: 'LOCATE',
      title: 'Indoor Positioning',
      desc: 'Precise schematic tunnel mapping pinpoints workers in danger.',
      active: emergencySimulated,
      icon: Compass
    },
    {
      id: 'rescue',
      step: '07',
      name: 'RESCUE',
      title: 'Rover Mission Deployment',
      desc: 'Deploy autonomous/remote rover for inspection & two-way beacon.',
      active: emergencySimulated,
      icon: ShieldAlert
    }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner if Emergency Active */}
      {emergencySimulated && (
        <div className="rounded-xl bg-red-950/60 border-2 border-red-500/80 p-4 shadow-[0_0_30px_rgba(239,68,68,0.35)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)]">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold font-mono text-white tracking-wider">
                  CRITICAL INCIDENT IN PROGRESS — TUNNEL B
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-400 font-bold">
                  SIMULATION ACTIVE
                </span>
              </div>
              <p className="text-xs text-red-200 mt-0.5 font-mono">
                Hazard: Methane concentration spike (2.45%) & low O₂ (17.8%) • Affected Personnel: 3 Workers • Rover Inspection Recommended
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rover-live')}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs shadow transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Deploy Rover View</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-mono text-xs transition-colors"
            >
              Locate on Map
            </button>
          </div>
        </div>
      )}

      {/* 1. Four Major Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Workers */}
        <MetricCard
          title="ACTIVE WORKERS"
          value="24"
          unit="Tracked"
          description="Workers currently detected/tracked"
          status="SAFE"
          icon={<Users className="w-4 h-4" />}
          thresholdNote="100% accounted for"
          onClick={() => setActiveTab('workers')}
        />

        {/* Rover Status */}
        <MetricCard
          title="ROVER STATUS"
          value={rover.status}
          unit="Connected"
          description={`Battery: ${rover.battery}% • Speed: ${rover.speed} m/s`}
          status={rover.status === 'ONLINE' ? 'NORMAL' : 'WARNING'}
          icon={<Radio className="w-4 h-4" />}
          thresholdNote={rover.location}
          onClick={() => setActiveTab('rover-live')}
        />

        {/* Mine Risk Level */}
        <MetricCard
          title="MINE RISK LEVEL"
          value={aiDetection.riskLevel}
          unit={`Score: ${aiDetection.riskScore}/100`}
          description="AI Real-time Risk Assessment"
          status={aiDetection.riskLevel === 'CRITICAL' ? 'CRITICAL' : aiDetection.riskLevel === 'HIGH' ? 'WARNING' : 'NORMAL'}
          icon={<Activity className="w-4 h-4" />}
          thresholdNote="Updated continuous"
          onClick={() => setActiveTab('rover-live')}
        />

        {/* Active Alerts */}
        <MetricCard
          title="ACTIVE ALERTS"
          value={activeAlertsCount.toString().padStart(2, '0')}
          unit="Unresolved"
          description={`${criticalAlerts.length} high priority alerts`}
          status={criticalAlerts.length > 0 ? 'CRITICAL' : activeAlertsCount > 0 ? 'WARNING' : 'SAFE'}
          icon={<AlertTriangle className="w-4 h-4" />}
          thresholdNote="Acknowledge required"
          onClick={() => setActiveTab('alerts')}
        />
      </div>

      {/* 2. Overall Mine Safety & AI Risk Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large AI Risk Indicator Card */}
        <div className="rounded-xl bg-mine-card border border-mine-border p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-mine-cyan" />
                OVERALL MINE SAFETY
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Composite assessment from atmospheric & telemetry telemetry
              </div>
            </div>
            <StatusIndicator 
              status={overallSafetyStatus === 'SAFE' ? 'ONLINE' : overallSafetyStatus === 'WARNING' ? 'WARNING' : 'CRITICAL'} 
              label={overallSafetyStatus}
              size="md"
            />
          </div>

          <div className="py-2 flex justify-center">
            <RiskGauge score={aiDetection.riskScore} level={aiDetection.riskLevel} size={210} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1.5 text-slate-400">
            <div className="flex items-center justify-between">
              <span>Methane Envelope:</span>
              <span className={sensors.methane.status === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-slate-300'}>
                {sensors.methane.value} {sensors.methane.unit} ({sensors.methane.status})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Oxygen Saturation:</span>
              <span className={sensors.oxygen.status === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-slate-300'}>
                {sensors.oxygen.value} {sensors.oxygen.unit} ({sensors.oxygen.status})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Personnel Immobile:</span>
              <span className={aiDetection.possibleFallDetected ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {aiDetection.possibleFallDetected ? '1 Anomaly Flagged' : 'None Detected'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Anomaly & Human-in-the-Loop Action Panel */}
        <div className="lg:col-span-2 rounded-xl bg-mine-card border border-mine-border p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                  MINEGUARD AI ANALYSIS & ANOMALIES
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Human-in-the-Loop Advisory
              </span>
            </div>

            {/* Anomaly list */}
            <div className="space-y-2.5 mb-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                DETECTED ANOMALIES ({aiDetection.detectedAnomalies.length})
              </div>
              {aiDetection.detectedAnomalies.map((anomaly, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                    emergencySimulated || anomaly.includes('CRITICAL') || anomaly.includes('POSSIBLE')
                      ? 'bg-red-950/20 border-red-500/40 text-red-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    emergencySimulated ? 'text-red-400' : 'text-cyan-400'
                  }`} />
                  <div>{anomaly}</div>
                </div>
              ))}
            </div>

            {/* Recommended Action */}
            <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-mine-cyan">
                <Zap className="w-4 h-4" />
                RECOMMENDED ACTION (HUMAN VERIFICATION REQUIRED):
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {aiDetection.recommendedAction}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Rover Telemetry Latency: 28ms</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('rover-live')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>Inspect Video Feed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('environment')}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-mine-cyan border border-cyan-500/30 transition-colors flex items-center gap-1.5"
              >
                <span>Detailed Sensor Curves</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Complete MineGuard AI Workflow (SENSE -> COMMUNICATE -> ANALYZE -> DETECT -> ALERT -> LOCATE -> RESCUE) */}
      <div className="rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="text-xs font-mono font-bold text-mine-cyan uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              OPERATIONAL LIFECYCLE ARCHITECTURE
            </div>
            <h3 className="text-base font-bold font-mono text-white mt-0.5">
              SENSE → COMMUNICATE → ANALYZE → DETECT → ALERT → LOCATE → RESCUE
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Autonomous Safety Loop
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 relative">
          {workflowStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                  stage.active
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.08)]'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                      {stage.step}
                    </span>
                    <Icon className={`w-4 h-4 ${stage.active ? 'text-mine-cyan' : 'text-slate-600'}`} />
                  </div>
                  <div className="text-xs font-bold font-mono text-white mb-0.5">
                    {stage.name}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 font-semibold mb-1">
                    {stage.title}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {stage.desc}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                  <span className={stage.active ? 'text-emerald-400' : 'text-slate-500'}>
                    ● {stage.active ? 'ENGAGED' : 'STANDBY'}
                  </span>
                  {idx < 6 && (
                    <ArrowRight className="hidden lg:block w-3 h-3 text-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Grid: Tunnel Section Hazards + Active Alerts Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Underground Tunnel Sectors Matrix */}
        <div className="lg:col-span-2 rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-mine-cyan" />
              <h3 className="text-sm font-bold font-mono text-white">
                UNDERGROUND SECTOR ATMOSPHERIC MATRIX
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('map')}
              className="text-xs font-mono text-mine-cyan hover:underline flex items-center gap-1"
            >
              <span>View Full Schematic</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tunnels.map(tunnel => (
              <div
                key={tunnel.id}
                onClick={() => {
                  setSelectedTunnel(tunnel);
                  setActiveTab('map');
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  tunnel.status === 'CRITICAL'
                    ? 'bg-red-950/20 border-red-500/60 hover:border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                    : tunnel.status === 'WARNING'
                    ? 'bg-amber-950/20 border-amber-500/60 hover:border-amber-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold font-mono text-white truncate">
                    {tunnel.name}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    tunnel.status === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : tunnel.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {tunnel.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                  <div>CH₄: <span className="text-white font-semibold">{tunnel.methane}%</span></div>
                  <div>CO: <span className="text-white font-semibold">{tunnel.co} ppm</span></div>
                  <div>O₂: <span className="text-white font-semibold">{tunnel.o2}%</span></div>
                  <div>Temp: <span className="text-white font-semibold">{tunnel.temp}°C</span></div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Workers: {tunnel.workersPresent.length}</span>
                  {tunnel.hasRover && <span className="text-cyan-400 font-bold">ROVER HERE</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Action Alerts Queue */}
        <div className="rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-mono text-white">
                  ACTIONABLE INCIDENTS
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {activeAlertsCount} pending
              </span>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 3).map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 ${
                    alert.acknowledged
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-red-950/30 border-red-500/50'
                      : 'bg-amber-950/20 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                  </div>
                  <div className="font-bold text-white text-xs">{alert.sensorOrEvent}</div>
                  <div className="text-[11px] text-slate-400">{alert.location}</div>

                  {!alert.acknowledged ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="w-full mt-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Acknowledge Protocol</span>
                    </button>
                  ) : (
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Acknowledged by {alert.acknowledgedBy}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('alerts')}
            className="w-full mt-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Incident Registry</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
