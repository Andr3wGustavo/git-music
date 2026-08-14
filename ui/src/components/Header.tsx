import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import { GitBranch, GitCommit, HardDrive, Disc, Activity, Plus, RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onOpenCommitModal: () => void;
  onOpenBranchModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCommitModal, onOpenBranchModal }) => {
  const { projectState, isConnected, checkoutBranch } = useIPC();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  return (
    <header className="glass-panel border-b border-studio-border/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
      {/* Left: Branding & Project Title */}
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-studio-accent/20 to-studio-neonPurple/30 border border-studio-accent/40 shadow-lg shadow-studio-accent/10">
          <Disc className="w-6 h-6 text-studio-accent animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-studio-neonGreen rounded-full border-2 border-studio-bg animate-pulse"></div>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-studio-accent">
              {projectState.projectName}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-studio-card border border-studio-border text-studio-accent font-mono">
              FL Studio 21
            </span>
          </div>
          <p className="text-xs text-studio-muted font-mono truncate max-w-md">
            {projectState.projectPath}
          </p>
        </div>
      </div>

      {/* Center: Branch Switcher & CAS Storage Savings */}
      <div className="flex items-center space-x-4">
        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-studio-card/80 hover:bg-studio-card border border-studio-border hover:border-studio-accent/50 text-sm font-medium transition-all group"
          >
            <GitBranch className="w-4 h-4 text-studio-neonPurple group-hover:rotate-12 transition-transform" />
            <span className="text-slate-200 font-mono">{projectState.currentBranch}</span>
            <ChevronDown className="w-3.5 h-3.5 text-studio-muted" />
          </button>

          {branchDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 w-64 glass-panel rounded-xl shadow-2xl p-2 z-50 border border-studio-border">
              <div className="text-[10px] uppercase font-bold text-studio-muted px-2 py-1 tracking-wider">
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
                        ? 'bg-studio-accent/15 text-studio-accent border border-studio-accent/30 font-semibold'
                        : 'text-slate-300 hover:bg-studio-surface'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    {b.name === projectState.currentBranch && <CheckCircle2 className="w-3.5 h-3.5 text-studio-accent shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-studio-border">
                <button
                  onClick={() => {
                    setBranchDropdownOpen(false);
                    onOpenBranchModal();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-studio-surface hover:bg-studio-border text-xs text-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-studio-accent" />
                  <span>Create New Branch</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CAS Deduplication Metric Badge */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-studio-card/60 border border-studio-border text-xs">
          <HardDrive className="w-3.5 h-3.5 text-studio-neonGreen" />
          <span className="text-studio-muted">Deduplication:</span>
          <span className="text-studio-neonGreen font-semibold font-mono">
            {projectState.storageStats.savingsPercentage}% Saved
          </span>
          <span className="text-studio-muted text-[10px]">
            ({Math.round((projectState.storageStats.totalSizeBytes - projectState.storageStats.dedupStorageBytes) / 1024 / 1024)} MB)
          </span>
        </div>
      </div>

      {/* Right: IPC Status & Commit Button */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-studio-surface border border-studio-border text-xs">
          <Activity className={`w-3.5 h-3.5 ${isConnected ? 'text-studio-neonGreen' : 'text-studio-neonAmber animate-pulse'}`} />
          <span className="text-studio-muted text-[11px] font-mono">
            {isConnected ? 'DAW Engine Active' : 'Local Daemon Standby'}
          </span>
        </div>

        <button
          onClick={onOpenCommitModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-studio-accent to-cyan-400 hover:from-cyan-300 hover:to-studio-accent text-slate-950 font-bold text-xs shadow-lg shadow-studio-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <GitCommit className="w-4 h-4 text-slate-950" />
          <span>Commit & Push</span>
        </button>
      </div>
    </header>
  );
};
