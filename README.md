# 🎛️ Git-Music

**Native In-DAW Version Control, Real-Time Audio Diff & Producer Collaboration System for FL Studio 21, Ableton Live, and Reaper.**

---

## 📸 Interface Preview (FL Studio 21 In-DAW VST3)

<!-- ============================================================================== -->
<!-- PLACE YOUR APP SCREENSHOT BELOW: Save your screenshot as docs/images/git-music-flstudio-vst.png -->
<!-- ============================================================================== -->

<div align="center">

```
┌─────────────────────────────────────────────────────────────┐
│ 🎛️ [X] GIT-MUSIC VST3                       [ R2 CLOUD ] [X]│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 FL STUDIO 21 CONNECTED          128.0 BPM • 4/4      │ │
│ │ BRANCH: [ main / feat-synth-drop ]        SSD: 64% CAS  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📸 SALVAR SNAPSHOT                                          │
│ ┌──────────────────────────────────────┬──────────────────┐ │
│ │ Descreva a alteração no beat...      │ 📸 [ SALVAR ]    │ │
│ └──────────────────────────────────────┴──────────────────┘ │
│                                                             │
│ 🎚️ A/B COMPARADOR DE ÁUDIO                      [ ▶ PLAY ] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ L [ ■■■■■■■■■□□□ ] -6dB   R [ ■■■■■■■■■□□□ ] -6dB  Clip │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────┬─────────────────────────────┐ │
│ │ (A) FL LIVE MASTER        │ (B) SNAPSHOT [v2_mix]       │ │
│ └───────────────────────────┴─────────────────────────────┘ │
│  A (LIVE) ────────────●────────────── B (SNAP) (Crossfader) │
│                                                             │
│ ⏱️ HISTÓRICO DE VERSÕES (1-CLIQUE PARA OUVIR)               │
│ • v3 (Agora)    - Lead Vocal Cleaned           [ ATUAL ]   │
│ • v2 (15m atrás) - FabFilter Pro-Q3 Cut         [ OUVIR ]   │
│ • v1 (Ontem)    - Initial Beat & Bassline       [ OUVIR ]   │
│                                                             │
│ [ 👥 PRODUTORES (2) ]   [ 🌿 BRANCHES ]   [ 🏆 ROYALTIES ]  │
└─────────────────────────────────────────────────────────────┘
```

*(Adicione a captura de tela real da janela em: `docs/images/git-music-flstudio-vst.png`)*

![Git-Music FL Studio 21 VST3 HUD](docs/images/git-music-flstudio-vst.png)

</div>

---

## ⚡ 1-Click Quick Start (Windows)

Para iniciar o ecossistema completo do Git-Music no Windows:

```powershell
# PowerShell (Recomendado):
.\start-git-music.ps1

# Ou no Prompt de Comando clássico (CMD):
.\start-git-music.bat
```

Este comando:
1. Verifica o ambiente Node.js.
2. Compila o Daemon de sincronização em TypeScript.
3. Inicia o servidor WebSocket local na porta `ws://127.0.0.1:4848`.
4. Abre o **VST Studio HUD** no navegador em `http://localhost:3000`.

Para rodar a suíte de 11 testes automatizados do motor:
```powershell
.\test-engine.ps1
# ou:
npm run test
```

---

## 🧠 Principais Funcionalidades

### 1. 🎛️ VST3 Nativo In-DAW (FL Studio 21)
* Abre como um plugin de efeito direto no Master Mixer do FL Studio.
* Contêiner nativo C++20 com aceleração de GPU (DirectX/WebView2) sem janelas soltas.
* Fila de memória sem travas (*Lock-Free SPSC Ring Buffer*) para garantir **zero cliques ou engasgos** no motor de áudio.

### 2. 📸 Snapshots com Deduplicação Inteligente (CAS)
* Salva novas versões do projeto com 1 clique (ou atalho `Enter`).
* O sistema calcula o hash SHA-256 e armazena **apenas as faixas que foram alteradas**, economizando até **80% de espaço no SSD**.

### 3. 🎚️ A/B Comparison Switcher em Tempo Real
* Compare instantaneamente o que você está ouvindo no FL Studio agora (`Canal A`) com qualquer versão anterior salva (`Canal B`).
* Crossfader de potência constante com filtros DSP para conferência crítica de mixagem e masterização.

### 4. 👥 Conexão Direta Entre Produtores
* Painel minimalista indicando colaboradores ativos no projeto.
* Sincronização zero-egress na nuvem (Cloudflare R2 / AWS S3) para envio e download rápido de stems.

### 5. 🎼 Compilador Cross-DAW (Music-IR)
* Traduz automaticamente arranjos entre **FL Studio (`.flp`)**, **Ableton Live (`.als`)** e **Cockos Reaper (`.rpp`)**.

### 6. ⚖️ Split Sheets Criptográficas & Direitos Autorais
* Geração automática de certificados de autoria com assinatura **Ed25519** e carimbo de tempo TSA (RFC 3161), com exportação de contratos PDF em 1 clique.

---

## 📁 Estrutura do Repositório

```
git-music/
├── daemon/               # Motor de sincronização em segundo plano (Node.js/TypeScript)
│   ├── src/ai/           # Bridge de separação de stems por IA (Demucs)
│   ├── src/engine/       # CAS (Content-Addressable Storage), DAG Ledger e Auto-Freezer
│   ├── src/parsers/      # Decodificadores binários nativos de .flp, .als, .rpp e Music-IR
│   └── src/legal/        # Gerador de Split Sheets com prova criptográfica Ed25519
├── plugin/               # Código C++20 nativo do Plugin VST3/CLAP com WebView2
│   ├── include/          # Headers (RingBuffer, DSP Processor, WebViewContainer)
│   └── src/              # Implementação DSP e janela nativa HWND
├── ui/                   # Interface Minimalista Pure Black & Square VST HUD (React/Vite/Tailwind)
│   ├── src/components/   # CompactPluginHUD, VUMeter, PianoRollDiff, SplitSheetModal
│   └── src/audio/        # Motor Web Audio API e analisador FFT de 60 FPS
├── docs/                 # Documentação e imagens de demonstração
│   └── images/           # Espaço para prints e capturas de tela do plugin
├── start-git-music.ps1   # Launcher 1-Click para PowerShell
├── start-git-music.bat   # Launcher 1-Click para CMD
└── test-engine.ps1       # Test Runner 1-Click
```
