import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Music, X } from 'lucide-react';
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
import { strings } from '../constants/strings';

type SearchPanelPhase = 'recents' | 'loading' | 'results' | 'no-results';

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
      data-search-result-index={0}
      className={`mb-0 w-full flex items-center justify-between gap-6 group cursor-pointer min-h-[110px] transition-colors duration-300 overflow-hidden rounded-2xl ${
        isFocused
          ? 'bg-white/[0.06] ring-1 ring-inset ring-white/20'
          : 'bg-transparent hover:bg-white/[0.025]'
      }`}
    >
      {/* Soft ambient glow behind the avatar — no top edge, fades before card rim */}
      <div className="absolute left-0 top-2 bottom-2 w-44 bg-gradient-to-r from-white/[0.025] to-transparent pointer-events-none rounded-l-3xl" />

      <div className="flex items-center gap-5 relative z-10 min-w-0 p-5 flex-1">
        {/* Avatar with subtle ring */}
        <div className="relative w-[80px] h-[80px] md:w-[90px] md:h-[90px] rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-300">
          <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {/* Subtle inner shadow for depth */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_16px_rgba(0,0,0,0.4)]" />
        </div>

        <div className="flex flex-col text-left min-w-0">
          {/* Badge */}
          <span className="text-[10px] font-bold text-white/45 bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 rounded-md uppercase tracking-[0.14em] w-fit">
            ✦ {ARTIST_PROFILE_BADGE}
          </span>

          {/* Artist name — large and prominent */}
          <h4
            className="text-xl md:text-2xl font-bold text-white mt-2 group-hover:text-white transition-colors tracking-tight leading-tight truncate"
          >
            {artist.name}
          </h4>

          {/* Meta info */}
          <div className="min-h-[2rem] mt-1">
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
                    <p className="text-[11px] md:text-xs text-white/50 font-medium leading-snug">
                      {artist.disambiguation} {artist.country && `• ${artist.country}`}
                    </p>
                  )}
                  {!artist.disambiguation && artist.country && (
                    <p className="text-[11px] md:text-xs text-white/50 font-medium">
                      Artist from {artist.country}
                    </p>
                  )}
                  {artist.tags && artist.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {artist.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-semibold text-white/35 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md uppercase tracking-wider"
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
                  className="text-[11px] md:text-xs text-white/35 font-medium tracking-wide"
                >
                  {ARTIST_SEARCH_CARD_HINT}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div className="pr-5 shrink-0 relative z-10">
        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-all duration-200 group-hover:translate-x-0.5" />
      </div>
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
  const [showSearchTips, setShowSearchTips] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setShowSearchTips(false);
  }, [lastSearchedQuery]);

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
    if (lastSearchedQuery?.trim()) {
      if (searchResults.length > 0 || verifiedArtist) return 'results';
      return 'no-results';
    }
    return 'recents';
  }, [isSearching, searchResults.length, lastSearchedQuery, verifiedArtist]);

  const showArtistCard =
    panelPhase === 'results' &&
    shouldShowArtistCard(lastSearchedQuery || '') &&
    !!verifiedArtist;

  useEffect(() => {
    if (panelPhase !== 'results' || focusedResultIndex < 0) return;
    const el = document.querySelector(`[data-search-result-index="${focusedResultIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedResultIndex, panelPhase, searchResults.length, showArtistCard]);

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
      className={`w-full max-w-2xl px-6 ${panelPhase === 'results' ? 'space-y-3' : 'space-y-4'}`}
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
            className="w-full pl-16 pr-12 py-5 rounded-3xl border-0 bg-white/[0.05] text-white/90 placeholder-white/25 text-base font-light tracking-wide elva-focus-ring transition-colors duration-300 focus-visible:bg-white/[0.07]"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                setSearchQuery('');
                document.getElementById('search-input')?.focus();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fixed slot: crossfade phases without layout-driven push */}
      <div className="relative w-full">
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
              className="w-full will-change-transform"
            >
              <motion.div
                variants={searchStaggerContainer}
                initial="initial"
                animate="animate"
                className="rounded-[28px] border border-white/[0.06] bg-[#0a0b10]/60 p-2 sm:p-3 space-y-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
              >
                {showArtistCard && verifiedArtist && (
                  <>
                    <SearchArtistCard
                      artist={verifiedArtist}
                      isFocused={focusedResultIndex === 0}
                      onOpen={() => handleViewArtistProfile(verifiedArtist)}
                    />
                    {searchResults.length > 0 && (
                      <div className="mx-2 border-b border-white/[0.06] my-2" aria-hidden />
                    )}
                  </>
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
                        data-search-result-index={actualIndex}
                        className={`group relative w-full flex items-center gap-4 p-3 rounded-2xl border-0 transition-colors duration-300 cursor-pointer will-change-transform ${
                          loadingSongId === result.id
                            ? 'bg-white/[0.05]'
                            : isFocused
                              ? 'bg-white/[0.06] ring-1 ring-inset ring-white/20'
                              : 'bg-transparent hover:bg-white/[0.03]'
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

                        <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                          <SongRowOptions
                            track={result}
                            onPlayNext={handlePlayNext}
                            onAddToQueue={handleAddToQueue}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                {focusedResultIndex >= 0 && (
                  <p className="text-center text-[11px] normal-case tracking-normal text-white/30 pt-2 pb-0.5">
                    {strings.search.keyboardHint}
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}

          {panelPhase === 'no-results' && (
            <motion.div
              key="search-phase-no-results"
              {...searchPhaseMotion}
              className="w-full will-change-transform py-12 flex flex-col items-center justify-center text-center select-none"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-normal text-white/40 tracking-wide">
                  No results found for "{lastSearchedQuery}"
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSearchTips(prev => !prev)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border font-bold transition-all cursor-pointer ${
                    showSearchTips
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white hover:border-white/20'
                  }`}
                  title="Show suggestions"
                >
                  ?
                </button>
              </div>

              <AnimatePresence>
                {showSearchTips && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden max-w-sm mt-4 text-left p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
                  >
                    <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">Suggestions</p>
                    <ul className="text-[11px] text-white/40 space-y-1.5 list-disc list-inside font-light leading-relaxed">
                      <li>Check for spelling mistakes in your query</li>
                      <li>Try searching for a different song name or artist</li>
                      <li>Paste a direct YouTube video or playlist link</li>
                      <li>Upload a local audio file directly from the homepage</li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => {
                  setLocalQuery('');
                  setSearchQuery('');
                  document.getElementById('search-input')?.focus();
                }}
                className="mt-4 text-xs text-white/30 hover:text-white/60 border-b border-white/15 hover:border-white/40 transition-all cursor-pointer pb-0.5"
              >
                Clear search
              </button>
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
