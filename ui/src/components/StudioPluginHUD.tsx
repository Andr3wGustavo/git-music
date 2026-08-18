/**
 * @file StudioPluginHUD.tsx
 * @description Proportional High-End In-DAW Studio Plugin Workstation GUI for Git-Music VST3.
 * Perfectly proportioned (~840px x 580px golden studio ratio), pure black hardware chassis (#070707),
 * OLED displays, tactile Industrial Orange (#FF5500) and Electric Blue (#0070F3) controls.
 */

import React, { useState } from 'react';
import { useIPC } from '../context/IPCContext';
import {
  Camera,
  Play,
  Square,
  Check,
  Clock,
  GitBranch,
  Cloud,
  Award,
  Copy,
  Radio,
  Music,
  Sparkles,
  MessageSquare,
  Grid,
  GitPullRequest,
  Users,
  BookOpen
} from 'lucide-react';
import { WebAudioEngine } from '../audio/WebAudioEngine';
import { VUMeter } from './VUMeter';
import { WaveformVisualizer } from './WaveformVisualizer';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { PianoRollDiff } from './PianoRollDiff';
import { StemList } from './StemList';
import { AudioCommentsList } from './AudioCommentsList';
import { SplitSheetModal } from './SplitSheetModal';
import { BranchModal } from './BranchModal';
import { PullRequestModal } from './PullRequestModal';
import { CommentModal } from './CommentModal';
import { CommitModal } from './CommitModal';
import { LiveCollabRoomModal } from './LiveCollabRoomModal';
import { DidacticGuideModal } from './DidacticGuideModal';

type StudioTab = 'timeline' | 'audio_diff' | 'piano_roll' | 'stems' | 'copilot' | 'comments';

