import React from 'react';
import { 
  X, 
  User, 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  Battery, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Droplets,
  MapPin,
  Clock
} from 'lucide-react';
import { Worker } from '../../types';

interface WorkerProfileModalProps {
  worker: Worker | null;
  onClose: () => void;
  onLocateOnMap: (zoneId: string) => void;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  worker,
  onClose,
  onLocateOnMap
}) => {
  if (!worker) return null;

  const isCritical = worker.status === 'CRITICAL' || worker.movement === 'POSSIBLE_FALL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isCritical ? 'bg-red-950/40 border-red-500/40' : 'bg-[#0d1422] border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm font-mono border ${
              isCritical ? 'bg-red-600/30 text-red-300 border-red-500' : 'bg-cyan-500/20 text-mine-cyan border-cyan-500/40'
            }`}>
              {worker.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-white">
                  {worker.name}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  worker.status === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : worker.status === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}>
                  {worker.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{worker.role}</span>
                <span>•</span>
                <span>Last beacon: {worker.lastUpdate}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs font-mono max-h-[80vh] overflow-y-auto">
          {/* Location & Movement Status Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Indoor Location (IPS)</span>
              <div className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{worker.location}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Movement State</span>
              <div className={`font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                {worker.movement.replace('_', ' ')} ({worker.movementConfidence}%)
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block mb-1">Smart Helmet Battery</span>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Battery className="w-3.5 h-3.5 text-cyan-400" />
                <span>{worker.battery}%</span>
              </div>
            </div>
          </div>

          {/* Environmental Exposure Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <span>LOCAL TUNNEL ATMOSPHERIC EXPOSURE</span>
              <span className="text-slate-500 font-normal">Surrounding Air Readings</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500">CH₄ (Methane)</div>
                <div className={`text-sm font-bold mt-0.5 ${worker.environmentalExposure.methane > 1.25 ? 'text-red-400' : 'text-white'}`}>
                  {worker.environmentalExposure.methane}%
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500">CO (Carbon Monoxide)</div>
                <div className={`text-sm font-bold mt-0.5 ${worker.environmentalExposure.co > 30 ? 'text-amber-400' : 'text-white'}`}>
                  {worker.environmentalExposure.co} ppm
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500">Ambient O₂</div>
                <div className={`text-sm font-bold mt-0.5 ${worker.environmentalExposure.o2 < 19.5 ? 'text-red-400' : 'text-white'}`}>
                  {worker.environmentalExposure.o2}%
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500">Dry Temp</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {worker.environmentalExposure.temp}°C
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500">Humidity</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {worker.environmentalExposure.humidity}%
                </div>
              </div>
            </div>
          </div>

          {/* Wearable Vitals Section (with physiological distinction note) */}
          {worker.vitals && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    WEARABLE TELEMETRY (SMART BAND / BELT)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">
                  BLE Mesh Link: Active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Heart Rate</div>
                  <div className="text-lg font-bold text-pink-400 mt-0.5">
                    {worker.vitals.heartRate} <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Blood SpO₂</div>
                  <div className={`text-lg font-bold mt-0.5 ${worker.vitals.spO2 < 92 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {worker.vitals.spO2} <span className="text-[10px] text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Body Core Temp</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {worker.vitals.bodyTemperature} <span className="text-[10px] text-slate-400">°C</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Emergency SOS</div>
                  <div className={`text-sm font-bold mt-1 ${worker.vitals.sosTriggered ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                    {worker.vitals.sosTriggered ? 'TRIGGERED' : 'NORMAL'}
                  </div>
                </div>
              </div>

              {/* Distinction Advisory */}
              <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-500/20 text-[10px] text-slate-400 leading-relaxed">
                <strong className="text-mine-cyan">Physiological Distinction:</strong> Ambient Environmental O₂ ({worker.environmentalExposure.o2}%) measures mine shaft air quality, while Wearable SpO₂ ({worker.vitals.spO2}%) measures pulse-oximetric blood hemoglobin saturation.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d1422] border-t border-slate-800">
          <button
            onClick={() => onLocateOnMap(worker.zoneId)}
            className="px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-mine-cyan border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Locate on Mine Map</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
