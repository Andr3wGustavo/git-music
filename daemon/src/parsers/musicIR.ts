/**
 * @file musicIR.ts
 * @description Cross-DAW Intermediate Representation (Music-IR) and Project Translator.
 * Converts project states between FL Studio (.flp), Ableton Live (.als), and Cockos Reaper (.rpp).
 */

import { DAWProjectInspection, StemInfo, MIDITrack } from '../ipc/protocol';

export interface MusicIRTrack {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'bus';
  color: string;
  volumeDb: number;
  pan: number; // -1.0 to 1.0
  isMuted: boolean;
  isSolo: boolean;
  pluginChain: string[];
  audioClips: {
    sourceFile: string;
    startBar: number;
    durationBars: number;
  }[];
  midiNotes: {
    pitch: number;
    startBar: number;
    durationBars: number;
    velocity: number;
  }[];
}

export interface MusicIRSession {
  title: string;
  bpm: number;
  timeSigNumerator: number;
  timeSigDenominator: number;
  sourceDAW: string;
  tracks: MusicIRTrack[];
}

export class MusicIRCompiler {
  /**
   * Convert any DAWProjectInspection and Stem state into the universal Music-IR AST.
   */
  public static fromInspection(
    inspection: DAWProjectInspection,
    stems: StemInfo[] = []
  ): MusicIRSession {
    const tracks: MusicIRTrack[] = [];

    // 1. Map Audio Stems to Audio Tracks
    stems.forEach((stem, idx) => {
      tracks.push({
        id: `ir_audio_${idx + 1}`,
        name: stem.name.replace(/\.[^.]+$/, ''),
        type: 'audio',
        color: '#00F0FF',
        volumeDb: 0.0,
        pan: 0.0,
        isMuted: !!stem.isMuted,
        isSolo: !!stem.isSolo,
        pluginChain: stem.missingPlugin ? [stem.missingPlugin] : [],
        audioClips: [
          {
            sourceFile: stem.relativePath,
            startBar: 1.0,
            durationBars: Math.ceil(stem.durationSeconds / 2.0),
          },
        ],
        midiNotes: [],
      });
    });

    // 2. Map MIDI Tracks
    inspection.midiTracks.forEach((mTrk, idx) => {
      tracks.push({
        id: `ir_midi_${idx + 1}`,
        name: mTrk.name,
        type: 'midi',
        color: mTrk.color || '#00FF66',
        volumeDb: 0.0,
        pan: 0.0,
        isMuted: false,
        isSolo: false,
        pluginChain: mTrk.instrument ? [mTrk.instrument] : [],
        audioClips: [],
        midiNotes: mTrk.notes.map((n) => ({
          pitch: n.pitch,
          startBar: n.startBar,
          durationBars: n.durationBars,
          velocity: n.velocity,
        })),
      });
    });

    return {
      title: inspection.title || 'Collaborative Song Session',
      bpm: inspection.bpm || 128.0,
      timeSigNumerator: inspection.timeSigNumerator || 4,
      timeSigDenominator: inspection.timeSigDenominator || 4,
      sourceDAW: inspection.dawType.toUpperCase(),
      tracks,
    };
  }

  /**
   * Compile Music-IR session into Cockos Reaper (.rpp) project file string.
   */
  public static exportToReaperRPP(session: MusicIRSession): string {
    let rpp = `<REAPER_PROJECT 0.1 "7.x/git-music" ${Date.now()}\n`;
    rpp += `  RIPPLE 0\n`;
    rpp += `  GROUPOVERRIDE 0 0 0\n`;
    rpp += `  AUTOXFADE 1\n`;
    rpp += `  TEMPO ${session.bpm} ${session.timeSigNumerator} ${session.timeSigDenominator}\n`;

    for (const track of session.tracks) {
      rpp += `  <TRACK\n`;
      rpp += `    NAME "${track.name}"\n`;
      rpp += `    VOLPAN 1.0 0.0 1.0 -1.0\n`;
      rpp += `    MUTESOLO ${track.isMuted ? 1 : 0} ${track.isSolo ? 1 : 0} 0\n`;

      if (track.pluginChain.length > 0) {
        rpp += `    <FXCHAIN\n`;
        for (const fx of track.pluginChain) {
          rpp += `      <VST "VST3: ${fx}" "${fx}.vst3" 0 "" >\n`;
        }
        rpp += `    >\n`;
      }

      for (const clip of track.audioClips) {
        rpp += `    <ITEM\n`;
        rpp += `      POSITION 0.0\n`;
        rpp += `      LENGTH ${clip.durationBars * 2.0}\n`;
        rpp += `      NAME "${track.name}"\n`;
        rpp += `      <SOURCE WAVE\n`;
        rpp += `        FILE "${clip.sourceFile}"\n`;
        rpp += `      >\n`;
        rpp += `    >\n`;
      }

      rpp += `  >\n`;
    }

    rpp += `>\n`;
    return rpp;
  }
}
