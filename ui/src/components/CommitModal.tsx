import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import { GitCommit, X, Sparkles, HardDrive } from 'lucide-react';

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommitModal: React.FC<CommitModalProps> = ({ isOpen, onClose }) => {
  const { createCommit, projectState } = useIPC();
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('Alex (Lead Producer)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    createCommit(message.trim(), author.trim());
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-studio-border shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-studio-border/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-studio-accent/20 border border-studio-accent/40 text-studio-accent">
              <GitCommit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Commit & Push DAW State</h3>
              <p className="text-xs text-studio-muted">
                Create a snapshot on branch <span className="text-studio-neonPurple font-mono font-bold">"{projectState.currentBranch}"</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-studio-muted hover:text-slate-100 hover:bg-studio-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-studio-muted mb-1.5">
              Commit Message (Summary of changes)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. feat(drums): Add 808 glide on chorus and sidechain EQ"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-studio-surface border border-studio-border focus:border-studio-accent focus:ring-1 focus:ring-studio-accent text-sm text-slate-100 placeholder:text-studio-muted/70 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-studio-muted mb-1.5">
              Producer Name
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-studio-surface border border-studio-border text-sm text-slate-200 outline-none"
            />
          </div>

          {/* Deduplication Summary */}
          <div className="p-3 rounded-xl bg-studio-surface/80 border border-studio-border text-xs flex items-center space-x-3">
            <HardDrive className="w-5 h-5 text-studio-neonGreen shrink-0" />
            <div>
              <p className="font-semibold text-slate-200">Content-Addressable Storage (CAS)</p>
              <p className="text-studio-muted text-[11px]">
                Only changed audio tracks and metadata will be uploaded. Unchanged stems are deduplicated.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-studio-surface hover:bg-studio-border text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-studio-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-studio-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <GitCommit className="w-4 h-4" />
              <span>Snapshot & Sync</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
