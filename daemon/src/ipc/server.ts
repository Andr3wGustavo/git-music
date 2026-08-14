/**
 * @file server.ts
 * @description WebSocket IPC Server for low-latency communication with In-DAW Plugin and Web UI.
 */

import { WebSocketServer, WebSocket } from 'ws';
import {
  IPCMessage,
  ProjectState,
  DAWTransportState,
  CommitNode,
  StemInfo,
  PullRequest,
  MIDITrack,
} from './protocol';
import { ProjectLedger } from '../engine/ledger';
import { ContentAddressableStorage } from '../engine/cas';
import { CloudCASSyncGateway } from '../cloud/cloudSync';
import { StemMergeEngine } from '../cloud/mergeEngine';
import { ProjectInspector } from '../parsers/inspector';

export class DaemonIPCServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private cloudGateway: CloudCASSyncGateway;
  private pullRequests: PullRequest[] = [];
  private currentTransport: DAWTransportState = {
    isPlaying: false,
    bpm: 128.0,
    timeSigNumerator: 4,
    timeSigDenominator: 4,
    samplePosition: 0,
    barPosition: 1.0,
    dawName: 'FL Studio 21',
  };

  constructor(
    private port: number,
    private ledger: ProjectLedger,
    private cas: ContentAddressableStorage,
    private projectRoot: string
  ) {
    this.cloudGateway = new CloudCASSyncGateway();
    this.seedInitialPullRequests();
  }

  private seedInitialPullRequests(): void {
    this.pullRequests.push({
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
    });
  }

  public start(): void {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[IPC Server] Client connected. Total active connections: ${this.clients.size}`);

      // Send initial full project state immediately
      this.sendTo(ws, {
        type: 'PROJECT_STATE_UPDATE',
        payload: this.assembleProjectState(),
        timestamp: Date.now(),
      });

      ws.on('message', (raw: string) => {
        try {
          const message: IPCMessage = JSON.parse(raw.toString());
          this.handleIncomingMessage(ws, message);
        } catch (e) {
          console.error('[IPC Server] Malformed JSON received:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[IPC Server] Client disconnected. Active connections: ${this.clients.size}`);
      });
    });

    console.log(`[IPC Server] Listening for DAW Plugin & UI on ws://127.0.0.1:${this.port}`);
  }

  private handleIncomingMessage(sender: WebSocket, msg: IPCMessage): void {
    switch (msg.type) {
      case 'CLIENT_HELLO':
        this.sendTo(sender, {
          type: 'PROJECT_STATE_UPDATE',
          payload: this.assembleProjectState(),
          timestamp: Date.now(),
        });
        break;

      case 'DAW_TRANSPORT_SYNC':
        this.currentTransport = { ...this.currentTransport, ...msg.payload };
        this.broadcast({
          type: 'DAW_TRANSPORT_SYNC',
          payload: this.currentTransport,
          timestamp: Date.now(),
        }, sender);
        break;

      case 'CREATE_COMMIT': {
        const commit = this.ledger.createCommit(msg.payload);
        console.log(`[IPC Server] New Commit created: [${commit.hash}] "${commit.message}" on branch "${commit.branch}"`);
        this.broadcastProjectState();
        break;
      }

      case 'CREATE_BRANCH': {
        this.ledger.createBranch(msg.payload.branchName);
        console.log(`[IPC Server] Created new branch: "${msg.payload.branchName}"`);
        this.broadcastProjectState();
        break;
      }

      case 'CHECKOUT_BRANCH': {
        this.ledger.checkoutBranch(msg.payload.branchName);
        console.log(`[IPC Server] Switched active branch to: "${msg.payload.branchName}"`);
        this.broadcastProjectState();
        break;
      }

      case 'ADD_AUDIO_COMMENT': {
        this.ledger.addCommentToHead(msg.payload);
        this.broadcastProjectState();
        break;
      }

      case 'RESOLVE_AUDIO_COMMENT': {
        this.ledger.resolveComment(msg.payload.commentId);
        this.broadcastProjectState();
        break;
      }

      case 'AB_LISTEN_SWITCH': {
        this.broadcast({
          type: 'AB_LISTEN_SWITCH',
          payload: msg.payload,
          timestamp: Date.now(),
        });
        break;
      }

      case 'TRIGGER_CLOUD_SYNC': {
        const history = this.ledger.getHistory();
        const hashes = history.flatMap((c) => c.stems.map((s) => s.hash));
        this.cloudGateway.pushChunks(this.cas, hashes).then(() => {
          this.broadcastProjectState();
        });
        break;
      }

      case 'MERGE_PULL_REQUEST': {
        const pr = this.pullRequests.find((p) => p.id === msg.payload.prId);
        if (pr) {
          pr.status = 'merged';
          const history = this.ledger.getHistory();
          const targetCommit = history.find((c) => c.branch === pr.targetBranch) || history[0];
          const sourceCommit = history.find((c) => c.branch === pr.sourceBranch) || history[0];

          const mergePlan = StemMergeEngine.analyzeMerge(sourceCommit, targetCommit);
          StemMergeEngine.executeMerge(this.ledger, mergePlan, pr.author);
          console.log(`[IPC Server] Successfully merged PR "${pr.title}"`);
          this.broadcastProjectState();
        }
        break;
      }
    }
  }

  public assembleProjectState(): ProjectState {
    const head = this.ledger.getHeadCommit();
    const history = this.ledger.getHistory();
    const branches = this.ledger.getBranches();

    // Accumulate all stem references across history to compute CAS savings
    const allReferences: { hash: string; sizeBytes: number }[] = [];
    for (const c of history) {
      for (const s of c.stems) {
        allReferences.push({ hash: s.hash, sizeBytes: s.sizeBytes });
      }
    }

    const metrics = this.cas.getStorageMetrics(allReferences);
    const syncStatus = this.cloudGateway.getStatusSummary(allReferences.length);

    // Default MIDI tracks if head doesn't have custom midi
    const defaultMidiTracks: MIDITrack[] = [
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
    ];

    return {
      projectName: 'Cyberpunk Bassline - Session',
      projectPath: this.projectRoot,
      currentBranch: this.ledger.getCurrentBranch(),
      headCommit: this.ledger.getHeadCommitHash(),
      branches,
      history,
      stems: head ? head.stems : [],
      midiTracks: head?.midiTracks || defaultMidiTracks,
      comments: head ? head.comments : [],
      pullRequests: this.pullRequests,
      transport: this.currentTransport,
      storageStats: {
        totalTrackedFiles: allReferences.length,
        totalSizeBytes: metrics.totalReferencedBytes,
        dedupStorageBytes: metrics.uniqueStoredBytes,
        savingsPercentage: metrics.savingsPercentage,
      },
      cloudSyncStatus: syncStatus,
    };
  }

  public broadcastProjectState(): void {
    const state = this.assembleProjectState();
    this.broadcast({
      type: 'PROJECT_STATE_UPDATE',
      payload: state,
      timestamp: Date.now(),
    });
  }

  public broadcast(message: IPCMessage, exclude?: WebSocket): void {
    const serialized = JSON.stringify(message);
    for (const client of this.clients) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  public sendTo(client: WebSocket, message: IPCMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}
