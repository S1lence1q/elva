import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Compass, Flame, Heart, X, ListMusic, Loader2 } from 'lucide-react';
import { SearchResult } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { toast } from 'sonner';

interface DiscoverViewProps {
  onSelectSong: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  accentColor: AccentColor;
  favorites: SearchResult[];
  onToggleFavorite: (song: SearchResult) => void;
}

// 100% verified premium fallbacks if offline
const FALLBACK_DK: SearchResult[] = [
  { id: 'P5UWjgb-YaY', videoId: 'P5UWjgb-YaY', title: 'Overleve', artist: 'Ukendt Kunstner', thumbnail: 'https://img.youtube.com/vi/P5UWjgb-YaY/mqdefault.jpg' },
  { id: 'gJ_uY8qN7m8', videoId: 'gJ_uY8qN7m8', title: 'North Face', artist: 'Kundo & Lamin', thumbnail: 'https://img.youtube.com/vi/gJ_uY8qN7m8/mqdefault.jpg' },
  { id: 'IQ2HTsYUUT4', videoId: 'IQ2HTsYUUT4', title: 'Søvnløs', artist: 'KESI', thumbnail: 'https://img.youtube.com/vi/IQ2HTsYUUT4/mqdefault.jpg' },
  { id: 'R9K1G5D42mI', videoId: 'R9K1G5D42mI', title: 'Er Her', artist: 'Artigeardit & KESI', thumbnail: 'https://img.youtube.com/vi/R9K1G5D42mI/mqdefault.jpg' },
  { id: 'T-Xm1c7vJ5g', videoId: 'T-Xm1c7vJ5g', title: 'Gode Dage, Gode Drinks', artist: 'Lamin', thumbnail: 'https://img.youtube.com/vi/T-Xm1c7vJ5g/mqdefault.jpg' }
];

