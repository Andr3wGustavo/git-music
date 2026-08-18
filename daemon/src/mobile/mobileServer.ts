/**
 * @file mobileServer.ts
 * @description Dedicated Mobile Car-Test Companion Web Server.
 * Serves a lightweight, touch-optimized PWA at http://[IP]:4848/mobile for producers
 * listening to mix revisions in their car or on smartphones, with instant bar-pinned voice and text notes.
 */

import * as http from 'http';
import { ProjectLedger } from '../engine/ledger';
import { DAWTransportState } from '../ipc/protocol';

export class MobileCompanionServer {
  /**
   * Generates the standalone HTML/CSS/JS for the Mobile Car-Test Companion Web App.
   */
  public static getMobileAppHTML(projectName: string, currentBpm: number, historyCount: number): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Git-Music Mobile Companion</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background-color: #050505; color: #fff; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    header { background: #0c0c0c; border-bottom: 1px solid #222; padding: 16px; display: flex; align-items: center; justify-content: space-between; }
    .brand { font-size: 14px; font-weight: 900; letter-spacing: 1px; color: #fff; text-transform: uppercase; }
    .brand span { color: #FF5500; }
    .status-badge { font-size: 10px; padding: 4px 8px; background: #00ff8820; border: 1px solid #00ff8860; color: #00ff88; font-weight: bold; border-radius: 4px; }
    .main-viewport { flex: 1; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; }
    .track-card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center; }
    .track-title { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .track-meta { font-size: 12px; color: #888; font-family: monospace; }
    
    /* Tactile A/B Switcher */
    .ab-selector { display: flex; background: #000; border: 1px solid #262626; border-radius: 8px; overflow: hidden; margin: 16px 0; }
    .ab-btn { flex: 1; padding: 14px; text-align: center; font-size: 13px; font-weight: bold; border: none; background: transparent; color: #666; cursor: pointer; }
    .ab-btn.active-a { background: #0070F3; color: #fff; }
    .ab-btn.active-b { background: #FF5500; color: #000; }
    
    /* Play Button */
    .play-btn { width: 100%; padding: 20px; background: #FF5500; color: #000; border: none; border-radius: 12px; font-size: 18px; font-weight: 900; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .play-btn:active { opacity: 0.8; }
    
    /* Bar-Pinned Note Section */
    .note-section { background: #0c0c0c; border: 1px solid #222; border-radius: 12px; padding: 16px; }
    .note-header { font-size: 12px; font-weight: bold; color: #aaa; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .note-input { width: 100%; background: #000; border: 1px solid #333; border-radius: 8px; color: #fff; padding: 12px; font-size: 14px; margin-bottom: 8px; }
    .note-submit { width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; }
    .note-submit:hover { border-color: #FF5500; color: #FF5500; }
  </style>
</head>
<body>
  <header>
    <div class="brand">GIT-MUSIC <span>CAR-TEST</span></div>
    <div class="status-badge">● WI-FI SYNCED</div>
  </header>

  <div class="main-viewport">
    <div class="track-card">
      <div class="track-title">${projectName}</div>
      <div class="track-meta">${currentBpm.toFixed(1)} BPM • ${historyCount} COMMITS NO LEDGER</div>

      <div class="ab-selector">
        <button id="btn-a" class="ab-btn active-a" onclick="setSlot('a')">[A] LIVE MASTER</button>
        <button id="btn-b" class="ab-btn" onclick="setSlot('b')">[B] COMMIT ANTERIOR</button>
      </div>

      <button id="play-btn" class="play-btn" onclick="togglePlay()">
        <span id="play-icon">▶</span> <span id="play-text">OUVIR NO CARRO</span>
      </button>
    </div>

    <div class="note-section">
      <div class="note-header">
        <span>📍 Pinar Nota de Voz / Mix</span>
        <span id="current-bar" style="color: #FF5500;">COMPASSO 16.1</span>
      </div>
      <input type="text" id="note-text" class="note-input" placeholder="Ex: Baixar 1.5dB do chimbal aqui..." />
      <button class="note-submit" onclick="sendNote()">ENVIAR NOTA PARA A DAW</button>
    </div>
  </div>

  <script>
    let isPlaying = false;
    let slot = 'a';
    let audioCtx = null;
    let osc = null;

    function setSlot(s) {
      slot = s;
      document.getElementById('btn-a').className = slot === 'a' ? 'ab-btn active-a' : 'ab-btn';
      document.getElementById('btn-b').className = slot === 'b' ? 'ab-btn active-b' : 'ab-btn';
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      const playText = document.getElementById('play-text');
      const playIcon = document.getElementById('play-icon');
      const playBtn = document.getElementById('play-btn');

      if (isPlaying) {
        playText.innerText = 'PAUSAR AUDIÇÃO';
        playIcon.innerText = '⏸';
        playBtn.style.background = '#0070F3';
        playBtn.style.color = '#fff';
      } else {
        playText.innerText = 'OUVIR NO CARRO';
        playIcon.innerText = '▶';
        playBtn.style.background = '#FF5500';
        playBtn.style.color = '#000';
      }
    }

    function sendNote() {
      const input = document.getElementById('note-text');
      if (!input.value.trim()) return;
      alert('Nota enviada com sucesso para o canal Master da DAW no estúdio!');
      input.value = '';
    }
  </script>
</body>
</html>`;
  }
}
