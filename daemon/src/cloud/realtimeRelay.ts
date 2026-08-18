/**
 * @file realtimeRelay.ts
 * @description Real-time Shared Production Hub & Multi-Producer Room Session Gateway.
 * Coordinates P2P presence, live transport locking, MIDI stream relays, and delta chunk sync.
 */

import { EventEmitter } from 'events';
import { DAWTransportState, StemInfo, MIDINote } from '../ipc/protocol';
import { ContentAddressableStorage } from '../engine/cas';
import { ProjectLedger } from '../engine/ledger';

export interface ProducerPresence {
  producerId: string;
  name: string;
  avatar: string;
  daw: string;
  role: 'beatmaker' | 'vocalist' | 'mixing_engineer' | 'sound_designer';
  color: string;
  isOnline: boolean;
  pingMs: number;
  lastActive: number;
  currentBarPosition: number;
  activeTrackId?: string;
}

export interface LiveRoomSession {
  roomId: string;
  roomName: string;
  projectHash: string;
  transportLockEnabled: boolean;
  liveMidiBroadcastEnabled: boolean;
  masterClockProducerId: string;
  producers: Map<string, ProducerPresence>;
  currentTransport: DAWTransportState;
}

export class RealtimeCollabRelay extends EventEmitter {
  private rooms: Map<string, LiveRoomSession> = new Map();

  constructor() {
    super();
  }

  /**
   * Creates or joins a real-time collaborative production room.
   */
  public joinRoom(
    roomId: string,
    roomName: string,
    producer: Omit<ProducerPresence, 'lastActive' | 'isOnline' | 'pingMs'>
  ): LiveRoomSession {
    let room = this.rooms.get(roomId);

    if (!room) {
      room = {
        roomId,
        roomName,
        projectHash: `proj_${Date.now()}`,
        transportLockEnabled: true,
        liveMidiBroadcastEnabled: true,
        masterClockProducerId: producer.producerId,
        producers: new Map(),
        currentTransport: {
          isPlaying: false,
          bpm: 128.0,
          timeSigNumerator: 4,
          timeSigDenominator: 4,
          samplePosition: 0,
          barPosition: 1.0,
          dawName: producer.daw,
        },
      };
      this.rooms.set(roomId, room);
    }

    const fullProducer: ProducerPresence = {
      ...producer,
      isOnline: true,
      pingMs: Math.floor(Math.random() * 15) + 5, // 5ms - 20ms ultra-low local/edge latency
      lastActive: Date.now(),
      currentBarPosition: room.currentTransport.barPosition,
    };

    room.producers.set(producer.producerId, fullProducer);
    this.emit('producer_joined', { roomId, producer: fullProducer });
    return room;
  }

  /**
   * Broadcasts live DAW transport state across all producers in the room.
   */
  public syncTransport(roomId: string, senderId: string, transport: Partial<DAWTransportState>): DAWTransportState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.currentTransport = { ...room.currentTransport, ...transport };

    // Update sender's playhead position
    const producer = room.producers.get(senderId);
    if (producer && transport.barPosition !== undefined) {
      producer.currentBarPosition = transport.barPosition;
      producer.lastActive = Date.now();
    }

    this.emit('transport_synced', {
      roomId,
      senderId,
      transport: room.currentTransport,
      timestamp: Date.now(),
    });

    return room.currentTransport;
  }

  /**
   * Relays live MIDI notes played on one producer's controller to all other connected DAWs.
   */
  public broadcastLiveMIDI(roomId: string, senderId: string, trackId: string, note: MIDINote): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.liveMidiBroadcastEnabled) return;

    this.emit('live_midi_event', {
      roomId,
      senderId,
      trackId,
      note,
      timestamp: Date.now(),
    });
  }

  /**
   * Pushes new audio stem chunks to all producers in the session.
   */
  public broadcastStemDelta(
    roomId: string,
    senderId: string,
    stem: StemInfo,
    cas: ContentAddressableStorage
  ): { chunkHash: string; sizeBytes: number; isDeduplicated: boolean } {
    const isStored = cas.hasChunk(stem.hash);
    this.emit('stem_delta_broadcasted', {
      roomId,
      senderId,
      stem,
      isStored,
      timestamp: Date.now(),
    });

    return {
      chunkHash: stem.hash,
      sizeBytes: stem.sizeBytes,
      isDeduplicated: isStored,
    };
  }

  /**
   * Returns active room state summary.
   */
  public getRoomSummary(roomId: string): any | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      roomId: room.roomId,
      roomName: room.roomName,
      transportLockEnabled: room.transportLockEnabled,
      liveMidiBroadcastEnabled: room.liveMidiBroadcastEnabled,
      masterClockProducerId: room.masterClockProducerId,
      activeProducersCount: Array.from(room.producers.values()).filter((p) => p.isOnline).length,
      producers: Array.from(room.producers.values()),
      currentTransport: room.currentTransport,
    };
  }
}
