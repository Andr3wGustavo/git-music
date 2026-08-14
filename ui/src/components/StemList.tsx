import React from 'react';
import { useIPC } from '../context/IPCContext';
import { Music, Volume2, VolumeX, AlertTriangle, Snowflake, FileAudio } from 'lucide-react';

export const StemList: React.FC = () => {
  const { projectState, toggleMuteStem, toggleSoloStem, toggleFreezeStem } = useIPC();
  const stems = projectState.stems;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-studio-border shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-studio-neonGreen/10 border border-studio-neonGreen/30 text-studio-neonGreen">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Stem & Track Inventory</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-studio-card text-studio-neonGreen font-mono">
                {stems.length} Active
              </span>
            </h2>
            <p className="text-xs text-studio-muted">
              Auto-freeze stems for collaborators who don't have third-party VSTs installed.
            </p>
          </div>
        </div>
      </div>

      {/* Stem Cards */}
      <div className="space-y-2.5">
        {stems.map((stem) => (
          <div
            key={stem.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              stem.isMuted
                ? 'bg-studio-surface/40 border-studio-border/50 opacity-60'
                : 'bg-studio-card/70 border-studio-border hover:border-studio-accent/40'
            }`}
          >
            {/* Left: Stem Name & Details */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-lg bg-studio-bg border border-studio-border text-studio-accent shrink-0">
                <FileAudio className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-200 truncate">{stem.name}</span>
                  {stem.missingPlugin && (
                    <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-studio-neonAmber/20 text-studio-neonAmber border border-studio-neonAmber/30 font-mono font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Missing: {stem.missingPlugin}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs text-studio-muted font-mono mt-0.5">
                  <span>{(stem.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                  <span>•</span>
                  <span>{stem.sampleRate} Hz</span>
                  <span>•</span>
                  <span className="text-studio-accent font-medium">{stem.channels === 2 ? 'Stereo' : 'Mono'}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions (Freeze, Mute, Solo) */}
            <div className="flex items-center space-x-2">
              {stem.missingPlugin && (
                <button
                  onClick={() => toggleFreezeStem(stem.id)}
                  title="Auto-Freeze stem audio for missing VST"
                  className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    stem.isFrozen
                      ? 'bg-cyan-950 border-studio-accent text-studio-accent shadow-sm shadow-studio-accent/30 font-bold'
                      : 'bg-studio-surface border-studio-border text-studio-muted hover:text-slate-200'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>{stem.isFrozen ? 'Frozen Audio' : 'Freeze'}</span>
                </button>
              )}

              {/* Mute Button */}
              <button
                onClick={() => toggleMuteStem(stem.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                  stem.isMuted
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                    : 'bg-studio-surface hover:bg-studio-border border border-studio-border text-studio-muted hover:text-slate-200'
                }`}
              >
                M
              </button>

              {/* Solo Button */}
              <button
                onClick={() => toggleSoloStem(stem.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                  stem.isSolo
                    ? 'bg-studio-neonGreen text-slate-950 shadow-sm shadow-studio-neonGreen/30'
                    : 'bg-studio-surface hover:bg-studio-border border border-studio-border text-studio-muted hover:text-slate-200'
                }`}
              >
                S
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
