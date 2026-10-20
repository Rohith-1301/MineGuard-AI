import React from 'react';
import { MineProvider, useMine } from './context/MineContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { StreamSettingsModal } from './components/common/StreamSettingsModal';
import { EmergencyModal } from './components/common/EmergencyModal';

// Views
import { CommandCenter } from './components/command-center/CommandCenter';
import { RoverLive } from './components/rover-live/RoverLive';
import { EnvironmentDashboard } from './components/environment/EnvironmentDashboard';
import { WorkerDashboard } from './components/workers/WorkerDashboard';
import { MineMapDashboard } from './components/map/MineMapDashboard';
import { AlertsDashboard } from './components/alerts/AlertsDashboard';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { SystemStatusDashboard } from './components/system-status/SystemStatusDashboard';

const MainContent: React.FC = () => {
  const { activeTab } = useMine();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'rover-live':
        return <RoverLive />;
      case 'environment':
        return <EnvironmentDashboard />;
      case 'workers':
        return <WorkerDashboard />;
      case 'map':
        return <MineMapDashboard />;
      case 'alerts':
        return <AlertsDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'system-status':
        return <SystemStatusDashboard />;
      case 'command-center':
      default:
        return <CommandCenter />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#0a0e17] bg-tech-grid">
      {renderActiveView()}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <MineProvider>
      <div className="min-h-screen flex flex-col bg-[#0a0e17] text-white">
        {/* Top Header */}
        <Header />

        {/* Workspace Body: Left Sidebar + Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>

        {/* Global Modals */}
        <StreamSettingsModal />
        <EmergencyModal />
      </div>
    </MineProvider>
  );
};

export default App;
