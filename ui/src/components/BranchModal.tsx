import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import { GitBranch, X, Plus } from 'lucide-react';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose }) => {
  const { createBranch, projectState } = useIPC();
  const [branchName, setBranchName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    // Sanitize branch name (e.g. feat/guitar-solo)
    const formatted = branchName.trim().toLowerCase().replace(/\s+/g, '-');
    createBranch(formatted);
    setBranchName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-studio-border shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-studio-border/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-studio-neonPurple/20 border border-studio-neonPurple/40 text-studio-neonPurple">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Create New Branch</h3>
              <p className="text-xs text-studio-muted">
                Branch off from <span className="text-studio-accent font-mono font-bold">"{projectState.currentBranch}"</span>
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
              Branch Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. feat/heavy-synth-drop"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-studio-surface border border-studio-border focus:border-studio-neonPurple focus:ring-1 focus:ring-studio-neonPurple text-sm text-slate-100 placeholder:text-studio-muted/70 outline-none font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-studio-surface/80 border border-studio-border text-xs text-studio-muted">
            Branches allow you to experiment with new solos, arrangements, or mixing tweaks without affecting the main track.
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
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-studio-neonPurple to-purple-600 text-white font-bold text-xs shadow-lg shadow-studio-neonPurple/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Branch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
