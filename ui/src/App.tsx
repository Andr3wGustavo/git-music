import React from 'react';
import { IPCProvider } from './context/IPCContext';
import { StudioPluginHUD } from './components/StudioPluginHUD';

const StudioAppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-2 sm:p-4 font-mono select-none">
      {/* High-End Proportional In-DAW Studio Plugin Workstation */}
      <StudioPluginHUD />
    </div>
  );
};

export function App() {
  return (
    <IPCProvider>
      <StudioAppContent />
    </IPCProvider>
  );
}

export default App;
