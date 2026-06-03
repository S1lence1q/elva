import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Music, User } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';

interface LandingRecentsProps {
  recentlyPlayed: SearchResult[];
  recentArtists: VerifiedArtist[];
  onPlaySong: (song: SearchResult) => void;
  onViewArtist: (artist: VerifiedArtist) => void;
  loadingSongId: string | null;
}

export const LandingRecents: React.FC<LandingRecentsProps> = ({
  recentlyPlayed,
  recentArtists,
  onPlaySong,
  onViewArtist,
  loadingSongId,
}) => {
  const hasSongs = recentlyPlayed.length > 0;
  const hasArtists = recentArtists.length > 0;

  // Default to songs if available, otherwise artists
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
    <div className="w-full max-w-2xl px-1 space-y-5 pt-4 shrink-0 overflow-hidden">
      {/* Dynamic Tab Bar Selector - sliding bubble glassmorphism */}
      {showTabs && (
        <div className="flex justify-center mb-1">
          <div className="relative flex p-1 rounded-full bg-[#0a0b10]/65 border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.55)]">
            {/* Sliding background bubble */}
            <motion.div
              layoutId="recentsActiveBubble"
              className="absolute inset-y-1 rounded-full bg-[#07080a] border border-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
              animate={{
                x: activeTab === 'songs' ? 0 : 96,
                width: activeTab === 'songs' ? 96 : 96,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            />

            <button
              onClick={() => setActiveTab('songs')}
              className={`relative z-10 w-24 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 rounded-full cursor-pointer ${
                activeTab === 'songs' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`relative z-10 w-24 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 rounded-full cursor-pointer ${
                activeTab === 'artists' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Artists
            </button>
          </div>
        </div>
      )}

      {/* Header when tabs are not shown */}
      {!showTabs && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">
            {hasSongs ? 'Recently Played' : (!localStorage.getItem('elva_recent_artists') ? 'Featured' : 'Recent Artists')}
          </span>
        </div>
      )}

      {/* Content wrapper with AnimatePresence for tab switching */}
      <div className="relative w-full min-h-[220px]">
        <AnimatePresence mode="wait">
          {activeTab === 'songs' && hasSongs ? (
            <motion.div
              key="songs-list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory w-full"
              style={{
                maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
              }}
            >
              {recentlyPlayed.map((song) => {
                const isLoading = loadingSongId === song.id;
                return (
                  <motion.div
                    key={song.id}
                    whileHover={{ y: -4 }}
                    onClick={() => onPlaySong(song)}
                    className="group snap-start flex-shrink-0 w-[170px] flex flex-col gap-3 p-3.5 rounded-2xl bg-[#13141b]/35 hover:bg-[#181a23]/60 border border-white/[0.04] hover:border-white/[0.09] transition-all duration-300 cursor-pointer relative overflow-hidden shadow-sm"
                  >
                    {/* Cover Artwork Container */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-955 border border-white/[0.08] shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Hover Play Overlay */}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="p-3 rounded-full bg-white/95 text-black shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Loading State Overlay */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Title & Artist info */}
                    <div className="flex flex-col text-left min-w-0 px-0.5 space-y-0.5">
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate tracking-wide leading-tight">
                        {song.title}
                      </span>
                      <span className="text-xs text-white/35 font-light truncate tracking-wide">
                        {song.artist}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {/* Spacer to prevent text/content clipping by the fade mask */}
              <div className="w-[15px] shrink-0 h-1" />
            </motion.div>
          ) : (
            <motion.div
              key="artists-list"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory w-full justify-center sm:justify-start"
              style={{
                maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
              }}
            >
              {recentArtists.map((artist) => (
                <motion.div
                  key={artist.name}
                  whileHover={{ y: -4 }}
                  onClick={() => onViewArtist(artist)}
                  className="group snap-start flex-shrink-0 w-[140px] flex flex-col items-center gap-3 p-3.5 rounded-2xl bg-[#13141b]/35 hover:bg-[#181a23]/60 border border-white/[0.04] hover:border-white/[0.09] transition-all duration-300 cursor-pointer relative overflow-hidden shadow-sm"
                >
                  {/* circular profile avatar */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-neutral-950 border border-white/[0.08] shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:border-white/20 transition-colors duration-300">
                    <img
                      src={artist.thumbnail}
                      alt={artist.name}
                      className="w-full h-full object-cover scale-102 group-hover:scale-106 transition-transform duration-500"
                    />
                  </div>

                  {/* Artist name & description */}
                  <div className="flex flex-col items-center text-center min-w-0 px-0.5 space-y-0.5 w-full">
                    <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors truncate tracking-wide w-full px-1">
                      {artist.name}
                    </span>
                    <span className="text-[10px] text-white/35 font-light truncate tracking-wide w-full px-1">
                      {artist.disambiguation?.split(' • ')[0] || artist.country || 'Artist'}
                    </span>
                  </div>
                </motion.div>
              ))}
              {/* Spacer to prevent text/content clipping by the fade mask */}
              <div className="w-[15px] shrink-0 h-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
