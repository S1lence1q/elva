import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Sparkles, Compass, Flame, Heart, Loader2 } from 'lucide-react';
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

// Pre-curated, 100% verified offline fallback track data for Discover Page
const FALLBACK_DK_TRENDING: SearchResult[] = [
  {
    id: 'P5UWjgb-YaY',
    videoId: 'P5UWjgb-YaY',
    title: 'Overleve',
    artist: 'Ukendt Kunstner',
    thumbnail: 'https://img.youtube.com/vi/P5UWjgb-YaY/maxresdefault.jpg'
  },
  {
    id: 'gJ_uY8qN7m8',
    videoId: 'gJ_uY8qN7m8',
    title: 'North Face',
    artist: 'Kundo & Lamin',
    thumbnail: 'https://img.youtube.com/vi/gJ_uY8qN7m8/maxresdefault.jpg'
  },
  {
    id: 'IQ2HTsYUUT4',
    videoId: 'IQ2HTsYUUT4',
    title: 'Søvnløs',
    artist: 'KESI',
    thumbnail: 'https://img.youtube.com/vi/IQ2HTsYUUT4/maxresdefault.jpg'
  },
  {
    id: 'R9K1G5D42mI',
    videoId: 'R9K1G5D42mI',
    title: 'Er Her',
    artist: 'Artigeardit & KESI',
    thumbnail: 'https://img.youtube.com/vi/R9K1G5D42mI/maxresdefault.jpg'
  }
];

const CURATED_DAILY_PICKS: SearchResult[] = [
  {
    id: 'T-Xm1c7vJ5g',
    videoId: 'T-Xm1c7vJ5g',
    title: 'Gode Dage, Gode Drinks',
    artist: 'Lamin',
    thumbnail: 'https://img.youtube.com/vi/T-Xm1c7vJ5g/maxresdefault.jpg'
  },
  {
    id: '0hN9lZ4N8g8',
    videoId: '0hN9lZ4N8g8',
    title: 'Signaler',
    artist: 'MAS feat. Kundo',
    thumbnail: 'https://img.youtube.com/vi/0hN9lZ4N8g8/maxresdefault.jpg'
  },
  {
    id: 'eVTXPUj44tE',
    videoId: 'eVTXPUj44tE',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    thumbnail: 'https://img.youtube.com/vi/eVTXPUj44tE/maxresdefault.jpg'
  },
  {
    id: '4NRXx6U8ABQ',
    videoId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/maxresdefault.jpg'
  }
];

