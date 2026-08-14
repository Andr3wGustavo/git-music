import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import { MessageSquarePlus, X } from 'lucide-react';

interface CommentModalProps {
  isOpen: boolean;
  barPosition: number;
  onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ isOpen, barPosition, onClose }) => {
  const { addComment } = useIPC();
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    addComment(message.trim(), barPosition);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-studio-border shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-studio-border/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-studio-neonAmber/20 border border-studio-neonAmber/40 text-studio-neonAmber">
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Drop Audio Note</h3>
              <p className="text-xs text-studio-muted">
                Pinned at <span className="text-studio-neonAmber font-mono font-bold">Bar {barPosition.toFixed(1)}</span>
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
              Feedback / Mixing Instructions
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Cut 300Hz on the snare here and increase sidechain ducking on the lead..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-studio-surface border border-studio-border focus:border-studio-neonAmber focus:ring-1 focus:ring-studio-neonAmber text-sm text-slate-100 placeholder:text-studio-muted/70 outline-none resize-none font-sans"
            />
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
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-studio-neonAmber to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-studio-neonAmber/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Pin Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
