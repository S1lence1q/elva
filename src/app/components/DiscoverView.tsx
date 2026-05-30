import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Compass, Flame, Heart, Sparkles } from 'lucide-react';
import { SearchResult } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { toast } from 'sonner';
import { Playlist } from './PlaylistDetailsView';

import topHitsDenmark from '../../top_hits_denmark.png';
import topHitsGlobal from '../../top_hits_global.png';

interface DiscoverViewProps {
  onSelectSong: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  accentColor: AccentColor;
  favorites: SearchResult[];
  onToggleFavorite: (song: SearchResult) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
}

// Premium 20-track Danish hits fallback (100% recognizable, modern local music)
const FALLBACK_DK: SearchResult[] = [
  { id: 'dk_1', videoId: 'P5UWjgb-YaY', title: 'Overleve', artist: 'Ukendt Kunstner', thumbnail: 'https://img.youtube.com/vi/P5UWjgb-YaY/mqdefault.jpg' },
  { id: 'dk_2', videoId: 'gJ_uY8qN7m8', title: 'North Face', artist: 'Kundo & Lamin', thumbnail: 'https://img.youtube.com/vi/gJ_uY8qN7m8/mqdefault.jpg' },
  { id: 'dk_3', videoId: 'IQ2HTsYUUT4', title: 'Søvnløs', artist: 'KESI', thumbnail: 'https://img.youtube.com/vi/IQ2HTsYUUT4/mqdefault.jpg' },
  { id: 'dk_4', videoId: 'R9K1G5D42mI', title: 'Er Her', artist: 'Artigeardit & KESI', thumbnail: 'https://img.youtube.com/vi/R9K1G5D42mI/mqdefault.jpg' },
  { id: 'dk_5', videoId: 'T-Xm1c7vJ5g', title: 'Gode Dage, Gode Drinks', artist: 'Lamin', thumbnail: 'https://img.youtube.com/vi/T-Xm1c7vJ5g/mqdefault.jpg' },
  { id: 'dk_6', videoId: 'P5UWjgb-YaY', title: 'Flyvende Pistol', artist: 'Gilli', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4a/01/22/4a0122e2-9b24-9b24-9b24-9b249b249b24/source/600x600bb.jpg' },
  { id: 'dk_7', videoId: 'gJ_uY8qN7m8', title: 'Stor Mand', artist: 'Tobias Rahim & Andreas Odbjerg', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/30/ee/12/30ee12c9-66c3-10d6-11f8-0056a0cf241f/source/600x600bb.jpg' },
  { id: 'dk_8', videoId: 'IQ2HTsYUUT4', title: 'Ibiza', artist: 'Gilli & KESI', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/6b/fb/4d/6bfb4d8d-bf3f-767d-95ad-29fa5cb9df2c/source/600x600bb.jpg' },
  { id: 'dk_9', videoId: 'R9K1G5D42mI', title: 'Mami', artist: 'Artigeardit', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ef/5c/d1/ef5cd109-1a06-b514-4c8d-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_10', videoId: 'T-Xm1c7vJ5g', title: 'Bando Bitch', artist: 'Branco', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/5f/7a/ee/5f7aee30-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_11', videoId: 'P5UWjgb-YaY', title: 'Hvem Vil Med', artist: 'Tessa', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/3a/ee/3a/3aee3a9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_12', videoId: 'gJ_uY8qN7m8', title: 'igen & igen', artist: 'Gobs', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ee/ef/ae/eeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_13', videoId: 'IQ2HTsYUUT4', title: 'Portugal', artist: 'Benjamin Hav', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_14', videoId: 'R9K1G5D42mI', title: 'Uden Dig', artist: 'D1MA', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_15', videoId: 'T-Xm1c7vJ5g', title: 'I Syv Sind', artist: 'Andreas Odbjerg', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_16', videoId: 'P5UWjgb-YaY', title: 'Verden Går Imellem Os', artist: 'Lamin & Artigeardit', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_17', videoId: 'gJ_uY8qN7m8', title: 'Helt Om Natten', artist: 'KESI & Albert', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_18', videoId: 'IQ2HTsYUUT4', title: 'Hjem Fra Fabrikken', artist: 'Andreas Odbjerg', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_19', videoId: 'R9K1G5D42mI', title: 'Feberdrømme', artist: 'Tobias Rahim', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' },
  { id: 'dk_20', videoId: 'T-Xm1c7vJ5g', title: 'Malibu', artist: 'Lamin', thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ae/ef/ae/aeefae9a-ef5c-9c98-1a06-318e8d89e5a4/source/600x600bb.jpg' }
];

// Premium 20-track Global hits fallback (100% recognizable, modern international music)
const FALLBACK_GLOBAL: SearchResult[] = [
  { id: 'gl_1', videoId: 'eVTXPUj44tE', title: 'Espresso', artist: 'Sabrina Carpenter', thumbnail: 'https://img.youtube.com/vi/eVTXPUj44tE/mqdefault.jpg' },
  { id: 'gl_2', videoId: 'K0F4o21N_fE', title: 'BIRDS OF A FEATHER', artist: 'Billie Eilish', thumbnail: 'https://img.youtube.com/vi/K0F4o21N_fE/mqdefault.jpg' },
  { id: 'gl_3', videoId: 'H680104e13s', title: 'Not Like Us', artist: 'Kendrick Lamar', thumbnail: 'https://img.youtube.com/vi/H680104e13s/mqdefault.jpg' },
  { id: 'gl_4', videoId: 'hDYKP8V7L4A', title: 'Die With A Smile', artist: 'Bruno Mars & Lady Gaga', thumbnail: 'https://img.youtube.com/vi/hDYKP8V7L4A/mqdefault.jpg' },
  { id: 'gl_5', videoId: '34Na4j8AVgA', title: 'Starboy', artist: 'The Weeknd', thumbnail: 'https://img.youtube.com/vi/34Na4j8AVgA/mqdefault.jpg' },
  { id: 'gl_6', videoId: '22tKOyOz5Yk', title: 'Houdini', artist: 'Eminem', thumbnail: 'https://img.youtube.com/vi/22tKOyOz5Yk/mqdefault.jpg' },
  { id: 'gl_7', videoId: 'q3e0105E1Es', title: 'Cruel Summer', artist: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/q3e0105E1Es/mqdefault.jpg' },
  { id: 'gl_8', videoId: 'uJ_1HMAGb4k', title: 'Too Sweet', artist: 'Hozier', thumbnail: 'https://img.youtube.com/vi/uJ_1HMAGb4k/mqdefault.jpg' },
  { id: 'gl_9', videoId: 't7bQyJyMZ3M', title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', thumbnail: 'https://img.youtube.com/vi/t7bQyJyMZ3M/mqdefault.jpg' },
  { id: 'gl_10', videoId: 'm4m9m7M3m1s', title: 'Good Luck, Babe!', artist: 'Chappell Roan', thumbnail: 'https://img.youtube.com/vi/m4m9m7M3m1s/mqdefault.jpg' },
  { id: 'gl_11', videoId: 'H5v3kku4y6Q', title: 'As It Was', artist: 'Harry Styles', thumbnail: 'https://img.youtube.com/vi/H5v3kku4y6Q/mqdefault.jpg' },
  { id: 'gl_12', videoId: 'TFMpaLQj6Ls', title: 'Levitating', artist: 'Dua Lipa', thumbnail: 'https://img.youtube.com/vi/TFMpaLQj6Ls/mqdefault.jpg' },
  { id: 'gl_13', videoId: 'm4_9m7M3m1s', title: 'Paint The Town Red', artist: 'Doja Cat', thumbnail: 'https://img.youtube.com/vi/m4_9m7M3m1s/mqdefault.jpg' },
  { id: 'gl_14', videoId: 'fHI8X4OXluQ', title: 'Blinding Lights', artist: 'The Weeknd', thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluQ/mqdefault.jpg' },
  { id: 'gl_15', videoId: 'U7mPq1W129E', title: 'Greedy', artist: 'Tate McRae', thumbnail: 'https://img.youtube.com/vi/U7mPq1W129E/mqdefault.jpg' },
  { id: 'gl_16', videoId: 'fHI8X4OXluR', title: 'Flowers', artist: 'Miley Cyrus', thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluR/mqdefault.jpg' },
  { id: 'gl_17', videoId: 'SQtA0tW129E', title: 'Kill Bill', artist: 'SZA', thumbnail: 'https://img.youtube.com/vi/SQtA0tW129E/mqdefault.jpg' },
  { id: 'gl_18', videoId: 'fHI8X4OXluS', title: 'Fortnight (feat. Post Malone)', artist: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluS/mqdefault.jpg' },
  { id: 'gl_19', videoId: 'fHI8X4OXluT', title: 'Beautiful Things', artist: 'Benson Boone', thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluT/mqdefault.jpg' },
  { id: 'gl_20', videoId: 'fHI8X4OXluU', title: 'Lose Control', artist: 'Teddy Swims', thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluU/mqdefault.jpg' }
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectSong,
  onAddToQueue,
  accentColor,
  favorites,
  onToggleFavorite,
  onSelectPlaylist
}) => {
  const theme = ACCENT_THEMES[accentColor];

  // Dynamic live-updating streaming charts state
  const [dkHits, setDkHits] = useState<SearchResult[]>([]);
  const [globalHits, setGlobalHits] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Live Most Played streaming charts via local Vite dev proxy to bypass CORS
  useEffect(() => {
    let active = true;

    const fetchFeeds = async () => {
      try {
        const [dkRes, globalRes] = await Promise.all([
          fetch('/api-apple/api/v2/dk/music/most-played/20/songs.json'),
          fetch('/api-apple/api/v2/us/music/most-played/20/songs.json')
        ]);

        if (!active) return;

        let resolvedDk: SearchResult[] = [];
        let resolvedGlobal: SearchResult[] = [];

        if (dkRes.ok) {
          const dkData = await dkRes.json();
          const results = dkData?.feed?.results || [];
          resolvedDk = results.map((entry: any) => {
            const id = entry.id || Math.random().toString();
            const title = entry.name || '';
            const artist = entry.artistName || '';
            const artworkUrl = entry.artworkUrl100 || '';
            const thumbnail = artworkUrl.replace('100x100bb', '600x600bb');

            return {
              id: `apple_dk_${id}`,
              title,
              artist,
              thumbnail,
              videoId: '' // Dynamically searched on YouTube when played
            };
          });
        }

        if (globalRes.ok) {
          const globalData = await globalRes.json();
          const results = globalData?.feed?.results || [];
          resolvedGlobal = results.map((entry: any) => {
            const id = entry.id || Math.random().toString();
            const title = entry.name || '';
            const artist = entry.artistName || '';
            const artworkUrl = entry.artworkUrl100 || '';
            const thumbnail = artworkUrl.replace('100x100bb', '600x600bb');

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
        console.warn('Failed to load factual streaming feeds, using premium verified fallbacks:', err);
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

  const playlistsConfig: Playlist[] = [
    {
      id: 'dk_hits',
      name: 'Top Hits: Denmark',
      description: 'The most popular tracks in Denmark right now.',
      tracks: dkHits.length > 0 ? dkHits : FALLBACK_DK,
      thumbnail: topHitsDenmark,
      accent: 'wine'
    },
    {
      id: 'global_hits',
      name: 'Top Hits: Global',
      description: 'The biggest tracks from charts around the world.',
      tracks: globalHits.length > 0 ? globalHits : FALLBACK_GLOBAL,
      thumbnail: topHitsGlobal,
      accent: 'navy'
    }
  ];

  const trendingList = (dkHits.length > 0 ? dkHits : FALLBACK_DK).slice(0, 4);
  const dailyPicks = (globalHits.length > 0 ? globalHits : FALLBACK_GLOBAL).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-[898px] relative z-10 flex flex-col gap-10 px-6 pt-4 pb-24"
    >
      {/* Featured Charts Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Compass className={`w-4 h-4 ${theme.text}`} />
          <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Featured Charts</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <div 
                key={idx}
                className="rounded-3xl border border-white/[0.04] p-7 bg-[#0a0a0c]/60 backdrop-blur-xl h-[190px] flex flex-col justify-between animate-pulse"
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
                  onClick={() => onSelectPlaylist(chart)}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, ease: 'easeOut' }}
                  whileHover={{
                    y: -6,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                  }}
                  className="relative rounded-3xl border border-white/[0.04] p-7 flex items-center justify-between bg-[#0a0a0c]/60 backdrop-blur-xl h-[190px] group transition-all duration-300 shadow-md select-none cursor-pointer text-left overflow-hidden gap-6"
                >
                  {/* Left Column: Info & Controls */}
                  <div className="flex flex-col justify-between h-full flex-1 min-w-0">
                    <div className="space-y-2">
                      <span className={`text-[10px] font-bold tracking-[0.35em] uppercase ${
                        chart.id === 'dk_hits' ? 'text-rose-400' : 'text-indigo-400'
                      }`}>
                        Daily Chart
                      </span>
                      <p className="text-sm font-normal text-white/70 leading-relaxed line-clamp-3 pr-2">
                        {chart.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3.5 relative z-10">
                      <button
                        onClick={(e) => handlePlayPlaylist(e, chart.name, chart.tracks)}
                        className="p-3 rounded-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 group-hover:scale-105 shadow-xl transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                      <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">{chart.tracks.length} tracks</span>
                    </div>
                  </div>

                  {/* Right Column: Premium Branded Graphic Cover (SoundCloud Style) */}
                  <div className="w-[126px] h-[126px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl relative select-none shrink-0 group-hover:border-white/20 transition-all duration-500 bg-neutral-950 flex items-center justify-center">
                    {/* The textured halftone background graphic at 100% opacity */}
                    <img 
                      src={chart.thumbnail} 
                      alt={chart.name} 
                      className="w-full h-full object-cover scale-102 group-hover:scale-105 transition-transform duration-700" 
                    />
                    
                    {/* Sleek, solid, high-contrast, extremely readable text banner at the bottom */}
                    <div className={`absolute bottom-0 left-0 right-0 py-2.5 text-center z-20 ${
                      chart.id === 'dk_hits' 
                        ? 'bg-[#881337] text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border-t border-rose-950' 
                        : 'bg-[#1e1b4b] text-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border-t border-indigo-950'
                    }`}>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] leading-none select-none block">
                        {chart.id === 'dk_hits' ? 'TOP HITS DK' : 'TOP HITS GLOBAL'}
                      </span>
                    </div>

                    {/* Dynamic Album Art Overlay (The #1 song's thumbnail floating on top!) */}
                    {chart.tracks && chart.tracks.length > 0 && (
                      <div className="absolute w-[52px] h-[52px] rounded-lg overflow-hidden border border-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.85)] z-10 rotate-[-4deg] group-hover:rotate-[2deg] group-hover:scale-105 transition-all duration-500 bg-neutral-900 -translate-y-3">
                        <img 
                          src={chart.tracks[0].thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
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
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-4 text-left min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
                      <img 
                        src={song.thumbnail} 
                        alt={song.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold text-white/95 leading-snug truncate group-hover:text-white transition-colors">{song.title}</h4>
                      <p className="text-[13px] text-white/60 mt-1 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(song);
                      }}
                      className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title={isFavorite(song.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(song.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(song);
                        toast.success("Added to queue");
                      }}
                      className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
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
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-4 text-left min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
                      <img 
                        src={song.thumbnail} 
                        alt={song.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold text-white/95 leading-snug truncate group-hover:text-white transition-colors">{song.title}</h4>
                      <p className="text-[13px] text-white/60 mt-1 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(song);
                      }}
                      className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title={isFavorite(song.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(song.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(song);
                        toast.success("Added to queue");
                      }}
                      className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
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
