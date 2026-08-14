# 🎵 Git-Music

**Native Version Control & Real-time Collaboration inside your DAW (FL Studio, Ableton, Reaper, Logic).**

---

## 📖 Documentation

* [Project Architecture & Technical Specifications](file:///a:/Dropbox/DEV-AI/Projectios/git-music/PROJECT_SPEC.md)

---

## 🚀 Quick Overview

**Git-Music** brings the power of Git to music producers and sound engineers directly inside their digital audio workstations through a lightweight VST3/CLAP plugin backed by a high-performance local daemon and cloud storage.

### 🌟 Key Features
- **In-DAW Commits & Branches:** Take snapshots and create branches without leaving FL Studio.
- **Visual Waveform Diff:** Visually compare audio arrangements and mixes between versions.
- **Instant A/B Audio Comparison:** Toggle between commits in real-time synced to the beat.
- **Smart Deduplication (FastCDC + Blake3):** Upload only changed stems, saving bandwidth and storage.
- **Missing Plugin Resolver:** Auto-freeze audio stems for collaborators without the same VSTs.
