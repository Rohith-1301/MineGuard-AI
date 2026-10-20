import React, { useState } from 'react';
import { X, Save, Video, RefreshCw, Volume2, Globe, Shield, CheckCircle2, Cpu, Activity } from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { normalizeCameraStreamUrl } from '../rover-live/SyntheticCameraFeed';

export const StreamSettingsModal: React.FC = () => {
  const { 
    isStreamSettingsOpen, 
    setIsStreamSettingsOpen, 
    rover, 
    updateStreamConfig,
    buzzerAudioEnabled,
    setBuzzerAudioEnabled,
    sensorEndpointUrl,
    setSensorEndpointUrl,
    hardwareSensorConnected
  } = useMine();

  const [streamUrlInput, setStreamUrlInput] = useState<string>(rover.streamUrl);
  const [streamSource, setStreamSource] = useState<'mjpeg' | 'webcam' | 'iframe' | 'synthetic' | 'fallback'>(rover.streamSource);
  const [sensorUrlInput, setSensorUrlInput] = useState<string>(sensorEndpointUrl);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isStreamSettingsOpen) return null;

  const handleSave = () => {
    const resolvedUrl = streamSource === 'mjpeg' ? normalizeCameraStreamUrl(streamUrlInput) : streamUrlInput.trim();
    updateStreamConfig(resolvedUrl, streamSource);
    setSensorEndpointUrl(sensorUrlInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsStreamSettingsOpen(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-700 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d1422]">
          <div className="flex items-center gap-2.5">
            <Video className="w-5 h-5 text-mine-cyan" />
            <h3 className="text-base font-bold font-mono text-white tracking-wide">
              Hardware & Camera Stream Settings
            </h3>
          </div>
          <button
            onClick={() => setIsStreamSettingsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs font-mono">
          {/* Rover Stream URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
              <span>ROVER_STREAM_URL</span>
              <span className="text-[10px] text-mine-cyan">ESP32-CAM / MJPEG / RTSP</span>
            </label>
            <input
              type="text"
              value={streamUrlInput}
              onChange={(e) => setStreamUrlInput(e.target.value)}
              placeholder="http://192.168.43.84/"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-mine-cyan transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Live Stream URL: <code className="text-cyan-300 font-bold">http://192.168.43.84/</code> (or <code className="text-slate-300">http://192.168.43.84:81/stream</code>).
            </p>
          </div>

          {/* Stream Display Mode */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Feed Display Source
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setStreamSource('synthetic')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  streamSource === 'synthetic'
                    ? 'bg-cyan-500/10 border-mine-cyan text-mine-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white mb-0.5">Synthetic Feed</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  High-fidelity mine tunnel simulation with AI detection
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStreamSource('mjpeg')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  streamSource === 'mjpeg'
                    ? 'bg-cyan-500/10 border-mine-cyan text-mine-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white mb-0.5">Live IP Stream</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Direct HTTP MJPEG from ESP32-CAM or IP Camera
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStreamSource('fallback')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  streamSource === 'fallback'
                    ? 'bg-cyan-500/10 border-mine-cyan text-mine-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-white mb-0.5">Offline State</div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Professional standby placeholder for hardware testing
                </div>
              </button>
            </div>
          </div>

          {/* Hardware Sensor Endpoint URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-mine-cyan" />
                <span>HARDWARE_SENSOR_DATA_ENDPOINT</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                hardwareSensorConnected 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hardwareSensorConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {hardwareSensorConnected ? 'POLLING LIVE' : 'CONNECTING / RETRYING'}
              </span>
            </label>
            <input
              type="text"
              value={sensorUrlInput}
              onChange={(e) => setSensorUrlInput(e.target.value)}
              placeholder="http://10.234.213.131/"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-mine-cyan transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Active Sensor IP: <code className="text-cyan-300 font-bold">http://10.234.213.131/</code> (Rover Sensor Suite node). Fast 1.0s telemetry polling for MQ-2, MQ-7, and MQ-135.
            </p>
          </div>

          {/* Audio Alarm Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-white font-semibold">Audible Safety Alarms</div>
                <div className="text-[10px] text-slate-400">Play web-audio buzzer on critical alerts & emergencies</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={buzzerAudioEnabled}
              onChange={(e) => setBuzzerAudioEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-mine-cyan focus:ring-mine-cyan focus:ring-offset-slate-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#0d1422]">
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Settings stored in memory</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStreamSettingsOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-mine-cyan text-slate-950 font-bold text-xs font-mono hover:bg-cyan-300 transition-colors shadow-[0_0_12px_rgba(0,240,255,0.3)]"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Apply Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
