# Git-Music

Native In-DAW Version Control, Real-Time Collaboration, and Visual Audio/MIDI Diff System for Music Producers (FL Studio, Ableton Live, Reaper, Logic Pro).

---

## 1. Overview

**Git-Music** is a specialized version control and collaboration platform designed specifically for audio production workflows. By combining a native C++20 VST3/CLAP audio plugin with an intelligent background daemon and a modern in-DAW studio cockpit, Git-Music enables music producers, audio engineers, and sound designers to:

* **Create Instant Commits & Branches:** Snapshot projects with cryptographically verified Content-Addressable Storage (CAS) that deduplicates unchanged audio stems, saving up to 80% in storage.
* **Inspect Multi-Track Audio Waveform Diffs:** Graphically compare stems between commits, branches, and versions with transient overlays.
* **Inspect Visual MIDI / Piano Roll Diffs:** Visually inspect melodic and harmonic alterations between commits (🟩 Added notes, 🟥 Deleted notes, 🟨 Modified pitch/velocity/duration) with automated harmonic conflict & dissonance detection.
* **Parse DAW Project Files Natively:** Automatic deep inspection of FL Studio (`.flp`), Ableton Live (`.als`), and Reaper (`.rpp`) project binaries to extract tempo, track hierarchies, plugin inventories, and sample dependencies.
* **Streamline Cloud Collaboration:** Zero-egress CAS chunk synchronization over Cloudflare R2 / AWS S3 and 3-way stem pull requests with automated LUFS gain balancing and spectral collision alerts.
* **Zero-Allocation In-DAW Audio Processing:** Lock-free SPSC ring buffers ensure the real-time audio thread never drops a buffer or glitches during snapshot switches.

---

## 2. Quick Start (1-Click Windows Startup)

To instantly launch the Git-Music ecosystem on Windows:

```cmd
# Double click or run in terminal:
start-git-music.bat
```

This single command:
1. Verifies your Node.js environment.
2. Automatically installs any missing dependencies.
3. Compiles the TypeScript daemon.
4. Starts the background WebSocket IPC server on `ws://127.0.0.1:4848`.
5. Starts the Vite Studio Cockpit and opens `http://localhost:5173` in your browser.

To run the automated engine test suite:
```cmd
test-engine.bat
# Or via npm:
npm run test
```

---

## 3. System Architecture

```
+-------------------------------------------------------------+
|  DAW Host (FL Studio, Ableton Live, Reaper, Logic Pro)      |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  Git-Music Audio Plugin (C++ VST3 / CLAP / AU)        |  |
|  |  - Real-time Audio Callback (processBlock)            |  |
|  |  - Lock-Free SPSC Ring Buffer for Event Queueing      |  |
|  |  - Equal-Power A/B Audio Comparison Crossfader        |  |
|  |  - Embedded Studio Cockpit View                       |  |
|  +--------------------------+----------------------------+  |
+-----------------------------|-------------------------------+
                              | IPC (WebSocket on ws://127.0.0.1:4848)
+-----------------------------v-------------------------------+
|  Git-Music Local Engine Daemon (Node.js / TypeScript Core)  |
|  - Native FL Studio (.flp) Binary Chunk Parser              |
|  - Native Ableton Live (.als) In-Memory Gzip/XML Parser      |
|  - Native Reaper (.rpp) Declarative Text Parser             |
|  - Content-Addressable Storage (CAS with SHA-256 FastCDC)   |
|  - Commit Ledger, Snapshot Manifests, and Branch History    |
|  - 3-Way Stem Merge & Spectral Masking Warning Engine       |
+-----------------------------+-------------------------------+
                              | Zero-Egress Storage Pipeline
+-----------------------------v-------------------------------+
|  Git-Music Cloud Hub (Cloudflare R2 / AWS S3)               |
|  - Cryptographic Chunk Deduplication & Delta Sync           |
|  - Multi-Producer Stem Pull Requests & Branch Merging        |
+-------------------------------------------------------------+
```

---

## 4. Core Technical Modules

### 4.1 Native DAW Project Parsers (`daemon/src/parsers/`)
* **FL Studio Binary Parser (`flpParser.ts`):** Decodes raw binary byte, word, dword, and text/chunk events (`FLhd`, `FLdt`, fine tempo, channel rack plugins, audio samples, and pattern note tuples).
* **Ableton Live Gzip Parser (`alsParser.ts`):** Unpacks compressed streams in-memory with Node `zlib`, extracting device chains, VST plugin descriptors, audio sample references, and MIDI clip notes.
* **Reaper Parser (`rppParser.ts`):** Parses Cockos Reaper hierarchical text AST documents and FX chains.
* **Unified Project Inspector (`inspector.ts`):** Unified router that analyzes any incoming DAW session format.

### 4.2 Local Engine & CAS (`daemon/src/engine/`)
* **Content-Addressable Storage (`cas.ts`):** 2-level directory sharded object store (`.gitmusic/objects/ab/cdef...`) with cryptographic SHA-256 chunk deduplication.
* **Ledger Engine (`ledger.ts`):** Commit DAG manager tracking branches, snapshots, parent references, and timecoded mixing notes.
* **Project Watcher (`watcher.ts`):** Real-time debounce file system watcher for project files and audio recordings.

### 4.3 Cloud Collaboration & Merge Engine (`daemon/src/cloud/`)
* **Cloud CAS Gateway (`cloudSync.ts`):** Zero-egress synchronization with Cloudflare R2 / AWS S3, calculating delta payloads between local CAS and remote storage.
* **Stem Merge Engine (`mergeEngine.ts`):** 3-way stem reconciliation with automated LUFS gain staging and spectral collision warnings (e.g. 40Hz–100Hz kick vs. sub-bass phase masking).

### 4.4 In-DAW Studio Cockpit (`ui/src/`)
* **Waveform Diff Visualizer (`WaveformVisualizer.tsx`):** Canvas-based multi-track stem visualizer with transient markers and pin notes.
* **Visual MIDI Diff Piano Roll (`PianoRollDiff.tsx`):** Interactive piano roll inspector displaying note additions, deletions, velocity changes, and key/scale dissonance alerts.
* **Stem Pull Request Modal (`PullRequestModal.tsx`):** In-DAW PR review modal with 1-click branch stem merging.

---

## 5. Development & Testing

```bash
# Run all automated unit and integration tests (100% green)
npm run test

# Build daemon and UI production packages
npm run build:all

# Start daemon in watch mode
npm run dev:daemon

# Start UI in Vite dev mode
npm run dev:ui
```

---

## 6. License

This project is licensed under the MIT License.
