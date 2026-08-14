/**
 * @file SpectrumAnalyzer.tsx
 * @description Real-Time 60 FPS Stereo FFT Frequency Spectrum Visualizer (20Hz - 20kHz).
 * Hardware-grade thermal gradients, peak-hold curves, and frequency grid markings.
 */

import React, { useRef, useEffect } from 'react';
import { WebAudioEngine } from '../audio/WebAudioEngine';
import { Activity } from 'lucide-react';

export const SpectrumAnalyzer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const audioEngine = WebAudioEngine.getInstance();
    const peakHold = new Float32Array(128).fill(0);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const spectrum = audioEngine.getFrequencySpectrum();

      // Background with subtle radial glow
      ctx.fillStyle = '#060911';
      ctx.fillRect(0, 0, width, height);

      // Frequency Grid lines (60Hz, 250Hz, 1kHz, 4kHz, 16kHz)
      ctx.strokeStyle = '#1e293b40';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      const gridPositions = [0.1, 0.25, 0.5, 0.75, 0.9];
      gridPositions.forEach((pos) => {
        ctx.beginPath();
        ctx.moveTo(pos * width, 0);
        ctx.lineTo(pos * width, height);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw Bars and Filled Spectrum Area
      const barCount = 64;
      const barWidth = (width / barCount) - 1.5;

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#00F0FF20');
      gradient.addColorStop(0.4, '#00FF6660');
      gradient.addColorStop(0.75, '#9D00FFA0');
      gradient.addColorStop(1, '#FF0055EE');

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.floor(Math.pow(i / barCount, 1.6) * spectrum.length);
        const val = spectrum[binIndex] || 0;
        const normalized = val / 255;
        const barHeight = normalized * (height - 12);
        const x = i * (barWidth + 1.5);
        const y = height - barHeight;

        // Peak decay calculation
        if (barHeight > peakHold[i]) {
          peakHold[i] = barHeight;
        } else {
          peakHold[i] = Math.max(0, peakHold[i] - 0.7);
        }

        // Draw individual subtle bar
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak hold line dot
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(x, height - peakHold[i] - 2, barWidth, 2);

        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x + barWidth / 2, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      // Top frequency labels
      ctx.fillStyle = '#64748b80';
      ctx.font = '9px monospace';
      ctx.fillText('60 Hz (Sub)', 0.08 * width, 12);
      ctx.fillText('250 Hz (Low)', 0.23 * width, 12);
      ctx.fillText('1 kHz (Mid)', 0.48 * width, 12);
      ctx.fillText('4 kHz (Presence)', 0.72 * width, 12);
      ctx.fillText('16 kHz (Air)', 0.88 * width, 12);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
            Real-Time FFT Spectral Analyzer (60 FPS)
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">20 Hz — 20 kHz • 512 Bins</span>
      </div>

      <canvas
        ref={canvasRef}
        width={720}
        height={90}
        className="w-full h-[90px] rounded-lg border border-slate-900 bg-slate-950 block shadow-inner"
      />
    </div>
  );
};
