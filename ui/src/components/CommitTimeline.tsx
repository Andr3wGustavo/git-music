import React from 'react';
import { useIPC, CommitNode } from '../context/IPCContext';
import { GitCommit, GitFork, User, Clock, Check, HardDrive, ArrowRight } from 'lucide-react';

export const CommitTimeline: React.FC = () => {
  const { projectState, selectedCommit, setSelectedCommit } = useIPC();
  const history = projectState.history;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-studio-border shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-studio-neonPurple/10 border border-studio-neonPurple/30 text-studio-neonPurple">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Commit Ledger & Branches</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-studio-card text-studio-neonPurple font-mono">
                {history.length} Snapshots
              </span>
            </h2>
            <p className="text-xs text-studio-muted">
              Select any commit node to load its stems into the A/B listen switcher.
            </p>
          </div>
        </div>
      </div>

      {/* Vertical Commit Tree */}
      <div className="space-y-3 relative before:absolute before:top-4 before:bottom-4 before:left-5 before:w-0.5 before:bg-studio-border">
        {history.map((commit, index) => {
          const isSelected = selectedCommit?.hash === commit.hash;
          const isHead = projectState.headCommit === commit.hash;

          return (
            <div
              key={commit.hash}
              onClick={() => setSelectedCommit(commit)}
              className={`relative flex items-start space-x-4 p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-studio-card border-studio-accent/60 shadow-lg shadow-studio-accent/10 scale-[1.01]'
                  : 'bg-studio-surface/60 border-studio-border/70 hover:bg-studio-surface hover:border-studio-border'
              }`}
            >
              {/* Commit Node Indicator */}
              <div
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                  isHead
                    ? 'bg-studio-accent text-slate-950 border-white shadow-md shadow-studio-accent/40 font-bold'
                    : isSelected
                    ? 'bg-studio-neonPurple text-white border-studio-accent'
                    : 'bg-studio-card text-studio-muted border-studio-border'
                }`}
              >
                {isHead ? <Check className="w-4 h-4" /> : <GitCommit className="w-4 h-4" />}
              </div>

              {/* Commit Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-studio-bg border border-studio-border text-studio-accent">
                      {commit.hash.substring(0, 7)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-studio-neonPurple/15 text-studio-neonPurple font-mono font-medium">
                      {commit.branch}
                    </span>
                    {isHead && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-studio-neonGreen/20 text-studio-neonGreen font-mono font-bold">
                        HEAD
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-studio-muted font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-100 truncate">
                  {commit.message}
                </p>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between pt-1 text-xs text-studio-muted">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-300 font-medium">{commit.author}</span>
                  </div>

                  {commit.dedupSavedBytes > 0 && (
                    <div className="flex items-center space-x-1 text-[11px] text-studio-neonGreen font-mono">
                      <HardDrive className="w-3 h-3" />
                      <span>Saved {(commit.dedupSavedBytes / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
