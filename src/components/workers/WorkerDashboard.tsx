import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  MapPin, 
  ShieldAlert, 
  Battery, 
  ChevronRight, 
  Activity, 
  Compass, 
  Clock,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { useMine } from '../../context/MineContext';
import { Worker } from '../../types';
import { WorkerProfileModal } from './WorkerProfileModal';

export const WorkerDashboard: React.FC = () => {
  const { 
    workers, 
    workerHistory, 
    selectedWorker, 
    setSelectedWorker, 
    setActiveTab, 
    setSelectedTunnel,
    tunnels 
  } = useMine();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'history'>('roster');

  // Filtered workers list
  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleLocateOnMap = (zoneId: string) => {
    const tunnel = tunnels.find(t => t.id === zoneId);
    if (tunnel) {
      setSelectedTunnel(tunnel);
    }
    setActiveTab('map');
  };

  // CSV Export Functionality (Section 15)
  const handleExportCSV = () => {
    const headers = ['Record ID', 'Worker ID', 'Worker Name', 'Timestamp', 'Location', 'Movement', 'CH4 (%)', 'CO (ppm)', 'O2 (%)', 'Temp (C)', 'Risk Level', 'Events'];
    const rows = workerHistory.map(entry => [
      entry.id,
      entry.workerId,
      `"${entry.workerName}"`,
      entry.timestamp,
      `"${entry.location}"`,
      entry.movement,
      entry.methane,
      entry.co,
      entry.o2,
      entry.temperature,
      entry.riskLevel,
      `"${entry.events}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MineGuard_Worker_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mine-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-mine-cyan" />
            <h2 className="text-xl font-extrabold font-mono text-white tracking-wide">
              WORKER MONITORING & LOCATION DASHBOARD
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-mine-cyan">
              24 REGISTERED PERSONNEL
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Indoor positioning (IPS UWB/BLE), posture movement telemetry, and localized atmospheric exposure
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtab toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('roster')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'roster'
                  ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Roster ({workers.length})
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'history'
                  ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Shift History</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow transition-colors"
            title="Download CSV report of worker movement and gas exposures"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Indoor Positioning System (IPS) Summary Card */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-mine-cyan">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              <span>UNDERGROUND INDOOR POSITIONING SYSTEM (IPS)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                UWB / BLE BEACON
              </span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Subterranean localization enabled without satellite dependency • Tracking 24 miners across 6 drift sectors
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          <div>Tunnel A: <span className="text-cyan-400 font-bold">4</span></div>
          <div>Tunnel B: <span className="text-amber-400 font-bold">3</span></div>
          <div>Tunnel C: <span className="text-cyan-400 font-bold">2</span></div>
          <div>Main Adit: <span className="text-emerald-400 font-bold">15</span></div>
        </div>
      </div>

      {/* Roster View */}
      {activeSubTab === 'roster' && (
        <div className="rounded-xl bg-mine-card border border-mine-border shadow-xl overflow-hidden space-y-4 p-5">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search worker ID, name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-mine-cyan"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-mono">
              <span className="text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {(['ALL', 'ACTIVE', 'WARNING', 'CRITICAL'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-mine-cyan border border-cyan-500/30 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 12. Worker Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Worker ID</th>
                  <th className="p-3">Name & Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Indoor Location</th>
                  <th className="p-3">Last Update</th>
                  <th className="p-3">Movement State</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Helmet Battery</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWorkers.map(w => {
                  const isCrit = w.status === 'CRITICAL' || w.movement === 'POSSIBLE_FALL';
                  return (
                    <tr
                      key={w.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        isCrit ? 'bg-red-950/20' : w.status === 'WARNING' ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="p-3 font-bold text-mine-cyan">
                        {w.id}
                      </td>

                      {/* Name & Role */}
                      <td className="p-3">
                        <div className="font-bold text-white">{w.name}</div>
                        <div className="text-[10px] text-slate-400">{w.role}</div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          w.status === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                            : w.status === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {w.status}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-3 text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{w.location}</span>
                      </td>

                      {/* Last Update */}
                      <td className="p-3 text-slate-400">
                        {w.lastUpdate}
                      </td>

                      {/* Movement */}
                      <td className="p-3">
                        <span className={`font-semibold ${isCrit ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                          {w.movement.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] text-slate-500">{w.movementConfidence}% Conf</div>
                      </td>

                      {/* Risk Level */}
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          w.riskLevel === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : w.riskLevel === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                            : w.riskLevel === 'MODERATE'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {w.riskLevel}
                        </span>
                      </td>

                      {/* Battery */}
                      <td className="p-3 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Battery className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{w.battery}%</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedWorker(w)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 15. Historical Data View */}
      {activeSubTab === 'history' && (
        <div className="rounded-xl bg-mine-card border border-mine-border shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-mono text-white">
                HISTORICAL WORKER EXPOSURE & EVENT LOGS
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {workerHistory.length} Recorded Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Worker ID</th>
                  <th className="p-3">Worker Name</th>
                  <th className="p-3">Indoor Location</th>
                  <th className="p-3">Movement</th>
                  <th className="p-3">CH₄</th>
                  <th className="p-3">CO</th>
                  <th className="p-3">O₂</th>
                  <th className="p-3">Temp</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Logged Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workerHistory.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-900/40">
                    <td className="p-3 text-slate-400">{entry.timestamp}</td>
                    <td className="p-3 font-bold text-cyan-400">{entry.workerId}</td>
                    <td className="p-3 text-white font-medium">{entry.workerName}</td>
                    <td className="p-3 text-slate-300">{entry.location}</td>
                    <td className="p-3 text-slate-300">{entry.movement}</td>
                    <td className="p-3 text-slate-300">{entry.methane}%</td>
                    <td className="p-3 text-slate-300">{entry.co} ppm</td>
                    <td className="p-3 text-slate-300">{entry.o2}%</td>
                    <td className="p-3 text-slate-300">{entry.temperature}°C</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                        entry.riskLevel === 'CRITICAL' || entry.riskLevel === 'HIGH'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {entry.riskLevel}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{entry.events}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Worker Profile Details Modal */}
      <WorkerProfileModal
        worker={selectedWorker}
        onClose={() => setSelectedWorker(null)}
        onLocateOnMap={handleLocateOnMap}
      />
    </div>
  );
};
