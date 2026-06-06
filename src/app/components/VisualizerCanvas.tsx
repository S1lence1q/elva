import React, { useEffect, useRef } from 'react';

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
  volume?: number;
}

function parseRGB(c: string): [number, number, number] {
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
}

// Smooth step for pinch envelope
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Builds a Float32Array of normalized [-1..1] values that look like
 * real PCM audio from a trap / 808 / hardstyle track.
 *
 * Strategy: layer 3 harmonics of a base wave + hi-hat teeth + beat amplitude.
 * All math is deterministic (based on time `t`), so the display is smooth.
 */
function buildSynthPCM(n: number, t: number, playing: boolean): Float32Array {
  const out = new Float32Array(n);
  if (!playing) {
    // Idle flat-line with barely visible slow breath
    for (let i = 0; i < n; i++) {
      out[i] = Math.sin((i / n) * Math.PI * 1.8 + t * 0.6) * 0.03;
    }
    return out;
  }

  const bpm = 140;
  const beat = 60 / bpm;                   // seconds per beat
  const beatPhase = (t % beat) / beat;     // 0..1 within this beat

  // Kick hits on every beat — fast exponential decay
  const kick = Math.exp(-beatPhase * 9);

  // Snare on beats 2 & 4 (offset by half a bar)
  const snarePhase = ((t + beat * 1.5) % (beat * 2)) / (beat * 2);
  const snare = snarePhase < 0.10 ? Math.exp(-snarePhase * 30) : 0;

  // Hi-hat at 8th notes
  const hatPhase = (t % (beat / 2)) / (beat / 2);
  const hihat = hatPhase < 0.07 ? Math.exp(-hatPhase * 50) : 0;

  // Open hi-hat at every other beat
  const openHatPhase = ((t + beat * 0.75) % (beat * 2)) / (beat * 2);
  const openHat = (openHatPhase > 0.48 && openHatPhase < 0.60)
    ? Math.exp(-(openHatPhase - 0.48) * 18)
    : 0;

  // Master amplitude swells with kick
  const masterAmp = 0.52 + kick * 0.48;

  // Base frequency: how many half-cycles across the full width.
  // ~5 gives ~2.5 full cycles (matches the reference images).
  const baseFreq = 5.0;
  const phase = -t * 5.8; // scrolling phase

  for (let i = 0; i < n; i++) {
    const nx = i / (n - 1); // 0..1

    // ── Harmonic stack (3 partials) ───────────────────────────────────────
    const f1 = Math.sin(nx * Math.PI * baseFreq + phase);           // fundamental
    const f2 = Math.sin(nx * Math.PI * baseFreq * 2 - phase * 1.3) * 0.30;  // 2nd
    const f3 = Math.sin(nx * Math.PI * baseFreq * 3 + phase * 0.7) * 0.12;  // 3rd

    const body = f1 + f2 + f3;  // ~[-1.42 .. +1.42] range

    // ── Hi-hat "teeth" riding on the body ────────────────────────────────
    const teethFreq = 38;
    const teethAmp = 0.07 * (0.2 + hihat * 0.8 + openHat * 0.5);
    const teeth = Math.sin(nx * Math.PI * teethFreq + t * 28) * teethAmp;

    // ── Kick transient adds a sharp mid-frequency splash ─────────────────
    const kickSplash = kick > 0.3
      ? Math.sin(nx * Math.PI * 12 + t * 45) * 0.18 * kick
      : 0;

    // ── Snare adds crackle ────────────────────────────────────────────────
    const snareCrackle = snare > 0.1
      ? Math.sin(nx * Math.PI * 55 + t * 80) * 0.14 * snare
      : 0;

    // ── Mix & soft-clip ───────────────────────────────────────────────────
    let s = (body + teeth + kickSplash + snareCrackle) * masterAmp;

    // tanh soft-clip keeps the wave inside [-1,1] while preserving loudness
    out[i] = Math.tanh(s * 1.15) * 0.88;
  }

  return out;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  showVisualizer,
  isPlaying,
  videoId,
  analyser,
  colors,
  volume = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostFrameRef = useRef<Float32Array | null>(null);
  const colorsRef = useRef(colors);
  const volumeRef = useRef(volume);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { colorsRef.current = colors; }, [colors]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Keep canvas pixel buffer size synced to its CSS layout dimensions
  useEffect(() => {
    if (!showVisualizer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sync = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ghostFrameRef.current = null;
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [showVisualizer]);

  useEffect(() => {
    if (!showVisualizer) return;

    ghostFrameRef.current = null;
    let rafId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafId = requestAnimationFrame(draw); return; }

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width;
      const H = canvas.height;
      const LW = W / dpr;  // logical width
      const LH = H / dpr;  // logical height
      const cy = LH / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.scale(dpr, dpr);

      // ── CRT Horizontal Scanlines ─────────────────────────────────────────
      // Very faint dark stripes, like a real CRT phosphor display
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#000000';
      const scanSpacing = 5;
      for (let y = 0; y < LH; y += scanSpacing) {
        ctx.fillRect(0, y + 1, LW, 2);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ── Get Audio Data ───────────────────────────────────────────────────
      const hasReal = !!(analyser && !videoId);
      const N = 512;
      let wave = new Float32Array(N); // normalized -1..1

      if (hasReal) {
        const raw = new Uint8Array(analyser!.fftSize);
        analyser!.getByteTimeDomainData(raw);

        let silent = true;
        for (let i = 0; i < raw.length; i++) {
          if (Math.abs(raw[i] - 128) > 3) { silent = false; break; }
        }

        if (!silent) {
          // Downsample & lightly smooth into N points
          const hw = 3;
          for (let i = 0; i < N; i++) {
            const ri = Math.floor((i / (N - 1)) * (raw.length - 1));
            let sum = 0, cnt = 0;
            for (let w = -hw; w <= hw; w++) {
              const idx = ri + w;
              if (idx >= 0 && idx < raw.length) { sum += raw[idx]; cnt++; }
            }
            wave[i] = cnt > 0 ? (sum / cnt - 128) / 128 : 0;
          }
        } else {
          wave = buildSynthPCM(N, performance.now() * 0.001, isPlayingRef.current);
        }
      } else {
        wave = buildSynthPCM(N, performance.now() * 0.001, isPlayingRef.current);
      }

      // ── Volume & Max Amplitude ───────────────────────────────────────────
      // Like Wave Candy: gain control. 72% of half-height = very aggressive.
      const vol = volumeRef.current;       // 0..100
      const volNorm = Math.pow(vol / 100, 1.15);
      const maxAmp = cy * 0.72 * Math.max(0.1, volNorm);

      // ── Pinch Envelope (Wave Candy "Pinch" feature) ───────────────────────
      // The wave is forced near zero at left/right 8% margins.
      // smoothstep gives a natural ramp-in / ramp-out.
      const PINCH = 0.06; // fraction of width that is pinched in

      // ── Build Y-coordinate array ─────────────────────────────────────────
      const yPts = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const nx = i / (N - 1);
        const pinch = smoothstep(0, PINCH, nx) * smoothstep(1, 1 - PINCH, nx);
        yPts[i] = cy + wave[i] * maxAmp * pinch;
      }

      // ── Ghost frame (very faint phosphor persistence) ────────────────────
      const ghost = ghostFrameRef.current;
      if (ghost && ghost.length === N) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < ghost.length; i++) {
          const x = (i / (ghost.length - 1)) * LW;
          if (i === 0) ctx.moveTo(x, ghost[i]);
          else ctx.lineTo(x, ghost[i]);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
      ghostFrameRef.current = yPts.slice();

      // ── Theme Colors ─────────────────────────────────────────────────────
      const [ar, ag, ab] = parseRGB(colorsRef.current.accent);

      // ── Multi-Pass Phosphor Glow Rendering ───────────────────────────────
      // Pass 1: wide soft bloom (outer glow)
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < yPts.length; i++) {
        const x = (i / (yPts.length - 1)) * LW;
        if (i === 0) ctx.moveTo(x, yPts[i]);
        else ctx.lineTo(x, yPts[i]);
      }
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},0.18)`;
      ctx.lineWidth = 14;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.restore();

      // Pass 2: medium glow (brighter, narrower)
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < yPts.length; i++) {
        const x = (i / (yPts.length - 1)) * LW;
        if (i === 0) ctx.moveTo(x, yPts[i]);
        else ctx.lineTo(x, yPts[i]);
      }
      ctx.strokeStyle = `rgba(255,255,255,0.45)`;
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 16;
      ctx.shadowColor = `rgba(${ar},${ag},${ab},0.8)`;
      ctx.stroke();
      ctx.restore();

      // Pass 3: crisp bright center line
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < yPts.length; i++) {
        const x = (i / (yPts.length - 1)) * LW;
        if (i === 0) ctx.moveTo(x, yPts[i]);
        else ctx.lineTo(x, yPts[i]);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.97)';
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(255,255,255,1)';
      ctx.stroke();
      ctx.restore();

      // ── Endpoint Glow Dots ───────────────────────────────────────────────
      const ly = yPts[0];
      const ry = yPts[N - 1];
      const peak = yPts.reduce((mx, y) => Math.max(mx, Math.abs(y - cy)), 0) / (maxAmp || 1);
      const dotR = 2.5 + peak * 2.5;

      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = `rgba(${ar},${ag},${ab},1)`;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(0, ly, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(LW, ry, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore(); // pop dpr scale

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [showVisualizer, isPlaying, videoId, analyser]);

  if (!showVisualizer) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{
        width: '100%',
        height: '100%',
        // Fade at the very edges so the wave blends into the background
        maskImage:
          'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
      }}
    />
  );
};
