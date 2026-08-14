import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import {
  GitBranch,
  GitCommit,
  HardDrive,
  Disc,
  Plus,
  CheckCircle2,
  ChevronDown,
  Cloud,
  GitPullRequest,
  Music,
  Radio,
  Award,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onOpenCommitModal: () => void;
  onOpenBranchModal: () => void;
  onOpenPullRequestModal: () => void;
  onOpenSplitSheetModal: () => void;
  onToggleAICopilot: () => void;
  isAICopilotOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommitModal,
  onOpenBranchModal,
  onOpenPullRequestModal,
  onOpenSplitSheetModal,
  onToggleAICopilot,
  isAICopilotOpen = false,
}) => {
  const {
    projectState,
    checkoutBranch,
    activeView,
    setActiveView,
    triggerCloudSync,
  } = useIPC();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCloudSync = () => {
    setIsSyncing(true);
    triggerCloudSync();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const openPRCount = projectState.pullRequests?.filter((p) => p.status === 'open').length || 0;

  return (
    <header className="glass-panel border-b border-studio-border/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
      {/* Left: Branding & Project Title */}
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/30 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
          <Disc className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse"></div>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
              {projectState.projectName}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 font-mono">
              {projectState.transport.dawName || 'FL Studio 21'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate max-w-md">
            {projectState.projectPath}
          </p>
        </div>
      </div>

      {/* Center: View Switcher (Waveform vs Piano Roll) & Branch Switcher */}
      <div className="flex items-center space-x-3">
        {/* View Toggle Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveView('waveform')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'waveform'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Waveform Audio Diff</span>
          </button>
          <button
            onClick={() => setActiveView('piano_roll')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'piano_roll'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Piano Roll MIDI Diff</span>
          </button>
        </div>

        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-sm font-medium transition-all group"
          >
            <GitBranch className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            <span className="text-slate-200 font-mono">{projectState.currentBranch}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-64 rounded-xl shadow-2xl p-2 z-50 border border-slate-800 bg-slate-900/95 backdrop-blur-xl">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
                Active Branches
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {projectState.branches.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => {
                      checkoutBranch(b.name);
                      setBranchDropdownOpen(false);
                    }}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                      b.name === projectState.currentBranch
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    {b.name === projectState.currentBranch && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setBranchDropdownOpen(false);
                    onOpenBranchModal();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Create New Branch</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CAS Deduplication Metric Badge */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-500">Deduplication:</span>
          <span className="text-emerald-400 font-semibold font-mono">
            {projectState.storageStats.savingsPercentage}% Saved
          </span>
        </div>
      </div>

      {/* Right: AI Copilot, Split Sheet, Cloud Sync, Pull Requests & Commit Button */}
      <div className="flex items-center space-x-2.5">
        {/* AI Copilot Button */}
        <button
          onClick={onToggleAICopilot}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm ${
            isAICopilotOpen
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-purple-500/30'
              : 'bg-slate-950 border-purple-500/40 text-purple-300 hover:bg-purple-950/20 hover:border-purple-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>AI Copilot</span>
        </button>

        {/* Split Sheet Modal Button */}
        <button
          onClick={onOpenSplitSheetModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-medium text-amber-300 transition-all shadow-sm"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Split Sheet</span>
        </button>

        {/* Cloud CAS Sync Button */}
        <button
          onClick={handleCloudSync}
          disabled={isSyncing}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-xs font-medium text-slate-300 transition-all"
        >
          <Cloud className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="font-mono text-[11px]">
            {isSyncing ? 'Syncing...' : 'R2 Synced'}
          </span>
        </button>

        {/* Pull Requests Button */}
        <button
          onClick={onOpenPullRequestModal}
          className="relative flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-300 transition-all group"
        >
          <GitPullRequest className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Stem PRs</span>
          {openPRCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {openPRCount}
            </span>
          )}
        </button>

        {/* New Commit Button */}
        <button
          onClick={onOpenCommitModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <GitCommit className="w-4 h-4" />
          <span>Commit & Push</span>
        </button>
      </div>
    </header>
  );
};
