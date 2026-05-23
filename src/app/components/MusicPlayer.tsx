import { useState, useEffect, useRef, useMemo } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Play, Pause, List, Plus, SkipBack, SkipForward, Settings, X, Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { toast } from 'sonner';
import { Queue } from './Queue';
import { SettingsModal } from './SettingsModal';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

interface LyricLine {
  time: number;
  text: string;
}

interface MusicPlayerProps {
  songData: {
    title: string;
    artist: string;
    artworkUrl: string;
    audioUrl: string;
    videoId?: string;
  };
  queue?: QueueItem[];
  onRemoveFromQueue?: (id: string) => void;
  onSelectFromQueue?: (id: string) => void;
  onAddToQueue?: (song: SearchResult) => void;
  onSelectSong?: (song: SearchResult) => void;
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  onBackToHome?: () => void;
  onSearch?: (query: string) => Promise<SearchResult[]>;
  onFetchChannelUploads?: (channelId: string, limit?: number) => Promise<SearchResult[]>;
  tourType?: 'landing' | 'player' | null;
  currentStep?: number;
  accentColor?: AccentColor;
  onAccentColorChange?: (color: AccentColor) => void;
  textureStyle?: 'paper' | 'dots' | 'none';
  onTextureStyleChange?: (style: 'paper' | 'dots' | 'none') => void;
  backgroundStyle?: 'default' | 'particles' | 'liquid' | 'mesh';
  onBackgroundStyleChange?: (style: 'default' | 'particles' | 'liquid' | 'mesh') => void;
  themePreset?: 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset';
  onThemePresetChange?: (theme: 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset') => void;
  showVisualizer?: boolean;
  onShowVisualizerChange?: (show: boolean) => void;
  zenMode?: boolean;
  onZenModeChange?: (zen: boolean) => void;
  showVolumeSlider?: boolean;
  onShowVolumeSliderChange?: (show: boolean) => void;
  enable3DTilt?: boolean;
  onEnable3DTiltChange?: (enable: boolean) => void;
  showSettingsButton?: boolean;
  onShowSettingsButtonChange?: (show: boolean) => void;
}

// Generate beautiful, dynamic, vibrant HSL theme palettes by hashing the song title/artist
// so every song instantly gets a customized glassmorphism theme, even before/if artwork loads!
function getDynamicFallbackColors(title: string, artist: string) {
  const str = `${title} ${artist}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  // Deterministically generate three beautifully harmonized colors using different saturation and lightness values
  const primaryRgb = hslToRgb(hue, 0.6, 0.28);
  const secondaryRgb = hslToRgb((hue + 120) % 360, 0.45, 0.15);
  const accentRgb = hslToRgb((hue + 240) % 360, 0.65, 0.35);

  return {
    primary: `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, 0.6)`,
    secondary: `rgba(${secondaryRgb[0]}, ${secondaryRgb[1]}, ${secondaryRgb[2]}, 0.5)`,
    accent: `rgba(${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]}, 0.4)`
  };
}

// Helper to convert HSL to RGB so it works perfectly with the existing rgba match patterns
function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function parseLrc(lrcText: string): LyricLine[] {
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;
  
  for (const line of lines) {
    const match = timeRegExp.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3] ? parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1) : 0;
      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegExp, '').trim();
      
      if (text || line.includes('♪')) {
        result.push({ time: timeInSeconds, text: text || '♪' });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

function cleanSongTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\([^)]*\)/g, '') // remove anything in parentheses (e.g., "(Official Video)")
    .replace(/\[[^\]]*\]/g, '') // remove anything in brackets (e.g., "[Lyrics]")
    .replace(/ft\..*$/gi, '') // remove "ft." and everything after
    .replace(/feat\..*$/gi, '') // remove "feat." and everything after
    .replace(/\|.*$/g, '') // remove "|" and everything after
    .replace(/"/g, '') // remove quotes
    .trim();
}

function generateFallbackLyrics(title: string, duration: number): LyricLine[] {
  const totalDuration = duration > 0 ? duration : 240;
  const lines = [
    "♪ (Instrumental Intro) ♪",
    `We begin in the quiet echoes of ${title}...`,
    "Dancing through the shadows...",
    "Sensing every beat, every word you said...",
    "A lingering feeling in the crisp night air...",
    "Now we rise, matching the rhythm of our hearts...",
    "♪ (Ambient Break) ♪",
    "And as the melody guides us home...",
    "We fade away into the beautiful silence...",
    "♪ (Outro) ♪"
  ];
  const step = totalDuration / (lines.length + 1);
  return lines.map((text, i) => ({
    time: step * (i + 1),
    text
  }));
}

const THEME_PRESETS = {
  cyberpunk: {
    primary: 'rgba(244,63,94,0.6)',
    secondary: 'rgba(6,182,212,0.5)',
    accent: 'rgba(139,92,246,0.4)'
  },
  obsidian: {
    primary: 'rgba(71,85,105,0.6)',
    secondary: 'rgba(2,6,23,0.8)',
    accent: 'rgba(15,23,42,0.5)'
  },
  aurora: {
    primary: 'rgba(16,185,129,0.6)',
    secondary: 'rgba(99,102,241,0.5)',
    accent: 'rgba(5,150,105,0.4)'
  },
  sunset: {
    primary: 'rgba(249,115,22,0.6)',
    secondary: 'rgba(124,58,237,0.5)',
    accent: 'rgba(217,70,239,0.4)'
  }
};

let globalAudioSource: MediaElementAudioSourceNode | null = null;
let globalAudioContext: AudioContext | null = null;
let globalAnalyser: AnalyserNode | null = null;

export function MusicPlayer({ 
  songData, 
  queue = [], 
  onRemoveFromQueue, 
  onSelectFromQueue, 
  onAddToQueue, 
  onSelectSong, 
  onFileSelect, 
  onUrlSubmit, 
  onBackToHome, 
  onSearch,
  onFetchChannelUploads,
  tourType,
  currentStep,
  accentColor = 'emerald',
  onAccentColorChange,
  textureStyle = 'paper',
  onTextureStyleChange,
  backgroundStyle = 'mesh',
  onBackgroundStyleChange,
  themePreset = 'dynamic',
  onThemePresetChange,
  showVisualizer = false,
  onShowVisualizerChange,
  zenMode = false,
  onZenModeChange,
  showVolumeSlider = true,
  onShowVolumeSliderChange,
  enable3DTilt = true,
  onEnable3DTiltChange,
  showSettingsButton = false,
  onShowSettingsButtonChange
}: MusicPlayerProps) {
  const theme = ACCENT_THEMES[accentColor];

  // Helper mappings for dynamic class bindings
  const accentBgs: Record<AccentColor, string> = {
    emerald: 'bg-emerald-500',
    sand: 'bg-amber-500',
    wine: 'bg-rose-500',
    navy: 'bg-slate-500'
  };

  const accentBgs400: Record<AccentColor, string> = {
    emerald: 'bg-emerald-400',
    sand: 'bg-amber-400',
    wine: 'bg-rose-400',
    navy: 'bg-slate-400'
  };
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); // 4:03 in seconds
  const [volume, setVolume] = useState(70);
  const [preMuteVolume, setPreMuteVolume] = useState(70);
  const [showVolumeHUD, setShowVolumeHUD] = useState(false);
  const volumeHUDTimeoutRef = useRef<any>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [focusSearchInQueue, setFocusSearchInQueue] = useState(false);
  const [isArtworkHovered, setIsArtworkHovered] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);
  const isPlayingRef = useRef(isPlaying);
  const lastToggleTimeRef = useRef(0);
  const setPlaying = (value: boolean) => {
    isPlayingRef.current = value;
    setIsPlaying(value);
  };
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Volume Fader & Seamless Crossfade/Dip system
  const faderRef = useRef(1); // multiplier 0 to 1
  const faderAnimationRef = useRef<number | null>(null);
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const handleNextSongRef = useRef<() => Promise<void>>(async () => {});


  const fadeVolume = (target: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
      }

      const startValue = faderRef.current;
      const startTime = performance.now();

      const run = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out quad for volume fade
        const ease = progress * (2 - progress);
        faderRef.current = startValue + (target - startValue) * ease;

        // Apply faded volume to active player
        const activeVol = Math.round(volumeRef.current * faderRef.current);
        if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.setVolume) {
          try {
            ytPlayerRef.current.setVolume(activeVol);
          } catch (e) {}
        }
        if (audioRef.current) {
          audioRef.current.volume = activeVol / 100;
        }

        if (progress < 1) {
          faderAnimationRef.current = requestAnimationFrame(run);
        } else {
          faderRef.current = target;
          faderAnimationRef.current = null;
          resolve();
        }
      };

      faderAnimationRef.current = requestAnimationFrame(run);
    });
  };

  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingNewSong, setIsLoadingNewSong] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [imageBlur, setImageBlur] = useState(20);
  const [previousArtwork, setPreviousArtwork] = useState<string | null>(null);
  const [showPreviousArtwork, setShowPreviousArtwork] = useState(false);
  const [dominantColors, setDominantColors] = useState(() => getDynamicFallbackColors(songData.title || '', songData.artist || ''));
  const [targetColors, setTargetColors] = useState(() => getDynamicFallbackColors(songData.title || '', songData.artist || ''));
  const [extractedColors, setExtractedColors] = useState(() => getDynamicFallbackColors(songData.title || '', songData.artist || ''));

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedValuesRef = useRef<number[]>(new Array(128).fill(0));
  const visualizerParticlesRef = useRef<{x: number, y: number, vx: number, vy: number, alpha: number, size: number, color: string}[]>([]);
  const colorsRef = useRef(dominantColors);
  
  useEffect(() => {
    colorsRef.current = dominantColors;
  }, [dominantColors]);

  useEffect(() => {
    if (themePreset === 'dynamic') {
      setTargetColors(extractedColors);
    } else {
      setTargetColors(THEME_PRESETS[themePreset]);
    }
  }, [themePreset, extractedColors]);

  const initAudioAnalyzer = () => {
    if (analyserRef.current) return;
    if (!audioRef.current) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!globalAudioContext) {
        globalAudioContext = new AudioContextClass();
      }
      const ctx = globalAudioContext;

      if (!globalAnalyser) {
        globalAnalyser = ctx.createAnalyser();
        globalAnalyser.fftSize = 256;
      }
      const analyser = globalAnalyser;
      
      if (!globalAudioSource) {
        globalAudioSource = ctx.createMediaElementSource(audioRef.current);
      }
      
      globalAudioSource.disconnect();
      globalAudioSource.connect(analyser);
      analyser.disconnect();
      analyser.connect(ctx.destination);
      
      analyserRef.current = analyser;
      audioContextRef.current = ctx;
    } catch (err) {
      console.warn("Failed to initialize Web Audio API analyzer:", err);
    }
  };

  // Dynamic 360° visualizer canvas drawing loop
  useEffect(() => {
    if (!showVisualizer) return;

    let animationFrameId: number;
    
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Get frequency data
      const isAudioAPIActive = !!(analyserRef.current && !songData.videoId);
      const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 128;
      const dataArray = new Uint8Array(bufferLength);
      
      if (isAudioAPIActive && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
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
      const primaryColor = colorsRef.current.primary.replace('0.6', '1');
      const accentColor = colorsRef.current.accent.replace('0.4', '1');
      const secondaryColor = colorsRef.current.secondary.replace('0.5', '1');

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
      glowGrad.addColorStop(0, colorsRef.current.primary.replace('0.6', '0.0'));
      glowGrad.addColorStop(0.3, colorsRef.current.primary.replace('0.6', '0.12'));
      glowGrad.addColorStop(0.7, colorsRef.current.accent.replace('0.4', '0.08'));
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
        const xEnd = cx + cos * (baseRadius + barHeight);
        const yEnd = cy + sin * (baseRadius + barHeight);

        ctx.beginPath();
        const lineGrad = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
        lineGrad.addColorStop(0, colorsRef.current.primary.replace('0.6', '0.3'));
        lineGrad.addColorStop(0.5, colorsRef.current.accent.replace('0.4', '0.8'));
        lineGrad.addColorStop(1, colorsRef.current.secondary.replace('0.5', '0.9'));
        
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        if (barHeight > 15) {
          ctx.beginPath();
          ctx.arc(xEnd, yEnd, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = colorsRef.current.secondary.replace('0.5', '1');
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

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [showVisualizer, isPlaying, songData.videoId]);

  // Optimized pre-calculated particles trajectory array (responsively mapped using %)
  const optimizedParticles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      xStart: Math.random() * 100,
      yStart: Math.random() * 100,
      xValues: [
        `${Math.random() * 100}%`,
        `${Math.random() * 100}%`,
        `${Math.random() * 100}%`,
      ],
      yValues: [
        `${Math.random() * 100}%`,
        `${Math.random() * 100}%`,
        `${Math.random() * 100}%`,
      ],
      scaleMax: Math.random() * 0.8 + 0.2,
      duration: Math.random() * 20 + 15,
      delay: i * 0.2,
    }));
  }, []);

  // Lyrics State
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [isLyricsSynced, setIsLyricsSynced] = useState(false);
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active lyric
  useEffect(() => {
    if (showLyrics && isLyricsSynced && activeLyricRef.current && lyricContainerRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLyricIndex, showLyrics, isLyricsSynced]);

  // Sync lyrics with time
  useEffect(() => {
    if (lyrics.length === 0 || !isLyricsSynced) return;
    let activeIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time - 0.5) { // 0.5s pre-highlight for smooth reading
        activeIndex = i;
      } else {
        break;
      }
    }
    setCurrentLyricIndex(activeIndex);
  }, [currentTime, lyrics, isLyricsSynced]);

  // Fetch lyrics from LrcLib
  useEffect(() => {
    if (!songData.title) return;
    
    let isMounted = true;
    const fetchLyricsData = async () => {
      setIsLoadingLyrics(true);
      setLyrics([]);
      setCurrentLyricIndex(-1);
      setIsLyricsSynced(false);

      try {
        const cleanedTitle = cleanSongTitle(songData.title);
        const query = encodeURIComponent(`${cleanedTitle} ${songData.artist !== 'Unknown Artist' && songData.artist !== 'Web Stream' ? songData.artist : ''}`.trim());
        const res = await fetch(`https://lrclib.net/api/search?q=${query}`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        if (isMounted) {
          if (data && data.length > 0) {
            const track = data[0];
            if (track.syncedLyrics) {
              setLyrics(parseLrc(track.syncedLyrics));
              setIsLyricsSynced(true);
            } else if (track.plainLyrics) {
              const lines = track.plainLyrics.split('\n').filter((l: string) => l.trim().length > 0);
              setLyrics(lines.map((text: string) => ({
                time: 0,
                text: text.trim()
              })));
              setIsLyricsSynced(false);
            } else {
              setLyrics([]);
              setIsLyricsSynced(false);
            }
          } else {
            setLyrics([]);
            setIsLyricsSynced(false);
          }
        }
      } catch (err) {
        console.error("Lyrics fetch error:", err);
        if (isMounted) {
          setLyrics([]);
          setIsLyricsSynced(false);
        }
      } finally {
        if (isMounted) setIsLoadingLyrics(false);
      }
    };
    
    fetchLyricsData();
    return () => { isMounted = false; };
  }, [songData.title, songData.artist]);

  // Lyrics keyboard shortcut has been consolidated into the main global keydown handler below to prevent duplicate events.

  // Zen Mode: Track user activity to auto-hide UI controls when idle
  const [isUserIdle, setIsUserIdle] = useState(false);
  const idleTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!zenMode) {
      setIsUserIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const resetIdleTimer = () => {
      setIsUserIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsUserIdle(true);
      }, 3000); // 3 seconds of inactivity
    };

    resetIdleTimer();

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
    };
  }, [zenMode]);

  const artworkRef = useRef<HTMLDivElement>(null);
  const stableCenterRef = useRef({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Very subtle spring for smooth tilt
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [2, -2]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-2, 2]), { stiffness: 150, damping: 20 });

  // Generate waveform once and memoize it
  const waveformData = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const pattern = Math.sin(i * 0.3) * 0.4 + Math.random() * 0.3 + 0.3;
      return Math.min(1, Math.max(0.15, pattern));
    });
  }, []);

  // Show settings hint once on first load
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('elva_settings_hint_seen');
    if (!hasSeenHint) {
      setTimeout(() => {
        setShowSettingsHint(true);
        localStorage.setItem('elva_settings_hint_seen', 'true');
        setTimeout(() => setShowSettingsHint(false), 3000);
      }, 2000);
    }
  }, []);

  // Smooth color transition effect - delegated entirely to hardware-accelerated CSS variables transitions
  useEffect(() => {
    setDominantColors(targetColors);
  }, [targetColors]);

  // Extract colors from album artwork and set loaded state
  useEffect(() => {
    // Store previous artwork for crossfade
    if (songData.artworkUrl !== previousArtwork) {
      setPreviousArtwork(songData.artworkUrl);
      setShowPreviousArtwork(true);
    }

    setIsLoaded(false);
    setIsLoadingNewSong(true);
    setImageBlur(0);

    // 1. IMMEDIATELY set vibrant fallback colors matching the song title/artist
    // This completely removes the pink default flash and gives a beautiful custom theme instantly!
    const fallbacks = getDynamicFallbackColors(songData.title || '', songData.artist || '');
    setExtractedColors(fallbacks);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    // 2. Bypass YouTube CORS restrictions by loading through a Cloudflare global image proxy (images.weserv.nl)
    // This allows the canvas to successfully read pixel data without throwing a security error!
    if (songData.artworkUrl && (songData.artworkUrl.includes('ytimg.com') || songData.artworkUrl.includes('youtube.com') || songData.artworkUrl.startsWith('http'))) {
      img.src = `https://images.weserv.nl/?url=${encodeURIComponent(songData.artworkUrl)}`;
    } else {
      img.src = songData.artworkUrl;
    }

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setTimeout(() => {
          setIsLoaded(true);
          setIsLoadingNewSong(false);
          setImageBlur(0);
        }, 100);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Sample colors from different regions with better saturation
      const samples = [
        ctx.getImageData(img.width * 0.3, img.height * 0.3, 1, 1).data,
        ctx.getImageData(img.width * 0.7, img.height * 0.5, 1, 1).data,
        ctx.getImageData(img.width * 0.5, img.height * 0.7, 1, 1).data,
      ];

      // Boost saturation for more vibrant colors
      const boostSaturation = (r: number, g: number, b: number, boost: number = 1.3) => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        if (delta === 0) return { r, g, b };

        const newR = Math.min(255, Math.round(r + (r - min) * (boost - 1)));
        const newG = Math.min(255, Math.round(g + (g - min) * (boost - 1)));
        const newB = Math.min(255, Math.round(b + (b - min) * (boost - 1)));

        return { r: newR, g: newG, b: newB };
      };

      const color1 = boostSaturation(samples[0][0], samples[0][1], samples[0][2]);
      const color2 = boostSaturation(samples[1][0], samples[1][1], samples[1][2]);
      const color3 = boostSaturation(samples[2][0], samples[2][1], samples[2][2]);

      // Update to exact extracted colors once loaded (triggering a gorgeous 1.5s crossfade transition!)
      setExtractedColors({
        primary: `rgba(${color1.r},${color1.g},${color1.b},0.6)`,
        secondary: `rgba(${color2.r},${color2.g},${color2.b},0.5)`,
        accent: `rgba(${color3.r},${color3.g},${color3.b},0.4)`
      });

      // Progressive loading: instant clean crossfade
      setTimeout(() => {
        setIsLoadingNewSong(false);
        setIsLoaded(true);
        // Hide previous artwork after transition
        setTimeout(() => setShowPreviousArtwork(false), 800);
      }, 50);
    };

    img.onerror = () => {
      // If the ultra-HD thumbnail failed, try falling back to the standard-HD thumbnail!
      if (img.src.includes('maxresdefault.jpg')) {
        const fallbackUrl = songData.artworkUrl.replace('maxresdefault.jpg', 'hqdefault.jpg');
        if (fallbackUrl && (fallbackUrl.includes('ytimg.com') || fallbackUrl.includes('youtube.com') || fallbackUrl.startsWith('http'))) {
          img.src = `https://images.weserv.nl/?url=${encodeURIComponent(fallbackUrl)}`;
        } else {
          img.src = fallbackUrl;
        }
        return;
      }

      // If all fails, gracefully complete animations using the beautifully generated title/artist theme!
      setTimeout(() => {
        setIsLoaded(true);
        setIsLoadingNewSong(false);
        setImageBlur(0);
      }, 400);
    };
  }, [songData.artworkUrl, songData.title, songData.artist]);

  const handleMouseEnter = () => {
    setIsArtworkHovered(true);
    if (!artworkRef.current) return;
    const rect = artworkRef.current.getBoundingClientRect();
    stableCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stableCenterRef.current.x) {
      handleMouseEnter();
    }
    mouseX.set(e.clientX - stableCenterRef.current.x);
    mouseY.set(e.clientY - stableCenterRef.current.y);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (artworkRef.current && typeof e?.clientX === 'number' && typeof e?.clientY === 'number') {
      const rect = artworkRef.current.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      // Ignore spurious leave events if the mouse is actually still inside the boundaries
      if (
        x >= rect.left && 
        x <= rect.right && 
        y >= rect.top && 
        y <= rect.bottom
      ) {
        return;
      }
    }

    setIsArtworkHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    stableCenterRef.current = { x: 0, y: 0 };
  };

  // Load YT IFrame API and handle audio/video playback
  useEffect(() => {
    if (songData.videoId) {
      // YouTube Video
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const createYTPlayer = () => {
        const container = document.getElementById('yt-player-container');
        if (!container) return;

        ytPlayerRef.current = new window.YT.Player('yt-player-container', {
          height: '0',
          width: '0',
          videoId: songData.videoId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
          },
          events: {
            onReady: (e: any) => {
              // Start at 0 volume and fade in!
              faderRef.current = 0;
              e.target.setVolume(0);
              setDuration(e.target.getDuration());
              if (isPlayingRef.current) {
                e.target.playVideo();
                fadeVolume(1, 800);
              } else {
                e.target.pauseVideo();
              }
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                handleNextSongRef.current();
              } else if (e.data === window.YT.PlayerState.PLAYING) {
                setPlaying(true);
                setDuration(e.target.getDuration());
                // Fade in if the fader is at 0 or low
                if (faderRef.current < 0.1) {
                  fadeVolume(1, 800);
                }
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                setPlaying(false);
              }
            }
          }
        });
      };

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          createYTPlayer();
        };
      } else if (!ytPlayerRef.current) {
        // If window.YT is already loaded but player ref is null (due to remounting),
        // instantiate the YT.Player immediately!
        createYTPlayer();
      } else if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
        // Start at 0 volume and load track!
        faderRef.current = 0;
        try { ytPlayerRef.current.setVolume(0); } catch(e){}
        ytPlayerRef.current.loadVideoById(songData.videoId);
        setPlaying(true);
        ytPlayerRef.current.playVideo();
        fadeVolume(1, 800);
      }
    } else if (songData.audioUrl) {
      // Local Audio File
      if (ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
        try { ytPlayerRef.current.pauseVideo(); } catch(e){}
      }
      if (audioRef.current) {
        audioRef.current.src = songData.audioUrl;
        // Start at 0 volume and play, then fade in!
        faderRef.current = 0;
        audioRef.current.volume = 0;
        setPlaying(true);
        initAudioAnalyzer();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play()
          .then(() => {
            fadeVolume(1, 800);
          })
          .catch(console.error);
      }
    }
  }, [songData.videoId, songData.audioUrl]);

  // Sync isPlaying state to players
  useEffect(() => {
    if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
      if (isPlaying) ytPlayerRef.current.playVideo();
      else ytPlayerRef.current.pauseVideo();
    } else if (audioRef.current) {
      if (isPlaying) {
        initAudioAnalyzer();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  // Media Session API – integrates with macOS media keys (F7/F8/F9), AirPods, and Control Center
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Set track metadata so OS knows what's playing
    navigator.mediaSession.metadata = new MediaMetadata({
      title: songData.title,
      artist: songData.artist,
      artwork: songData.artworkUrl
        ? [{ src: songData.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    // Keep playback state in sync with OS
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Play/pause handlers: read current state from ref, set directly – no debounce, no stale closure
    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlayingRef.current) {
        setPlaying(true);
        if (songData.videoId && ytPlayerRef.current?.playVideo) {
          try { ytPlayerRef.current.playVideo(); } catch(e) {}
        } else if (audioRef.current) {
          initAudioAnalyzer();
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
          audioRef.current.play().catch(() => {});
        }
      }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlayingRef.current) {
        setPlaying(false);
        if (songData.videoId && ytPlayerRef.current?.pauseVideo) {
          try { ytPlayerRef.current.pauseVideo(); } catch(e) {}
        } else if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      handlePreviousSong();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      handleNextSongRef.current();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        handleSliderChange([details.seekTime]);
      }
    });

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [songData.title, songData.artist, songData.artworkUrl, isPlaying, songData.videoId]);

  // Progress timer for current time
  useEffect(() => {

    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          setCurrentTime(ytPlayerRef.current.getCurrentTime());
          const dur = ytPlayerRef.current.getDuration();
          if (dur > 0) setDuration(dur);
        } else if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 50);
    } else if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, songData.videoId]);

  const togglePlayPause = () => {
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 250) {
      return;
    }
    lastToggleTimeRef.current = now;

    const nextPlaying = !isPlaying;
    if (currentTime >= duration && duration > 0) {
      setCurrentTime(0);
      if (songData.videoId && ytPlayerRef.current) ytPlayerRef.current.seekTo(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }

    if (nextPlaying) {
      // Synchronously call playback methods directly under the user gesture event loop!
      if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
        try { ytPlayerRef.current.playVideo(); } catch (e) {}
      } else if (audioRef.current) {
        initAudioAnalyzer();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play().catch(console.error);
      }
    } else {
      if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
        try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    setPlaying(nextPlaying);
  };

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const seekToAbsoluteTime = (time: number) => {
    const newTime = Math.max(0, Math.min(duration || 9999, time));
    setCurrentTime(newTime);
    if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleNextSong = async () => {
    if (queue.length === 0) {
      // If queue is empty, fade out and stop rather than loop
      await fadeVolume(0, 400);
      setPlaying(false);
      setCurrentTime(0);
      if (songData.videoId && ytPlayerRef.current?.seekTo) {
        try {
          ytPlayerRef.current.seekTo(0, true);
          ytPlayerRef.current.pauseVideo();
        } catch(e){}
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
      }
      faderRef.current = 1; // silently reset fader multiplier for next play
      // Apply manual volume back immediately
      const activeVol = volumeRef.current;
      if (songData.videoId && ytPlayerRef.current?.setVolume) {
        try { ytPlayerRef.current.setVolume(activeVol); } catch(e){}
      }
      if (audioRef.current) {
        audioRef.current.volume = activeVol / 100;
      }
      toast.info("Queue is empty", {
        description: "Add more songs to keep the music playing!",
      });
      return;
    }
    
    await fadeVolume(0, 400);
    const currentIndex = queue.findIndex(item => item.videoId === songData.videoId);
    const nextIndex = currentIndex >= queue.length - 1 ? 0 : currentIndex + 1;
    const nextSong = queue[nextIndex];
    if (nextSong && onSelectFromQueue) {
      onSelectFromQueue(nextSong.id);
    }
  };

  useEffect(() => {
    handleNextSongRef.current = handleNextSong;
  }, [handleNextSong]);

  const handlePreviousSong = async () => {
    if (queue.length === 0) {
      await fadeVolume(0, 400);
      skipTime(-currentTime); // seek to 0
      await fadeVolume(1, 400);
      return;
    }
    if (currentTime > 3) {
      await fadeVolume(0, 400);
      skipTime(-currentTime); // seek to 0
      await fadeVolume(1, 400);
      return;
    }
    
    await fadeVolume(0, 400);
    const currentIndex = queue.findIndex(item => item.videoId === songData.videoId);
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    const prevSong = queue[prevIndex];
    if (prevSong && onSelectFromQueue) {
      onSelectFromQueue(prevSong.id);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVol = value[0];
    setVolume(newVol);

    // Cancel fader animation and reset fader to 1 so manual adjustment takes full priority
    if (faderAnimationRef.current) {
      cancelAnimationFrame(faderAnimationRef.current);
      faderAnimationRef.current = null;
    }
    faderRef.current = 1;

    if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(newVol);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol / 100;
    }

    // Custom premium Volume HUD animation
    if (volumeHUDTimeoutRef.current) {
      clearTimeout(volumeHUDTimeoutRef.current);
    }
    setShowVolumeHUD(true);
    volumeHUDTimeoutRef.current = setTimeout(() => {
      setShowVolumeHUD(false);
    }, 1500);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger playback shortcuts if the user is typing in an input field or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const nv = Math.min(100, volume + 5);
        handleVolumeChange([nv]);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const nv = Math.max(0, volume - 5);
        handleVolumeChange([nv]);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (volume > 0) {
          setPreMuteVolume(volume);
          handleVolumeChange([0]);
        } else {
          handleVolumeChange([preMuteVolume || 70]);
        }
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setShowLyrics((prev) => !prev);
      } else if (e.code === 'Comma' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, volume, preMuteVolume]);

  return (
    <div 
      className={`size-full relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center transition-all bg-transition ${isUserIdle && zenMode ? 'cursor-none' : ''}`}
      style={{
        '--theme-primary': dominantColors.primary,
        '--theme-secondary': dominantColors.secondary,
        '--theme-accent': dominantColors.accent,
        '--theme-primary-fade': dominantColors.primary.replace('0.6', '0.15'),
        '--theme-secondary-fade': dominantColors.secondary.replace('0.5', '0.12'),
        '--theme-accent-fade': dominantColors.accent.replace('0.4', '0.08'),
        '--theme-primary-shadow': dominantColors.primary.replace('0.6', '0.45'),
        '--theme-secondary-shadow': dominantColors.secondary.replace('0.5', '0.35'),
        '--theme-primary-shadow-idle': dominantColors.primary.replace('0.6', '0.2'),
        '--theme-secondary-shadow-idle': dominantColors.secondary.replace('0.5', '0.15'),
      } as React.CSSProperties}
    >




      {/* Settings hint - only shown once */}
      <AnimatePresence>
        {showSettingsHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-8 right-8 z-50 px-4 py-2 rounded-full bg-black/50 border border-white/10"
          >
            <p className="text-xs text-white/50">
              Press <span className="text-white/70">⌘,</span> for settings
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className={`absolute top-8 left-8 z-20 transition-all duration-700 ${isUserIdle && zenMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <motion.button
          id="back-home-button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          onClick={onBackToHome}
          className="text-xl font-light text-white/30 hover:text-white/50 tracking-wider transition-colors cursor-pointer"
        >
          Elva
        </motion.button>
      </div>

      {/* Dedicated Overlay Container to prevent React DOM child index / Framer Motion insertBefore desync bugs */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* Settings modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="pointer-events-auto">
              <SettingsModal
                onClose={() => setShowSettings(false)}
                backgroundStyle={backgroundStyle}
                onBackgroundStyleChange={onBackgroundStyleChange}
                themePreset={themePreset}
                onThemePresetChange={onThemePresetChange}
                accentColor={accentColor}
                onAccentColorChange={onAccentColorChange}
                showVisualizer={showVisualizer}
                onShowVisualizerChange={onShowVisualizerChange}
                zenMode={zenMode}
                onZenModeChange={onZenModeChange}
                showVolumeSlider={showVolumeSlider}
                onShowVolumeSliderChange={onShowVolumeSliderChange}
                enable3DTilt={enable3DTilt}
                onEnable3DTiltChange={onEnable3DTiltChange}
                showSettingsButton={showSettingsButton}
                onShowSettingsButtonChange={onShowSettingsButtonChange}
                textureStyle={textureStyle}
                onTextureStyleChange={onTextureStyleChange}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Queue component */}
        <AnimatePresence>
          {showQueue && (
            <div className="pointer-events-auto">
              <Queue
                items={queue.map(item => ({
                  id: item.id,
                  title: item.title,
                  artist: item.artist,
                  thumbnail: item.thumbnail
                }))}
                currentSongId={songData.videoId}
                accentColor={accentColor}
                onRemove={onRemoveFromQueue || (() => {})}
                onSelect={async (id) => {
                  await fadeVolume(0, 400);
                  if (onSelectFromQueue) onSelectFromQueue(id);
                }}
                onClose={() => setShowQueue(false)}
                focusSearchOnMount={focusSearchInQueue}
                onSearch={onSearch}
                onFetchChannelUploads={onFetchChannelUploads}
                onAddToQueue={onAddToQueue}
                onSelectSong={async (song) => {
                  await fadeVolume(0, 400);
                  if (onSelectSong) onSelectSong(song);
                }}
                onFileSelect={onFileSelect}
                onUrlSubmit={onUrlSubmit}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden Media Players */}
      <div className="w-0 h-0 overflow-hidden absolute pointer-events-none" style={{ opacity: 0 }}>
        <div id="yt-player-container" />
      </div>
      <audio 
        ref={audioRef} 
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleNextSong}
        onPlay={() => {
          if (!isPlayingRef.current) {
            setPlaying(true);
          }
        }}
        onPause={() => {
          if (isPlayingRef.current) {
            setPlaying(false);
          }
        }}
        className="hidden" 
      />

      {/* Animated background layers - smooth fade in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        className="absolute inset-0 overflow-hidden"
        style={{ willChange: 'opacity' }}
      >
        {backgroundStyle === 'particles' && (
          <>
            {/* Advanced animated particles */}
            {optimizedParticles.map((p) => (
              <motion.div
                key={`particle-${p.id}`}
                initial={{
                  x: `${p.xStart}%`,
                  y: `${p.yStart}%`,
                  scale: 0,
                }}
                animate={{
                  x: p.xValues,
                  y: p.yValues,
                  scale: [0, p.scaleMax, 0],
                  opacity: [0, 0.15, 0],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: p.delay,
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: p.id % 3 === 0
                    ? 'var(--theme-primary)'
                    : p.id % 3 === 1
                    ? 'var(--theme-secondary)'
                    : 'var(--theme-accent)',
                  filter: 'blur(2px)',
                }}
              />
            ))}

            {/* Flowing gradient waves — blur reduced 120→70, 100→60 for GPU savings */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.3, 1],
              }}
              transition={{
                rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                scale: { duration: 25, repeat: Infinity, ease: "easeInOut" },
              }}
              className="absolute top-0 left-0 w-full h-full"
              style={{
                background: 'conic-gradient(from 0deg at 50% 50%, var(--theme-primary) 0deg, transparent 60deg, var(--theme-secondary) 180deg, transparent 240deg, var(--theme-accent) 300deg, transparent 360deg)',
                filter: 'blur(70px)',
                opacity: 0.3,
              }}
            />

            <motion.div
              animate={{
                rotate: [360, 0],
                scale: [1.2, 0.9, 1.2],
              }}
              transition={{
                rotate: { duration: 45, repeat: Infinity, ease: "linear" },
                scale: { duration: 30, repeat: Infinity, ease: "easeInOut" },
              }}
              className="absolute bottom-0 right-0 w-full h-full"
              style={{
                background: 'conic-gradient(from 180deg at 50% 50%, var(--theme-secondary) 0deg, transparent 90deg, var(--theme-accent) 200deg, transparent 270deg, var(--theme-primary) 320deg, transparent 360deg)',
                filter: 'blur(60px)',
                opacity: 0.25,
              }}
            />
          </>
        )}

        {backgroundStyle === 'liquid' && (
          <>
            {/* Liquid blob 1 - top left | size 1200→700, blur 100→60 */}
            <motion.div
              animate={{
                x: [-80, 120, -80],
                y: [-100, 80, -100],
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 40%, var(--theme-primary), var(--theme-secondary) 50%, transparent 70%)',
                filter: 'blur(60px)',
              }}
            />

            {/* Liquid blob 2 - bottom right | size 1400→800, blur 120→70 */}
            <motion.div
              animate={{
                x: [80, -100, 80],
                y: [100, -80, 100],
                scale: [1.1, 1, 1.3, 1.1],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 50,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -bottom-48 -right-48 w-[800px] h-[800px] rounded-full"
              style={{
                background: 'radial-gradient(circle at 70% 60%, var(--theme-secondary), var(--theme-accent) 40%, transparent 65%)',
                filter: 'blur(70px)',
              }}
            />

            {/* Liquid blob 3 - center | size 1100→700, blur 110→65 */}
            <motion.div
              animate={{
                x: [-40, 80, -60, -40],
                y: [60, -50, 80, 60],
                scale: [1, 1.3, 1.1, 1],
                rotate: [45, 225, 405],
              }}
              transition={{
                duration: 45,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
              style={{
                background: 'radial-gradient(circle at 50% 50%, var(--theme-accent), var(--theme-primary) 45%, transparent 70%)',
                filter: 'blur(65px)',
              }}
            />
          </>
        )}

        {/* NEW: Fluid Mesh Background (Hybrid Ambient Technique) */}
        {backgroundStyle === 'mesh' && (
          <div className="absolute inset-0 overflow-hidden bg-black">
            {/* Base layer of dominant primary color */}
            <div 
              className="absolute inset-0 opacity-50" 
              style={{ background: 'var(--theme-primary)' }} 
            />
            
            {/* Primary Fluid Layer — blur 80→55, saturate 250→160 */}
            <motion.div
              animate={{
                scale: [1.2, 1.5, 1.2],
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-50%] w-[200%] h-[200%] origin-center opacity-70"
              style={{
                backgroundImage: themePreset === 'dynamic'
                  ? `url(${songData.artworkUrl})`
                  : 'radial-gradient(circle at 30% 30%, var(--theme-primary) 0%, var(--theme-secondary) 50%, var(--theme-accent) 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(55px) saturate(160%) brightness(1.1)',
              }}
            />

            {/* Synthetic Color Orb 1 — blur stays 60px (small element) */}
            <motion.div
              animate={{
                x: ["-20vw", "30vw", "-10vw", "-20vw"],
                y: ["-20vh", "20vh", "30vh", "-20vh"],
                scale: [1, 1.5, 1.2, 1],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-[70vw] h-[70vw] rounded-full mix-blend-overlay opacity-60 pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, var(--theme-secondary) 0%, transparent 70%)', 
                filter: 'blur(60px)',
              }}
            />

            {/* Synthetic Color Orb 2 — blur stays 60px */}
            <motion.div
              animate={{
                x: ["20vw", "-40vw", "10vw", "20vw"],
                y: ["30vh", "-10vh", "-40vh", "30vh"],
                scale: [1.2, 1, 1.6, 1.2],
              }}
              transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 right-0 w-[80vw] h-[80vw] rounded-full mix-blend-color-dodge opacity-40 pointer-events-none"
              style={{ 
                background: 'radial-gradient(circle, var(--theme-accent) 0%, transparent 70%)', 
                filter: 'blur(60px)',
              }}
            />

            {/* Secondary Artwork Layer — blur 100→65, saturate 200→140 */}
            <motion.div
              animate={{
                scale: [1.5, 1.2, 1.5],
                rotate: [360, 270, 180, 90, 0],
              }}
              transition={{ duration: 85, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-50%] w-[200%] h-[200%] origin-center mix-blend-overlay opacity-60"
              style={{
                backgroundImage: themePreset === 'dynamic'
                  ? `url(${songData.artworkUrl})`
                  : 'radial-gradient(circle at 70% 70%, var(--theme-secondary) 0%, var(--theme-accent) 50%, var(--theme-primary) 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(65px) saturate(140%) contrast(1.4)',
              }}
            />
            
            {/* Subtle grain overlay to prevent color banding and add premium texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
          </div>
        )}

        {backgroundStyle === 'default' && (
          <>
            {/* Default blob 1 - top left | size 900→600, blur 150→80 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.35, 0.45, 0.35],
                scale: [1, 1.1, 1],
                x: [-40, 40, -40],
                y: [-25, 25, -25],
              }}
              transition={{
                opacity: { duration: 2, ease: "easeOut" },
                scale: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 },
                x: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 },
                y: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 },
              }}
              className="absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full blur-[80px] transition-all duration-1000"
              style={{
                background: 'radial-gradient(circle, var(--theme-primary) 0%, var(--theme-primary-fade) 40%, transparent 70%)',
              }}
            />

            {/* Default blob 2 - bottom right | size 800→550, blur 140→75 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.3, 0.4, 0.3],
                scale: [1, 1.12, 1],
                x: [40, -40, 40],
                y: [25, -25, 25],
              }}
              transition={{
                opacity: { duration: 2, delay: 0.3, ease: "easeOut" },
                scale: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2.3 },
                x: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2.3 },
                y: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2.3 },
              }}
              className="absolute -bottom-24 -right-24 w-[550px] h-[550px] rounded-full blur-[75px] transition-all duration-1000"
              style={{
                background: 'radial-gradient(circle, var(--theme-secondary) 0%, var(--theme-secondary-fade) 40%, transparent 70%)',
              }}
            />

            {/* Default blob 3 - center | size 1000→650, blur 160→85 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.25, 0.35, 0.25],
                scale: [1, 1.08, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                opacity: { duration: 2, delay: 0.6, ease: "easeOut" },
                scale: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2.6 },
                rotate: { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2.6 },
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[85px] transition-all duration-1000"
              style={{
                background: 'radial-gradient(ellipse, var(--theme-accent) 0%, var(--theme-accent-fade) 30%, transparent 60%)',
              }}
            />
          </>
        )}

        {/* Soft immersive dark vignette and top/bottom gradient maps to protect text readability */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-[5]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none z-[5]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent pointer-events-none z-[5]" />
      </motion.div>

      {/* Main content container */}
      <motion.div
        initial={{ opacity: 0, x: 0 }}
        animate={{ 
          opacity: 1,
          x: showQueue && isLargeScreen ? -200 : 0
        }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.2, ease: "easeOut" },
          x: { type: 'spring', damping: 26, stiffness: 220 }
        }}
        className="relative z-10 flex flex-col items-center px-8 w-full max-w-2xl"
      >
        {/* Album artwork with controls */}
        <div
          id="artwork-card"
          ref={artworkRef}
          className="relative group/artwork cursor-pointer w-[520px] h-[520px]"
          style={{ perspective: 1200 }}
        >
          {showVisualizer && (
            <canvas
              ref={canvasRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[-1]"
              style={{ width: '850px', height: '850px' }}
              width={850}
              height={850}
            />
          )}
          {/* OUTER LAYER: Handles the 180 degree flip animation cleanly without motionValue conflict */}
          <motion.div
            className="w-full h-full relative"
            animate={{ rotateY: showLyrics ? 180 : 0 }}
            transition={{ rotateY: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* INNER LAYER: Handles the buttery smooth mouse tilt tracking */}
            <motion.div
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: [0, -4, 0],
                scale: 1,
              }}
              className="w-full h-full relative"
              style={{
                rotateX: enable3DTilt && !showLyrics ? rotateX : 0,
                rotateY: enable3DTilt && !showLyrics ? rotateY : 0,
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
              transition={{
                opacity: { duration: 0.4 },
                y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
                scale: { type: "spring", stiffness: 140, damping: 22 }
              }}
            >
              {/* FRONT FACE */}
              <div 
                className={`absolute inset-0 w-full h-full ${showLyrics ? 'pointer-events-none' : ''}`} 
                style={{ 
                  backfaceVisibility: 'hidden',
                  visibility: showLyrics ? 'hidden' : 'visible'
                }}
              >
              {/* Layered glass depth behind artwork - optimized */}
          <div
            className="absolute inset-0 rounded-3xl bg-white/[0.02] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            style={{
              transform: 'translateY(32px) scale(0.96)',
              backfaceVisibility: 'hidden'
            }}
          />
          <div
            className="absolute inset-0 rounded-3xl bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            style={{
              transform: 'translateY(16px) scale(0.98)',
              backfaceVisibility: 'hidden'
            }}
          />

          {/* Ambient glow layers — blur 80→45, 60→35, 50→30 (invisible difference, big GPU gain) */}
          <div
            className="absolute -inset-16 rounded-full pointer-events-none transition-opacity duration-1000"
            style={{
              opacity: isLoaded ? 0.25 : 0,
              background: 'radial-gradient(circle, var(--theme-primary) 0%, transparent 70%)',
              filter: 'blur(45px)',
            }}
          />
          <div
            className="absolute -inset-12 rounded-full pointer-events-none transition-opacity duration-1000"
            style={{
              opacity: isLoaded ? 0.2 : 0,
              background: 'radial-gradient(circle, var(--theme-secondary) 0%, transparent 70%)',
              filter: 'blur(35px)',
            }}
          />
          <div
            className="absolute -inset-8 rounded-3xl pointer-events-none transition-opacity duration-1000"
            style={{
              opacity: isLoaded ? 0.3 : 0,
              background: 'radial-gradient(circle, var(--theme-accent) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />

          {/* Cinematic rim light */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-60 pointer-events-none" />

          {/* Album artwork card with dynamic colored shadows */}
          <div
            className="relative rounded-3xl overflow-hidden transition-all duration-1000 w-full h-full cursor-pointer"
            style={{
              boxShadow: isLoaded
                ? isPlaying 
                  ? '0 40px 80px var(--theme-primary-shadow), 0 20px 40px var(--theme-secondary-shadow), 0 60px 120px rgba(0,0,0,0.65)'
                  : '0 20px 40px var(--theme-primary-shadow-idle), 0 10px 20px var(--theme-secondary-shadow-idle), 0 30px 60px rgba(0,0,0,0.45)'
                : isPlaying
                  ? '0 40px 80px rgba(0,0,0,0.4), 0 20px 40px rgba(0,0,0,0.3), 0 60px 120px rgba(0,0,0,0.6)'
                  : '0 20px 40px rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.15), 0 30px 60px rgba(0,0,0,0.4)',
              isolation: 'isolate'
            }}
            onPointerDown={(e) => {
              // Ensure we respond to mouse/pointer press down instantly to bypass mouse up desyncs
              if (e.button === 0) {
                togglePlayPause();
              }
            }}
            onClick={(e) => {
              // Fallback if pointerdown is somehow bypassed or for standard keyboard access
              togglePlayPause();
            }}
          >
            {/* Previous artwork for crossfade */}
            {showPreviousArtwork && previousArtwork && (
              <motion.img
                src={previousArtwork}
                alt="Previous artwork"
                className={`absolute inset-0 w-full h-full object-cover ${songData.videoId ? 'scale-[1.35]' : ''}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            )}

            {/* Current artwork */}
            <motion.img
              src={songData.artworkUrl}
              alt="Album artwork"
              className={`w-full h-full object-cover ${songData.videoId ? 'scale-[1.35]' : ''}`}
              style={{
                filter: `blur(${imageBlur}px)`,
              }}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{
                opacity: isLoaded ? (isPlaying ? 1 : 0.8) : 0.7,
                scale: 1,
              }}
              transition={{
                opacity: { duration: 0.8, ease: "easeOut" },
                scale: { duration: 0.8, ease: "easeOut" },
              }}
            />

            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />

            {/* Interactive overlay - appears on hover */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20 transition-all duration-300 ${
                (isArtworkHovered || !isPlaying || (tourType !== null && currentStep === 1)) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Song info - top */}
              <div className="absolute top-8 left-0 right-0 flex flex-col items-center text-center px-8">
                <h2 className="text-xl text-white/90 font-medium mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>{songData.title}</h2>
                <p className="text-sm text-white/60 tracking-wide" style={{ letterSpacing: '0.02em' }}>{songData.artist}</p>
              </div>

              {/* Controls container */}
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                {/* Timeline section */}
                <div className="space-y-2 mb-6" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                  <Slider.Root
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSliderChange}
                    className="relative flex items-center w-full h-12 cursor-pointer group/slider"
                  >
                    {/* Minimalistic waveform backdrop */}
                    <div className="absolute inset-0 flex items-center gap-[2px] px-0.5">
                      {waveformData.map((height, i) => {
                        const progress = (currentTime / duration) * 100;
                        const barProgress = (i / waveformData.length) * 100;
                        const isPlayed = barProgress <= progress;

                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-full transition-all duration-150"
                            style={{
                              height: `${height * 16}px`,
                              backgroundColor: isPlayed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                              opacity: 0.6,
                            }}
                          />
                        );
                      })}
                    </div>

                    <Slider.Track className="relative h-[3px] w-full bg-transparent rounded-full overflow-hidden">
                      <Slider.Range className="absolute h-full bg-transparent" />
                    </Slider.Track>
                    <Slider.Thumb
                      className="block w-3 h-3 rounded-full bg-white opacity-0 group-hover/slider:opacity-100 transition-opacity duration-150 focus:outline-none focus:opacity-100"
                    />
                  </Slider.Root>

                  {/* Time display */}
                  <div className="flex justify-between">
                    <span className="text-xs text-white/70 tabular-nums font-medium">
                      {formatTime(currentTime)}
                    </span>
                    <span className="text-xs text-white/70 tabular-nums font-medium">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* Playback controls - under timeline */}
                <div id="music-controls" className="flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
                  {/* Previous song */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousSong();
                    }}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                    title="Previous Song"
                  >
                    <SkipBack className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                  </button>

                  {/* Play/Pause button */}
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    className="relative group/button active:scale-95 transition-all cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    <div className="relative px-12 py-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden transition-all">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000" />
                      <div className="relative flex items-center justify-center">
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-white fill-white" />
                        ) : (
                          <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                        )}
                      </div>
                      <AnimatePresence>
                        {isPlaying && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            exit={{ scaleX: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/40 origin-left"
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </button>

                  {/* Next song */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextSong();
                    }}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                    title="Next Song"
                  >
                    <SkipForward className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
          {/* END FRONT FACE */}

          {/* BACK FACE (LYRICS) */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[28px] overflow-hidden bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex flex-col items-center py-10 cursor-default ${
              !showLyrics ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              visibility: showLyrics ? 'visible' : 'hidden'
            }}
            onClick={() => setShowLyrics(false)}
          >
            {/* Dynamic internal glow from current colors */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 10%, var(--theme-primary) 0%, transparent 60%), radial-gradient(circle at 50% 90%, var(--theme-secondary) 0%, transparent 60%)'
              }}
            />


            {/* Header with optional Unsynced badge */}
            <div className="flex flex-col items-center gap-1.5 mb-5 relative z-10">
              <h3 className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase">Lyrics</h3>
              {!isLyricsSynced && lyrics.length > 0 && (
                <span className="text-[10px] text-white/40 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-medium">
                  Plain Lyrics
                </span>
              )}
            </div>

            <div 
              ref={lyricContainerRef}
              className="w-full flex-1 overflow-y-auto scrollbar-none relative z-10 px-8 flex flex-col items-center pb-32"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maskImage: isLyricsSynced 
                  ? 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' 
                  : 'none' 
              }}
            >
              {isLyricsSynced && <div className="min-h-[40%]" />} {/* Spacer only for synced centering */}
              
              {isLoadingLyrics ? (
                <div className="flex flex-col items-center justify-center gap-4 h-full">
                  <div className={`w-6 h-6 border-2 border-white/20 ${theme.borderT} rounded-full animate-spin`} />
                  <p className="text-white/40 text-sm tracking-widest uppercase">Fetching lyrics...</p>
                </div>
              ) : lyrics.length > 0 ? (
                lyrics.map((line, idx) => {
                  if (isLyricsSynced) {
                    const isActive = idx === currentLyricIndex;
                    return (
                      <div
                        key={idx}
                        ref={isActive ? activeLyricRef : null}
                        onClick={(e) => { e.stopPropagation(); seekToAbsoluteTime(line.time); }}
                        className={`w-full text-center py-4 cursor-pointer transition-all duration-500 ease-out ${
                          isActive
                            ? 'opacity-100 scale-105 filter-none'
                            : 'opacity-30 scale-100 blur-[1px] hover:opacity-60'
                        }`}
                      >
                        <p className={`font-medium tracking-tight ${
                          isActive ? 'text-2xl text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'text-xl text-white/80'
                        }`}>
                          {line.text}
                        </p>
                      </div>
                    );
                  } else {
                    // Static lyrics mode: fully visible, cleanly spaced scrollable lines
                    return (
                      <div
                        key={idx}
                        className="w-full text-center py-2.5 opacity-80 hover:opacity-100 transition-all duration-200"
                      >
                        <p className="text-[19px] text-white/90 font-normal tracking-tight leading-relaxed select-text">
                          {line.text}
                        </p>
                      </div>
                    );
                  }
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <p className="text-white/50 text-lg font-medium tracking-wide">Lyrics not found</p>
                  <p className="text-white/30 text-sm mt-2 font-light">Enjoy the rhythm and melody instead ♪</p>
                </div>
              )}
              
              {isLyricsSynced && <div className="min-h-[60%]" />}
            </div>
          </div>
          {/* END BACK FACE */}
            </motion.div>
          </motion.div>
        </div>

        {/* Dynamic micro-hint below the card */}
        <p className="text-[9px] tracking-[0.22em] text-white/20 mt-4 text-center select-none uppercase font-light opacity-0 group-hover/artwork:opacity-100 transition-opacity duration-700 pointer-events-none">
          {showLyrics ? "Click lyrics or press L to return" : "Click artwork for play/pause or press L for lyrics"}
        </p>

        {/* Bottom controls - Add Music, Queue & Settings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isUserIdle && zenMode ? 0 : 1 }}
          transition={{ duration: 0.7 }}
          className={`mt-8 flex items-center justify-center gap-3 ${isUserIdle && zenMode ? 'pointer-events-none' : ''}`}
        >
          {/* Buttons: premium dark high-contrast glassmorphic style */}
          {/* Segmented Capsule Control: + Add Music | Queue (x) */}
          <div className="flex items-center rounded-full bg-black/35 border border-white/12 overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
            {/* Left Segment: Add Music */}
            <button
              id="add-music-button"
              onClick={() => {
                if (showQueue && focusSearchInQueue) {
                  setShowQueue(false);
                } else {
                  setFocusSearchInQueue(true);
                  setShowQueue(true);
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 transition-all cursor-pointer ${
                showQueue && focusSearchInQueue
                  ? `bg-white/[0.08] ${theme.textLight}`
                  : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
              }`}
            >
              <Plus className={`w-4 h-4 transition-colors ${showQueue && focusSearchInQueue ? theme.text : 'text-white/40'}`} />
              <span className="text-sm font-medium tracking-wide">Add Music</span>
            </button>

            {/* Elegant Divider */}
            <div className="h-5 w-[1px] bg-white/10 shrink-0" />

            {/* Right Segment: Queue */}
            <button
              id="queue-button"
              onClick={() => {
                if (showQueue && !focusSearchInQueue) {
                  setShowQueue(false);
                } else {
                  setFocusSearchInQueue(false);
                  setShowQueue(true);
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 transition-all cursor-pointer relative ${
                showQueue && !focusSearchInQueue
                  ? `bg-white/[0.08] ${theme.textLight}`
                  : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
              }`}
            >
              <List className={`w-4 h-4 transition-colors ${showQueue && !focusSearchInQueue ? theme.text : 'text-white/40'}`} />
              <span className="text-sm font-medium tracking-wide">Queue</span>
              {queue.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all leading-none ${
                  showQueue && !focusSearchInQueue
                    ? `${accentBgs[accentColor]} text-white`
                    : 'bg-white/10 text-white/60'
                }`}>
                  {queue.length}
                </span>
              )}
            </button>
          </div>

          {showSettingsButton && (
            <button
              id="settings-button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/30 hover:bg-black/45 border border-white/12 hover:border-white/25 transition-all group"
            >
              <Settings className="w-4 h-4 text-white/60 group-hover:text-white/85 transition-colors" />
              <span className="text-sm text-white/85 group-hover:text-white transition-colors">Settings</span>
            </button>
          )}
        </motion.div>

      </motion.div>

      {/* Custom Premium Volume HUD overlay */}
      <AnimatePresence>
        {showVolumeHUD && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: -10, x: '-50%' }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-10 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] pointer-events-none"
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-white/55" />
            ) : volume < 33 ? (
              <Volume className={`w-4 h-4 ${theme.text}`} />
            ) : volume < 66 ? (
              <Volume1 className={`w-4 h-4 ${theme.text}`} />
            ) : (
              <Volume2 className={`w-4 h-4 ${theme.text}`} />
            )}
            <div className="w-24 h-1.5 bg-white/15 rounded-full overflow-hidden relative">
              <motion.div
                className={`h-full ${accentBgs400[accentColor]} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${volume}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </div>
            <span className="text-xs font-semibold text-white/90 tabular-nums w-8 text-right">
              {volume}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
