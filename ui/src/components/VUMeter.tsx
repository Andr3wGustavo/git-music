/**
 * @file VUMeter.tsx
 * @description Minimalist Square LED VU Meter in Jet Black, Electric Blue, and Industrial Orange.
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

  // Sharp Square Segment Colors: Blue (-48 to -12dB), Orange (-12 to 0dB), Vivid Orange/Red (+3dB)
  const getLedColor = (index: number) => {
    if (index >= 14) return 'bg-[#FF3300]'; // Peak Clip (+3dB / +6dB)
    if (index >= 10) return 'bg-[#FF6600]'; // Industrial Orange (-6dB to 0dB)
    return 'bg-[#0070F3]'; // Electric Blue (-48dB to -12dB)
  };

  return (
    <div className={`flex items-center space-x-3 bg-black border border-[#1a1a1a] rounded-none p-2 font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {/* Channel Labels & Numeric dB Values */}
      <div className="flex flex-col space-y-1 text-[9px] text-[#737373] font-mono font-bold shrink-0">
        <div className="flex items-center justify-between space-x-2">
          <span>L</span>
          <span className={`w-7 text-right ${levels.leftDb > -1 ? 'text-[#FF3300]' : 'text-[#0099FF]'}`}>
            {levels.leftDb > -48 ? `${levels.leftDb.toFixed(0)}` : '-∞'}
          </span>
        </div>
        <div className="flex items-center justify-between space-x-2">
          <span>R</span>
          <span className={`w-7 text-right ${levels.rightDb > -1 ? 'text-[#FF3300]' : 'text-[#0099FF]'}`}>
            {levels.rightDb > -48 ? `${levels.rightDb.toFixed(0)}` : '-∞'}
          </span>
        </div>
      </div>

      {/* Sharp Square LED Segment Bars */}
      <div className="flex flex-col space-y-1 flex-1 min-w-[120px]">
        {/* Left Channel Bar */}
        <div className="flex space-x-[2px] h-2.5 bg-[#0a0a0a] p-[1px] border border-[#1a1a1a]">
          {Array.from({ length: ledSegments }).map((_, i) => (
            <div
              key={`L_${i}`}
              className={`flex-1 rounded-none transition-none ${
                i < activeLeft ? getLedColor(i) : 'bg-[#141414]'
              }`}
            />
          ))}
        </div>

        {/* Right Channel Bar */}
        <div className="flex space-x-[2px] h-2.5 bg-[#0a0a0a] p-[1px] border border-[#1a1a1a]">
          {Array.from({ length: ledSegments }).map((_, i) => (
            <div
              key={`R_${i}`}
              className={`flex-1 rounded-none transition-none ${
                i < activeRight ? getLedColor(i) : 'bg-[#141414]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Overload Clip Warning Square Lamp */}
      <div className="flex flex-col items-center justify-center pl-2 border-l border-[#1a1a1a] shrink-0">
        <div
          className={`w-3 h-3 rounded-none border transition-none ${
            levels.peakClip
              ? 'bg-[#FF3300] border-[#FF6600]'
              : 'bg-[#0a0a0a] border-[#1a1a1a]'
          }`}
          title="Clip Overload (> 0 dBFS)"
        />
        <span className="text-[7px] uppercase font-mono text-[#525252] mt-0.5 font-bold">Clip</span>
      </div>
    </div>
  );
};
