import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import 'sonner/dist/styles.css';
import { SkipBack, Play, Pause, SkipForward, X, Volume, Volume1, Volume2, VolumeX } from 'lucide-react';

import { MusicPlayer } from './components/MusicPlayer';
import { OnboardingTour } from './components/OnboardingTour';
import { AccentColor, ACCENT_THEMES } from './components/themeUtils';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FluidBackground } from './components/FluidBackground';
import { showMiniHUD } from './utils/hudUtils';
import { SearchResult, VerifiedArtist } from './types';
import { getDynamicFallbackColors, extractColorsFromImage } from './utils/playerColorUtils';
import { executeSearchAPI, executeChannelUploadsAPI } from './utils/apiUtils';
import { parseLocalMetadata } from './utils/metadataParser';

// Import newly extracted hooks and components
import { useScrollTracking } from './hooks/useScrollTracking';
import { useBackgroundColors } from './hooks/useBackgroundColors';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSearchLogic } from './hooks/useSearchLogic';
import { LandingPage } from './components/LandingPage';
import { Playlist } from './components/PlaylistDetailsView';

type AppState = 'landing' | 'processing' | 'ready';

const accentBgs400: Record<AccentColor, string> = {
  emerald: 'bg-emerald-400',
  sand: 'bg-amber-400',
  wine: 'bg-rose-400',
  navy: 'bg-slate-400'
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [showSettings, setShowSettings] = useState(false);
  const [isMiniPlaying, setIsMiniPlaying] = useState(true);

  // Global Volume HUD state
  const [globalVolume, setGlobalVolume] = useState<number>(() => {
    const saved = localStorage.getItem('elva_player_volume');
    return saved !== null ? parseInt(saved, 10) : 70;
  });
  const [showGlobalVolumeHUD, setShowGlobalVolumeHUD] = useState(false);
  const globalVolumeHUDTimeoutRef = useRef<any>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Scroll Tracking Hook
  const { scrollProgress, scrollVelocity, handleScroll } = useScrollTracking(scrollContainerRef);

  const [favorites, setFavorites] = useState<SearchResult[]>(() => {
    try {
      const stored = localStorage.getItem('elva_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isIntroActive, setIsIntroActive] = useState(() => {
    const hasSeenIntro = sessionStorage.getItem('elva_intro_seen');
    return !hasSeenIntro;
  });

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const [resolvedVideoIds, setResolvedVideoIds] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('elva_resolved_video_ids');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [queue, setQueue] = useState<SearchResult[]>([]);
  const [songData, setSongData] = useState<{
    title: string;
    artist: string;
    artworkUrl: string;
    audioUrl: string;
    videoId?: string;
    channelId?: string;
  } | null>(null);

  const backToHomeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [colorsSongData, setColorsSongData] = useState<any>(null);
  const colorsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [songColors, setSongColors] = useState<{ primary: string; secondary: string; accent: string } | null>(null);

  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);

  // Mini HUD state
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [hudType, setHudType] = useState<'success' | 'info' | 'error'>('success');

  // Lifted Settings States
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem('elva_accent_color') as AccentColor) || 'emerald';
  });

  const [textureStyle, setTextureStyle] = useState<'paper' | 'dots' | 'none'>(() => {
    return (localStorage.getItem('elva_texture_style') as 'paper' | 'dots' | 'none') || 'paper';
  });

  const [backgroundStyle, setBackgroundStyle] = useState<'default' | 'particles' | 'liquid' | 'mesh'>(() => {
    return (localStorage.getItem('elva_bg_style') as 'default' | 'particles' | 'liquid' | 'mesh') || 'mesh';
  });

  const [themePreset, setThemePreset] = useState<'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset'>(() => {
    return (localStorage.getItem('elva_theme_preset') as 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset') || 'dynamic';
  });

  const [zenMode, setZenMode] = useState(() => {
    return localStorage.getItem('elva_zen_mode') === 'true';
  });

  const [showVolumeSlider, setShowVolumeSlider] = useState(() => {
    return localStorage.getItem('elva_volume_slider') !== 'false';
  });

  const [enable3DTilt, setEnable3DTilt] = useState(() => {
    return localStorage.getItem('elva_3d_tilt') !== 'false';
  });

  const [showSettingsButton, setShowSettingsButton] = useState(() => {
    return localStorage.getItem('elva_show_settings_btn') === 'true';
  });

  const [enableCustomLyrics, setEnableCustomLyrics] = useState(() => {
    return localStorage.getItem('elva_enable_custom_lyrics') === 'true';
  });

  // Onboarding Tour State
  const [tourType, setTourType] = useState<'landing' | 'player' | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(() => localStorage.getItem('elva_tour_completed') === 'true');
  const [showShortcutMap, setShowShortcutMap] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<SearchResult[]>(() => {
    try {
      const stored = localStorage.getItem('elva_recently_played');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load recently played tracks:', e);
      return [];
    }
  });

  const isFirstVisit = useRef(!sessionStorage.getItem('elva_intro_seen')).current;
  const hasSelectedArtistOnce = useRef(false);

  // 2. Background Colors Hook
  const bgColors = useBackgroundColors(songColors, appState, colorsSongData, scrollProgress);

  // Global mouse position tracking for visual grid effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      containerRef.current.style.setProperty('--mouse-x', `${x}px`);
      containerRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const handleToggleFavorite = (song: SearchResult) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === song.id);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.id !== song.id);
        showMiniHUD('Removed from Favorites', 'info');
      } else {
        updated = [...prev, song];
        showMiniHUD('Added to Favorites', 'success');
      }
      localStorage.setItem('elva_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const saveRecentlyPlayed = (song: SearchResult) => {
    try {
      const stored = localStorage.getItem('elva_recently_played');
      let list: SearchResult[] = stored ? JSON.parse(stored) : [];
      list = list.filter(item => item.id !== song.id);
      list.unshift(song);
      if (list.length > 10) {
        list = list.slice(0, 10);
      }
      localStorage.setItem('elva_recently_played', JSON.stringify(list));
      setRecentlyPlayed(list);
    } catch (e) {
      console.warn('Failed to save recently played track:', e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAppState('processing');
    const meta = await parseLocalMetadata(file);

    setTimeout(() => {
      setSongData({
        title: meta.title,
        artist: meta.artist,
        artworkUrl: meta.artworkUrl,
        audioUrl: URL.createObjectURL(file)
      });
      setAppState('ready');
      if (tourType !== null && tourStep === 0) {
        setTourStep(1);
      }
    }, 1200);
  };

  const handleSelectSong = async (result: SearchResult) => {
    const isLocal = !!(result.audioUrl?.startsWith('blob:') || result.id?.startsWith('local_'));
    let finalVideoId = isLocal ? '' : (result.videoId || resolvedVideoIds[result.id]);
    let finalArtwork = result.thumbnail || 'https://images.unsplash.com/photo-1676068368612-1c8b3e2afed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjBhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3ODk2NjA3OHww&ixlib=rb-4.1.0&q=80&w=1080';

    if (!isLocal && !finalVideoId) {
      setLoadingSongId(result.id);
      setAppState('processing');
      try {
        const query = `${result.artist} ${result.title} audio`;
        const resolved = await executeSearchAPI(query, 5);
        if (resolved && resolved.length > 0) {
          finalVideoId = resolved[0].videoId;
          
          setResolvedVideoIds(prev => {
            const next = { ...prev, [result.id]: finalVideoId };
            localStorage.setItem('elva_resolved_video_ids', JSON.stringify(next));
            return next;
          });

          if (!result.thumbnail) {
            finalArtwork = resolved[0].thumbnail || finalArtwork;
          }
        } else {
          toast.error("Could not play song", {
            description: "No audio stream was found on YouTube."
          });
          setLoadingSongId(null);
          setAppState('landing');
          return;
        }
      } catch (e) {
        console.error("Failed to dynamically resolve YouTube video ID:", e);
        toast.error("Playback error", {
          description: "Could not retrieve the audio stream for this song."
        });
        setLoadingSongId(null);
        setAppState('landing');
        return;
      }
    }

    saveRecentlyPlayed({
      ...result,
      videoId: finalVideoId,
      thumbnail: finalArtwork
    });

    const fallbacks = getDynamicFallbackColors(result.title, result.artist);
    setSongColors({
      primary: fallbacks.primary,
      secondary: fallbacks.secondary,
      accent: fallbacks.accent
    });

    if (appState === 'ready') {
      setSongData({
        title: result.title,
        artist: result.artist,
        artworkUrl: finalArtwork,
        audioUrl: isLocal ? (result.audioUrl || '') : `https://www.youtube.com/watch?v=${finalVideoId}`,
        videoId: finalVideoId,
        channelId: result.channelId
      });
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      if (finalArtwork && (finalArtwork.includes('ytimg.com') || finalArtwork.includes('youtube.com') || finalArtwork.startsWith('http'))) {
        img.src = `https://images.weserv.nl/?url=${encodeURIComponent(finalArtwork)}`;
      } else {
        img.src = finalArtwork;
      }
      img.onload = () => {
        const extracted = extractColorsFromImage(img, result.title, result.artist);
        setSongColors(extracted);
      };

      if (tourType !== null && tourStep === 0) {
        setTourStep(1);
      }
      return;
    }

    setLoadingSongId(result.id);
    setAppState('processing');

    const startTime = Date.now();
    const minDisplayTime = 1200;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    if (finalArtwork && (finalArtwork.includes('ytimg.com') || finalArtwork.includes('youtube.com') || finalArtwork.startsWith('http'))) {
      img.src = `https://images.weserv.nl/?url=${encodeURIComponent(finalArtwork)}`;
    } else {
      img.src = finalArtwork;
    }

    const proceedToReady = () => {
      const extracted = extractColorsFromImage(img, result.title, result.artist);
      setSongColors(extracted);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      setTimeout(() => {
        setSongData({
          title: result.title,
          artist: result.artist,
          artworkUrl: finalArtwork,
          audioUrl: isLocal ? (result.audioUrl || '') : `https://www.youtube.com/watch?v=${finalVideoId}`,
          videoId: finalVideoId,
          channelId: result.channelId
        });
        setAppState('ready');
        setLoadingSongId(null);
        if (tourType !== null && tourStep === 0) {
          setTourStep(1);
        }
      }, remainingTime);
    };

    img.onload = proceedToReady;
    img.onerror = proceedToReady;
  };

  // 3. Search and Artist Profiles Logic Hook
  const searchLogic = useSearchLogic({
    setAppState,
    setSongData,
    setColorsSongData,
    setQueue,
    saveRecentlyPlayed,
    handleSelectSong,
    appState,
    songData,
    tourType,
    tourStep,
    setTourStep
  });

  // Share select state back with hoisting reference
  const verifiedArtist = searchLogic.verifiedArtist;
  const selectedArtist = searchLogic.selectedArtist;
  const artistTracks = searchLogic.artistTracks;
  const isLoadingArtist = searchLogic.isLoadingArtist;
  const focusedResultIndex = searchLogic.focusedResultIndex;
  const setFocusedResultIndex = searchLogic.setFocusedResultIndex;

  // Track search interactions to trigger guide variations
  if (selectedArtist) {
    hasSelectedArtistOnce.current = true;
  }

  // 4. Keyboard Navigation Hook
  useKeyboardShortcuts({
    appState,
    searchQuery: searchLogic.searchQuery,
    isSearching: searchLogic.isSearching,
    searchResults: searchLogic.searchResults,
    selectedArtist,
    artistTracks,
    verifiedArtist,
    loadingSongId,
    focusedResultIndex,
    setFocusedResultIndex,
    handleSelectSong,
    handleViewArtistProfile: searchLogic.handleViewArtistProfile,
    showShortcutMap,
    setShowShortcutMap,
    showSettings,
    setShowSettings
  });

  // Global custom HUD event listeners
  useEffect(() => {
    const handleShowHUD = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setHudMessage(customEvent.detail.message);
        setHudType(customEvent.detail.type || 'success');
      }
    };
    window.addEventListener('elva-show-hud', handleShowHUD);
    return () => window.removeEventListener('elva-show-hud', handleShowHUD);
  }, []);

  useEffect(() => {
    const handleScrollToHub = () => {
      setAppState('landing');
      searchLogic.setSelectedArtist(null);
      setSelectedPlaylist(null);
      
      setTimeout(() => {
        const container = scrollContainerRef.current;
        if (container) {
          container.scrollTo({
            top: 2 * container.clientHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
    };
    window.addEventListener('elva-scroll-to-hub', handleScrollToHub);
    return () => window.removeEventListener('elva-scroll-to-hub', handleScrollToHub);
  }, [searchLogic]);

  useEffect(() => {
    if (hudMessage) {
      const timer = setTimeout(() => {
        setHudMessage(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [hudMessage]);

  useEffect(() => {
    const handleResetTour = () => {
      setHasSeenTour(false);
      localStorage.removeItem('elva_tour_completed');
      localStorage.removeItem('elva_player_tour_completed');
    };

    window.addEventListener('elva-reset-tour', handleResetTour);
    return () => window.removeEventListener('elva-reset-tour', handleResetTour);
  }, []);

  useEffect(() => {
    const handleGlobalVolumeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ volume: number }>;
      const newVol = customEvent.detail.volume;
      setGlobalVolume(newVol);

      if (globalVolumeHUDTimeoutRef.current) {
        clearTimeout(globalVolumeHUDTimeoutRef.current);
      }
      setShowGlobalVolumeHUD(true);
      globalVolumeHUDTimeoutRef.current = setTimeout(() => {
        setShowGlobalVolumeHUD(false);
      }, 1500);
    };

    window.addEventListener('elva-volume-change', handleGlobalVolumeChange);
    return () => {
      window.removeEventListener('elva-volume-change', handleGlobalVolumeChange);
      if (globalVolumeHUDTimeoutRef.current) {
        clearTimeout(globalVolumeHUDTimeoutRef.current);
      }
    };
  }, []);

  const startTour = () => {
    localStorage.removeItem('elva_tour_completed');
    localStorage.removeItem('elva_player_tour_completed');
    setHasSeenTour(false);
    setTourType('landing');
    setTourStep(0);
  };

  const dismissTour = () => {
    localStorage.setItem('elva_tour_completed', 'true');
    localStorage.setItem('elva_player_tour_completed', 'true');
    setHasSeenTour(true);
  };

  const handleTourNext = () => {
    if (tourStep === 0) {
      setSongData({
        title: 'Overleve',
        artist: 'Ukendt Kunstner',
        artworkUrl: 'https://img.youtube.com/vi/P5UWjgb-YaY/maxresdefault.jpg',
        audioUrl: 'https://www.youtube.com/watch?v=P5UWjgb-YaY',
        videoId: 'P5UWjgb-YaY',
      });
      setAppState('ready');
      setTourStep(1);
    } else if (tourStep === 1) {
      setTourStep(2);
    } else if (tourStep === 2) {
      setTourType(null);
      setTourStep(0);
      localStorage.setItem('elva_tour_completed', 'true');
      setHasSeenTour(true);
      toast.success('Tour completed!', {
        description: 'Enjoy exploring the immersive player!',
      });
    }
  };

  const handleTourBack = () => {
    if (tourStep === 1) {
      setAppState('landing');
      setSongData(null);
      setTourStep(0);
    } else if (tourStep === 2) {
      setTourStep(1);
    }
  };

  const handleTourSkip = () => {
    localStorage.setItem('elva_tour_completed', 'true');
    setHasSeenTour(true);
    setTourType(null);
    setTourStep(0);
    if (songData?.title === 'Overleve') {
      setAppState('landing');
      setSongData(null);
    }
  };

  // Intro sequence logic
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('elva_intro_seen');
    if (hasSeenIntro) {
      setIsIntroActive(false);
      setAppState('landing');
    } else {
      sessionStorage.setItem('elva_intro_seen', 'true');
      setIsIntroActive(true);
      setAppState('landing');
      const timer = setTimeout(() => {
        setIsIntroActive(false);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Clear transition timer when playing new songs
  useEffect(() => {
    if (appState === 'ready' || appState === 'processing') {
      if (backToHomeTimeoutRef.current) {
        clearTimeout(backToHomeTimeoutRef.current);
        backToHomeTimeoutRef.current = null;
      }
      if (colorsTimeoutRef.current) {
        clearTimeout(colorsTimeoutRef.current);
        colorsTimeoutRef.current = null;
      }
    }
  }, [appState]);

  useEffect(() => {
    if (songData) {
      setColorsSongData(songData);
      if (colorsTimeoutRef.current) {
        clearTimeout(colorsTimeoutRef.current);
        colorsTimeoutRef.current = null;
      }
    }
  }, [songData]);

  const handleAddToQueue = (result: SearchResult) => {
    if (queue.some(item => item.id === result.id)) {
      toast.error('Already in queue', {
        description: result.title,
      });
      return;
    }
    setQueue([...queue, result]);
    showMiniHUD('Added to queue', 'success');
  };

  const handlePlayNext = (result: SearchResult) => {
    const cleanedQueue = queue.filter(item => item.id !== result.id);
    const currentIndex = songData 
      ? cleanedQueue.findIndex(item => item.id === (songData.videoId || songData.audioUrl))
      : -1;
    
    const newQueue = [...cleanedQueue];
    if (currentIndex >= 0) {
      newQueue.splice(currentIndex + 1, 0, result);
    } else {
      newQueue.unshift(result);
    }
    
    setQueue(newQueue);
    showMiniHUD('Will play next', 'success');
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleClearQueue = () => {
    setQueue([]);
    showMiniHUD('Queue cleared', 'info');
  };

  const handleSelectFromQueue = (id: string) => {
    const song = queue.find(item => item.id === id);
    if (song) handleSelectSong(song);
  };

  const handleReorderQueue = (newIds: string[]) => {
    const idMap = new Map(queue.map(item => [item.id, item]));
    const reordered = newIds
      .map(id => idMap.get(id))
      .filter((item): item is SearchResult => !!item);
    setQueue(reordered);
  };

  const handleQueueFileSelect = async (file: File) => {
    const meta = await parseLocalMetadata(file);
    const fileResult: SearchResult = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      title: meta.title,
      artist: meta.artist,
      thumbnail: meta.artworkUrl,
      audioUrl: URL.createObjectURL(file),
      videoId: ''
    };
    setQueue(prevQueue => [...prevQueue, fileResult]);
    showMiniHUD('Added file to queue', 'success');
  };

  const theme = ACCENT_THEMES[accentColor];

  return (
    <div ref={containerRef} className="size-full relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center">

      {/* Premium Multi-Color Ambient Background & Vector Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 overflow-hidden"
      >
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: 'center center'
          }} 
        />

        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `
              radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            backgroundPosition: 'center center',
            maskImage: 'radial-gradient(circle 240px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle 240px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)'
          }} 
        />

        <FluidBackground 
          color1={bgColors.c1} 
          color2={bgColors.c2} 
          color3={bgColors.c3} 
          speedMultiplier={
            (backgroundStyle === 'liquid' ? 1.4 : backgroundStyle === 'mesh' ? 0.8 : backgroundStyle === 'particles' ? 1.1 : 0.5) +
            Math.min(2.0, scrollVelocity * 15.0)
          }
        />

        <AnimatePresence>
          {(appState === 'ready' || appState === 'processing' || (appState === 'landing' && songData)) && (
            <motion.div
              key="global-ambient-dimmer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.0)_0%,rgba(7,7,10,0.48)_85%)] bg-black/8"
            />
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {appState === 'landing' && (
          <LandingPage
            isIntroActive={isIntroActive}
            scrollProgress={scrollProgress}
            scrollContainerRef={scrollContainerRef}
            onScroll={handleScroll}
            selectedArtist={selectedArtist}
            setSelectedArtist={searchLogic.setSelectedArtist}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={setSelectedPlaylist}
            accentColor={accentColor}
            theme={theme}
            hasSeenTour={hasSeenTour}
            tourType={tourType}
            startTour={startTour}
            isFirstVisit={isFirstVisit}
            hasSelectedArtistOnce={hasSelectedArtistOnce.current}
            searchQuery={searchLogic.searchQuery}
            setSearchQuery={searchLogic.setSearchQuery}
            lastSearchedQuery={searchLogic.lastSearchedQuery}
            isSearching={searchLogic.isSearching}
            searchResults={searchLogic.searchResults}
            recentArtists={searchLogic.recentArtists}
            recentlyPlayed={recentlyPlayed}
            verifiedArtist={verifiedArtist}
            focusedResultIndex={focusedResultIndex}
            loadingSongId={loadingSongId}
            artistColors={selectedArtist ? ACCENT_THEMES[accentColor] : null}
            artistTracks={artistTracks}
            isLoadingArtist={isLoadingArtist}
            favorites={favorites}
            handleSelectSong={handleSelectSong}
            handleAddToQueue={handleAddToQueue}
            handlePlayNext={handlePlayNext}
            handleToggleFavorite={handleToggleFavorite}
            handleViewArtistProfile={searchLogic.handleViewArtistProfile}
            handleViewArtistByName={searchLogic.handleViewArtistByName}
            handleUrlSubmit={searchLogic.handleUrlSubmit}
            handleFileSelect={handleFileSelect}
            handleSearch={searchLogic.handleSearch}
            setArtistTracks={searchLogic.setArtistTracks}
          />
        )}

        {appState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-transparent"
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border border-white/10"
                style={{ borderTopColor: 'rgba(255, 255, 255, 0.7)' }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.1 }}
              className="text-white text-xs tracking-[0.2em] uppercase font-light"
            >
              Loading
            </motion.p>
          </motion.div>
        )}

        {songData && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ 
              opacity: appState === 'ready' ? 1 : 0, 
              scale: appState === 'ready' ? 1 : 0.96,
              y: appState === 'ready' ? 0 : 40,
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="size-full absolute inset-0 z-20 pointer-events-auto"
            style={{ 
              pointerEvents: appState === 'ready' ? 'auto' : 'none',
              visibility: appState === 'ready' ? 'visible' : 'hidden'
            }}
          >
            <MusicPlayer
              songData={songData}
              queue={queue}
              accentColor={accentColor}
              songColors={songColors}
              onAccentColorChange={setAccentColor}
              onRemoveFromQueue={handleRemoveFromQueue}
              onClearQueue={handleClearQueue}
              onSelectFromQueue={handleSelectFromQueue}
              onAddToQueue={handleAddToQueue}
              onReorderQueue={handleReorderQueue}
              onQueueFileSelect={handleQueueFileSelect}
              onSelectSong={handleSelectSong}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSearch={executeSearchAPI}
              onFetchChannelUploads={executeChannelUploadsAPI}
              onViewArtist={searchLogic.handleViewArtistByName}
              tourType={tourType}
              currentStep={tourStep}
              textureStyle={textureStyle}
              onTextureStyleChange={setTextureStyle}
              backgroundStyle={backgroundStyle}
              onBackgroundStyleChange={setBackgroundStyle}
              themePreset={themePreset}
              onThemePresetChange={setThemePreset}
              zenMode={zenMode}
              onZenModeChange={setZenMode}
              showVolumeSlider={showVolumeSlider}
              onShowVolumeSliderChange={setShowVolumeSlider}
              enable3DTilt={enable3DTilt}
              onEnable3DTiltChange={setEnable3DTilt}
              showSettingsButton={showSettingsButton}
              onShowSettingsButtonChange={setShowSettingsButton}
              enableCustomLyrics={enableCustomLyrics}
              onEnableCustomLyricsChange={setEnableCustomLyrics}
              onPlayingStateChange={setIsMiniPlaying}
              onFileSelect={(file) => {
                if (appState === 'ready') {
                  setSongData({
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    artist: 'Unknown Artist',
                    artworkUrl: 'https://images.unsplash.com/photo-1676068368612-1c8b3e2afed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjBhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3ODk2NjA3OHww&ixlib=rb-4.1.0&q=80&w=1080',
                    audioUrl: URL.createObjectURL(file)
                  });
                  return;
                }
                setAppState('processing');
                setTimeout(() => {
                  setSongData({
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    artist: 'Unknown Artist',
                    artworkUrl: 'https://images.unsplash.com/photo-1676068368612-1c8b3e2afed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjBhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3ODk2NjA3OHww&ixlib=rb-4.1.0&q=80&w=1080',
                    audioUrl: URL.createObjectURL(file)
                  });
                  setAppState('ready');
                }, 1500);
              }}
              onUrlSubmit={searchLogic.handleUrlSubmit}
              onBackToHome={() => {
                if (backToHomeTimeoutRef.current) {
                  clearTimeout(backToHomeTimeoutRef.current);
                }
                setAppState('landing');
                searchLogic.setSearchQuery('');
                searchLogic.setSearchResults([]);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal (only for landing state; active player handles its own) */}
      <AnimatePresence>
        {showSettings && appState === 'landing' && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            accentColor={accentColor}
            onAccentColorChange={setAccentColor}
            textureStyle={textureStyle}
            onTextureStyleChange={setTextureStyle}
            backgroundStyle={backgroundStyle}
            onBackgroundStyleChange={setBackgroundStyle}
            themePreset={themePreset}
            onThemePresetChange={setThemePreset}
            zenMode={zenMode}
            onZenModeChange={setZenMode}
            showVolumeSlider={showVolumeSlider}
            onShowVolumeSliderChange={setShowVolumeSlider}
            enable3DTilt={enable3DTilt}
            onEnable3DTiltChange={setEnable3DTilt}
            showSettingsButton={showSettingsButton}
            onShowSettingsButtonChange={setShowSettingsButton}
            enableCustomLyrics={enableCustomLyrics}
            onEnableCustomLyricsChange={setEnableCustomLyrics}
          />
        )}
      </AnimatePresence>

      {/* Mini HUD Glassmorphic Notification Pill */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none"
          >
            <div className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full border border-white/10 bg-black/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
              {hudType === 'success' ? (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              ) : hudType === 'error' ? (
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
              )}
              <span className="text-[11px] font-semibold tracking-wide text-white/95">
                {hudMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tour Overlay */}
      <OnboardingTour
        tourType={tourType}
        currentStep={tourStep}
        onNext={handleTourNext}
        onBack={handleTourBack}
        onSkip={handleTourSkip}
        accentColor={accentColor}
      />

      {/* Keyboard Shortcuts Map Overlay */}
      <KeyboardShortcutsModal
        isOpen={showShortcutMap}
        onClose={() => setShowShortcutMap(false)}
        accentColor={accentColor}
      />

      {/* Floating MiniPlayer Pill */}
      <AnimatePresence>
        {appState === 'landing' && songData && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[410px] max-w-[92vw] h-14 rounded-2xl border border-white/10 bg-black/55 backdrop-blur-2xl shadow-[0_12px_45px_rgba(0,0,0,0.65)] flex items-center justify-between px-3.5 select-none"
          >
            <div 
              onClick={() => setAppState('ready')}
              className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden relative border border-white/5 shadow-md shrink-0">
                <img 
                  src={songData.artworkUrl} 
                  alt={songData.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ borderRadius: '8px' }}
                />
              </div>
              
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-white/95 truncate group-hover:text-emerald-400 transition-colors">
                  {songData.title}
                </span>
                <span className="text-[9px] text-white/45 truncate mt-0.5">
                  {songData.artist}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 shrink-0 ml-3">
              <button
                onClick={() => window.dispatchEvent(new Event('elva-play-prev'))}
                className="text-white/50 hover:text-white/95 transition-colors cursor-pointer focus:outline-none"
                title="Previous track"
              >
                <SkipBack className="w-4 h-4 fill-white/10" />
              </button>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new Event('elva-toggle-play'))}
                className="w-8.5 h-8.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/8 flex items-center justify-center text-white cursor-pointer transition-colors focus:outline-none"
              >
                {isMiniPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                )}
              </motion.button>

              <button
                onClick={() => window.dispatchEvent(new Event('elva-play-next'))}
                className="text-white/50 hover:text-white/95 transition-colors cursor-pointer focus:outline-none"
                title="Next track"
              >
                <SkipForward className="w-4 h-4 fill-white/10" />
              </button>

              <div className="w-[1px] h-4 bg-white/10" />

              <button
                onClick={() => {
                  setColorsSongData(null);
                  setSongData(null);
                }}
                className="text-white/35 hover:text-rose-400 transition-colors cursor-pointer focus:outline-none"
                title="Stop & Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Custom Premium Volume HUD overlay */}
      <AnimatePresence>
        {showGlobalVolumeHUD && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] pointer-events-none"
          >
            {globalVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-white/55" />
            ) : globalVolume < 33 ? (
              <Volume className="w-4 h-4 text-white/80" />
            ) : globalVolume < 66 ? (
              <Volume1 className="w-4 h-4 text-white/80" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/80" />
            )}
            <div className="w-24 h-1.5 bg-white/15 rounded-full overflow-hidden relative">
              <motion.div
                className={`h-full ${accentBgs400[accentColor]} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${globalVolume}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </div>
            <span className="text-xs font-semibold text-white/90 tabular-nums w-8 text-right">
              {globalVolume}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster 
        position="top-center" 
        theme="dark" 
        expand={true}
        visibleToasts={3}
        toastOptions={{
          style: {
            background: 'rgba(15, 15, 20, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            borderRadius: '16px',
            padding: '12px 18px',
          },
          classNames: {
            title: '!text-white !text-sm !font-semibold !font-sans',
            description: '!text-white/70 !text-[11px] !font-light !font-sans !mt-1',
            toast: '!flex !items-center !gap-3 !rounded-2xl !border !border-white/10 !shadow-2xl'
          }
        }} 
      />

      {/* Premium Global Matte-Paper/Dots Texture Overlay */}
      {textureStyle === 'paper' && (
        <div 
          className="fixed inset-0 w-full h-full opacity-[0.08] mix-blend-overlay pointer-events-none z-[150]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }} 
        />
      )}
      
      {textureStyle === 'dots' && (
        <>
          <div 
            className="fixed inset-0 opacity-[0.022] pointer-events-none z-[150]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0.8px, transparent 0.8px)',
              backgroundSize: '5px 5px',
              transform: 'rotate(15deg) scale(1.35)',
              transformOrigin: 'center center'
            }}
          />
          <div 
            className="fixed inset-0 pointer-events-none opacity-[0.008] mix-blend-overlay z-[150]" 
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }} 
          />
        </>
      )}
    </div>
  );
}
