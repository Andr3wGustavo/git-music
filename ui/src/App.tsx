import React, { useState } from 'react';
import { IPCProvider, useIPC } from './context/IPCContext';
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

const StudioCockpit: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-b from-[#06080e] via-[#0a0e18] to-[#06080e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Studio Header */}
      <Header
        onOpenCommitModal={() => setIsCommitModalOpen(true)}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
        onOpenPullRequestModal={() => setIsPullRequestModalOpen(true)}
        onOpenSplitSheetModal={() => setIsSplitSheetModalOpen(true)}
        onToggleAICopilot={() => setIsAICopilotOpen(!isAICopilotOpen)}
        isAICopilotOpen={isAICopilotOpen}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Real-time DAW Transport & A/B Switcher with Stereo VU Meters */}
        <TransportBar />

        {/* Dynamic Studio Visualizer: Waveform vs Piano Roll */}
        <div className="transition-all duration-300 space-y-4">
          {activeView === 'waveform' ? (
            <div className="space-y-4">
              <WaveformVisualizer onAddCommentAtBar={handleAddCommentAtBar} />
              {/* Real-Time 60 FPS Stereo FFT Spectrum Analyzer */}
              <SpectrumAnalyzer />
            </div>
          ) : (
            <div className="h-[480px]">
              <PianoRollDiff />
            </div>
          )}
        </div>

        {/* 2-Column Grid: Left (Timeline & Stems), Right (Feedback & Stems) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Commit History & Branches */}
          <div className="lg:col-span-7 space-y-6">
            <CommitTimeline />
          </div>

          {/* Right 5 Columns: Stem Inventory & Audio Comments */}
          <div className="lg:col-span-5 space-y-6">
            <StemList />
            <AudioCommentsList onOpenNewCommentModal={() => handleAddCommentAtBar(16.0)} />
          </div>
        </div>
      </main>

      {/* Slide-Over AI Mix Copilot */}
      <AIMixCopilot
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
      />

      {/* Modals */}
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
  );
};

export function App() {
  return (
    <IPCProvider>
      <StudioCockpit />
    </IPCProvider>
  );
}

export default App;
