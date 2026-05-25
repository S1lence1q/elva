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
    id: 's_v7qSskn4c',
    videoId: 's_v7qSskn4c',
    title: 'Heller Fri',
    artist: 'Kundo & Lamin',
    thumbnail: 'https://img.youtube.com/vi/s_v7qSskn4c/maxresdefault.jpg'
  },
  {
    id: 'f9jJ_w7T9pQ',
    videoId: 'f9jJ_w7T9pQ',
    title: 'Søvnløs',
    artist: 'KESI',
    thumbnail: 'https://img.youtube.com/vi/f9jJ_w7T9pQ/maxresdefault.jpg'
  },
  {
    id: '9lZJ02v1KzM',
    videoId: '9lZJ02v1KzM',
    title: 'Er Her',
    artist: 'Artigeardit & KESI',
    thumbnail: 'https://img.youtube.com/vi/9lZJ02v1KzM/maxresdefault.jpg'
  }
];

const DAILY_RECOMMENDATIONS: SearchResult[] = [
  {
    id: '4NRXx6U8ABQ',
    videoId: 'WnsQA8aW51E',
    title: 'Gode Dage, Onde Dage',
    artist: 'Lamin',
    thumbnail: 'https://img.youtube.com/vi/WnsQA8aW51E/maxresdefault.jpg'
  },
  {
    id: '9JbM4oE4h4w',
    videoId: 'm8mPki_tB1w',
    title: 'For Billede',
    artist: 'Kundo',
    thumbnail: 'https://img.youtube.com/vi/m8mPki_tB1w/maxresdefault.jpg'
  },
  {
    id: '2Vv-BfVoq4g',
    videoId: '450p7gOxZqI',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://img.youtube.com/vi/450p7gOxZqI/maxresdefault.jpg'
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
    description: 'Intense hip-hop and melancholic vibes for the late night hours.',
    tracks: [
      { id: 's_v7qSskn4c', videoId: 's_v7qSskn4c', title: 'Heller Fri', artist: 'Kundo & Lamin', thumbnail: 'https://img.youtube.com/vi/s_v7qSskn4c/maxresdefault.jpg' },
      { id: 'P5UWjgb-YaY', videoId: 'P5UWjgb-YaY', title: 'Overleve', artist: 'Ukendt Kunstner', thumbnail: 'https://img.youtube.com/vi/P5UWjgb-YaY/maxresdefault.jpg' },
      { id: 'f9jJ_w7T9pQ', videoId: 'f9jJ_w7T9pQ', title: 'Søvnløs', artist: 'KESI', thumbnail: 'https://img.youtube.com/vi/f9jJ_w7T9pQ/maxresdefault.jpg' }
    ]
  },
  {
    id: 'deep_focus',
    name: 'Deep Focus',
    description: 'Relaxing lo-fi, ambient, and neoclassical calm for concentration.',
    tracks: [
      { id: '5qap5aO4i9A', videoId: '5qap5aO4i9A', title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg' },
      { id: 'tNkZsLkLgp0', videoId: 'tNkZsLkLgp0', title: 'Gymnopédie No. 1', artist: 'Erik Satie', thumbnail: 'https://img.youtube.com/vi/tNkZsLkLgp0/maxresdefault.jpg' }
    ]
  },
  {
    id: 'intense_vibe',
    name: 'Intense Vibe',
    description: 'High energy, heavy beats, and raw rap to get you in the zone.',
    tracks: [
      { id: 'WnsQA8aW51E', videoId: 'WnsQA8aW51E', title: 'Gode Dage, Onde Dage', artist: 'Lamin', thumbnail: 'https://img.youtube.com/vi/WnsQA8aW51E/maxresdefault.jpg' },
      { id: '9lZJ02v1KzM', videoId: '9lZJ02v1KzM', title: 'Er Her', artist: 'Artigeardit & KESI', thumbnail: 'https://img.youtube.com/vi/9lZJ02v1KzM/maxresdefault.jpg' }
    ]
  }
];

const MOOD_META: Record<string, { color: string; glow: string }> = {
  late_night: {
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.25)',
  },
  deep_focus: {
    color: '#10b981', // Emerald
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  intense_vibe: {
    color: '#f43f5e', // Rose
    glow: 'rgba(244, 63, 94, 0.25)',
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
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
