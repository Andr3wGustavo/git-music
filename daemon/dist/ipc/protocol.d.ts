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
    dawName: string;
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
    rmsDb?: number;
    peakDb?: number;
    lufsIntegrated?: number;
}
export interface AudioComment {
    id: string;
    author: string;
    authorAvatar?: string;
    timestampSeconds: number;
    barPosition: number;
    stemId?: string;
    message: string;
    createdAt: string;
    resolved: boolean;
}
export interface MIDINote {
    id: string;
    pitch: number;
    startBar: number;
    durationBars: number;
    velocity: number;
    channel?: number;
    diffStatus?: 'added' | 'removed' | 'modified' | 'unchanged';
}
export interface MIDITrack {
    id: string;
    name: string;
    color?: string;
    instrument?: string;
    notes: MIDINote[];
}
export interface DAWPluginInfo {
    name: string;
    vendor?: string;
    format: 'vst2' | 'vst3' | 'au' | 'clap' | 'native';
    isMissing: boolean;
    presetName?: string;
    channelIndex?: number;
}
export interface DAWProjectInspection {
    dawType: 'flp' | 'als' | 'rpp' | 'logicx' | 'generic';
    version?: string;
    bpm: number;
    timeSigNumerator: number;
    timeSigDenominator: number;
    title?: string;
    plugins: DAWPluginInfo[];
    audioSamples: string[];
    midiTracks: MIDITrack[];
    rawChunkCount?: number;
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
        inspection?: DAWProjectInspection;
    };
    stems: StemInfo[];
    midiTracks?: MIDITrack[];
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
export interface PullRequest {
    id: string;
    sourceBranch: string;
    targetBranch: string;
    title: string;
    description: string;
    author: string;
    authorAvatar?: string;
    createdAt: string;
    status: 'open' | 'merged' | 'closed';
    commitsCount: number;
    stemChanges: {
        stemId: string;
        name: string;
        action: 'added' | 'modified' | 'deleted' | 'unchanged';
        spectralCollision?: {
            frequencyRange: string;
            withStem: string;
            severity: 'low' | 'medium' | 'high';
            suggestion: string;
        };
        lufsDelta?: number;
    }[];
}
export interface LiveProducerPresence {
    producerId: string;
    name: string;
    avatar: string;
    daw: string;
    role: 'beatmaker' | 'vocalist' | 'mixing_engineer' | 'sound_designer';
    color: string;
    isOnline: boolean;
    pingMs: number;
    currentBarPosition: number;
}
export interface LiveCollabRoomState {
    roomId: string;
    roomName: string;
    isTransportLocked: boolean;
    liveMidiBroadcastEnabled: boolean;
    activeProducers: LiveProducerPresence[];
}
export interface ProjectState {
    projectName: string;
    projectPath: string;
    currentBranch: string;
    headCommit: string | null;
    branches: BranchInfo[];
    history: CommitNode[];
    stems: StemInfo[];
    midiTracks: MIDITrack[];
    comments: AudioComment[];
    pullRequests: PullRequest[];
    transport: DAWTransportState;
    inspectedProject?: DAWProjectInspection;
    liveSession?: LiveCollabRoomState;
    storageStats: {
        totalTrackedFiles: number;
        totalSizeBytes: number;
        dedupStorageBytes: number;
        savingsPercentage: number;
    };
    cloudSyncStatus: {
        isSynced: boolean;
        pendingUploads: number;
        pendingDownloads: number;
        lastSyncedAt: string | null;
        endpoint: string;
    };
}
export type IPCMessageType = 'CLIENT_HELLO' | 'PROJECT_STATE_UPDATE' | 'DAW_TRANSPORT_SYNC' | 'CREATE_COMMIT' | 'CHECKOUT_BRANCH' | 'CREATE_BRANCH' | 'ADD_AUDIO_COMMENT' | 'RESOLVE_AUDIO_COMMENT' | 'AB_LISTEN_SWITCH' | 'REQUEST_DIFF' | 'DIFF_RESPONSE' | 'FREEZE_STEM' | 'TRIGGER_CLOUD_SYNC' | 'CREATE_PULL_REQUEST' | 'MERGE_PULL_REQUEST' | 'JOIN_LIVE_ROOM' | 'TOGGLE_TRANSPORT_LOCK' | 'LIVE_MIDI_NOTE';
export interface IPCMessage<T = any> {
    type: IPCMessageType;
    payload: T;
    requestId?: string;
    timestamp: number;
}
