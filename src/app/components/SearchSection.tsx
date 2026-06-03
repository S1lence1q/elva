import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Music } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';
import { ARTIST_PROFILE_BADGE, ARTIST_SEARCH_CARD_HINT } from '../constants/artistUi';
import { ThemeColors } from './themeUtils';
import { shouldShowArtistCard } from '../utils/apiUtils';
import { LandingRecents } from './LandingRecents';
import { SongRowOptions } from './SongRowOptions';
import { SearchLoadingState } from './SearchLoadingState';
import {
  EASE_PREMIUM,
  searchArtistCardItem,
  searchPhaseMotion,
  searchStaggerContainer,
  searchStaggerItem,
} from '../utils/motionPresets';

type SearchPanelPhase = 'recents' | 'loading' | 'results';

interface SearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lastSearchedQuery?: string;
  isSearching: boolean;
  searchResults: SearchResult[];
  recentArtists: VerifiedArtist[];
  recentlyPlayed: SearchResult[];
  verifiedArtist: VerifiedArtist | null;
  focusedResultIndex: number;
  loadingSongId: string | null;
  handleViewArtistProfile: (artist: VerifiedArtist) => void;
  handleUrlSubmit: (url: string) => void;
  handleSearch: (overrideQuery?: string) => void;
  handleSelectSong: (track: SearchResult) => void;
  handleAddToQueue: (track: SearchResult) => void;
  handlePlayNext?: (track: SearchResult) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: ThemeColors;
  isFirstVisit: boolean;
  hasSelectedArtist: boolean;
}

