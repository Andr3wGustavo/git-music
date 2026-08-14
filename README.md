# Git-Music

Native In-DAW Version Control and Real-Time Collaboration System for Music Producers (FL Studio, Ableton Live, Reaper, Logic Pro).

---

## 1. Overview

Git-Music is a specialized version control and collaboration platform designed specifically for audio production workflows. By embedding a lightweight VST3/CLAP audio plugin directly within Digital Audio Workstations (DAWs), Git-Music enables music producers, audio engineers, and sound designers to create snapshots, switch branches, visually diff audio stems, and collaborate asynchronously without leaving their DAW environment.

Traditional version control systems (such as standard Git) fail when handling audio production due to multi-gigabyte binary files, proprietary DAW project formats, and the lack of audio-specific visual diff tools. Git-Music addresses these limitations through a decoupled three-tier architecture utilizing Content-Addressable Storage (CAS), real-time lock-free audio processing, and an embedded studio cockpit interface.

---

## 2. System Architecture

Git-Music is built upon three decoupled subsystems to ensure strict real-time audio stability and zero latency during digital signal processing (DSP):

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
|  - Real-Time File Watcher (.flp, .als, .rpp, .wav, .flac)   |
|  - Content-Addressable Storage (CAS with SHA-256 / FastCDC)  |
|  - Commit Ledger, Snapshot Manifests, and Branch History    |
|  - Audio Diff Extraction and Waveform Peak Generation       |
+-----------------------------+-------------------------------+
                              | Encrypted HTTPS / WebSockets
+-----------------------------v-------------------------------+
|  Git-Music Cloud Hub (Optional Remote Backend)             |
|  - Zero-Egress Object Storage (Cloudflare R2 / AWS S3)      |
|  - Team Permissions, Presence, and Stem Pull Requests       |
+-------------------------------------------------------------+
```

---

## 3. Core Technical Components

### 3.1 Native Audio Plugin (`/plugin`)
Written in **C++20** with **CMake**, targeting standard **VST3** and **CLAP** interfaces.

* **Audio Thread Safety (Zero-Allocation Policy):** The audio processing callback (`processBlock`) runs on the host DAW's high-priority real-time audio thread. To prevent audio glitches (buffer underruns and clicks), this thread never performs memory allocations, disk I/O, or blocking mutex acquisitions.
* **Lock-Free SPSC Ring Buffer (`plugin/include/RingBuffer.h`):** Employs atomic memory ordering (`acquire` / `release`) to transfer host transport metadata (BPM, playhead sample position, time signature) from the audio thread to the background IPC thread with sub-microsecond latency.
* **Equal-Power A/B Comparison Crossfader (`plugin/src/GitMusicProcessor.cpp`):** Applies constant-power trigonometric curves ($\cos / \sin$) with parameter smoothing ramps (~20ms) to allow producers to switch seamlessly between the live DAW master output and reference commit snapshots in beat synchronization.

### 3.2 Local Engine Daemon (`/daemon`)
Written in **TypeScript / Node.js**, running as a background service.

* **Content-Addressable Storage (CAS):** Implements chunk hashing and cryptographic SHA-256 deduplication. When a producer alters only a single stem (e.g., vocal track), only the modified file is stored; unchanged tracks share immutable pointers, saving up to 80% in local and remote storage.
* **DAW Project File Watcher:** Monitors `.flp` (FL Studio), `.als` (Ableton Live), and `.rpp` (Reaper) files along with linked sample directories, debouncing rapid disk writes to trigger automatic snapshot validation.
* **Snapshot Ledger (`daemon/src/engine/ledger.ts`):** Maintains the directed acyclic graph (DAG) of commit nodes, branches, parent links, and timecoded mixing notes.
* **WebSocket IPC Server (`daemon/src/ipc/server.ts`):** Listens on port `4848` to broadcast real-time state changes between the local filesystem, the C++ plugin instance, and the UI.

### 3.3 Studio Cockpit UI (`/ui`)
Written in **React**, **TypeScript**, **Tailwind CSS**, and **HTML5 Canvas**.

* **Multi-Track Waveform Diff Visualizer:** Renders multi-stem audio arrangements on an interactive canvas with color-coded diff overlays (cyan for base stems, pink for vocal adjustments, green for sub-bass, and amber for feedback pins).
* **Timestamped Audio Comments:** Producers can click on specific bars or transients along the waveform timeline to leave precise mixing notes (e.g., *"Reduce 300Hz on snare"*).
* **Missing VST Resolver & Stem Auto-Freeze:** Detects third-party plugins missing on a collaborator's system (e.g., *Xfer Serum*, *FabFilter Pro-Q*) and provides pre-rendered audio stems so collaboration is never impeded.
* **Branch & Commit Graph:** Interactive visual tree displaying branch forks, commit hashes, authors, and cumulative deduplication metrics.

---

## 4. Repository Structure

```
git-music/
├── daemon/                    # Background local engine and IPC server
│   ├── src/
│   │   ├── engine/
│   │   │   ├── cas.ts         # Content-Addressable Storage engine
│   │   │   ├── ledger.ts      # Commit ledger and branching manager
│   │   │   └── watcher.ts     # Project file system watcher
│   │   ├── ipc/
│   │   │   ├── protocol.ts    # Typed IPC protocol definitions
│   │   │   └── server.ts      # WebSocket IPC server implementation
│   │   └── index.ts           # Daemon bootstrapping and initial seeding
│   ├── package.json
│   └── tsconfig.json
│
├── plugin/                    # Native C++ audio plugin (VST3 / CLAP)
│   ├── include/
│   │   ├── GitMusicProcessor.h# Audio rendering and A/B crossfader
│   │   ├── IPCBridge.h        # WebSocket client bridge
│   │   └── RingBuffer.h       # Lock-free SPSC queue
│   ├── src/
│   │   ├── GitMusicProcessor.cpp
│   │   └── IPCBridge.cpp
│   ├── CMakeLists.txt         # C++20 CMake build configuration
│   └── README.md
│
├── ui/                        # In-DAW Studio Cockpit interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx             # Project status, branch selector, CAS savings
│   │   │   ├── TransportBar.tsx       # Live BPM, bar position, A/B crossfader
│   │   │   ├── WaveformVisualizer.tsx # Multi-track canvas waveform diff
│   │   │   ├── CommitTimeline.tsx     # Interactive commit tree
│   │   │   ├── StemList.tsx           # Stem inventory and auto-freeze controls
│   │   │   ├── AudioCommentsList.tsx  # Timecoded comments list
│   │   │   └── Modals (CommitModal, BranchModal, CommentModal)
│   │   ├── context/
│   │   │   └── IPCContext.tsx         # WebSocket state provider
│   │   ├── App.tsx
│   │   ├── index.css                  # Studio styling and glassmorphism
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── PROJECT_SPEC.md            # Technical specifications and format analysis
├── ROADMAP.md                 # 5-phase development roadmap
├── package.json               # Root monorepo scripts
└── .gitignore
```

---

## 5. Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **C++ Toolchain (for plugin compilation)**: MSVC (Visual Studio 2022/2026) on Windows, or Clang/Xcode on macOS with CMake 3.20+.

### 5.1 Installation
Clone the repository and install dependencies:

```bash
git clone git@github.com:Andr3wGustavo/git-music.git
cd git-music

