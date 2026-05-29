import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Link as LinkIcon, Search, Plus, HelpCircle, Keyboard, X, ArrowLeft, ChevronRight, Loader2, Play, Settings } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import 'sonner/dist/styles.css';
import { MusicPlayer } from './components/MusicPlayer';
import { OnboardingTour, tourSteps } from './components/OnboardingTour';
import { AccentColor, ACCENT_THEMES } from './components/themeUtils';
import { SettingsModal } from './components/SettingsModal';
import { BrandingHeader } from './components/BrandingHeader';
import { ArtistProfileView } from './components/ArtistProfileView';
import { PlaylistDetailsView, Playlist } from './components/PlaylistDetailsView';
import { SearchSection } from './components/SearchSection';
import { DiscoverView } from './components/DiscoverView';
import { ProfileHubView } from './components/ProfileHubView';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FluidBackground } from './components/FluidBackground';

import { SearchResult, VerifiedArtist } from './types';
import {
  decodeHTMLEntities,
  getArtistDynamicColors,
  fetchWithTimeout,
  robustFetch,
  fetchFromFirstSuccessfulInstance,
  fetchVideoDetails,
  executeSearchAPI,
  executeChannelUploadsAPI,
  shouldShowArtistCard,
  getArtistName
} from './utils/apiUtils';

type AppState = 'landing' | 'processing' | 'ready';

