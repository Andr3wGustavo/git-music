/**
 * @file LiveCollabRoomModal.tsx
 * @description In-DAW Real-Time Collaborative Room Session & Live Producer Presence Hub.
 * Shows connected producers across DAWs, latency pings, transport locking, and shared jam controls.
 */

import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import { Users, Radio, Lock, Unlock, Copy, Check, Music, Activity, ShieldCheck, X } from 'lucide-react';

interface LiveCollabRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveCollabRoomModal: React.FC<LiveCollabRoomModalProps> = ({ isOpen, onClose }) => {
  const { projectState } = useIPC();
  const [copied, setCopied] = useState(false);
  const [transportLock, setTransportLock] = useState(true);

  if (!isOpen) return null;

  const liveSession = projectState.liveSession;
  const producers = liveSession?.activeProducers || [
    {
      producerId: 'prod_alex',
      name: 'Alex (Lead Producer)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      daw: 'FL Studio 21',
      role: 'beatmaker' as const,
      color: '#FF5500',
      isOnline: true,
      pingMs: 8,
      currentBarPosition: 16.0,
    },
    {
      producerId: 'prod_sarah',
      name: 'Sarah (Vocalist & Mix)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      daw: 'Ableton Live 11',
      role: 'vocalist' as const,
      color: '#0070F3',
      isOnline: true,
      pingMs: 14,
      currentBarPosition: 16.0,
    },
  ];

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('git-music://join-room/cyberpunk-studio-session-live');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-[#080808] border-2 border-[#222] shadow-2xl p-5 space-y-4 font-mono text-white select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Sessão Colaborativa em Tempo Real
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] font-bold">
                  {producers.filter((p) => p.isOnline).length} PRODUTORES ONLINE
                </span>
              </div>
              <p className="text-[11px] text-[#777]">
                P2P Low-Latency Hub • Sincronização direta de Playhead, Stems e MIDI entre DAWs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#777] hover:text-white hover:bg-[#181818] transition-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Info & Transport Lock Strip */}
        <div className="bg-black border border-[#1a1a1a] p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase text-[#666] block font-bold">SALA ATIVA:</span>
            <span className="text-xs font-bold text-[#FF5500]">#cyberpunk-studio-session</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTransportLock(!transportLock)}
              className={`flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold uppercase border transition-none ${
                transportLock
                  ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                  : 'bg-[#141414] border-[#333] text-[#888]'
              }`}
              title="Quando ativo, dar Play no FL Studio dá Play simultâneo no Ableton do parceiro"
            >
              {transportLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{transportLock ? 'PLAYHEAD SINCRONIZADO' : 'PLAYHEAD INDEPENDENTE'}</span>
            </button>

            <button
              onClick={handleCopyInvite}
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#141414] border border-[#2a2a2a] hover:border-[#FF5500] text-[10px] text-white transition-none uppercase font-bold"
            >
              {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#FF5500]" />}
              <span>{copied ? 'LINK COPIADO!' : 'CONVIDAR PRODUTOR'}</span>
            </button>
          </div>
        </div>

        {/* Active Producers List */}
        <div className="space-y-2">
          <span className="text-[9px] uppercase font-bold text-[#666] block px-1">
            PRODUTORES CONECTADOS NO MASTER BUS
          </span>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
            {producers.map((prod) => (
              <div
                key={prod.producerId}
                className="bg-black border border-[#1a1a1a] p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={prod.avatar}
                      alt={prod.name}
                      className="w-8 h-8 rounded-none border border-[#333] object-cover"
                    />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-none border border-black"
                      style={{ backgroundColor: prod.color }}
                    ></span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{prod.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#141414] border border-[#282828] text-[#0099FF]">
                        {prod.daw}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#666] flex items-center space-x-2 mt-0.5">
                      <span className="capitalize">{prod.role.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Posição: Bar {prod.currentBarPosition.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-right">
                  <div className="text-[10px] font-mono">
                    <div className="flex items-center space-x-1 text-[#10B981]">
                      <Activity className="w-3 h-3" />
                      <span className="font-bold">{prod.pingMs} ms</span>
                    </div>
                    <span className="text-[8px] text-[#555] uppercase">ULTRA LOW LATENCY</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[9px] text-[#666] border-t border-[#181818] pt-2 flex items-center justify-between">
          <span>Sincronização P2P direta com criptografia ponta a ponta</span>
          <span className="text-[#FF5500] font-bold">GIT-MUSIC ENGINE v0.1.0</span>
        </div>
      </div>
    </div>
  );
};
