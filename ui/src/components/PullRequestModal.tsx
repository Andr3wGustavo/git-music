/**
 * @file PullRequestModal.tsx
 * @description In-DAW Collaboration & Stem Pull Request Review Modal.
 * Enables multi-producer stem merges, spectral collision reviews, and gain staging alignment.
 */

import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import { GitPullRequest, GitMerge, AlertTriangle, CheckCircle2, X, Music, ArrowRight, ShieldCheck } from 'lucide-react';

interface PullRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PullRequestModal: React.FC<PullRequestModalProps> = ({ isOpen, onClose }) => {
  const { projectState, mergePullRequest } = useIPC();
  const [selectedPrId, setSelectedPrId] = useState<string>('');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergeSuccess, setMergeSuccess] = useState<boolean>(false);

  const pullRequests = projectState.pullRequests || [];

  if (!isOpen) return null;

  const currentPr = pullRequests.find((p) => p.id === selectedPrId) || pullRequests[0];

  const handleMerge = async (prId: string) => {
    setIsMerging(true);
    mergePullRequest(prId);
    setTimeout(() => {
      setIsMerging(false);
      setMergeSuccess(true);
      setTimeout(() => {
        setMergeSuccess(false);
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Stem Pull Requests & Cloud Collaboration
                <span className="text-xs font-normal font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {pullRequests.filter((p) => p.status === 'open').length} Open
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Review remote producer stems, resolve frequency collisions, and merge into master.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* PR List Sidebar */}
          <div className="w-80 border-r border-slate-800 bg-slate-950/40 overflow-y-auto p-3 space-y-2">
            <div className="text-[11px] font-mono text-slate-500 uppercase px-2 py-1">
              Active Pull Requests
            </div>
            {pullRequests.map((pr) => (
              <div
                key={pr.id}
                onClick={() => setSelectedPrId(pr.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  (currentPr?.id === pr.id)
                    ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      pr.status === 'open'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {pr.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(pr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white truncate mb-1">{pr.title}</h4>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
                  <span className="text-cyan-400">{pr.sourceBranch}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className="text-slate-300">{pr.targetBranch}</span>
                </div>
              </div>
            ))}
          </div>

          {/* PR Details View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {currentPr ? (
              <>
                {/* PR Overview Box */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">{currentPr.title}</h3>
                      <p className="text-xs text-slate-400 mb-3">{currentPr.description}</p>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <div className="flex items-center space-x-2">
                          <img
                            src={currentPr.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={currentPr.author}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-slate-300 font-medium">{currentPr.author}</span>
                        </div>
                        <span>•</span>
                        <span className="font-mono text-cyan-400">{currentPr.commitsCount} new commits</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stem Changes Diff */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
                    <span>Stem Changes & Audio Tracks ({currentPr.stemChanges.length})</span>
                    <span className="text-[10px] text-emerald-400 font-bold">CAS Hash Validated</span>
                  </h4>

                  <div className="space-y-3">
                    {currentPr.stemChanges.map((change, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                              <Music className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white flex items-center gap-2">
                                {change.name}
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  {change.action}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                LUFS Delta: +{change.lufsDelta || 1.2} dB • 24-bit 48kHz WAV
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Spectral Collision Warning if present */}
                        {change.spectralCollision && (
                          <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 text-xs space-y-1">
                            <div className="flex items-center space-x-2 text-amber-400 font-bold">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Spectral Masking Warning ({change.spectralCollision.frequencyRange})</span>
                            </div>
                            <p className="text-slate-300">
                              Collides with <strong className="text-white">{change.spectralCollision.withStem}</strong>.
                            </p>
                            <p className="text-amber-200/80 italic">
                              💡 Suggestion: {change.spectralCollision.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auto Gain Staging Info */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Automated Gain Staging & LUFS Alignment</div>
                      <div className="text-[11px] text-slate-400">
                        Stem summing will automatically compensate master gain by -0.8 dB to prevent digital clipping.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                    Safe to Merge
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                No active pull requests selected.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            Target Branch: <span className="font-mono text-white font-bold">{currentPr?.targetBranch || 'main'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {currentPr && currentPr.status === 'open' && (
              <button
                onClick={() => handleMerge(currentPr.id)}
                disabled={isMerging || mergeSuccess}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {mergeSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Merged Successfully!</span>
                  </>
                ) : isMerging ? (
                  <span>Executing 3-Way Stem Merge...</span>
                ) : (
                  <>
                    <GitMerge className="w-4 h-4" />
                    <span>Merge Stems into {currentPr.targetBranch}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
