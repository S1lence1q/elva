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
  const pathHistoryRef = useRef<number[][]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState(() => {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    return {
      width: Math.round(920 * dpr),
      height: Math.round(420 * dpr)
    };
  });
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const targetWidth = Math.round(920 * dpr);
        const targetHeight = Math.round(420 * dpr);
        setCanvasDimensions(prev => {
          if (prev.width !== targetWidth || prev.height !== targetHeight) {
            return { width: targetWidth, height: targetHeight };
          }
          return prev;
        });
      }, 100);
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

    // Clear history on reset
    pathHistoryRef.current = [];

    let animationFrameId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fully clear the canvas so the background stays transparent
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      
      const dpr = window.devicePixelRatio || 1;
      const scaleX = canvas.width / 920;
      const scaleY = canvas.height / 420;
      ctx.scale(scaleX, scaleY);

      const logicalWidth = 920;
      const logicalHeight = 420;
      const cx = logicalWidth / 2;
      const cy = logicalHeight / 2;

      // Get real audio frequency / time domain data if active
      const isAudioAPIActive = !!(analyser && !videoId);
      const bufferLength = analyser ? analyser.fftSize : 256;
      const timeDataArray = new Uint8Array(bufferLength);
      const freqDataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 64);

      if (analyser) {
        if (isAudioAPIActive) {
          analyser.getByteTimeDomainData(timeDataArray);
          analyser.getByteFrequencyData(freqDataArray);
        }
      }

      // Compute bass energy for shaking and scaling
      let bassFactor = 0;
      if (isAudioAPIActive && analyser) {
        let bassSum = 0;
        const bassBins = Math.min(10, freqDataArray.length);
        for (let i = 0; i < bassBins; i++) {
          bassSum += freqDataArray[i];
        }
        bassFactor = bassSum / (bassBins * 255);
      }

      // Synthesize audio patterns if no audio feed or paused
      const time = performance.now() * 0.001;
      const bpm = 138;
      const beatDuration = 60 / bpm;
      const beatTime = time % beatDuration;
      const beatProgress = beatTime / beatDuration;

      // Kick beat envelope: fast attack, exponential decay
      const kickVolume = isPlaying ? Math.exp(-beatProgress * 7.5) : 0;
      const ambientPulse = 0.05 + Math.sin(time * 2) * 0.02;
      const activeBass = isAudioAPIActive ? bassFactor : (kickVolume * 0.8 + ambientPulse);

      // Perform a satisfying viewport camera shake on heavy bass
      if (isPlaying && activeBass > 0.3) {
        const shakePower = (activeBass - 0.3) * 16;
        const shakeX = (Math.random() - 0.5) * shakePower;
        const shakeY = (Math.random() - 0.5) * shakePower;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Draw Oscilloscope Grid Lines (Sci-fi look)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      const gridSpacing = 45;
      for (let y = cy - gridSpacing * 3; y <= cy + gridSpacing * 3; y += gridSpacing) {
        ctx.beginPath();
        if (Math.round(y) === Math.round(cy)) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        }
        ctx.moveTo(40, y);
        ctx.lineTo(logicalWidth - 40, y);
        ctx.stroke();
      }

      // Vertical center axis grid line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.moveTo(cx, cy - gridSpacing * 3.5);
      ctx.lineTo(cx, cy + gridSpacing * 3.5);
      ctx.stroke();

      // Muted grid borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeRect(40, cy - gridSpacing * 3.5, logicalWidth - 80, gridSpacing * 7);

      // Center axis ticks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      for (let x = 60; x < logicalWidth - 60; x += 15) {
        ctx.beginPath();
        const tickHeight = (x - cx) % 75 === 0 ? 8 : 4;
        ctx.moveTo(x, cy - tickHeight / 2);
        ctx.lineTo(x, cy + tickHeight / 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Generate current frame waveform path points
      const wavePoints: number[] = [];
      const numPoints = 256;
      const leftBound = 40;
      const rightBound = logicalWidth - 40;
      const spanWidth = rightBound - leftBound;

      // Sub-bass rumble sweep
      const subRumble = Math.sin(time * Math.PI * 4.5) * 0.12 * (isPlaying ? 1 : 0);
      // Hardstyle high frequency lead synth oscillation
      const leadSweep = Math.sin(time * 0.4) * 120 + 260;

      for (let i = 0; i < numPoints; i++) {
        const normX = i / (numPoints - 1);
        let sampleVal = 0.5; // center normalized

        if (isAudioAPIActive) {
          // Read time-domain wave sample
          const dataIdx = Math.floor(normX * (timeDataArray.length - 1));
          sampleVal = timeDataArray[dataIdx] / 255;
        } else if (isPlaying) {
          // Synthesize an aggressive, jagged trap/hardstyle oscilloscope wave
          const subOsc = Math.sin(normX * Math.PI * 6.5 + time * 18) * (activeBass * 0.65 + subRumble);
          
          // Screeching high-pitch lead waves
          const leadOsc = Math.sin(normX * Math.PI * leadSweep + time * 12) * (0.08 + Math.sin(time * 2.5) * 0.04);
          
          // Jagged sawtooth screech (very aggressive lead synth)
          const sawOsc = ((normX * 88 + time * 24) % 1.0 - 0.5) * 0.05 * activeBass;

          // Aggressive transient rolls
          const hatRoll = Math.sin(normX * Math.PI * 1200) * 0.06 * Math.max(0, Math.sin(time * 35));

          // Base noise floor
          const noise = (Math.random() - 0.5) * 0.02;

          sampleVal = 0.5 + subOsc + leadOsc + sawOsc + hatRoll + noise;
        } else {
          // Muted breathing sine wave
          sampleVal = 0.5 + Math.sin(normX * Math.PI * 3 + time * 1.5) * 0.02;
        }

        // Apply window envelope to fade out the wave edges cleanly at grid borders
        const envelope = Math.sin(normX * Math.PI);
        const amplitudeY = (sampleVal - 0.5) * 2.0; // range: -1 to 1
        
        // Scale vertical height: larger when bass hits
        const finalAmp = amplitudeY * envelope * (140 + activeBass * 75);
        const y = cy + finalAmp;
        wavePoints.push(y);
      }

      // Add to path history for motion blur trails
      const pathHistory = pathHistoryRef.current;
      pathHistory.push(wavePoints);
      if (pathHistory.length > 7) {
        pathHistory.shift();
      }

      // Fetch active primary theme colors
      const colorsSafe = colorsRef.current || {
        primary: 'rgba(255,255,255,0.6)',
        secondary: 'rgba(255,255,255,0.5)',
        accent: 'rgba(255,255,255,0.4)'
      };
      const primaryClean = colorsSafe.primary.replace('0.6', '1');
      const accentClean = colorsSafe.accent.replace('0.4', '1');
      const secondaryClean = colorsSafe.secondary.replace('0.5', '1');

      // 3. Render Motion Blur Wave History
      pathHistory.forEach((points, hIdx) => {
        const count = pathHistory.length;
        const progress = (hIdx + 1) / count; // older: lower opacity
        
        ctx.save();
        ctx.beginPath();
        
        // Connect points with quadratic curves or line segment chains
        for (let i = 0; i < points.length; i++) {
          const normX = i / (points.length - 1);
          const x = leftBound + normX * spanWidth;
          const y = points[i];
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Generate glowing linear gradient
        const grad = ctx.createLinearGradient(leftBound, cy, rightBound, cy);
        grad.addColorStop(0, primaryClean.replace('1)', `${0.15 * progress})`));
        grad.addColorStop(0.2, accentClean.replace('1)', `${0.7 * progress})`));
        grad.addColorStop(0.5, '#ffffff'.replace(')', `${1.0 * progress})`));
        grad.addColorStop(0.8, secondaryClean.replace('1)', `${0.7 * progress})`));
        grad.addColorStop(1, primaryClean.replace('1)', `${0.15 * progress})`));

        ctx.strokeStyle = grad;
        // Make the line thicker when bass is pushing
        ctx.lineWidth = (0.75 + progress * 2.2) * (1.0 + activeBass * 1.5);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Add subtle shadow glow only to the newest/brightest line to protect performance
        if (hIdx === count - 1) {
          ctx.shadowBlur = 12 + activeBass * 14;
          ctx.shadowColor = accentClean;
        }

        ctx.stroke();
        ctx.restore();
      });

      // 4. Draw glowing boundary nodes on the ends of the oscilloscope grid
      const latestPoints = pathHistory[pathHistory.length - 1];
      if (latestPoints && latestPoints.length > 0) {
        const leftY = latestPoints[0];
        const rightY = latestPoints[latestPoints.length - 1];

        ctx.save();
        // Left Node
        ctx.shadowBlur = 10 + activeBass * 10;
        ctx.shadowColor = primaryClean;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(leftBound, leftY, 3.5 + activeBass * 3, 0, Math.PI * 2);
        ctx.fill();

        // Right Node
        ctx.shadowBlur = 10 + activeBass * 10;
        ctx.shadowColor = secondaryClean;
        ctx.beginPath();
        ctx.arc(rightBound, rightY, 3.5 + activeBass * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [showVisualizer, isPlaying, videoId, analyser]);

  if (!showVisualizer) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1]"
      style={{ 
        width: '920px', 
        height: '420px',
        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
      }}
      width={canvasDimensions.width}
      height={canvasDimensions.height}
    />
  );
};
