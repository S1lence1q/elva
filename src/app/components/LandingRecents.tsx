import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

interface LandingRecentsProps {
  recentlyPlayed: SearchResult[];
  recentArtists: VerifiedArtist[];
  onPlaySong: (song: SearchResult) => void;
  onViewArtist: (artist: VerifiedArtist) => void;
  loadingSongId: string | null;
  accentColor: AccentColor;
}

export const LandingRecents: React.FC<LandingRecentsProps> = ({
  recentlyPlayed,
  recentArtists,
  onPlaySong,
  onViewArtist,
  loadingSongId,
  accentColor,
}) => {
  const hasSongs = recentlyPlayed.length > 0;
  const hasArtists = recentArtists.length > 0;

  const [activeTab, setActiveTab] = useState<'songs' | 'artists'>('songs');
  const [songsScrollState, setSongsScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
  const [artistsScrollState, setArtistsScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const songsRef = useRef<HTMLDivElement | null>(null);
  const artistsRef = useRef<HTMLDivElement | null>(null);

  const themeAccent = ACCENT_THEMES[accentColor];

  const getMaskStyle = (state: { canScrollLeft: boolean; canScrollRight: boolean }) => {
    const { canScrollLeft, canScrollRight } = state;
    if (canScrollLeft && canScrollRight) {
      return 'linear-gradient(to right, transparent 0%, black 32px, black calc(100% - 32px), transparent 100%)';
    }
    if (canScrollLeft) {
      return 'linear-gradient(to right, transparent 0%, black 32px)';
    }
    if (canScrollRight) {
      return 'linear-gradient(to right, black calc(100% - 32px), transparent 100%)';
    }
    return 'none';
  };

  useEffect(() => {
    const node = songsRef.current;
    if (!node) return;

    const handleScroll = () => {
      const canLeft = node.scrollLeft > 10;
      const canRight = node.scrollLeft + node.clientWidth < node.scrollWidth - 10;
      setSongsScrollState(prev => {
        if (prev.canScrollLeft === canLeft && prev.canScrollRight === canRight) return prev;
        return { canScrollLeft: canLeft, canScrollRight: canRight };
      });
    };

    const id = requestAnimationFrame(() => {
      handleScroll();
    });
    node.addEventListener('scroll', handleScroll, { passive: true });
    const ro = new ResizeObserver(handleScroll);
    ro.observe(node);

    return () => {
      cancelAnimationFrame(id);
      node.removeEventListener('scroll', handleScroll);
      ro.disconnect();
      setSongsScrollState({ canScrollLeft: false, canScrollRight: false });
    };
  }, [activeTab, recentlyPlayed]);

  useEffect(() => {
    const node = artistsRef.current;
    if (!node) return;

    const handleScroll = () => {
      const canLeft = node.scrollLeft > 10;
      const canRight = node.scrollLeft + node.clientWidth < node.scrollWidth - 10;
      setArtistsScrollState(prev => {
        if (prev.canScrollLeft === canLeft && prev.canScrollRight === canRight) return prev;
        return { canScrollLeft: canLeft, canScrollRight: canRight };
      });
    };

    const id = requestAnimationFrame(() => {
      handleScroll();
    });
    node.addEventListener('scroll', handleScroll, { passive: true });
    const ro = new ResizeObserver(handleScroll);
    ro.observe(node);

    return () => {
      cancelAnimationFrame(id);
      node.removeEventListener('scroll', handleScroll);
      ro.disconnect();
      setArtistsScrollState({ canScrollLeft: false, canScrollRight: false });
    };
  }, [activeTab, recentArtists]);

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
              ref={songsRef}
              key="songs-list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-3.5 overflow-x-auto pb-3 pt-1 px-3 scroll-px-3 scrollbar-none snap-x snap-mandatory w-full"
              style={{
                maskImage: getMaskStyle(songsScrollState),
                WebkitMaskImage: getMaskStyle(songsScrollState),
              }}
            >
              {recentlyPlayed.map((song) => {
                const isLoading = loadingSongId === song.id;
                return (
                  <motion.div
                    key={song.id}
                    onClick={() => onPlaySong(song)}
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: `0 12px 30px rgba(0, 0, 0, 0.65), 0 0 15px ${themeAccent.shadowHex}20`,
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    }}
                    className="group snap-start flex-shrink-0 w-[154px] flex flex-col gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.04] transition-all duration-300 cursor-pointer overflow-hidden"
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
              ref={artistsRef}
              key="artists-list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-3.5 overflow-x-auto pb-3 pt-1 px-3 scroll-px-3 scrollbar-none snap-x snap-mandatory w-full justify-center sm:justify-start"
              style={{
                maskImage: getMaskStyle(artistsScrollState),
                WebkitMaskImage: getMaskStyle(artistsScrollState),
              }}
            >
              {recentArtists.map((artist) => (
                <motion.div
                  key={artist.name}
                  onClick={() => onViewArtist(artist)}
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: `0 12px 30px rgba(0, 0, 0, 0.65), 0 0 15px ${themeAccent.shadowHex}20`,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                  className="group snap-start flex-shrink-0 w-[154px] flex flex-col gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.04] transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="relative aspect-square w-full rounded-full overflow-hidden bg-neutral-950">
                    <img
                      src={artist.thumbnail}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col text-left min-w-0 w-full space-y-0.5">
                    <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate w-full">
                      {artist.name}
                    </span>
                    <span className="text-xs text-white/35 truncate w-full">
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