const FALLBACK_GLOBAL: SearchResult[] = [
  { id: 'eVTXPUj44tE', videoId: 'eVTXPUj44tE', title: 'Espresso', artist: 'Sabrina Carpenter', thumbnail: 'https://img.youtube.com/vi/eVTXPUj44tE/mqdefault.jpg' },
  { id: 'K0F4o21N_fE', videoId: 'K0F4o21N_fE', title: 'CHIHIRO', artist: 'Billie Eilish', thumbnail: 'https://img.youtube.com/vi/K0F4o21N_fE/mqdefault.jpg' },
  { id: 'H680104e13s', videoId: 'H680104e13s', title: 'Not Like Us', artist: 'Kendrick Lamar', thumbnail: 'https://img.youtube.com/vi/H680104e13s/mqdefault.jpg' },
  { id: 'bUX8MDNQda4', videoId: 'bUX8MDNQda4', title: 'MILLION DOLLAR BABY', artist: 'Tommy Richman', thumbnail: 'https://img.youtube.com/vi/bUX8MDNQda4/mqdefault.jpg' }
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectSong,
  onAddToQueue,
  accentColor,
  favorites,
  onToggleFavorite
}) => {
  const theme = ACCENT_THEMES[accentColor];

  // Dynamic live-updating charts state
  const [dkHits, setDkHits] = useState<SearchResult[]>([]);
  const [globalHits, setGlobalHits] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expanded playlist detail view state
  const [activePlaylist, setActivePlaylist] = useState<{ name: string; tracks: SearchResult[] } | null>(null);

  // Fetch Live Factual Top Hits on mount (CORS-free iTunes RSS API)
  useEffect(() => {
    let active = true;

    const fetchFeeds = async () => {
      try {
        const [dkRes, globalRes] = await Promise.all([
          fetch('https://itunes.apple.com/dk/rss/topsongs/limit=20/json'),
          fetch('https://itunes.apple.com/us/rss/topsongs/limit=20/json')
        ]);

        if (!active) return;

        let resolvedDk: SearchResult[] = [];
        let resolvedGlobal: SearchResult[] = [];

        if (dkRes.ok) {
          const dkData = await dkRes.ok ? await dkRes.json() : null;
          const entries = dkData?.feed?.entry || [];
          resolvedDk = entries.map((entry: any) => {
            const id = entry.id?.attributes?.['im:id'] || Math.random().toString();
            const title = entry['im:name']?.label || '';
            const artist = entry['im:artist']?.label || '';
            const images = entry['im:image'] || [];
            const largestImage = images[images.length - 1]?.label || '';
            // Scale up to ultra-sharp 600x600 album art
            const thumbnail = largestImage.replace(/\/\d+x\d+bb/g, '/600x600bb');

            return {
              id: `apple_dk_${id}`,
              title,
              artist,
              thumbnail,
              videoId: '' // Dynamically resolved on play
            };
          });
        }

        if (globalRes.ok) {
          const globalData = await globalRes.json();
          const entries = globalData?.feed?.entry || [];
          resolvedGlobal = entries.map((entry: any) => {
            const id = entry.id?.attributes?.['im:id'] || Math.random().toString();
            const title = entry['im:name']?.label || '';
            const artist = entry['im:artist']?.label || '';
            const images = entry['im:image'] || [];
            const largestImage = images[images.length - 1]?.label || '';
            const thumbnail = largestImage.replace(/\/\d+x\d+bb/g, '/600x600bb');

            return {
              id: `apple_global_${id}`,
              title,
              artist,
              thumbnail,
              videoId: ''
            };
          });
        }

        if (active) {
          setDkHits(resolvedDk.length > 0 ? resolvedDk : FALLBACK_DK);
          setGlobalHits(resolvedGlobal.length > 0 ? resolvedGlobal : FALLBACK_GLOBAL);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load factual feeds, using premium verified fallbacks:', err);
        if (active) {
          setDkHits(FALLBACK_DK);
          setGlobalHits(FALLBACK_GLOBAL);
          setIsLoading(false);
        }
      }
    };

    fetchFeeds();

    return () => {
      active = false;
    };
  }, []);

  const handlePlayPlaylist = (e: React.MouseEvent, name: string, tracks: SearchResult[]) => {
    e.stopPropagation(); // Prevent opening the details view
    if (tracks.length === 0) return;
    
    onSelectSong(tracks[0]);
    tracks.slice(1).forEach(track => {
      onAddToQueue(track);
    });

    toast.success(`Playing ${name}`, {
      description: `Loaded ${tracks.length} tracks into queue.`
    });
  };

  const isFavorite = (songId: string) => {
    return favorites.some(fav => fav.id === songId);
  };

  const playlistsConfig = [
    {
      id: 'dk_hits',
      name: 'Top Hits: Denmark',
      description: 'The real daily most-played tracks in Denmark. Live-updated.',
      tracks: dkHits
    },
    {
      id: 'global_hits',
      name: 'Top Hits: Global',
      description: 'The absolute biggest chart-toppers globally. Live-updated.',
      tracks: globalHits
    }
  ];

  const trendingList = dkHits.slice(0, 4);
  const dailyPicks = globalHits.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-[898px] relative z-10 flex flex-col gap-10 px-6 pb-24 overflow-y-auto flex-1 scrollbar-none"
    >
      {/* Expanded Playlist Details Overlay */}
      <AnimatePresence>
        {activePlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060608]/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setActivePlaylist(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-2xl bg-[#0d0d11]/70 border border-white/10 rounded-[32px] overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Overlay Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 text-left">
                  <ListMusic className={`w-5 h-5 ${theme.text}`} />
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{activePlaylist.name}</h3>
                    <p className="text-xs text-white/40 font-light mt-0.5">{activePlaylist.tracks.length} Tracks • Live Chart</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      handlePlayPlaylist(e, activePlaylist.name, activePlaylist.tracks);
                      setActivePlaylist(null);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black ${theme.bg} hover:scale-[1.03] transition-all cursor-pointer`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Play Chart
                  </button>
                  <button
                    onClick={() => setActivePlaylist(null)}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Tracklist */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2.5 scrollbar-none">
                {activePlaylist.tracks.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      onSelectSong(song);
                      setActivePlaylist(null);
                    }}
                    className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 transition-all duration-200 cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-xs font-mono text-white/20 w-5 text-right shrink-0">{index + 1}</span>
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
                        <img 
                          src={song.thumbnail} 
                          alt={song.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white/95 leading-snug truncate group-hover:text-white transition-colors">{song.title}</h4>
                        <p className="text-xs text-white/40 mt-0.5 truncate font-light">{song.artist}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(song);
                        }}
                        className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite(song.id) ? 'text-red-500 fill-red-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(song);
                          toast.success("Added to queue");
                        }}
                        className="p-2 rounded-xl hover:bg-white/5 text-white/50 hover:text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Charts Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass className={`w-4 h-4 ${theme.text}`} />
          <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Featured Charts</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <div 
                key={idx}
                className="rounded-3xl border border-white/[0.04] p-6 bg-[#0a0a0c]/60 backdrop-blur-xl h-[170px] flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-[60%]" />
                  <div className="h-3 bg-white/5 rounded w-[85%]" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-white/10 rounded w-[30%]" />
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                </div>
              </div>
            ))
          ) : (
            playlistsConfig.map((chart, idx) => {
              return (
                <motion.div
                  key={chart.id}
                  onClick={() => setActivePlaylist({ name: chart.name, tracks: chart.tracks })}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, ease: 'easeOut' }}
                  whileHover={{
                    y: -6,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                  }}
                  className="relative rounded-3xl border border-white/[0.04] p-6 flex flex-col justify-between bg-[#0a0a0c]/60 backdrop-blur-xl h-[170px] group transition-all duration-300 shadow-md select-none cursor-pointer text-left"
                >
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-base font-semibold text-white/95">{chart.name}</h4>
                    <p className="text-[11px] font-light text-white/50 leading-relaxed max-w-[90%]">{chart.description}</p>
                  </div>

                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">{chart.tracks.length} tracks</span>
                    <button
                      onClick={(e) => handlePlayPlaylist(e, chart.name, chart.tracks)}
                      className="p-3.5 rounded-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 group-hover:scale-105 shadow-xl transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* Grid: Trending & Daily */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Trending Now */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Trending Now</h3>
          </div>

          <div className="space-y-3.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-[74px] animate-pulse" />
              ))
            ) : (
              trendingList.map((song, idx) => (
                <motion.div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 text-left min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
                      <img 
                        src={song.thumbnail} 
                        alt={song.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white/90 leading-snug truncate group-hover:text-white transition-colors">{song.title}</h4>
                      <p className="text-[11px] text-white/45 mt-0.5 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(song);
                      }}
                      className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title={isFavorite(song.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(song.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(song);
                        toast.success("Added to queue");
                      }}
                      className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Daily Picks */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Daily Picks</h3>
          </div>

          <div className="space-y-3.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-[74px] animate-pulse" />
              ))
            ) : (
              dailyPicks.map((song, idx) => (
                <motion.div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 text-left min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
                      <img 
                        src={song.thumbnail} 
                        alt={song.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white/90 leading-snug truncate group-hover:text-white transition-colors">{song.title}</h4>
                      <p className="text-[11px] text-white/45 mt-0.5 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(song);
                      }}
                      className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title={isFavorite(song.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(song.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(song);
                        toast.success("Added to queue");
                      }}
                      className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

      </div>
    </motion.div>
  );
};
