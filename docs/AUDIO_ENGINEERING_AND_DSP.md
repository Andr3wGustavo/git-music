# Git-Music: Audio Engineering, DSP, and Real-Time Concurrency

This document details the digital signal processing (DSP) rules, concurrency architectures, and real-time safety constraints implemented in the Git-Music C++ audio plugin.

---

## 1. The Real-Time Audio Callback Constraints

Digital Audio Workstations execute audio rendering within a high-priority, real-time operating system thread via the `processBlock()` callback (VST3, CLAP, AU).

### 1.1 Forbidden Operations on the Audio Thread
A typical audio buffer size of 128 samples at 48 kHz provides only **2.67 milliseconds** of execution time. If execution exceeds this budget, an audible glitch (*buffer underrun*, click, or pop) occurs.

The following operations are strictly prohibited inside the audio thread:
* **Memory Allocation / Deallocation:** `malloc()`, `free()`, `new`, `delete`, `std::vector::push_back()` (allocations trigger OS syscalls and page faults).
* **Blocking Mutexes / Locks:** `std::mutex::lock()`, critical sections (risks Priority Inversion where a low-priority thread blocks the real-time audio thread).
* **Disk I/O / File Access:** `fopen()`, `std::ifstream`, `write()` (disk seek latency is non-deterministic).
* **Network Sockets / IPC Calls:** Direct network sockets or system calls.

---

## 2. Lock-Free Single-Producer Single-Consumer (SPSC) Architecture

To communicate between the real-time audio thread and the background IPC worker thread, Git-Music utilizes a lock-free SPSC FIFO queue with atomic acquire-release semantics.

### 2.1 Cache Line Alignment & False Sharing
To eliminate CPU cache invalidation bottlenecks between cores, the head and tail atomic pointers are aligned to separate 64-byte hardware cache lines:

```cpp
template <typename T, size_t Capacity>
class SpscFifoRingBuffer {
private:
    T m_buffer[Capacity];
    alignas(64) std::atomic<size_t> m_head; // Read by Consumer
    alignas(64) std::atomic<size_t> m_tail; // Written by Producer
};
```

### 2.2 Memory Ordering Guarantees
* **Producer (`push`):** Stores elements with `std::memory_order_release`, ensuring the element write in memory is visible before the tail pointer update.
* **Consumer (`pop`):** Loads elements with `std::memory_order_acquire`, ensuring dependent memory reads occur after the head pointer check.

---

## 3. Equal-Power A/B Comparison Mathematics

When switching between live DAW audio and a reference snapshot, a linear crossfade causes a perceived volume drop of approximately **-3 dB** at the 50% midpoint.

Git-Music implements a constant-power trigonometric crossfading curve:

$$g_{\text{live}}(\alpha) = \cos\left(\alpha \cdot \frac{\pi}{2}\right)$$
$$g_{\text{snapshot}}(\alpha) = \sin\left(\alpha \cdot \frac{\pi}{2}\right)$$

Where $\alpha \in [0.0, 1.0]$ represents the crossfader position.

### Energy Conservation Property
$$g_{\text{live}}^2(\alpha) + g_{\text{snapshot}}^2(\alpha) = \cos^2\left(\frac{\alpha \pi}{2}\right) + \sin^2\left(\frac{\alpha \pi}{2}\right) = 1$$

This ensures total acoustic power remains perfectly constant across the entire crossfade transition.

---

## 4. Parameter Smoothing and De-Clicking

Abrupt parameter changes in audio cause instantaneous waveform discontinuities, resulting in high-frequency clicks.

Git-Music applies a single-pole low-pass recursive smoothing filter to crossfader transitions:

$$y[n] = y[n-1] + \beta \cdot (x[n] - y[n-1])$$

Where:
* $x[n]$ is the target crossfade value.
* $y[n]$ is the interpolated smoothed coefficient.
* $\beta \approx 0.05$ creates a smooth ~20 millisecond ramp curve.
