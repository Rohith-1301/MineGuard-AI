import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Eye, 
  EyeOff, 
  Sun, 
  Settings, 
  Radio, 
  Battery, 
  Gauge, 
  Wifi, 
  Play, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Droplets, 
  ShieldCheck, 
  Compass,
  Cpu,
  Globe,
  Sparkles
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { SyntheticCameraFeed, EnhanceProfile, normalizeCameraStreamUrl } from './SyntheticCameraFeed';
import { StatusIndicator } from '../common/StatusIndicator';
import { MetricCard } from '../common/MetricCard';

export const RoverLive: React.FC = () => {
  const { 
    rover, 
    sensors, 
    aiDetection, 
    setIsStreamSettingsOpen,
    updateStreamConfig,
    hardwareSensorConnected,
    sensorEndpointUrl,
    cvDebugMode,
    setCvDebugMode
  } = useMine();

  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [thermalFilter, setThermalFilter] = useState<boolean>(false);
  const [aiEnhance, setAiEnhance] = useState<boolean>(true);
  const [enhanceProfile, setEnhanceProfile] = useState<EnhanceProfile>('superres');
  const [inputUrl, setInputUrl] = useState<string>(rover.streamUrl);

  useEffect(() => {
    setInputUrl(rover.streamUrl);
  }, [rover.streamUrl]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mine-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-mine-cyan" />
            <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
              ROVER LIVE DASHBOARD
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-mine-cyan">
              RESCUE UNIT #01
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time video feed, onboard atmospheric telemetry, AI worker computer vision & rescue monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusIndicator status={rover.status === 'ONLINE' ? 'ONLINE' : 'WARNING'} label={`ROVER ${rover.status}`} />
          <button
            onClick={() => setIsStreamSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500 text-xs font-mono transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-mine-cyan" />
            <span>Stream Config</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Video Feed + Right Rover Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Video Stream & AI Bounding Boxes (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl bg-mine-card border border-mine-border p-4 shadow-xl">
            {/* Video Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  ROVER LIVE STREAM
                </span>

                {/* Quick Source Switcher Tabs */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700 text-xs font-mono">
                  <button
                    onClick={() => updateStreamConfig(rover.streamUrl, 'mjpeg')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                      rover.streamSource === 'mjpeg'
                        ? 'bg-cyan-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Live ESP32-CAM Rover Stream (192.168.43.84)"
                  >
                    <Radio className="w-3 h-3" />
                    <span>Rover Cam</span>
                  </button>

                  <button
                    onClick={() => updateStreamConfig(rover.streamUrl, 'webcam')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                      rover.streamSource === 'webcam'
                        ? 'bg-emerald-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Live Laptop WebCam for testing AI Human & Activity Detection"
                  >
                    <Video className="w-3 h-3" />
                    <span>Laptop WebCam</span>
                  </button>

                  <button
                    onClick={() => updateStreamConfig(rover.streamUrl, 'synthetic')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                      rover.streamSource === 'synthetic'
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Simulation Feed"
                  >
                    <Play className="w-3 h-3" />
                    <span>Simulation</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* AI Video Enhance Toggle Button */}
                <button
                  onClick={() => setAiEnhance(!aiEnhance)}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition-all ${
                    aiEnhance
                      ? 'bg-cyan-500/20 text-mine-cyan border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                  }`}
                  title="Toggle Real-Time AI Video Enhancement"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiEnhance ? 'text-mine-cyan animate-pulse' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline font-bold">AI Enhance:</span>
                  <span className="font-bold">{aiEnhance ? 'ON' : 'OFF'}</span>
                </button>

                {/* AI Enhancement Profile Selector */}
                {aiEnhance && (
                  <select
                    value={enhanceProfile}
                    onChange={(e) => setEnhanceProfile(e.target.value as EnhanceProfile)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-400 cursor-pointer hidden md:block"
                    title="Select AI Video Enhancement Mode"
                  >
                    <option value="superres">✨ Profile: AI Super-Resolution (2X HD)</option>
                    <option value="balanced">Profile: Balanced (Clarity)</option>
                    <option value="lowlight">Profile: Low-Light Boost</option>
                    <option value="sharp">Profile: Detail Sharpness</option>
                  </select>
                )}

                {/* Toggle Bounding Boxes */}
                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 border transition-colors ${
                    showBoundingBoxes
                      ? 'bg-cyan-500/20 text-mine-cyan border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                  title="Toggle AI Worker Bounding Boxes"
                >
                  {showBoundingBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">AI Bounding Boxes</span>
                </button>

                {/* Thermal / Night Vision Filter */}
                <button
                  onClick={() => setThermalFilter(!thermalFilter)}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 border transition-colors ${
                    thermalFilter
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                  title="Toggle FLIR Thermal Night-Vision Shader"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thermal Mode</span>
                </button>

                {/* CV Debug Mode Toggle */}
                <button
                  onClick={() => setCvDebugMode(!cvDebugMode)}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 border transition-colors ${
                    cvDebugMode
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                  title="Toggle Computer Vision Debug Metrics & Keypoint Skeletons"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Debug CV</span>
                </button>
              </div>
            </div>

            {/* Quick Stream Mode Switcher & URL Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 mb-3 text-xs font-mono">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => {
                    setAiEnhance(true);
                    updateStreamConfig(inputUrl, 'mjpeg');
                  }}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    rover.streamSource === 'mjpeg'
                      ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>IP Stream</span>
                </button>

                <button
                  onClick={() => {
                    setAiEnhance(true);
                    updateStreamConfig(inputUrl, 'iframe');
                  }}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    rover.streamSource === 'iframe'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span>iFrame View</span>
                </button>

                <button
                  onClick={() => {
                    setAiEnhance(true);
                    updateStreamConfig(inputUrl, 'synthetic');
                  }}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                    rover.streamSource === 'synthetic'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Simulation</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="http://10.234.213.153/"
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[11px] w-44 sm:w-52 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => {
                    setAiEnhance(true);
                    const targetMode = rover.streamSource === 'webcam' ? 'mjpeg' : rover.streamSource;
                    const resolved = targetMode === 'mjpeg' ? normalizeCameraStreamUrl(inputUrl) : inputUrl;
                    updateStreamConfig(resolved, targetMode);
                  }}
                  className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 font-bold text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.25)] transition-all"
                  title="Start Live Stream with automatic AI video enhancement"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Stream</span>
                </button>
              </div>
            </div>

            {/* Video Player Canvas / Feed */}
            <SyntheticCameraFeed
              showBoundingBoxes={showBoundingBoxes}
              thermalFilter={thermalFilter}
              aiEnhance={aiEnhance}
              enhanceProfile={enhanceProfile}
              onToggleAiEnhance={() => setAiEnhance(!aiEnhance)}
              onSelectProfile={(p) => setEnhanceProfile(p)}
            />

            {/* Compact AI HUMAN ACTIVITY Panel (Directly Below Live Video) */}
            <div className="mt-3.5 rounded-lg bg-slate-950/70 border border-slate-800 p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-mine-cyan" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    AI HUMAN ACTIVITY
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {cvDebugMode && (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/40">
                      CV DEBUG • {aiDetection.fps || 24} FPS • {aiDetection.inferenceTimeMs || 10}ms
                    </span>
                  )}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                    aiDetection.possibleFallDetected
                      ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                      : aiDetection.personDetected
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}>
                    {aiDetection.possibleFallDetected
                      ? '⚠ EMERGENCY'
                      : aiDetection.personDetected
                      ? `${aiDetection.workerCount} PERSON DETECTED`
                      : 'MONITORING'}
                  </span>
                </div>
              </div>

              {/* Conditional Human Activity Card */}
              {!aiDetection.personDetected || aiDetection.workers.length === 0 ? (
                <div className="py-2.5 px-3 rounded bg-slate-900/50 border border-slate-800/60 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="font-semibold">No person detected</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Monitoring tunnel corridor...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {aiDetection.workers.map(worker => {
                    const isFall = worker.activity === 'FALL DOWN' || worker.activity === 'FALL DETECTED' || worker.possibleFall;
                    const isNoActive = worker.activity === 'NO ACTIVE';
                    const tag = worker.trackingId || worker.label.split(' ')[0] || 'PERSON 1';
                    return (
                      <div
                        key={worker.id}
                        className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                          isFall
                            ? 'bg-red-950/40 border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                            : isNoActive
                            ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              isFall ? 'bg-red-500 animate-pulse' : isNoActive ? 'bg-amber-400' : 'bg-cyan-400'
                            }`} />
                            {tag}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isFall
                              ? 'bg-red-500/30 text-red-300 border-red-500/50 animate-pulse'
                              : isNoActive
                              ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {isFall ? '⚠ FALL DOWN' : isNoActive ? '⚠ NO ACTIVE' : 'NORMAL'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Activity</span>
                            <span className={`font-bold ${isFall ? 'text-red-400 tracking-wide' : isNoActive ? 'text-amber-400' : 'text-white'}`}>
                              {worker.activity || worker.movement}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Confidence</span>
                            <span className="text-cyan-400 font-bold">{worker.confidence}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Movement</span>
                            <span className={`font-semibold ${isFall ? 'text-red-300' : isNoActive ? 'text-amber-300' : 'text-slate-300'}`}>
                              {isFall ? 'HIGH' : isNoActive ? 'NONE' : worker.movement === 'WALKING' ? 'NORMAL' : 'LOW'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9px] uppercase">Status</span>
                            <span className={`font-semibold ${isFall ? 'text-red-400' : isNoActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {isFall ? '⚠ FALL DOWN' : isNoActive ? '⚠ NO ACTIVE' : 'NORMAL'}
                            </span>
                          </div>
                        </div>

                        {cvDebugMode && (
                          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex flex-wrap gap-2">
                            <span>Angle: <strong className="text-cyan-300">{worker.bodyAngle ?? 0}°</strong></span>
                            <span>Aspect: <strong className="text-cyan-300">{worker.aspectRatio ?? 0}</strong></span>
                            <span>State: <strong className="text-white">{worker.temporalFallState ?? 'UPRIGHT'}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-Video Telemetry Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Location</span>
                <span className="text-white font-bold">{rover.location}</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Battery</span>
                <span className="text-emerald-400 font-bold">{rover.battery}% (25.2V)</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Speed</span>
                <span className="text-white font-bold">{rover.speed} m/s</span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Wi-Fi Link</span>
                <span className="text-cyan-400 font-bold">{rover.wifiRssi} dBm ({rover.latencyMs}ms)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rover Sensors Suite (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="rounded-xl bg-mine-card border border-mine-border p-4 shadow-lg space-y-3 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-mine-cyan" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    ROVER SENSOR SUITE
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border font-semibold flex items-center gap-1.5 ${
                    hardwareSensorConnected 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hardwareSensorConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400 animate-ping'}`} />
                    {hardwareSensorConnected 
                      ? `ESP32 LIVE (${sensorEndpointUrl.replace(/^https?:\/\//, '').split(/[:/]/)[0]})` 
                      : `POLLING: ${sensorEndpointUrl.replace(/^https?:\/\//, '').split(/[:/]/)[0]}`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {sensors.methane.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 mt-3">
                {/* CH4 (MQ-2) */}
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span>METHANE / SMOKE — CH₄</span>
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60">MQ-2</span>
                      {sensors.mq2Raw !== undefined && (
                        <span className="text-[9px] font-mono text-cyan-300 bg-slate-800/80 px-1 py-0.2 rounded">
                          {sensors.mq2Raw}% signal
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold font-mono text-white">
                      <span key={String(sensors.methane.value)} className="reading-smooth-change inline-block">
                        {sensors.methane.value}
                      </span> <span className="text-xs font-normal text-slate-400">%</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">Normal: &lt;1.0%</div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    sensors.methane.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {sensors.methane.status}
                  </span>
                </div>

                {/* CO (MQ-7) */}
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span>CARBON MONOXIDE — CO</span>
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">MQ-7</span>
                      {sensors.mq7Raw !== undefined && (
                        <span className="text-[9px] font-mono text-cyan-300 bg-slate-800/80 px-1 py-0.2 rounded">
                          {sensors.mq7Raw}% signal
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold font-mono text-white">
                      <span key={String(sensors.carbonMonoxide.value)} className="reading-smooth-change inline-block">
                        {sensors.carbonMonoxide.value}
                      </span> <span className="text-xs font-normal text-slate-400">ppm</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">Normal: &lt;25 ppm</div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    sensors.carbonMonoxide.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {sensors.carbonMonoxide.status}
                  </span>
                </div>

                {/* CO2 (MQ-135) */}
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span>AIR QUALITY / CO₂</span>
                      <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-700/60">MQ-135</span>
                      {sensors.mq135Raw !== undefined && (
                        <span className="text-[9px] font-mono text-cyan-300 bg-slate-800/80 px-1 py-0.2 rounded">
                          {sensors.mq135Raw}% signal
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold font-mono text-white">
                      <span key={String(sensors.carbonDioxide?.value ?? 850)} className="reading-smooth-change inline-block">
                        {sensors.carbonDioxide?.value ?? 850}
                      </span> <span className="text-xs font-normal text-slate-400">ppm</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">Normal: &lt;1000 ppm</div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    (sensors.carbonDioxide?.status ?? 'NORMAL') === 'CRITICAL' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                      : (sensors.carbonDioxide?.status ?? 'NORMAL') === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {sensors.carbonDioxide?.status ?? 'NORMAL'}
                  </span>
                </div>

                {/* Temperature */}
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">TEMPERATURE</div>
                    <div className="text-lg font-bold font-mono text-white">
                      <span key={String(sensors.temperature.value)} className="reading-smooth-change inline-block">
                        {sensors.temperature.value}
                      </span> <span className="text-xs font-normal text-slate-400">°C</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">Normal: &lt;34 °C</div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    sensors.temperature.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {sensors.temperature.status}
                  </span>
                </div>

                {/* Obstacle Distance */}
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">DISTANCE / OBSTACLE</div>
                    <div className="text-lg font-bold font-mono text-white">
                      <span key={String(sensors.distance.value)} className="reading-smooth-change inline-block">
                        {sensors.distance.value}
                      </span> <span className="text-xs font-normal text-slate-400">cm</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">ToF LiDAR Clear: &gt;50 cm</div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    sensors.distance.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {sensors.distance.status}
                  </span>
                </div>

                {/* Water Detection */}
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">WATER INGRESS</div>
                    <div className="text-sm font-bold font-mono text-white flex items-center gap-1.5 mt-0.5">
                      <Droplets className={`w-4 h-4 ${sensors.waterDetected ? 'text-red-400' : 'text-slate-400'}`} />
                      {sensors.waterDetected ? 'DETECTED / FLOOD' : 'NOT DETECTED'}
                    </div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border font-bold ${
                    sensors.waterDetected ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {sensors.waterDetected ? 'HAZARD' : 'CLEAR'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Hardware Packet Details */}
            {(sensors.mq7Raw !== undefined || sensors.mq135Raw !== undefined || sensors.mq1Raw !== undefined || sensors.mq2Raw !== undefined || sensors.hardwareRiskLevel) && (
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2 mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-cyan-400 font-bold">MQ TELEMETRY:</span>
                  <span>MQ-7 (CO): <strong className="text-cyan-300">{sensors.mq7Raw ?? sensors.carbonMonoxide.value}</strong></span>
                  <span>MQ-135 (CO₂): <strong className="text-purple-300">{sensors.mq135Raw ?? sensors.carbonDioxide?.value ?? '850'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  {sensors.hardwareRiskLevel && (
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      sensors.hardwareRiskLevel === 'DANGER' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {sensors.hardwareRiskLevel}
                    </span>
                  )}
                  {sensors.hardwareRoverState && (
                    <span className="text-slate-400">STATE: <strong className="text-cyan-300">{sensors.hardwareRoverState}</strong></span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Section: AI Computer Vision & Movement Analysis Panels (Full Width 2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. AI Worker Detection Panel */}
        <div className="rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
              <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                AI WORKER DETECTION
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-mine-cyan border border-cyan-500/30 font-bold">
              YOLOv8-MineWorker
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">
              WORKERS DETECTED IN VIDEO:
            </span>
            <span className="text-2xl font-extrabold font-mono text-cyan-400">
              {aiDetection.workerCount}
            </span>
          </div>

          <div className="space-y-2.5">
            {aiDetection.workers.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/60 text-center text-xs font-mono text-slate-400">
                <span className="block text-slate-300 font-semibold mb-1">Tunnel Corridor Clear</span>
                <span>No human personnel detected in active video feed. Real-time vision scanning...</span>
              </div>
            ) : (
              aiDetection.workers.map((worker) => (
                <div
                  key={worker.id}
                  className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">👤</span>
                    <div>
                      <span className="text-white font-medium block">{worker.label}</span>
                      <span className="text-[10px] text-slate-500">ID: {worker.id} • Optical Recognition</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="text-cyan-400 font-bold text-sm">{worker.confidence}%</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-400 leading-tight">
            <strong>Standard Safety Terminology:</strong> Visible Workers detected via spatial computer vision. Physiological vitals tracked independently.
          </div>
        </div>

        {/* 6. AI Movement Analysis Panel */}
        <div className="rounded-xl bg-mine-card border border-mine-border p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                AI MOVEMENT ANALYSIS
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
              PoseFall-v2
            </span>
          </div>

          {/* Warning Banner if Fall detected */}
          {aiDetection.possibleFallDetected ? (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/60 text-red-200 text-xs font-mono flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="font-bold text-sm block">⚠ POSSIBLE WORKER FALL DETECTED</span>
                <div className="text-[10px] text-red-300">Needs Verification • Human Confirmation & Rescue Dispatch Protocol Active</div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{aiDetection.personDetected ? 'Active personnel upright and clear of immobility posture.' : 'No personnel present. Continuous pose analysis standing by.'}</span>
            </div>
          )}

          {/* Worker Movements List */}
          <div className="space-y-2.5">
            {aiDetection.workers.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800/60 text-center text-xs font-mono text-slate-400">
                <span className="block text-slate-300 font-semibold mb-1">Continuous Pose Surveillance Active</span>
                <span>Awaiting human presence in camera feed to compute posture keypoints.</span>
              </div>
            ) : (
              aiDetection.workers.map((worker) => {
                const isFall = worker.activity === 'FALL DETECTED' || worker.possibleFall || worker.movement === 'POSSIBLE_FALL';
                return (
                  <div
                    key={worker.id}
                    className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                      isFall
                        ? 'bg-red-950/30 border-red-500/50'
                        : 'bg-slate-900/50 border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">{worker.label}</div>
                      <div className={`text-[11px] font-bold mt-0.5 ${isFall ? 'text-red-400' : 'text-slate-400'}`}>
                        Activity: {worker.activity || worker.movement.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        isFall
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {worker.movementConfidence}% Conf
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
