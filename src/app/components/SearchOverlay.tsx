import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Music, Plus } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

interface SearchOverlayProps {
  onClose: () => void;
  onSelectSong: (result: SearchResult) => void;
  onAddToQueue: (result: SearchResult) => void;
}

export function SearchOverlay({ onClose, onSelectSong, onAddToQueue }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Mock YouTube search results
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Midnight Dreams - Lofi Hip Hop',
          artist: 'ChillBeats',
          thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
          videoId: 'jfKfPfyJRdk'
        },
        {
          id: '2',
          title: 'Ocean Waves - Ambient Mix',
          artist: 'Nature Sounds',
          thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
          videoId: '5qap5aO4i9A'
        },
        {
          id: '3',
          title: 'Neon Lights - Synthwave',
          artist: 'RetroWave',
          thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
          videoId: '4xDzrJKXOOY'
        },
        {
          id: '4',
          title: 'Forest Dreams - Nature Ambience',
          artist: 'Calm Collective',
          thumbnail: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
          videoId: 'nDq6TstdEi8'
        },
        {
          id: '5',
          title: 'Starlight - Electronic Chill',
          artist: 'Space Vibes',
          thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
          videoId: 'M5QY2_8704o'
        }
      ];

      setSearchResults(mockResults);
      setIsSearching(false);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-white/80 tracking-wide">Find Music</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white/40 hover:text-white/60" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a song..."
            autoFocus
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 placeholder-white/30 text-sm focus:outline-none focus:border-white/20 transition-colors backdrop-blur-xl"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 text-white/40 text-sm"
              >
                Searching...
              </motion.div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {searchResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      onSelectSong(result);
                      onClose();
                    }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Music className="w-5 h-5 text-white/0 group-hover:text-white/80 transition-colors" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-white/80 text-sm font-medium truncate group-hover:text-white/90 transition-colors">
                        {result.title}
                      </h3>
                      <p className="text-white/40 text-xs truncate">
                        {result.artist}
                      </p>
                    </div>

                    {/* Add to queue */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(result);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs text-white/40">Queue</span>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-white/40 text-sm"
              >
                Press Enter to search
              </motion.div>
            )}

            {!isSearching && searchResults.length === 0 && !searchQuery && (
              <div className="text-center py-12 text-white/40 text-sm">
                Search for music to add to your session
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
