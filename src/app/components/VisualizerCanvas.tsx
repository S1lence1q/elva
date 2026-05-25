import React, { useEffect, useRef, useState } from 'react';

interface VisualizerCanvasProps {
  showVisualizer: boolean;
  isPlaying: boolean;
  videoId: string | undefined;
  analyser: AnalyserNode | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  showVisualizer,
  isPlaying,
  videoId,
  analyser,
  colors
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedValuesRef = useRef<number[]>(new Array(128).fill(0));
  const [canvasDimensions, setCanvasDimensions] = useState(() => {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    return {
      width: Math.round(850 * dpr),
      height: Math.round(850 * dpr)
    };
  });
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visualizerParticlesRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
    color: string;
  }[]>([]);

  const colorsRef = useRef(colors);
  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  useEffect(() => {
    if (!showVisualizer) return;

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        const dpr = window.devicePixelRatio || 1;
        const targetWidth = Math.round(850 * dpr);
        const targetHeight = Math.round(850 * dpr);
        setCanvasDimensions(prev => {
          if (prev.width !== targetWidth || prev.height !== targetHeight) {
            return { width: targetWidth, height: targetHeight };
          }
          return prev;
        });
      }, 100); // 100ms debounce
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [showVisualizer]);

  useEffect(() => {
    if (!showVisualizer) return;

    // Reset particles and smoothed values on song/source change to start clean and prevent glitches
    visualizerParticlesRef.current = [];
    smoothedValuesRef.current = new Array(128).fill(0);

    let animationFrameId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      // Clear the physical canvas bounds perfectly
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      
      // Calculate dynamic scaling factor matching the current physical dimension to logical coordinates (850)
      const scaleX = canvas.width / 850;
      const scaleY = canvas.height / 850;
      ctx.scale(scaleX, scaleY);

      const logicalWidth = 850;
      const logicalHeight = 850;
      const cx = logicalWidth / 2;
      const cy = logicalHeight / 2;

      // Get frequency data
      const isAudioAPIActive = !!(analyser && !videoId);
      const bufferLength = analyser ? analyser.frequencyBinCount : 128;
      const dataArray = new Uint8Array(bufferLength);

      if (isAudioAPIActive && analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Fallback/Simulated data
      const time = performance.now() * 0.001;
      const simData: number[] = [];
      const numBars = 96;

      for (let i = 0; i < numBars; i++) {
        if (isPlaying) {
          // Beat pulse around 120BPM (2Hz frequency)
          const bassPulse = Math.max(0, Math.sin(time * Math.PI * 2) * 0.8 + 0.2);
          const subBass = Math.max(0, Math.sin(time * Math.PI * 0.5) * 0.5);

          let val = 0;
          if (i < 12) {
            val = (bassPulse * 0.75 + subBass * 0.25) * 190 + Math.sin(time * 12 + i) * 35 + Math.random() * 20;
          } else if (i < 48) {
            val = (Math.sin(time * 5 + i * 0.25) * 0.55 + 0.45) * 130 + Math.sin(time * 10 + i * 0.6) * 20 + Math.random() * 15;
          } else {
            val = (Math.sin(time * 14 + i * 0.15) * 0.4 + 0.4) * 85 + Math.random() * 25;
          }
          simData.push(Math.max(15, Math.min(255, val)));
        } else {
          // Slow ambient breathing
          const breathing = (Math.sin(time * 1.5 + i * 0.1) * 0.5 + 0.5) * 12;
          simData.push(breathing);
        }
      }

      // Setup drawing values
      const baseRadius = 265;
      const maxSpikeHeight = 90;

      // Draw particle system
      const particles = visualizerParticlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha -= 0.012;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Prepare gradient colors for the ring spikes
      const colorsSafe = colorsRef.current || {
        primary: 'rgba(255,255,255,0.6)',
        secondary: 'rgba(255,255,255,0.5)',
        accent: 'rgba(255,255,255,0.4)'
      };
      const primaryColor = (colorsSafe.primary || 'rgba(255,255,255,0.6)').replace('0.6', '1');
      const accentColor = (colorsSafe.accent || 'rgba(255,255,255,0.4)').replace('0.4', '1');
      const secondaryColor = (colorsSafe.secondary || 'rgba(255,255,255,0.5)').replace('0.5', '1');

      // Draw beautiful subtle background glow ring
      let averageVolume = 0;
      for (let i = 0; i < numBars; i++) {
        const mapIdx = i < numBars / 2 ? i : numBars - 1 - i;
        const rawVal = isAudioAPIActive ? dataArray[mapIdx] : simData[mapIdx];
        averageVolume += rawVal;
      }
      averageVolume /= numBars;

      ctx.save();
      const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius - 20, cx, cy, baseRadius + 80);
      glowGrad.addColorStop(0, (colorsSafe.primary || 'rgba(255,255,255,0.6)').replace('0.6', '0.0'));
      glowGrad.addColorStop(0.3, (colorsSafe.primary || 'rgba(255,255,255,0.6)').replace('0.6', '0.12'));
      glowGrad.addColorStop(0.7, (colorsSafe.accent || 'rgba(255,255,255,0.4)').replace('0.4', '0.08'));
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      const reactiveRadiusOffset = (averageVolume / 255) * 15;
      ctx.arc(cx, cy, baseRadius + 70 + reactiveRadiusOffset, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw the radial spikes
      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2;

        const mapIdx = i < numBars / 2 ? i : numBars - 1 - i;
        const rawVal = isAudioAPIActive ? dataArray[mapIdx] : simData[mapIdx];

        const targetVal = rawVal || 0;
        if (!smoothedValuesRef.current[i]) smoothedValuesRef.current[i] = 0;
        smoothedValuesRef.current[i] = smoothedValuesRef.current[i] * 0.78 + targetVal * 0.22;
        const val = smoothedValuesRef.current[i];

        const barHeight = (val / 255) * maxSpikeHeight;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const xStart = cx + cos * baseRadius;
        const yStart = cy + sin * baseRadius;
        
        // Ensure the linear gradient and line have a non-zero length to prevent hardware rendering/compositor glitches
        const safeHeight = Math.max(0.1, barHeight);
        const xEnd = cx + cos * (baseRadius + safeHeight);
        const yEnd = cy + sin * (baseRadius + safeHeight);

        ctx.beginPath();
        const lineGrad = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
        lineGrad.addColorStop(0, (colorsSafe.primary || 'rgba(255,255,255,0.6)').replace('0.6', '0.3'));
        lineGrad.addColorStop(0.5, (colorsSafe.accent || 'rgba(255,255,255,0.4)').replace('0.4', '0.8'));
        lineGrad.addColorStop(1, (colorsSafe.secondary || 'rgba(255,255,255,0.5)').replace('0.5', '0.9'));

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        if (barHeight > 15) {
          ctx.beginPath();
          ctx.arc(xEnd, yEnd, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = (colorsSafe.secondary || 'rgba(255,255,255,0.5)').replace('0.5', '1');
          ctx.fill();
        }

        if (isPlaying && val > 165 && Math.random() < 0.12) {
          const speed = 1.2 + Math.random() * 2.5;
          particles.push({
            x: xEnd,
            y: yEnd,
            vx: cos * speed + (Math.random() - 0.5) * 0.8,
            vy: sin * speed + (Math.random() - 0.5) * 0.8,
            alpha: 1.0,
            size: 1.5 + Math.random() * 2.5,
            color: Math.random() > 0.5 ? accentColor : secondaryColor
          });
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showVisualizer, isPlaying, videoId, analyser]);

  if (!showVisualizer) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[-1]"
      style={{ width: '850px', height: '850px' }}
      width={canvasDimensions.width}
      height={canvasDimensions.height}
    />
  );
};
