/**
 * @file server.ts
 * @description WebSocket IPC Server for low-latency communication with In-DAW Plugin and Web UI.
 * Integrates RealtimeCollabRelay, ContentAddressableStorage, Ledger DAG, and DAWAutoDetector.
 */
import { WebSocket } from 'ws';
import { IPCMessage, ProjectState } from './protocol';
import { ProjectLedger } from '../engine/ledger';
import { ContentAddressableStorage } from '../engine/cas';
export declare class DaemonIPCServer {
    private port;
    private ledger;
    private cas;
    private projectRoot;
    private wss;
    private clients;
    private cloudGateway;
    private collabRelay;
    private pullRequests;
    private currentTransport;
    constructor(port: number, ledger: ProjectLedger, cas: ContentAddressableStorage, projectRoot: string);
    private seedInitialPullRequests;
    private seedLiveCollabRoom;
    start(): void;
    private handleIncomingMessage;
    assembleProjectState(): ProjectState;
    broadcastProjectState(): void;
    broadcast(message: IPCMessage, exclude?: WebSocket): void;
    sendTo(client: WebSocket, message: IPCMessage): void;
    stop(): void;
}