const filterOfficialArtistTracks = (rawTracks: SearchResult[], artistName: string): SearchResult[] => {
  const nameLower = artistName.trim().toLowerCase();
  
  return rawTracks
    .filter(track => {
      const titleLower = track.title.toLowerCase();
      const trackArtistLower = track.artist.toLowerCase(); // channel title

      // 1. Teasers, trailers, vlogs, documentary, behind the scenes, live streams, interviews, reviews, reactions are always excluded
      const absoluteBlocklist = [
        'teaser', 'trailer', 'vlog', 'behind the scenes', 'bts', 'documentary', 
        'live stream', 'interview', 'reaction', 'review', '10 hours', 'loop', 'hour loop'
      ];
      if (absoluteBlocklist.some(word => titleLower.includes(word))) {
        return false;
      }

      // 2. Strict Topic Channel check: If uploader ends with - topic, prefix must match our artist name
      if (trackArtistLower.endsWith('- topic')) {
        const topicPrefix = trackArtistLower.replace(/\s*-\s*topic$/i, '').trim();
        if (!topicPrefix.includes(nameLower) && !nameLower.includes(topicPrefix)) {
          return false;
        }
      }

      // 3. Strict VEVO check: If uploader ends with vevo, prefix must match our artist
      if (trackArtistLower.endsWith('vevo')) {
        const vevoPrefix = trackArtistLower.replace(/vevo$/i, '').trim();
        if (!vevoPrefix.includes(nameLower) && !nameLower.includes(vevoPrefix)) {
          return false;
        }
      }

      // 4. Exclude generic lyrics/fan channels unless they are the official channel
      const fanChannelBlocklist = [
        'latinhype', 'lyrics', 'lyric', 'translation', 'subtitles', 'folk nepal', 
        'nepali', 'herning gang', 'reaction', 'fan', 'cover', 'tribute', 'karaoke'
      ];
      if (fanChannelBlocklist.some(word => trackArtistLower.includes(word))) {
        return false;
      }

      // 5. Exclude covers, AI folk, AI covers
      if (titleLower.includes('cover') || titleLower.includes('nepali') || titleLower.includes('ai cover') || titleLower.includes('tribute') || titleLower.includes('karaoke')) {
        return false;
      }

      // 6. Check if uploader is official or a verified collaborator
      const danishCollaborators = [
        'benny jamz', 'gilli', 'artigeardit', 'lamin', 'kundo', 'b.o.c', 'sivas', 
        'branco', 'copenhagen records', 'warner music denmark', 'sony music denmark', 
        'universal music denmark', 'kesi', 'ukendt kunstner'
      ];
      
      const isOfficialUploader = 
        trackArtistLower.includes(nameLower) ||
        trackArtistLower.includes('records') ||
        trackArtistLower.includes('music') ||
        trackArtistLower.includes('official') ||
        trackArtistLower.includes('vevo') ||
        trackArtistLower.includes('entertainment') ||
        trackArtistLower.includes('label') ||
        trackArtistLower.includes('topic') ||
        danishCollaborators.some(collab => trackArtistLower.includes(collab));

      if (!isOfficialUploader) {
        // If uploader is completely generic, require Kesi to be a separate word in the title
        const wordRegex = new RegExp(`\\b${nameLower}\\b`, 'i');
        if (!wordRegex.test(titleLower)) {
          return false;
        }

        // Exclude foreign language song titles that don't match Danish musical features
        const foreignBlockwords = ['baadae', 'storyteller', 'nepali', 'nepal', 'skiza', 'sms', 'ai folk', 'alphajiri', 'camilo', 'shawn mendes'];
        if (foreignBlockwords.some(word => titleLower.includes(word))) {
          return false;
        }
      }

      // 7. General artist matching: either uploader matches or the title has our artist as a distinct word
      let artistMatches = trackArtistLower.includes(nameLower) || nameLower.includes(trackArtistLower);
      
      if (!artistMatches && titleLower.includes(nameLower)) {
        const wordRegex = new RegExp(`\\b${nameLower}\\b`, 'i');
        if (wordRegex.test(titleLower)) {
          artistMatches = true;
        }
      }

      // Exclude foreign language tracks matching the common word 'kesi' but with foreign artist features
      const isDanishArtistKesi = nameLower === 'kesi';
      if (isDanishArtistKesi) {
        const foreignKesiBlockwords = ['camilo', 'shawn mendes', 'nviiri', 'baadae', 'nepal', 'alphajiri', 'skiza', 'folks'];
        if (foreignKesiBlockwords.some(word => titleLower.includes(word) || trackArtistLower.includes(word))) {
          return false;
        }
      }

      return artistMatches;
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
};

const SHORTCUT_ARTISTS: VerifiedArtist[] = [
  {
    name: 'KESI',
    thumbnail: 'https://cdn-images.dzcdn.net/images/artist/50656cb54b66a32d095c3e0532c9dc32/250x250-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  },
  {
    name: 'Kundo',
    thumbnail: 'https://cdn-images.dzcdn.net/images/cover/2bbca104b7dd8d14bed865e4cebf3c79/500x500-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  },
  {
    name: 'Lamin',
    thumbnail: 'https://cdn-images.dzcdn.net/images/artist/7375da7e864a9cf0bdd6add7578df724/250x250-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  },
  {
    name: 'Artigeardit',
    thumbnail: 'https://cdn-images.dzcdn.net/images/artist/54920f6d4791b6923f008effd0b3b2ef/250x250-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  }
];

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [showSettings, setShowSettings] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const targetVelocity = useRef(0);
  const rafRef = useRef<number | null>(null);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    if (scrollHeight <= 0) return;

    const progress = scrollTop / scrollHeight;
    setScrollProgress(progress);

    const now = Date.now();
    let timeDiff = now - lastScrollTime.current;
    
    // If the last scroll event was more than 100ms ago, treat this as a fresh start to avoid time division anomalies
    if (timeDiff > 100) {
      timeDiff = 16;
    }

    const distDiff = Math.abs(scrollTop - lastScrollTop.current);
    const rawVelocity = distDiff / Math.max(1, timeDiff);

    // Limit maximum instantaneous target velocity to prevent erratic multiplier spikes
    targetVelocity.current = Math.min(1.2, rawVelocity);

    lastScrollTop.current = scrollTop;
    lastScrollTime.current = now;
  };

  useEffect(() => {
    let active = true;

    const updateVelocity = () => {
      if (!active) return;

      // Slow, steady physical decay representing viscosity/friction
      targetVelocity.current *= 0.92;
      if (targetVelocity.current < 0.001) {
        targetVelocity.current = 0;
      }

      // Butter-smooth linear interpolation towards target
      setScrollVelocity((prev) => {
        if (targetVelocity.current === 0 && prev === 0) {
          return 0;
        }
        const diff = targetVelocity.current - prev;
        if (Math.abs(diff) < 0.001) {
          return targetVelocity.current;
        }
        return prev + diff * 0.06; // Fine-tuned damping factor (0.06) for organic responsiveness
      });

      rafRef.current = requestAnimationFrame(updateVelocity);
    };

    rafRef.current = requestAnimationFrame(updateVelocity);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const parseHex = (hex: string) => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  const lerpColor = (c1: string, c2: string, factor: number): string => {
    const rgb1 = parseHex(c1);
    const rgb2 = parseHex(c2);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const [favorites, setFavorites] = useState<SearchResult[]>(() => {
    try {
      const stored = localStorage.getItem('elva_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = (song: SearchResult) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === song.id);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.id !== song.id);
        toast.info('Fjernet fra favoritter', { description: song.title });
      } else {
        updated = [...prev, song];
        toast.success('Tilføjet til favoritter', { description: song.title });
      }
      localStorage.setItem('elva_favorites', JSON.stringify(updated));
      return updated;
    });
  };
  const [isIntroActive, setIsIntroActive] = useState(() => {
    const hasSeenIntro = sessionStorage.getItem('elva_intro_seen');
    return !hasSeenIntro;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Artist Profile States on Home Page
  const [selectedArtist, setSelectedArtist] = useState<VerifiedArtist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [verifiedArtist, setVerifiedArtist] = useState<VerifiedArtist | null>(null);
  const [resolvedVideoIds, setResolvedVideoIds] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('elva_resolved_video_ids');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [isVerifyingArtist, setIsVerifyingArtist] = useState(false);
  const [artistTracks, setArtistTracks] = useState<SearchResult[]>([]);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [recentArtists, setRecentArtists] = useState<VerifiedArtist[]>(() => {
    try {
      const stored = localStorage.getItem('elva_recent_artists');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load recent artists from localStorage:', e);
    }
    return SHORTCUT_ARTISTS;
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

  // Ref for the root container to performantly track and apply mouse coordinates for spotlight grids without React re-renders
  const containerRef = useRef<HTMLDivElement>(null);

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
  const artistColors = selectedArtist ? getArtistDynamicColors(selectedArtist.name) : null;

  // Helper to retrieve normalized WebGL colors representing current active context
  const getWebGLBackgroundColors = () => {
    if (selectedArtist && artistColors) {
      const nameLower = selectedArtist.name.toLowerCase();
      if (nameLower.includes('kundo')) {
        return {
          c1: '#1b3024', // Deep forest sage green base
          c2: '#5c8f72', // Sophisticated dusty sage green glow
          c3: '#2a2438', // Deep muted lavender-purple contrast shadow
        };
      }
      if (nameLower.includes('kesi')) {
        return {
          c1: '#3d261c', // Deep roasted coffee brown base
          c2: '#a88870', // Dusty warm sand / elegant linen glow
          c3: '#4a3728', // Dull dark bronze / clay contrast shadow
        };
      }
      if (nameLower.includes('lamin')) {
        return {
          c1: '#21182c', // Deep lavender-indigo slate base
          c2: '#7c638e', // Dusty glowing amethyst/lavender
          c3: '#182030', // Dull dark slate shadow
        };
      }
      return {
        c1: artistColors.accent,
        c2: artistColors.bgGlow,
        c3: '#040406',
      };
    }

    // 3-way Linear hex interpolation based on vertical scrollProgress
    const searchColors = { c1: '#1c0d2e', c2: '#3d2810', c3: '#07050d' };
    const discoverColors = { c1: '#0a2a2d', c2: '#0b1c11', c3: '#040d0e' };
    const myHubColors = { c1: '#321c4f', c2: '#12233c', c3: '#07050a' };

    if (scrollProgress <= 0.5) {
      const factor = scrollProgress / 0.5;
      return {
        c1: lerpColor(searchColors.c1, discoverColors.c1, factor),
        c2: lerpColor(searchColors.c2, discoverColors.c2, factor),
        c3: lerpColor(searchColors.c3, discoverColors.c3, factor)
      };
    } else {
      const factor = (scrollProgress - 0.5) / 0.5;
      return {
        c1: lerpColor(discoverColors.c1, myHubColors.c1, factor),
        c2: lerpColor(discoverColors.c2, myHubColors.c2, factor),
        c3: lerpColor(discoverColors.c3, myHubColors.c3, factor)
      };
    }
  };

  const bgColors = getWebGLBackgroundColors();

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
  const [recentlyPlayed, setRecentlyPlayed] = useState<SearchResult[]>(() => {
    try {
      const stored = localStorage.getItem('elva_recently_played');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to load recently played tracks:', e);
      return [];
    }
  });

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

  // Reset selected artist if search query changes
  useEffect(() => {
    setSelectedArtist(null);
    setArtistTracks([]);
    setVerifiedArtist(null);
    setIsVerifyingArtist(false);
  }, [searchQuery]);

  const isFirstVisit = useRef(!sessionStorage.getItem('elva_intro_seen')).current;
  const hasSelectedArtistOnce = useRef(false);





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



  // Verify artist via MusicBrainz API in background to enrich metadata
  useEffect(() => {
    let active = true;
    
    const verifyArtist = async () => {
      if (!shouldShowArtistCard(searchQuery) || searchResults.length === 0) {
        setVerifiedArtist(null);
        return;
      }
      
      // Get candidate artist from search results using local heuristics
      const candidate = getArtistName(searchQuery, searchResults);
      if (!candidate) {
        setVerifiedArtist(null);
        return;
      }

      // 1. Instantly display the Verified Artist Card (0ms delay) to prevent lag!
      setVerifiedArtist({
        name: candidate.name,
        thumbnail: candidate.thumbnail,
        channelId: candidate.channelId,
        isTopic: candidate.isTopic
      });

      setIsVerifyingArtist(true);
      try {
        const queryVal = candidate.name.trim();
        // 2. Query MusicBrainz silently in the background with a tight 2.5s timeout
        const response = await fetchWithTimeout(
          `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(queryVal)}&fmt=json`,
          {
            headers: {
              'User-Agent': 'ElvaMusicApp/1.0 ( contact@elva.fm )'
            },
            timeout: 2500 // Tight timeout to prevent hanging on slow MB servers
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
          return score >= 85 && (nameLower === queryLower || nameLower.includes(queryLower) || queryLower.includes(nameLower));
        });
        
        if (matchedArtist && active) {
          const tagsList = (matchedArtist.tags || [])
            .filter((t: any) => (t.count || 0) > 0)
            .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
            .map((t: any) => t.name)
            .slice(0, 3);
            
          // 3. Silently merge MusicBrainz metadata (disambiguation, tags, country)
          setVerifiedArtist(prev => prev ? {
            ...prev,
            disambiguation: matchedArtist.disambiguation || undefined,
            country: matchedArtist.country || undefined,
            tags: tagsList.length > 0 ? tagsList : undefined
          } : null);
        }
      } catch (error) {
        console.warn('Background MusicBrainz metadata enrichment failed:', error);
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
    hasSelectedArtistOnce.current = true;
    
    // Save to recent artists (unique list capped at 4)
    setRecentArtists(prev => {
      const filtered = prev.filter(a => a.name.toLowerCase() !== artist.name.toLowerCase());
      const updated = [artist, ...filtered].slice(0, 4);
      try {
        localStorage.setItem('elva_recent_artists', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save recent artists to localStorage:', e);
      }
      return updated;
    });
    
    // 1. Instant pre-population from currently active search results to eliminate any loading delay
    const nameLower = artist.name.toLowerCase();
    const matchingResults = searchResults.filter(track => {
      const trackArtistLower = (track.artist || '').toLowerCase();
      const trackTitleLower = (track.title || '').toLowerCase();
      
      // Strict matching for pre-population
      let artistMatches = trackArtistLower.includes(nameLower) || nameLower.includes(trackArtistLower);
      if (!artistMatches && trackTitleLower.includes(nameLower)) {
        const isCamilo = trackArtistLower.includes('camilo');
        const isExactTitleMatchDiffArtist = trackTitleLower.trim() === nameLower;
        if (!isCamilo && !isExactTitleMatchDiffArtist) {
          artistMatches = true;
        }
      }
      return artistMatches;
    });

    if (matchingResults.length > 0) {
      setArtistTracks(matchingResults);
    } else {
      setArtistTracks([]);
    }
    
    setIsLoadingArtist(true);
    
    try {
      let resolvedChannelId = artist.channelId;
      let resolvedAvatar = artist.thumbnail;
      let resolvedIsTopic = artist.isTopic || false;

      // 2. Resolve channelId if missing
      if (!resolvedChannelId) {
        // Query specifically for the artist's Topic channel on YouTube to find their verified ID
        const searchCandidates = await executeSearchAPI(`${artist.name} topic`, 5);
        if (searchCandidates.length > 0) {
          const candidate = getArtistName(artist.name, searchCandidates);
          if (candidate) {
            resolvedChannelId = candidate.channelId;
            resolvedAvatar = candidate.thumbnail;
            resolvedIsTopic = candidate.isTopic || false;
          } else {
            // Find any result where uploader matches artist name
            const match = searchCandidates.find(t => t.artist.toLowerCase().includes(nameLower));
            if (match) {
              resolvedChannelId = match.channelId;
              resolvedAvatar = match.thumbnail;
            } else {
              resolvedChannelId = searchCandidates[0].channelId;
              resolvedAvatar = searchCandidates[0].thumbnail;
            }
          }
        }
      }

      let rawTracks: SearchResult[] = [];

      // 3. Fetch from official channel uploads ONLY (100% correct, no guesswork)
      if (resolvedChannelId) {
        try {
          rawTracks = await executeChannelUploadsAPI(resolvedChannelId, 50);
        } catch (e) {
          console.warn("Failed to fetch from channel uploads, trying fallback search:", e);
        }
      }

      // 4. Fallback ONLY if channel uploads returned absolutely nothing or channelId is completely missing
      if (rawTracks.length === 0) {
        const searchResults1 = await executeSearchAPI(artist.name, 50);
        const searchResults2 = await executeSearchAPI(`${artist.name} topic`, 50);
        
        const seenIds = new Set<string>();
        const combined: SearchResult[] = [];
        for (const track of [...searchResults1, ...searchResults2]) {
          if (track && track.id && !seenIds.has(track.id)) {
            seenIds.add(track.id);
            const uploaderLower = track.artist.toLowerCase();
            const titleLower = track.title.toLowerCase();
            
            // Exclude foreign or irrelevant uploads for Kesi
            if (artist.name.toLowerCase() === 'kesi') {
              const foreignBlock = ['camilo', 'shawn mendes', 'nviiri', 'baadae', 'nepal', 'alphajiri', 'skiza', 'folks'];
              if (foreignBlock.some(word => titleLower.includes(word) || uploaderLower.includes(word))) {
                continue;
              }
            }

            // Require uploader channel name to contain artist name (case-insensitive) to prevent irrelevant matches
            if (uploaderLower.includes(nameLower) || nameLower.includes(uploaderLower)) {
              combined.push(track);
            }
          }
        }
        rawTracks = combined;
      }

      // Map and clean up titles for display
      const cleaned = rawTracks.map(track => {
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

      // Save/update verified channel information in UI and recent artists list
      if (resolvedChannelId && (resolvedChannelId !== artist.channelId || resolvedAvatar !== artist.thumbnail)) {
        const updated = {
          ...artist,
          channelId: resolvedChannelId,
          thumbnail: resolvedAvatar,
          isTopic: resolvedIsTopic
        };
        setSelectedArtist(updated);
        
        setRecentArtists(prev => {
          const filtered = prev.filter(a => a.name.toLowerCase() !== artist.name.toLowerCase());
          const updatedList = [updated, ...filtered].slice(0, 4);
          try {
            localStorage.setItem('elva_recent_artists', JSON.stringify(updatedList));
          } catch (e) {}
          return updatedList;
        });
      }

      // Silently merge MusicBrainz metadata for enrichment
      try {
        const mbRes = await fetchWithTimeout(
          `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist.name)}&fmt=json`,
          {
            headers: { 'User-Agent': 'ElvaMusicApp/1.0 ( contact@elva.fm )' },
            timeout: 2500
          }
        );
        if (mbRes.ok) {
          const mbData = await mbRes.json();
          const artists = mbData.artists || [];
          const matchedArtist = artists.find((a: any) => {
            const nLower = (a.name || '').toLowerCase();
            return (a.score || 0) >= 85 && (nLower === nameLower || nLower.includes(nameLower) || nameLower.includes(nLower));
          });
          if (matchedArtist) {
            const tagsList = (matchedArtist.tags || [])
              .filter((t: any) => (t.count || 0) > 0)
              .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
              .map((t: any) => t.name)
              .slice(0, 3);
            setSelectedArtist(prev => prev ? {
              ...prev,
              disambiguation: matchedArtist.disambiguation || undefined,
              country: matchedArtist.country || undefined,
              tags: tagsList.length > 0 ? tagsList : undefined
            } : null);
          }
        }
      } catch (mbErr) {
        console.warn("Background MB enrichment failed during profile navigation:", mbErr);
      }

    } catch (error) {
      console.error('Failed to load artist profile tracks:', error);
      toast.error(`Could not fetch official releases for ${artist.name}`);
    } finally {
      setIsLoadingArtist(false);
    }
  };

  const handleViewArtistByName = async (artistName: string, channelId?: string) => {
    const nameTrimmed = artistName.trim();
    if (!nameTrimmed || nameTrimmed === 'Unknown Artist' || nameTrimmed === 'Web Stream') {
      toast.error('Ugyldig kunstner');
      return;
    }

    // 1. Instant check if we already have this artist pre-resolved in state
    if (verifiedArtist && verifiedArtist.name.toLowerCase() === nameTrimmed.toLowerCase()) {
      handleViewArtistProfile(verifiedArtist);
      return;
    }
    const foundInRecent = recentArtists.find(a => a.name.toLowerCase() === nameTrimmed.toLowerCase());
    if (foundInRecent) {
      handleViewArtistProfile(foundInRecent);
      return;
    }

    // 2. Initialize a high-fidelity temporary VerifiedArtist object
    const tempArtist: VerifiedArtist = {
      name: nameTrimmed,
      thumbnail: songData?.artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtdXNpYyUyMGJhY2tncm91bmR8ZW58MHx8fDE3Nzg5Nzk5NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      channelId: channelId,
    };

    // 3. Just let handleViewArtistProfile do the heavy lifting!
    handleViewArtistProfile(tempArtist);
  };

  const handleSearch = async (overrideQuery?: string) => {
    const query = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!query.trim()) return;

    setIsSearching(true);
    const results = await executeSearchAPI(query);
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
      videoId: targetSong.videoId || undefined,
      channelId: targetSong.channelId
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

  const handleSelectSong = async (result: SearchResult) => {
    let finalVideoId = result.videoId || resolvedVideoIds[result.id];
    let finalArtwork = result.thumbnail;

    // If it's a dynamic live chart song (no preloaded videoId), resolve it on the fly!
    if (!finalVideoId) {
      setLoadingSongId(result.id);
      setAppState('processing');
      try {
        const query = `${result.artist} ${result.title} audio`;
        const resolved = await executeSearchAPI(query, 5);
        if (resolved && resolved.length > 0) {
          finalVideoId = resolved[0].videoId;
          
          // Cache resolved videoId for lightning-fast subsequent plays
          setResolvedVideoIds(prev => {
            const next = { ...prev, [result.id]: finalVideoId };
            localStorage.setItem('elva_resolved_video_ids', JSON.stringify(next));
            return next;
          });

          if (!finalArtwork) {
            finalArtwork = resolved[0].thumbnail;
          }
        } else {
          toast.error("Kunne ikke afspille sang", {
            description: "Der blev ikke fundet nogen lydstrøm på YouTube."
          });
          setLoadingSongId(null);
          setAppState('landing');
          return;
        }
      } catch (e) {
        console.error("Failed to dynamically resolve YouTube video ID:", e);
        toast.error("Fejl ved afspilning", {
          description: "Kunne ikke hente lydstrømmen for sangen."
        });
        setLoadingSongId(null);
        setAppState('landing');
        return;
      }
    }

    // Save to nyligt afspillede history
    saveRecentlyPlayed({
      ...result,
      videoId: finalVideoId,
      thumbnail: finalArtwork
    });

    if (appState === 'ready') {
      setSongData({
        title: result.title,
        artist: result.artist,
        artworkUrl: finalArtwork,
        audioUrl: `https://www.youtube.com/watch?v=${finalVideoId}`,
        videoId: finalVideoId,
        channelId: result.channelId
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
          artworkUrl: finalArtwork,
          audioUrl: `https://www.youtube.com/watch?v=${finalVideoId}`,
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

    // Preload image before transitioning
    const img = new Image();
    img.src = finalArtwork;
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

  const isSearchMode = searchQuery.trim() !== '' || selectedArtist !== null || selectedPlaylist !== null;

  return (
    <div ref={containerRef} className="size-full relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center">

      {/* Premium Multi-Color Ambient Background & Vector Grid (Shadcn & Cinematic inspired) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 overflow-hidden"
      >
        {/* High-Precision Architectural Grid with Intersecting Crosses (Shadcn style) */}
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

        {/* Interactive Spotlight Blueprint coordinates grid (Lights up near cursor) */}
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



        {/* Live WebGL Fluid Background with Dynamic Color Binding */}
        <FluidBackground 
          color1={bgColors.c1} 
          color2={bgColors.c2} 
          color3={bgColors.c3} 
          speedMultiplier={
            (backgroundStyle === 'liquid' ? 1.4 : backgroundStyle === 'mesh' ? 0.8 : backgroundStyle === 'particles' ? 1.1 : 0.5) +
            Math.min(2.0, scrollVelocity * 15.0)
          }
        />

      </motion.div>

      <AnimatePresence>
        {appState === 'landing' && (
          <motion.div
            key="landing"
            layout
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 flex flex-col items-center px-0 w-full h-full justify-start"
          >
            {/* Animated gradient orbs during intro */}
            {isIntroActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.2, 0.3, 0], scale: [0.8, 1.25, 1.55, 2.1] }}
                transition={{ duration: 3, ease: "easeOut" }}
                className="absolute w-[950px] h-[950px] rounded-full blur-[140px] bg-gradient-to-tr from-indigo-950/20 via-blue-900/10 to-transparent pointer-events-none z-0"
              />
            )}

            {/* Localized deep dark radial gradient vignette centered behind UI elements for razor-sharp readability */}
            {selectedArtist === null && selectedPlaylist === null && searchQuery.trim() === '' && (
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[880px] h-[520px] rounded-full pointer-events-none z-0 opacity-[0.04]" 
                style={{
                  background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.45) 45%, rgba(0,0,0,0) 80%)',
                  filter: 'blur(35px)'
                }}
              />
            )}

            {/* Fixed Branding Tag */}
            {selectedArtist === null && selectedPlaylist === null && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: scrollProgress > 0.15 ? 1 : 0, 
                  y: scrollProgress > 0.15 ? 0 : -10 
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="fixed top-6 left-6 z-40 select-none"
                style={{ pointerEvents: scrollProgress > 0.15 ? 'auto' : 'none' }}
              >
                <button
                  onClick={() => {
                    const container = scrollContainerRef.current;
                    if (container) {
                      container.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className="text-2xl font-normal tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60 hover:opacity-80 cursor-pointer transition-all focus:outline-none"
                  style={{ fontFamily: '"Kaobe", serif' }}
                >
                  Elva
                </button>
              </motion.div>
            )}

            {/* Floating Dot Navigator */}
            {selectedArtist === null && selectedPlaylist === null && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-40"
              >
                {[
                  { id: 'search', label: 'Search & Home' },
                  { id: 'discover', label: 'Discover Charts' },
                  { id: 'myhub', label: 'My Hub Profile' }
                ].map((dot, index) => {
                  let isActive = false;
                  if (index === 0 && scrollProgress < 0.25) isActive = true;
                  else if (index === 1 && scrollProgress >= 0.25 && scrollProgress < 0.75) isActive = true;
                  else if (index === 2 && scrollProgress >= 0.75) isActive = true;

                  const handleDotClick = () => {
                    const container = scrollContainerRef.current;
                    if (container) {
                      container.scrollTo({
                        top: index * container.clientHeight,
                        behavior: 'smooth'
                      });
                    }
                  };

                  return (
                    <button
                      key={dot.id}
                      onClick={handleDotClick}
                      className="group relative flex items-center justify-end cursor-pointer focus:outline-none bg-transparent border-none p-0"
                      title={dot.label}
                    >
                      {/* Label Tooltip */}
                      <span className="absolute right-8 text-[10px] font-semibold uppercase tracking-widest text-white/40 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/5 whitespace-nowrap pointer-events-none select-none">
                        {dot.label}
                      </span>
                      
                      {/* Interactive Dot */}
                      <div className="relative flex items-center justify-center w-6 h-6">
                        <motion.div
                          animate={{
                            scale: isActive ? 1.25 : 1,
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                            boxShadow: isActive 
                              ? `0 0 15px rgba(255, 255, 255, 0.6), 0 0 5px rgba(255, 255, 255, 0.3)`
                              : 'none'
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="w-2 h-2 rounded-full border border-white/10 group-hover:bg-white/40 transition-colors"
                        />
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Immersive Widescreen Overlay Details Views */}
            <AnimatePresence>
              {selectedArtist && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="fixed inset-0 z-30 bg-[#0a0a0c]/90 backdrop-blur-2xl flex flex-col items-center justify-center pt-8 pb-12"
                >
                  <ArtistProfileView
                    selectedArtist={selectedArtist}
                    artistColors={artistColors}
                    artistTracks={artistTracks}
                    isLoadingArtist={isLoadingArtist}
                    focusedResultIndex={focusedResultIndex}
                    loadingSongId={loadingSongId}
                    handleSelectSong={handleSelectSong}
                    handleAddToQueue={handleAddToQueue}
                    setSelectedArtist={setSelectedArtist}
                    setArtistTracks={setArtistTracks}
                    theme={theme}
                  />
                </motion.div>
              )}

              {selectedPlaylist && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="fixed inset-0 z-30 bg-[#0a0a0c]/90 backdrop-blur-2xl flex flex-col items-center justify-center pt-8 pb-12"
                >
                  <PlaylistDetailsView
                    playlist={selectedPlaylist}
                    onClose={() => setSelectedPlaylist(null)}
                    loadingSongId={loadingSongId}
                    handleSelectSong={handleSelectSong}
                    handleAddToQueue={handleAddToQueue}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    accentColor={accentColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Stack Viewport Snap-Scrolling Container */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={`w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-none flex flex-col relative z-10 transition-all duration-500 ${
                selectedArtist !== null || selectedPlaylist !== null
                  ? 'opacity-0 pointer-events-none invisible'
                  : 'opacity-100'
              }`}
            >
              {/* SECTION 1: Search & Home */}
              <section className="w-full h-full snap-start shrink-0 flex flex-col items-center justify-start relative px-0 pt-16 pb-24 overflow-y-auto scrollbar-none">
                <div className="w-full flex flex-col items-center overflow-hidden shrink-0">
                  <div className="h-6 md:h-10 shrink-0 w-full" />
                  <BrandingHeader
                    accentColor={accentColor}
                    hasSeenTour={hasSeenTour}
                    tourType={tourType}
                    startTour={startTour}
                    isFirstVisit={isFirstVisit}
                    hasSelectedArtist={hasSelectedArtistOnce.current}
                  />
                </div>
                
                <div className="w-full flex flex-col items-center justify-start mt-6">
                  <SearchSection
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isSearching={isSearching}
                    searchResults={searchResults}
                    recentArtists={recentArtists}
                    recentlyPlayed={recentlyPlayed}
                    verifiedArtist={verifiedArtist}
                    focusedResultIndex={focusedResultIndex}
                    loadingSongId={loadingSongId}
                    handleViewArtistProfile={handleViewArtistProfile}
                    handleUrlSubmit={handleUrlSubmit}
                    handleSearch={handleSearch}
                    handleSelectSong={handleSelectSong}
                    handleAddToQueue={handleAddToQueue}
                    handleFileSelect={handleFileSelect}
                    theme={theme}
                    isFirstVisit={isFirstVisit}
                    hasSelectedArtist={hasSelectedArtistOnce.current}
                  />
                </div>
              </section>

              {/* SECTION 2: Discover */}
              <section className="w-full h-full snap-start shrink-0 flex flex-col items-center justify-start relative px-0 pt-16 pb-24 overflow-y-auto scrollbar-none">
                {/* Custom Section Header */}
                <div className="w-full max-w-[898px] px-6 mb-4 flex items-center justify-between shrink-0 select-none">
                  <h2 className="text-2xl font-normal tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60" style={{ fontFamily: '"Kaobe", serif' }}>
                    Discover
                  </h2>
                </div>

                <DiscoverView
                  onSelectSong={handleSelectSong}
                  onAddToQueue={handleAddToQueue}
                  accentColor={accentColor}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onSelectPlaylist={(playlist) => setSelectedPlaylist(playlist)}
                />
              </section>

              {/* SECTION 3: My Hub */}
              <section className="w-full h-full snap-start shrink-0 flex flex-col items-center justify-start relative px-0 pt-16 pb-24 overflow-y-auto scrollbar-none">
                {/* Custom Section Header */}
                <div className="w-full max-w-[898px] px-6 mb-4 flex items-center justify-between shrink-0 select-none">
                  <h2 className="text-2xl font-normal tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60" style={{ fontFamily: '"Kaobe", serif' }}>
                    My Hub
                  </h2>
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Your Personal Vibe</span>
                </div>

                <ProfileHubView
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onSelectSong={handleSelectSong}
                  onAddToQueue={handleAddToQueue}
                  accentColor={accentColor}
                />
              </section>
            </div>

            {/* Subtle grid overlay for depth */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.015] z-0">
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
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSearch={executeSearchAPI}
              onFetchChannelUploads={executeChannelUploadsAPI}
              onViewArtist={handleViewArtistByName}
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
      <KeyboardShortcutsModal
        isOpen={showShortcutMap}
        onClose={() => setShowShortcutMap(false)}
        accentColor={accentColor}
      />



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

      {/* Premium Global Matte-Paper/Dots Texture Overlay (Placed on top of everything at z-[150] for uniform tactile paper finish) */}
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

