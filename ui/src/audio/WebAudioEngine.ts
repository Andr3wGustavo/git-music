/**
 * @file WebAudioEngine.ts
 * @description Real-time Web Audio API Engine with multi-stem synthesis, DSP filtering,
 * live FFT Spectrum Analyser (60 FPS), and stereo LED VU metering.
 */

export interface VULevels {
  leftDb: number;
  rightDb: number;
  leftLinear: number;
  rightLinear: number;
  peakClip: boolean;
}

export class WebAudioEngine {
  private static instance: WebAudioEngine | null = null;
  private ctx: AudioContext | null = null;

  // Master bus nodes
  private masterGain: GainNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private filterAB: BiquadFilterNode | null = null;

  // Real-time analysis buffers
  private freqData: Uint8Array = new Uint8Array(256);
  private timeDataLeft: Float32Array = new Float32Array(512);
  private timeDataRight: Float32Array = new Float32Array(512);

  // Playback state
  private isPlaying: boolean = false;
  private bpm: number = 128.0;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private crossfadeMix: number = 0.0; // 0 = Live, 1 = Snapshot

  private constructor() {}

  public static getInstance(): WebAudioEngine {
    if (!WebAudioEngine.instance) {
      WebAudioEngine.instance = new WebAudioEngine();
    }
    return WebAudioEngine.instance;
  }

  /**
   * Initialize audio context on first user click (browser autoplay policy).
   */
  public init(): void {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    // A/B DSP Filter (Warm tape saturation & EQ shift when crossfading)
    this.filterAB = this.ctx.createBiquadFilter();
    this.filterAB.type = 'lowpass';
    this.filterAB.frequency.setValueAtTime(20000, this.ctx.currentTime);

    // Stereo Analysers
    this.analyserLeft = this.ctx.createAnalyser();
    this.analyserLeft.fftSize = 512;
    this.analyserLeft.smoothingTimeConstant = 0.8;

    this.analyserRight = this.ctx.createAnalyser();
    this.analyserRight.fftSize = 512;
    this.analyserRight.smoothingTimeConstant = 0.8;

    const splitter = this.ctx.createChannelSplitter(2);

    // Connect audio routing graph:
    // Source -> filterAB -> masterGain -> splitter -> Analysers -> destination
    this.filterAB.connect(this.masterGain);
    this.masterGain.connect(splitter);
    splitter.connect(this.analyserLeft, 0);
    splitter.connect(this.analyserRight, 1);
    this.masterGain.connect(this.ctx.destination);
  }

  public async start(): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isPlaying = true;
    this.currentStep = 0;

    const stepIntervalMs = (60_000 / this.bpm) / 4; // 16th note steps
    this.timerId = window.setInterval(() => {
      this.playStep(this.currentStep);
      this.currentStep = (this.currentStep + 1) % 16;
    }, stepIntervalMs);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public setBpm(newBpm: number): void {
    this.bpm = newBpm;
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }

  /**
   * Set equal-power A/B crossfader mix (0.0 = Live DAW, 1.0 = Snapshot).
   */
  public setCrossfade(mix: number): void {
    this.crossfadeMix = Math.max(0, Math.min(1, mix));
    if (!this.filterAB || !this.ctx) return;

    // Apply real-time acoustic color shift during A/B preview
    const freq = 20000 - this.crossfadeMix * 8000;
    this.filterAB.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
  }

  /**
   * Synthesizes audio in sync with the transport.
   */
  private playStep(step: number): void {
    if (!this.ctx || !this.filterAB) return;
    const now = this.ctx.currentTime;

    // 1. Kick Drum (Steps 0, 4, 8, 12)
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.filterAB);

      osc.start(now);
      osc.stop(now + 0.25);
    }

    // 2. Snare / Claps (Steps 4, 12)
    if (step === 4 || step === 12) {
      const noiseBuffer = this.createNoiseBuffer();
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterAB);

      noise.start(now);
      noise.stop(now + 0.18);
    }

    // 3. Hi-Hat (Every odd step: 2, 6, 10, 14)
    if (step % 2 === 0 && step % 4 !== 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(8000, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.filterAB);

      osc.start(now);
      osc.stop(now + 0.05);
    }

    // 4. Sub-Bass & 808 Synth (Steps 0, 3, 6, 8, 11, 14)
    if ([0, 3, 6, 8, 11, 14].includes(step)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const notes = [46.25, 41.2, 55.0, 46.25]; // F#1, E1, A1, F#1
      const noteFreq = notes[Math.floor(step / 4) % notes.length];

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(noteFreq, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.filterAB);

      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Get 60 FPS frequency spectrum data (256 bins) for canvas rendering.
   */
  public getFrequencySpectrum(): Uint8Array {
    if (this.analyserLeft && this.isPlaying) {
      this.analyserLeft.getByteFrequencyData(this.freqData as any);
    } else {
      this.freqData.fill(0);
    }
    return this.freqData;
  }

  /**
   * Get real-time stereo VU meter levels (-48dB to +6dB).
   */
  public getVULevels(): VULevels {
    if (!this.isPlaying || !this.analyserLeft || !this.analyserRight) {
      return { leftDb: -48, rightDb: -48, leftLinear: 0, rightLinear: 0, peakClip: false };
    }

    this.analyserLeft.getFloatTimeDomainData(this.timeDataLeft as any);
    this.analyserRight.getFloatTimeDomainData(this.timeDataRight as any);

    let sumL = 0;
    let sumR = 0;
    for (let i = 0; i < this.timeDataLeft.length; i++) {
      sumL += this.timeDataLeft[i] * this.timeDataLeft[i];
      sumR += this.timeDataRight[i] * this.timeDataRight[i];
    }

    const rmsL = Math.sqrt(sumL / this.timeDataLeft.length);
    const rmsR = Math.sqrt(sumR / this.timeDataRight.length);

    const leftDb = Math.max(-48, 20 * Math.log10(rmsL || 0.0001));
    const rightDb = Math.max(-48, 20 * Math.log10(rmsR || 0.0001));

    return {
      leftDb: Math.round(leftDb * 10) / 10,
      rightDb: Math.round(rightDb * 10) / 10,
      leftLinear: Math.min(1.0, rmsL * 3.5),
      rightLinear: Math.min(1.0, rmsR * 3.5),
      peakClip: leftDb > -0.1 || rightDb > -0.1,
    };
  }
}
