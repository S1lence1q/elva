import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';

interface LandingRecentsProps {
  recentlyPlayed: SearchResult[];
  recentArtists: VerifiedArtist[];
  onPlaySong: (song: SearchResult) => void;
  onViewArtist: (artist: VerifiedArtist) => void;
  loadingSongId: string | null;
}

const SCROLL_EDGE_MASK =
  'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)';

export const LandingRecents: React.FC<LandingRecentsProps> = ({
  recentlyPlayed,
  recentArtists,
  onPlaySong,
  onViewArtist,
  loadingSongId,
}) => {
  const hasSongs = recentlyPlayed.length > 0;
  const hasArtists = recentArtists.length > 0;

  const [activeTab, setActiveTab] = useState<'songs' | 'artists'>('songs');

  useEffect(() => {
    if (!hasSongs && hasArtists) {
      setActiveTab('artists');
    } else if (hasSongs) {
      setActiveTab('songs');
    }
  }, [hasSongs, hasArtists]);

  if (!hasSongs && !hasArtists) return null;

  const showTabs = hasSongs && hasArtists;

  return (
    <div className="w-full max-w-2xl px-1 space-y-4 pt-4 shrink-0">
      {showTabs && (
        <div className="flex justify-center">
          <div className="relative inline-flex p-1 rounded-full bg-white/[0.04]">
            {(
              [
                { id: 'songs' as const, label: 'History' },
                { id: 'artists' as const, label: 'Artists' },
              ] as const
            ).map(({ id, label }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative z-10 min-w-[5.5rem] px-5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full cursor-pointer transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-white/40 hover:text-white/65'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="recentsActiveBubble"
                      className="absolute inset-0 rounded-full bg-white/[0.09]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!showTabs && (
        <div className="flex justify-center px-1">
          <span className="elva-section-label">
            {hasSongs
              ? 'Recently Played'
              : !localStorage.getItem('elva_recent_artists')
                ? 'Featured'
                : 'Recent Artists'}
          </span>
        </div>
      )}

      <div className="relative w-full min-h-[220px]">
        <AnimatePresence mode="wait">
          {activeTab === 'songs' && hasSongs ? (
            <motion.div
              key="songs-list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-3.5 overflow-x-auto pb-3 pt-1 px-3 scrollbar-none snap-x snap-mandatory w-full"
              style={{
                maskImage: SCROLL_EDGE_MASK,
                WebkitMaskImage: SCROLL_EDGE_MASK,
              }}
            >
              {recentlyPlayed.map((song) => {
                const isLoading = loadingSongId === song.id;
                return (
                  <motion.div
                    key={song.id}
                    whileHover={{ y: -4 }}
                    onClick={() => onPlaySong(song)}
                    className="group snap-start flex-shrink-0 w-[168px] flex flex-col gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-950">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="p-3 rounded-full bg-white/95 text-black shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      {isLoading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col text-left min-w-0 space-y-0.5">
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                        {song.title}
                      </span>
                      <span className="text-xs text-white/35 truncate">{song.artist}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="artists-list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-3.5 overflow-x-auto pb-3 pt-1 px-3 scrollbar-none snap-x snap-mandatory w-full justify-center sm:justify-start"
              style={{
                maskImage: SCROLL_EDGE_MASK,
                WebkitMaskImage: SCROLL_EDGE_MASK,
              }}
            >
              {recentArtists.map((artist) => (
                <motion.div
                  key={artist.name}
                  whileHover={{ y: -4 }}
                  onClick={() => onViewArtist(artist)}
                  className="group snap-start flex-shrink-0 w-[140px] flex flex-col items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] transition-colors duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-950">
                    <img
                      src={artist.thumbnail}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col items-center text-center min-w-0 w-full space-y-0.5">
                    <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors truncate w-full px-1">
                      {artist.name}
                    </span>
                    <span className="text-[10px] text-white/35 truncate w-full px-1">
                      {artist.disambiguation?.split(' • ')[0] || artist.country || 'Artist'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
