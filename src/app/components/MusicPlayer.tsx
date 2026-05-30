import { useState, useEffect, useRef, useMemo } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { List, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Queue } from './Queue';
import { SettingsModal } from './SettingsModal';
import { LyricsPanel } from './LyricsPanel';
import { PlayerControls } from './PlayerControls';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { getDynamicFallbackColors } from '../utils/playerColorUtils';
import { parseLrc, loadCustomLyrics } from '../utils/lyricsUtils';
import { showMiniHUD } from '../utils/hudUtils';
import { CustomLyricsModal } from './CustomLyricsModal';
import { cleanSongTitle } from '../utils/stringUtils';
import { LyricLine, SearchResult } from '../types';

// Import newly extracted hooks
import { useFadeVolume } from '../hooks/useFadeVolume';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';

interface QueueItem {
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
    channelId?: string;
  };
  queue?: QueueItem[];
  onRemoveFromQueue?: (id: string) => void;
  onClearQueue?: () => void;
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
  onViewArtist?: (name: string, channelId?: string) => void;
  songColors?: { primary: string; secondary: string; accent: string } | null;
  enableCustomLyrics?: boolean;
  onEnableCustomLyricsChange?: (enable: boolean) => void;
  onPlayingStateChange?: (playing: boolean) => void;
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
  onClearQueue,
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
  onToggleFavorite,
  onViewArtist,
  songColors,
  enableCustomLyrics = false,
  onEnableCustomLyricsChange,
  onPlayingStateChange
}: MusicPlayerProps) {
  const theme = ACCENT_THEMES[accentColor];

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
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('elva_player_volume');
    return saved !== null ? parseInt(saved, 10) : 70;
  });
  const [preMuteVolume, setPreMuteVolume] = useState<number>(() => {
    const saved = localStorage.getItem('elva_player_premute_volume');
    return saved !== null ? parseInt(saved, 10) : 70;
  });

  useEffect(() => {
    localStorage.setItem('elva_player_volume', String(volume));
    if (volume > 0) {
      localStorage.setItem('elva_player_premute_volume', String(volume));
    }
  }, [volume]);

  useEffect(() => {
    onPlayingStateChange?.(isPlaying);
  }, [isPlaying, onPlayingStateChange]);

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

  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const handleNextSongRef = useRef<() => Promise<void>>(async () => {});

  // 1. Volume Fader Hook
  const { fadeVolume, faderRef, faderAnimationRef, fadeResolveRef, isFadingOutRef } = useFadeVolume({
    volumeRef,
    ytPlayerRef,
    audioRef,
    videoId: songData.videoId
  });

  const isTogglingPlayPauseRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

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

  const isYouTubeMode = !!songData.videoId;

  // 2. HTML5 Audio Player Hook
  useAudioPlayer({
    audioUrl: songData.audioUrl,
    isYouTubeMode,
    isPlaying,
    setPlaying,
    setDuration,
    fadeVolume,
    faderRef,
    handleNextSong: () => handleNextSong(),
    initAudioAnalyzer,
    audioRef,
    isTransitioningRef,
    audioContextRef
  });

  // 3. YouTube Player Hook
  useYouTubePlayer({
    videoId: songData.videoId,
    isYouTubeMode,
    isPlaying,
    isPlayingRef,
    setPlaying,
    setDuration,
    fadeVolume,
    faderRef,
    handleNextSongRef,
    isTransitioningRef,
    ytPlayerRef,
    faderAnimationRef,
    audioRef
  });

  // Automatic play-count & listening-time tracker
  useEffect(() => {
    if (!isPlaying) return;
    
    let playTimer = setTimeout(() => {
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
          dayStat.min += 3;
        } else {
          stats.push({ day: currentDayName, min: 3 });
        }
        localStorage.setItem('elva_weekly_time', JSON.stringify(stats));

        window.dispatchEvent(new Event('elva-stats-updated'));
      } catch (e) {
        console.warn('Failed to update stats in localStorage:', e);
      }
    }, 15000);

    return () => clearTimeout(playTimer);
  }, [songData.videoId, songData.audioUrl, isPlaying]);

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
        
        if (playlist.tracks.some((t: any) => t.id === currentTrack.id)) {
          showMiniHUD('Already in this playlist', 'info');
          return;
        }
        
        playlist.tracks.push(currentTrack);
        localStorage.setItem('elva_playlists', JSON.stringify(plist));
        
        window.dispatchEvent(new Event('elva-playlists-updated'));
        showMiniHUD(`Added to ${playlist.name}`, 'success');
      }
    } catch (e) {
      console.warn('Failed to add track to playlist:', e);
    }
  };

  const [showSettings, setShowSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingNewSong, setIsLoadingNewSong] = useState(false);
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [imageBlur, setImageBlur] = useState(20);
  const [previousArtwork, setPreviousArtwork] = useState<string | null>(null);
  const [showPreviousArtwork, setShowPreviousArtwork] = useState(false);
  const [dominantColors, setDominantColors] = useState(() => songColors || getDynamicFallbackColors(songData.title || '', songData.artist || ''));
  const [targetColors, setTargetColors] = useState(() => songColors || getDynamicFallbackColors(songData.title || '', songData.artist || ''));
  const extractedColors = songColors || getDynamicFallbackColors(songData.title || '', songData.artist || '');

  useEffect(() => {
    if (themePreset === 'dynamic') {
      setTargetColors(extractedColors);
    } else {
      setTargetColors(THEME_PRESETS[themePreset]);
    }
  }, [themePreset, extractedColors]);

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
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [lyricsVersion, setLyricsVersion] = useState(0);

  const handleLyricsReload = () => {
    setLyricsVersion(prev => prev + 1);
  };

  useEffect(() => {
    if (lyrics.length === 0 || !isLyricsSynced) return;
    let activeIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time - 0.5) {
        activeIndex = i;
      } else {
        break;
      }
    }
    setCurrentLyricIndex(activeIndex);
  }, [currentTime, lyrics, isLyricsSynced]);

  useEffect(() => {
    if (!songData.title) return;
    
    let isMounted = true;
    const fetchLyricsData = async () => {
      setIsLoadingLyrics(true);
      setLyrics([]);
      setCurrentLyricIndex(-1);
      setIsLyricsSynced(false);

      const custom = loadCustomLyrics(songData.videoId, songData.title, songData.artist);
      if (custom) {
        if (isMounted) {
          setLyrics(custom.lyrics);
          setIsLyricsSynced(custom.isSynced);
          setIsLoadingLyrics(false);
        }
        return;
      }

      if (songData.audioUrl?.startsWith('blob:') || songData.artist === 'Unknown Artist') {
        if (isMounted) {
          setLyrics([]);
          setIsLyricsSynced(false);
          setIsLoadingLyrics(false);
        }
        return;
      }

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
  }, [songData.title, songData.artist, songData.videoId, lyricsVersion]);

  // Zen Mode Idle Tracker
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
      }, 3000);
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

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [2, -2]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-2, 2]), { stiffness: 150, damping: 20 });

  const waveformData = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const pattern = Math.sin(i * 0.3) * 0.4 + Math.random() * 0.3 + 0.3;
      return Math.min(1, Math.max(0.15, pattern));
    });
  }, []);

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

  useEffect(() => {
    setDominantColors(targetColors);
  }, [targetColors]);

  useEffect(() => {
    if (songData.artworkUrl !== previousArtwork) {
      setPreviousArtwork(songData.artworkUrl);
      setShowPreviousArtwork(true);
    }

    setIsLoaded(false);
    setIsLoadingNewSong(true);
    setImageBlur(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    if (songData.artworkUrl && (songData.artworkUrl.includes('ytimg.com') || songData.artworkUrl.includes('youtube.com') || songData.artworkUrl.startsWith('http'))) {
      img.src = `https://images.weserv.nl/?url=${encodeURIComponent(songData.artworkUrl)}`;
    } else {
      img.src = songData.artworkUrl;
    }

    img.onload = () => {
      setTimeout(() => {
        setIsLoadingNewSong(false);
        setIsLoaded(true);
        setTimeout(() => setShowPreviousArtwork(false), 800);
      }, 50);
    };

    img.onerror = () => {
      if (img.src.includes('maxresdefault.jpg')) {
        const fallbackUrl = songData.artworkUrl.replace('maxresdefault.jpg', 'hqdefault.jpg');
        if (fallbackUrl && (fallbackUrl.includes('ytimg.com') || fallbackUrl.includes('youtube.com') || fallbackUrl.startsWith('http'))) {
          img.src = `https://images.weserv.nl/?url=${encodeURIComponent(fallbackUrl)}`;
        } else {
          img.src = fallbackUrl;
        }
        return;
      }

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

  // Sync isPlaying state to players
  useEffect(() => {
    if (isTogglingPlayPauseRef.current || isTransitioningRef.current || isFadingOutRef.current) {
      return;
    }

    if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
      if (isPlaying) {
        faderRef.current = 0;
        try { ytPlayerRef.current.setVolume(0); } catch (e) {}
        ytPlayerRef.current.playVideo();
        fadeVolume(1, 400);
      } else {
        ytPlayerRef.current.pauseVideo();
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        faderRef.current = 0;
        audioRef.current.volume = 0;
        initAudioAnalyzer();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play()
          .then(() => {
            fadeVolume(1, 400);
          })
          .catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Media Session API Integration
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: songData.title,
      artist: songData.artist,
      artwork: songData.artworkUrl
        ? [{ src: songData.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlayingRef.current) {
        togglePlayPause();
      }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlayingRef.current) {
        togglePlayPause();
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

  // Progress timer
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

  const togglePlayPause = async () => {
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 250) {
      return;
    }
    lastToggleTimeRef.current = now;
    isTogglingPlayPauseRef.current = true;

    try {
      const nextPlaying = !isPlaying;
      if (currentTime >= duration && duration > 0) {
        setCurrentTime(0);
        if (songData.videoId && ytPlayerRef.current) ytPlayerRef.current.seekTo(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
      }

      if (nextPlaying) {
        setPlaying(true);
        faderRef.current = 0;
        if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.setVolume) {
          try { ytPlayerRef.current.setVolume(0); } catch (e){}
        }
        if (audioRef.current) {
          audioRef.current.volume = 0;
        }

        if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
          try { ytPlayerRef.current.playVideo(); } catch (e) {}
        } else if (audioRef.current) {
          initAudioAnalyzer();
          if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
          audioRef.current.play().catch(console.error);
        }
        
        await fadeVolume(1, 400);
      } else {
        isFadingOutRef.current = true;
        setPlaying(false);

        await fadeVolume(0, 300);

        if (!isPlayingRef.current) {
          if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
            try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
          } else if (audioRef.current) {
            audioRef.current.pause();
          }
        }
        isFadingOutRef.current = false;
      }
    } finally {
      isTogglingPlayPauseRef.current = false;
    }
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
    const nearEnd = duration > 0 && currentTime >= duration - 0.8;
    const shouldFade = isPlaying && !nearEnd;

    if (queue.length === 0) {
      if (shouldFade) {
        await fadeVolume(0, 400);
      }
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
      faderRef.current = 1;
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
    
    if (shouldFade) {
      await fadeVolume(0, 400);
    }
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
    const shouldFade = isPlaying;

    if (queue.length === 0) {
      if (shouldFade) {
        await fadeVolume(0, 400);
      }
      skipTime(-currentTime);
      if (shouldFade) {
        await fadeVolume(1, 400);
      }
      return;
    }
    if (currentTime > 3) {
      if (shouldFade) {
        await fadeVolume(0, 400);
      }
      skipTime(-currentTime);
      if (shouldFade) {
        await fadeVolume(1, 400);
      }
      return;
    }
    
    if (shouldFade) {
      await fadeVolume(0, 400);
    }
    const currentIndex = queue.findIndex(item => item.videoId === songData.videoId);
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    const prevSong = queue[prevIndex];
    if (prevSong && onSelectFromQueue) {
      onSelectFromQueue(prevSong.id);
    }
  };

  useEffect(() => {
    const handleTogglePlayEvent = () => {
      togglePlayPause();
    };
    const handleNextSongEvent = () => {
      handleNextSong();
    };
    const handlePrevSongEvent = () => {
      handlePreviousSong();
    };

    window.addEventListener('elva-toggle-play', handleTogglePlayEvent);
    window.addEventListener('elva-play-next', handleNextSongEvent);
    window.addEventListener('elva-play-prev', handlePrevSongEvent);

    return () => {
      window.removeEventListener('elva-toggle-play', handleTogglePlayEvent);
      window.removeEventListener('elva-play-next', handleNextSongEvent);
      window.removeEventListener('elva-play-prev', handlePrevSongEvent);
    };
  }, [togglePlayPause, handleNextSong, handlePreviousSong]);

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

    if (faderAnimationRef.current) {
      cancelAnimationFrame(faderAnimationRef.current);
      faderAnimationRef.current = null;
    }
    if (fadeResolveRef.current) {
      fadeResolveRef.current();
      fadeResolveRef.current = null;
    }
    faderRef.current = 1;

    if (songData.videoId && ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(newVol);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol / 100;
    }

    window.dispatchEvent(new CustomEvent('elva-volume-change', { detail: { volume: newVol } }));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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

  // Master teardown unmount cleanup
  useEffect(() => {
    return () => {
      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
      }
      if (fadeResolveRef.current) {
        fadeResolveRef.current();
        fadeResolveRef.current = null;
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch (e) {}
        audioSourceRef.current = null;
      }
      
      if (globalAudioContext && globalAudioContext.state === 'running') {
        try {
          globalAudioContext.suspend();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div 
      className={`size-full relative overflow-hidden bg-transparent flex items-center justify-center transition-all bg-transition ${isUserIdle && zenMode ? 'cursor-none' : ''}`}
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

      {/* Dedicated Overlay Container */}
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
                enableCustomLyrics={enableCustomLyrics}
                onEnableCustomLyricsChange={onEnableCustomLyricsChange}
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
                  thumbnail: item.thumbnail,
                  videoId: item.videoId
                }))}
                currentSongId={songData.videoId}
                accentColor={accentColor}
                onRemove={onRemoveFromQueue || (() => {})}
                onClearQueue={onClearQueue}
                onSelect={async (id) => {
                  if (isPlayingRef.current) {
                    await fadeVolume(0, 400);
                  }
                  if (onSelectFromQueue) onSelectFromQueue(id);
                }}
                onClose={() => setShowQueue(false)}
                focusSearchOnMount={focusSearchInQueue}
                onSearch={onSearch}
                onFetchChannelUploads={onFetchChannelUploads}
                onAddToQueue={onAddToQueue}
                onSelectSong={async (song) => {
                  if (isPlayingRef.current) {
                    await fadeVolume(0, 400);
                  }
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

      <motion.div
        initial={{ opacity: 0, x: 0 }}
        animate={{ 
          opacity: 1,
          x: showQueue && isLargeScreen ? -230 : 0
        }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.2, ease: "easeOut" },
          x: { type: 'spring', stiffness: 350, damping: 32 }
        }}
        className="relative z-10 flex flex-col items-center px-8 w-full"
        style={{ maxWidth: 1152 }}
      >
        <div className={isLargeScreen ? 'relative w-full h-[550px] flex items-center justify-center' : 'flex flex-col items-center justify-center w-full'}>
          {/* Stacked Artwork Card */}
          <motion.div 
            animate={{
              x: showLyrics && isLargeScreen ? -284 : 0,
            }}
            transition={{ type: 'spring', stiffness: 180, damping: 25 }}
            className="flex flex-col items-center w-[520px] shrink-0 group/artwork"
            style={{
              position: isLargeScreen ? 'absolute' : 'relative',
              left: isLargeScreen ? 'calc(50% - 260px)' : 'auto',
              top: isLargeScreen ? 0 : 'auto',
              width: 520,
              height: 520,
            }}
          >
            <div
              id="artwork-card"
              ref={artworkRef}
              className="relative cursor-pointer w-[520px] h-[520px]"
              style={{ perspective: 1200 }}
            >
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: showLyrics && !isLargeScreen ? 180 : 0 }}
                transition={{ rotateY: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } }}
                style={{ transformStyle: 'preserve-3d' }}
              >
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
                className={`absolute inset-0 w-full h-full ${showLyrics && !isLargeScreen ? 'pointer-events-none' : ''}`} 
                style={{ 
                  backfaceVisibility: 'hidden',
                  visibility: showLyrics && !isLargeScreen ? 'hidden' : 'visible'
                }}
              >
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

          {/* Ambient glow layers */}
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

          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-60 pointer-events-none" />

          {/* Album artwork card */}
          <div
            className="relative rounded-3xl overflow-hidden transition-all duration-500 w-full h-full cursor-pointer"
            style={{
              boxShadow: isPlaying 
                ? '0 30px 60px rgba(0,0,0,0.75), 0 10px 30px var(--theme-primary-fade), 0 5px 15px var(--theme-secondary-fade)'
                : '0 15px 35px rgba(0,0,0,0.5), 0 5px 15px var(--theme-primary-fade)',
              isolation: 'isolate'
            }}
            onPointerDown={(e) => {
              if (e.button === 0) {
                togglePlayPause();
              }
            }}
            onClick={() => {
              togglePlayPause();
            }}
          >
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
              onViewArtist={onViewArtist}
            />
          </div>
              </div>

              {!isLargeScreen && (
                <LyricsPanel
                  showLyrics={showLyrics}
                  lyrics={lyrics}
                  isLoadingLyrics={isLoadingLyrics}
                  isLyricsSynced={isLyricsSynced}
                  currentLyricIndex={currentLyricIndex}
                  seekToAbsoluteTime={seekToAbsoluteTime}
                  setShowLyrics={setShowLyrics}
                  theme={theme}
                  onOpenUploadModal={() => setIsLyricsModalOpen(true)}
                  hasCustomLyrics={loadCustomLyrics(songData.videoId, songData.title, songData.artist) !== null}
                  enableCustomLyrics={enableCustomLyrics}
                />
              )}
            </motion.div>
          </motion.div>
            </div>
          </motion.div>

          {/* Side-by-Side Lyrics Panel */}
          <AnimatePresence>
            {showLyrics && isLargeScreen && (
              <motion.div
                initial={{ opacity: 0, x: 180 }}
                animate={{ opacity: 1, x: 284 }}
                exit={{ opacity: 0, x: 180 }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="w-[520px] h-[520px] absolute shrink-0"
                style={{
                  position: 'absolute',
                  left: 'calc(50% - 260px)',
                  top: 0,
                }}
              >
                <LyricsPanel
                  showLyrics={showLyrics}
                  lyrics={lyrics}
                  isLoadingLyrics={isLoadingLyrics}
                  isLyricsSynced={isLyricsSynced}
                  currentLyricIndex={currentLyricIndex}
                  seekToAbsoluteTime={seekToAbsoluteTime}
                  setShowLyrics={setShowLyrics}
                  theme={theme}
                  isSideBySide={true}
                  onOpenUploadModal={() => setIsLyricsModalOpen(true)}
                  hasCustomLyrics={loadCustomLyrics(songData.videoId, songData.title, songData.artist) !== null}
                  enableCustomLyrics={enableCustomLyrics}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ 
            opacity: isUserIdle && zenMode ? 0 : 1,
            x: showLyrics && isLargeScreen ? -284 : 0
          }}
          transition={{ 
            opacity: { duration: 0.7 },
            x: { type: 'spring', stiffness: 180, damping: 25 }
          }}
          className={`mt-8 flex items-center justify-center gap-3 ${isUserIdle && zenMode ? 'pointer-events-none' : ''}`}
        >
          <div className="flex items-center rounded-full bg-black/35 border border-white/12 overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
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

            <div className="h-5 w-[1px] bg-white/10 shrink-0" />

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

      <CustomLyricsModal
        isOpen={isLyricsModalOpen}
        onClose={() => setIsLyricsModalOpen(false)}
        song={songData}
        songDuration={duration}
        accentColor={accentColor}
        onLyricsSaved={handleLyricsReload}
      />
    </div>
  );
}
