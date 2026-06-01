import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, X, Search, Plus, Play, Upload, Loader2, Heart, ListMusic, Trash2, ArrowLeft, ChevronRight, Sparkles, User, History, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { getPrimaryArtist } from '../utils/stringUtils';
import { getHandPickedImage, resolveTopicChannelId } from '../utils/apiUtils';

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
  channelId?: string;
}

interface Playlist {
  id: string;
  name: string;
  color: string;
  tracks: SearchResult[];
}

interface VerifiedArtist {
  name: string;
  thumbnail: string;
  channelId?: string;
  disambiguation?: string;
  country?: string;
  tags?: string[];
  isTopic?: boolean;
}

interface QueueProps {
  items: QueueItem[];
  currentSongId?: string;
  songData?: { title: string; artist: string; videoId?: string; };
  accentColor?: AccentColor;
  onRemove: (id: string) => void;
  onClearQueue?: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  focusSearchOnMount?: boolean;
  onSearch?: (query: string, limit?: number) => Promise<SearchResult[]>;
  onFetchChannelUploads?: (channelId: string, limit?: number) => Promise<SearchResult[]>;
  onAddToQueue?: (song: SearchResult) => void;
  onSelectSong?: (song: SearchResult) => void;
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  onReorder?: (newIds: string[]) => void;
}

const ArtistAvatar = ({ name, fallbackThumbnail }: { name: string, fallbackThumbnail: string }) => {
  const handPicked = getHandPickedImage(name);
  const [imgUrl, setImgUrl] = useState(handPicked || fallbackThumbnail);

  useEffect(() => {
    if (handPicked) {
      setImgUrl(handPicked);
      return;
    }
    let active = true;
    const fetchRealImg = async () => {
      try {
        const cached = localStorage.getItem(`elva_artist_img_${name.toLowerCase()}`);
        if (cached) {
          setImgUrl(cached);
          return;
        }
        
        const res = await fetch(`https://corsproxy.io/?https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}`);
        if (res.ok) {
          const data = await res.json();
          const artist = (data.data || []).find((a: any) => a.name.toLowerCase() === name.toLowerCase()) || data.data?.[0];
          if (artist && active && (artist.picture_medium || artist.picture_big)) {
            const url = artist.picture_medium || artist.picture_big;
            setImgUrl(url);
            localStorage.setItem(`elva_artist_img_${name.toLowerCase()}`, url);
            // Also notify profile hub if it was loaded
            window.dispatchEvent(new CustomEvent('elva-artist-image-loaded', { detail: { name, url } }));
          }
        }
      } catch (e) {
        // Safe silent fallback
      }
    };
    
    fetchRealImg();
    return () => { active = false; };
  }, [name, fallbackThumbnail]);

  return <img src={imgUrl} alt={name} className="w-full h-full object-cover rounded-full" />;
};

