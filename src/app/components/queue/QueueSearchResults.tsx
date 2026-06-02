import { motion } from 'motion/react';
import { Loader2, ChevronRight } from 'lucide-react';
import type { AccentColor } from '../themeUtils';
import { ACCENT_THEMES } from '../themeUtils';
import type { SearchResult, VerifiedArtist } from './types';
import { ARTIST_SEARCH_CARD_HINT } from '../../constants/artistUi';
import { ArtistAvatar } from './ArtistAvatar';
import { QueueSongRow } from './QueueSongRow';
import { fadeIn, listItemEnter } from '../../utils/motionPresets';

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
  accentColor,
  onOpenArtist,
  onPlaySong,
  onAddToQueue,
}: QueueSearchResultsProps) {
  const theme = ACCENT_THEMES[accentColor];

  if (isSearching) {
    return (
      <motion.div
        key="searching"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center select-none"
      >
        <Loader2 className="w-8 h-8 text-white/40 animate-spin mb-3" />
        <p className="text-xs text-white/40 font-medium">Searching YouTube...</p>
      </motion.div>
    );
  }

  if (searchResults.length === 0) {
    return hasSearched ? (
      <div className="py-24 text-center select-none">
        <p className="text-white/40 text-xs font-semibold">No results found</p>
      </div>
    ) : (
      <div className="py-24 text-center select-none">
        <p className="text-white/30 text-[11px] font-medium tracking-wide uppercase">Press Enter to search</p>
      </div>
    );
  }

  return (
    <motion.div
      key="search-results"
      {...fadeIn}
      className="space-y-3 p-2 text-left"
    >
      {matchedArtist && (
        <motion.div
          {...fadeIn}
          onClick={() => onOpenArtist(matchedArtist)}
          className="group w-full flex flex-col gap-5 p-6 rounded-3xl bg-gradient-to-br from-[#1c1c1f]/80 via-[#0e0e10]/60 to-black/40 border border-white/10 hover:border-white/20 hover:from-white/[0.04] hover:to-white/[0.01] transition-all duration-300 shadow-2xl cursor-pointer mb-6 relative overflow-hidden backdrop-blur-xl active:scale-[0.99]"
        >
          <div
            className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-[35px] opacity-25 pointer-events-none transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle, var(--theme-primary) 0%, rgba(255,255,255,0) 70%)',
            }}
          />
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative w-20 h-20 rounded-full overflow-hidden p-0.5 border border-white/15 shadow-xl group-hover:scale-105 transition-all duration-300 shrink-0 bg-neutral-900">
              <ArtistAvatar name={matchedArtist.name} fallbackThumbnail={matchedArtist.thumbnail} />
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
            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/45 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 self-center" />
          </div>
        </motion.div>
      )}

      {searchResults.map((song, index) => (
        <motion.div key={song.id} {...listItemEnter(index)}>
          <QueueSongRow
            song={song}
            onPlay={() => onPlaySong(song)}
            onAddToQueue={onAddToQueue}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
