import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, X, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AccentColor } from './themeUtils';
import { ELVA_STORAGE_KEYS, readJsonStorage } from '../utils/elvaStorage';
import type { QueueItem, Playlist, SearchResult, VerifiedArtist } from './queue/types';
import { useQueueLocalData } from './queue/useQueueLocalData';
import { useQueueDragReorder } from './queue/useQueueDragReorder';
import { getArtistMatchFromResults, fetchArtistDiscography, getCachedArtistThumbnail } from './queue/queueArtistUtils';
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
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  onReorder?: (newIds: string[]) => void;
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
  onFileSelect,
  onUrlSubmit,
  onReorder,
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
    if (!onFetchChannelUploads) return;
    setIsLoadingArtist(true);
    try {
      const thumbnail = getCachedArtistThumbnail(artist.name, artist.thumbnail);
      const uploads = await fetchArtistDiscography(
        { name: artist.name, channelId: artist.channelId },
        onFetchChannelUploads,
        onSearch
      );
      setSelectedArtist({ ...artist, thumbnail, isTopic: true });
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
    onSelectSong?.(playlist.tracks[0]);
    playlist.tracks.slice(1).forEach((track) => onAddToQueue?.(track));
    toast.success(`Playing playlist: ${playlist.name}`);
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1.5px] z-40 cursor-pointer pointer-events-auto"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[460px] bg-[#09090b]/85 border-l border-white/10 z-50 flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.65)] pointer-events-auto overflow-hidden backdrop-blur-3xl h-full"
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 100% 10%, var(--theme-primary) 0%, transparent 60%), radial-gradient(circle at 100% 90%, var(--theme-secondary) 0%, transparent 60%)',
          }}
        />

        <div className="relative px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 z-10 bg-black/10 select-none">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => {
                  if (selectedArtist || selectedQueuePlaylist) {
                    setSelectedArtist(null);
                    setArtistTracks([]);
                    setSelectedQueuePlaylist(null);
                  } else {
                    setViewMode('session');
                  }
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {!showBackButton && <Music className="w-4 h-4 text-white/40" />}
            <span
              className="text-lg font-normal tracking-wide text-white/95"
              style={{ fontFamily: '"Kaobe", serif' }}
            >
              {headerTitle()}
            </span>
            {!searchQuery.trim() && viewMode === 'session' && !selectedArtist && !selectedQueuePlaylist && (
              <span className="text-[10px] text-white/30 font-normal tracking-wider ml-1.5 lowercase">
                ({items.length} {items.length === 1 ? 'song' : 'songs'})
              </span>
            )}
          </div>

          {!selectedArtist && !selectedQueuePlaylist && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4 text-white/40 hover:text-white/60" />
            </button>
          )}
        </div>

        {!selectedArtist && !selectedQueuePlaylist && viewMode === 'session' && (
          <QueueSearchBar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            onUploadClick={() => fileInputRef.current?.click()}
            onFileChange={handleFileChange}
            searchInputRef={searchInputRef}
            fileInputRef={fileInputRef}
          />
        )}

        <div
          className={`flex-1 overflow-y-auto scrollbar-none relative z-10 pb-[120px] ${selectedArtist ? 'p-0' : 'p-5'}`}
        >
          <AnimatePresence mode="wait">
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
              <QueueArtistSubview
                artist={selectedArtist}
                tracks={artistTracks}
                accentColor={accentColor}
                onPlaySong={handlePlaySongDirectly}
                onAddToQueue={onAddToQueue ? handleAddSongToQueue : undefined}
              />
            ) : selectedQueuePlaylist ? (
              <QueuePlaylistSubview
                playlist={selectedQueuePlaylist}
                onPlayAll={() => handlePlayPlaylistDirectly(selectedQueuePlaylist)}
                onPlaySong={handlePlaySongDirectly}
                onAddToQueue={onAddToQueue ? handleAddSongToQueue : undefined}
              />
            ) : viewMode === 'library' ? (
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
            ) : searchQuery.trim() ? (
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
            ) : (
              <motion.div
                key="default-active-session"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-8 text-left"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