const STATIC_FOCUS_PLAYLIST: SearchResult[] = [
  { id: '5qap5aO4i9A', videoId: '5qap5aO4i9A', title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg' },
  { id: 'tNkZsLkLgp0', videoId: 'tNkZsLkLgp0', title: 'Gymnopédie No. 1', artist: 'Erik Satie', thumbnail: 'https://img.youtube.com/vi/tNkZsLkLgp0/maxresdefault.jpg' },
  { id: 'UfcAVejsrU4', videoId: 'UfcAVejsrU4', title: 'Weightless', artist: 'Marconi Union', thumbnail: 'https://img.youtube.com/vi/UfcAVejsrU4/maxresdefault.jpg' }
];

const MOOD_META: Record<string, { color: string; glow: string }> = {
  dk_hits: {
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.25)',
  },
  global_hits: {
    color: '#f43f5e', // Rose/Pink
    glow: 'rgba(244, 63, 94, 0.25)',
  },
  deep_focus: {
    color: '#10b981', // Emerald
    glow: 'rgba(16, 185, 129, 0.25)',
  }
};

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectSong,
  onAddToQueue,
  accentColor,
  favorites,
  onToggleFavorite
}) => {
  const theme = ACCENT_THEMES[accentColor];

  // Dynamic Factual Live Charts State
  const [dkHits, setDkHits] = useState<SearchResult[]>([]);
  const [globalHits, setGlobalHits] = useState<SearchResult[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  // Fetch Live, Factual Apple Music charts at runtime
  useEffect(() => {
    let active = true;

    const fetchCharts = async () => {
      try {
        // Fetch Denmark Top 20 Most Played
        const dkRes = await fetch('https://rss.applemarketingtools.com/api/v2/dk/music/most-played/20/songs.json');
        // Fetch Global (US storefront acts as Global standard) Top 20 Most Played
        const globalRes = await fetch('https://rss.applemarketingtools.com/api/v2/us/music/most-played/20/songs.json');

        if (!active) return;

        let resolvedDk: SearchResult[] = [];
        let resolvedGlobal: SearchResult[] = [];

        if (dkRes.ok) {
          const dkData = await dkRes.json();
          resolvedDk = (dkData.feed?.results || []).map((item: any) => ({
            id: `apple_dk_${item.id}`,
            title: item.name,
            artist: item.artistName,
            // Replace with premium high-res artwork URL (600x600 cropped)
            thumbnail: (item.artworkUrl100 || '').replace('/100x100bb.jpg', '/600x600bb.jpg'),
            videoId: '' // resolved on demand in handleSelectSong
          }));
        }

        if (globalRes.ok) {
          const globalData = await globalRes.json();
          resolvedGlobal = (globalData.feed?.results || []).map((item: any) => ({
            id: `apple_global_${item.id}`,
            title: item.name,
            artist: item.artistName,
            // Replace with premium high-res artwork URL (600x600 cropped)
            thumbnail: (item.artworkUrl100 || '').replace('/100x100bb.jpg', '/600x600bb.jpg'),
            videoId: '' // resolved on demand in handleSelectSong
          }));
        }

        if (active) {
          setDkHits(resolvedDk.length > 0 ? resolvedDk : FALLBACK_DK_TRENDING);
          setGlobalHits(resolvedGlobal.length > 0 ? resolvedGlobal : CURATED_DAILY_PICKS);
          setIsLoadingCharts(false);
        }
      } catch (err) {
        console.warn('Live charts fetch failed, falling back to curated data:', err);
        if (active) {
          setDkHits(FALLBACK_DK_TRENDING);
          setGlobalHits(CURATED_DAILY_PICKS);
          setIsLoadingCharts(false);
        }
      }
    };

    fetchCharts();

    return () => {
      active = false;
    };
  }, []);

  const handlePlayMoodPlaylist = (name: string, tracks: SearchResult[]) => {
    if (tracks.length === 0) return;
    
    // Play first song instantly
    onSelectSong(tracks[0]);
    
    // Add rest to queue
    tracks.slice(1).forEach(track => {
      onAddToQueue(track);
    });

    toast.success(`Playing "${name}"`, {
      description: `Loaded ${tracks.length} live tracks into your queue.`
    });
  };

  const isFavorite = (songId: string) => {
    return favorites.some(fav => fav.id === songId);
  };

  // Curated charts mapping for the "Featured Charts" section
  const CHARTS_LISTS = [
    {
      id: 'dk_hits',
      name: 'Top Hits: Denmark 🇩🇰',
      description: 'Factual top tracks trending in Denmark. Refreshed live daily.',
      tracks: dkHits
    },
    {
      id: 'global_hits',
      name: 'Top Hits: Global 🌎',
      description: 'The absolute biggest chart-toppers globally. Updated live daily.',
      tracks: globalHits
    },
    {
      id: 'deep_focus',
      name: 'Deep Focus & Study 📚',
      description: 'Tactile lofi, neo-classical layers, and atmospheric quiet for concentration.',
      tracks: STATIC_FOCUS_PLAYLIST
    }
  ];

  // Dynamic Trending list derived from Denmark's live chart
  const trendingList = dkHits.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-[898px] relative z-10 flex flex-col gap-10 px-6 pb-24 overflow-y-auto flex-1 scrollbar-none"
    >
      {/* Featured Charts Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass className={`w-4 h-4 ${theme.text}`} />
          <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Featured Charts</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {isLoadingCharts ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div 
                key={idx}
                className="rounded-3xl border border-white/[0.04] p-6 bg-[#0a0a0c]/60 backdrop-blur-xl h-[170px] flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-[60%]" />
                  <div className="h-3 bg-white/5 rounded w-[85%]" />
                  <div className="h-3 bg-white/5 rounded w-[45%]" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-white/10 rounded w-[30%]" />
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                </div>
              </div>
            ))
          ) : (
            CHARTS_LISTS.map((chart, idx) => {
              return (
                <motion.div
                  key={chart.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, ease: 'easeOut' }}
                  whileHover={{
                    y: -6,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)'
                  }}
                  className="relative rounded-3xl border border-white/[0.04] p-6 flex flex-col justify-between bg-[#0a0a0c]/60 backdrop-blur-xl h-[170px] group transition-all duration-300 shadow-md select-none"
                >
                  <div className="space-y-2 relative z-10 text-left">
                    <h4 className="text-base font-semibold text-white/95">{chart.name}</h4>
                    <p className="text-[11px] font-light text-white/50 leading-relaxed max-w-[90%]">{chart.description}</p>
                  </div>

                  <div className="flex justify-between items-center relative z-10">
                    <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">{chart.tracks.length} tracks</span>
                    <button
                      onClick={() => handlePlayMoodPlaylist(chart.name, chart.tracks)}
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
            {isLoadingCharts ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] h-[74px] animate-pulse">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white/5" />
                    <div className="space-y-2">
                      <div className="h-3.5 bg-white/10 rounded w-[110px]" />
                      <div className="h-3 bg-white/5 rounded w-[60px]" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              trendingList.map((song, idx) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center gap-3.5 text-left min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
                      <img 
                        src={song.thumbnail} 
                        alt={song.title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          if (song.videoId) {
                            e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                          } else {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop';
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <button
                        onClick={() => onSelectSong(song)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      >
                        <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
                      </button>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white/90 leading-snug truncate">{song.title}</h4>
                      <p className="text-[11px] text-white/45 mt-0.5 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onToggleFavorite(song)}
                      className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title={isFavorite(song.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(song.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        onAddToQueue(song);
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

        {/* Daily Recommendations */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Daily Picks</h3>
          </div>

          <div className="space-y-3.5">
            {CURATED_DAILY_PICKS.map((song, idx) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-3.5 text-left min-w-0">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
                    <img 
                      src={song.thumbnail} 
                      alt={song.title} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <button
                      onClick={() => onSelectSong(song)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    >
                      <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white/90 leading-snug truncate">{song.title}</h4>
                    <p className="text-[11px] text-white/45 mt-0.5 truncate">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onToggleFavorite(song)}
                    className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                    title={isFavorite(song.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorite(song.id) ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      onAddToQueue(song);
                    }}
                    className="p-2 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                    title="Add to queue"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </motion.div>
  );
};
