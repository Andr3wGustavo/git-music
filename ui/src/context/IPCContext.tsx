import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface MIDINote {
  id: string;
  pitch: number; // 0-127 (e.g. 60 = Middle C)
  startBar: number; // 1.0, 1.25, 2.5
  durationBars: number; // 0.25, 1.0
  velocity: number; // 0-127
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
    dawType: string;
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

export type ABMode = 'live' | 'snapshot';

interface IPCContextType {
  isConnected: boolean;
  projectState: ProjectState;
  abMode: ABMode;
  crossfade: number; // 0.0 = Live DAW, 1.0 = Target Snapshot
  selectedCommit: CommitNode | null;
  activeView: 'waveform' | 'piano_roll';
  setActiveView: (view: 'waveform' | 'piano_roll') => void;
  setSelectedCommit: (commit: CommitNode | null) => void;
  setABMode: (mode: ABMode) => void;
  setCrossfade: (val: number) => void;
  togglePlay: () => void;
  createCommit: (message: string, author: string) => void;
  createBranch: (branchName: string) => void;
  checkoutBranch: (branchName: string) => void;
  addComment: (message: string, barPosition: number) => void;
  resolveComment: (commentId: string) => void;
  toggleMuteStem: (stemId: string) => void;
  toggleSoloStem: (stemId: string) => void;
  toggleFreezeStem: (stemId: string) => void;
  triggerCloudSync: () => void;
  mergePullRequest: (prId: string) => void;
}

const DEFAULT_STATE: ProjectState = {
  projectName: 'Cyberpunk Bassline (Session)',
  projectPath: 'A:/MusicProjects/FL_Projects/Cyberpunk_Bassline',
  currentBranch: 'main',
  headCommit: '02a8b9f',
  branches: [
    { name: 'main', headCommitHash: '02a8b9f', isCurrent: true, author: 'Alex (Producer)', lastUpdated: '10 mins ago' },
    { name: 'feat/guitar-solo-take3', headCommitHash: '01c4d7e', isCurrent: false, author: 'Diego (Guitarist)', lastUpdated: '1 hour ago' },
    { name: 'mix-master-loudness', headCommitHash: '03e5f2a', isCurrent: false, author: 'Sarah (Mastering)', lastUpdated: '3 hours ago' },
  ],
  history: [
    {
      hash: '02a8b9f',
      parentHash: '01c4d7e',
      branch: 'main',
      message: 'mix(vocals): Apply FabFilter Pro-Q3 cut & Melodyne pitch correction on hook',
      author: 'Sarah (Vocalist & Mix)',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      dawProject: { fileName: 'Cyberpunk_Bassline_v2.flp', fileHash: 'flp_002', dawType: 'flp', bpm: 128 },
      stems: [
        { id: '1', name: '01_Kick_808_Punch.wav', relativePath: 'Audio/01_Kick_808_Punch.wav', sizeBytes: 14500000, hash: 'h1', durationSeconds: 180, sampleRate: 44100, channels: 2 },
        { id: '2', name: '02_Serum_ReeseBass_Drop.wav', relativePath: 'Audio/02_Serum_ReeseBass_Drop.wav', sizeBytes: 28200000, hash: 'h2', durationSeconds: 180, sampleRate: 44100, channels: 2, missingPlugin: 'Xfer Serum v1.36b', isFrozen: true },
        { id: '3', name: '03_Lead_CyberArp_Sidechained.wav', relativePath: 'Audio/03_Lead_CyberArp_Sidechained.wav', sizeBytes: 22100000, hash: 'h3', durationSeconds: 180, sampleRate: 44100, channels: 2 },
        { id: '4', name: '04_VocalHook_Autotune_Cleaned.wav', relativePath: 'Audio/04_VocalHook_Autotune_Cleaned.wav', sizeBytes: 19800000, hash: 'h4', durationSeconds: 180, sampleRate: 44100, channels: 2 },
      ],
      comments: [
        { id: 'c1', author: 'Sarah (Vocalist & Mix)', timestampSeconds: 45.5, barPosition: 16.2, message: 'Ajustei o de-esser no refrão para tirar a sibilância!', createdAt: new Date(Date.now() - 3600000).toISOString(), resolved: false },
        { id: 'c2', author: 'Alex (Lead Producer)', timestampSeconds: 64.0, barPosition: 32.0, message: 'O drop no compasso 32 está monstruoso 🔥.', createdAt: new Date(Date.now() - 1800000).toISOString(), resolved: false },
      ],
      totalSizeBytes: 84600000,
      dedupSavedBytes: 64800000,
    },
  ],
  stems: [
    { id: '1', name: '01_Kick_808_Punch.wav', relativePath: 'Audio/01_Kick_808_Punch.wav', sizeBytes: 14500000, hash: 'h1', durationSeconds: 180, sampleRate: 44100, channels: 2 },
    { id: '2', name: '02_Serum_ReeseBass_Drop.wav', relativePath: 'Audio/02_Serum_ReeseBass_Drop.wav', sizeBytes: 28200000, hash: 'h2', durationSeconds: 180, sampleRate: 44100, channels: 2, missingPlugin: 'Xfer Serum v1.36b', isFrozen: true },
    { id: '3', name: '03_Lead_CyberArp_Sidechained.wav', relativePath: 'Audio/03_Lead_CyberArp_Sidechained.wav', sizeBytes: 22100000, hash: 'h3', durationSeconds: 180, sampleRate: 44100, channels: 2 },
    { id: '4', name: '04_VocalHook_Autotune_Cleaned.wav', relativePath: 'Audio/04_VocalHook_Autotune_Cleaned.wav', sizeBytes: 19800000, hash: 'h4', durationSeconds: 180, sampleRate: 44100, channels: 2 },
  ],
  midiTracks: [
    {
      id: 'tr_bass',
      name: '02_Serum_ReeseBass (MIDI)',
      color: '#00FF66',
      instrument: 'Serum Sub-Bass',
      notes: [
        { id: 'm1', pitch: 36, startBar: 1.0, durationBars: 1.5, velocity: 110, diffStatus: 'unchanged' },
        { id: 'm2', pitch: 36, startBar: 2.5, durationBars: 0.5, velocity: 115, diffStatus: 'unchanged' },
        { id: 'm3', pitch: 39, startBar: 3.0, durationBars: 1.0, velocity: 120, diffStatus: 'modified' },
        { id: 'm4', pitch: 41, startBar: 4.0, durationBars: 0.75, velocity: 125, diffStatus: 'added' },
      ],
    },
    {
      id: 'tr_lead',
      name: '03_Lead_CyberArp (MIDI)',
      color: '#00F0FF',
      instrument: 'Vital Synth Arp',
      notes: [
        { id: 'm5', pitch: 60, startBar: 1.0, durationBars: 0.25, velocity: 95, diffStatus: 'unchanged' },
        { id: 'm6', pitch: 63, startBar: 1.25, durationBars: 0.25, velocity: 100, diffStatus: 'unchanged' },
        { id: 'm7', pitch: 67, startBar: 1.5, durationBars: 0.5, velocity: 105, diffStatus: 'added' },
        { id: 'm8', pitch: 72, startBar: 2.0, durationBars: 0.5, velocity: 110, diffStatus: 'added' },
        { id: 'm9', pitch: 58, startBar: 2.75, durationBars: 0.25, velocity: 90, diffStatus: 'removed' },
      ],
    },
  ],
  comments: [
    { id: 'c1', author: 'Sarah (Vocalist & Mix)', timestampSeconds: 45.5, barPosition: 16.2, message: 'Ajustei o de-esser no refrão para tirar a sibilância!', createdAt: new Date(Date.now() - 3600000).toISOString(), resolved: false },
    { id: 'c2', author: 'Alex (Lead Producer)', timestampSeconds: 64.0, barPosition: 32.0, message: 'O drop no compasso 32 está monstruoso 🔥.', createdAt: new Date(Date.now() - 1800000).toISOString(), resolved: false },
  ],
  pullRequests: [
    {
      id: 'pr_001',
      sourceBranch: 'feat/guitar-solo-take3',
      targetBranch: 'main',
      title: 'feat(stems): Add Gibson Les Paul Overdriven Guitar Solo on Drop',
      description: 'Recorded live 24-bit 48kHz guitar solo over compass 32 to 48 with tube preamp emulation.',
      author: 'Diego (Guitarist)',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'open',
      commitsCount: 2,
      stemChanges: [
        {
          stemId: 'stem_guitar',
          name: '05_GuitarSolo_Lead_Overdrive.wav',
          action: 'added',
          spectralCollision: {
            frequencyRange: '1.8 kHz - 3.2 kHz',
            withStem: '04_VocalHook_Autotune_Cleaned.wav',
            severity: 'low',
            suggestion: 'Slight notch EQ at 2.4 kHz recommended to clear space for lead vocal hook.',
          },
          lufsDelta: 1.4,
        },
      ],
    },
  ],
  transport: {
    isPlaying: false,
    bpm: 128.0,
    timeSigNumerator: 4,
    timeSigDenominator: 4,
    samplePosition: 0,
    barPosition: 1.0,
    dawName: 'FL Studio 21',
  },
  storageStats: {
    totalTrackedFiles: 7,
    totalSizeBytes: 149400000,
    dedupStorageBytes: 84600000,
    savingsPercentage: 43,
  },
  cloudSyncStatus: {
    isSynced: false,
    pendingUploads: 2,
    pendingDownloads: 0,
    lastSyncedAt: new Date().toISOString(),
    endpoint: 'git-music-audio-chunks @ r2.git-music.io/v1',
  },
};

const IPCContext = createContext<IPCContextType | undefined>(undefined);

export const IPCProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [projectState, setProjectState] = useState<ProjectState>(DEFAULT_STATE);
  const [activeView, setActiveView] = useState<'waveform' | 'piano_roll'>('waveform');
  const [abMode, setABModeState] = useState<ABMode>('live');
  const [crossfade, setCrossfadeState] = useState<number>(0.0);
  const [selectedCommit, setSelectedCommit] = useState<CommitNode | null>(DEFAULT_STATE.history[0]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Playhead auto-tick simulation when playing
  useEffect(() => {
    let interval: any = null;
    if (projectState.transport.isPlaying) {
      interval = setInterval(() => {
        setProjectState((prev) => {
          const nextBar = prev.transport.barPosition >= 64 ? 1.0 : prev.transport.barPosition + 0.125;
          return {
            ...prev,
            transport: {
              ...prev.transport,
              barPosition: parseFloat(nextBar.toFixed(3)),
              samplePosition: Math.floor(nextBar * 22050),
            },
          };
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [projectState.transport.isPlaying]);

  // Connect to Local Daemon WebSocket
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        socket = new WebSocket('ws://127.0.0.1:4848');

        socket.onopen = () => {
          setIsConnected(true);
          console.log('[IPC] Connected to Git-Music Daemon');
          socket?.send(JSON.stringify({ type: 'CLIENT_HELLO', payload: {}, timestamp: Date.now() }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PROJECT_STATE_UPDATE') {
              setProjectState(data.payload);
              if (data.payload.history && data.payload.history.length > 0) {
                setSelectedCommit((prev) => prev ? data.payload.history.find((c: any) => c.hash === prev.hash) || data.payload.history[0] : data.payload.history[0]);
              }
            } else if (data.type === 'DAW_TRANSPORT_SYNC') {
              setProjectState((prev) => ({ ...prev, transport: { ...prev.transport, ...data.payload } }));
            }
          } catch (e) {
            console.error('[IPC] Parse error:', e);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          setIsConnected(false);
        };

        setWs(socket);
      } catch (e) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const sendIPC = (type: string, payload: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    }
  };

  const setABMode = (mode: ABMode) => {
    setABModeState(mode);
    setCrossfadeState(mode === 'live' ? 0.0 : 1.0);
    sendIPC('AB_LISTEN_SWITCH', { mode, crossfade: mode === 'live' ? 0.0 : 1.0 });
  };

  const setCrossfade = (val: number) => {
    setCrossfadeState(val);
    setABModeState(val > 0.5 ? 'snapshot' : 'live');
    sendIPC('AB_LISTEN_SWITCH', { mode: val > 0.5 ? 'snapshot' : 'live', crossfade: val });
  };

  const togglePlay = () => {
    const nextPlaying = !projectState.transport.isPlaying;
    setProjectState((prev) => ({
      ...prev,
      transport: { ...prev.transport, isPlaying: nextPlaying },
    }));
    sendIPC('DAW_TRANSPORT_SYNC', { isPlaying: nextPlaying });
  };

  const createCommit = (message: string, author: string) => {
    sendIPC('CREATE_COMMIT', {
      message,
      author,
      dawProject: {
        fileName: `${projectState.projectName.replace(/\s+/g, '_')}_v${projectState.history.length + 1}.flp`,
        fileHash: `flp_hash_${Date.now()}`,
        dawType: 'flp',
        bpm: projectState.transport.bpm,
      },
      stems: projectState.stems,
      savedBytes: 38000000,
    });
  };

  const createBranch = (branchName: string) => {
    sendIPC('CREATE_BRANCH', { branchName });
  };

  const checkoutBranch = (branchName: string) => {
    sendIPC('CHECKOUT_BRANCH', { branchName });
  };

  const addComment = (message: string, barPosition: number) => {
    sendIPC('ADD_AUDIO_COMMENT', {
      author: 'You (In-DAW)',
      barPosition,
      timestampSeconds: barPosition * 2.0,
      message,
    });
  };

  const resolveComment = (commentId: string) => {
    sendIPC('RESOLVE_AUDIO_COMMENT', { commentId });
  };

  const toggleMuteStem = (stemId: string) => {
    setProjectState((prev) => ({
      ...prev,
      stems: prev.stems.map((s) => (s.id === stemId ? { ...s, isMuted: !s.isMuted } : s)),
    }));
  };

  const toggleSoloStem = (stemId: string) => {
    setProjectState((prev) => ({
      ...prev,
      stems: prev.stems.map((s) => (s.id === stemId ? { ...s, isSolo: !s.isSolo } : s)),
    }));
  };

  const toggleFreezeStem = (stemId: string) => {
    setProjectState((prev) => ({
      ...prev,
      stems: prev.stems.map((s) => (s.id === stemId ? { ...s, isFrozen: !s.isFrozen } : s)),
    }));
  };

  const triggerCloudSync = () => {
    sendIPC('TRIGGER_CLOUD_SYNC', {});
    setProjectState((prev) => ({
      ...prev,
      cloudSyncStatus: { ...prev.cloudSyncStatus, isSynced: true, pendingUploads: 0 },
    }));
  };

  const mergePullRequest = (prId: string) => {
    sendIPC('MERGE_PULL_REQUEST', { prId });
  };

  return (
    <IPCContext.Provider
      value={{
        isConnected,
        projectState,
        abMode,
        crossfade,
        selectedCommit,
        activeView,
        setActiveView,
        setSelectedCommit,
        setABMode,
        setCrossfade,
        togglePlay,
        createCommit,
        createBranch,
        checkoutBranch,
        addComment,
        resolveComment,
        toggleMuteStem,
        toggleSoloStem,
        toggleFreezeStem,
        triggerCloudSync,
        mergePullRequest,
      }}
    >
      {children}
    </IPCContext.Provider>
  );
};

export const useIPC = () => {
  const context = useContext(IPCContext);
  if (!context) {
    throw new Error('useIPC must be used within an IPCProvider');
  }
  return context;
};
