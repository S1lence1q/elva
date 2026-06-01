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
import { loadCustomLyrics } from '../utils/lyricsUtils';
import { showMiniHUD } from '../utils/hudUtils';
import { CustomLyricsModal } from './CustomLyricsModal';
import { SearchResult } from '../types';
import { usePlaybackCore } from '../hooks/usePlaybackCore';
import { useLyrics } from '../hooks/useLyrics';
import { usePlayStats } from '../hooks/usePlayStats';

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
  onSelectFromQueue?: (id: string, isCrossfade?: boolean) => void;
  onAddToQueue?: (song: SearchResult) => void;
  onSelectSong?: (song: SearchResult) => void;
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  onReorderQueue?: (newIds: string[]) => void;
  onQueueFileSelect?: (file: File) => void;
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
  appState?: string;
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
  onReorderQueue,
  onQueueFileSelect,
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
  onPlayingStateChange,
  appState = 'ready'
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

  const {
    isPlaying,
    isPlayingRef,
    currentTime,
    duration,
    setDuration,
    volume,
    preMuteVolume,
    setPreMuteVolume,
    audioRefA,
    audioRefB,
    activeEngine,
    fadeVolume,
    togglePlayPause,
    handleNextSong,
    handlePreviousSong,
    handleSliderChange,
    handleVolumeChange,
    skipTime,
    seekToAbsoluteTime,
    formatTime,
    waveformData,
    setPlaying,
    analyserRef
  } = usePlaybackCore({
    songData,
    queue: queue.map((item) => ({ 
      id: item.id, 
      videoId: item.videoId, 
      audioUrl: item.audioUrl, 
      title: item.title, 
      artist: item.artist, 
      thumbnail: item.thumbnail 
    })),
    onSelectFromQueue,
    onPlayingStateChange,
  });

  usePlayStats(songData, isPlaying);

  const {
    showLyrics,
    setShowLyrics,
    lyrics,
    isLoadingLyrics,
    currentLyricIndex,
    isLyricsSynced,
    isLyricsModalOpen,
    setIsLyricsModalOpen,
    handleLyricsReload,
  } = useLyrics(songData, currentTime);

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
  // Tracks the URL currently visible on screen so we can snapshot it as the outgoing
  // image when a new song loads — must be a ref to avoid stale closure issues.
  const lastDisplayedArtworkRef = useRef<string | null>(songData.artworkUrl);
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
    const oldArtwork = lastDisplayedArtworkRef.current;

    // Only crossfade if the artwork actually changed
    if (oldArtwork && oldArtwork !== songData.artworkUrl) {
      // Snapshot the OLD artwork as the outgoing layer before anything changes
      setPreviousArtwork(oldArtwork);
      setShowPreviousArtwork(true);
    }

    // Update ref to the incoming artwork so next song change knows what to fade from
    lastDisplayedArtworkRef.current = songData.artworkUrl;

    setIsLoaded(false);
    setIsLoadingNewSong(true);

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
        setTimeout(() => setShowPreviousArtwork(false), 1000);
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
  }, [
    volume,
    preMuteVolume,
    togglePlayPause,
    skipTime,
    handleVolumeChange,
    setPreMuteVolume,
    setShowLyrics,
    setShowSettings,
  ]);

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
          className="text-xl font-normal text-white/30 hover:text-white/50 tracking-wider transition-colors cursor-pointer"
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
                onFileSelect={onQueueFileSelect || onFileSelect}
                onUrlSubmit={onUrlSubmit}
                onReorder={onReorderQueue}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden Media Players */}
      <div className="w-0 h-0 overflow-hidden absolute pointer-events-none" style={{ opacity: 0 }}>
        <div key="container-A-parent">
          <div id="yt-player-container-A" key="yt-player-container-A" />
        </div>
        <div key="container-B-parent">
          <div id="yt-player-container-B" key="yt-player-container-B" />
        </div>
      </div>
      <audio 
        ref={audioRefA} 
        onLoadedMetadata={(e) => {
          if (activeEngine === 'A') setDuration(e.currentTarget.duration);
        }}
        onEnded={() => {
          if (activeEngine === 'A') handleNextSong();
        }}
        className="hidden" 
      />
      <audio 
        ref={audioRefB} 
        onLoadedMetadata={(e) => {
          if (activeEngine === 'B') setDuration(e.currentTarget.duration);
        }}
        onEnded={() => {
          if (activeEngine === 'B') handleNextSong();
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
              const target = e.target as HTMLElement;
              if (
                target.closest('button') || 
                target.closest('input') || 
                target.closest('[role="slider"]') || 
                target.closest('.group\\/slider')
              ) {
                return;
              }
              if (e.button === 0) {
                togglePlayPause();
              }
            }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest('button') || 
                target.closest('input') || 
                target.closest('[role="slider"]') || 
                target.closest('.group\\/slider')
              ) {
                return;
              }
              togglePlayPause();
            }}
          >
            {/* Incoming artwork: fades in while sharpening from blur — no scale change */}
            <motion.img
              key={songData.artworkUrl}
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
              initial={{ opacity: 0, filter: 'blur(16px)' }}
              animate={{
                opacity: isLoaded ? (isPlaying ? 1 : 0.8) : 0,
                filter: isLoaded ? 'blur(0px)' : 'blur(16px)',
              }}
              transition={{
                opacity: { duration: 0.85, ease: 'easeOut' },
                filter: { duration: 0.95, ease: 'easeOut' },
              }}
            />

            {/* Outgoing artwork: sits on top and fades out while new one sharpens beneath */}
            {showPreviousArtwork && previousArtwork && (
              <motion.img
                key={`prev-${previousArtwork}`}
                src={previousArtwork}
                alt="Previous artwork"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  const src = e.currentTarget.src;
                  if (src.includes('maxresdefault.jpg')) {
                    e.currentTarget.src = src.replace('maxresdefault.jpg', 'mqdefault.jpg');
                  }
                }}
                className={`absolute inset-0 w-full h-full object-cover z-[2] ${songData.videoId ? 'scale-[1.35]' : ''}`}
                initial={{ opacity: 1, filter: 'blur(0px)' }}
                animate={{ opacity: isLoaded ? 0 : 1, filter: isLoaded ? 'blur(10px)' : 'blur(0px)' }}
                transition={{ duration: 0.85, ease: 'easeInOut' }}
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
                  showLyrics={showLyrics && appState === 'ready'}
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
            {showLyrics && isLargeScreen && appState === 'ready' && (
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
                  showLyrics={showLyrics && appState === 'ready'}
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
