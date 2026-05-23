import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Link as LinkIcon, Search, Plus, HelpCircle, Keyboard, X, ArrowLeft, ChevronRight, Loader2, Play, Settings } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import 'sonner/dist/styles.css';
import { MusicPlayer } from './components/MusicPlayer';
import { OnboardingTour, tourSteps } from './components/OnboardingTour';
import { AccentColor, ACCENT_THEMES } from './components/themeUtils';
import { SettingsModal } from './components/SettingsModal';
import paperTexture from '../paper_texture.png';

type AppState = 'landing' | 'processing' | 'ready';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
  channelId?: string;
}

const decodeHTMLEntities = (text: string): string => {
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  } catch (e) {
    return text;
  }
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 4000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  const signal = options.signal;
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
    if (signal.aborted) controller.abort();
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const robustFetch = async (url: string, signal?: AbortSignal, skipProxies: boolean = false): Promise<Response> => {
  // 1. Try directly (most Invidious/Piped public instances natively support CORS)
  try {
    const response = await fetchWithTimeout(url, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`Direct fetch failed for ${url}:`, e);
  }

  if (skipProxies) {
    throw new Error(`Direct fetch failed for ${url} and proxies were skipped.`);
  }

  // 2. Try via allorigins proxy (very stable)
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`AllOrigins proxy fetch failed for ${url}:`, e);
  }

  // 3. Try via corsproxy.io (fallback)
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    const response = await fetchWithTimeout(proxyUrl, { signal });
    if (response.ok) return response;
  } catch (e) {
    console.warn(`corsproxy.io fetch failed for ${url}:`, e);
  }

  throw new Error(`Failed to fetch ${url} directly or via proxies.`);
};

const fetchFromFirstSuccessfulInstance = async <T extends unknown>(
  instances: string[],
  fetchFn: (instance: string, signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 3000
): Promise<T> => {
  const globalController = new AbortController();
  
  const promises = instances.map(async (instance) => {
    const instanceController = new AbortController();
    
    // Listen to global abort (e.g. if another instance succeeded)
    const abortListener = () => instanceController.abort();
    globalController.signal.addEventListener('abort', abortListener);
    
    const timeoutId = setTimeout(() => instanceController.abort(), timeoutMs);
    try {
      const res = await fetchFn(instance, instanceController.signal);
      clearTimeout(timeoutId);
      // Success! Abort all other instances
      globalController.abort();
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    } finally {
      globalController.signal.removeEventListener('abort', abortListener);
    }
  });

  return new Promise((resolve, reject) => {
    let rejectedCount = 0;
    if (promises.length === 0) {
      reject(new Error('No instances provided'));
      return;
    }
    promises.forEach((p) => {
      p.then(resolve).catch(() => {
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error('All instances failed'));
        }
      });
    });
  });
};

const fetchVideoDetails = async (videoId: string): Promise<{ title: string; artist: string; artworkUrl: string }> => {
  const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const response = await fetchWithTimeout(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.items && data.items.length > 0) {
          const item = data.items[0];
          return {
            title: decodeHTMLEntities(item.snippet.title),
            artist: decodeHTMLEntities(item.snippet.channelTitle || 'Unknown Artist'),
            artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
          };
        }
      }
    } catch (error) {
      console.error('Failed to fetch video details via official API:', error);
    }
  }

  // Fallback: Invidious/Piped
  const PIPED_INSTANCES = [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.lunar.icu',
    'https://pipedapi.colby.host',
    'https://api.piped.yt',
    'https://pipedapi.tokhmi.xyz'
  ];

  const INVIDIOUS_INSTANCES = [
    'https://yewtu.be',
    'https://invidious.io.lol',
    'https://iv.melmac.space'
  ];

  // Try PIPED details concurrently (direct only)
  try {
    const details = await fetchFromFirstSuccessfulInstance(
      PIPED_INSTANCES,
      async (instance, signal) => {
        const response = await robustFetch(`${instance}/streams/${videoId}`, signal, true); // SKIP PROXIES
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return {
          title: decodeHTMLEntities(data.title || 'YouTube Stream'),
          artist: decodeHTMLEntities(data.uploader || 'Web Stream'),
          artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        };
      },
      1800
    );
    return details;
  } catch (pipedErr) {
    console.warn('All Piped instances failed direct video details, trying Invidious directly:', pipedErr);
  }

  // Try INVIDIOUS details concurrently (direct only)
  try {
    const details = await fetchFromFirstSuccessfulInstance(
      INVIDIOUS_INSTANCES,
      async (instance, signal) => {
        const response = await robustFetch(`${instance}/api/v1/videos/${videoId}`, signal, true); // SKIP PROXIES
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return {
          title: decodeHTMLEntities(data.title || 'YouTube Stream'),
          artist: decodeHTMLEntities(data.author || 'Web Stream'),
          artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        };
      },
      1800
    );
    return details;
  } catch (invidiousErr) {
    console.warn('All Invidious instances failed direct video details, trying single proxy fallback:', invidiousErr);
  }

  // ULTIMATE FALLBACK: Try a single Piped instance with proxies allowed
  try {
    const response = await robustFetch(`${PIPED_INSTANCES[0]}/streams/${videoId}`, undefined, false); // ALLOW PROXIES
    if (response.ok) {
      const data = await response.json();
      return {
        title: decodeHTMLEntities(data.title || 'YouTube Stream'),
        artist: decodeHTMLEntities(data.uploader || 'Web Stream'),
        artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
      };
    }
  } catch (proxyErr) {
    console.error('All direct and proxy video details failed:', proxyErr);
  }

  return {
    title: 'YouTube Stream',
    artist: 'Web Stream',
    artworkUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  };
};

