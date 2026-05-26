import React from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Sparkles, Compass, Flame, Heart } from 'lucide-react';
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

// Pre-curated high quality track data for Discover Page
const TRENDING_SONGS: SearchResult[] = [
  {
    id: 'P5UWjgb-YaY',
    videoId: 'P5UWjgb-YaY',
    title: 'Overleve',
    artist: 'Ukendt Kunstner',
    thumbnail: 'https://img.youtube.com/vi/P5UWjgb-YaY/maxresdefault.jpg'
  },
  {
    id: 'FATeu0NreyG',
    videoId: 'FATeu0NreyG',
    title: 'North Face',
    artist: 'Kundo & Lamin',
    thumbnail: 'https://img.youtube.com/vi/FATeu0NreyG/maxresdefault.jpg'
  },
  {
    id: 'IQ2HTsYUUT4',
    videoId: 'IQ2HTsYUUT4',
    title: 'Søvnløs',
    artist: 'KESI',
    thumbnail: 'https://img.youtube.com/vi/IQ2HTsYUUT4/maxresdefault.jpg'
  },
  {
    id: 'F3z7Qk9F90I',
    videoId: 'F3z7Qk9F90I',
    title: 'Er Her',
    artist: 'Artigeardit & KESI',
    thumbnail: 'https://img.youtube.com/vi/F3z7Qk9F90I/maxresdefault.jpg'
  }
];

const DAILY_RECOMMENDATIONS: SearchResult[] = [
  {
    id: 'WnsQA8aW51E',
    videoId: 'WnsQA8aW51E',
    title: 'Gode Dage, Gode Drinks',
    artist: 'Lamin',
    thumbnail: 'https://img.youtube.com/vi/WnsQA8aW51E/maxresdefault.jpg'
  },
  {
    id: '0hN9lZ4N8g8',
    videoId: '0hN9lZ4N8g8',
    title: 'Signaler',
    artist: 'MAS feat. Kundo',
    thumbnail: 'https://img.youtube.com/vi/0hN9lZ4N8g8/maxresdefault.jpg'
  },
  {
    id: 'eVli1Y-ISIU',
    videoId: 'eVli1Y-ISIU',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    thumbnail: 'https://img.youtube.com/vi/eVli1Y-ISIU/maxresdefault.jpg'
  },
  {
    id: '4NRXx6U8ABQ',
    videoId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/maxresdefault.jpg'
  }
];

interface MoodPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: SearchResult[];
}

