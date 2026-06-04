import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { QueuePanelLayer } from './queue/QueuePanelLayer';
import { toast } from 'sonner';
import { AccentColor } from './themeUtils';
import { ELVA_STORAGE_KEYS, readJsonStorage } from '../utils/elvaStorage';
import type { QueueItem, Playlist, SearchResult, VerifiedArtist } from './queue/types';
import { useQueueLocalData } from './queue/useQueueLocalData';
import { useQueueDragReorder } from './queue/useQueueDragReorder';
import {
  getArtistMatchFromResults,
  loadArtistDiscographyTracks,
  getCachedArtistThumbnail,
  peekCachedDiscography,
} from './queue/queueArtistUtils';
import { QueueSearchBar } from './queue/QueueSearchBar';
import { QueueUpNext } from './queue/QueueUpNext';
import { QueueQuickAdd } from './queue/QueueQuickAdd';
import { QueueSearchResults } from './queue/QueueSearchResults';
import { QueueArtistSubview } from './queue/QueueArtistSubview';
import { QueuePlaylistSubview } from './queue/QueuePlaylistSubview';
import { QueueLibraryView } from './queue/QueueLibraryView';

export type { QueueItem };

interface QueueProps {
  items: QueueItem[];
  currentSongId?: string;
  songData?: { title: string; artist: string; videoId?: string };
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
  onPlayPlaylist?: (tracks: SearchResult[], label?: string) => void;
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  onReorder?: (newIds: string[]) => void;
  onShuffleQueue?: () => void;
}

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
  onPlayPlaylist,
  onFileSelect,
  onUrlSubmit,
  onReorder,
  onShuffleQueue,
}: QueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { displayItems, activeDragIndex, handleDragStart, handleDragOver, handleDragEnd } =
    useQueueDragReorder(items, onReorder);

  const [viewMode, setViewMode] = useState<'session' | 'library'>('session');
  const [selectedArtist, setSelectedArtist] = useState<VerifiedArtist | null>(null);
  const [artistTracks, setArtistTracks] = useState<SearchResult[]>([]);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [matchedArtist, setMatchedArtist] = useState<VerifiedArtist | null>(null);
  const [selectedQueuePlaylist, setSelectedQueuePlaylist] = useState<Playlist | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true);

  const { localFavorites, localPlaylists, localHistory, artistBubbles } = useQueueLocalData(
    searchQuery,
    viewMode
  );

  useEffect(() => {
    setSelectedArtist(null);
    setArtistTracks([]);
    setSelectedQueuePlaylist(null);
  }, [searchQuery]);

  useEffect(() => {
    if (focusSearchOnMount && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [focusSearchOnMount]);

  useEffect(() => {
    setHasSearched(false);
    setSearchResults([]);
    setMatchedArtist(null);
  }, [searchQuery]);

  const openArtistProfile = async (artist: VerifiedArtist) => {
    const thumbnail = getCachedArtistThumbnail(artist.name, artist.thumbnail);
    setSelectedArtist({ ...artist, thumbnail, isTopic: true });

    const cachedTracks = peekCachedDiscography(artist.name);
    if (cachedTracks) {
      setArtistTracks(cachedTracks);
      setIsLoadingArtist(false);
      return;
    }

    setArtistTracks([]);
    setIsLoadingArtist(true);
    try {
      const uploads = await loadArtistDiscographyTracks({
        name: artist.name,
        channelId: artist.channelId,
      });
      setArtistTracks(uploads);
    } finally {
      setIsLoadingArtist(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (searchQuery.trim().startsWith('http://') || searchQuery.trim().startsWith('https://')) {
      onUrlSubmit?.(searchQuery.trim());
      setSearchQuery('');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setMatchedArtist(null);
    try {
      if (onSearch) {
        const results = await onSearch(searchQuery.trim(), 20);
        setSearchResults(results);
        const matched = getArtistMatchFromResults(searchQuery.trim(), results);
        if (matched) {
          setMatchedArtist({
            name: matched.name,
            thumbnail: matched.thumbnail,
            channelId: matched.channelId,
            isTopic: true,
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

  const handleAddSongToQueue = (e: React.MouseEvent, song: SearchResult) => {
    e.stopPropagation();
    onAddToQueue?.(song);
  };

  const handlePlaySongDirectly = (song: SearchResult) => {
    onSelectSong?.(song);
    onClose();
  };

  const handlePlayPlaylistDirectly = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) {
      toast.error('Playlist is empty', {
        description: 'Add some songs to this playlist from the landing page first!',
      });
      return;
    }
    if (onPlayPlaylist) {
      onPlayPlaylist(playlist.tracks, playlist.name);
    } else {
      onSelectSong?.(playlist.tracks[0]);
      playlist.tracks.slice(1).forEach((track) => onAddToQueue?.(track));
      toast.success(`Playing playlist: ${playlist.name}`);
    }
  };

  const syncPlaylistFromStorage = (prev: Playlist | null) => {
    if (!prev) return null;
    const lists = readJsonStorage<Playlist[]>(ELVA_STORAGE_KEYS.playlists, []);
    return lists.find((p) => p.id === prev.id) || null;
  };

  useEffect(() => {
    const handlePlaylistsUpdated = () => {
      setSelectedQueuePlaylist((prev) => syncPlaylistFromStorage(prev));
    };
    window.addEventListener('elva-playlists-updated', handlePlaylistsUpdated);
    window.addEventListener('storage', handlePlaylistsUpdated);
    return () => {
      window.removeEventListener('elva-playlists-updated', handlePlaylistsUpdated);
      window.removeEventListener('storage', handlePlaylistsUpdated);
    };
  }, []);

  const headerTitle = () => {
    if (selectedArtist) return 'Artist Profile';
    if (selectedQueuePlaylist) return 'Playlist Tracks';
    if (viewMode === 'library') return 'My Space';
    if (searchQuery.trim() && searchResults.length > 0) return 'Search Results';
    return 'Active Session';
  };

  const showBackButton = selectedArtist || selectedQueuePlaylist || viewMode === 'library';
  const showSessionSearch =
    !selectedArtist && !selectedQueuePlaylist && viewMode === 'session';
  const headerLabel = headerTitle();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-pointer pointer-events-auto"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-50 flex flex-col pointer-events-auto overflow-hidden h-full"
        style={{
          background: 'linear-gradient(180deg, rgba(10,11,16,0.97) 0%, rgba(8,9,12,0.99) 100%)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.7), -1px 0 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(40px) saturate(1.4)',
        }}
      >
        {/* Ambient theme glow */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 100% 15%, var(--theme-primary) 0%, transparent 55%), radial-gradient(circle at 100% 85%, var(--theme-secondary) 0%, transparent 55%)',
          }}
        />

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="relative px-5 pt-6 pb-4 flex items-start justify-between shrink-0 z-10 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {showBackButton ? (
                <motion.button
                  key="queue-header-back"
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => {
                    if (selectedArtist || selectedQueuePlaylist) {
                      setSelectedArtist(null);
                      setArtistTracks([]);
                      setSelectedQueuePlaylist(null);
                    } else {
                      setViewMode('session');
                    }
                  }}
                  className="p-2 -ml-2 hover:bg-white/8 rounded-xl text-white/40 hover:text-white/80 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </motion.button>
              ) : null}
            </AnimatePresence>

            <div className="flex flex-col min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.h2
                  key={headerLabel}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-normal tracking-wide text-white/95 truncate leading-tight"
                  style={{ fontFamily: '"Kaobe", serif' }}
                >
                  {headerLabel}
                </motion.h2>
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {showSessionSearch && !searchQuery.trim() && (
                  <motion.span
                    key="queue-header-count"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] text-white/30 font-normal tracking-wide mt-0.5"
                  >
                    {items.length} {items.length === 1 ? 'song' : 'songs'} queued
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!selectedArtist && !selectedQueuePlaylist && (
            <button
              onClick={onClose}
              className="p-2 -mr-1 hover:bg-white/8 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
              title="Close"
            >
              <X className="w-4 h-4 text-white/35 hover:text-white/65" />
            </button>
          )}
        </div>

        {/* ── Search Bar ─────────────────────────────────────────── */}
        <div
          className={`shrink-0 transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
            showSessionSearch ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-5 pb-4">
            <QueueSearchBar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSearch={handleSearch}
              onUploadClick={() => fileInputRef.current?.click()}
              onFileChange={handleFileChange}
              searchInputRef={searchInputRef}
              fileInputRef={fileInputRef}
            />
          </div>
        </div>

        {/* Thin divider */}
        <div className="h-px bg-white/[0.05] shrink-0 mx-5" />


        <div className="relative flex-1 min-h-0 overflow-hidden z-10">
          <AnimatePresence mode="wait" initial={false}>
            {isLoadingArtist ? (
              <QueuePanelLayer layerKey="artist-loading">
                <div className="flex flex-col items-center justify-center py-24 text-center select-none">
                  <Loader2 className="w-8 h-8 text-white/40 animate-spin mb-3" />
                  <p className="text-xs text-white/40 font-medium tracking-wide">Loading tracks...</p>
                </div>
              </QueuePanelLayer>
            ) : selectedArtist ? (
              <QueuePanelLayer layerKey={`artist-${selectedArtist.name}`}>
                <QueueArtistSubview
                  artist={selectedArtist}
                  tracks={artistTracks}
                  accentColor={accentColor}
                  onPlaySong={handlePlaySongDirectly}
                  onAddToQueue={onAddToQueue ? handleAddSongToQueue : undefined}
                />
              </QueuePanelLayer>
            ) : selectedQueuePlaylist ? (
              <QueuePanelLayer layerKey={`playlist-${selectedQueuePlaylist.id}`} className="!p-0">
                <QueuePlaylistSubview
                  playlist={selectedQueuePlaylist}
                  onPlayAll={() => handlePlayPlaylistDirectly(selectedQueuePlaylist)}
                  onPlaySong={handlePlaySongDirectly}
                  onAddToQueue={onAddToQueue ? handleAddSongToQueue : undefined}
                />
              </QueuePanelLayer>
            ) : viewMode === 'library' ? (
              <QueuePanelLayer layerKey="library-hub">
                <QueueLibraryView
                  localPlaylists={localPlaylists}
                  localFavorites={localFavorites}
                  artistBubbles={artistBubbles}
                  onSelectPlaylist={setSelectedQueuePlaylist}
                  onOpenArtist={(artist) =>
                    openArtistProfile({
                      name: artist.name,
                      thumbnail: getCachedArtistThumbnail(artist.name, artist.thumbnail),
                      channelId: artist.channelId,
                      isTopic: true,
                    })
                  }
                  onPlaySong={handlePlaySongDirectly}
                  onAddToQueue={onAddToQueue ? handleAddSongToQueue : undefined}
                />
              </QueuePanelLayer>
            ) : searchQuery.trim() ? (
              <QueuePanelLayer layerKey="queue-search">
                <QueueSearchResults
                  isSearching={isSearching}
                  hasSearched={hasSearched}
                  searchResults={searchResults}
                  matchedArtist={matchedArtist}
                  accentColor={accentColor}
                  onOpenArtist={openArtistProfile}
                  onPlaySong={handlePlaySongDirectly}
                  onAddToQueue={onAddToQueue ? handleAddSongToQueue : undefined}
                />
              </QueuePanelLayer>
            ) : (
              <QueuePanelLayer layerKey="active-session">
                <div className="flex flex-col gap-8 text-left">
                  <QueueUpNext
                    items={items}
                    displayItems={displayItems}
                    currentSongId={currentSongId}
                    songData={songData}
                    accentColor={accentColor}
                    activeDragIndex={activeDragIndex}
                    onSelect={onSelect}
                    onRemove={onRemove}
                    onClearQueue={onClearQueue}
                    onShuffleQueue={onShuffleQueue}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  />
                  <QueueQuickAdd
                    localFavorites={localFavorites}
                    localHistory={localHistory}
                    showFavorites={showFavorites}
                    showHistory={showHistory}
                    onToggleFavorites={() => setShowFavorites((v) => !v)}
                    onToggleHistory={() => setShowHistory((v) => !v)}
                    onAddToQueue={onAddToQueue}
                    onBrowseLibrary={() => setViewMode('library')}
                    accentColor={accentColor}
                  />
                </div>
              </QueuePanelLayer>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
