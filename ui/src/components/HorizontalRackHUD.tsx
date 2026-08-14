/**
 * @file HorizontalRackHUD.tsx
 * @description Sleek Horizontal 1U/2U Studio Hardware Rack VST Interface for FL Studio 21.
 * Pure Pitch Black (#000000), Industrial Orange (#FF5500), Electric Blue (#0070F3), and Square Tactile Controls.
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

export const HorizontalRackHUD: React.FC = () => {
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
    <div className="w-full max-w-[960px] mx-auto bg-[#000000] border-2 border-[#1a1a1a] rounded-none shadow-2xl overflow-hidden font-mono text-white select-none">
      {/* Top 1U Rack Header Bar */}
      <div className="bg-[#050505] border-b border-[#1a1a1a] px-3 py-1.5 flex items-center justify-between">
        {/* Left Rack Ear / Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-none bg-[#1a1a1a] border border-[#333333] flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-[#555555]"></div>
          </div>
          <div className="w-1.5 h-1.5 bg-[#FF5500]"></div>
          <span className="text-xs font-bold tracking-wider text-white uppercase font-mono">
            GIT-MUSIC <span className="text-[#FF5500]">VST3 RACK</span>
          </span>
        </div>

        {/* Center Quick Transport Indicator */}
        <div className="flex items-center space-x-3 text-[10px] text-[#737373]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#0099FF] animate-pulse"></span>
            <strong className="text-white">{projectState.transport.dawName || 'FL STUDIO 21'}</strong>
          </span>
          <span>•</span>
          <span className="text-[#FF5500] font-bold">{transport.bpm.toFixed(1)} BPM</span>
          <span>•</span>
          <span className="text-[#0099FF] font-bold">BAR {Math.floor(transport.barPosition)}:1</span>
        </div>

        {/* Right Sync & Rack Ear */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-none bg-black border border-[#262626] hover:border-[#0070F3] text-[9px] text-[#a3a3a3] hover:text-white transition-none uppercase"
          >
            <Cloud className={`w-3 h-3 ${isSyncing ? 'text-[#0099FF] animate-spin' : 'text-[#737373]'}`} />
            <span>{isSyncing ? 'SYNCING...' : 'R2 CLOUD'}</span>
          </button>
          <div className="w-2.5 h-2.5 rounded-none bg-[#1a1a1a] border border-[#333333] flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-[#555555]"></div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Horizontal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] bg-[#000000]">
        {/* Module 1 (Cols 1-3): OLED Session Screen */}
        <div className="md:col-span-3 p-3 space-y-2 bg-[#050505]">
          <div className="text-[9px] uppercase font-bold text-[#525252] border-b border-[#141414] pb-1 flex items-center justify-between">
            <span>SESSION STATUS</span>
            <span className="text-[#0099FF]">{projectState.storageStats.savingsPercentage}% CAS</span>
          </div>

          <div className="space-y-1.5">
            <div>
              <span className="text-[8px] uppercase text-[#525252] block">BRANCH ATIVA</span>
              <button
                onClick={() => setShowBranches(!showBranches)}
                className="w-full text-left flex items-center justify-between p-1 bg-black border border-[#262626] hover:border-[#FF5500] text-xs font-bold text-[#FF5500] transition-none"
              >
                <div className="flex items-center space-x-1 truncate">
                  <GitBranch className="w-3 h-3 text-[#FF5500] shrink-0" />
                  <span className="truncate">{projectState.currentBranch}</span>
                </div>
                <span className="text-[8px] text-[#525252]">TROCAR</span>
              </button>
            </div>

            <div>
              <span className="text-[8px] uppercase text-[#525252] block">PROJETO LOCAL</span>
              <div className="text-[10px] text-[#a3a3a3] truncate bg-black p-1 border border-[#1a1a1a]">
                Cyberpunk_Bassline.flp
              </div>
            </div>
          </div>
        </div>

        {/* Module 2 (Cols 4-6): Quick Snapshot Bar */}
        <div className="md:col-span-3 p-3 space-y-2 bg-[#050505]">
          <div className="text-[9px] uppercase font-bold text-[#525252] border-b border-[#141414] pb-1 flex items-center justify-between">
            <span>📸 SALVAR SNAPSHOT</span>
            <span className="text-[#FF5500]">1-CLIQUE</span>
          </div>

          <div className="space-y-1.5">
            <input
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickSnapshot()}
              placeholder="O que mudou no beat?..."
              className="w-full bg-black border border-[#262626] rounded-none px-2.5 py-1 text-xs text-white placeholder:text-[#525252] focus:outline-none focus:border-[#FF5500] transition-none"
            />

            <button
              onClick={handleQuickSnapshot}
              className={`w-full py-1.5 rounded-none text-xs font-extrabold transition-none flex items-center justify-center space-x-1.5 uppercase ${
                isSaved
                  ? 'bg-[#FF5500] text-black border border-[#FF5500]'
                  : 'bg-[#FF5500] hover:bg-[#ff6600] active:bg-[#cc4400] text-black border border-[#FF5500]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>SNAPSHOT SALVO!</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>SALVAR VERSÃO</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Module 3 (Cols 7-9): A/B Audio Comparison & VU Meter */}
        <div className="md:col-span-3 p-3 space-y-2 bg-[#050505]">
          <div className="flex items-center justify-between border-b border-[#141414] pb-1">
            <div className="flex items-center space-x-1 text-[9px] font-bold text-[#525252] uppercase">
              <Sliders className="w-3 h-3 text-[#0099FF]" />
              <span>A/B AUDIO COMPARISON</span>
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlayToggle}
              className={`w-5 h-5 rounded-none flex items-center justify-center transition-none border ${
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

          {/* Real-Time Hardware VU Meter */}
          <VUMeter compact={true} />

          {/* A/B Switcher Pills */}
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            <button
              onClick={() => {
                setABMode('live');
                handleCrossfade(0.0);
              }}
              className={`py-0.5 rounded-none text-center font-bold uppercase transition-none border ${
                abMode === 'live'
                  ? 'bg-[#FF5500] text-black border-[#FF5500]'
                  : 'bg-black text-[#737373] hover:text-white border-[#1a1a1a]'
              }`}
            >
              (A) FL LIVE
            </button>
            <button
              onClick={() => {
                setABMode('snapshot');
                handleCrossfade(1.0);
              }}
              className={`py-0.5 rounded-none text-center font-bold uppercase transition-none border ${
                abMode === 'snapshot'
                  ? 'bg-[#0070F3] text-white border-[#0070F3]'
                  : 'bg-black text-[#737373] hover:text-white border-[#1a1a1a]'
              }`}
            >
              (B) [{selectedCommit ? selectedCommit.hash.substring(0, 5) : 'SNAP'}]
            </button>
          </div>

          {/* Crossfader */}
          <div className="flex items-center space-x-1.5 pt-0.5">
            <span className="text-[7px] text-[#FF5500] font-bold">A</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={crossfade}
              onChange={(e) => handleCrossfade(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-[#FF5500] h-1 bg-[#141414] rounded-none"
            />
            <span className="text-[7px] text-[#0099FF] font-bold">B</span>
          </div>
        </div>

        {/* Module 4 (Cols 10-12): Recent Version History */}
        <div className="md:col-span-3 p-3 space-y-1.5 bg-[#050505]">
          <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#525252] border-b border-[#141414] pb-1">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[#525252]" />
              <span>VERSÕES RECENTES</span>
            </div>
            <span className="text-[#a3a3a3]">{projectState.history.length}</span>
          </div>

          <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
            {projectState.history.slice(0, 3).map((commit, idx) => (
              <div
                key={commit.hash}
                className={`flex items-center justify-between p-1 rounded-none border text-[9px] transition-none ${
                  idx === 0
                    ? 'bg-black border-[#FF5500]/60 text-white'
                    : 'bg-black border-[#1a1a1a] text-[#a3a3a3]'
                }`}
              >
                <div className="truncate mr-1.5">
                  <div className="font-bold truncate text-[9px] text-white">
                    {commit.message}
                  </div>
                  <div className="text-[7px] text-[#525252] flex items-center gap-1 uppercase">
                    <span>{commit.author.split(' ')[0]}</span>
                    <span>•</span>
                    <span className="text-[#0099FF]">{commit.hash.substring(0, 5)}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {idx === 0 ? (
                    <span className="px-1 py-0.5 bg-[#FF5500] text-black text-[7px] font-bold">
                      ATUAL
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setABMode('snapshot');
                        handleCrossfade(1.0);
                      }}
                      className="px-1 py-0.5 bg-black hover:bg-[#0070F3] hover:text-white text-[#0099FF] text-[7px] font-bold border border-[#0070F3]/40 uppercase transition-none"
                    >
                      OUVIR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 1U Action Strip */}
      <div className="bg-[#050505] border-t border-[#1a1a1a] px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCollab(!showCollab)}
            className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-none border text-[9px] font-bold transition-none uppercase ${
              showCollab
                ? 'bg-[#0070F3] text-white border-[#0070F3]'
                : 'bg-black border-[#262626] hover:border-[#0070F3] text-[#0099FF]'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>PRODUTORES (2 ONLINE)</span>
          </button>

          <button
            onClick={() => setShowBranches(!showBranches)}
            className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-none border text-[9px] font-bold transition-none uppercase ${
              showBranches
                ? 'bg-[#FF5500] text-black border-[#FF5500]'
                : 'bg-black border-[#262626] hover:border-[#FF5500] text-[#FF5500]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>BRANCHES ({projectState.branches.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsSplitSheetOpen(true)}
          className="flex items-center space-x-1 px-2.5 py-0.5 rounded-none bg-black border border-[#262626] hover:border-amber-400 text-amber-400 text-[9px] font-bold transition-none uppercase"
        >
          <Award className="w-3 h-3 text-amber-400" />
          <span>ROYALTIES SPLIT SHEET (PDF)</span>
        </button>
      </div>

      {/* Collapsible Producers Drawer */}
      {showCollab && (
        <div className="bg-black border-t border-[#262626] p-3 space-y-2 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#737373]">
            <span>PRODUTORES CONECTADOS NA SESSÃO</span>
            <button
              onClick={handleCopyCollabLink}
              className="flex items-center space-x-1 px-2 py-0.5 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-white text-[8px] uppercase font-bold"
            >
              <Copy className="w-2.5 h-2.5 text-[#0099FF]" />
              <span>{copiedLink ? 'LINK COPIADO!' : 'COPIAR LINK DE CONVITE'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-1.5 bg-[#050505] border border-[#1a1a1a] text-[10px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-[#FF5500]"></span>
                <span className="font-bold text-white">Alex (Você)</span>
              </div>
              <span className="text-[8px] text-[#FF5500] font-bold">FL STUDIO 21</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-[#050505] border border-[#1a1a1a] text-[10px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-[#0070F3]"></span>
                <span className="font-bold text-[#e5e5e5]">Sarah (Vocalista)</span>
              </div>
              <span className="text-[8px] text-[#0099FF] font-bold">REAPER 7</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Branch Drawer */}
      {showBranches && (
        <div className="bg-black border-t border-[#262626] p-3 space-y-2 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#737373]">
            <span>GERENCIADOR DE BRANCHES</span>
            <div className="flex space-x-1">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Nova branch..."
                className="bg-[#050505] border border-[#262626] px-2 py-0.5 text-[10px] text-white placeholder:text-[#525252] focus:outline-none focus:border-[#FF5500]"
              />
              <button
                onClick={() => {
                  if (newBranchName.trim()) {
                    createBranch(newBranchName.trim());
                    setNewBranchName('');
                  }
                }}
                className="px-2 py-0.5 bg-[#FF5500] hover:bg-[#ff6600] text-[10px] font-bold text-black uppercase"
              >
                CRIAR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {projectState.branches.map((b) => (
              <button
                key={b.name}
                onClick={() => {
                  checkoutBranch(b.name);
                  setShowBranches(false);
                }}
                className={`text-left p-1 text-[9px] font-mono truncate transition-none uppercase border ${
                  b.name === projectState.currentBranch
                    ? 'bg-[#141414] text-[#FF5500] border-[#FF5500] font-bold'
                    : 'bg-[#050505] text-[#737373] hover:text-white border-[#1a1a1a]'
                }`}
              >
                {b.name === projectState.currentBranch ? '■ ' : '□ '}
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split Sheet Modal */}
      <SplitSheetModal
        isOpen={isSplitSheetOpen}
        onClose={() => setIsSplitSheetOpen(false)}
      />
    </div>
  );
};
