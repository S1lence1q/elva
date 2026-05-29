import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { SearchResult } from '../types';

interface RecentlyPlayedCarouselProps {
  recentlyPlayed: SearchResult[];
  onPlaySong: (song: SearchResult) => void;
  loadingSongId: string | null;
}

export const RecentlyPlayedCarousel: React.FC<RecentlyPlayedCarouselProps> = ({
  recentlyPlayed,
  onPlaySong,
  loadingSongId,
}) => {
  if (recentlyPlayed.length === 0) return null;

  return (
    <motion.div
      key="recently-played-section"
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, y: 15 }}
      className="w-full flex flex-col gap-3 pt-6 overflow-hidden shrink-0"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Recently Played</span>
      </div>

      {/* Horizontal Scroll wrapper */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory">
        {recentlyPlayed.map((song) => {
          const isLoading = loadingSongId === song.id;
          return (
            <motion.div
              key={song.id}
              whileHover={{ y: -4 }}
              onClick={() => onPlaySong(song)}
              className="group snap-start flex-shrink-0 w-[140px] flex flex-col gap-2.5 p-3 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] hover:border-white/[0.08] transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              {/* Cover Artwork Container */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-950 border border-white/5 shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-500"
                />

                {/* Hover Play Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="p-2.5 rounded-full bg-white/95 text-black shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
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
              <div className="flex flex-col text-left min-w-0 px-0.5">
                <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors truncate tracking-wide leading-tight">
                  {song.title}
                </span>
                <span className="text-[10px] text-white/35 font-light truncate mt-0.5 tracking-wide">
                  {song.artist}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