export const StudioPluginHUD: React.FC = () => {
  const {
    projectState,
    crossfade,
    setABMode,
    setCrossfade,
    togglePlay,
    createCommit,
    checkoutBranch,
    triggerCloudSync,
    selectedCommit,
  } = useIPC();

  // Tab State
  const [activeTab, setActiveTab] = useState<StudioTab>('timeline');

  // Quick Snapshot input
  const [quickMessage, setQuickMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals
  const [isSplitSheetOpen, setIsSplitSheetOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [commentBar, setCommentBar] = useState(1);

  const transport = projectState.transport;

  // Snapshot commit handler
  const handleQuickSnapshot = () => {
    if (!quickMessage.trim()) return;
    createCommit(quickMessage.trim(), 'Alex (Lead Producer)');
    setQuickMessage('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2200);
  };

  // Playback handler (Real Web Audio engine + DAW transport sync)
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

  // Crossfade handler
  const handleCrossfade = (val: number) => {
    setCrossfade(val);
    WebAudioEngine.getInstance().setCrossfade(val);
    if (val === 0) {
      setABMode('live');
    } else if (val === 100) {
      setABMode('snapshot');
    }
  };

  // Cloud sync handler
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

  const handleOpenCommentAtBar = (bar: number) => {
    setCommentBar(bar);
    setIsCommentModalOpen(true);
  };

  const onlineProducersCount = projectState.liveSession?.activeProducers?.filter((p) => p.isOnline).length || 2;

  return (
    <div className="w-full max-w-[840px] mx-auto bg-[#070707] border-2 border-[#1c1c1c] rounded-none shadow-2xl overflow-hidden font-mono text-white select-none transition-all">
      {/* 1. TOP HARDWARE CHASSIS BEZEL */}
      <div className="bg-[#0c0c0c] border-b border-[#1c1c1c] px-3.5 py-2 flex items-center justify-between">
        {/* Left: Brand Plate & DAW Host Lock */}
        <div className="flex items-center space-x-2.5">
          {/* Hex screw visual */}
          <div className="w-2.5 h-2.5 bg-[#141414] border border-[#333] flex items-center justify-center">
            <div className="w-1 h-0.5 bg-[#555]"></div>
          </div>
          <div className="w-2 h-2 bg-[#FF5500] animate-pulse"></div>
          <span className="text-xs font-bold tracking-wider text-white uppercase">
            GIT-MUSIC <span className="text-[#FF5500]">VST3</span>
          </span>
          <span className="px-1.5 py-0.5 bg-[#141414] border border-[#262626] text-[10px] text-[#0099FF] flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"></span>
            {projectState.transport.dawName || 'FL STUDIO 21'}
          </span>
        </div>

        {/* Center: Live Timecode & Session Info */}
        <div className="hidden sm:flex items-center space-x-3 text-[11px] text-[#888]">
          <span className="text-white font-bold truncate max-w-[150px]">
            {projectState.projectName}
          </span>
          <span>•</span>
          <span className="text-[#FF5500] font-bold">{transport.bpm.toFixed(1)} BPM</span>
          <span>•</span>
          <span className="text-[#0099FF] font-bold">BAR {Math.floor(transport.barPosition)}:1</span>
        </div>

        {/* Right: Live Room, Storage CAS, Cloud Sync, Splits & Guide */}
        <div className="flex items-center space-x-1.5">
          {/* Live Collab Session Badge */}
          <button
            onClick={() => setIsCollabModalOpen(true)}
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#0e1712] border border-[#10B981]/50 hover:border-[#10B981] text-[10px] text-[#10B981] font-bold uppercase transition-none"
            title="Abrir sala de produção compartilhada em tempo real"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
            <Users className="w-3 h-3" />
            <span>{onlineProducersCount} ONLINE</span>
          </button>

          <span className="text-[10px] px-1.5 py-0.5 bg-black border border-[#222] text-[#10B981] font-bold hidden md:inline">
            {projectState.storageStats.savingsPercentage}% CAS
          </span>

          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="flex items-center space-x-1 px-2 py-0.5 bg-black border border-[#262626] hover:border-[#0070F3] text-[10px] text-[#aaa] hover:text-white transition-none uppercase"
            title="Sync chunks to Cloudflare R2"
          >
            <Cloud className={`w-3 h-3 ${isSyncing ? 'text-[#0099FF] animate-spin' : 'text-[#888]'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'SYNC...' : 'R2'}</span>
          </button>

          <button
            onClick={() => setIsSplitSheetOpen(true)}
            className="flex items-center space-x-1 px-2 py-0.5 bg-black border border-[#262626] hover:border-[#FF5500] text-[10px] text-[#FF5500] transition-none uppercase"
            title="Open Legal Royalty Split Sheet"
          >
            <Award className="w-3 h-3" />
            <span className="hidden sm:inline">SPLITS</span>
          </button>

          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#1a1405] border border-[#ffb703]/50 hover:border-[#ffb703] text-[10px] text-[#ffb703] transition-none uppercase font-bold"
            title="Abrir Guia Didático Master de Engenharia de Áudio"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">GUIA PRO</span>
          </button>

          {/* Hex screw visual */}
          <div className="w-2.5 h-2.5 bg-[#141414] border border-[#333] flex items-center justify-center">
            <div className="w-1 h-0.5 bg-[#555]"></div>
          </div>
        </div>
      </div>

      {/* 2. SUB-HEADER: QUICK SNAPSHOT BAR & ACTIVE BRANCH */}
      <div className="bg-[#030303] border-b border-[#181818] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Active Branch Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[9px] uppercase text-[#666] font-bold">BRANCH:</span>
          <button
            onClick={() => setIsBranchModalOpen(true)}
            className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#FF5500] text-xs font-bold text-[#FF5500] transition-none"
            title="Switch or create Git-Music branch"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>{projectState.currentBranch}</span>
            <span className="text-[9px] text-[#666] font-normal">▾</span>
          </button>

          <button
            onClick={() => setIsPrModalOpen(true)}
            className="flex items-center space-x-1 px-2 py-0.5 bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#0099FF] text-[10px] text-[#0099FF]"
            title="Review multi-producer stem pull requests"
          >
            <GitPullRequest className="w-3 h-3" />
            <span>PRs ({projectState.pullRequests?.filter(p => p.status === 'open').length || 0})</span>
          </button>
        </div>

        {/* Quick Snapshot Action Input */}
        <div className="flex items-center space-x-1.5 flex-1 max-w-md justify-end">
          <input
            type="text"
            value={quickMessage}
            onChange={(e) => setQuickMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickSnapshot()}
            placeholder="Quick snapshot note... (e.g. Tightened 808 sub-bass)"
            className="w-full text-xs bg-black border border-[#262626] px-2.5 py-1 text-white placeholder-[#444] focus:outline-none focus:border-[#FF5500] transition-none font-mono"
          />
          <button
            onClick={handleQuickSnapshot}
            disabled={!quickMessage.trim()}
            className={`px-3 py-1 flex items-center space-x-1.5 text-xs font-bold uppercase transition-none shrink-0 ${
              isSaved
                ? 'bg-[#10B981] text-black border border-[#10B981]'
                : quickMessage.trim()
                ? 'bg-[#FF5500] text-black hover:bg-[#ff6600] border border-[#FF5500]'
                : 'bg-[#141414] text-[#444] border border-[#222] cursor-not-allowed'
            }`}
            title="Create instant local snapshot"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
                <span>SAVED!</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>SNAP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. TACTILE STUDIO WORKSPACE TABS */}
      <div className="bg-[#080808] border-b border-[#1a1a1a] px-2 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-1 py-1">
          {/* Tab 1: Timeline */}
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-none border-b-2 ${
              activeTab === 'timeline'
                ? 'bg-black text-[#FF5500] border-[#FF5500]'
                : 'text-[#777] hover:text-white border-transparent hover:bg-[#111]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>TIMELINE ({projectState.history.length})</span>
          </button>

          {/* Tab 2: Waveform & Spectrum */}
          <button
            onClick={() => setActiveTab('audio_diff')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-none border-b-2 ${
              activeTab === 'audio_diff'
                ? 'bg-black text-[#0099FF] border-[#0099FF]'
                : 'text-[#777] hover:text-white border-transparent hover:bg-[#111]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>AUDIO DIFF & FFT</span>
          </button>

          {/* Tab 3: Piano Roll Diff */}
          <button
            onClick={() => setActiveTab('piano_roll')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-none border-b-2 ${
              activeTab === 'piano_roll'
                ? 'bg-black text-[#10B981] border-[#10B981]'
                : 'text-[#777] hover:text-white border-transparent hover:bg-[#111]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>PIANO ROLL</span>
          </button>

          {/* Tab 4: Stems & CAS */}
          <button
            onClick={() => setActiveTab('stems')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-none border-b-2 ${
              activeTab === 'stems'
                ? 'bg-black text-[#ffb703] border-[#ffb703]'
                : 'text-[#777] hover:text-white border-transparent hover:bg-[#111]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>STEMS ({projectState.stems.length})</span>
          </button>

          {/* Tab 5: AI Mix Copilot */}
          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-none border-b-2 ${
              activeTab === 'copilot'
                ? 'bg-black text-[#d946ef] border-[#d946ef]'
                : 'text-[#777] hover:text-white border-transparent hover:bg-[#111]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI COPILOT</span>
          </button>

          {/* Tab 6: Comments */}
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-none border-b-2 ${
              activeTab === 'comments'
                ? 'bg-black text-[#38bdf8] border-[#38bdf8]'
                : 'text-[#777] hover:text-white border-transparent hover:bg-[#111]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>FEEDBACK ({projectState.comments.length})</span>
          </button>
        </div>

        {/* Share Collab Link */}
        <button
          onClick={handleCopyCollabLink}
          className="hidden sm:flex items-center space-x-1 px-2 py-1 bg-black border border-[#262626] hover:border-[#FF5500] text-[10px] text-[#888] hover:text-white transition-none uppercase"
          title="Copy project collaboration URI"
        >
          <Copy className="w-3 h-3 text-[#FF5500]" />
          <span>{copiedLink ? 'LINK COPIED!' : 'SHARE'}</span>
        </button>
      </div>

      {/* 4. MAIN OLED STUDIO VIEWPORT (Proportional Height ~320px) */}
      <div className="p-3 bg-[#030303] min-h-[300px] max-h-[350px] overflow-y-auto">
        {activeTab === 'timeline' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-[#666] uppercase px-1 pb-1 border-b border-[#141414]">
              <span>LEDGER COMMIT TREE • SELECT SNAPSHOT TO A/B LISTEN</span>
              <span>{projectState.storageStats.totalTrackedFiles} TRACKED FILES</span>
            </div>
            <div className="space-y-1.5">
              {projectState.history.map((commit) => {
                const isSelected = selectedCommit?.hash === commit.hash;
                const isHead = projectState.headCommit === commit.hash;

                return (
                  <div
                    key={commit.hash}
                    className={`p-2.5 border transition-none flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#0f0f0f] border-[#FF5500]'
                        : isHead
                        ? 'bg-[#0a0a0a] border-[#0070F3]'
                        : 'bg-black border-[#1a1a1a] hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-none flex items-center justify-center font-bold text-xs shrink-0 ${
                          isHead
                            ? 'bg-[#0070F3] text-white'
                            : isSelected
                            ? 'bg-[#FF5500] text-black'
                            : 'bg-[#181818] text-[#666]'
                        }`}
                      >
                        {isHead ? <Check className="w-3.5 h-3.5" /> : commit.hash.substring(0, 2)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate max-w-sm">
                            {commit.message}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#181818] border border-[#282828] text-[#FF5500] font-mono">
                            {commit.hash.substring(0, 7)}
                          </span>
                          {isHead && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-[#0070F3]/20 text-[#0099FF] border border-[#0070F3]/40 font-bold">
                              HEAD
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#666] flex items-center space-x-2 mt-0.5">
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className="text-[#10B981]">{(commit.totalSizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setABMode('snapshot');
                          handleCrossfade(100);
                        }}
                        className="px-2 py-1 bg-black border border-[#333] hover:border-[#FF5500] text-[10px] text-[#aaa] hover:text-white uppercase font-bold"
                        title="Load this commit into Slot B for instant A/B comparison"
                      >
                        A/B LISTEN
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          checkoutBranch(commit.branch);
                        }}
                        className="px-2 py-1 bg-black border border-[#222] hover:border-[#0070F3] text-[10px] text-[#0099FF] uppercase font-bold"
                      >
                        REVERT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'audio_diff' && (
          <div className="space-y-3">
            {/* Waveform Diff Visualizer */}
            <div className="border border-[#1a1a1a] bg-black p-2">
              <div className="flex items-center justify-between text-[10px] text-[#666] uppercase mb-1.5 pb-1 border-b border-[#141414]">
                <span>DUAL COMPARATIVE WAVEFORM • CLICK TO PIN AUDIO COMMENT</span>
                <span className="text-[#0099FF]">A: LIVE DAW (CYAN) | B: COMMIT (PINK)</span>
              </div>
              <WaveformVisualizer onAddCommentAtBar={handleOpenCommentAtBar} />
            </div>

            {/* Real-time Web Audio FFT Spectrum */}
            <div className="border border-[#1a1a1a] bg-black p-2">
              <div className="flex items-center justify-between text-[10px] text-[#666] uppercase mb-1.5 pb-1 border-b border-[#141414]">
                <span>60 FPS HARDWARE FFT SPECTRUM ANALYZER (20 Hz - 20 kHz)</span>
                <span className="text-[#FF5500]">{transport.isPlaying ? 'ACTIVE DSP' : 'STANDBY'}</span>
              </div>
              <SpectrumAnalyzer />
            </div>
          </div>
        )}

        {activeTab === 'piano_roll' && (
          <div className="border border-[#1a1a1a] bg-black p-2">
            <PianoRollDiff />
          </div>
        )}

        {activeTab === 'stems' && (
          <div className="space-y-2">
            <StemList />
          </div>
        )}

        {activeTab === 'copilot' && (
          <div className="space-y-3">
            <div className="bg-[#080808] border border-[#222] p-3 space-y-3">
              <div className="flex items-center justify-between border-b border-[#181818] pb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#d946ef]">
                  <Sparkles className="w-4 h-4" />
                  <span>AI ACOUSTIC & MIX COPILOT</span>
                </div>
                <span className="text-[10px] text-[#888] font-mono">
                  {projectState.stems.length} STEMS ANALYZED • {transport.bpm} BPM
                </span>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <div className="p-2.5 bg-black border border-[#222] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#FF5500] font-bold">⚠️ Low-End Collision (55 Hz - 90 Hz)</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#FF5500]/20 text-[#FF5500]">HIGH IMPACT</span>
                  </div>
                  <p className="text-[11px] text-[#aaa]">
                    Kick drum transient colliding with 808 Sub-Bass. -2.4 dB phase cancellation in mono sum.
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-[#666]">Suggested: Sidechain duck 808 by -3.2 dB (15ms attack)</span>
                    <button
                      onClick={() => setQuickMessage('feat(mix): apply dynamic sidechain EQ notch at 60Hz')}
                      className="px-2 py-0.5 bg-[#181818] hover:bg-[#FF5500] hover:text-black text-[9px] text-white uppercase font-bold"
                    >
                      Use as Commit Note
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-black border border-[#222] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#0099FF] font-bold">ℹ️ Vocal Sibilance & Presence Clashing (5.8 kHz)</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#0099FF]/20 text-[#0099FF]">MEDIUM</span>
                  </div>
                  <p className="text-[11px] text-[#aaa]">
                    Lead Vocal presence overlaps Synth Lead harmonics at Bar 16 - 32.
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-[#666]">Suggested: Dip Synth Lead by 1.8 dB at 6.2 kHz (Q=1.4)</span>
                    <button
                      onClick={() => setQuickMessage('fix(eq): carve 6.2kHz space for lead vocals')}
                      className="px-2 py-0.5 bg-[#181818] hover:bg-[#0099FF] hover:text-black text-[9px] text-white uppercase font-bold"
                    >
                      Use as Commit Note
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-2">
            <AudioCommentsList onOpenNewCommentModal={() => setIsCommentModalOpen(true)} />
          </div>
        )}
      </div>

      {/* 5. BOTTOM HARDWARE MASTER CONTROL & A/B TRANSPORT STRIP */}
      <div className="bg-[#080808] border-t-2 border-[#1c1c1c] p-3 space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Left Column (Cols 1-3): Real Stereo VU Meter */}
          <div className="md:col-span-3 bg-black border border-[#1e1e1e] p-2 flex flex-col justify-center">
            <div className="text-[8px] uppercase font-bold text-[#666] flex justify-between mb-1">
              <span>OUTPUT LEVEL</span>
              <span className="text-[#FF5500]">{transport.isPlaying ? '-6.2 dB' : '-INF'}</span>
            </div>
            <VUMeter />
          </div>

          {/* Center Column (Cols 4-8): Tactile Master A/B Comparison Fader */}
          <div className="md:col-span-6 bg-black border border-[#1e1e1e] p-2 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase">
              <span className={`flex items-center gap-1 ${crossfade < 50 ? 'text-[#0099FF]' : 'text-[#555]'}`}>
                <span className={`w-1.5 h-1.5 ${crossfade < 50 ? 'bg-[#0099FF]' : 'bg-[#333]'}`}></span>
                [A] LIVE DAW ({100 - crossfade}%)
              </span>
              <span className="text-[#888]">A/B CROSSFADE</span>
              <span className={`flex items-center gap-1 ${crossfade > 50 ? 'text-[#FF5500]' : 'text-[#555]'}`}>
                [B] COMMIT ({crossfade}%)
                <span className={`w-1.5 h-1.5 ${crossfade > 50 ? 'bg-[#FF5500]' : 'bg-[#333]'}`}></span>
              </span>
            </div>

            {/* Fader Input */}
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={crossfade}
                onChange={(e) => handleCrossfade(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer h-2 bg-[#141414] border border-[#262626] rounded-none appearance-none accent-[#FF5500]"
              />
            </div>

            {/* Quick Toggle Buttons */}
            <div className="flex items-center justify-between space-x-1 pt-0.5">
              <button
                onClick={() => handleCrossfade(0)}
                className={`flex-1 py-0.5 text-[9px] font-bold uppercase border transition-none ${
                  crossfade === 0
                    ? 'bg-[#0070F3] text-white border-[#0070F3]'
                    : 'bg-[#111] text-[#888] border-[#222] hover:text-white'
                }`}
              >
                SOLO LIVE [A]
              </button>
              <button
                onClick={() => handleCrossfade(50)}
                className={`flex-1 py-0.5 text-[9px] font-bold uppercase border transition-none ${
                  crossfade === 50
                    ? 'bg-[#10B981] text-black border-[#10B981]'
                    : 'bg-[#111] text-[#888] border-[#222] hover:text-white'
                }`}
              >
                50/50 BLEND
              </button>
              <button
                onClick={() => handleCrossfade(100)}
                className={`flex-1 py-0.5 text-[9px] font-bold uppercase border transition-none ${
                  crossfade === 100
                    ? 'bg-[#FF5500] text-black border-[#FF5500]'
                    : 'bg-[#111] text-[#888] border-[#222] hover:text-white'
                }`}
              >
                SOLO COMMIT [B]
              </button>
            </div>
          </div>

          {/* Right Column (Cols 9-12): Real Web Audio Playback & Hotkeys */}
          <div className="md:col-span-3 bg-black border border-[#1e1e1e] p-2 flex flex-col justify-between space-y-1.5">
            <button
              onClick={handlePlayToggle}
              className={`w-full py-2 flex items-center justify-center space-x-2 text-xs font-bold uppercase transition-none ${
                transport.isPlaying
                  ? 'bg-[#FF5500] text-black border border-[#FF5500]'
                  : 'bg-[#0070F3] text-white hover:bg-[#0060df] border border-[#0070F3]'
              }`}
            >
              {transport.isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP AUDITION</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY AUDITION</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[9px] text-[#666] font-mono">
              <span>HOTKEYS:</span>
              <span className="text-[#888]">[SPACE] PLAY</span>
              <span className="text-[#888]">[TAB] A/B</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MODALS */}
      <SplitSheetModal isOpen={isSplitSheetOpen} onClose={() => setIsSplitSheetOpen(false)} />
      <BranchModal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} />
      <PullRequestModal isOpen={isPrModalOpen} onClose={() => setIsPrModalOpen(false)} />
      <CommentModal isOpen={isCommentModalOpen} barPosition={commentBar} onClose={() => setIsCommentModalOpen(false)} />
      <CommitModal isOpen={isCommitModalOpen} onClose={() => setIsCommitModalOpen(false)} />
      <LiveCollabRoomModal isOpen={isCollabModalOpen} onClose={() => setIsCollabModalOpen(false)} />
      <DidacticGuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />
    </div>
  );
};
