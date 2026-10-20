import React, { useState, useEffect } from 'react';
import { 
  Wind, 
  Droplets, 
  Thermometer, 
  Activity, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Flame, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { MetricCard } from '../common/MetricCard';
import { StatusIndicator } from '../common/StatusIndicator';
import { TelemetryTrendChart, TelemetryMetricKey, TimeRangeKey } from './TelemetryTrendChart';

export const EnvironmentDashboard: React.FC = () => {
  const { 
    sensors, 
    tunnels, 
    hardwareSensorConnected, 
    setIsStreamSettingsOpen 
  } = useMine();
  const [activeRange, setActiveRange] = useState<TimeRangeKey>('5m');
  const [selectedSensorChart, setSelectedSensorChart] = useState<TelemetryMetricKey>('humidity');

  const gasVal = sensors.gasSensor?.value ?? 13.6;
  const gasUnit = sensors.gasSensor?.unit ?? '%';
  const airVal = sensors.airQuality?.value ?? 32.6;
  const airUnit = sensors.airQuality?.unit ?? '%';
  const coVal = sensors.carbonMonoxide.value;
  const coUnit = sensors.carbonMonoxide.unit || '%';

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mine-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-mine-cyan" />
            <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
              MINE ENVIRONMENT DASHBOARD
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-mine-cyan">
              PRIMARY ATMOSPHERIC MONITORING
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time multi-sensor telemetry for Humidity, Temperature, Gas Sensor (MQ-2), CO (MQ-7), and Air Quality (MQ-135)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hardware WiFi Connection Indicator (Clickable to change/configure IP) */}
          <button
            type="button"
            onClick={() => setIsStreamSettingsOpen(true)}
            title="Click to configure Hardware Sensor IP address"
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer hover:brightness-110 active:scale-95 ${
              hardwareSensorConnected 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${hardwareSensorConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            {hardwareSensorConnected 
              ? 'LIVE WIFI: 10.234.213.174' 
              : 'CONNECTING WIFI: 10.234.213.174'}
          </button>
          <StatusIndicator status={hardwareSensorConnected ? 'LIVE' : 'ONLINE'} label={hardwareSensorConnected ? 'STREAMING' : '8s CYCLE'} />
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Sample Rate: 8s
          </span>
        </div>
      </div>

      {/* 5 Main Environmental Sensor Tabs / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* CARD 1: Humidity */}
        <MetricCard
          title="HUMIDITY"
          value={sensors.humidity.value}
          unit="%"
          description="Atmospheric Moisture"
          status={sensors.humidity.status}
          trend={sensors.humidity.trend}
          trendUnit="%"
          lastUpdated={sensors.humidity.lastUpdated}
          icon={<Droplets className="w-4 h-4 text-cyan-400" />}
          thresholdNote="Warning: > 80% • Critical: > 90%"
          onClick={() => setSelectedSensorChart('humidity')}
          className={selectedSensorChart === 'humidity' ? 'ring-2 ring-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : ''}
          badge={hardwareSensorConnected ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold">
              LIVE
            </span>
          ) : undefined}
        />

        {/* CARD 2: Temperature */}
        <MetricCard
          title="TEMPERATURE"
          value={sensors.temperature.value}
          unit="°C"
          description="Dry Bulb Ambient"
          status={sensors.temperature.status}
          trend={sensors.temperature.trend}
          trendUnit="°C"
          lastUpdated={sensors.temperature.lastUpdated}
          icon={<Thermometer className="w-4 h-4 text-pink-400" />}
          thresholdNote="Warning: > 35 °C • Critical: > 38 °C"
          onClick={() => setSelectedSensorChart('temp')}
          className={selectedSensorChart === 'temp' ? 'ring-2 ring-pink-400/80 shadow-[0_0_15px_rgba(244,63,94,0.25)]' : ''}
          badge={hardwareSensorConnected ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-700/60 font-bold">
              LIVE
            </span>
          ) : undefined}
        />

        {/* CARD 3: Gas Sensor */}
        <MetricCard
          title="GAS SENSOR"
          value={gasVal}
          unit={gasUnit}
          description="MQ-2 LPG / Smoke"
          status={sensors.gasSensor?.status ?? 'NORMAL'}
          trend={sensors.gasSensor?.trend ?? 0}
          trendUnit={gasUnit}
          lastUpdated={sensors.gasSensor?.lastUpdated ?? 'Just now'}
          icon={<Flame className="w-4 h-4 text-amber-400" />}
          thresholdNote={gasUnit === '%' ? 'Safe: < 20% • Warning: > 25% • Crit: > 40%' : 'Warning: > 600 • Crit: > 1000'}
          onClick={() => setSelectedSensorChart('gas')}
          className={selectedSensorChart === 'gas' ? 'ring-2 ring-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]' : ''}
          badge={hardwareSensorConnected ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-bold">
              MQ-2 LIVE
            </span>
          ) : (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
              MQ-2
            </span>
          )}
        />

        {/* CARD 4: CO */}
        <MetricCard
          title="CO"
          value={coVal}
          unit={coUnit}
          description="MQ-7 Carbon Monoxide"
          status={sensors.carbonMonoxide.status}
          trend={sensors.carbonMonoxide.trend}
          trendUnit={coUnit}
          lastUpdated={sensors.carbonMonoxide.lastUpdated}
          icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />}
          thresholdNote={coUnit === '%' ? 'Safe: < 5% • Warning: > 5% • Crit: > 10%' : 'Warning: > 25 ppm • Crit: > 50 ppm'}
          onClick={() => setSelectedSensorChart('co')}
          className={selectedSensorChart === 'co' ? 'ring-2 ring-yellow-400/80 shadow-[0_0_15px_rgba(234,179,8,0.25)]' : ''}
          badge={hardwareSensorConnected ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-700/60 font-bold">
              MQ-7 LIVE
            </span>
          ) : (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
              MQ-7
            </span>
          )}
        />

        {/* CARD 5: Air Quality */}
        <MetricCard
          title="AIR QUALITY"
          value={airVal}
          unit={airUnit}
          description="MQ-135 Gas Purity"
          status={sensors.airQuality?.status ?? 'NORMAL'}
          trend={sensors.airQuality?.trend ?? 0}
          trendUnit={airUnit}
          lastUpdated={sensors.airQuality?.lastUpdated ?? 'Just now'}
          icon={<Wind className="w-4 h-4 text-emerald-400" />}
          thresholdNote={airUnit === '%' ? 'Safe: < 25% • Moderate: > 25% • Crit: > 50%' : 'Warning: > 150 AQI • Crit: > 250 AQI'}
          onClick={() => setSelectedSensorChart('air_quality')}
          className={selectedSensorChart === 'air_quality' ? 'ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : ''}
          badge={hardwareSensorConnected ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
              MQ-135 LIVE
            </span>
          ) : (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
              MQ-135
            </span>
          )}
        />
      </div>

      {/* 11. Environmental Sensor Charts with Threshold Lines */}
      <TelemetryTrendChart
        selectedMetric={selectedSensorChart}
        onSelectMetric={setSelectedSensorChart}
        timeRange={activeRange}
        onSelectTimeRange={setActiveRange}
      />

      {/* Multi-Sector Environmental Comparison Table */}
      <div className="rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-mine-cyan" />
            <h3 className="text-sm font-bold font-mono text-white tracking-wide">
              UNDERGROUND MINE SECTOR ATMOSPHERIC MATRIX
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {tunnels.length} Monitoring Nodes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Sector / Tunnel Node</th>
                <th className="p-3">Zone Type</th>
                <th className="p-3">CH₄ (%)</th>
                <th className="p-3">CO (ppm)</th>
                <th className="p-3">O₂ (%)</th>
                <th className="p-3">Temp (°C)</th>
                <th className="p-3">Airflow</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tunnels.map(tunnel => (
                <tr 
                  key={tunnel.id}
                  className={`hover:bg-slate-900/40 transition-colors ${
                    tunnel.status === 'CRITICAL' ? 'bg-red-950/20' : tunnel.status === 'WARNING' ? 'bg-amber-950/10' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      tunnel.status === 'CRITICAL' ? 'bg-red-500' : tunnel.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {tunnel.name}
                  </td>
                  <td className="p-3 text-slate-400 uppercase text-[11px]">{tunnel.type}</td>
                  <td className={`p-3 font-bold ${tunnel.methane > 1.25 ? 'text-red-400' : 'text-slate-200'}`}>
                    {tunnel.methane}%
                  </td>
                  <td className={`p-3 font-bold ${tunnel.co > 25 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {tunnel.co} ppm
                  </td>
                  <td className={`p-3 font-bold ${tunnel.o2 < 19.5 ? 'text-red-400' : 'text-slate-200'}`}>
                    {tunnel.o2}%
                  </td>
                  <td className="p-3 text-slate-200">{tunnel.temp}°C</td>
                  <td className="p-3 text-slate-400">
                    {tunnel.airflowVelocity} m/s ({tunnel.airflowDirection})
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      tunnel.status === 'CRITICAL' 
                        ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                        : tunnel.status === 'WARNING' 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {tunnel.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
