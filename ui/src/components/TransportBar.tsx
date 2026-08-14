import React from 'react';
import { useIPC } from '../context/IPCContext';
import { Play, Square, Sliders, Volume2, Gauge, Clock } from 'lucide-react';

export const TransportBar: React.FC = () => {
  const { projectState, abMode, crossfade, setABMode, setCrossfade, togglePlay, selectedCommit } = useIPC();
  const transport = projectState.transport;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-studio-border shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Left: Transport Controls & Metronome */}
      <div className="flex items-center space-x-4">
        {/* Play/Pause Trigger */}
        <button
          onClick={togglePlay}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            transport.isPlaying
              ? 'bg-studio-neonGreen text-slate-950 shadow-lg shadow-studio-neonGreen/30 animate-pulse'
              : 'bg-studio-card hover:bg-studio-surface border border-studio-border text-slate-100 hover:border-studio-accent/50'
          }`}
        >
          {transport.isPlaying ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5 text-studio-accent" />
          )}
        </button>

        {/* BPM & Time Signature Display */}
        <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-studio-card border border-studio-border">
          <div className="flex items-center space-x-1.5">
            <Gauge className="w-4 h-4 text-studio-accent" />
            <span className="text-sm font-bold font-mono text-slate-100">{transport.bpm.toFixed(1)}</span>
            <span className="text-[10px] text-studio-muted font-bold">BPM</span>
          </div>

          <div className="w-px h-4 bg-studio-border"></div>

          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-studio-muted" />
            <span className="text-xs font-mono text-slate-300">
              {transport.timeSigNumerator}/{transport.timeSigDenominator}
            </span>
          </div>
        </div>

        {/* Bar & Beat Position Counter */}
        <div className="px-3.5 py-1.5 rounded-xl bg-studio-surface border border-studio-border font-mono">
          <span className="text-[10px] uppercase font-bold text-studio-muted block leading-none">Bar Position</span>
          <span className="text-sm font-bold text-studio-accent">
            {Math.floor(transport.barPosition)} : {Math.floor((transport.barPosition % 1) * 4) + 1}
          </span>
        </div>
      </div>

      {/* Right: A/B Audio Comparison Engine & Crossfader */}
      <div className="flex items-center space-x-4 bg-studio-surface/80 p-2.5 rounded-xl border border-studio-border">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-studio-neonPink" />
          <span className="text-xs font-semibold text-slate-200">A/B Studio Diff:</span>
        </div>

        {/* Live vs Snapshot Mode Pills */}
        <div className="flex items-center bg-studio-card p-1 rounded-lg border border-studio-border text-xs font-mono">
          <button
            onClick={() => setABMode('live')}
            className={`px-3 py-1 rounded-md transition-all ${
              abMode === 'live'
                ? 'bg-studio-accent text-slate-950 font-bold shadow-md shadow-studio-accent/20'
                : 'text-studio-muted hover:text-slate-200'
            }`}
          >
            A: Live FL Master
          </button>
          <button
            onClick={() => setABMode('snapshot')}
            className={`px-3 py-1 rounded-md transition-all ${
              abMode === 'snapshot'
                ? 'bg-studio-neonPink text-slate-100 font-bold shadow-md shadow-studio-neonPink/20'
                : 'text-studio-muted hover:text-slate-200'
            }`}
          >
            B: [{selectedCommit ? selectedCommit.hash.substring(0, 7) : 'Commit'}]
          </button>
        </div>

        {/* Real-time Crossfader Slider */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-studio-muted font-bold">A</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={crossfade}
            onChange={(e) => setCrossfade(parseFloat(e.target.value))}
            className="w-24 cursor-pointer accent-studio-accent"
          />
          <span className="text-[10px] font-mono text-studio-muted font-bold">B</span>
        </div>
      </div>
    </div>
  );
};
