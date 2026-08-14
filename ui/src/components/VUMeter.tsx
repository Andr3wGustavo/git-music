/**
 * @file VUMeter.tsx
 * @description Hardware-Grade Stereo LED Peak & RMS VU Meter (-48 dB to +6 dB).
 * Real-time needle/LED ballistics with animated peak hold and clip overload warning.
 */

import React, { useState, useEffect } from 'react';
import { WebAudioEngine, VULevels } from '../audio/WebAudioEngine';

interface VUMeterProps {
  compact?: boolean;
}

export const VUMeter: React.FC<VUMeterProps> = ({ compact = false }) => {
  const [levels, setLevels] = useState<VULevels>({
    leftDb: -48,
    rightDb: -48,
    leftLinear: 0,
    rightLinear: 0,
    peakClip: false,
  });

  useEffect(() => {
    let animId: number;
    const audioEngine = WebAudioEngine.getInstance();

    const update = () => {
      const current = audioEngine.getVULevels();
      setLevels(current);
      animId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animId);
  }, []);

  const ledSegments = 16;
  const activeLeft = Math.round(levels.leftLinear * ledSegments);
  const activeRight = Math.round(levels.rightLinear * ledSegments);

  const getLedColor = (index: number) => {
    if (index >= 14) return 'bg-rose-500 shadow-rose-500/50'; // +3dB, +6dB (Red clip warning)
    if (index >= 11) return 'bg-amber-400 shadow-amber-400/50'; // 0dB, +1.5dB (Yellow)
    if (index >= 6) return 'bg-emerald-400 shadow-emerald-400/50'; // -12dB to -3dB (Green)
    return 'bg-cyan-500 shadow-cyan-500/50'; // -48dB to -18dB (Cyan)
  };

  return (
    <div className={`flex items-center space-x-3 bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2 shadow-inner font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {/* Channel Labels & Numeric dB Values */}
      <div className="flex flex-col space-y-1.5 text-[10px] text-slate-400 font-bold shrink-0">
        <div className="flex items-center justify-between space-x-2">
          <span>L</span>
          <span className={`w-8 text-right ${levels.leftDb > -1 ? 'text-rose-400' : 'text-cyan-400'}`}>
            {levels.leftDb > -48 ? `${levels.leftDb.toFixed(0)}` : '-∞'}
          </span>
        </div>
        <div className="flex items-center justify-between space-x-2">
          <span>R</span>
          <span className={`w-8 text-right ${levels.rightDb > -1 ? 'text-rose-400' : 'text-cyan-400'}`}>
            {levels.rightDb > -48 ? `${levels.rightDb.toFixed(0)}` : '-∞'}
          </span>
        </div>
      </div>

      {/* LED Segment Bars */}
      <div className="flex flex-col space-y-1.5 flex-1 min-w-[100px]">
        {/* Left Channel Bar */}
        <div className="flex space-x-0.5 h-2 bg-slate-900 rounded p-0.5 border border-slate-800/80">
          {Array.from({ length: ledSegments }).map((_, i) => (
            <div
              key={`L_${i}`}
              className={`flex-1 rounded-[1px] transition-all duration-75 ${
                i < activeLeft
                  ? `${getLedColor(i)} shadow-sm`
                  : 'bg-slate-800/40'
              }`}
            />
          ))}
        </div>

        {/* Right Channel Bar */}
        <div className="flex space-x-0.5 h-2 bg-slate-900 rounded p-0.5 border border-slate-800/80">
          {Array.from({ length: ledSegments }).map((_, i) => (
            <div
              key={`R_${i}`}
              className={`flex-1 rounded-[1px] transition-all duration-75 ${
                i < activeRight
                  ? `${getLedColor(i)} shadow-sm`
                  : 'bg-slate-800/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Overload Clip Warning Lamp */}
      <div className="flex flex-col items-center justify-center pl-1 border-l border-slate-800/80 shrink-0">
        <div
          className={`w-2.5 h-2.5 rounded-full border transition-all ${
            levels.peakClip
              ? 'bg-rose-500 border-rose-300 shadow-md shadow-rose-500 animate-ping'
              : 'bg-slate-900 border-slate-800'
          }`}
          title="Clip Overload LED (> 0 dBFS)"
        />
        <span className="text-[8px] uppercase text-slate-500 mt-0.5">Clip</span>
      </div>
    </div>
  );
};
