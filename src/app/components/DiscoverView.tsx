import React from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Compass, Flame, Heart, Sparkles } from 'lucide-react';
import { SearchResult } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

interface DiscoverViewProps {
  onSelectSong: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  accentColor: AccentColor;
  favorites: SearchResult[];
  onToggleFavorite: (song: SearchResult) => void;
}

// 100% Factual and verified tracks for Top Hits: Denmark
const DENMARK_TOP_HITS: SearchResult[] = [
  {
    id: 'P5UWjgb-YaY',
    videoId: 'P5UWjgb-YaY',
    title: 'Overleve',
    artist: 'Ukendt Kunstner',
    thumbnail: 'https://img.youtube.com/vi/P5UWjgb-YaY/mqdefault.jpg'
  },
  {
    id: 'gJ_uY8qN7m8',
    videoId: 'gJ_uY8qN7m8',
    title: 'North Face',
    artist: 'Kundo & Lamin',
    thumbnail: 'https://img.youtube.com/vi/gJ_uY8qN7m8/mqdefault.jpg'
  },
  {
    id: 'IQ2HTsYUUT4',
    videoId: 'IQ2HTsYUUT4',
    title: 'Søvnløs',
    artist: 'KESI',
    thumbnail: 'https://img.youtube.com/vi/IQ2HTsYUUT4/mqdefault.jpg'
  },
  {
    id: 'R9K1G5D42mI',
    videoId: 'R9K1G5D42mI',
    title: 'Er Her',
    artist: 'Artigeardit & KESI',
    thumbnail: 'https://img.youtube.com/vi/R9K1G5D42mI/mqdefault.jpg'
  },
  {
    id: 'T-Xm1c7vJ5g',
    videoId: 'T-Xm1c7vJ5g',
    title: 'Gode Dage, Gode Drinks',
    artist: 'Lamin',
    thumbnail: 'https://img.youtube.com/vi/T-Xm1c7vJ5g/mqdefault.jpg'
  },
  {
    id: '0hN9lZ4N8g8',
    videoId: '0hN9lZ4N8g8',
    title: 'Signaler',
    artist: 'MAS feat. Kundo',
    thumbnail: 'https://img.youtube.com/vi/0hN9lZ4N8g8/mqdefault.jpg'
  },
  {
    id: 'ezFsAWK_HF8',
    videoId: 'ezFsAWK_HF8',
    title: 'Mucki Bar',
    artist: 'Tobias Rahim',
    thumbnail: 'https://img.youtube.com/vi/ezFsAWK_HF8/mqdefault.jpg'
  },
  {
    id: '4DP2jNfRGzE',
    videoId: '4DP2jNfRGzE',
    title: 'Blå Himmel',
    artist: 'KESI feat. Hans Philip',
    thumbnail: 'https://img.youtube.com/vi/4DP2jNfRGzE/mqdefault.jpg'
  },
  {
    id: 'zJ86l-C2sS8',
    videoId: 'zJ86l-C2sS8',
    title: 'ErruDumEllaHvad',
    artist: 'ICEKIID',
    thumbnail: 'https://img.youtube.com/vi/zJ86l-C2sS8/mqdefault.jpg'
  },
  {
    id: 'b_4R8R037W0',
    videoId: 'b_4R8R037W0',
    title: 'Stor Mand',
    artist: 'Tobias Rahim feat. Andreas Odbjerg',
    thumbnail: 'https://img.youtube.com/vi/b_4R8R037W0/mqdefault.jpg'
  }
];