export function Queue({
  items,
  currentSongId,
  songData,
  accentColor = 'emerald',
  onRemove,
  onClearQueue,
  onSelect,
  onClose,
  focusSearchOnMount = false,
  onSearch,
  onFetchChannelUploads,
  onAddToQueue,
  onSelectSong,
  onFileSelect,
  onUrlSubmit,
  onReorder
}: QueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop States and Handlers
  const [localItems, setLocalItems] = useState<QueueItem[]>(items);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeDragIndex === null) {
      setLocalItems(items);
    }
  }, [items, activeDragIndex]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setActiveDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (activeDragIndex === null || activeDragIndex === index) return;

    // Swap items in real-time locally
    const newItems = [...localItems];
    const draggedItem = newItems[activeDragIndex];
    newItems.splice(activeDragIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setActiveDragIndex(index);
    setLocalItems(newItems);
  };

  const handleDragEnd = () => {
    if (activeDragIndex !== null && onReorder) {
      onReorder(localItems.map(item => item.id));
    }
    setActiveDragIndex(null);
  };

  const theme = ACCENT_THEMES[accentColor];

  // Drawer View Modes: 'session' (Queue + search + quick adds) | 'library' (My Space browser)
  const [viewMode, setViewMode] = useState<'session' | 'library'>('session');

  // Verified Artist Subview States
  const [selectedArtist, setSelectedArtist] = useState<VerifiedArtist | null>(null);
  const [artistTracks, setArtistTracks] = useState<SearchResult[]>([]);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [matchedArtist, setMatchedArtist] = useState<VerifiedArtist | null>(null);

  // Playlists details view inside My Space
  const [selectedQueuePlaylist, setSelectedQueuePlaylist] = useState<Playlist | null>(null);

  // Active Session LocalStorage states for Quick-Add bottom carousels
  const [localFavorites, setLocalFavorites] = useState<SearchResult[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>([]);
  const [localHistory, setLocalHistory] = useState<SearchResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);

  const loadLocalStorageItems = () => {
    try {
      const favs = localStorage.getItem('elva_favorites');
      setLocalFavorites(favs ? JSON.parse(favs) : []);
      const lists = localStorage.getItem('elva_playlists');
      setLocalPlaylists(lists ? JSON.parse(lists) : []);
      const hist = localStorage.getItem('elva_recently_played');
      setLocalHistory(hist ? JSON.parse(hist) : []);
    } catch (e) {
      console.warn('Failed to load storage items in Queue drawer:', e);
    }
  };

  useEffect(() => {
    loadLocalStorageItems();
  }, [searchQuery, viewMode]);

  useEffect(() => {
    loadLocalStorageItems();
  }, []);

  useEffect(() => {
    const handlePlaylistsUpdated = () => {
      loadLocalStorageItems();
      setSelectedQueuePlaylist(prev => {
        if (!prev) return null;
        try {
          const stored = localStorage.getItem('elva_playlists');
          const lists = stored ? JSON.parse(stored) : [];
          const updated = lists.find((p: any) => p.id === prev.id);
          return updated || null;
        } catch {
          return prev;
        }
      });
    };
    window.addEventListener('elva-playlists-updated', handlePlaylistsUpdated);
    window.addEventListener('storage', handlePlaylistsUpdated);
    return () => {
      window.removeEventListener('elva-playlists-updated', handlePlaylistsUpdated);
      window.removeEventListener('storage', handlePlaylistsUpdated);
    };
  }, []);

  // Reset sub-views if search query changes
  useEffect(() => {
    setSelectedArtist(null);
    setArtistTracks([]);
    setSelectedQueuePlaylist(null);
  }, [searchQuery]);

  const shouldShowArtistCard = (query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return false;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
    const words = trimmed.split(/\s+/);
    if (words.length > 3) return false;
    const blocklist = ['lyrics', 'remix', 'karaoke', 'live', 'cover', 'instrumental', 'acoustic', 'version'];
    return !blocklist.some(word => trimmed.includes(word));
  };

  const getArtistName = (query: string, results: SearchResult[]): { name: string; thumbnail: string; channelId?: string } | null => {
    if (!shouldShowArtistCard(query) || results.length === 0) return null;
    const queryLower = query.trim().toLowerCase();
    if (queryLower.length < 2) return null;
    
    const match = results.find(r => {
      const artistLower = r.artist.trim().toLowerCase();
      return (
        artistLower === queryLower ||
        artistLower === `${queryLower} - topic` ||
        artistLower === `${queryLower}vevo` ||
        artistLower.includes(queryLower)
      );
    });

    if (match) {
      const cleanedName = match.artist
        .replace(/\s*-\s*Topic$/i, '')
        .replace(/\s*VEVO$/i, '')
        .replace(/\s*Official\s*$/i, '')
        .trim();
      return {
        name: cleanedName,
        thumbnail: match.thumbnail,
        channelId: match.channelId
      };
    }
    return null;
  };

  // Auto-focus search input if requested on mount
  useEffect(() => {
    if (focusSearchOnMount && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300); // Small timeout to wait for slide-in animation
    }
  }, [focusSearchOnMount]);

  // Reset search state on query changes so it displays "Press Enter to search" immediately when typing
  useEffect(() => {
    setHasSearched(false);
    setSearchResults([]);
    setMatchedArtist(null);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (searchQuery.trim().startsWith('http://') || searchQuery.trim().startsWith('https://')) {
      if (onUrlSubmit) {
        onUrlSubmit(searchQuery.trim());
        setSearchQuery('');
      }
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setMatchedArtist(null);
    try {
      if (onSearch) {
        const results = await onSearch(searchQuery.trim(), 20);
        setSearchResults(results);

        const matched = getArtistName(searchQuery.trim(), results);
        if (matched) {
          setMatchedArtist({
            name: matched.name,
            thumbnail: matched.thumbnail,
            channelId: matched.channelId,
            isTopic: true
          });
        }
      }
    } catch (error) {
      console.error('Queue Search Error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      toast.success(`Loading local file: ${file.name}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddSongToQueue = (e: React.MouseEvent, song: SearchResult) => {
    e.stopPropagation();
    if (onAddToQueue) {
      onAddToQueue(song);
      // Let App.tsx handle the toast to prevent double toast alerts!
    }
  };

  const handlePlaySongDirectly = (song: SearchResult) => {
    if (onSelectSong) {
      onSelectSong(song);
      onClose();
    }
  };

  const handlePlayPlaylistDirectly = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) {
      toast.error("Playlist is empty", {
        description: "Add some songs to this playlist from the landing page first!"
      });
      return;
    }
    if (onSelectSong) {
      onSelectSong(playlist.tracks[0]);
    }
    if (onAddToQueue) {
      playlist.tracks.slice(1).forEach(track => onAddToQueue(track));
    }
    toast.success(`Playing playlist: ${playlist.name}`);
  };

  const artistBubbles = useMemo(() => {
    if (localHistory.length === 0) return [];
    const seen = new Set<string>();
    const bubbles: { name: string; channelId?: string; thumbnail: string }[] = [];
    
    localHistory.forEach((song) => {
      const primaryArtist = getPrimaryArtist(song.artist);
      const artistName = primaryArtist.trim();
      if (!artistName) return;
      const key = artistName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        bubbles.push({
          name: artistName,
          channelId: song.channelId,
          thumbnail: song.thumbnail
        });
      }
    });
    return bubbles.slice(0, 8);
  }, [localHistory]);

  return (
    <>
      {/* Drawer Overlay Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1.5px] z-40 cursor-pointer pointer-events-auto"
      />

      {/* Side Panel Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[460px] bg-[#09090b]/85 border-l border-white/10 z-50 flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.65)] pointer-events-auto overflow-hidden backdrop-blur-3xl h-full"
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 100% 10%, var(--theme-primary) 0%, transparent 60%), radial-gradient(circle at 100% 90%, var(--theme-secondary) 0%, transparent 60%)'
          }}
        />

        {/* 1. Header with View Mode Switchers */}
        <div className="relative px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 z-10 bg-black/10 select-none">
          {selectedArtist || selectedQueuePlaylist ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedArtist(null);
                  setArtistTracks([]);
                  setSelectedQueuePlaylist(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span 
                className="text-lg font-normal tracking-wide text-white/95"
                style={{ fontFamily: '"Kaobe", serif' }}
              >
                {selectedArtist ? "Artist Profile" : "Playlist Tracks"}
              </span>
            </div>
          ) : viewMode === 'library' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('session')}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Back to queue"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span 
                className="text-lg font-normal tracking-wide text-white/95"
                style={{ fontFamily: '"Kaobe", serif' }}
              >
                My Space
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Music className="w-4 h-4 text-white/40" />
              <span 
                className="text-lg font-normal tracking-wide text-white/95"
                style={{ fontFamily: '"Kaobe", serif' }}
              >
                {searchQuery.trim() && searchResults.length > 0 ? "Search Results" : "Active Session"}
              </span>
              {!searchQuery.trim() && (
                <span className="text-[10px] text-white/30 font-normal tracking-wider ml-1.5 lowercase">
                  ({items.length} {items.length === 1 ? 'song' : 'songs'})
                </span>
              )}
            </div>
          )}

          {/* Header Action Button: My Space / Close */}
          {!selectedArtist && !selectedQueuePlaylist && (
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer ml-1"
                title="Close Panel"
              >
                <X className="w-4 h-4 text-white/40 hover:text-white/60" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Prominent Glass Search Bar (only in active session, not on subviews) */}
        {!selectedArtist && !selectedQueuePlaylist && viewMode === 'session' && (
          <div className="relative px-5 py-4 border-b border-white/5 shrink-0 z-10 flex gap-2.5 bg-white/[0.01] items-center">
            <div className="relative flex-1">
              <button
                onClick={handleSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-all cursor-pointer z-10"
                title="Execute search"
              >
                <Search className="w-4 h-4" />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search songs or paste links..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white/5 border border-white/8 hover:border-white/15 focus:border-white/20 text-white placeholder-white/30 text-sm focus:outline-none transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white/60 transition-colors z-10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleUploadClick}
              className="w-[46px] h-[46px] p-0 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 active:scale-95 transition-all text-white/50 hover:text-white shrink-0 cursor-pointer flex items-center justify-center"
              title="Upload custom audio file"
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
          </div>
        )}

        {/* 3. Naturally Scrollable Content (Single Scroll Feed) */}
        <div className={`flex-1 overflow-y-auto scrollbar-none relative z-10 pb-[120px] ${selectedArtist ? 'p-0' : 'p-5'}`}>
          <AnimatePresence mode="wait">
            
            {/* Loading Spinner */}
            {isLoadingArtist ? (
              <motion.div
                key="artist-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center select-none"
              >
                <Loader2 className="w-8 h-8 text-white/40 animate-spin mb-3" />
                <p className="text-xs text-white/40 font-medium tracking-wide">Loading releases...</p>
              </motion.div>
            ) : selectedArtist ? (
              
              /* Artist Profile Subview */
              <motion.div
                key="artist-profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-left"
              >
                {/* Immersive Sidebar Artist Hero Banner */}
                <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#121214]/85 via-[#0d0d0f]/50 to-black/30 backdrop-blur-2xl shadow-xl py-6 px-6 flex items-center gap-5 shrink-0 relative">
                  {/* Ambient dynamic theme glow behind/inside the banner */}
                  <div 
                    className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[45px] opacity-35 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, var(--theme-primary) 0%, rgba(255,255,255,0) 70%)'
                    }}
                  />
                  
                  {/* Large circular avatar with high-end border */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl transition-transform duration-500 hover:scale-105 shrink-0 z-10 bg-neutral-900">
                    <img src={selectedArtist.thumbnail} alt={selectedArtist.name} className="w-full h-full object-cover scale-105" />
                  </div>
                  
                  {/* Hero Info Text */}
                  <div className="flex flex-col text-left relative z-10 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${theme.text} bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider`}>
                        ✦ Verified Artist
                      </span>
                    </div>
                    
                    <h2 
                      className="text-3xl font-normal text-white mt-2 tracking-wide leading-none truncate"
                      style={{ fontFamily: '"Kaobe", serif' }}
                    >
                      {selectedArtist.name}
                    </h2>
                    
                    <p className="text-[9px] text-white/40 font-bold tracking-[0.15em] uppercase mt-2.5">
                      Official Releases • Danish Artist
                    </p>
                  </div>
                </div>

                <div className="space-y-2 px-5">
                  {artistTracks.map((track) => (
                    <div
                      key={`artist-track-${track.id}`}
                      onClick={() => handlePlaySongDirectly(track)}
                      className="group w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 truncate mr-3 flex-1">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/5 bg-white/5">
                          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                        <div className="text-left truncate">
                          <h3 className="text-sm font-semibold text-white/95 truncate tracking-wide leading-snug">{track.title}</h3>
                          <p className="text-xs text-white/50 truncate mt-1 leading-none">{track.artist}</p>
                        </div>
                      </div>
                      
                      {onAddToQueue && (
                        <button
                          onClick={(e) => handleAddSongToQueue(e, track)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
                          title="Add to queue"
                        >
                          <Plus className="w-4 h-4 text-current" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : selectedQueuePlaylist ? (

              /* Playlist Details Browser View */
              <motion.div
                key="playlist-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-left"
              >
                <div className="relative w-full h-44 overflow-hidden select-none shrink-0 bg-[#0c0c0f] border-b border-white/5 flex flex-col justify-end p-6">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${selectedQueuePlaylist.color}`} />
                  <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/30">Playlist</span>
                  <h2 className="text-2xl font-normal text-white mt-1 leading-tight truncate" style={{ fontFamily: '"Kaobe", serif' }}>
                    {selectedQueuePlaylist.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => handlePlayPlaylistDirectly(selectedQueuePlaylist)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-white/95 rounded-full text-[10px] font-bold uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-black ml-0.5" />
                      <span>Play All</span>
                    </button>
                    <span className="text-xs text-white/40">{(selectedQueuePlaylist.tracks || []).length} songs</span>
                  </div>
                </div>

                <div className="space-y-2 px-5">
                  {(selectedQueuePlaylist.tracks || []).map((track, idx) => (
                    <div
                      key={`plist-track-${track.id}-${idx}`}
                      onClick={() => handlePlaySongDirectly(track)}
                      className="group w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 truncate mr-3 flex-1">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/5 bg-white/5">
                          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                        <div className="text-left truncate">
                          <h4 className="text-sm font-semibold text-white/90 truncate tracking-wide leading-snug">{track.title}</h4>
                          <p className="text-xs text-white/50 truncate mt-1 leading-none">{track.artist}</p>
                        </div>
                      </div>
                      
                      {onAddToQueue && (
                        <button
                          onClick={(e) => handleAddSongToQueue(e, track)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
                          title="Add to queue"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedQueuePlaylist.tracks || selectedQueuePlaylist.tracks.length === 0) && (
                    <div className="py-12 text-center text-white/30 select-none">
                      <p className="text-xs font-medium">This playlist is empty</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : viewMode === 'library' ? (
              
              /* "My Space" Deeper Library View (Slow Add Subview) */
              <motion.div
                key="library-hub"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-left select-none p-2"
              >
                {/* Playlists Vertical list */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <ListMusic className="w-4 h-4 text-white/30" />
                    <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Playlists</h3>
                  </div>
                  {localPlaylists.length === 0 ? (
                    <div className="py-8 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-[11px] font-medium leading-relaxed">No playlists found. Create them in My Hub!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {localPlaylists.map((playlist) => (
                        <div
                          key={`lib-plist-${playlist.id}`}
                          onClick={() => setSelectedQueuePlaylist(playlist)}
                          className="group w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 flex items-center justify-center shrink-0">
                              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${playlist.color}`} />
                              {playlist.tracks && playlist.tracks.length > 0 ? (
                                <img src={playlist.tracks[0].thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
                              ) : (
                                <Music className="w-5 h-5 text-white/20" />
                              )}
                            </div>
                            <div className="min-w-0 text-left">
                              <h4 className="text-sm font-semibold text-white/90 truncate leading-snug group-hover:text-white transition-colors">{playlist.name}</h4>
                              <p className="text-[11px] text-white/40 mt-0.5 font-medium">{(playlist.tracks || []).length} songs</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Favorite Artists Horizontal scroll */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <User className="w-4 h-4 text-white/30" />
                    <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Favorite Artists</h3>
                  </div>
                  {artistBubbles.length === 0 ? (
                    <div className="py-6 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-[11px] font-medium leading-relaxed">No artists resolved yet.</p>
                    </div>
                  ) : (
                    <div 
                      className="flex overflow-x-auto gap-4.5 pb-2 scrollbar-none snap-x snap-mandatory"
                      style={{
                        maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                      }}
                    >
                      {artistBubbles.map((artist, idx) => (
                        <div
                          key={`lib-art-${idx}`}
                           onClick={async () => {
                            if (onFetchChannelUploads) {
                              setIsLoadingArtist(true);
                              
                              let channelId = artist.channelId;
                              let resolved = await resolveTopicChannelId(artist.name);
                              if (resolved) {
                                channelId = resolved.channelId;
                              }

                              const cachedImg = localStorage.getItem(`elva_artist_img_${artist.name.toLowerCase()}`) || artist.thumbnail;
                              setSelectedArtist({
                                name: artist.name,
                                thumbnail: cachedImg,
                                channelId: channelId,
                                isTopic: true
                              });
                              let uploads = await onFetchChannelUploads(channelId || '');

                              // ROBUST FALLBACK FOR DISC DISCOVERY
                              if (uploads.length === 0 && onSearch) {
                                const nameLower = artist.name.trim().toLowerCase();
                                const [raw1, raw2] = await Promise.all([
                                  onSearch(artist.name, 50),
                                  onSearch(`${artist.name} - Topic`, 10)
                                ]);
                                const seenIds = new Set<string>();
                                for (const track of [...raw1, ...raw2]) {
                                  if (!track.id || seenIds.has(track.id)) continue;
                                  seenIds.add(track.id);
                                  const uploaderLower = (track.artist || '').trim().toLowerCase();
                                  if (uploaderLower === nameLower || uploaderLower === `${nameLower} - topic` || uploaderLower === `${nameLower}vevo`) {
                                    uploads.push(track);
                                  }
                                }
                              }

                              setArtistTracks(uploads);
                              setIsLoadingArtist(false);
                            }
                          }}
                          className="group flex flex-col items-center gap-2 w-16 shrink-0 snap-start cursor-pointer"
                          title={`Browse ${artist.name}`}
                        >
                          <div className="relative w-16 h-16 rounded-full overflow-hidden p-0.5 border border-white/10 hover:border-white/30 group-hover:scale-105 transition-all duration-300 shadow-md">
                            <ArtistAvatar name={artist.name} fallbackThumbnail={artist.thumbnail} />
                          </div>
                          <span className="text-[10px] text-white/40 group-hover:text-white transition-colors text-center truncate w-full font-semibold">
                            {artist.name}
                          </span>
                        </div>
                      ))}
                      {/* Spacer to prevent text/content clipping by the fade mask */}
                      <div className="w-[15px] shrink-0 h-1" />
                    </div>
                  )}
                </div>

                {/* All Likes / Favorites list */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Heart className="w-4 h-4 text-white/30" />
                    <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">All Likes</h3>
                  </div>
                  {localFavorites.length === 0 ? (
                    <div className="py-8 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-[11px] font-medium leading-relaxed">No favorites saved yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localFavorites.map((song) => (
                        <div
                          key={`lib-fav-${song.id}`}
                          onClick={() => handlePlaySongDirectly(song)}
                          className="group w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-md cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 truncate mr-3 flex-1 text-left">
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/5 bg-white/5">
                              <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                            <div className="truncate">
                              <h4 className="text-sm font-semibold text-white/90 truncate tracking-wide leading-snug">{song.title}</h4>
                              <p className="text-xs text-white/50 truncate mt-1 leading-none font-medium">{song.artist}</p>
                            </div>
                          </div>
                          {onAddToQueue && (
                            <button
                              onClick={(e) => handleAddSongToQueue(e, song)}
                              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
                              title="Add to queue"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : searchQuery.trim() ? (
              
              /* Search results list */
              isSearching ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center select-none"
                >
                  <Loader2 className="w-8 h-8 text-white/40 animate-spin mb-3" />
                  <p className="text-xs text-white/40 font-medium">Searching YouTube...</p>
                </motion.div>
              ) : searchResults.length > 0 ? (
                <motion.div
                  key="search-results"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-3 p-2 text-left"
                >
                   {matchedArtist && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      onClick={async () => {
                        if (onFetchChannelUploads) {
                          setIsLoadingArtist(true);
                          
                          let channelId = matchedArtist.channelId;
                          let resolved = await resolveTopicChannelId(matchedArtist.name);
                          if (resolved) {
                            channelId = resolved.channelId;
                          }

                          const cachedImg = localStorage.getItem(`elva_artist_img_${matchedArtist.name.toLowerCase()}`) || matchedArtist.thumbnail;
                          setSelectedArtist({
                            ...matchedArtist,
                            thumbnail: cachedImg,
                            channelId: channelId
                          });
                          let uploads = await onFetchChannelUploads(channelId || '');

                          // ROBUST FALLBACK FOR DISC DISCOVERY
                          if (uploads.length === 0 && onSearch) {
                            const nameLower = matchedArtist.name.trim().toLowerCase();
                            const [raw1, raw2] = await Promise.all([
                              onSearch(matchedArtist.name, 50),
                              onSearch(`${matchedArtist.name} - Topic`, 10)
                            ]);
                            const seenIds = new Set<string>();
                            for (const track of [...raw1, ...raw2]) {
                              if (!track.id || seenIds.has(track.id)) continue;
                              seenIds.add(track.id);
                              const uploaderLower = (track.artist || '').trim().toLowerCase();
                              if (uploaderLower === nameLower || uploaderLower === `${nameLower} - topic` || uploaderLower === `${nameLower}vevo`) {
                                uploads.push(track);
                              }
                            }
                          }

                          setArtistTracks(uploads);
                          setIsLoadingArtist(false);
                        }
                      }}
                      className="group w-full flex flex-col gap-5 p-6 rounded-3xl bg-gradient-to-br from-[#1c1c1f]/80 via-[#0e0e10]/60 to-black/40 border border-white/10 hover:border-white/20 hover:from-white/[0.04] hover:to-white/[0.01] transition-all duration-300 shadow-2xl cursor-pointer mb-6 relative overflow-hidden backdrop-blur-xl active:scale-[0.99]"
                    >
                      {/* Ambient dynamic theme glow behind the avatar */}
                      <div 
                        className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-[35px] opacity-25 pointer-events-none transition-opacity duration-300"
                        style={{
                          background: 'radial-gradient(circle, var(--theme-primary) 0%, rgba(255,255,255,0) 70%)'
                        }}
                      />
                      
                      <div className="flex items-center gap-5 relative z-10">
                        {/* Beautifully upscaled circular avatar */}
                        <div className="relative w-20 h-20 rounded-full overflow-hidden p-0.5 border border-white/15 shadow-xl group-hover:scale-105 transition-all duration-300 shrink-0 bg-neutral-900">
                          <ArtistAvatar name={matchedArtist.name} fallbackThumbnail={matchedArtist.thumbnail} />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${theme.text} tracking-wider bg-white/5 border border-white/5 px-2.5 py-0.5 rounded uppercase shrink-0`}>
                            ✦ Verified Artist
                          </span>
                          <h4 
                            className="text-xl font-normal text-white mt-1.5 truncate tracking-wide leading-tight"
                            style={{ fontFamily: '"Kaobe", serif' }}
                          >
                            {matchedArtist.name}
                          </h4>
                          <p className="text-[11px] text-white/40 mt-1 leading-normal font-semibold tracking-wide uppercase">
                            Official Discography • View Profile
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/45 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 self-center" />
                      </div>
                    </motion.div>
                  )}

                  {searchResults.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => handlePlaySongDirectly(song)}
                      className="group w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10 transition-all duration-300 shadow-md cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 truncate mr-3 flex-1">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/5 bg-white/5">
                          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </div>
                        <div className="text-left truncate">
                          <h4 className="text-sm font-semibold text-white/95 truncate tracking-wide leading-snug">{song.title}</h4>
                          <p className="text-xs text-white/50 truncate mt-1 leading-none">{song.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 select-none">
                        {onAddToQueue && (
                          <button
                            onClick={(e) => handleAddSongToQueue(e, song)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
                            title="Add to queue"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : hasSearched ? (
                <div className="py-24 text-center select-none">
                  <p className="text-white/40 text-xs font-semibold">No results found</p>
                </div>
              ) : (
                <div className="py-24 text-center select-none">
                  <p className="text-white/30 text-[11px] font-medium tracking-wide uppercase">Press Enter to search</p>
                </div>
              )
            ) : (
              
              /* ACTIVE SESSION SCROLL FEED: Up Next Queue + carousels scroll naturally */
              <motion.div
                key="default-active-session"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-8 text-left"
              >
                {/* A. Up Next Queue Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between select-none">
                    <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Up Next</h3>
                    {items.length > 0 && (
                      <button
                        onClick={() => {
                          if (onClearQueue) {
                            onClearQueue();
                          } else {
                            items.forEach(it => onRemove(it.id));
                            toast.info("Queue cleared");
                          }
                        }}
                        className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
                      >
                        Clear Queue
                      </button>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <div className="flex items-center gap-3.5 p-3 rounded-2xl border border-white/[0.04] bg-white/[0.005] select-none text-left min-h-[88px] transition-all duration-300">
                      <div className="w-16 h-16 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center shrink-0">
                        <Music className="w-5 h-5 text-white/20 animate-pulse" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-semibold text-white/50 tracking-wide leading-tight">Your queue is empty</h4>
                        <p className="text-[10px] text-white/25 mt-1.5 leading-snug font-medium truncate max-w-[240px]">
                          Add tracks from likes or playlists below
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <AnimatePresence mode="popLayout">
                        {localItems.map((item, index) => {
                          // 100% Robust matches utilizing videoId AND title + artist checks!
                          const isCurrent = 
                            (item.videoId && item.videoId === currentSongId) || 
                            (songData && item.title.toLowerCase() === songData.title.toLowerCase() && 
                             item.artist.toLowerCase() === songData.artist.toLowerCase());
                          const isDraggingItem = index === activeDragIndex;

                          return (
                            <motion.div
                              key={`queue-item-${item.id}`}
                              layout
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, padding: 0 }}
                              transition={{ duration: 0.22, delay: index * 0.01, ease: "easeOut" }}
                              onClick={() => onSelect(item.id)}
                              className={`group w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-grab active:cursor-grabbing ${
                                isDraggingItem ? 'opacity-30 border-dashed border-white/20 bg-white/5 scale-[0.98]' : ''
                              } ${
                                isCurrent
                                  ? `bg-white/[0.05] border-white/15 shadow-md shadow-black/35 ${theme.border}`
                                  : 'bg-white/[0.015] border-white/[0.03] hover:border-white/10 hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate mr-3 flex-1">
                                {/* Grip Handle Icon */}
                                <div className="text-white/20 group-hover:text-white/40 transition-colors shrink-0">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                {/* Option C: Large 64px cover sleeves */}
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/5 bg-white/5 z-10">
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                  {isCurrent ? (
                                    /* Custom Equalizer overlays matching system theme keyframes */
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-[2.5px] pb-1.5 z-10">
                                      <div className="eq-bar-1 w-[3px] rounded-full bg-white" style={{ height: '3px' }} />
                                      <div className="eq-bar-2 w-[3px] rounded-full bg-white" style={{ height: '8px' }} />
                                      <div className="eq-bar-3 w-[3px] rounded-full bg-white" style={{ height: '5px' }} />
                                    </div>
                                  ) : (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                    </div>
                                  )}
                                </div>

                                <div className="text-left truncate">
                                  <h4 className={`text-sm font-semibold truncate tracking-wide leading-tight transition-colors ${
                                    isCurrent ? theme.text : 'text-white/85 group-hover:text-white'
                                  }`}>
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-white/40 truncate mt-1 leading-none font-medium">
                                    {item.artist}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(item.id);
                                  toast.info("Removed from queue");
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-xl transition-all shrink-0 cursor-pointer text-white/45 hover:text-white/70"
                                title="Remove from queue"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* B. Quick-Add Favorites Section (scroll-stacked below queue) */}
                {localFavorites.length > 0 && (
                  <div className="space-y-3.5 select-none">
                    <div className="flex items-center justify-between select-none pr-1">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-white/30" />
                        <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Quick-Add Likes</h3>
                      </div>
                      <button 
                        onClick={() => setShowFavorites(!showFavorites)}
                        className="p-1 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-all cursor-pointer"
                        title={showFavorites ? "Collapse Likes" : "Expand Likes"}
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${showFavorites ? 'rotate-90' : 'rotate-0'}`} />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {showFavorites && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden pb-1"
                        >
                          <div 
                            className="flex overflow-x-auto gap-4 pb-2.5 scrollbar-none snap-x snap-mandatory"
                            style={{
                              maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                              WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                            }}
                          >
                            {localFavorites.slice(0, 10).map((song) => (
                              <div
                                key={`fav-card-${song.id}`}
                                onClick={() => {
                                  if (onAddToQueue) {
                                    onAddToQueue(song);
                                  }
                                }}
                                className="group relative flex flex-col gap-2.5 w-28 shrink-0 snap-start cursor-pointer"
                                title={`Queue ${song.title}`}
                              >
                                <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md border border-white/5 bg-white/5">
                                  <img
                                    src={song.thumbnail}
                                    alt={song.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
                                      <Plus className="w-4.5 h-4.5 text-white" />
                                    </div>
                                  </div>
                                </div>

                                <div className="text-left w-full">
                                  <h4 className="text-xs font-semibold text-white/80 truncate leading-tight tracking-wide group-hover:text-white transition-colors">
                                    {song.title}
                                  </h4>
                                  <p className="text-[11px] text-white/40 truncate mt-1 leading-none font-medium">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* End-gate History Card */}
                            {localHistory.length > 0 && (
                              <div
                                onClick={() => setShowHistory(!showHistory)}
                                className="group relative flex flex-col gap-2.5 w-24 shrink-0 snap-start cursor-pointer select-none items-center justify-center h-28"
                                title={showHistory ? "Hide listening history" : "Show listening history"}
                              >
                                <div className={`p-2.5 rounded-2xl bg-white/5 ${showHistory ? 'text-white/85 rotate-180' : 'text-white/35'} group-hover:bg-white/10 group-hover:text-white group-hover:scale-110 transition-all duration-300`}>
                                  <History className="w-5 h-5 text-current" />
                                </div>
                                <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 group-hover:text-white/70 transition-colors font-bold leading-tight text-center mt-1">
                                  {showHistory ? "Hide\nHistory" : "View\nHistory"}
                                </span>
                              </div>
                            )}

                            {/* Spacer to prevent text/content clipping by the fade mask */}
                            <div className="w-[15px] shrink-0 h-1" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Understated Library Shortcut Pill */}
                <div className="py-2 mt-4 flex items-center justify-center select-none shrink-0">
                  <button 
                    onClick={() => setViewMode('library')}
                    className={`group flex items-center gap-2 px-5 py-2.5 rounded-full border ${theme.borderCard} hover:${theme.borderHover} bg-white/[0.015] hover:bg-white/[0.045] transition-all duration-300 shadow-sm cursor-pointer`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${theme.text} animate-pulse`} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 group-hover:text-white/80 transition-colors">
                      Browse Full Library
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                {/* C. Recently Played Section (scroll-stacked at the very bottom, conditionally toggled) */}
                <AnimatePresence>
                  {showHistory && localHistory.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="space-y-3.5 select-none mt-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-white/30" />
                        <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Recently Played</h3>
                      </div>

                      <div 
                        className="flex overflow-x-auto gap-4 pb-2.5 scrollbar-none snap-x snap-mandatory"
                        style={{
                          maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
                        }}
                      >
                        {localHistory.slice(0, 10).map((song) => (
                          <div
                            key={`hist-card-${song.id}`}
                            onClick={() => {
                              if (onAddToQueue) {
                                onAddToQueue(song);
                              }
                            }}
                            className="group relative flex flex-col gap-2.5 w-28 shrink-0 snap-start cursor-pointer"
                            title={`Re-play ${song.title}`}
                          >
                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md border border-white/5 bg-white/5">
                              <img
                                src={song.thumbnail}
                                alt={song.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
                                  <Plus className="w-4.5 h-4.5 text-white" />
                                </div>
                              </div>
                            </div>

                            <div className="text-left w-full">
                              <h4 className="text-xs font-semibold text-white/80 truncate leading-tight tracking-wide group-hover:text-white transition-colors">
                                {song.title}
                              </h4>
                              <p className="text-[11px] text-white/40 truncate mt-1 leading-none font-medium">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Spacer to prevent text/content clipping by the fade mask */}
                        <div className="w-[15px] shrink-0 h-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
