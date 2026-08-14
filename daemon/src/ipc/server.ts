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
} from './protocol';
import { ProjectLedger } from '../engine/ledger';
import { ContentAddressableStorage } from '../engine/cas';

export class DaemonIPCServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
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
  ) {}

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
        // Forward A/B toggle switch directly to all plugin audio processors
        this.broadcast({
          type: 'AB_LISTEN_SWITCH',
          payload: msg.payload,
          timestamp: Date.now(),
        });
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

    return {
      projectName: 'Cyberpunk Bassline - Session',
      projectPath: this.projectRoot,
      currentBranch: this.ledger.getCurrentBranch(),
      headCommit: this.ledger.getHeadCommitHash(),
      branches,
      history,
      stems: head ? head.stems : [],
      comments: head ? head.comments : [],
      transport: this.currentTransport,
      storageStats: {
        totalTrackedFiles: allReferences.length,
        totalSizeBytes: metrics.totalReferencedBytes,
        dedupStorageBytes: metrics.uniqueStoredBytes,
        savingsPercentage: metrics.savingsPercentage,
      },
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
