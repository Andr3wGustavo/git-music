# 🎵 Git-Music: In-DAW Version Control & Collaboration System

> **A native Git-like collaboration & version control system embedded directly inside DAWs (FL Studio, Ableton Live, Reaper, Logic Pro).**

---

## 📌 Executive Summary & Vision

Music production today is plagued by chaos: fragmented project versions (`track_final_v2_edit_FINAL.flp`), missing sample dependencies, incompatible third-party plugins, and tedious manual stem bouncing for collaboration.

**Git-Music** solves this by embedding a sleek, non-intrusive version control plugin directly into digital audio workstations (DAWs), allowing producers, sound designers, and mixing engineers to **Commit, Push, Pull, Branch, and Visual Diff** their audio tracks without ever leaving their creative flow.

---

## ⚙️ How Audio Plugins Work & Programming Languages

### 1. What languages are FL Studio plugins built with?

* **C++ (Industry Standard):** Over **95%** of all commercial audio plugins (VST3, AU, AAX, CLAP) are written in **C++**.
  * **Why C++?** Audio digital signal processing (DSP) requires strict **real-time determinism**. A single garbage collection pause (like in Java/C#/JS) causes audio dropouts (clicks, pops, buffer underruns). C++ offers direct memory management, SIMD vectorization (AVX/SSE) for DSP, and direct access to audio buffer callbacks.
* **FL Studio Native SDK:** Image-Line (the creator of FL Studio) originally built FL Studio in **Borland Delphi (Object Pascal)** and modern **C++**. They have an internal *FL Studio Plugin SDK* (in C++/Delphi), but FL Studio natively loads **VST2, VST3, and CLAP plugins** built in standard C++.
* **JUCE Framework (C++):** The golden standard in audio software (used by Arturia, Native Instruments, Spitfire Audio, FabFilter). JUCE compiles cross-platform plugins (VST3, AU, AAX, Standalone) and modern JUCE supports embedded WebViews (HTML/React UIs on top of C++ engines).
* **Rust (`nih-plug` / `vst-rs`):** The modern, high-performance alternative to C++. Offers memory safety without garbage collection, great concurrency primitives, and modern tooling.

---

## 🏛️ System Architecture

To guarantee **zero audio latency** and **100% DAW stability**, the system is architected in 3 decoupled tiers:

```
┌─────────────────────────────────────────────────────────────┐
│  DAW Host (FL Studio, Ableton Live, Reaper, Logic Pro)      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [Git-Music Plugin] (VST3 / CLAP / AU)                 │  │
│  │  • UI Layer: Embedded WebView (React + Tailwind CSS)   │  │
│  │  • Host Bridge: Transport & A/B Audio Comparison      │  │
│  │  • Light footprint (zero blocking I/O)                │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │ IPC (Local WebSockets / Named Pipes)
┌─────────────────────────────▼───────────────────────────────┐
│  [Git-Music Local Daemon] (Rust Engine)                     │
│  • File Watcher (monitors .flp, .als, .rpp, audio assets)   │
│  • Content-Addressable Storage (FastCDC + Blake3 Hashing)   │
│  • Waveform / Spectrogram Diff Generator                    │
│  • Local Git & Stems Storage Engine                         │
└─────────────────────────────┬───────────────────────────────┘
                              │ Secure HTTPS / WebSocket Sync
┌─────────────────────────────▼───────────────────────────────┐
│  [Git-Music Cloud Hub]                                      │
│  • Object Storage (S3 / Cloudflare R2 with Global Edge CDN) │
│  • Auth, Team Permissions, Branching & Pull Requests        │
│  • Timestamped Audio Comments & Feedback System             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Key Architectural Pillars

### 1. Audio Thread Safety (Zero-Glitch Policy)
* The DAW audio processing callback (`processBlock` in VST3/JUCE) runs with real-time OS priority.
* **Rule:** Never allocate memory, read disk files, or perform network requests on the audio thread.
* **Design:** The plugin is an ultra-lightweight UI/Bridge. All heavy tasks (file reading, hashing, compression, cloud synchronization) run asynchronously in the background **Local Daemon**.

### 2. DAW Project Format Handling
| DAW | Project File Extension | Format Details | Diff Strategy |
| :--- | :--- | :--- | :--- |
| **Reaper** | `.rpp` | Plain text / ASCII format | Exact textual Git diff (tracks, FX chains, volume, pans) |
| **Ableton Live** | `.als` | Gzipped XML | Unzip -> Structured XML diff (clips, devices, automations) |
| **FL Studio** | `.flp` | Proprietary binary chunk format | Binary snapshot + Automatic Stem / Master bounce metadata |
| **Logic Pro** | `.logicx` | Package bundle with plist/audio | Bundle asset tracking + project state diff |

### 3. Content-Addressable Audio Storage (Deduplication)
Audio projects contain large audio files (WAV stems, recordings, sample libraries):
* **FastCDC (Fast Content-Defined Chunking):** Chunks audio and project files by content boundaries.
* **Blake3 Cryptographic Hashing:** High-throughput hashing to identify existing chunks.
* **Efficiency:** If a producer only re-records a 15-second vocal verse, only the altered audio chunks are uploaded (~10 MB instead of re-uploading a 2 GB project).

---

## ✨ Core Product Features

1. **In-DAW Commit & Sync:**
   * One-click snapshot inside FL Studio: *"Added synth hook on intro + sidechain EQ"*.
2. **Instant A/B Audio Comparison:**
   * Toggle button in the plugin to hear the track at the current commit vs. an older commit or a collaborator's branch in real-time tempo sync.
3. **Timestamped Audio Comments:**
   * Pin feedback to exact bars/timestamps (e.g. `01:23`: *"Snare drum needs -2dB and more reverb"*).
4. **Missing Plugin & Sample Resolver:**
   * Detects missing VST plugins on a collaborator's machine and offers auto-bounced audio stems ("Freeze") so collaboration is never blocked.
5. **Visual Waveform Diff:**
   * Visual representation showing where tracks were added, removed, muted, or sliced.

---

## 🛠️ Recommended Tech Stack

| Layer | Component | Technology / Stack | Rationale |
| :--- | :--- | :--- | :--- |
| **Plugin Client** | Audio Engine & Bridge | **C++ (JUCE Framework)** or **Rust (`nih-plug`)** | Industry standard, VST3/CLAP/AU support, cross-platform |
| **Plugin UI** | Embedded GUI | **React + Tailwind CSS** (via WebView) | Modern, dynamic UI, rapid iteration, responsive design |
| **Local Daemon** | Background Core Engine | **Rust** (`tokio`, `blake3`, `notify`) | Blazing fast I/O, memory safety, minimal CPU usage |
| **Cloud Backend** | API & Sync Gateway | **Node.js (TypeScript) / Go** | High-concurrency WebSockets, real-time collaboration |
| **Audio Storage** | Chunk Storage | **Cloudflare R2 / AWS S3** | Zero-egress fee storage with global distribution |
| **Database** | Metadata & Commits | **PostgreSQL + Prisma** | Relational integrity for branches, commits, PRs, and users |

---

## 🗺️ Roadmap & Milestones

- [ ] **Phase 1: Proof of Concept (PoC)**
  - Local daemon in Rust/Go that watches a directory for `.flp` / `.als` / `.rpp` and creates incremental snapshots.
  - Basic waveform generator for audio diff preview.
- [ ] **Phase 2: Plugin Prototype**
  - VST3/CLAP plugin with an embedded WebView UI connecting to the local daemon via WebSockets.
  - Commit timeline and branch switcher.
- [ ] **Phase 3: Cloud Synchronization & Collaboration**
  - Cloudflare R2 storage integration with chunk deduplication.
  - Multi-user collaboration with invite links and stem-level pull requests.
