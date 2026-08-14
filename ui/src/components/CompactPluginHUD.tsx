/**
 * @file CompactPluginHUD.tsx
 * @description Ultra-Compact In-DAW Hardware VST Plugin Interface.
 * Subtle, minimal, hardware-rack aesthetic designed specifically for floating inside FL Studio 21.
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
  const [newBranchName, setNewBranchName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const transport = projectState.transport;

  const handleQuickSnapshot = () => {
    if (!quickMessage.trim()) return;
    createCommit(quickMessage.trim(), 'Lead Producer');
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

  return (
    <div className="w-full max-w-[460px] mx-auto bg-[#0d1117] border-2 border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200 select-none">
      {/* Hardware Screw Top Bar */}
      <div className="bg-[#161f2e] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Simulated hardware screw */}
          <div className="w-2.5 h-2.5 rounded-full bg-[#334155] border border-[#1e293b] flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-[#0f172a]"></div>
          </div>
          <span className="text-xs font-black tracking-widest text-cyan-400 font-mono uppercase">
            GIT-MUSIC <span className="text-[10px] text-slate-500 font-normal">VST3</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 hover:border-cyan-400 transition-colors"
          >
            <Cloud className={`w-3 h-3 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'R2 Cloud'}</span>
          </button>
          {/* Simulated hardware screw */}
          <div className="w-2.5 h-2.5 rounded-full bg-[#334155] border border-[#1e293b] flex items-center justify-center">
            <div className="w-1.5 h-0.5 bg-[#0f172a]"></div>
          </div>
        </div>
      </div>

      {/* Main Plugin Body */}
      <div className="p-4 space-y-3.5">
        {/* 1. OLED Status Screen (Compact Display) */}
        <div className="bg-[#05080f] border border-cyan-500/30 rounded-xl p-3 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5 mb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-200 font-bold">{projectState.transport.dawName || 'FL Studio 21'}</span>
            </div>
            <div className="text-cyan-400 font-bold">
              {transport.bpm.toFixed(1)} BPM • {transport.timeSigNumerator}/{transport.timeSigDenominator}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-mono text-slate-500 block leading-none mb-1">
                Active Branch & Track
              </span>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-mono text-purple-200">{projectState.currentBranch}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-mono text-slate-500 block leading-none mb-1">
                SSD Saved
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {projectState.storageStats.savingsPercentage}% CAS
              </span>
            </div>
          </div>
        </div>

        {/* 2. Quick Snapshot Bar (Save Point in 1-Click) */}
        <div className="bg-[#131b29] border border-[#1e293b] rounded-xl p-3 space-y-2">
          <label className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>📸 Salvar Snapshot / Versão</span>
            <span className="text-[9px] text-slate-500">Auto-Deduplicado</span>
          </label>

          <div className="flex space-x-2">
            <input
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickSnapshot()}
              placeholder="O que mudou? (ex: Drop com 808 mais pesado)..."
              className="flex-1 bg-[#090d16] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
            />
            <button
              onClick={handleQuickSnapshot}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                isSaved
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snapshot</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. A/B Audio Switcher & Stereo VU Meters */}
        <div className="bg-[#131b29] border border-[#1e293b] rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[11px] font-bold text-slate-300 uppercase font-mono">
                A/B Comparador em Tempo Real
              </span>
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlayToggle}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                transport.isPlaying
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
              }`}
            >
              {transport.isPlaying ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current ml-0.5 text-cyan-400" />
              )}
            </button>
          </div>

          {/* Real-time Hardware VU Meter */}
          <VUMeter compact={true} />

          {/* Live vs Snapshot Mode Toggle Pills */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090d16] rounded-lg border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => {
                setABMode('live');
                handleCrossfade(0.0);
              }}
              className={`py-1 rounded text-center font-bold transition-all ${
                abMode === 'live'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              (A) FL Studio Live
            </button>
            <button
              onClick={() => {
                setABMode('snapshot');
                handleCrossfade(1.0);
              }}
              className={`py-1 rounded text-center font-bold transition-all ${
                abMode === 'snapshot'
                  ? 'bg-pink-500 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              (B) Snapshot [{selectedCommit ? selectedCommit.hash.substring(0, 5) : 'Antigo'}]
            </button>
          </div>

          {/* Crossfader Slider */}
          <div className="flex items-center space-x-2 pt-1">
            <span className="text-[9px] font-mono text-slate-500 font-bold">A</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={crossfade}
              onChange={(e) => handleCrossfade(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-cyan-400 h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[9px] font-mono text-slate-500 font-bold">B</span>
          </div>
        </div>

        {/* 4. Recent Version History List (1-Click Restore) */}
        <div className="bg-[#131b29] border border-[#1e293b] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Versões Anteriores</span>
            </div>
            <span className="text-slate-500">{projectState.history.length} Snapshots</span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {projectState.history.map((commit, idx) => (
              <div
                key={commit.hash}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                  idx === 0
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                    : 'bg-[#090d16] border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="truncate mr-2">
                  <div className="font-semibold truncate text-[11px] leading-tight">
                    {commit.message}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                    <span>{commit.author.split(' ')[0]}</span>
                    <span>•</span>
                    <span className="text-cyan-400/80 font-bold">{commit.hash.substring(0, 6)}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {idx === 0 ? (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/40">
                      Atual
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setABMode('snapshot');
                        handleCrossfade(1.0);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-pink-500/20 hover:text-pink-300 hover:border-pink-500/40 text-slate-400 font-mono text-[9px] border border-slate-700 transition-colors"
                    >
                      Comparar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Footer Quick Actions: Split Sheets & Branching */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsSplitSheetOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold hover:bg-amber-500/20 transition-colors font-mono"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Split Sheet (PDF)</span>
          </button>

          <button
            onClick={() => setShowBranches(!showBranches)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-mono transition-colors"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Branches ({projectState.branches.length})</span>
          </button>
        </div>

        {/* Branch Drawer Popup */}
        {showBranches && (
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-3 space-y-2 mt-2">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Alternar ou Criar Branch:
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Nome da branch (ex: test-guitar)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono"
              />
              <button
                onClick={() => {
                  if (newBranchName.trim()) {
                    createBranch(newBranchName.trim());
                    setNewBranchName('');
                  }
                }}
                className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white font-mono"
              >
                Criar
              </button>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {projectState.branches.map((b) => (
                <button
                  key={b.name}
                  onClick={() => {
                    checkoutBranch(b.name);
                    setShowBranches(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono truncate transition-colors ${
                    b.name === projectState.currentBranch
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {b.name === projectState.currentBranch ? '● ' : '○ '}
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
