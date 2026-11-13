import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface AudioOscilloscopeProps {
  isListening: boolean;
  isNoiseActive: boolean;
  snrDb: number;
  dspActive: boolean;
}

export const AudioOscilloscope: React.FC<AudioOscilloscopeProps> = ({
  isListening,
  isNoiseActive,
  snrDb,
  dspActive
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas Resize Observer
    const updateSize = () => {
      const w = container.clientWidth;
      if (w > 0 && canvas.width !== w) {
        canvas.width = w;
      }
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark hardware display background
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      // Render subtle technical CRT grid lines
      ctx.strokeStyle = '#232320';
      ctx.lineWidth = 1;
      const gridStep = 24;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const freqData = audioEngine.getFrequencyData();
      const timeData = audioEngine.getTimeDomainData();

      // Top Half: Time-Domain Waveform Oscillograph
      ctx.strokeStyle = isListening ? '#D9381E' : '#736F66';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const halfHeight = height / 2;
      const sliceWidth = width / timeData.length;
      let x = 0;

      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * halfHeight) / 2 + 10;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      // Dividing Ruler Line
      ctx.strokeStyle = '#32322E';
      ctx.beginPath();
      ctx.moveTo(0, halfHeight);
      ctx.lineTo(width, halfHeight);
      ctx.stroke();

      // Bottom Half: 64-Band Frequency Spectrum Bars
      const numBars = 64;
      const barWidth = Math.max(2, (width - numBars * 2) / numBars);
      const barMaxHeight = halfHeight - 16;

      for (let i = 0; i < numBars; i++) {
        const binIndex = Math.floor((i / numBars) * (freqData.length * 0.65));
        const val = freqData[binIndex] || 0;
        const barHeight = (val / 255.0) * barMaxHeight;
        const barX = i * (barWidth + 2) + 2;
        const barY = height - barHeight - 4;

        if (val > 180) {
          ctx.fillStyle = '#D9381E'; // Kirana Red peak
        } else if (val > 100) {
          ctx.fillStyle = '#C88A2B'; // Brass mid
        } else {
          ctx.fillStyle = '#3F3F39'; // Slate hardware floor
        }

        ctx.fillRect(barX, barY, barWidth, barHeight);
      }

      // Live Technical Overlay Labels
      ctx.font = '11.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#8E8A82';
      ctx.fillText(`DSP: ${dspActive ? '120Hz-HP+NOTCH [ACTIVE]' : 'BYPASS'}`, 10, 16);

      if (isNoiseActive) {
        ctx.fillStyle = '#D9381E';
        ctx.fillText(`INJECTED NOISE: ${snrDb}dB SNR (TRAFFIC+HORNS)`, width - 265, 16);
      } else {
        ctx.fillStyle = '#575550';
        ctx.fillText('NOISE SIMULATOR: INACTIVE', width - 175, 16);
      }

      ctx.fillStyle = '#C88A2B';
      ctx.fillText('60FPS SPECTRUM ANALYZER', 10, height - 7);

      ctx.fillStyle = isListening ? '#D9381E' : '#736F66';
      ctx.fillText(isListening ? '[MIC: LIVE ACQUISITION]' : '[MIC: STANDBY]', width - 150, height - 7);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, isNoiseActive, snrDb, dspActive]);

  return (
    <div ref={containerRef} className="border border-[#2D2D2A] bg-[#141413] p-2.5 w-full">
      <div className="flex items-center justify-between pb-1.5 text-xs text-[#A8A49C] font-mono-tech border-b border-[#232320]">
        <span className="font-bold">ACOUSTIC_SPECTRUM_MONITOR // 512_FFT</span>
        <span>WINDOW: HANNING // 48000Hz</span>
      </div>
      <canvas
        ref={canvasRef}
        height={130}
        className="w-full h-[130px] block mt-1.5"
      />
    </div>
  );
};
