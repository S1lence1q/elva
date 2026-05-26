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
import { LyricsPanel } from './LyricsPanel';
import { PlayerControls } from './PlayerControls';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { LyricLine } from '../types';
import { FluidBackground } from './FluidBackground';

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
  zenMode?: boolean;
  onZenModeChange?: (zen: boolean) => void;
  showVolumeSlider?: boolean;
  onShowVolumeSliderChange?: (show: boolean) => void;
  enable3DTilt?: boolean;
  onEnable3DTiltChange?: (enable: boolean) => void;
  showSettingsButton?: boolean;
  onShowSettingsButtonChange?: (show: boolean) => void;
  favorites?: SearchResult[];
  onToggleFavorite?: (song: SearchResult) => void;
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
  zenMode = false,
  onZenModeChange,
  showVolumeSlider = true,
  onShowVolumeSliderChange,
  enable3DTilt = true,
  onEnable3DTiltChange,
  showSettingsButton = false,
  onShowSettingsButtonChange,
  favorites = [],
  onToggleFavorite
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
  const isTransitioningRef = useRef(false);
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

  const handleAddToPlaylist = (playlistId: string) => {
    try {
      const stored = localStorage.getItem('elva_playlists');
      const plist: any[] = stored ? JSON.parse(stored) : [];
      const playlist = plist.find(p => p.id === playlistId);
      
      if (playlist) {
        const currentTrack = {
          id: songData.videoId || songData.audioUrl,
          videoId: songData.videoId || '',
          title: songData.title,
          artist: songData.artist,
          thumbnail: songData.artworkUrl
        };
        
        // Avoid duplicate tracks in same playlist
        if (playlist.tracks.some((t: any) => t.id === currentTrack.id)) {
          toast.info('Allerede tilføjet til denne playliste');
          return;
        }
        
        playlist.tracks.push(currentTrack);
        localStorage.setItem('elva_playlists', JSON.stringify(plist));
        
        // Dispatch custom event to notify ProfileHubView
        window.dispatchEvent(new Event('elva-playlists-updated'));
        
        toast.success(`Tilføjet til ${playlist.name}`, {
          description: songData.title
        });
      }
    } catch (e) {
      console.warn('Failed to add track to playlist:', e);
    }
  };

  // Automatic play-count & listening-time tracker (15 seconds trigger)
  useEffect(() => {
    if (!isPlaying) return;
    
    let playTimer = setTimeout(() => {
      // 1. Increment play count for this track
      try {
        const stored = localStorage.getItem('elva_play_counts');
        const counts: any = stored ? JSON.parse(stored) : {};
        
        const trackId = songData.videoId || songData.audioUrl;
        if (!counts[trackId]) {
          counts[trackId] = {
            title: songData.title,
            artist: songData.artist,
            count: 0,
            lastPlayed: Date.now()
          };
        }
        counts[trackId].count += 1;
        counts[trackId].lastPlayed = Date.now();
        localStorage.setItem('elva_play_counts', JSON.stringify(counts));
        
        // 2. Increment weekly stats lytte-tid
        const storedWeekly = localStorage.getItem('elva_weekly_time');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDayName = days[new Date().getDay()];
        
        let stats: { day: string; min: number }[] = storedWeekly ? JSON.parse(storedWeekly) : [
          { day: 'Mon', min: 12 },
          { day: 'Tue', min: 45 },
          { day: 'Wed', min: 25 },
          { day: 'Thu', min: 60 },
          { day: 'Fri', min: 85 },
          { day: 'Sat', min: 110 },
          { day: 'Sun', min: 50 }
        ];
        
        const dayStat = stats.find(s => s.day === currentDayName);
        if (dayStat) {
          dayStat.min += 3; // Add 3 minutes per play
        } else {
          stats.push({ day: currentDayName, min: 3 });
        }
        localStorage.setItem('elva_weekly_time', JSON.stringify(stats));

        // Dispatch a custom event to notify ProfileHubView to update stats reactively!
        window.dispatchEvent(new Event('elva-stats-updated'));
      } catch (e) {
        console.warn('Failed to update stats in localStorage:', e);
      }
    }, 15000); // 15 seconds trigger

    return () => clearTimeout(playTimer);
  }, [songData.videoId, songData.audioUrl, isPlaying]);


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
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);


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
      
      // Use local component-level audio source node to avoid memory leaks
      // and ensure re-mount connects the active audio element correctly.
      if (!audioSourceRef.current) {
        audioSourceRef.current = ctx.createMediaElementSource(audioRef.current);
      }
      const source = audioSourceRef.current;
      
      source.disconnect();
      source.connect(analyser);
      analyser.disconnect();
      analyser.connect(ctx.destination);
      
      analyserRef.current = analyser;
      audioContextRef.current = ctx;
    } catch (err) {
      console.warn("Failed to initialize Web Audio API analyzer:", err);
    }
  };



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
  const isYouTubeMode = !!songData.videoId;

  // Manage YouTube player instance creation and destruction
  useEffect(() => {
    if (isYouTubeMode) {
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
                isTransitioningRef.current = false;
                setDuration(e.target.getDuration());
                // Fade in if the fader is at 0 or low
                if (faderRef.current < 0.1) {
                  fadeVolume(1, 800);
                }
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                // Ignore pause event during initial load transition
                if (!isTransitioningRef.current) {
                  setPlaying(false);
                }
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
        createYTPlayer();
      }
    }

    return () => {
      // Cancel active fade animations to prevent animation frame leaks
      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
        faderAnimationRef.current = null;
      }

      // Destroy YouTube player instance to release memory completely
      if (ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.destroy === 'function') {
            ytPlayerRef.current.destroy();
          }
        } catch (e) {
          console.warn("Failed to destroy YT Player on song change/unmount:", e);
        }
        ytPlayerRef.current = null;
      }
    };
  }, [isYouTubeMode]);

  // Load new video when videoId changes
  useEffect(() => {
    if (isYouTubeMode && songData.videoId) {
      isTransitioningRef.current = true;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        // Start at 0 volume and load track!
        faderRef.current = 0;
        try { ytPlayerRef.current.setVolume(0); } catch(e){}
        ytPlayerRef.current.loadVideoById(songData.videoId);
        setPlaying(true);
        ytPlayerRef.current.playVideo();
        fadeVolume(1, 800);
      }
    }
  }, [songData.videoId, isYouTubeMode]);

  // Manage local audio playback
  useEffect(() => {
    if (!isYouTubeMode && songData.audioUrl) {
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

    return () => {
      // Pause local audio and clear source to release hardware audio decoders/buffers
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.load();
        } catch (e) {}
      }
    };
  }, [isYouTubeMode, songData.audioUrl]);

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
        skipTime(5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-5);
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

  // Master Cleanup Effect for Component Unmount to prevent any background loops, intervals, or threads
  useEffect(() => {
    return () => {
      // Clear timers and animation frames to prevent CPU/memory leaks
      if (volumeHUDTimeoutRef.current) {
        clearTimeout(volumeHUDTimeoutRef.current);
      }
      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      
      // Disconnect local audio source node to free Web Audio memory
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch (e) {}
        audioSourceRef.current = null;
      }
      
      // Suspend global AudioContext to release system-level hardware audio threads
      if (globalAudioContext && globalAudioContext.state === 'running') {
        try {
          globalAudioContext.suspend();
        } catch (e) {}
      }
    };
  }, []);

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
        {/* Live WebGL Fluid Background with Dynamic Song Color Binding */}
        <FluidBackground 
          color1={dominantColors.primary} 
          color2={dominantColors.secondary} 
          color3={dominantColors.accent} 
          speedMultiplier={backgroundStyle === 'liquid' ? 1.4 : backgroundStyle === 'mesh' ? 0.8 : backgroundStyle === 'particles' ? 1.1 : 0.5}
        />


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
              opacity: 0.3,
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
              boxShadow: isPlaying 
                ? '0 40px 80px var(--theme-primary-shadow), 0 20px 40px var(--theme-secondary-shadow), 0 60px 120px rgba(0,0,0,0.65)'
                : '0 20px 40px var(--theme-primary-shadow-idle), 0 10px 20px var(--theme-secondary-shadow-idle), 0 30px 60px rgba(0,0,0,0.45)',
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
            {/* Current artwork (drawn behind previous artwork) */}
            <motion.img
              src={songData.artworkUrl}
              alt="Album artwork"
              onError={(e) => {
                e.currentTarget.onerror = null;
                const src = e.currentTarget.src;
                if (src.includes('maxresdefault.jpg')) {
                  e.currentTarget.src = src.replace('maxresdefault.jpg', 'mqdefault.jpg');
                } else if (songData.videoId) {
                  e.currentTarget.src = `https://img.youtube.com/vi/${songData.videoId}/mqdefault.jpg`;
                }
              }}
              className={`w-full h-full object-cover z-[1] ${songData.videoId ? 'scale-[1.35]' : ''}`}
              style={{
                filter: `blur(${imageBlur}px)`,
              }}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{
                opacity: isLoaded ? (isPlaying ? 1 : 0.8) : 0,
                scale: 1,
              }}
              transition={{
                opacity: { duration: 0.8, ease: "easeInOut" },
                scale: { duration: 0.8, ease: "easeInOut" },
              }}
            />

            {/* Previous artwork for crossfade (drawn on top with z-[2] to fade out smoothly and reveal current artwork underneath) */}
            {showPreviousArtwork && previousArtwork && (
              <motion.img
                src={previousArtwork}
                alt="Previous artwork"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  const src = e.currentTarget.src;
                  if (src.includes('maxresdefault.jpg')) {
                    e.currentTarget.src = src.replace('maxresdefault.jpg', 'mqdefault.jpg');
                  } else if (songData.videoId) {
                    e.currentTarget.src = `https://img.youtube.com/vi/${songData.videoId}/mqdefault.jpg`;
                  }
                }}
                className={`absolute inset-0 w-full h-full object-cover z-[2] ${songData.videoId ? 'scale-[1.35]' : ''}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: isLoaded ? 0 : 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            )}

            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />

            <PlayerControls
              songData={songData}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              waveformData={waveformData}
              isArtworkHovered={isArtworkHovered}
              tourType={tourType}
              currentStep={currentStep}
              handleSliderChange={handleSliderChange}
              handlePreviousSong={handlePreviousSong}
              handleNextSong={handleNextSong}
              togglePlayPause={togglePlayPause}
              formatTime={formatTime}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onAddToPlaylist={handleAddToPlaylist}
            />
          </div>
          </div>
          {/* END FRONT FACE */}

          <LyricsPanel
            showLyrics={showLyrics}
            lyrics={lyrics}
            isLoadingLyrics={isLoadingLyrics}
            isLyricsSynced={isLyricsSynced}
            currentLyricIndex={currentLyricIndex}
            seekToAbsoluteTime={seekToAbsoluteTime}
            setShowLyrics={setShowLyrics}
            theme={theme}
          />
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
