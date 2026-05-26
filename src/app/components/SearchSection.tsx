import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Plus, Music } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';
import { ThemeColors } from './themeUtils';
import { shouldShowArtistCard } from '../utils/apiUtils';

interface SearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  searchResults: SearchResult[];
  recentArtists: VerifiedArtist[];
  verifiedArtist: VerifiedArtist | null;
  focusedResultIndex: number;
  loadingSongId: string | null;
  handleViewArtistProfile: (artist: VerifiedArtist) => void;
  handleUrlSubmit: (url: string) => void;
  handleSearch: (overrideQuery?: string) => void;
  handleSelectSong: (track: SearchResult) => void;
  handleAddToQueue: (track: SearchResult) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: ThemeColors;
  isFirstVisit: boolean;
  hasSelectedArtist: boolean;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  searchResults,
  recentArtists,
  verifiedArtist,
  focusedResultIndex,
  loadingSongId,
  handleViewArtistProfile,
  handleUrlSubmit,
  handleSearch,
  handleSelectSong,
  handleAddToQueue,
  handleFileSelect,
  theme,
  isFirstVisit,
  hasSelectedArtist
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize parent searchQuery to localQuery for outside changes (Bento shortcuts, reset, etc.)
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Clean up debounce timeout on unmount
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
  const searchInputVariants = {
    initial: { opacity: 0, y: 25 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        delay: hasSelectedArtist ? 0 : (isFirstVisit ? 2.5 : 0.4),
        duration: hasSelectedArtist ? 0.2 : (isFirstVisit ? 1.4 : 0.8),
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div
      key="search-input-section"
      variants={searchInputVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-2xl px-6 space-y-6"
    >
      {/* Main input - clean with subtle details */}
      <div className="relative group">
        {/* Subtle corner accents */}
        <div className="absolute -top-px -left-px w-8 h-8 border-t border-l border-white/0 group-focus-within:border-white/20 rounded-tl-3xl transition-all duration-500" />
        <div className="absolute -top-px -right-px w-8 h-8 border-t border-r border-white/0 group-focus-within:border-white/20 rounded-tr-3xl transition-all duration-500" />
        <div className="absolute -bottom-px -left-px w-8 h-8 border-b border-l border-white/0 group-focus-within:border-white/20 rounded-bl-3xl transition-all duration-500" />
        <div className="absolute -bottom-px -right-px w-8 h-8 border-b border-r border-white/0 group-focus-within:border-white/20 rounded-br-3xl transition-all duration-500" />

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
            className="w-full pl-16 pr-8 py-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] text-white/90 placeholder-white/25 text-lg font-light tracking-wide focus:outline-none focus:border-white/15 focus:bg-white/[0.04] transition-all duration-300 backdrop-blur-2xl"
          />

          {/* Subtle inner shadow for depth */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
        </div>
      </div>

      {/* Bento-Style Minimalist Artist Shortcuts / Recent Searches */}
      {!localQuery.trim() && !isSearching && searchResults.length === 0 && recentArtists.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex flex-col gap-3 pt-3"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Recent Artists</span>
          </div>
          
          <div className={`grid gap-3 w-full ${
            recentArtists.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
            recentArtists.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto' :
            recentArtists.length === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto' :
            'grid-cols-2 md:grid-cols-4 w-full'
          }`}>
            {recentArtists.map((artist) => (
              <motion.div
                key={artist.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleViewArtistProfile(artist);
                }}
                className="group flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.015] hover:bg-white/[0.035] border border-white/[0.03] hover:border-white/[0.09] transition-all duration-300 cursor-pointer shadow-sm relative overflow-hidden"
              >
                {/* Subtle inner highlight on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                {/* Profile avatar - w-11 h-11 circular profile */}
                <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5 shadow-inner">
                  <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover scale-105" />
                </div>
                
                {/* Artist Name & Country details */}
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors truncate tracking-tight">
                    {artist.name}
                  </span>
                  <span className="text-xs text-white/40 font-light truncate mt-0.5 tracking-wide">
                    {artist.disambiguation?.split(' • ')[0] || artist.country || 'Artist'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search results */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 text-white/40 text-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 mx-auto mb-4 border border-white/20 border-t-white/50 rounded-full"
            />
            Searching...
          </motion.div>
        )}
        {!isSearching && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-h-[550px] md:max-h-[60vh] overflow-y-auto px-1 scrollbar-none w-full"
          >
            {/* Search Results List with Glowing Premium Clickable Artist Profile Card */}
            <>
              {shouldShowArtistCard(searchQuery) && verifiedArtist && (
                (() => {
                  const artist = verifiedArtist;
                  const isFocused = focusedResultIndex === 0;
                  return (
                    <motion.div
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       onClick={() => handleViewArtistProfile(artist)}
                       className={`relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#121214]/65 via-[#0d0d0e]/40 to-black/20 border transition-all duration-300 mb-6 flex items-center justify-between gap-6 group shadow-lg cursor-pointer active:scale-[0.99] backdrop-blur-xl w-full ${
                         isFocused
                           ? 'border-white/25 bg-white/[0.04] scale-[1.01]'
                           : 'border-white/[0.06] hover:border-white/15 hover:from-white/[0.03] hover:to-white/[0.01]'
                       }`}
                     >
                       <div className="flex items-center gap-5 relative z-10">
                         {/* Beautifully scaled-up circular avatar with neutral border */}
                         <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0 shadow-xl group-hover:scale-105 transition-all duration-300">
                           <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover scale-105" />
                         </div>
                         <div className="flex flex-col text-left">
                           <div className="flex items-center gap-1.5">
                             <span className="text-[10px] md:text-xs font-bold text-zinc-300 tracking-wider bg-zinc-800/40 border border-zinc-700/40 px-2.5 py-0.5 rounded-md uppercase">
                               ✦ Verified Artist
                             </span>
                           </div>
                           <h4 className="text-base md:text-xl font-black text-white mt-1.5 group-hover:text-zinc-100 transition-colors tracking-tight leading-tight">{artist.name}</h4>
                           {artist.disambiguation && (
                             <p className="text-[11px] md:text-xs text-white/60 font-semibold mt-1 leading-snug">
                               {artist.disambiguation} {artist.country && `(${artist.country})`}
                             </p>
                           )}
                           {!artist.disambiguation && artist.country && (
                             <p className="text-[11px] md:text-xs text-white/60 font-semibold mt-1">
                               Artist from {artist.country}
                             </p>
                           )}
                           {artist.tags && artist.tags.length > 0 && (
                             <div className="flex flex-wrap gap-1.5 mt-2.5">
                               {artist.tags.slice(0, 3).map((tag) => (
                                 <span
                                   key={tag}
                                   className="text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase tracking-wider group-hover:border-white/20 group-hover:text-white/60 transition-colors"
                                 >
                                   {tag}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                       </div>
                       <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white/45 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 self-center relative z-10" />
                    </motion.div>
                  );
                })()
              )}

              {searchResults.map((result, index) => {
                const hasArtistCard = shouldShowArtistCard(searchQuery) && verifiedArtist;
                const actualIndex = hasArtistCard ? index + 1 : index;
                const isFocused = focusedResultIndex === actualIndex;

                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (!loadingSongId) handleSelectSong(result);
                    }}
                    transition={{
                      delay: index * 0.08,
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className={`group relative w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 backdrop-blur-xl cursor-pointer ${
                      loadingSongId === result.id
                        ? `${theme.borderActive} ${theme.bgActive}`
                        : isFocused
                        ? 'bg-white/[0.06] border-white/20 shadow-md scale-[1.015]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15'
                    }`}
                  >
                    {/* Subtle highlight on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/[0.02] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {/* Thumbnail Container */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://img.youtube.com/vi/${result.videoId}/mqdefault.jpg`;
                        }}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${loadingSongId === result.id ? 'opacity-40' : ''}`}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        {loadingSongId === result.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                            className={`w-5 h-5 rounded-full border border-white/20 ${theme.borderT}`}
                          />
                        ) : (
                          <Music className="w-5 h-5 text-white/0 group-hover:text-white/80 transition-colors" />
                        )}
                      </div>
                    </div>

                    {/* Song Info */}
                    <div className="relative flex-1 text-left min-w-0">
                      <h3 className={`text-sm font-medium truncate transition-colors duration-300 ${
                        loadingSongId === result.id ? `${theme.text} font-semibold` : 'text-white/75 group-hover:text-white/95'
                      }`}>
                        {result.title}
                      </h3>
                      <p className="text-white/35 text-xs truncate mt-1">
                        {result.artist}
                      </p>
                    </div>

                    {/* Add to queue */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToQueue(result);
                      }}
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 duration-200"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-xs text-white/40">Queue</span>
                    </button>
                  </motion.div>
                );
              })}
            </>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discreet upload option with better styling */}
      {!isSearching && searchResults.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pt-4"
        >
          <label id="upload-button" className="inline-flex items-center gap-2 cursor-pointer group">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="text-sm text-white/30 group-hover:text-white/50 transition-colors">
              or
            </span>
            <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors border-b border-white/20 group-hover:border-white/40">
              upload a file
            </span>
          </label>
        </motion.div>
      )}
    </motion.div>
  );
};
