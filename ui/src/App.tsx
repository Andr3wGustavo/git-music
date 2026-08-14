import React, { useState } from 'react';
import { IPCProvider } from './context/IPCContext';
import { CompactPluginHUD } from './components/CompactPluginHUD';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Header } from './components/Header';
import { TransportBar } from './components/TransportBar';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { PianoRollDiff } from './components/PianoRollDiff';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { CommitTimeline } from './components/CommitTimeline';
import { StemList } from './components/StemList';
import { AudioCommentsList } from './components/AudioCommentsList';
import { CommitModal } from './components/CommitModal';
import { BranchModal } from './components/BranchModal';
import { CommentModal } from './components/CommentModal';
import { PullRequestModal } from './components/PullRequestModal';
import { SplitSheetModal } from './components/SplitSheetModal';
import { AIMixCopilot } from './components/AIMixCopilot';
import { useIPC } from './context/IPCContext';

const StudioAppContent: React.FC = () => {
  const [isExpandedMode, setIsExpandedMode] = useState(false);
  const { activeView } = useIPC();

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isPullRequestModalOpen, setIsPullRequestModalOpen] = useState(false);
  const [isSplitSheetModalOpen, setIsSplitSheetModalOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [commentModalState, setCommentModalState] = useState<{ isOpen: boolean; barPosition: number }>({
    isOpen: false,
    barPosition: 1.0,
  });

  const handleAddCommentAtBar = (bar: number) => {
    setCommentModalState({ isOpen: true, barPosition: bar });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 font-sans">
      {/* Top Floating Mini Bar to switch to Full Studio if needed */}
      <div className="w-full max-w-[460px] flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          FL Studio 21 Connected
        </span>
        <button
          onClick={() => setIsExpandedMode(!isExpandedMode)}
          className="flex items-center space-x-1 hover:text-cyan-400 transition-colors"
        >
          {isExpandedMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Modo VST Compacto</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expandir Studio Pro</span>
            </>
          )}
        </button>
      </div>

      {/* Main View: Default is the Minimalist Hardware VST Rack */}
      {!isExpandedMode ? (
        <CompactPluginHUD />
      ) : (
        <div className="w-full max-w-7xl space-y-6">
          <Header
            onOpenCommitModal={() => setIsCommitModalOpen(true)}
            onOpenBranchModal={() => setIsBranchModalOpen(true)}
            onOpenPullRequestModal={() => setIsPullRequestModalOpen(true)}
            onOpenSplitSheetModal={() => setIsSplitSheetModalOpen(true)}
            onToggleAICopilot={() => setIsAICopilotOpen(!isAICopilotOpen)}
            isAICopilotOpen={isAICopilotOpen}
          />
          <TransportBar />
          <div className="transition-all duration-300 space-y-4">
            {activeView === 'waveform' ? (
              <div className="space-y-4">
                <WaveformVisualizer onAddCommentAtBar={handleAddCommentAtBar} />
                <SpectrumAnalyzer />
              </div>
            ) : (
              <div className="h-[480px]">
                <PianoRollDiff />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <CommitTimeline />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <StemList />
              <AudioCommentsList onOpenNewCommentModal={() => handleAddCommentAtBar(16.0)} />
            </div>
          </div>
          <AIMixCopilot
            isOpen={isAICopilotOpen}
            onClose={() => setIsAICopilotOpen(false)}
          />
          <CommitModal
            isOpen={isCommitModalOpen}
            onClose={() => setIsCommitModalOpen(false)}
          />
          <BranchModal
            isOpen={isBranchModalOpen}
            onClose={() => setIsBranchModalOpen(false)}
          />
          <CommentModal
            isOpen={commentModalState.isOpen}
            barPosition={commentModalState.barPosition}
            onClose={() => setCommentModalState({ isOpen: false, barPosition: 1.0 })}
          />
          <PullRequestModal
            isOpen={isPullRequestModalOpen}
            onClose={() => setIsPullRequestModalOpen(false)}
          />
          <SplitSheetModal
            isOpen={isSplitSheetModalOpen}
            onClose={() => setIsSplitSheetModalOpen(false)}
          />
        </div>
      )}
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
