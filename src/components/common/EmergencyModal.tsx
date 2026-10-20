import React from 'react';
import { AlertOctagon, X, ShieldAlert } from 'lucide-react';
import { useMine } from '../../context/MineContext';

export const EmergencyModal: React.FC = () => {
  const { isEmergencyModalOpen, setIsEmergencyModalOpen, sendRoverCommand } = useMine();

  if (!isEmergencyModalOpen) return null;

  const handleConfirmEmergencyStop = async () => {
    await sendRoverCommand('EMERGENCY_STOP');
    setIsEmergencyModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111827] border-2 border-red-500/80 rounded-xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-950/50 border-b border-red-500/40">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-red-400 animate-bounce" />
            <h3 className="text-base font-bold font-mono text-white tracking-wide">
              EMERGENCY STOP CONFIRMATION
            </h3>
          </div>
          <button
            onClick={() => setIsEmergencyModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs font-mono">
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            You are about to execute an immediate <strong>E-STOP</strong> on <strong>MINEGUARD ROVER-01</strong>.
          </p>

          <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-500/30 space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>SAFETY INTERLOCK PROTOCOL:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
              <li>Cuts motor drive telemetry instantly to 0.0 m/s.</li>
              <li>Activates mechanical lock brakes if engaged.</li>
              <li>Logs safety override timestamp into compliance database.</li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-400">
            Confirm operator authorization to halt autonomous and remote navigation now.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#0d1422] border-t border-slate-800">
          <button
            onClick={() => setIsEmergencyModalOpen(false)}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
          >
            Cancel / Abort
          </button>
          <button
            onClick={handleConfirmEmergencyStop}
            className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 border border-red-400/50 text-white font-bold text-xs font-mono transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            CONFIRM EMERGENCY STOP
          </button>
        </div>
      </div>
    </div>
  );
};
