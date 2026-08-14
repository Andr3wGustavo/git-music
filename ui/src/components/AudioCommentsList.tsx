import React from 'react';
import { useIPC } from '../context/IPCContext';
import { MessageSquare, CheckCircle2, Circle, Clock, CornerDownRight, Plus } from 'lucide-react';

interface AudioCommentsListProps {
  onOpenNewCommentModal: () => void;
}

export const AudioCommentsList: React.FC<AudioCommentsListProps> = ({ onOpenNewCommentModal }) => {
  const { projectState, resolveComment } = useIPC();
  const comments = projectState.comments;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-studio-border shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-studio-neonAmber/10 border border-studio-neonAmber/30 text-studio-neonAmber">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Timeline Audio Comments</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-studio-card text-studio-neonAmber font-mono">
                {comments.filter((c) => !c.resolved).length} Pending
              </span>
            </h2>
            <p className="text-xs text-studio-muted">
              Notes pinned to exact bars and audio transients.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewCommentModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-studio-card hover:bg-studio-surface border border-studio-border hover:border-studio-accent/40 text-xs font-semibold text-slate-200 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-studio-accent" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Comment Cards */}
      {comments.length === 0 ? (
        <div className="text-center py-6 text-xs text-studio-muted border border-dashed border-studio-border/60 rounded-xl">
          No feedback comments yet. Click on the waveform to pin a note!
        </div>
      ) : (
        <div className="space-y-2.5">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl border transition-all ${
                comment.resolved
                  ? 'bg-studio-surface/30 border-studio-border/40 opacity-50'
                  : 'bg-studio-card/80 border-studio-border hover:border-studio-neonAmber/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-studio-bg border border-studio-border text-studio-neonAmber">
                    Bar {comment.barPosition.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{comment.author}</span>
                </div>

                <button
                  onClick={() => resolveComment(comment.id)}
                  className={`flex items-center space-x-1 text-xs transition-colors ${
                    comment.resolved
                      ? 'text-studio-neonGreen font-semibold'
                      : 'text-studio-muted hover:text-slate-200'
                  }`}
                >
                  {comment.resolved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed pl-1">
                {comment.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
