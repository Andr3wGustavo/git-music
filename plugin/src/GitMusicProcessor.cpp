#include "GitMusicProcessor.h"
#include <algorithm>

GitMusicProcessor::GitMusicProcessor() {
}

GitMusicProcessor::~GitMusicProcessor() {
    releaseResources();
}

void GitMusicProcessor::prepareToPlay(double sampleRate, int maxBlockSize) {
    m_sampleRate = sampleRate;
    m_maxBlockSize = maxBlockSize;
    m_crossfadeMix = 0.0f;
    m_targetCrossfadeMix = 0.0f;
    m_comparisonPlayhead = 0;
}

void GitMusicProcessor::releaseResources() {
    m_comparisonLeft.clear();
    m_comparisonRight.clear();
    m_transportQueue.reset();
}

void GitMusicProcessor::setABMode(ABMode mode) {
    m_currentMode = mode;
    m_targetCrossfadeMix = (mode == ABMode::Live) ? 0.0f : 1.0f;
}

void GitMusicProcessor::setCrossfade(float targetAtoBMix) {
    m_targetCrossfadeMix = std::clamp(targetAtoBMix, 0.0f, 1.0f);
}

void GitMusicProcessor::loadComparisonAudio(const std::vector<float>& leftChannel, const std::vector<float>& rightChannel) {
    m_comparisonLeft = leftChannel;
    m_comparisonRight = rightChannel;
    m_comparisonPlayhead = 0;
}

void GitMusicProcessor::processBlock(float** channelData, int numChannels, int numSamples, const DAWTransportInfo& transport) {
    // 1. Post transport update into lock-free queue for background thread to read
    m_transportQueue.push(transport);

    if (numChannels < 1 || channelData == nullptr) return;

    // 2. Synchronize comparison audio playhead with DAW host playhead position
    if (transport.isPlaying) {
        if (!m_comparisonLeft.empty()) {
            m_comparisonPlayhead = static_cast<size_t>(transport.samplePosition) % m_comparisonLeft.size();
        }
    }

    // 3. Smooth parameter smoothing constant (~20ms ramp to prevent clicks during A/B switch)
    const float smoothingCoeff = 0.05f;

    for (int sample = 0; sample < numSamples; ++sample) {
        // Interpolate crossfade mix towards target
        m_crossfadeMix += (m_targetCrossfadeMix - m_crossfadeMix) * smoothingCoeff;

        // Equal-Power Crossfade coefficients (preserves perceived loudness)
        const float liveGain = std::cos(m_crossfadeMix * 1.57079632679f); // cos(mix * pi/2)
        const float snapshotGain = std::sin(m_crossfadeMix * 1.57079632679f); // sin(mix * pi/2)

        for (int ch = 0; ch < numChannels; ++ch) {
            float liveSample = channelData[ch][sample];
            float snapshotSample = 0.0f;

            if (ch == 0 && !m_comparisonLeft.empty() && m_comparisonPlayhead < m_comparisonLeft.size()) {
                snapshotSample = m_comparisonLeft[m_comparisonPlayhead];
            } else if (ch == 1 && !m_comparisonRight.empty() && m_comparisonPlayhead < m_comparisonRight.size()) {
                snapshotSample = m_comparisonRight[m_comparisonPlayhead];
            }

            // Mix Live vs Snapshot seamlessly
            channelData[ch][sample] = (liveSample * liveGain) + (snapshotSample * snapshotGain);
        }

        if (transport.isPlaying && !m_comparisonLeft.empty()) {
            m_comparisonPlayhead = (m_comparisonPlayhead + 1) % m_comparisonLeft.size();
        }
    }
}
