/**
 * @file CompactPluginHUD.tsx
 * @description Pure Black, Minimalist Square-Hardware In-DAW VST Plugin Interface.
 * Built with Industrial Orange & Electric Blue accents, square tactile controls, and producer collaboration hub.
 */

import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import {
  Camera,
  Play,
  Square,
  Sliders,
  Check,
  Clock,
  GitBranch,
  Cloud,
  Layers,
  Award,
  Users,
  Copy,
} from 'lucide-react';
import { WebAudioEngine } from '../audio/WebAudioEngine';
import { VUMeter } from './VUMeter';
import { SplitSheetModal } from './SplitSheetModal';

export const CompactPluginHUD: React.FC = () => {
  const {
    projectState,
    abMode,
    crossfade,
    setABMode,
    setCrossfade,
    togglePlay,
    createCommit,
    checkoutBranch,
    createBranch,
    triggerCloudSync,
    selectedCommit,
  } = useIPC();

  const [quickMessage, setQuickMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSplitSheetOpen, setIsSplitSheetOpen] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [showCollab, setShowCollab] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const transport = projectState.transport;

  const handleQuickSnapshot = () => {
    if (!quickMessage.trim()) return;
    createCommit(quickMessage.trim(), 'Alex (Lead Producer)');
    setQuickMessage('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePlayToggle = async () => {
    const audioEngine = WebAudioEngine.getInstance();
    if (!transport.isPlaying) {
      audioEngine.setBpm(transport.bpm);
      await audioEngine.start();
    } else {
      audioEngine.stop();
    }
    togglePlay();
  };

  const handleCrossfade = (val: number) => {
    setCrossfade(val);
    WebAudioEngine.getInstance().setCrossfade(val);
  };

  const handleCloudSync = () => {
    setIsSyncing(true);
    triggerCloudSync();
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const handleCopyCollabLink = () => {
    navigator.clipboard.writeText('git-music://project/cyberpunk-bassline-flp');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-[440px] mx-auto bg-black border-2 border-[#1a1a1a] rounded-none shadow-2xl overflow-hidden font-mono text-white select-none">
      {/* Top Header Bar: Pure Black with Orange & Blue Indicators */}
      <div className="bg-[#050505] border-b border-[#1a1a1a] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-none bg-[#FF5500]"></div>
          <span className="text-xs font-bold tracking-widest text-white uppercase font-mono">
            GIT-MUSIC <span className="text-[#FF5500]">VST3</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-none bg-black border border-[#262626] hover:border-[#0070F3] hover:text-[#0099FF] text-[10px] text-[#a3a3a3] transition-none uppercase"
          >
            <Cloud className={`w-3 h-3 ${isSyncing ? 'text-[#0099FF] animate-spin' : 'text-[#737373]'}`} />
            <span>{isSyncing ? 'SYNCING...' : 'R2 CLOUD'}</span>
          </button>
          <div className="w-2 h-2 rounded-none bg-[#0070F3]"></div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3 space-y-2.5 bg-black">
        {/* 1. OLED Display Screen (Pure Jet Black, High Contrast) */}
        <div className="bg-[#050505] border border-[#1a1a1a] rounded-none p-2.5">
          <div className="flex items-center justify-between text-[10px] text-[#737373] border-b border-[#141414] pb-1 mb-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-[#FF5500]"></span>
              <span className="text-[#e5e5e5] font-bold uppercase">{projectState.transport.dawName || 'FL STUDIO 21'}</span>
            </div>
            <div className="text-[#0099FF] font-bold">
              {transport.bpm.toFixed(1)} BPM • {transport.timeSigNumerator}/{transport.timeSigDenominator}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[8px] uppercase text-[#525252] block leading-none mb-0.5">
                BRANCH ATIVA
              </span>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <GitBranch className="w-3 h-3 text-[#FF5500]" />
                <span className="text-[#FF5500] font-bold">{projectState.currentBranch}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8px] uppercase text-[#525252] block leading-none mb-0.5">
                ECONOMIA DE SSD
              </span>
              <span className="text-xs font-bold text-[#0099FF]">
                {projectState.storageStats.savingsPercentage}% CAS
              </span>
            </div>
          </div>
        </div>

        {/* 2. Quick Snapshot Bar (Square Minimalist Input & Button) */}
        <div className="bg-[#050505] border border-[#1a1a1a] rounded-none p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#737373]">
            <span>📸 SALVAR SNAPSHOT</span>
            <span className="text-[#525252]">AUTO-DEDUPLICADO</span>
          </div>

          <div className="flex space-x-1.5">
            <input
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickSnapshot()}
              placeholder="Descreva a alteração no beat..."
              className="flex-1 bg-black border border-[#262626] rounded-none px-2.5 py-1 text-xs text-white placeholder:text-[#525252] focus:outline-none focus:border-[#FF5500] transition-none"
            />
            <button
              onClick={handleQuickSnapshot}
              className={`px-3 py-1 rounded-none text-xs font-bold transition-none flex items-center space-x-1 shrink-0 uppercase ${
                isSaved
                  ? 'bg-[#FF5500] text-black border border-[#FF5500]'
                  : 'bg-[#FF5500] hover:bg-[#ff6600] active:bg-[#cc4400] text-black font-extrabold border border-[#FF5500]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>SALVO!</span>
                </>
              ) : (
                <>
                  <Camera className="w-3 h-3" />
                  <span>SALVAR</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. A/B Audio Switcher & Stereo VU Meter */}
        <div className="bg-[#050505] border border-[#1a1a1a] rounded-none p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#0099FF]" />
              <span className="text-[10px] font-bold text-[#e5e5e5] uppercase">
                A/B COMPARADOR DE ÁUDIO
              </span>
            </div>

            {/* Square Play Button */}
            <button
              onClick={handlePlayToggle}
              className={`w-6 h-6 rounded-none flex items-center justify-center transition-none border ${
                transport.isPlaying
                  ? 'bg-[#FF5500] text-black border-[#FF5500]'
                  : 'bg-black text-white hover:border-[#0099FF] hover:text-[#0099FF] border-[#262626]'
              }`}
            >
              {transport.isPlaying ? (
                <Square className="w-2.5 h-2.5 fill-current" />
              ) : (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5 text-[#0099FF]" />
              )}
            </button>
          </div>

          {/* Real-time Hardware Square VU Meter */}
          <VUMeter compact={true} />

          {/* Live vs Snapshot Square Switcher Buttons */}
          <div className="grid grid-cols-2 gap-1 bg-black p-1 border border-[#1a1a1a] text-[10px]">
            <button
              onClick={() => {
                setABMode('live');
                handleCrossfade(0.0);
              }}
              className={`py-1 rounded-none text-center font-bold uppercase transition-none border ${
                abMode === 'live'
                  ? 'bg-[#FF5500] text-black border-[#FF5500]'
                  : 'bg-black text-[#737373] hover:text-white border-transparent'
              }`}
            >
              (A) FL LIVE MASTER
            </button>
            <button
              onClick={() => {
                setABMode('snapshot');
                handleCrossfade(1.0);
              }}
              className={`py-1 rounded-none text-center font-bold uppercase transition-none border ${
                abMode === 'snapshot'
                  ? 'bg-[#0070F3] text-white border-[#0070F3]'
                  : 'bg-black text-[#737373] hover:text-white border-transparent'
              }`}
            >
              (B) [{selectedCommit ? selectedCommit.hash.substring(0, 5) : 'SNAPSHOT'}]
            </button>
          </div>

          {/* Square Minimalist Crossfader Slider */}
          <div className="flex items-center space-x-2 pt-0.5">
            <span className="text-[8px] text-[#FF5500] font-bold">A (LIVE)</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={crossfade}
              onChange={(e) => handleCrossfade(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-[#FF5500] h-1 bg-[#141414] rounded-none"
            />
            <span className="text-[8px] text-[#0099FF] font-bold">B (SNAP)</span>
          </div>
        </div>

        {/* 4. Recent Version History List (Square Row Layout) */}
        <div className="bg-[#050505] border border-[#1a1a1a] rounded-none p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#737373]">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[#525252]" />
              <span>HISTÓRICO DE VERSÕES</span>
            </div>
            <span className="text-[#525252]">{projectState.history.length} COMMITS</span>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
            {projectState.history.map((commit, idx) => (
              <div
                key={commit.hash}
                className={`flex items-center justify-between p-1.5 rounded-none border text-[10px] transition-none ${
                  idx === 0
                    ? 'bg-black border-[#FF5500]/60 text-white'
                    : 'bg-black border-[#1a1a1a] text-[#a3a3a3] hover:border-[#262626]'
                }`}
              >
                <div className="truncate mr-2">
                  <div className="font-bold truncate text-[10px] leading-tight text-white">
                    {commit.message}
                  </div>
                  <div className="text-[8px] text-[#525252] flex items-center gap-1.5 mt-0.5 uppercase">
                    <span>{commit.author.split(' ')[0]}</span>
                    <span>•</span>
                    <span className="text-[#0099FF]">{commit.hash.substring(0, 6)}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {idx === 0 ? (
                    <span className="px-1.5 py-0.5 rounded-none bg-[#FF5500] text-black text-[8px] font-bold">
                      ATUAL
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setABMode('snapshot');
                        handleCrossfade(1.0);
                      }}
                      className="px-1.5 py-0.5 rounded-none bg-black hover:bg-[#0070F3] hover:text-white text-[#0099FF] text-[8px] font-bold border border-[#0070F3]/40 transition-none uppercase"
                    >
                      OUVIR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Footer Quick Action Hub */}
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          <button
            onClick={() => setShowCollab(!showCollab)}
            className={`flex items-center justify-center space-x-1 py-1 rounded-none border text-[9px] font-bold transition-none uppercase ${
              showCollab
                ? 'bg-[#0070F3] text-white border-[#0070F3]'
                : 'bg-black border-[#262626] hover:border-[#0070F3] text-[#0099FF]'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>PRODUTORES</span>
          </button>

          <button
            onClick={() => setShowBranches(!showBranches)}
            className={`flex items-center justify-center space-x-1 py-1 rounded-none border text-[9px] font-bold transition-none uppercase ${
              showBranches
                ? 'bg-[#FF5500] text-black border-[#FF5500]'
                : 'bg-black border-[#262626] hover:border-[#FF5500] text-[#FF5500]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>BRANCHES</span>
          </button>

          <button
            onClick={() => setIsSplitSheetOpen(true)}
            className="flex items-center justify-center space-x-1 py-1 rounded-none bg-black border border-[#262626] hover:border-amber-400 text-amber-400 text-[9px] font-bold transition-none uppercase"
          >
            <Award className="w-3 h-3 text-amber-400" />
            <span>ROYALTIES</span>
          </button>
        </div>

        {/* Producers Collaboration Drawer */}
        {showCollab && (
          <div className="bg-black border border-[#262626] rounded-none p-2.5 space-y-2 mt-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#737373]">
              <span>PRODUTORES CONECTADOS</span>
              <span className="text-[#0099FF]">2 ONLINE</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between p-1.5 bg-[#050505] border border-[#1a1a1a] text-[10px]">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#FF5500]"></span>
                  <span className="font-bold text-white">Alex (Você)</span>
                </div>
                <span className="text-[8px] text-[#FF5500] font-bold">FL STUDIO 21</span>
              </div>

              <div className="flex items-center justify-between p-1.5 bg-[#050505] border border-[#1a1a1a] text-[10px]">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#0070F3]"></span>
                  <span className="font-bold text-[#e5e5e5]">Sarah (Vocalista)</span>
                </div>
                <span className="text-[8px] text-[#0099FF] font-bold">REAPER 7</span>
              </div>
            </div>

            <button
              onClick={handleCopyCollabLink}
              className="w-full flex items-center justify-center space-x-1 py-1 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-white text-[9px] font-bold uppercase transition-none"
            >
              <Copy className="w-3 h-3 text-[#0099FF]" />
              <span>{copiedLink ? 'LINK COPIADO!' : 'COPIAR LINK DE CONVITE'}</span>
            </button>
          </div>
        )}

        {/* Branch Drawer Popup */}
        {showBranches && (
          <div className="bg-black border border-[#262626] rounded-none p-2.5 space-y-1.5 mt-1 animate-in fade-in duration-150">
            <div className="text-[9px] uppercase font-bold text-[#737373]">
              CRIAR / TROCAR BRANCH:
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Nome da branch..."
                className="flex-1 bg-[#050505] border border-[#262626] rounded-none px-2 py-0.5 text-xs text-white placeholder:text-[#525252] focus:outline-none focus:border-[#FF5500]"
              />
              <button
                onClick={() => {
                  if (newBranchName.trim()) {
                    createBranch(newBranchName.trim());
                    setNewBranchName('');
                  }
                }}
                className="px-2.5 py-0.5 rounded-none bg-[#FF5500] hover:bg-[#ff6600] text-xs font-bold text-black uppercase"
              >
                CRIAR
              </button>
            </div>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {projectState.branches.map((b) => (
                <button
                  key={b.name}
                  onClick={() => {
                    checkoutBranch(b.name);
                    setShowBranches(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded-none text-[9px] font-mono truncate transition-none uppercase ${
                    b.name === projectState.currentBranch
                      ? 'bg-[#141414] text-[#FF5500] border-l-2 border-[#FF5500] font-bold'
                      : 'text-[#737373] hover:text-white hover:bg-[#0a0a0a]'
                  }`}
                >
                  {b.name === projectState.currentBranch ? '■ ' : '□ '}
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Split Sheet Modal */}
      <SplitSheetModal
        isOpen={isSplitSheetOpen}
        onClose={() => setIsSplitSheetOpen(false)}
      />
    </div>
  );
};
