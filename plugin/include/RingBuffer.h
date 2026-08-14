#pragma once
#include <atomic>
#include <vector>
#include <cstddef>
#include <cstring>

/**
 * @file RingBuffer.h
 * @brief Lock-free Single-Producer Single-Consumer (SPSC) FIFO ring buffer.
 * 
 * DESIGN RATIONALE:
 * The DAW's real-time audio callback (`processBlock`) must NEVER allocate memory or block on mutexes.
 * This lock-free ring buffer allows safe, zero-latency communication between the audio thread
 * and the background IPC worker thread.
 */

template <typename T, size_t Capacity>
class SpscFifoRingBuffer {
public:
    SpscFifoRingBuffer() : m_head(0), m_tail(0) {}

    /**
     * @brief Push item to the ring buffer (called from Producer thread).
     * @return true if pushed, false if buffer is full.
     */
    bool push(const T& item) {
        const size_t currentTail = m_tail.load(std::memory_order_relaxed);
        const size_t nextTail = (currentTail + 1) % Capacity;

        if (nextTail == m_head.load(std::memory_order_acquire)) {
            return false; // Buffer Full - drops event rather than blocking audio thread
        }

        m_buffer[currentTail] = item;
        m_tail.store(nextTail, std::memory_order_release);
        return true;
    }

    /**
     * @brief Pop item from the ring buffer (called from Consumer thread).
     * @return true if popped, false if buffer is empty.
     */
    bool pop(T& item) {
        const size_t currentHead = m_head.load(std::memory_order_relaxed);

        if (currentHead == m_tail.load(std::memory_order_acquire)) {
            return false; // Buffer Empty
        }

        item = m_buffer[currentHead];
        m_head.store((currentHead + 1) % Capacity, std::memory_order_release);
        return true;
    }

    bool isEmpty() const {
        return m_head.load(std::memory_order_relaxed) == m_tail.load(std::memory_order_relaxed);
    }

    void reset() {
        m_head.store(0, std::memory_order_relaxed);
        m_tail.store(0, std::memory_order_relaxed);
    }

private:
    T m_buffer[Capacity];
    alignas(64) std::atomic<size_t> m_head; // Align to cache line to prevent false sharing
    alignas(64) std::atomic<size_t> m_tail;
};
