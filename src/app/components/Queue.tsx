import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, X, Search, Plus, Play, Upload, Loader2, Link as LinkIcon, AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 4000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
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

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
  channelId?: string;
}

interface QueueProps {
  items: QueueItem[];
  currentSongId?: string;
  accentColor?: AccentColor;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  focusSearchOnMount?: boolean;
  onSearch?: (query: string, limit?: number) => Promise<SearchResult[]>;
  onFetchChannelUploads?: (channelId: string, limit?: number) => Promise<SearchResult[]>;
  onAddToQueue?: (song: SearchResult) => void;
  onSelectSong?: (song: SearchResult) => void;
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
}

export function Queue({
  items,
  currentSongId,
  accentColor = 'emerald',
  onRemove,
  onSelect,
  onClose,
  focusSearchOnMount = false,
  onSearch,
  onFetchChannelUploads,
  onAddToQueue,
  onSelectSong,
  onFileSelect,
  onUrlSubmit
}: QueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme = ACCENT_THEMES[accentColor];

  const fromAccent03: Record<AccentColor, string> = {
    emerald: 'from-emerald-500/[0.03]',
    sand: 'from-amber-500/[0.03]',
    wine: 'from-rose-500/[0.03]',
    navy: 'from-slate-500/[0.04]'
  };

  const fromAccent02: Record<AccentColor, string> = {
    emerald: 'from-emerald-500/[0.02]',
    sand: 'from-amber-500/[0.02]',
    wine: 'from-rose-500/[0.02]',
    navy: 'from-slate-500/[0.03]'
  };

  const fromAccent05: Record<AccentColor, string> = {
    emerald: 'from-emerald-500/[0.05]',
    sand: 'from-amber-500/[0.05]',
    wine: 'from-rose-500/[0.05]',
    navy: 'from-slate-500/[0.06]'
  };

  const hoverFromAccent05: Record<AccentColor, string> = {
    emerald: 'hover:from-emerald-500/[0.05]',
    sand: 'hover:from-amber-500/[0.05]',
    wine: 'hover:from-rose-500/[0.05]',
    navy: 'hover:from-slate-500/[0.06]'
  };

  const borderAccent10: Record<AccentColor, string> = {
    emerald: 'border-emerald-500/10',
    sand: 'border-amber-500/10',
    wine: 'border-rose-500/10',
    navy: 'border-slate-500/15'
  };

  const borderAccent20: Record<AccentColor, string> = {
    emerald: 'border-emerald-500/20',
    sand: 'border-amber-500/20',
    wine: 'border-rose-500/20',
    navy: 'border-slate-500/25'
  };

  const borderAccent25: Record<AccentColor, string> = {
    emerald: 'border-emerald-500/25',
    sand: 'border-amber-500/25',
    wine: 'border-rose-500/25',
    navy: 'border-slate-500/30'
  };

  const textAccent300: Record<AccentColor, string> = {
    emerald: 'text-emerald-300/90',
    sand: 'text-amber-200/90',
    wine: 'text-rose-300/90',
    navy: 'text-slate-300/90'
  };

  const textAccent400: Record<AccentColor, string> = {
    emerald: 'text-emerald-300',
    sand: 'text-amber-200',
    wine: 'text-rose-300',
    navy: 'text-slate-350'
  };

  const bgAccent10: Record<AccentColor, string> = {
    emerald: 'bg-emerald-950/20',
    sand: 'bg-amber-950/20',
    wine: 'bg-rose-950/20',
    navy: 'bg-slate-900/25'
  };

  const bgAccent20: Record<AccentColor, string> = {
    emerald: 'bg-emerald-950/30',
    sand: 'bg-amber-950/30',
    wine: 'bg-rose-950/30',
    navy: 'bg-slate-900/35'
  };

  const bgAccent05: Record<AccentColor, string> = {
    emerald: 'bg-emerald-950/10',
    sand: 'bg-amber-950/10',
    wine: 'bg-rose-950/10',
    navy: 'bg-slate-950/10'
  };

  const bgAccent15: Record<AccentColor, string> = {
    emerald: 'bg-emerald-950/25',
    sand: 'bg-amber-950/25',
    wine: 'bg-rose-950/25',
    navy: 'bg-slate-900/30'
  };

  const bgAccent400: Record<AccentColor, string> = {
    emerald: 'bg-emerald-300',
    sand: 'bg-amber-200',
    wine: 'bg-rose-300',
    navy: 'bg-slate-300'
  };

  const hoverBgAccent15: Record<AccentColor, string> = {
    emerald: 'hover:bg-emerald-500/15',
    sand: 'hover:bg-amber-500/15',
    wine: 'hover:bg-rose-500/15',
    navy: 'hover:bg-slate-500/20'
  };

  const hoverBorderAccent20: Record<AccentColor, string> = {
    emerald: 'hover:border-emerald-500/20',
    sand: 'hover:border-amber-500/20',
    wine: 'hover:border-rose-500/20',
    navy: 'hover:border-slate-500/25'
  };

  const groupHoverBorderAccent10: Record<AccentColor, string> = {
    emerald: 'group-hover:border-emerald-500/10',
    sand: 'group-hover:border-amber-500/10',
    wine: 'group-hover:border-rose-500/10',
    navy: 'group-hover:border-slate-500/15'
  };

  const groupHoverTextAccent300: Record<AccentColor, string> = {
    emerald: 'group-hover:text-emerald-300',
    sand: 'group-hover:text-amber-300',
    wine: 'group-hover:text-rose-300',
    navy: 'group-hover:text-slate-300'
  };

  const groupHoverTextAccent400: Record<AccentColor, string> = {
    emerald: 'group-hover:text-emerald-400',
    sand: 'group-hover:text-amber-500',
    wine: 'group-hover:text-rose-500',
    navy: 'group-hover:text-slate-400'
  };

  const groupHoverTextAccent300_60: Record<AccentColor, string> = {
    emerald: 'group-hover:text-emerald-300/60',
    sand: 'group-hover:text-amber-300/60',
    wine: 'group-hover:text-rose-300/60',
    navy: 'group-hover:text-slate-300/60'
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

  const [selectedArtist, setSelectedArtist] = useState<VerifiedArtist | null>(null);
  const [verifiedArtist, setVerifiedArtist] = useState<VerifiedArtist | null>(null);
  const [isVerifyingArtist, setIsVerifyingArtist] = useState(false);
  const [artistTracks, setArtistTracks] = useState<SearchResult[]>([]);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);

  // Reset selected artist if search query changes
  useEffect(() => {
    setSelectedArtist(null);
    setArtistTracks([]);
    setVerifiedArtist(null);
    setIsVerifyingArtist(false);
  }, [searchQuery]);

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
    
    // Completely dynamic heuristic. An uploader is identified as a real artist profile if:
    // 1. Their channel/uploader name exactly matches the query (ignoring case/whitespace)
    // 2. Or their channel name matches official music channel patterns (e.g. "Kesi - Topic", "KesiVEVO", "Kesi Official")
    // 3. Or their channel name contains the query AND contains official indicator words (e.g. topic, vevo, official, music, band)
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
      // Clean up the artist name (remove " - Topic", "VEVO", "Official", etc.)
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
    
    // If no channel matches these high-confidence music profiles, suppress the card.
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
        
        // Find if there is any artist matching the query in MusicBrainz with high confidence
        const matchedArtist = artists.find((artist: any) => {
          const nameLower = (artist.name || '').toLowerCase();
          const score = artist.score || 0;
          
          // Must have high confidence score and closely match the name
          const isHighConfidence = score >= 90;
          const isNameMatch = nameLower === queryLower || nameLower.includes(queryLower) || queryLower.includes(nameLower);
          
          return isHighConfidence && isNameMatch;
        });
        
        if (matchedArtist) {
          // Extract top tags
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
          // If no high-confidence artist exists in the global DB, suppress the card!
          setVerifiedArtist(null);
        }
      } catch (error) {
        console.warn('MusicBrainz verification failed, using local heuristics fallback:', error);
        if (active) {
          // Fallback on network/rate-limiting errors to ensure app usability
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
      if (apiKey && artist.channelId && !artist.isTopic && onFetchChannelUploads) {
        // Query the exact channel uploads playlist (100% deterministic, no loose search)
        rawTracks = await onFetchChannelUploads(artist.channelId, 50);
      }
      
      // If we got no tracks from the channel uploads (common on Piped/Invidious fallbacks for topic channels),
      // or if there is no channelId, fall back to robust search-based retrieval.
      if (rawTracks.length === 0 && onSearch) {
        rawTracks = await onSearch(`${artist.name} topic`, 50);
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

  // Auto-focus search input if requested on mount
  useEffect(() => {
    if (focusSearchOnMount && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300); // Small timeout to wait for slide-in animation
    }
  }, [focusSearchOnMount]);

  // If search query is cleared, clear search results to return to the Queue view
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Check if it's a URL
    if (searchQuery.match(/^https?:\/\//)) {
      if (onUrlSubmit) {
        onUrlSubmit(searchQuery);
        setSearchQuery('');
        onClose();
        toast.success("Streaming from URL started!");
      }
      return;
    }

    if (!onSearch) return;

    setIsSearching(true);
    try {
      const results = await onSearch(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("No songs found", {
          description: "Try searching for a different title or artist."
        });
      }
    } catch (error) {
      console.error('Sidebar search failed:', error);
      toast.error("Search failed", {
        description: "Please check your network connection and try again."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      onClose();
      toast.success(`Playing local file: ${file.name}`);
    }
  };

  const handleAddSongToQueue = (e: React.MouseEvent, song: SearchResult) => {
    e.stopPropagation();
    if (onAddToQueue) {
      onAddToQueue(song);
    }
  };

  return (
    <>
      {/* Backdrop: translucent dark overlay with smooth fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onClick={onClose}
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-40 cursor-pointer pointer-events-auto"
      />

      {/* Side Panel Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-neutral-950/40 backdrop-blur-3xl border-l border-white/10 z-50 flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.65)] pointer-events-auto overflow-hidden"
      >
        {/* Ambient background glow reflecting theme colors */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 100% 10%, var(--theme-primary) 0%, transparent 60%), radial-gradient(circle at 100% 90%, var(--theme-secondary) 0%, transparent 60%)'
          }}
        />

        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 z-10 bg-black/10">
          <div className="flex items-center gap-2">
            {selectedArtist ? (
              <button
                onClick={() => {
                  setSelectedArtist(null);
                  setArtistTracks([]);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white mr-1 transition-colors cursor-pointer"
                title="Back to search results"
              >
                <ArrowLeft className="w-4 h-4 animate-pulse" />
              </button>
            ) : (
              <Music className="w-4 h-4 text-white/60" />
            )}
            <span className="text-sm font-semibold tracking-wide text-white/90">
              {selectedArtist
                ? "Artist Profile"
                : searchQuery.trim() && searchResults.length > 0
                ? "Search Results"
                : "Up Next"}
            </span>
            {!selectedArtist && !searchQuery.trim() && (
              <span className="text-xs text-white/40 font-light">({items.length} songs)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-white/40 hover:text-white/60" />
          </button>
        </div>

        {/* Unified Search & Upload Bar (collapses smoothly when viewing Artist Profile) */}
        <AnimatePresence>
          {!selectedArtist && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="relative px-5 py-4 border-b border-white/5 shrink-0 z-10 flex gap-2 bg-black/5 overflow-hidden"
            >
              <div className="relative flex-1">
                <button
                  onClick={handleSearch}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-all cursor-pointer z-10"
                  title="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search or paste link..."
                  className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:border-white/15 focus:border-white/20 text-white placeholder-white/35 text-xs focus:outline-none transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white/60 transition-colors z-10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick upload button */}
              <button
                onClick={handleUploadClick}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 active:scale-95 transition-all text-white/50 hover:text-white shrink-0 cursor-pointer flex items-center justify-center"
                title="Upload audio file"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-none relative z-10">
          <AnimatePresence mode="wait">
            {isLoadingArtist ? (
              /* Artist Loading Spinner */
              <motion.div
                key="artist-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <Loader2 className="w-8 h-8 text-white/60 animate-spin mb-3 animate-bounce" />
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
                <div className={`relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-br ${fromAccent03[accentColor]} to-white/[0.01] border border-white/8 flex items-center justify-between gap-3 w-full shadow-lg group hover:bg-white/[0.03] transition-all duration-300`}>
                  {/* Inner premium accent glow matching Queue styling */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${fromAccent02[accentColor]} to-transparent pointer-events-none`}
                    style={{
                      maskImage: 'linear-gradient(to right, black, transparent)',
                      WebkitMaskImage: 'linear-gradient(to right, black, transparent)'
                    }}
                  />
                  
                  <div className="relative flex items-center gap-3 min-w-0 z-10">
                    {/* Avatar with hover scale - scaled up to w-16 h-16 and circular */}
                    <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${borderAccent20[accentColor]} flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                      <img src={selectedArtist.thumbnail} alt={selectedArtist.name} className="w-full h-full object-cover scale-105" />
                    </div>
                    
                    {/* Artist Info */}
                    <div className="flex flex-col text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className={`text-sm font-extrabold text-white tracking-tight truncate leading-none ${groupHoverTextAccent300[accentColor]} transition-colors`}>{selectedArtist.name}</h2>
                        <span className={`text-[10px] font-bold ${textAccent300[accentColor]} tracking-wider ${bgAccent10[accentColor]} ${borderAccent20[accentColor]} px-1.5 py-0.5 rounded-md uppercase shrink-0`}>
                          ✦ Verified Artist
                        </span>
                      </div>
                      
                      {selectedArtist.disambiguation && (
                        <p className="text-[9px] text-white/50 truncate mt-1.5 font-medium leading-none">
                          {selectedArtist.disambiguation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Styled Official Discography Divider Header for Sidebar Drawer */}
                <div className="flex items-center justify-between px-2 py-1.5 mt-3 mb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] ${textAccent400[accentColor]} font-bold uppercase tracking-wider`}>Official Discography</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-md">
                    Verified
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
                    artistTracks.map((track, index) => (
                      <motion.div
                        key={`artist-track-${track.id}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, ease: "easeOut" }}
                        onClick={() => {
                          if (onSelectSong) {
                            onSelectSong(track);
                            onClose();
                          }
                        }}
                        className="group w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer"
                      >
                        {/* Thumbnail with hover play icon */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5 shadow-md">
                          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white scale-90 group-hover:scale-100 transition-all" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="text-xs font-semibold text-white/90 truncate group-hover:text-white transition-colors tracking-tight">
                            {track.title}
                          </h3>
                          <p className="text-[10px] text-white/40 truncate mt-0.5 font-light">
                            {track.artist}
                          </p>
                        </div>

                        {/* Quick Add To Queue */}
                        {onAddToQueue && (
                          <button
                            onClick={(e) => handleAddSongToQueue(e, track)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold ${textAccent300[accentColor]} ${bgAccent05[accentColor]} ${hoverBgAccent15[accentColor]} ${borderAccent10[accentColor]} ${hoverBorderAccent20[accentColor]} rounded-full transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95 shadow-sm`}
                            title="Add to queue"
                          >
                            <Plus className={`w-3 h-3 ${textAccent400[accentColor]}`} />
                            <span>Queue</span>
                          </button>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : isSearching ? (
              /* Loading Spinner */
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <Loader2 className="w-8 h-8 text-white/60 animate-spin mb-3" />
                <p className="text-xs text-white/40 font-medium">Searching YouTube...</p>
              </motion.div>
            ) : searchQuery.trim() && searchResults.length > 0 ? (
              /* Search Results List */
              <motion.div
                key="search-results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-2"
              >
                {/* Search Results Header */}
                <div className="flex items-center justify-between px-1.5 py-1 mb-3 border-b border-white/5 pb-2">
                  <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">Search Results</span>
                </div>

                {/* Glowing Premium Clickable Artist Profile Card */}
                {shouldShowArtistCard(searchQuery) && verifiedArtist && (
                  (() => {
                    const artist = verifiedArtist;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleViewArtistProfile(artist)}
                        className={`relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br ${fromAccent03[accentColor]} to-white/[0.01] ${borderAccent10[accentColor]} ${hoverBorderAccent20[accentColor]} ${hoverFromAccent05[accentColor]} hover:to-white/[0.02] transition-all duration-300 mb-5 flex items-center justify-between gap-4 group shadow-md cursor-pointer active:scale-[0.99]`}
                      >
                        
                        <div className="flex items-center gap-4 relative z-10">
                          {/* Circular avatar with emerald border - scaled up to w-16 h-16 */}
                          <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${borderAccent20[accentColor]} flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                            <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover scale-105" />
                          </div>
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold ${textAccent300[accentColor]} tracking-wider ${bgAccent10[accentColor]} ${borderAccent25[accentColor]} px-2 py-0.5 rounded-md uppercase`}>
                                ✦ Verified Artist
                              </span>
                            </div>
                            <h4 className={`text-sm font-extrabold text-white mt-1 ${groupHoverTextAccent300[accentColor]} transition-colors tracking-tight leading-tight`}>{artist.name}</h4>
                            {artist.disambiguation && (
                              <p className="text-[10px] text-white/60 font-semibold mt-0.5 leading-snug">
                                {artist.disambiguation} {artist.country && `(${artist.country})`}
                              </p>
                            )}
                            {!artist.disambiguation && artist.country && (
                              <p className="text-[10px] text-white/60 font-semibold mt-0.5">
                                Artist from {artist.country}
                              </p>
                            )}
                            {artist.tags && artist.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {artist.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className={`text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider ${groupHoverBorderAccent10[accentColor]} ${groupHoverTextAccent300_60[accentColor]} transition-colors`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-white/20 ${groupHoverTextAccent400[accentColor]} group-hover:translate-x-0.5 transition-all duration-300 shrink-0 self-center relative z-10`} />
                      </motion.div>
                    );
                  })()
                )}

                {searchResults.map((result, index) => (
                  <motion.div
                    key={`search-item-${result.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, ease: "easeOut" }}
                    onClick={() => {
                      if (onSelectSong) {
                        onSelectSong(result);
                        onClose();
                      }
                    }}
                    className="group w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5">
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-xs font-semibold text-white/90 truncate group-hover:text-white transition-colors tracking-tight">
                        {result.title}
                      </h3>
                      <p className="text-[10px] text-white/40 truncate mt-0.5 font-light">
                        {result.artist}
                      </p>
                    </div>

                    {/* Quick Add To Queue */}
                    {onAddToQueue && (
                      <button
                        onClick={(e) => handleAddSongToQueue(e, result)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold ${textAccent300[accentColor]} ${bgAccent05[accentColor]} ${hoverBgAccent15[accentColor]} ${borderAccent10[accentColor]} ${hoverBorderAccent20[accentColor]} rounded-full transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95 shadow-sm`}
                        title="Add to queue"
                      >
                        <Plus className={`w-3 h-3 ${textAccent400[accentColor]}`} />
                        <span>Queue</span>
                      </button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : searchQuery.trim() && searchResults.length === 0 ? (
              /* Search Input Hint when no results are fetched yet */
              <motion.div
                key="search-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center text-white/40"
              >
                <Search className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-xs font-medium">Press Enter to Search</p>
                <p className="text-[10px] text-white/20 mt-1 max-w-[200px]">
                  Search for a song title, artist, or paste a YouTube / stream URL to play.
                </p>
              </motion.div>
            ) : (
              /* Queue List (Default) */
              <motion.div
                key="queue-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {items.length === 0 ? (
                  <div className="py-24 text-center">
                    <Music className="w-10 h-10 text-white/15 mx-auto mb-3" />
                    <p className="text-xs text-white/50 font-semibold">Your queue is empty</p>
                    <p className="text-[10px] text-white/30 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                      Use the search bar above to look up songs or drop a file to start a session.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => {
                      const isCurrent = item.id === currentSongId;

                      return (
                        <motion.div
                          key={`queue-item-${item.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0 }}
                          transition={{
                            duration: 0.22,
                            delay: index * 0.015,
                            ease: "easeOut"
                          }}
                          onClick={() => onSelect(item.id)}
                          className={`group w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            isCurrent
                              ? `${bgAccent10[accentColor]} ${borderAccent25[accentColor]} ${hoverBgAccent15[accentColor]}`
                              : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            {isCurrent ? (
                              <div className={`absolute inset-0 ${bgAccent20[accentColor]} flex items-end justify-center gap-[2px] pb-1.5`}>
                                <div className={`eq-bar-1 w-[3px] rounded-full ${bgAccent400[accentColor]}`} style={{height: '3px'}} />
                                <div className={`eq-bar-2 w-[3px] rounded-full ${bgAccent400[accentColor]}`} style={{height: '8px'}} />
                                <div className={`eq-bar-3 w-[3px] rounded-full ${bgAccent400[accentColor]}`} style={{height: '5px'}} />
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 text-white fill-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 text-left min-w-0">
                            <h3 className={`text-xs font-semibold truncate tracking-tight transition-colors ${
                              isCurrent ? textAccent300[accentColor] : 'text-white/85 group-hover:text-white'
                            }`}>
                              {item.title}
                            </h3>
                            <p className="text-[10px] text-white/35 truncate mt-0.5 font-light">
                              {item.artist}
                            </p>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(item.id);
                              toast.info("Removed from queue");
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all shrink-0 cursor-pointer text-white/40 hover:text-white/60"
                            title="Remove from queue"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
