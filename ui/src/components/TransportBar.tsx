import React from 'react';
import { useIPC } from '../context/IPCContext';
import { Play, Square, Sliders, Gauge, Clock } from 'lucide-react';
import { WebAudioEngine } from '../audio/WebAudioEngine';
import { VUMeter } from './VUMeter';

export const TransportBar: React.FC = () => {
  const { projectState, abMode, crossfade, setABMode, setCrossfade, togglePlay, selectedCommit } = useIPC();
  const transport = projectState.transport;

  const handlePlayToggle = async () => {
    const audioEngine = WebAudioEngine.getInstance();
    if (!transport.isPlaying) {
      audioEngine.setBpm(transport.bpm);
      await audioEngine.start();
    } else {
      audioEngine.stop();
    }
    togglePlay();
  };

  const handleCrossfadeChange = (val: number) => {
    setCrossfade(val);
    WebAudioEngine.getInstance().setCrossfade(val);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-studio-border shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Left: Transport Controls & Metronome */}
      <div className="flex items-center space-x-4">
        {/* Play/Pause Trigger */}
        <button
          onClick={handlePlayToggle}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            transport.isPlaying
              ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/40 animate-pulse'
              : 'bg-studio-card hover:bg-studio-surface border border-studio-border text-slate-100 hover:border-cyan-500/50'
          }`}
        >
          {transport.isPlaying ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5 text-cyan-400" />
          )}
        </button>

        {/* BPM & Time Signature Display */}
        <div className="flex items-center space-x-3 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center space-x-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold font-mono text-slate-100">{transport.bpm.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500 font-bold">BPM</span>
          </div>

          <div className="w-px h-4 bg-slate-800"></div>

          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-mono text-slate-300">
              {transport.timeSigNumerator}/{transport.timeSigDenominator}
            </span>
          </div>
        </div>

        {/* Bar & Beat Position Counter */}
        <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono">
          <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none">Bar Position</span>
          <span className="text-sm font-bold text-cyan-400">
            {Math.floor(transport.barPosition)} : {Math.floor((transport.barPosition % 1) * 4) + 1}
          </span>
        </div>
      </div>

      {/* Center: Real-Time Stereo Hardware VU Meters */}
      <div className="flex items-center">
        <VUMeter />
      </div>

      {/* Right: A/B Audio Comparison Engine & Crossfader */}
      <div className="flex items-center space-x-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-semibold text-slate-200">A/B Diff:</span>
        </div>

        {/* Live vs Snapshot Mode Pills */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              setABMode('live');
              handleCrossfadeChange(0.0);
            }}
            className={`px-3 py-1 rounded-md transition-all ${
              abMode === 'live'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A: Live FL Master
          </button>
          <button
            onClick={() => {
              setABMode('snapshot');
              handleCrossfadeChange(1.0);
            }}
            className={`px-3 py-1 rounded-md transition-all ${
              abMode === 'snapshot'
                ? 'bg-pink-500 text-slate-100 font-bold shadow-md shadow-pink-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            B: [{selectedCommit ? selectedCommit.hash.substring(0, 7) : 'Commit'}]
          </button>
        </div>

        {/* Real-time Crossfader Slider */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-500 font-bold">A</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={crossfade}
            onChange={(e) => handleCrossfadeChange(parseFloat(e.target.value))}
            className="w-24 cursor-pointer accent-cyan-400"
          />
          <span className="text-[10px] font-mono text-slate-500 font-bold">B</span>
        </div>
      </div>
    </div>
  );
};
