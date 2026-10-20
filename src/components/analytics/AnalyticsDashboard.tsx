import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Flame, 
  Wind, 
  Thermometer, 
  AlertTriangle, 
  Users, 
  Clock, 
  Radio,
  UserX,
  PieChart
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { MetricCard } from '../common/MetricCard';

export const AnalyticsDashboard: React.FC = () => {
  const { sensors, workers, alerts, rover, aiDetection, emergencySimulated } = useMine();

  // Aggregate statistical metrics
  const avgMethane = emergencySimulated ? '1.12 %' : '0.41 %';
  const maxMethane = emergencySimulated ? '2.45 %' : '0.48 %';
  const avgCO = emergencySimulated ? '24 ppm' : '12 ppm';
  const minO2 = emergencySimulated ? '17.8 %' : '20.4 %';
  const avgTemp = '31.2 °C';
  const totalAlertsCount = alerts.length;
  const workerDetections = 148;
  const possibleFallsCount = emergencySimulated ? 1 : 0;
  const roverOperatingTime = '48h 24m';

  // Bar chart data for shift alert distribution
  const shiftAlertData = [
    { shift: 'Shift 1 (Morning 06:00 - 14:00)', count: 2, crit: 0 },
    { shift: 'Shift 2 (Afternoon 14:00 - 22:00)', count: emergencySimulated ? 5 : 3, crit: emergencySimulated ? 2 : 0 },
    { shift: 'Shift 3 (Night 22:00 - 06:00)', count: 1, crit: 0 }
  ];

  // Worker posture distribution
  const postureData = [
    { name: 'Normal / Walking', count: emergencySimulated ? 22 : 23, color: '#10b981' },
    { name: 'Low Movement / Resting', count: 1, color: '#f59e0b' },
    { name: 'Possible Inactivity / Fall', count: emergencySimulated ? 1 : 0, color: '#ef4444' }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mine-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-mine-cyan" />
            <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
              SAFETY ANALYTICS & HISTORICAL INSIGHTS
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-mine-cyan">
              SHIFT AUDIT LOGS
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Aggregated statistical distributions, hazard spike correlations, worker activity patterns & rover uptime
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Current Shift: <strong className="text-white">Shift 2 [Horizon-4]</strong></span>
        </div>
      </div>

      {/* 19. Core Statistical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="AVG METHANE (CH₄)"
          value={avgMethane}
          description="Shift Rolling Mean"
          status="NORMAL"
          icon={<Flame className="w-4 h-4 text-cyan-400" />}
          thresholdNote="Statutory Limit: 1.25%"
        />

        <MetricCard
          title="PEAK METHANE (CH₄)"
          value={maxMethane}
          description="Highest Recorded Spike"
          status={emergencySimulated ? 'CRITICAL' : 'NORMAL'}
          icon={<Flame className="w-4 h-4 text-red-400" />}
          thresholdNote={emergencySimulated ? 'Tunnel B Anomaly' : 'Baseline normal'}
        />

        <MetricCard
          title="AVERAGE CO"
          value={avgCO}
          description="Carbon Monoxide Baseline"
          status="NORMAL"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
          thresholdNote="Limit: 25 ppm"
        />

        <MetricCard
          title="MINIMUM OXYGEN (O₂)"
          value={minO2}
          description="Lowest Drift Saturation"
          status={emergencySimulated ? 'CRITICAL' : 'SAFE'}
          icon={<Wind className="w-4 h-4 text-emerald-400" />}
          thresholdNote="Minimum: 19.5%"
        />

        <MetricCard
          title="ROVER RUN-TIME"
          value={roverOperatingTime}
          description="Mission Operating Hours"
          status="NORMAL"
          icon={<Radio className="w-4 h-4 text-cyan-400" />}
          thresholdNote="Inspection sweep active"
        />
      </div>

      {/* Secondary Row of Analytics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>TOTAL ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalAlertsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Shift resolution rate: 85%</div>
        </div>

        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>AI WORKER DETECTIONS</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{workerDetections}</div>
          <div className="text-[10px] text-slate-400 mt-1">Spatial CV inferences</div>
        </div>

        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>POSSIBLE FALLS</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <div className={`text-2xl font-bold font-mono ${possibleFallsCount > 0 ? 'text-red-400' : 'text-white'}`}>
            {possibleFallsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Prompt human review</div>
        </div>

        <div className="p-4 rounded-xl bg-mine-card border border-mine-border text-xs font-mono">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span>AVG TEMPERATURE</span>
            <Thermometer className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{avgTemp}</div>
          <div className="text-[10px] text-slate-400 mt-1">Deep adit psychrometry</div>
        </div>
      </div>

      {/* Analytics Visualizations: Alert Frequency + Worker Postures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Frequency by Shift */}
        <div className="rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-mine-cyan" />
              <h3 className="text-sm font-bold font-mono text-white">
                ALERT INCIDENCE FREQUENCY BY MINING SHIFT
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Past 24 Hours</span>
          </div>

          <div className="space-y-4 pt-2">
            {shiftAlertData.map((item, idx) => (
              <div key={idx} className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{item.shift}</span>
                  <span className="text-white font-bold">{item.count} Incidents</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                  <div 
                    style={{ width: `${(item.count / 6) * 100}%` }}
                    className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Shift 2 exhibits peak gas variance during explosive blasting and mechanical cutting operations.
          </div>
        </div>

        {/* Worker Posture & Activity Segmentation */}
        <div className="rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-mine-cyan" />
              <h3 className="text-sm font-bold font-mono text-white">
                WORKER MOBILITY & POSTURE CLASSIFICATION
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">24 Tracked</span>
          </div>

          <div className="space-y-4 pt-2">
            {postureData.map((pos, idx) => (
              <div key={idx} className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pos.color }} />
                    {pos.name}
                  </span>
                  <span className="text-white font-bold">{pos.count} Personnel</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                  <div 
                    style={{ width: `${(pos.count / 24) * 100}%`, backgroundColor: pos.color }}
                    className="h-full rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Postural state derived from helmet IMU telemetry and spatial rover computer vision keypoints.
          </div>
        </div>
      </div>
    </div>
  );
};