const MOOD_PLAYLISTS: MoodPlaylist[] = [
  {
    id: 'late_night',
    name: 'Late Night Drive',
    description: 'Intense Danish hip-hop and late night atmospheric vibes.',
    tracks: [
      { id: 'FATeu0NreyG', videoId: 'FATeu0NreyG', title: 'North Face', artist: 'Kundo & Lamin', thumbnail: 'https://img.youtube.com/vi/FATeu0NreyG/maxresdefault.jpg' },
      { id: 'P5UWjgb-YaY', videoId: 'P5UWjgb-YaY', title: 'Overleve', artist: 'Ukendt Kunstner', thumbnail: 'https://img.youtube.com/vi/P5UWjgb-YaY/maxresdefault.jpg' },
      { id: 'IQ2HTsYUUT4', videoId: 'IQ2HTsYUUT4', title: 'Søvnløs', artist: 'KESI', thumbnail: 'https://img.youtube.com/vi/IQ2HTsYUUT4/maxresdefault.jpg' },
      { id: 'WnsQA8aW51E', videoId: 'WnsQA8aW51E', title: 'Gode Dage, Gode Drinks', artist: 'Lamin', thumbnail: 'https://img.youtube.com/vi/WnsQA8aW51E/maxresdefault.jpg' }
    ]
  },
  {
    id: 'spotify_hits',
    name: 'Spotify Top Hits',
    description: 'The absolute biggest global tracks and chart-toppers right now.',
    tracks: [
      { id: 'eVli1Y-ISIU', videoId: 'eVli1Y-ISIU', title: 'Espresso', artist: 'Sabrina Carpenter', thumbnail: 'https://img.youtube.com/vi/eVli1Y-ISIU/maxresdefault.jpg' },
      { id: 'BY_X0W162RM', videoId: 'BY_X0W162RM', title: 'CHIHIRO', artist: 'Billie Eilish', thumbnail: 'https://img.youtube.com/vi/BY_X0W162RM/maxresdefault.jpg' },
      { id: 'HucYoZlMTn4', videoId: 'HucYoZlMTn4', title: 'Not Like Us', artist: 'Kendrick Lamar', thumbnail: 'https://img.youtube.com/vi/HucYoZlMTn4/maxresdefault.jpg' },
      { id: 'bUX8MDNQda4', videoId: 'bUX8MDNQda4', title: 'MILLION DOLLAR BABY', artist: 'Tommy Richman', thumbnail: 'https://img.youtube.com/vi/bUX8MDNQda4/maxresdefault.jpg' }
    ]
  },
  {
    id: 'deep_focus',
    name: 'Deep Focus & Study',
    description: 'Relaxing ambient sounds, soft neo-classical, and lofi for concentration.',
    tracks: [
      { id: '5qap5aO4i9A', videoId: '5qap5aO4i9A', title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg' },
      { id: 'tNkZsLkLgp0', videoId: 'tNkZsLkLgp0', title: 'Gymnopédie No. 1', artist: 'Erik Satie', thumbnail: 'https://img.youtube.com/vi/tNkZsLkLgp0/maxresdefault.jpg' },
      { id: 'UfcAVejsrU4', videoId: 'UfcAVejsrU4', title: 'Weightless', artist: 'Marconi Union', thumbnail: 'https://img.youtube.com/vi/UfcAVejsrU4/maxresdefault.jpg' }
    ]
  }
];

const MOOD_META: Record<string, { color: string; glow: string }> = {
  late_night: {
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.25)',
  },
  spotify_hits: {
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

  const handlePlayMoodPlaylist = (playlist: MoodPlaylist) => {
    if (playlist.tracks.length === 0) return;
    
    // Play first song instantly
    onSelectSong(playlist.tracks[0]);
    
    // Add rest to queue
    playlist.tracks.slice(1).forEach(track => {
      onAddToQueue(track);
    });

    toast.success(`Playing "${playlist.name}"`, {
      description: `Loaded ${playlist.tracks.length} tracks into your queue.`
    });
  };

  const isFavorite = (songId: string) => {
    return favorites.some(fav => fav.id === songId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-[898px] relative z-10 flex flex-col gap-10 px-6 pb-24 overflow-y-auto flex-1 scrollbar-none"
    >
      {/* Mood Playlists */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass className={`w-4 h-4 ${theme.text}`} />
          <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/50">Mood Playlists</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MOOD_PLAYLISTS.map((playlist, idx) => {
            return (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, ease: 'easeOut' }}
                whileHover={{
                  y: -6,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)'
                }}
                className="relative rounded-3xl border border-white/[0.04] p-6 flex flex-col justify-between bg-[#0a0a0c]/60 backdrop-blur-xl h-[170px] group transition-all duration-300"
              >
                <div className="space-y-2 relative z-10">
                  <h4 className="text-base font-semibold text-white/95">{playlist.name}</h4>
                  <p className="text-[11px] font-light text-white/50 leading-relaxed max-w-[85%]">{playlist.description}</p>
                </div>

                <div className="flex justify-between items-center relative z-10">
                  <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">{playlist.tracks.length} songs</span>
                  <button
                    onClick={() => handlePlayMoodPlaylist(playlist)}
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
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/50">Trending Now</h3>
          </div>

          <div className="space-y-3.5">
            {TRENDING_SONGS.map((song, idx) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0">
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
                  <div>
                    <h4 className="text-sm font-medium text-white/90 leading-snug">{song.title}</h4>
                    <p className="text-[11px] text-white/40 mt-0.5">{song.artist}</p>
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

        {/* Daily Recommendations */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/50">Daily Picks</h3>
          </div>

          <div className="space-y-3.5">
            {DAILY_RECOMMENDATIONS.map((song, idx) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0">
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
                  <div>
                    <h4 className="text-sm font-medium text-white/90 leading-snug">{song.title}</h4>
                    <p className="text-[11px] text-white/40 mt-0.5">{song.artist}</p>
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