interface VerifiedArtist {
  name: string;
  thumbnail: string;
  channelId?: string;
  disambiguation?: string;
  country?: string;
  tags?: string[];
  isTopic?: boolean;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [showSettings, setShowSettings] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(() => {
    const hasSeenIntro = sessionStorage.getItem('elva_intro_seen');
    return !hasSeenIntro;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Artist Profile States on Home Page
  const [selectedArtist, setSelectedArtist] = useState<VerifiedArtist | null>(null);
  const [verifiedArtist, setVerifiedArtist] = useState<VerifiedArtist | null>(null);
  const [isVerifyingArtist, setIsVerifyingArtist] = useState(false);
  const [artistTracks, setArtistTracks] = useState<SearchResult[]>([]);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);

  const [queue, setQueue] = useState<SearchResult[]>([]);
  const [songData, setSongData] = useState<{
    title: string;
    artist: string;
    artworkUrl: string;
    audioUrl: string;
    videoId?: string;
  } | null>(null);

  // Accent Color Theme System
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem('elva_accent_color') as AccentColor) || 'emerald';
  });

  useEffect(() => {
    localStorage.setItem('elva_accent_color', accentColor);
  }, [accentColor]);

  // Tactile Background Texture System ('paper' = Option 2 Organic Cardstock, 'dots' = Option 1 Halftone Screen, 'none' = Pure Quiet Glass)
  const [textureStyle, setTextureStyle] = useState<'paper' | 'dots' | 'none'>(() => {
    return (localStorage.getItem('elva_texture_style') as 'paper' | 'dots' | 'none') || 'paper';
  });

  useEffect(() => {
    localStorage.setItem('elva_texture_style', textureStyle);
  }, [textureStyle]);

  // Lifted Settings States for Perfect Consistency and Sync
  const [backgroundStyle, setBackgroundStyle] = useState<'default' | 'particles' | 'liquid' | 'mesh'>(() => {
    return (localStorage.getItem('elva_bg_style') as 'default' | 'particles' | 'liquid' | 'mesh') || 'mesh';
  });

  useEffect(() => {
    localStorage.setItem('elva_bg_style', backgroundStyle);
  }, [backgroundStyle]);

  const [themePreset, setThemePreset] = useState<'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset'>(() => {
    return (localStorage.getItem('elva_theme_preset') as 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset') || 'dynamic';
  });

  useEffect(() => {
    localStorage.setItem('elva_theme_preset', themePreset);
  }, [themePreset]);

  const [showVisualizer, setShowVisualizer] = useState(() => {
    return localStorage.getItem('elva_show_visualizer') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('elva_show_visualizer', String(showVisualizer));
  }, [showVisualizer]);

  const [zenMode, setZenMode] = useState(() => {
    return localStorage.getItem('elva_zen_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('elva_zen_mode', String(zenMode));
  }, [zenMode]);

  const [showVolumeSlider, setShowVolumeSlider] = useState(() => {
    return localStorage.getItem('elva_volume_slider') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('elva_volume_slider', String(showVolumeSlider));
  }, [showVolumeSlider]);

  const [enable3DTilt, setEnable3DTilt] = useState(() => {
    return localStorage.getItem('elva_3d_tilt') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('elva_3d_tilt', String(enable3DTilt));
  }, [enable3DTilt]);

  const [showSettingsButton, setShowSettingsButton] = useState(() => {
    return localStorage.getItem('elva_show_settings_btn') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('elva_show_settings_btn', String(showSettingsButton));
  }, [showSettingsButton]);

  const [focusedResultIndex, setFocusedResultIndex] = useState<number>(-1);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);

  // Reset focus when searching or changing view
  useEffect(() => {
    setFocusedResultIndex(-1);
  }, [searchQuery, searchResults, selectedArtist]);

  const theme = ACCENT_THEMES[accentColor];

  // Helper mappings for dynamic class bindings
  const welcomeBgB = {
    emerald: 'from-emerald-950/10',
    sand: 'from-amber-950/10',
    wine: 'from-rose-950/10',
    navy: 'from-slate-950/10'
  };

  const viaAccent30: Record<AccentColor, string> = {
    emerald: 'via-emerald-500/10',
    sand: 'via-amber-500/10',
    wine: 'via-rose-500/10',
    navy: 'via-slate-500/10'
  };

  const viaAccent20: Record<AccentColor, string> = {
    emerald: 'via-emerald-500/5',
    sand: 'via-amber-500/5',
    wine: 'via-rose-500/5',
    navy: 'via-slate-500/5'
  };

  const viaAccent25: Record<AccentColor, string> = {
    emerald: 'via-white/10',
    sand: 'via-white/10',
    wine: 'via-white/10',
    navy: 'via-white/10'
  };

  const fromAccent02: Record<AccentColor, string> = {
    emerald: 'from-emerald-950/[0.02]',
    sand: 'from-amber-950/[0.02]',
    wine: 'from-rose-950/[0.02]',
    navy: 'from-slate-950/[0.02]'
  };

  const bgAccent20: Record<AccentColor, string> = {
    emerald: 'bg-emerald-500/10',
    sand: 'bg-amber-500/10',
    wine: 'bg-rose-500/10',
    navy: 'bg-slate-500/10'
  };

  const textShadows: Record<AccentColor, string> = {
    emerald: 'none',
    sand: 'none',
    wine: 'none',
    navy: 'none'
  };

  const groupHoverText300_60: Record<AccentColor, string> = {
    emerald: 'group-hover:text-emerald-300/60',
    sand: 'group-hover:text-amber-300/60',
    wine: 'group-hover:text-rose-300/60',
    navy: 'group-hover:text-slate-300/60'
  };

  const groupHoverBorder500_10: Record<AccentColor, string> = {
    emerald: 'group-hover:border-emerald-500/10',
    sand: 'group-hover:border-amber-500/10',
    wine: 'group-hover:border-rose-500/10',
    navy: 'group-hover:border-slate-500/10'
  };

  const groupHoverBorder400_40: Record<AccentColor, string> = {
    emerald: 'group-hover:border-emerald-400/40',
    sand: 'group-hover:border-amber-400/40',
    wine: 'group-hover:border-rose-400/40',
    navy: 'group-hover:border-slate-400/40'
  };

  const groupHoverText400: Record<AccentColor, string> = {
    emerald: 'group-hover:text-emerald-400',
    sand: 'group-hover:text-amber-500',
    wine: 'group-hover:text-rose-500',
    navy: 'group-hover:text-slate-400'
  };

  // Onboarding Tour State
  const [tourType, setTourType] = useState<'landing' | 'player' | null>(null);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(() => localStorage.getItem('elva_tour_completed') === 'true');
  const [showShortcutMap, setShowShortcutMap] = useState(false);

  // Reset selected artist if search query changes
  useEffect(() => {
    setSelectedArtist(null);
    setArtistTracks([]);
    setVerifiedArtist(null);
    setIsVerifyingArtist(false);
  }, [searchQuery]);

  const isFirstVisit = useRef(!sessionStorage.getItem('elva_intro_seen')).current;

  // Stagger animation timelines for absolute premium flow
  const letterVariants = {
    initial: { opacity: 0, y: isFirstVisit ? 40 : 15, rotateX: isFirstVisit ? -90 : 0 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        delay: isFirstVisit ? 0.8 + i * 0.15 : 0.05 + i * 0.06,
        duration: isFirstVisit ? 0.8 : 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  const topLineVariants = {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: {
        delay: isFirstVisit ? 1.6 : 0.2,
        duration: isFirstVisit ? 1.0 : 0.6,
        ease: "easeOut"
      }
    }
  };

  const bottomLineVariants = {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: {
        delay: isFirstVisit ? 1.8 : 0.25,
        duration: isFirstVisit ? 1.0 : 0.6,
        ease: "easeOut"
      }
    }
  };

  const taglineVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 0.3,
      y: 0,
      transition: {
        delay: isFirstVisit ? 2.2 : 0.3,
        duration: isFirstVisit ? 0.8 : 0.5,
        ease: "easeOut"
      }
    }
  };

  const inviteVariants = {
    initial: { opacity: 0, y: 5 },
    animate: {
      opacity: 0.25,
      y: 0,
      transition: {
        delay: isFirstVisit ? 2.7 : 0.5,
        duration: isFirstVisit ? 0.8 : 0.5,
        ease: "easeOut"
      }
    }
  };

  const searchInputVariants = {
    initial: { opacity: 0, y: 25 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: isFirstVisit ? 2.5 : 0.4,
        duration: isFirstVisit ? 1.4 : 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isSearchActive = appState === 'landing' && searchQuery.trim() !== '' && !isSearching;

      if (isSearchActive && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || (e.key === 'Enter' && focusedResultIndex >= 0))) {
        e.preventDefault();

        const hasArtistCard = shouldShowArtistCard(searchQuery) && verifiedArtist && !selectedArtist;
        const totalItems = selectedArtist 
          ? artistTracks.length 
          : searchResults.length + (hasArtistCard ? 1 : 0);

        if (totalItems === 0) return;

        if (e.key === 'ArrowDown') {
          setFocusedResultIndex(prev => {
            if (prev < totalItems - 1) return prev + 1;
            return prev;
          });
        } else if (e.key === 'ArrowUp') {
          setFocusedResultIndex(prev => {
            if (prev > 0) return prev - 1;
            return -1;
          });
        } else if (e.key === 'Enter') {
          if (focusedResultIndex >= 0) {
            if (selectedArtist) {
              const track = artistTracks[focusedResultIndex];
              if (track && !loadingSongId) handleSelectSong(track);
            } else {
              if (hasArtistCard && focusedResultIndex === 0) {
                handleViewArtistProfile(verifiedArtist);
              } else {
                const songIndex = hasArtistCard ? focusedResultIndex - 1 : focusedResultIndex;
                const song = searchResults[songIndex];
                if (song && !loadingSongId) handleSelectSong(song);
              }
            }
          }
        }
        return;
      }

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutMap(prev => !prev);
      } else if (e.key === 'Escape' && showShortcutMap) {
        e.preventDefault();
        setShowShortcutMap(false);
      } else if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showShortcutMap, showSettings, appState, searchQuery, isSearching, searchResults, selectedArtist, artistTracks, verifiedArtist, loadingSongId, focusedResultIndex]);

  useEffect(() => {
    const handleResetTour = () => {
      setHasSeenTour(false);
      localStorage.removeItem('elva_tour_completed');
      localStorage.removeItem('elva_player_tour_completed');
    };

    window.addEventListener('elva-reset-tour', handleResetTour);
    return () => window.removeEventListener('elva-reset-tour', handleResetTour);
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
      // Transition to player with a beautiful, real, high-quality demo track
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
      // Step 1 -> Step 0 transition: return to the landing page and clear the preview song
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
    // If they skipped while on the preview song, clean it up
    if (songData?.title === 'Overleve') {
      setAppState('landing');
      setSongData(null);
    }
  };

  // Intro sequence - only once per session
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('elva_intro_seen');

    if (hasSeenIntro) {
      setIsIntroActive(false);
      setAppState('landing');
    } else {
      // Set flag immediately to prevent double intro in strict mode
      sessionStorage.setItem('elva_intro_seen', 'true');
      setIsIntroActive(true);
      setAppState('landing');
      const timer = setTimeout(() => {
        setIsIntroActive(false);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Manual onboarding is triggered exclusively via the Guide button in the top right.



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAppState('processing');

    setTimeout(() => {
      setSongData({
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        artworkUrl: 'https://images.unsplash.com/photo-1676068368612-1c8b3e2afed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjBhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3ODk2NjA3OHww&ixlib=rb-4.1.0&q=80&w=1080',
        audioUrl: URL.createObjectURL(file)
      });
      setAppState('ready');
      if (tourType !== null && tourStep === 0) {
        setTourStep(1);
      }
    }, 1500);
  };

  const executeSearchAPI = async (query: string, limit: number = 8): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

    if (apiKey) {
      // Use Official YouTube Data API v3 (100% stable, free up to 10k/day)
      try {
        const response = await fetchWithTimeout(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${limit}&q=${encodeURIComponent(
            query
          )}&type=video&key=${apiKey}`
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data && data.items) {
          const validItems = data.items.filter((item: any) => item.id && item.id.videoId && item.id.videoId.length === 11);
          return validItems.map((item: any) => {
            const videoId = item.id.videoId;
            return {
              id: videoId,
              title: decodeHTMLEntities(item.snippet.title),
              artist: decodeHTMLEntities(item.snippet.channelTitle || 'Unknown Artist'),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId,
              channelId: item.snippet.channelId
            };
          });
        }
      } catch (error: any) {
        console.error('Official YouTube search failed:', error);
      }
    }

    // FALLBACK: Robust Piped/Invidious loop if no API key or if official API fails
    const PIPED_INSTANCES = [
      'https://api.piped.private.coffee',
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.lunar.icu',
      'https://pipedapi.colby.host',
      'https://api.piped.yt',
      'https://pipedapi.tokhmi.xyz',
      'https://pipedapi.moomoo.me'
    ];

    const INVIDIOUS_INSTANCES = [
      'https://yewtu.be',
      'https://invidious.io.lol',
      'https://invidious.flokinet.to',
      'https://iv.melmac.space',
      'https://invidious.snopyta.org'
    ];

    // Try PIPED search concurrently (direct only)
    try {
      const results = await fetchFromFirstSuccessfulInstance(
        PIPED_INSTANCES,
        async (instance, signal) => {
          const targetUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
          const response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (data && data.items && Array.isArray(data.items)) {
            const validStreams = data.items.filter((item: any) => {
              if (!item.url) return false;
              const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
              const videoId = ytMatch ? ytMatch[1] : null;
              const isPlayable = !item.type || item.type === 'stream' || item.type === 'video';
              return videoId && videoId.length === 11 && isPlayable;
            });

            const mapped = validStreams.map((item: any) => {
              const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
              const videoId = ytMatch![1];
              let channelId = item.uploaderId;
              if (!channelId && item.uploaderUrl) {
                const chMatch = item.uploaderUrl.match(/\/channel\/([^\/]+)/i);
                if (chMatch) channelId = chMatch[1];
              }
              return {
                id: videoId,
                title: decodeHTMLEntities(item.title),
                artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId,
                channelId: channelId
              };
            });

            if (mapped.length > 0) return mapped;
          }
          throw new Error('Empty search items');
        },
        1800
      );
      return results.slice(0, limit);
    } catch (pipedErr) {
      console.warn('All Piped instances failed direct search, trying Invidious directly:', pipedErr);
    }

    // Try INVIDIOUS search concurrently (direct only)
    try {
      const results = await fetchFromFirstSuccessfulInstance(
        INVIDIOUS_INSTANCES,
        async (instance, signal) => {
          const targetUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
          const response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (Array.isArray(data)) {
            const validVideos = data.filter((item: any) => {
              const videoId = item.videoId;
              const isPlayable = !item.type || item.type === 'video' || item.type === 'short';
              return videoId && videoId.length === 11 && isPlayable;
            });

            const mapped = validVideos.map((item: any) => {
              const videoId = item.videoId;
              return {
                id: videoId,
                title: decodeHTMLEntities(item.title),
                artist: decodeHTMLEntities(item.author || 'Unknown Artist'),
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId,
                channelId: item.authorId
              };
            });

            if (mapped.length > 0) return mapped;
          }
          throw new Error('Empty search items');
        },
        1800
      );
      return results.slice(0, limit);
    } catch (invidiousErr) {
      console.warn('All Invidious instances failed direct search, trying single proxy fallback:', invidiousErr);
    }

    // ULTIMATE FALLBACK: Hit a single instance WITH proxy allowed, so we don't spam!
    try {
      const targetUrl = `${PIPED_INSTANCES[0]}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
      const response = await robustFetch(targetUrl, undefined, false); // ALLOW PROXIES
      if (response.ok) {
        const data = await response.json();
        if (data && data.items && Array.isArray(data.items)) {
          const validStreams = data.items.filter((item: any) => {
            if (!item.url) return false;
            const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
            const videoId = ytMatch ? ytMatch[1] : null;
            return videoId && videoId.length === 11;
          });
          const mapped = validStreams.map((item: any) => {
            const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
            const videoId = ytMatch![1];
            return {
              id: videoId,
              title: decodeHTMLEntities(item.title),
              artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId
            };
          });
          if (mapped.length > 0) return mapped.slice(0, limit);
        }
      }
    } catch (proxyErr) {
      console.error('All direct and proxy searches failed:', proxyErr);
    }

    return [];
  };

  const executeChannelUploadsAPI = async (channelId: string, limit: number = 50): Promise<SearchResult[]> => {
    if (!channelId) return [];

    const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

    if (apiKey) {
      try {
        const uploadsPlaylistId = channelId.startsWith('UC') ? channelId.replace(/^UC/, 'UU') : channelId;
        const response = await fetchWithTimeout(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${uploadsPlaylistId}&key=${apiKey}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data && data.items) {
          return data.items.map((item: any) => {
            const videoId = item.snippet.resourceId?.videoId || '';
            return {
              id: videoId,
              title: decodeHTMLEntities(item.snippet.title),
              artist: decodeHTMLEntities(item.snippet.channelTitle || 'Unknown Artist'),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId,
              channelId: channelId
            };
          }).filter((item: any) => item.id.length === 11);
        }
      } catch (error) {
        console.error('Official YouTube playlistItems fetch failed:', error);
      }
    }

    const PIPED_INSTANCES = [
      'https://api.piped.private.coffee',
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.lunar.icu',
      'https://pipedapi.colby.host',
      'https://api.piped.yt',
      'https://pipedapi.tokhmi.xyz',
      'https://pipedapi.moomoo.me'
    ];

    const INVIDIOUS_INSTANCES = [
      'https://yewtu.be',
      'https://invidious.io.lol',
      'https://invidious.flokinet.to',
      'https://iv.melmac.space',
      'https://invidious.snopyta.org'
    ];

    // Try PIPED instances concurrently (direct only)
    try {
      const results = await fetchFromFirstSuccessfulInstance(
        PIPED_INSTANCES,
        async (instance, signal) => {
          const targetUrl = `${instance}/channel/${channelId}`;
          const response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (data && data.relatedStreams && Array.isArray(data.relatedStreams)) {
            const mapped = data.relatedStreams.map((item: any) => {
              const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
              const videoId = ytMatch ? ytMatch[1] : '';
              return {
                id: videoId,
                title: decodeHTMLEntities(item.title),
                artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
                thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId,
                channelId: channelId
              };
            }).filter((item: any) => item.id.length === 11);

            if (mapped.length > 0) return mapped;
          }
          throw new Error('Empty relatedStreams');
        },
        1800
      );
      return results.slice(0, limit);
    } catch (pipedErr) {
      console.warn('All Piped instances failed direct channel uploads, trying Invidious directly:', pipedErr);
    }

    // Try INVIDIOUS instances concurrently (direct only)
    try {
      const results = await fetchFromFirstSuccessfulInstance(
        INVIDIOUS_INSTANCES,
        async (instance, signal) => {
          const targetUrl = `${instance}/api/v1/channels/${channelId}`;
          const response = await robustFetch(targetUrl, signal, true); // SKIP PROXIES
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          const videos = Array.isArray(data) ? data : (data.videos || data.relatedStreams || []);
          
          const mapped = videos.map((item: any) => {
            const videoId = item.videoId;
            return {
              id: videoId,
              title: decodeHTMLEntities(item.title),
              artist: decodeHTMLEntities(item.author || 'Unknown Artist'),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId,
              channelId: channelId
            };
          }).filter((item: any) => item.id && item.id.length === 11);

          if (mapped.length > 0) return mapped;
          throw new Error('Empty videos');
        },
        1800
      );
      return results.slice(0, limit);
    } catch (invidiousErr) {
      console.warn('All Invidious instances failed direct channel uploads, trying single proxy fallback:', invidiousErr);
    }

    // ULTIMATE FALLBACK: Try a single Piped instance with proxies
    try {
      const targetUrl = `${PIPED_INSTANCES[0]}/channel/${channelId}`;
      const response = await robustFetch(targetUrl, undefined, false); // ALLOW PROXIES
      if (response.ok) {
        const data = await response.json();
        if (data && data.relatedStreams && Array.isArray(data.relatedStreams)) {
          const mapped = data.relatedStreams.map((item: any) => {
            const ytMatch = item.url.match(/(?:v=|\/watch\?v=)([^"&?\/\s]{11})/i);
            const videoId = ytMatch ? ytMatch[1] : '';
            return {
              id: videoId,
              title: decodeHTMLEntities(item.title),
              artist: decodeHTMLEntities(item.uploaderName || 'Unknown Artist'),
              thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              videoId: videoId,
              channelId: channelId
            };
          }).filter((item: any) => item.id.length === 11);
          if (mapped.length > 0) return mapped.slice(0, limit);
        }
      }
    } catch (proxyErr) {
      console.error('All direct and proxy channel fetches failed:', proxyErr);
    }

    return [];
  };
  // Helper to determine if query matches an artist profile search
  const shouldShowArtistCard = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return false;
    
    // Skip if it looks like a URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
    
    // Skip if it has more than 3 words (highly unlikely to be a simple artist name search)
    const words = trimmed.split(/\s+/);
    if (words.length > 3) return false;

    // Common non-artist keywords
    const blocklist = [
      'lyrics', 'remix', 'karaoke', 'live', 'cover', 'instrumental', 'acoustic', 
      'version', 'song', 'sang', 'video', '24 timer', 'vlog', 'hvad', 'hvornår', 
      'hvorfor', 'hvem', 'hvordan', 'mp3', 'wav', 'flac', 'prod', 'feat', 'ft.'
    ];
    
    return !blocklist.some(word => trimmed.includes(word));
  };

  // Helper to extract artist name and high-quality cover art
  const getArtistName = (query: string, results: SearchResult[]): { name: string; thumbnail: string; channelId?: string } | null => {
    if (!shouldShowArtistCard(query) || results.length === 0) return null;
    
    const queryLower = query.trim().toLowerCase();
    if (queryLower.length < 2) return null;
    
    const match = results.find(r => {
      const artistLower = r.artist.trim().toLowerCase();
      
      const isExactOrOfficialMatch = 
        artistLower === queryLower ||
        artistLower === `${queryLower} - topic` ||
        artistLower === `${queryLower}vevo` ||
        artistLower === `${queryLower} official` ||
        artistLower === `${queryLower} music` ||
        artistLower === `${queryLower} band`;
      
      if (isExactOrOfficialMatch) return true;
      
      const containsQuery = artistLower.includes(queryLower);
      const isOfficialEntity = 
        artistLower.includes('topic') || 
        artistLower.includes('vevo') || 
        artistLower.includes('official') || 
        artistLower.includes('music') ||
        artistLower.includes('band') ||
        artistLower.includes('records');
        
      if (containsQuery && isOfficialEntity) return true;
      
      return false;
    });

    if (match) {
      const cleanedName = match.artist
        .replace(/\s*-\s*Topic$/i, '')
        .replace(/\s*VEVO$/i, '')
        .replace(/\s*Official\s*$/i, '')
        .trim();
      const isTopic = match.artist.toLowerCase().includes('topic');
      return {
        name: cleanedName,
        thumbnail: match.thumbnail,
        channelId: match.channelId,
        isTopic: isTopic
      };
    }
    
    return null;
  };

  // Verify artist via MusicBrainz API to prevent fake artist cards on gibberish searches
  useEffect(() => {
    let active = true;
    
    const verifyArtist = async () => {
      if (!shouldShowArtistCard(searchQuery) || searchResults.length === 0) {
        setVerifiedArtist(null);
        return;
      }
      
      // Get candidate artist from search results using the heuristics
      const candidate = getArtistName(searchQuery, searchResults);
      if (!candidate) {
        setVerifiedArtist(null);
        return;
      }

      setIsVerifyingArtist(true);
      try {
        const queryVal = candidate.name.trim();
        // Call MusicBrainz API
        const response = await fetchWithTimeout(
          `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(queryVal)}&fmt=json`,
          {
            headers: {
              'User-Agent': 'ElvaMusicApp/1.0 ( contact@elva.fm )'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`MusicBrainz HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        if (!active) return;
        
        const artists = data.artists || [];
        const queryLower = queryVal.toLowerCase();
        
        const matchedArtist = artists.find((artist: any) => {
          const nameLower = (artist.name || '').toLowerCase();
          const score = artist.score || 0;
          
          const isHighConfidence = score >= 90;
          const isNameMatch = nameLower === queryLower || nameLower.includes(queryLower) || queryLower.includes(nameLower);
          
          return isHighConfidence && isNameMatch;
        });
        
        if (matchedArtist) {
          const tagsList = (matchedArtist.tags || [])
            .filter((t: any) => (t.count || 0) > 0)
            .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
            .map((t: any) => t.name)
            .slice(0, 3);
          setVerifiedArtist({
            name: candidate.name,
            thumbnail: candidate.thumbnail,
            channelId: candidate.channelId,
            isTopic: candidate.isTopic,
            disambiguation: matchedArtist.disambiguation || undefined,
            country: matchedArtist.country || undefined,
            tags: tagsList.length > 0 ? tagsList : undefined
          });
        } else {
          setVerifiedArtist(null);
        }
      } catch (error) {
        console.warn('MusicBrainz verification failed, using local heuristics fallback:', error);
        if (active) {
          setVerifiedArtist({
            name: candidate.name,
            thumbnail: candidate.thumbnail,
            channelId: candidate.channelId,
            isTopic: candidate.isTopic
          });
        }
      } finally {
        if (active) {
          setIsVerifyingArtist(false);
        }
      }
    };
    
    verifyArtist();
    
    return () => {
      active = false;
    };
  }, [searchResults, searchQuery]);
 
  // Fetch artist profile official releases in background
  const handleViewArtistProfile = async (artist: VerifiedArtist) => {
    setSelectedArtist(artist);
    setIsLoadingArtist(true);
    
    try {
      let rawTracks: SearchResult[] = [];
      const apiKey = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

      // Only attempt direct channel uploads query if the official YouTube API Key is active!
      // On public Piped/Invidious instances, scraping channel uploads is extremely slow, challenged by bot blocks, or broken.
      if (apiKey && artist.channelId && !artist.isTopic) {
        // Query the exact channel uploads playlist (100% deterministic, no loose search)
        rawTracks = await executeChannelUploadsAPI(artist.channelId, 50);
      }
      
      // If we got no tracks from the channel uploads (common on Piped/Invidious fallbacks for topic channels),
      // or if there is no channelId, fall back to robust search-based retrieval.
      if (rawTracks.length === 0) {
        rawTracks = await executeSearchAPI(`${artist.name} topic`);
      }

      // Clean and filter the tracks strictly to keep official, high-quality music releases
      const cleaned = rawTracks
        .filter(track => {
          const titleLower = track.title.toLowerCase();
          // Filter out teasers, trailers, vlogs, documentary, behind the scenes from official channels
          const blocklist = ['teaser', 'trailer', 'vlog', 'behind the scenes', 'bts', 'documentary', 'live stream', 'interview'];
          return !blocklist.some(word => titleLower.includes(word));
        })
        .map(track => {
          // Strip "- Topic", "VEVO", "Official" from artist uploader names
          const cleanArtist = track.artist
            .replace(/\s*-\s*Topic$/i, '')
            .replace(/\s*VEVO$/i, '')
            .replace(/\s*Official\s*$/i, '')
            .trim();
            
          const cleanTitle = track.title
            .replace(/\s*\((Official Audio|Audio|Official Video|Video|Lyrics|Lyric Video)\)$/i, '')
            .replace(/\s*\[(Official Audio|Audio|Official Video|Video|Lyrics|Lyric Video)\]$/i, '')
            .trim();
            
          return {
            ...track,
            artist: cleanArtist,
            title: cleanTitle
          };
        });
      
      setArtistTracks(cleaned);
    } catch (error) {
      console.error('Failed to load artist profile tracks:', error);
      toast.error(`Could not fetch official releases for ${artist.name}`);
    } finally {
      setIsLoadingArtist(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await executeSearchAPI(searchQuery);
    setIsSearching(false);

    if (results.length > 0) {
      setSearchResults(results);
    } else {
      toast.error('Search failed', { 
        description: 'Could not fetch results from YouTube. Try using an API key or pasting a link directly.' 
      });
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setAppState('processing');

    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = ytMatch ? ytMatch[1] : null;

    let targetSong: SearchResult;

    if (videoId) {
      const details = await fetchVideoDetails(videoId);
      targetSong = {
        id: videoId,
        title: details.title,
        artist: details.artist,
        thumbnail: details.artworkUrl,
        videoId: videoId
      };
    } else {
      const title = url.split('/').pop()?.split('?')[0] || 'Streaming Song';
      targetSong = {
        id: url,
        title: decodeURIComponent(title),
        artist: 'Web Stream',
        thumbnail: 'https://images.unsplash.com/photo-1676068368612-1c8b3e2afed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjBhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3ODk2NjA3OHww&ixlib=rb-4.1.0&q=80&w=1080',
        videoId: ''
      };
    }

    setSongData({
      title: targetSong.title,
      artist: targetSong.artist,
      artworkUrl: targetSong.thumbnail,
      audioUrl: targetSong.videoId ? `https://www.youtube.com/watch?v=${targetSong.id}` : url,
      videoId: targetSong.videoId || undefined
    });

    // Also add to queue if not present
    setQueue(prevQueue => {
      if (prevQueue.some(item => item.id === targetSong.id)) {
        return prevQueue;
      }
      return [...prevQueue, targetSong];
    });

    setAppState('ready');
  };

  const handleSelectSong = (result: SearchResult) => {
    if (appState === 'ready') {
      setSongData({
        title: result.title,
        artist: result.artist,
        artworkUrl: result.thumbnail,
        audioUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
        videoId: result.videoId
      });
      if (tourType !== null && tourStep === 0) {
        setTourStep(1);
      }
      return;
    }

    setLoadingSongId(result.id);
    setAppState('processing');

    const startTime = Date.now();
    const minDisplayTime = 1200; // 1.2s guaranteed display for buttery transitions

    const proceedToReady = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      setTimeout(() => {
        setSongData({
          title: result.title,
          artist: result.artist,
          artworkUrl: result.thumbnail,
          audioUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
          videoId: result.videoId
        });
        setAppState('ready');
        setLoadingSongId(null);
        if (tourType !== null && tourStep === 0) {
          setTourStep(1);
        }
      }, remainingTime);
    };

    // Preload image before transitioning
    const img = new Image();
    img.src = result.thumbnail;
    img.onload = proceedToReady;
    img.onerror = proceedToReady;
  };

  const handleAddToQueue = (result: SearchResult) => {
    // Don't add duplicates
    if (queue.some(item => item.id === result.id)) {
      toast.error('Already in queue', {
        description: result.title,
      });
      return;
    }

    setQueue([...queue, result]);
    toast.success('Added to queue', {
      description: result.title,
    });
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleSelectFromQueue = (id: string) => {
    const song = queue.find(item => item.id === id);
    if (song) handleSelectSong(song);
  };



  return (
    <div className="size-full relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center">

      {/* Subtle ambient background with more color */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 overflow-hidden"
      >
        <motion.div
          animate={{
            opacity: [0.04, 0.08, 0.04],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] bg-gradient-to-br ${theme.welcomeFrom} ${theme.welcomeVia} ${theme.welcomeTo}`}
        />
        <motion.div
          animate={{
            opacity: [0.02, 0.05, 0.02],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className={`absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[110px] bg-gradient-to-br ${welcomeBgB[accentColor]} via-neutral-100/5 to-transparent`}
        />
      </motion.div>

      <AnimatePresence>
        {appState === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-16 md:pt-24 px-8 w-full h-full"
          >
            {/* Animated gradient orbs during intro */}
            {isIntroActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.2, 0.3, 0], scale: [0.8, 1.25, 1.55, 2.1] }}
                transition={{ duration: 3, ease: "easeOut" }}
                className={`absolute w-[950px] h-[950px] rounded-full blur-[140px] bg-gradient-to-tr ${theme.glowFrom} ${theme.glowVia} ${theme.glowTo} pointer-events-none`}
              />
            )}



            {/* Elegant Background Textures based on user preference */}
            {textureStyle !== 'none' && (
              <>
                <div 
                  className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                  style={{
                    maskImage: 'radial-gradient(circle at center, transparent 15%, rgba(0, 0, 0, 0.3) 55%, black 100%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, transparent 15%, rgba(0, 0, 0, 0.3) 55%, black 100%)'
                  }}
                >
                  {textureStyle === 'paper' ? (
                    /* Beautiful Organic Cardstock Paper Texture (Option 2) - Whisper quiet opacity */
                    <div 
                      className="absolute inset-0 opacity-[0.016] mix-blend-overlay"
                      style={{
                        backgroundImage: `url(${paperTexture})`,
                        backgroundSize: '280px 280px',
                        backgroundRepeat: 'repeat'
                      }}
                    />
                  ) : (
                    /* Elegant Vintage Newsprint Halftone Dot Screen (Option 1) - Whisper quiet opacity */
                    <div 
                      className="absolute inset-0 opacity-[0.022]"
                      style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0.8px, transparent 0.8px)',
                        backgroundSize: '5px 5px',
                        transform: 'rotate(15deg) scale(1.35)',
                        transformOrigin: 'center center'
                      }}
                    />
                  )}
                </div>

                {/* Microscopic paper noise texture to complement the texture */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-[0.012] mix-blend-overlay z-0" 
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                  }} 
                />
              </>
            )}

            {/* Hero branding - elegant and refined */}
            <div className="flex flex-col items-center gap-6 mb-8 shrink-0">
              {/* Refined Elva wordmark */}
              <motion.div
                className="relative flex flex-col items-center"
              >
                {/* Subtle decorative lines with color */}
                <motion.div
                  variants={topLineVariants}
                  initial="initial"
                  animate="animate"
                  className="relative w-24 h-px mb-8"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${viaAccent30[accentColor]} to-transparent`} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>

                {/* Main wordmark with colored gradient */}
                <div className="relative">
                  <div className="flex items-center select-none pb-2">
                    {['E', 'l', 'v', 'a'].map((letter, i) => (
                      <motion.span
                        key={i}
                        custom={i}
                        variants={letterVariants}
                        initial="initial"
                        animate="animate"
                        className={`text-8xl font-normal tracking-[0.06em] ${theme.glowText} bg-clip-text text-transparent px-[2px]`}
                        style={{
                          fontFamily: '"Kaobe", serif',
                          textShadow: 'none'
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </div>

                  {/* Subtle shimmer effect with color - smooth back and forth */}
                  <motion.div
                    animate={{
                      x: ['-150%', '150%'],
                    }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-sm"
                    style={{ mixBlendMode: 'overlay' }}
                  />
                </div>

                {/* Bottom decorative line with color */}
                <motion.div
                  variants={bottomLineVariants}
                  initial="initial"
                  animate="animate"
                  className="relative w-24 h-px mt-8"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${viaAccent20[accentColor]} to-transparent`} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>
              </motion.div>

              {/* Tagline - more subtle */}
              <motion.p
                variants={taglineVariants}
                initial="initial"
                animate="animate"
                className="text-[10px] text-white/30 tracking-[0.4em] uppercase font-light"
              >
                Listen Deeper
              </motion.p>

              {/* Minimalist Inline Tour Invite */}
              {!hasSeenTour && tourType === null && (
                <motion.p
                  variants={inviteVariants}
                  initial="initial"
                  animate="animate"
                  whileHover={{ opacity: 0.65 }}
                  className="mt-6 text-[10px] font-extralight text-white tracking-[0.15em] transition-all duration-300 uppercase cursor-pointer"
                >
                  New to Elva?{' '}
                  <button
                    onClick={startTour}
                    className={`underline decoration-white/20 hover:decoration-current ${theme.textHover} ${theme.text} cursor-pointer transition-colors`}
                  >
                    Take a 15s tour
                  </button>
                </motion.p>
              )}
            </div>

            {/* Input section */}
            <motion.div
              variants={searchInputVariants}
              initial="initial"
              animate="animate"
              className="w-full max-w-2xl space-y-6"
            >
              {/* Main input - clean with subtle details */}
              <div className="relative group">
                {/* Subtle corner accents */}
                <div className="absolute -top-px -left-px w-8 h-8 border-t border-l border-white/0 group-focus-within:border-white/20 rounded-tl-3xl transition-all duration-500" />
                <div className="absolute -top-px -right-px w-8 h-8 border-t border-r border-white/0 group-focus-within:border-white/20 rounded-tr-3xl transition-all duration-500" />
                <div className="absolute -bottom-px -left-px w-8 h-8 border-b border-l border-white/0 group-focus-within:border-white/20 rounded-bl-3xl transition-all duration-500" />
                <div className="absolute -bottom-px -right-px w-8 h-8 border-b border-r border-white/0 group-focus-within:border-white/20 rounded-br-3xl transition-all duration-500" />

                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white/50 transition-colors duration-300" />
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (searchQuery.match(/^https?:\/\//)) {
                          handleUrlSubmit(searchQuery);
                        } else {
                          handleSearch();
                        }
                      }
                    }}
                    placeholder="Search or paste a link..."
                    autoFocus
                    className="w-full pl-16 pr-8 py-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] text-white/90 placeholder-white/25 text-lg font-light tracking-wide focus:outline-none focus:border-white/15 focus:bg-white/[0.04] transition-all duration-300 backdrop-blur-2xl"
                  />

                  {/* Subtle inner shadow for depth */}
                  <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
                </div>
              </div>

              {/* Search results */}
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16 text-white/40 text-sm"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 mx-auto mb-4 border border-white/20 border-t-white/50 rounded-full"
                    />
                    Searching...
                  </motion.div>
                )}
                {!isSearching && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 max-h-[550px] md:max-h-[60vh] overflow-y-auto px-1 scrollbar-none w-full"
                  >
                    {isLoadingArtist ? (
                      /* Artist Loading Spinner */
                      <motion.div
                        key="artist-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                      >
                        <Loader2 className="w-8 h-8 text-white/60 animate-spin mb-3" />
                        <p className="text-xs text-white/40 font-medium tracking-wide">Loading discography...</p>
                        <p className="text-[10px] text-white/20 mt-1">Filtering high-quality studio songs</p>
                      </motion.div>
                    ) : selectedArtist ? (
                      /* Artist Profile Subview */
                      <motion.div
                        key="artist-profile"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="space-y-4"
                      >
                        {/* Cohesive Compact Artist Header Card */}
                        <div className={`sticky top-0 z-20 overflow-hidden p-4 rounded-2xl bg-[#0d0d0f]/95 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full shadow-lg group hover:bg-white/[0.03] backdrop-blur-md transition-all duration-300`}>
                          {/* Inner premium accent glow matching Queue styling */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${fromAccent02[accentColor]} to-transparent pointer-events-none`}
                            style={{
                              maskImage: 'linear-gradient(to right, black, transparent)',
                              WebkitMaskImage: 'linear-gradient(to right, black, transparent)'
                            }}
                          />
                          
                          <div className="relative flex items-center gap-3.5 min-w-0 z-10">
                            {/* Back arrow button */}
                            <button
                              onClick={() => {
                                setSelectedArtist(null);
                                setArtistTracks([]);
                              }}
                              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 text-white/50 hover:text-white transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
                              title="Back to search results"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>

                            {/* Integrated Artist Metadata */}
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Avatar with hover scale - scaled up to w-16 h-16 and circular */}
                              <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${theme.border} flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                <img src={selectedArtist.thumbnail} alt={selectedArtist.name} className="w-full h-full object-cover scale-105" />
                              </div>
                              
                              {/* Artist Info */}
                              <div className="flex flex-col text-left min-w-0">
                                <div className="flex items-center gap-2">
                                  <h2 className={`text-base font-extrabold text-white tracking-tight truncate leading-none ${theme.textHoverLight} transition-colors`}>{selectedArtist.name}</h2>
                                  <span className={`text-[10px] font-bold ${theme.badgeText} tracking-wider ${theme.badgeBg} border ${theme.badgeBorder} px-1.5 py-0.5 rounded-md uppercase shrink-0`}>
                                    ✦ Verified Artist
                                  </span>
                                </div>
                                
                                {selectedArtist.disambiguation && (
                                  <p className="text-[10px] text-white/50 truncate mt-1.5 font-medium leading-none">
                                    {selectedArtist.disambiguation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Refined tags without misleading official release labels */}
                          <div className="relative flex items-center gap-2 shrink-0 z-10 justify-end sm:justify-start pl-14 sm:pl-0">
                            {selectedArtist.tags && selectedArtist.tags.length > 0 && (
                              <div className="flex gap-1.5">
                                {selectedArtist.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className={`text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider ${groupHoverBorder500_10[accentColor]} ${groupHoverText300_60[accentColor]} transition-colors`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Styled Official Discography Divider Header */}
                        <div className="flex items-center justify-between px-2 py-2 mt-4 mb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider`}>Official Discography</span>
                          </div>
                          <span className="text-[10px] text-white/35 font-medium uppercase tracking-widest bg-white/5 border border-white/8 px-2 py-0.5 rounded-md">
                            Verified Tracks
                          </span>
                        </div>

                        {/* Tracks list */}
                        <div className="space-y-2">
                          {artistTracks.length === 0 ? (
                            <div className="py-12 text-center text-white/40">
                              <Music className="w-8 h-8 text-white/10 mx-auto mb-2" />
                              <p className="text-xs">No official songs found.</p>
                            </div>
                          ) : (
                            artistTracks.map((track, index) => {
                              const isFocused = focusedResultIndex === index;
                              return (
                                <motion.div
                                  key={`artist-track-${track.id}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.03, ease: "easeOut" }}
                                  onClick={() => {
                                    if (!loadingSongId) handleSelectSong(track);
                                  }}
                                  className={`group w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                                    loadingSongId === track.id
                                      ? `${theme.borderActive} ${theme.bgActive}`
                                      : isFocused
                                      ? 'bg-white/[0.06] border-white/20 shadow-md scale-[1.01]'
                                      : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10'
                                  }`}
                                >
                                  {/* Thumbnail with hover play icon */}
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5 shadow-md">
                                    <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      {loadingSongId === track.id ? (
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                          className={`w-4 h-4 rounded-full border border-white/20 ${theme.borderT}`}
                                        />
                                      ) : (
                                        <Play className="w-4 h-4 text-white fill-white scale-90 group-hover:scale-105 transition-all" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 text-left min-w-0">
                                    <h3 className={`text-xs font-semibold truncate transition-colors duration-300 ${
                                      loadingSongId === track.id ? `${theme.text} font-semibold` : 'text-white/90 group-hover:text-white transition-colors tracking-tight'
                                    }`}>
                                      {track.title}
                                    </h3>
                                    <p className="text-[10px] text-white/40 truncate mt-0.5 font-light">
                                      {track.artist}
                                    </p>
                                  </div>

                                  {/* Quick Add To Queue */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToQueue(track);
                                    }}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold ${theme.textLight} ${theme.bgFade} hover:${theme.bgHover} border ${theme.borderLight} hover:${theme.borderActive} rounded-full transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95 shadow-sm`}
                                    title="Add to queue"
                                  >
                                    <Plus className={`w-3 h-3 ${theme.text}`} />
                                    <span>Queue</span>
                                  </button>
                                </motion.div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      /* Search Results List with Glowing Premium Clickable Artist Profile Card */
                      <>
                        {shouldShowArtistCard(searchQuery) && verifiedArtist && (
                          (() => {
                            const artist = verifiedArtist;
                            const isFocused = focusedResultIndex === 0;
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleViewArtistProfile(artist)}
                                className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br ${theme.fromGradient} to-white/[0.01] border transition-all duration-300 mb-6 flex items-center justify-between gap-6 group shadow-lg cursor-pointer active:scale-[0.99] backdrop-blur-xl w-full ${
                                  isFocused
                                    ? 'border-white/30 bg-white/[0.04] scale-[1.01]'
                                    : `${theme.borderCard} hover:${theme.borderHover} hover:${theme.fromGradientHover} hover:to-white/[0.02]`
                                }`}
                              >
                                
                                <div className="flex items-center gap-5 relative z-10">
                                  {/* Beautifully scaled-up circular avatar with emerald border */}
                                  <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 ${theme.border} flex-shrink-0 shadow-xl group-hover:scale-105 ${groupHoverBorder400_40[accentColor]} transition-all duration-300`}>
                                    <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover scale-105" />
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] md:text-xs font-bold ${theme.badgeText} tracking-wider ${theme.badgeBg} border ${theme.borderAccent} px-2 py-0.5 rounded-md uppercase`}>
                                        ✦ Verified Artist
                                      </span>
                                    </div>
                                    <h4 className={`text-base md:text-xl font-black text-white mt-1.5 ${theme.textHoverLight} transition-colors tracking-tight leading-tight`}>{artist.name}</h4>
                                    {artist.disambiguation && (
                                      <p className="text-[11px] md:text-xs text-white/60 font-semibold mt-1 leading-snug">
                                        {artist.disambiguation} {artist.country && `(${artist.country})`}
                                      </p>
                                    )}
                                    {!artist.disambiguation && artist.country && (
                                      <p className="text-[11px] md:text-xs text-white/60 font-semibold mt-1">
                                        Artist from {artist.country}
                                      </p>
                                    )}
                                    {artist.tags && artist.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {artist.tags.slice(0, 3).map((tag) => (
                                          <span
                                            key={tag}
                                            className={`text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider ${groupHoverBorder500_10[accentColor]} ${groupHoverText300_60[accentColor]} transition-colors`}
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className={`w-6 h-6 text-white/20 ${groupHoverText400[accentColor]} group-hover:translate-x-0.5 transition-all duration-300 shrink-0 self-center relative z-10`} />
                              </motion.div>
                            );
                          })()
                        )}

                        {searchResults.map((result, index) => {
                          const hasArtistCard = shouldShowArtistCard(searchQuery) && verifiedArtist;
                          const actualIndex = hasArtistCard ? index + 1 : index;
                          const isFocused = focusedResultIndex === actualIndex;

                          return (
                            <motion.div
                              key={result.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => {
                                if (!loadingSongId) handleSelectSong(result);
                              }}
                              transition={{
                                delay: index * 0.08,
                                duration: 0.4,
                                ease: [0.16, 1, 0.3, 1]
                              }}
                              className={`group relative w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl cursor-pointer ${
                                loadingSongId === result.id
                                  ? `${theme.borderActive} ${theme.bgActive}`
                                  : isFocused
                                  ? 'bg-white/[0.06] border-white/20 shadow-md scale-[1.015]'
                                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15'
                              }`}
                            >
                              {/* Subtle highlight on hover */}
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/[0.02] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                              {/* Thumbnail Container */}
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                  src={result.thumbnail}
                                  alt={result.title}
                                  className={`w-full h-full object-cover transition-opacity duration-300 ${loadingSongId === result.id ? 'opacity-40' : ''}`}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                  {loadingSongId === result.id ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                      className={`w-5 h-5 rounded-full border border-white/20 ${theme.borderT}`}
                                    />
                                  ) : (
                                    <Music className="w-5 h-5 text-white/0 group-hover:text-white/80 transition-colors" />
                                  )}
                                </div>
                              </div>

                              {/* Song Info */}
                              <div className="relative flex-1 text-left min-w-0">
                                <h3 className={`text-sm font-medium truncate transition-colors duration-300 ${
                                  loadingSongId === result.id ? `${theme.text} font-semibold` : 'text-white/75 group-hover:text-white/95'
                                }`}>
                                  {result.title}
                                </h3>
                                <p className="text-white/35 text-xs truncate mt-1">
                                  {result.artist}
                                </p>
                              </div>

                              {/* Add to queue */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToQueue(result);
                                }}
                                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 duration-200"
                                title="Add to queue"
                              >
                                <Plus className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-xs text-white/40">Queue</span>
                              </button>
                            </motion.div>
                          );
                        })}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Discreet upload option with better styling */}
              {!isSearching && searchResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center pt-4"
                >
                  <label id="upload-button" className="inline-flex items-center gap-2 cursor-pointer group">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="text-sm text-white/30 group-hover:text-white/50 transition-colors">
                      or
                    </span>
                    <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors border-b border-white/20 group-hover:border-white/40">
                      upload a file
                    </span>
                  </label>
                </motion.div>
              )}
            </motion.div>

            {/* Subtle grid overlay for depth */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px'
              }} />
            </div>


          </motion.div>
        )}

        {appState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6"
          >
            {/* Elegant, clean minimal spinner */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-8 h-8 rounded-full border border-white/10"
                style={{
                  borderTopColor: 'rgba(255, 255, 255, 0.7)',
                }}
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

        {appState === 'ready' && songData && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="size-full absolute inset-0 z-20 pointer-events-auto"
          >
            <MusicPlayer
              songData={songData}
              queue={queue}
              accentColor={accentColor}
              onAccentColorChange={setAccentColor}
              onRemoveFromQueue={handleRemoveFromQueue}
              onSelectFromQueue={handleSelectFromQueue}
              onAddToQueue={handleAddToQueue}
              onSelectSong={handleSelectSong}
              onSearch={executeSearchAPI}
              onFetchChannelUploads={executeChannelUploadsAPI}
              tourType={tourType}
              currentStep={tourStep}
              textureStyle={textureStyle}
              onTextureStyleChange={setTextureStyle}
              backgroundStyle={backgroundStyle}
              onBackgroundStyleChange={setBackgroundStyle}
              themePreset={themePreset}
              onThemePresetChange={setThemePreset}
              showVisualizer={showVisualizer}
              onShowVisualizerChange={setShowVisualizer}
              zenMode={zenMode}
              onZenModeChange={setZenMode}
              showVolumeSlider={showVolumeSlider}
              onShowVolumeSliderChange={setShowVolumeSlider}
              enable3DTilt={enable3DTilt}
              onEnable3DTiltChange={setEnable3DTilt}
              showSettingsButton={showSettingsButton}
              onShowSettingsButtonChange={setShowSettingsButton}
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
              onUrlSubmit={handleUrlSubmit}
              onBackToHome={() => {
                setAppState('landing');
                setSongData(null);
                setSearchQuery('');
                setSearchResults([]);
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
            showVisualizer={showVisualizer}
            onShowVisualizerChange={setShowVisualizer}
            zenMode={zenMode}
            onZenModeChange={setZenMode}
            showVolumeSlider={showVolumeSlider}
            onShowVolumeSliderChange={setShowVolumeSlider}
            enable3DTilt={enable3DTilt}
            onEnable3DTiltChange={setEnable3DTilt}
            showSettingsButton={showSettingsButton}
            onShowSettingsButtonChange={setShowSettingsButton}
          />
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
      <AnimatePresence>
        {showShortcutMap && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-2xl pointer-events-auto cursor-default"
            onClick={() => setShowShortcutMap(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
              className="w-[500px] rounded-[32px] border border-white/10 bg-[#0f0f11]/85 p-8 relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle top ambient color gradient */}
              <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full ${theme.bg} blur-3xl pointer-events-none`} />
              <div className={`absolute -bottom-16 -left-16 w-36 h-36 rounded-full ${theme.bgFade} blur-3xl pointer-events-none`} />

              {/* Title Header */}
              <div className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <Keyboard className={`w-5 h-5 ${theme.text}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium tracking-tight text-white/95 leading-none">Keyboard Shortcuts</h3>
                    <p className="text-[11px] font-light text-white/40 mt-1 uppercase tracking-wider">Elva Power-User Map</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcutMap(false)}
                  className="p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                  title="Close Map"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of keys */}
              <div className="space-y-4 text-xs">
                {[
                  { keys: ['Space'], desc: 'Play / Pause music' },
                  { keys: ['↑', '↓'], desc: 'Adjust volume (Premium HUD)' },
                  { keys: ['M'], desc: 'Mute / Unmute audio' },
                  { keys: ['←', '→'], desc: 'Seek 5s backward / forward' },
                  { keys: ['L'], desc: 'Flip artwork / toggle live lyrics' },
                  { keys: ['⌘', ','], desc: 'Open settings menu' },
                  { keys: ['?'], desc: 'Toggle keyboard shortcut map' },
                  { keys: ['Esc'], desc: 'Close any active overlays / map' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/[0.02]">
                    <span className="font-light text-white/60 tracking-wide">{item.desc}</span>
                    <div className="flex items-center gap-1.5">
                      {item.keys.map((k, kIdx) => (
                        <kbd 
                          key={kIdx} 
                          className="px-2.5 py-1 rounded-[6px] bg-white/[0.04] border border-white/10 text-white/80 font-mono text-[10px] uppercase font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.3)] tracking-tight min-w-[24px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <span className="text-[10px] text-white/30 font-light tracking-widest uppercase">Press ? or Esc to close at any time</span>
              </div>
            </motion.div>
          </div>
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
    </div>
  );
}