function SearchArtistCard({
  artist,
  isFocused,
  onOpen,
}: {
  artist: VerifiedArtist;
  isFocused: boolean;
  onOpen: () => void;
}) {
  const hasMeta = !!(artist.disambiguation || artist.country || (artist.tags && artist.tags.length > 0));

  return (
    <motion.div
      variants={searchArtistCardItem}
      onClick={onOpen}
      className={`relative overflow-hidden p-6 rounded-3xl bg-[#0d0e15]/90 border transition-all duration-300 mb-4 flex items-center justify-between gap-6 group shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.5)] cursor-pointer w-full min-h-[108px] ${
        isFocused
          ? 'border-white/25 bg-[#161824]/95'
          : 'border-white/[0.08] hover:border-white/15 hover:bg-[#12131c]/90'
      }`}
    >
      <div className="flex items-center gap-5 relative z-10 min-w-0">
        <div className="relative w-20 h-20 md:w-[88px] md:h-[88px] rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0 shadow-xl">
          <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span className="text-[10px] md:text-xs font-bold text-zinc-300 tracking-wider bg-zinc-800/40 border border-zinc-700/40 px-2.5 py-0.5 rounded-md uppercase w-fit">
            ✦ {ARTIST_PROFILE_BADGE}
          </span>
          <h4 className="text-base md:text-xl font-black text-white mt-1.5 group-hover:text-zinc-100 transition-colors tracking-tight leading-tight truncate">
            {artist.name}
          </h4>
          <div className="min-h-[2.25rem] mt-1">
            <AnimatePresence mode="wait" initial={false}>
              {hasMeta ? (
                <motion.div
                  key="meta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE_PREMIUM }}
                >
                  {artist.disambiguation && (
                    <p className="text-[11px] md:text-xs text-white/60 font-semibold leading-snug">
                      {artist.disambiguation} {artist.country && `(${artist.country})`}
                    </p>
                  )}
                  {!artist.disambiguation && artist.country && (
                    <p className="text-[11px] md:text-xs text-white/60 font-semibold">
                      Artist from {artist.country}
                    </p>
                  )}
                  {artist.tags && artist.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {artist.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE_PREMIUM }}
                  className="text-[11px] md:text-xs text-white/50 font-semibold uppercase tracking-wide"
                >
                  {ARTIST_SEARCH_CARD_HINT}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white/45 transition-colors duration-200 shrink-0 self-center relative z-10" />
    </motion.div>
  );
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  setSearchQuery,
  lastSearchedQuery,
  isSearching,
  searchResults,
  recentArtists,
  recentlyPlayed,
  verifiedArtist,
  focusedResultIndex,
  loadingSongId,
  handleViewArtistProfile,
  handleUrlSubmit,
  handleSearch,
  handleSelectSong,
  handleAddToQueue,
  handlePlayNext,
  handleFileSelect,
  theme,
  isFirstVisit,
  hasSelectedArtist,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const debounceSetSearchQuery = (val: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val);
    }, 300);
  };

  const panelPhase: SearchPanelPhase = useMemo(() => {
    if (isSearching) return 'loading';
    if (searchResults.length > 0 && lastSearchedQuery?.trim()) return 'results';
    return 'recents';
  }, [isSearching, searchResults.length, lastSearchedQuery]);

  const showArtistCard =
    panelPhase === 'results' &&
    shouldShowArtistCard(lastSearchedQuery || '') &&
    !!verifiedArtist;

  const searchInputVariants = {
    initial: { opacity: 0, y: 25 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: hasSelectedArtist ? 0 : isFirstVisit ? 2.5 : 0.4,
        duration: hasSelectedArtist ? 0.2 : isFirstVisit ? 1.4 : 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <motion.div
      variants={searchInputVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-2xl px-6 space-y-4"
    >
      <div className="relative group">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-white/50 transition-colors duration-300" />
          <input
            id="search-input"
            type="text"
            value={localQuery}
            onChange={(e) => {
              const val = e.target.value;
              setLocalQuery(val);
              debounceSetSearchQuery(val);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                if (debounceTimeoutRef.current) {
                  clearTimeout(debounceTimeoutRef.current);
                }
                setSearchQuery(localQuery);

                if (localQuery.match(/^https?:\/\//)) {
                  handleUrlSubmit(localQuery);
                } else {
                  handleSearch(localQuery);
                }
              }
            }}
            placeholder="Search or paste a link..."
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="w-full pl-16 pr-8 py-6 rounded-3xl bg-[#08090f]/85 border border-white/[0.08] text-white/90 placeholder-white/25 text-lg font-light tracking-wide focus:outline-none focus:border-white/20 focus:bg-[#12131c]/90 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
          />
          <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
        </div>
      </div>

      {/* Fixed slot: crossfade phases without layout-driven push */}
      <div
        className="relative w-full"
        style={{ contain: 'layout style' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {panelPhase === 'recents' && (
            <motion.div
              key="search-phase-recents"
              {...searchPhaseMotion}
              className="w-full will-change-transform"
            >
              <LandingRecents
                recentlyPlayed={recentlyPlayed}
                recentArtists={recentArtists}
                onPlaySong={handleSelectSong}
                onViewArtist={handleViewArtistProfile}
                loadingSongId={loadingSongId}
              />
            </motion.div>
          )}

          {panelPhase === 'loading' && (
            <motion.div key="search-phase-loading" {...searchPhaseMotion} className="w-full will-change-transform">
              <SearchLoadingState />
            </motion.div>
          )}

          {panelPhase === 'results' && (
            <motion.div
              key="search-phase-results"
              {...searchPhaseMotion}
              className="w-full max-h-[min(60vh,520px)] overflow-y-auto px-1 scrollbar-none overscroll-contain will-change-transform"
            >
              <motion.div
                variants={searchStaggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-2"
              >
                {showArtistCard && verifiedArtist && (
                  <SearchArtistCard
                    artist={verifiedArtist}
                    isFocused={focusedResultIndex === 0}
                    onOpen={() => handleViewArtistProfile(verifiedArtist)}
                  />
                )}

                {searchResults.map((result, index) => {
                  const hasArtistCard = showArtistCard;
                  const actualIndex = hasArtistCard ? index + 1 : index;
                  const isFocused = focusedResultIndex === actualIndex;

                  return (
                    <motion.div
                      key={result.id}
                      variants={searchStaggerItem}
                      onClick={() => {
                        if (!loadingSongId) handleSelectSong(result);
                      }}
                      className={`group relative w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer will-change-transform ${
                        loadingSongId === result.id
                          ? `${theme.borderActive} bg-[#181a23]/60`
                          : isFocused
                            ? 'bg-[#181a23]/80 border-white/20 shadow-md'
                            : 'bg-[#0a0b10]/40 border-white/[0.05] hover:bg-[#13141c]/55 hover:border-white/10'
                      }`}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/[0.02] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={result.thumbnail}
                          alt={result.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://img.youtube.com/vi/${result.videoId}/mqdefault.jpg`;
                          }}
                          className={`w-full h-full object-cover ${loadingSongId === result.id ? 'opacity-40' : ''}`}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          {loadingSongId === result.id ? (
                            <div
                              className={`w-5 h-5 rounded-full border border-white/20 border-t-white/40 animate-spin ${theme.borderT}`}
                            />
                          ) : (
                            <Music className="w-5 h-5 text-white/0 group-hover:text-white/80 transition-colors" />
                          )}
                        </div>
                      </div>

                      <div className="relative flex-1 text-left min-w-0">
                        <h3
                          className={`text-sm font-medium truncate transition-colors duration-200 ${
                            loadingSongId === result.id
                              ? `${theme.text} font-semibold`
                              : 'text-white/75 group-hover:text-white/95'
                          }`}
                        >
                          {result.title}
                        </h3>
                        <p className="text-white/35 text-xs truncate mt-1">{result.artist}</p>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                        <SongRowOptions
                          track={result}
                          onPlayNext={handlePlayNext}
                          onAddToQueue={handleAddToQueue}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {panelPhase === 'recents' && (
        <div className="text-center pt-4">
          <label id="upload-button" className="inline-flex items-center gap-2 cursor-pointer group">
            <input type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
            <span className="text-sm text-white/30 group-hover:text-white/50 transition-colors">or</span>
            <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors border-b border-white/20 group-hover:border-white/40">
              upload a file
            </span>
          </label>
        </div>
      )}
    </motion.div>
  );
};
