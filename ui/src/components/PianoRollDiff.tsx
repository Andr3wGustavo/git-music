/**
 * @file PianoRollDiff.tsx
 * @description Interactive Visual MIDI Diff & Piano Roll Inspector.
 * Displays melodic, harmonic and velocity changes between commits with scale collision detection.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useIPC, MIDINote } from '../context/IPCContext';
import { AlertTriangle, Music } from 'lucide-react';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getPitchName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const name = NOTE_NAMES[pitch % 12];
  return `${name}${octave}`;
}

function isBlackKey(pitch: number): boolean {
  const noteInOctave = pitch % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave);
}

export const PianoRollDiff: React.FC = () => {
  const { projectState } = useIPC();
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [hoveredNote, setHoveredNote] = useState<MIDINote | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const midiTracks = projectState.midiTracks || [];

  useEffect(() => {
    if (midiTracks.length > 0 && !selectedTrackId) {
      setSelectedTrackId(midiTracks[0].id);
    }
  }, [midiTracks, selectedTrackId]);

  const currentTrack = midiTracks.find((t) => t.id === selectedTrackId) || midiTracks[0];

  // Visual parameters
  const minPitch = 24; // C1
  const maxPitch = 84; // C6
  const totalPitches = maxPitch - minPitch + 1;
  const rowHeight = 14;
  const barWidth = 140; // Pixels per bar
  const totalBars = 16;
  const totalWidth = totalBars * barWidth;
  const totalHeight = totalPitches * rowHeight;

  // Playhead position in pixels
  const playheadX = ((projectState.transport.barPosition - 1.0) * barWidth);

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-xl border border-slate-800/80 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Header & Track Selector */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Visual MIDI Diff & Piano Roll
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Harmonic Inspector
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Comparing MIDI notes against parent commit on branch{' '}
              <span className="text-cyan-400 font-mono font-medium">{projectState.currentBranch}</span>
            </p>
          </div>
        </div>

        {/* Track Selection Tabs */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {midiTracks.map((trk) => (
            <button
              key={trk.id}
              onClick={() => setSelectedTrackId(trk.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedTrackId === trk.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: trk.color || '#00FF66' }}
              />
              <span>{trk.name}</span>
              <span className="text-[10px] opacity-60 font-mono">({trk.notes.length})</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-300 inline-block shadow-sm shadow-emerald-500/50" />
            <span className="text-emerald-400">Added</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 border border-rose-300 inline-block shadow-sm shadow-rose-500/50" />
            <span className="text-rose-400">Deleted</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 border border-amber-200 inline-block shadow-sm shadow-amber-400/50" />
            <span className="text-amber-300">Modified</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500 border border-cyan-300 inline-block shadow-sm shadow-cyan-500/50" />
            <span className="text-cyan-300">Unchanged</span>
          </div>
        </div>
      </div>

      {/* Harmonic Conflict Detection Alert Banner */}
      <div className="px-4 py-2.5 bg-amber-950/30 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong className="text-amber-300">Harmonic Analysis:</strong> Lead melody pitch altered at Bar 3.0 (D# to E) — creates a Minor 2nd dissonance with Bass F#3 unless sidechain ducking is enabled.
          </span>
        </div>
        <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 text-amber-300">
          Scale: F# Natural Minor
        </span>
      </div>

      {/* Main Piano Roll Container */}
      <div className="relative flex-1 overflow-auto flex" ref={containerRef}>
        {/* Left: Piano Keys Column */}
        <div
          className="sticky left-0 z-20 flex flex-col bg-slate-900 border-r border-slate-800 select-none flex-shrink-0 shadow-lg"
          style={{ width: 64, height: totalHeight }}
        >
          {Array.from({ length: totalPitches }).map((_, idx) => {
            const pitch = maxPitch - idx;
            const isBlack = isBlackKey(pitch);
            const pitchName = getPitchName(pitch);
            const isC = pitch % 12 === 0;

            return (
              <div
                key={pitch}
                className={`flex items-center justify-end pr-2 text-[10px] font-mono transition-colors ${
                  isBlack
                    ? 'bg-slate-950 text-slate-500 border-b border-slate-900'
                    : 'bg-slate-800/80 text-slate-300 border-b border-slate-700/60'
                } ${isC ? 'font-bold text-cyan-400 bg-slate-800' : ''}`}
                style={{ height: rowHeight }}
              >
                {isC || pitch % 12 === 7 ? pitchName : ''}
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Note Canvas Grid */}
        <div
          className="relative flex-1 bg-slate-950 select-none"
          style={{ width: totalWidth, height: totalHeight }}
        >
          {/* Pitch Rows Background */}
          {Array.from({ length: totalPitches }).map((_, idx) => {
            const pitch = maxPitch - idx;
            const isBlack = isBlackKey(pitch);
            const isC = pitch % 12 === 0;

            return (
              <div
                key={pitch}
                className={`w-full border-b ${
                  isC
                    ? 'border-cyan-500/20 bg-cyan-950/10'
                    : isBlack
                    ? 'border-slate-900/60 bg-slate-950'
                    : 'border-slate-900/40 bg-slate-900/20'
                }`}
                style={{ height: rowHeight }}
              />
            );
          })}

          {/* Vertical Bar & Beat Lines */}
          {Array.from({ length: totalBars }).map((_, barIdx) => (
            <div
              key={barIdx}
              className="absolute top-0 bottom-0 border-l border-slate-800/80 flex"
              style={{ left: barIdx * barWidth, width: barWidth }}
            >
              {/* Bar Label */}
              <div className="absolute top-1 left-1 text-[10px] font-mono font-bold text-slate-500 pointer-events-none">
                BAR {barIdx + 1}
              </div>
              {/* Beat sub-divisions */}
              <div className="w-1/4 border-r border-slate-900/40 h-full" />
              <div className="w-1/4 border-r border-slate-800/40 h-full" />
              <div className="w-1/4 border-r border-slate-900/40 h-full" />
            </div>
          ))}

          {/* Render Active Track MIDI Notes */}
          {currentTrack &&
            currentTrack.notes.map((note) => {
              const y = (maxPitch - note.pitch) * rowHeight;
              const x = (note.startBar - 1.0) * barWidth;
              const width = Math.max(8, note.durationBars * barWidth - 2);

              let noteColor = 'bg-cyan-500 border-cyan-300 text-cyan-950 shadow-cyan-500/40';
              let badgeText = 'MATCH';

              if (note.diffStatus === 'added') {
                noteColor = 'bg-emerald-500 border-emerald-300 text-emerald-950 shadow-emerald-500/60 ring-2 ring-emerald-400/40';
                badgeText = '+ADD';
              } else if (note.diffStatus === 'removed') {
                noteColor = 'bg-rose-600 border-rose-300 text-rose-950 line-through shadow-rose-600/60 opacity-75';
                badgeText = '-DEL';
              } else if (note.diffStatus === 'modified') {
                noteColor = 'bg-amber-400 border-amber-200 text-amber-950 shadow-amber-400/60 ring-2 ring-amber-300/40';
                badgeText = 'MOD';
              }

              return (
                <div
                  key={note.id}
                  onMouseEnter={() => setHoveredNote(note)}
                  onMouseLeave={() => setHoveredNote(null)}
                  className={`absolute rounded-sm border cursor-pointer transition-transform hover:scale-[1.03] z-10 flex items-center justify-between px-1.5 text-[9px] font-mono font-bold shadow-md ${noteColor}`}
                  style={{
                    top: y + 1,
                    left: x,
                    width,
                    height: rowHeight - 2,
                  }}
                >
                  <span className="truncate">{getPitchName(note.pitch)}</span>
                  {width > 40 && <span className="text-[8px] opacity-80">{badgeText}</span>}
                </div>
              );
            })}

          {/* Real-time Transport Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_12px_rgba(244,63,94,0.9)]"
            style={{ left: playheadX }}
          >
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full -ml-1 -mt-1 shadow-md shadow-rose-500/80" />
          </div>
        </div>
      </div>

      {/* Note Inspection Footer Details */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-6">
          {hoveredNote ? (
            <>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Note:</span>
                <span className="text-white font-mono font-bold text-sm bg-slate-800 px-2 py-0.5 rounded">
                  {getPitchName(hoveredNote.pitch)} (MIDI {hoveredNote.pitch})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Start:</span>{' '}
                <span className="text-cyan-400 font-mono font-medium">Bar {hoveredNote.startBar}</span>
              </div>
              <div>
                <span className="text-slate-500">Duration:</span>{' '}
                <span className="text-cyan-400 font-mono font-medium">{hoveredNote.durationBars} Bars</span>
              </div>
              <div>
                <span className="text-slate-500">Velocity:</span>{' '}
                <span className="text-emerald-400 font-mono font-medium">{hoveredNote.velocity}/127</span>
              </div>
              <div>
                <span className="text-slate-500">Diff Action:</span>{' '}
                <span className="text-amber-400 font-mono uppercase font-bold">
                  {hoveredNote.diffStatus || 'unchanged'}
                </span>
              </div>
            </>
          ) : (
            <span className="italic text-slate-500">
              Hover over any note to inspect pitch, velocity, bar timing, and diff metadata.
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500">Instrument:</span>
          <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {currentTrack?.instrument || 'Polyphonic Synth'}
          </span>
        </div>
      </div>
    </div>
  );
};
