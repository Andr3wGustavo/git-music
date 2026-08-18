/**
 * @file standaloneRelay.ts
 * @description Standalone Production WebSocket Relay & WebRTC Signaling Server.
 * Deployable to Hetzner VPS, Fly.io, or AWS ECS for global multi-producer collaboration.
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import { RealtimeCollabRelay } from './realtimeRelay';

const RELAY_PORT = parseInt(process.env.PORT || '8080', 10);

console.log('====================================================');
console.log('🌐 GIT-MUSIC GLOBAL COLLABORATION RELAY SERVER      ');
console.log('   Multi-Producer Real-Time Room & Transport Sync   ');
console.log('====================================================');

const relay = new RealtimeCollabRelay();

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'git-music-global-relay',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });
const roomSockets: Map<string, Set<WebSocket>> = new Map();

wss.on('connection', (ws: WebSocket, req) => {
  let activeRoomId: string | null = null;
  let activeProducerId: string | null = null;

  ws.on('message', (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'JOIN_ROOM') {
        const { roomId, roomName, producer } = data.payload;
        activeRoomId = roomId;
        activeProducerId = producer.producerId;

        if (!roomSockets.has(roomId)) {
          roomSockets.set(roomId, new Set());
        }
        roomSockets.get(roomId)!.add(ws);

        relay.joinRoom(roomId, roomName || 'Global Studio', producer);

        // Broadcast room presence
        broadcastToRoom(roomId, {
          type: 'ROOM_PRESENCE_UPDATE',
          payload: relay.getRoomSummary(roomId),
          timestamp: Date.now(),
        });
      } else if (data.type === 'SYNC_TRANSPORT' && activeRoomId && activeProducerId) {
        relay.syncTransport(activeRoomId, activeProducerId, data.payload);
        broadcastToRoom(activeRoomId, {
          type: 'SYNC_TRANSPORT',
          payload: data.payload,
          timestamp: Date.now(),
        }, ws);
      } else if (data.type === 'BROADCAST_STEM_DELTA' && activeRoomId) {
        broadcastToRoom(activeRoomId, data, ws);
      }
    } catch (e) {
      console.error('[Relay] Error handling message:', e);
    }
  });

  ws.on('close', () => {
    if (activeRoomId && roomSockets.has(activeRoomId)) {
      roomSockets.get(activeRoomId)!.delete(ws);
      broadcastToRoom(activeRoomId, {
        type: 'ROOM_PRESENCE_UPDATE',
        payload: relay.getRoomSummary(activeRoomId),
        timestamp: Date.now(),
      });
    }
  });
});

function broadcastToRoom(roomId: string, message: any, exclude?: WebSocket) {
  const sockets = roomSockets.get(roomId);
  if (!sockets) return;
  const serialized = JSON.stringify(message);
  for (const client of sockets) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(serialized);
    }
  }
}

server.listen(RELAY_PORT, () => {
  console.log(`[Relay Server] Listening on http/ws port: ${RELAY_PORT}`);
  console.log(`[Health Endpoint] http://localhost:${RELAY_PORT}/health`);
});
