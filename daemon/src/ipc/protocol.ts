/**
 * @file protocol.ts
 * @description Typed IPC communication protocol between DAW Plugin (C++), Local Engine Daemon, and In-DAW Web UI.
 */

export interface DAWTransportState {
  isPlaying: boolean;
  bpm: number;
  timeSigNumerator: number;
  timeSigDenominator: number;
  samplePosition: number;
  barPosition: number;
  dawName: string; // "FL Studio", "Ableton Live", "Reaper", "Logic Pro"
}

export interface StemInfo {
  id: string;
  name: string;
  relativePath: string;
  sizeBytes: number;
  hash: string;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  isMuted?: boolean;
  isSolo?: boolean;
  missingPlugin?: string | null;
  isFrozen?: boolean;
}

export interface AudioComment {
  id: string;
  author: string;
  authorAvatar?: string;
  timestampSeconds: number;
  barPosition: number;
  stemId?: string; // Optional: tied to a specific track
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface CommitNode {
  hash: string;
  parentHash: string | null;
  branch: string;
  message: string;
  author: string;
  timestamp: string;
  dawProject: {
    fileName: string;
    fileHash: string;
    dawType: 'flp' | 'als' | 'rpp' | 'logicx' | 'generic';
    bpm: number;
  };
  stems: StemInfo[];
  comments: AudioComment[];
  totalSizeBytes: number;
  dedupSavedBytes: number;
}

export interface BranchInfo {
  name: string;
  headCommitHash: string;
  isCurrent: boolean;
  author: string;
  lastUpdated: string;
}

export interface ProjectState {
  projectName: string;
  projectPath: string;
  currentBranch: string;
  headCommit: string | null;
  branches: BranchInfo[];
  history: CommitNode[];
  stems: StemInfo[];
  comments: AudioComment[];
  transport: DAWTransportState;
  storageStats: {
    totalTrackedFiles: number;
    totalSizeBytes: number;
    dedupStorageBytes: number;
    savingsPercentage: number;
  };
}

// IPC Message Types
export type IPCMessageType =
  | 'CLIENT_HELLO'
  | 'PROJECT_STATE_UPDATE'
  | 'DAW_TRANSPORT_SYNC'
  | 'CREATE_COMMIT'
  | 'CHECKOUT_BRANCH'
  | 'CREATE_BRANCH'
  | 'ADD_AUDIO_COMMENT'
  | 'RESOLVE_AUDIO_COMMENT'
  | 'AB_LISTEN_SWITCH'
  | 'REQUEST_DIFF'
  | 'DIFF_RESPONSE'
  | 'FREEZE_STEM';

export interface IPCMessage<T = any> {
  type: IPCMessageType;
  payload: T;
  requestId?: string;
  timestamp: number;
}
