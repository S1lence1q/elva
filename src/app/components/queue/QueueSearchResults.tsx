import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import type { AccentColor } from '../themeUtils';
import type { SearchResult, VerifiedArtist } from './types';
import { ARTIST_SEARCH_CARD_HINT } from '../../constants/artistUi';
import { ArtistAvatar } from './ArtistAvatar';
import { QueueSongRow } from './QueueSongRow';
import { SearchLoadingState } from '../SearchLoadingState';
import {
  searchArtistCardItem,
  searchPhaseMotion,
  searchStaggerContainer,
  searchStaggerItem,
} from '../../utils/motionPresets';

type QueueSearchPhase = 'idle' | 'loading' | 'results';

interface QueueSearchResultsProps {
  isSearching: boolean;
  hasSearched: boolean;
  searchResults: SearchResult[];
  matchedArtist: VerifiedArtist | null;
  accentColor: AccentColor;
  onOpenArtist: (artist: VerifiedArtist) => void;
  onPlaySong: (song: SearchResult) => void;
  onAddToQueue?: (e: React.MouseEvent, song: SearchResult) => void;
}

export function QueueSearchResults({
  isSearching,
  hasSearched,
  searchResults,
  matchedArtist,
  onOpenArtist,
  onPlaySong,
  onAddToQueue,
}: QueueSearchResultsProps) {
  const phase: QueueSearchPhase = useMemo(() => {
    if (isSearching) return 'loading';
    if (searchResults.length > 0) return 'results';
    return 'idle';
  }, [isSearching, searchResults.length]);

  return (
    <div className="relative w-full text-left" style={{ contain: 'layout style' }}>
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'loading' && (
          <motion.div
            key="queue-search-loading"
            {...searchPhaseMotion}
            className="w-full will-change-transform"
          >
            <SearchLoadingState compact />
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="queue-search-results"
            {...searchPhaseMotion}
            className="w-full p-2 will-change-transform"
          >
            <motion.div
              variants={searchStaggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-3"
            >
              {matchedArtist && (
                <motion.div
                  variants={searchArtistCardItem}
                  onClick={() => onOpenArtist(matchedArtist)}
                  className="group w-full flex flex-col gap-5 p-6 rounded-3xl bg-gradient-to-br from-[#1c1c1f]/80 via-[#0e0e10]/60 to-black/40 border border-white/10 hover:border-white/20 hover:from-white/[0.04] hover:to-white/[0.01] transition-colors duration-300 shadow-2xl cursor-pointer relative overflow-hidden backdrop-blur-xl will-change-transform"
                >
                  <div
                    className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-[35px] opacity-25 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, var(--theme-primary) 0%, rgba(255,255,255,0) 70%)',
                    }}
                  />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden p-0.5 border border-white/15 shadow-xl shrink-0 bg-neutral-900">
                      <ArtistAvatar
                        name={matchedArtist.name}
                        fallbackThumbnail={matchedArtist.thumbnail}
                      />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h4
                        className="text-xl font-normal text-white truncate tracking-wide leading-tight"
                        style={{ fontFamily: '"Kaobe", serif' }}
                      >
                        {matchedArtist.name}
                      </h4>
                      <p className="text-[11px] text-white/40 mt-1 leading-normal font-semibold tracking-wide uppercase">
                        {ARTIST_SEARCH_CARD_HINT}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/45 transition-colors duration-200 shrink-0 self-center" />
                  </div>
                </motion.div>
              )}

              {searchResults.map((song) => (
                <motion.div key={song.id} variants={searchStaggerItem} className="will-change-transform">
                  <QueueSongRow
                    song={song}
                    onPlay={() => onPlaySong(song)}
                    onAddToQueue={onAddToQueue}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {phase === 'idle' && (
          <motion.div
            key="queue-search-idle"
            {...searchPhaseMotion}
            className="py-24 text-center select-none will-change-transform"
          >
            <p
              className={
                hasSearched
                  ? 'text-white/40 text-xs font-semibold'
                  : 'text-white/30 text-[11px] font-medium tracking-wide uppercase'
              }
            >
              {hasSearched ? 'No results found' : 'Press Enter to search'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
