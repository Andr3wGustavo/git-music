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
    <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-2 sm:p-4 font-mono select-none">
      {/* Top Floating Mini Status Bar */}
      <div className="w-full max-w-[440px] flex items-center justify-between text-[9px] uppercase font-bold text-[#525252] mb-1.5 px-0.5">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-none bg-[#FF5500]"></span>
          FL STUDIO 21 :: IN-DAW VST
        </span>
        <button
          onClick={() => setIsExpandedMode(!isExpandedMode)}
          className="flex items-center space-x-1 text-[#737373] hover:text-[#0099FF] transition-none"
        >
          {isExpandedMode ? (
            <>
              <Minimize2 className="w-3 h-3 text-[#FF5500]" />
              <span>MINI VST</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3 h-3 text-[#0099FF]" />
              <span>EXPAND PRO</span>
            </>
          )}
        </button>
      </div>

      {/* Main View: Default is the Pure Black Square Minimalist VST HUD */}
      {!isExpandedMode ? (
        <CompactPluginHUD />
      ) : (
        <div className="w-full max-w-7xl space-y-4 bg-black border border-[#1a1a1a] p-4 rounded-none">
          <Header
            onOpenCommitModal={() => setIsCommitModalOpen(true)}
            onOpenBranchModal={() => setIsBranchModalOpen(true)}
            onOpenPullRequestModal={() => setIsPullRequestModalOpen(true)}
            onOpenSplitSheetModal={() => setIsSplitSheetModalOpen(true)}
            onToggleAICopilot={() => setIsAICopilotOpen(!isAICopilotOpen)}
            isAICopilotOpen={isAICopilotOpen}
          />
          <TransportBar />
          <div className="transition-none space-y-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-4">
              <CommitTimeline />
            </div>
            <div className="lg:col-span-5 space-y-4">
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
