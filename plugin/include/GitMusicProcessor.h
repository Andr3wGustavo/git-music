#pragma once
#include <string>
#include <vector>
#include <cmath>
#include "RingBuffer.h"

/**
 * @struct DAWTransportInfo
 * @brief Real-time transport state received from DAW host.
 */
struct DAWTransportInfo {
    bool isPlaying = false;
    double bpm = 120.0;
    int timeSigNumerator = 4;
    int timeSigDenominator = 4;
    int64_t samplePosition = 0;
    double barPosition = 1.0;
};

/**
 * @enum ABMode
 * @brief Comparison mode: Live DAW vs Cached Snapshot.
 */
enum class ABMode {
    Live = 0,       // Live DAW Master Audio
    SnapshotA = 1,  // Base Commit Audio
    SnapshotB = 2   // Target Branch/Commit Audio
};

class GitMusicProcessor {
public:
    GitMusicProcessor();
    ~GitMusicProcessor();

    void prepareToPlay(double sampleRate, int maxBlockSize);
    void releaseResources();

    /**
     * @brief Real-time audio rendering callback (called from Host audio thread).
     * @param buffer Interleaved/De-interleaved audio channels.
     * @param numChannels Number of channels (typically 2 for stereo).
     * @param numSamples Number of samples in current buffer block.
     * @param transport Host transport information.
     */
    void processBlock(float** channelData, int numChannels, int numSamples, const DAWTransportInfo& transport);

    // A/B Audio Switcher control
    void setABMode(ABMode mode);
    void setCrossfade(float targetAtoBMix); // 0.0 = 100% Live, 1.0 = 100% Comparison

    // Load comparison buffer for A/B preview
    void loadComparisonAudio(const std::vector<float>& leftChannel, const std::vector<float>& rightChannel);

private:
    double m_sampleRate = 44100.0;
    int m_maxBlockSize = 512;

    ABMode m_currentMode = ABMode::Live;
    float m_crossfadeMix = 0.0f;       // 0.0 = Live, 1.0 = Snapshot
    float m_targetCrossfadeMix = 0.0f; // Smooth parameter interpolation

    // Cached comparison audio buffers for seamless in-tempo A/B comparison
    std::vector<float> m_comparisonLeft;
    std::vector<float> m_comparisonRight;
    size_t m_comparisonPlayhead = 0;

    // Lock-free ring buffer for transport events
    SpscFifoRingBuffer<DAWTransportInfo, 128> m_transportQueue;
};
