import React, { useRef, useEffect, useState } from 'react';
import { useIPC } from '../context/IPCContext';
import { Layers } from 'lucide-react';

interface WaveformVisualizerProps {
  onAddCommentAtBar: (bar: number) => void;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ onAddCommentAtBar }) => {
  const { projectState } = useIPC();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const transport = projectState.transport;
  const stems = projectState.stems;
  const comments = projectState.comments;
  const totalBars = 64;

  // Draw Audio Waveforms & Diff Overlays on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0d1322';
    ctx.fillRect(0, 0, width, height);

    // Draw Bar Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let bar = 1; bar <= totalBars; bar += 4) {
      const x = (bar / totalBars) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Bar Number Labels
      ctx.fillStyle = '#475569';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Bar ${bar}`, x + 4, 14);
    }

    // Render Waveform Tracks
    const trackHeight = height / Math.max(1, stems.length);

    stems.forEach((stem, index) => {
      if (stem.isMuted) return;

      const trackY = index * trackHeight;
      const centerY = trackY + trackHeight / 2;

      // Track separator line
      ctx.strokeStyle = 'rgba(36, 48, 76, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, trackY);
      ctx.lineTo(width, trackY);
      ctx.stroke();

      // Stem Track Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillText(stem.name, 12, trackY + 16);

      // Generate deterministic pseudo-random waveform peaks
      const seed = stem.hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const points = 180;
      const barWidth = width / points;

      ctx.fillStyle = index === 3 
        ? '#ff007f' // Vocal Track (Neon Pink Diff)
        : index === 1 
        ? '#00ff88' // Bass Track (Neon Green)
        : '#00f2fe'; // Drum/Synth Track (Neon Cyan)

      for (let i = 0; i < points; i++) {
        const x = i * barWidth;
        const pseudoRand = Math.sin(i * 0.2 + seed) * Math.cos(i * 0.05 + index);
        const amplitude = Math.abs(pseudoRand) * (trackHeight * 0.38);

        // Draw symmetrical audio bar
        ctx.fillRect(x, centerY - amplitude, barWidth - 1, amplitude * 2);
      }
    });

    // Draw Timestamped Audio Comment Pins
    comments.forEach((c) => {
      const commentX = (c.barPosition / totalBars) * width;

      // Vertical Marker
      ctx.strokeStyle = c.resolved ? '#64748b' : '#ffb703';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(commentX, 0);
      ctx.lineTo(commentX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pin Head Icon
      ctx.fillStyle = c.resolved ? '#475569' : '#ffb703';
      ctx.beginPath();
      ctx.arc(commentX, 22, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Live DAW Playhead
    const playheadX = (transport.barPosition / totalBars) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset blur

    // Playhead Head Indicator
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 8);
    ctx.closePath();
    ctx.fill();
  }, [stems, transport.barPosition, comments, totalBars]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedBar = Math.max(1, Math.round((x / rect.width) * totalBars));
    onAddCommentAtBar(clickedBar);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const bar = Math.max(1, Math.round((x / rect.width) * totalBars));
    setHoveredBar(bar);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-studio-border shadow-2xl space-y-4">
      {/* Top Header of Waveform */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-studio-accent/10 border border-studio-accent/30 text-studio-accent">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Multi-Track Stem Diff & Waveforms</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-studio-card text-studio-accent font-mono">
                {stems.length} Stems Tracked
              </span>
            </h2>
            <p className="text-xs text-studio-muted">
              Click anywhere along the timeline to drop a timestamped mixing comment.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-studio-accent"></span>
            <span className="text-slate-300">Base Tracks</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-studio-neonPink"></span>
            <span className="text-slate-300">Vocal Diff</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-studio-neonGreen"></span>
            <span className="text-slate-300">808 Bass</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-studio-neonAmber"></span>
            <span className="text-slate-300">Audio Pins</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Waveform Container */}
      <div className="relative rounded-xl overflow-hidden border border-studio-border/90 group cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1000}
          height={240}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredBar(null)}
          className="w-full h-60 block bg-studio-surface"
        />

        {/* Hover Bar Indicator */}
        {hoveredBar !== null && (
          <div className="absolute top-2 right-3 px-2 py-1 rounded-md bg-studio-card/90 border border-studio-border text-[11px] font-mono text-studio-accent pointer-events-none shadow-lg">
            + Click to drop note at Bar {hoveredBar}
          </div>
        )}
      </div>
    </div>
  );
};