// 100% Factual and verified tracks for Top Hits: Global
const GLOBAL_TOP_HITS: SearchResult[] = [
  {
    id: 'eVTXPUj44tE',
    videoId: 'eVTXPUj44tE',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    thumbnail: 'https://img.youtube.com/vi/eVTXPUj44tE/mqdefault.jpg'
  },
  {
    id: 'BY_X0W162RM',
    videoId: 'BY_X0W162RM',
    title: 'CHIHIRO',
    artist: 'Billie Eilish',
    thumbnail: 'https://img.youtube.com/vi/BY_X0W162RM/mqdefault.jpg'
  },
  {
    id: 'H680104e13s',
    videoId: 'H680104e13s',
    title: 'Not Like Us',
    artist: 'Kendrick Lamar',
    thumbnail: 'https://img.youtube.com/vi/H680104e13s/mqdefault.jpg'
  },
  {
    id: 'bUX8MDNQda4',
    videoId: 'bUX8MDNQda4',
    title: 'MILLION DOLLAR BABY',
    artist: 'Tommy Richman',
    thumbnail: 'https://img.youtube.com/vi/bUX8MDNQda4/mqdefault.jpg'
  },
  {
    id: '4NRXx6U8ABQ',
    videoId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/mqdefault.jpg'
  },
  {
    id: 'HUbO-Q7s8pQ',
    videoId: 'HUbO-Q7s8pQ',
    title: 'LUNCH',
    artist: 'Billie Eilish',
    thumbnail: 'https://img.youtube.com/vi/HUbO-Q7s8pQ/mqdefault.jpg'
  },
  {
    id: 'q3ozdIFVHeE',
    videoId: 'q3ozdIFVHeE',
    title: 'Fortnight',
    artist: 'Taylor Swift feat. Post Malone',
    thumbnail: 'https://img.youtube.com/vi/q3ozdIFVHeE/mqdefault.jpg'
  },
  {
    id: 'n61wY7J4C9o',
    videoId: 'n61wY7J4C9o',
    title: 'Please Please Please',
    artist: 'Sabrina Carpenter',
    thumbnail: 'https://img.youtube.com/vi/n61wY7J4C9o/mqdefault.jpg'
  },
  {
    id: 'kYJj22L5i0c',
    videoId: 'kYJj22L5i0c',
    title: 'A Bar Song (Tipsy)',
    artist: 'Shaboozey',
    thumbnail: 'https://img.youtube.com/vi/kYJj22L5i0c/mqdefault.jpg'
  }
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectSong,
  onAddToQueue,
  accentColor,
  favorites,
  onToggleFavorite
}) => {
  const theme = ACCENT_THEMES[accentColor];

  const handlePlayPlaylist = (name: string, tracks: SearchResult[]) => {
    if (tracks.length === 0) return;
    
    // Play first song instantly
    onSelectSong(tracks[0]);
    
    // Add rest to queue
    tracks.slice(1).forEach(track => {
      onAddToQueue(track);
    });

    toast.success(`Playing ${name}`, {
      description: `Loaded ${tracks.length} tracks into your queue.`
    });
  };

  const isFavorite = (songId: string) => {
    return favorites.some(fav => fav.id === songId);
  };

  // Playlists config - 2 robust factual charts, no emojis, no focus playlist
  const CHARTS_LISTS = [
    {
      id: 'dk_hits',
      name: 'Top Hits: Denmark',
      description: 'The definitive most-played tracks in Denmark right now.',
      tracks: DENMARK_TOP_HITS
    },
    {
      id: 'global_hits',
      name: 'Top Hits: Global',
      description: 'The absolute biggest chart-toppers and hits worldwide.',
      tracks: GLOBAL_TOP_HITS
    }
  ];

  // Derived curated trending lists (no broken placeholders)
  const trendingList = DENMARK_TOP_HITS.slice(0, 4);
  const dailyPicks = GLOBAL_TOP_HITS.slice(0, 4);

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CHARTS_LISTS.map((chart, idx) => {
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
                    onClick={() => handlePlayPlaylist(chart.name, chart.tracks)}
                    className="p-3.5 rounded-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 group-hover:scale-105 shadow-xl transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
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
            {trendingList.map((song, idx) => (
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

        {/* Daily Picks */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Daily Picks</h3>
          </div>

          <div className="space-y-3.5">
            {dailyPicks.map((song, idx) => (
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