# Install daemon dependencies
cd daemon
npm install
npm run build
cd ..

# Install UI dependencies
cd ui
npm install
cd ..
```

### 5.2 Running the Development Environment

1. **Start the Local Engine Daemon:**
```bash
npm run dev:daemon
```
The daemon starts listening on `ws://127.0.0.1:4848` and initializes the file watcher in the project root.

2. **Start the Studio Cockpit UI:**
```bash
npm run dev:ui
```
Opens the in-DAW cockpit interface on `http://localhost:3000`.

---

## 6. Building the C++ Audio Plugin

To compile the native VST3 / CLAP plugin target on Windows using MSVC:

```bash
cd plugin
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022" -A x64
cmake --build . --config Release
```

The resulting `git_music_plugin.vst3` binary can be installed to the system VST3 directory (`C:\Program Files\Common Files\VST3\`).

---

## 7. Development Roadmap

* **Phase 1: Local Engine Foundation (Complete):** Content-Addressable Storage, snapshot ledger, file watcher, and low-latency IPC.
* **Phase 2: Native C++ Plugin Scaffold (Complete):** CMake configuration, lock-free ring buffer, equal-power crossfader, and IPC bridge.
* **Phase 3: Studio Cockpit Interface (Complete):** Canvas waveform diff, real-time transport sync, A/B crossfader, stem auto-freeze, and timecoded audio comments.
* **Phase 4: Cloud Synchronization (In Progress):** Chunk synchronization to Cloudflare R2 / AWS S3, stem pull requests, and multi-user presence.
* **Phase 5: Distribution & Packaging:** Installers for Windows and macOS with automated DAW directory discovery.

For comprehensive architectural details, refer to `PROJECT_SPEC.md` and `ROADMAP.md`.

---

## 8. License

This project is licensed under the MIT License.
