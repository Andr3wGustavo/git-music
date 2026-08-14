# 🎹 Git-Music: Native Audio Plugin (C++ VST3 / CLAP / AU)

The native in-DAW audio plugin for **FL Studio, Ableton Live, Reaper, and Logic Pro**.

---

## ⚡ Architecture Highlights

1. **Zero-Allocation Real-time Audio Callback:**
   * The `processBlock` method uses a lock-free Single-Producer Single-Consumer (SPSC) ring buffer (`RingBuffer.h`) to ensure the host audio thread never blocks, allocates memory, or encounters priority inversions.
2. **Smooth A/B Equal-Power Crossfader:**
   * Seamlessly switches between the live DAW master and reference stems/commits in tempo-synced playback without clicks or pops.
3. **Asynchronous WebSocket IPC Bridge:**
   * Offloads all networking, file hashing, and snapshot requests to the background `git-music-core` daemon on `ws://127.0.0.1:4848`.

---

## 🛠️ Building with CMake

### Requirements:
* CMake 3.20+
* Visual Studio 2022/2026 (MSVC) on Windows or Xcode/Clang on macOS
* C++20 standard compiler

### Windows Build Steps:
```bash
cd plugin
mkdir build && cd build
cmake .. -G "Visual Studio 17 2022" -A x64
cmake --build . --config Release
```
Output binary: `git_music_plugin.vst3` (Deployable directly to `C:\Program Files\Common Files\VST3\`).
