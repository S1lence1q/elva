import { motion, AnimatePresence } from 'motion/react';
import { Heart, History, ChevronRight, Sparkles, Plus } from 'lucide-react';
import type { AccentColor } from '../themeUtils';
import { ACCENT_THEMES } from '../themeUtils';
import type { SearchResult } from './types';
import { CAROUSEL_END_SPACER_CLASS, CAROUSEL_MASK_STYLE } from './carouselStyles';

interface QueueQuickAddProps {
  localFavorites: SearchResult[];
  localHistory: SearchResult[];
  showFavorites: boolean;
  showHistory: boolean;
  onToggleFavorites: () => void;
  onToggleHistory: () => void;
  onAddToQueue?: (song: SearchResult) => void;
  onBrowseLibrary: () => void;
  accentColor: AccentColor;
}

export function QueueQuickAdd({
  localFavorites,
  localHistory,
  showFavorites,
  showHistory,
  onToggleFavorites,
  onToggleHistory,
  onAddToQueue,
  onBrowseLibrary,
  accentColor,
}: QueueQuickAddProps) {
  const theme = ACCENT_THEMES[accentColor];

  return (
    <>
      {localFavorites.length > 0 && (
        <div className="space-y-3.5 select-none">
          <div className="flex items-center justify-between select-none pr-1">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-white/30" />
              <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Quick-Add Likes</h3>
            </div>
            <button
              onClick={onToggleFavorites}
              className="p-1 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-all cursor-pointer"
              title={showFavorites ? 'Collapse Likes' : 'Expand Likes'}
            >
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-300 ${showFavorites ? 'rotate-90' : 'rotate-0'}`}
              />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showFavorites && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden pb-1"
              >
                <div
                  className="flex overflow-x-auto gap-4 pb-2.5 scrollbar-none snap-x snap-mandatory"
                  style={CAROUSEL_MASK_STYLE}
                >
                  {localFavorites.slice(0, 10).map((song) => (
                    <div
                      key={`fav-card-${song.id}`}
                      onClick={() => onAddToQueue?.(song)}
                      className="group relative flex flex-col gap-2.5 w-28 shrink-0 snap-start cursor-pointer"
                      title={`Queue ${song.title}`}
                    >
                      <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md border border-white/5 bg-white/5">
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
                            <Plus className="w-4.5 h-4.5 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="text-left w-full">
                        <h4 className="text-xs font-semibold text-white/80 truncate leading-tight tracking-wide group-hover:text-white transition-colors">
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-white/40 truncate mt-1 leading-none font-medium">{song.artist}</p>
                      </div>
                    </div>
                  ))}

                  {localHistory.length > 0 && (
                    <div
                      onClick={onToggleHistory}
                      className="group relative flex flex-col gap-2.5 w-24 shrink-0 snap-start cursor-pointer select-none items-center justify-center h-28"
                      title={showHistory ? 'Hide listening history' : 'Show listening history'}
                    >
                      <div
                        className={`p-2.5 rounded-2xl bg-white/5 ${showHistory ? 'text-white/85 rotate-180' : 'text-white/35'} group-hover:bg-white/10 group-hover:text-white group-hover:scale-110 transition-all duration-300`}
                      >
                        <History className="w-5 h-5 text-current" />
                      </div>
                      <span className="text-[9px] uppercase tracking-[0.15em] text-white/30 group-hover:text-white/70 transition-colors font-bold leading-tight text-center mt-1">
                        {showHistory ? 'Hide\nHistory' : 'View\nHistory'}
                      </span>
                    </div>
                  )}
                  <div className={CAROUSEL_END_SPACER_CLASS} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="py-2 mt-4 flex items-center justify-center select-none shrink-0">
        <button
          onClick={onBrowseLibrary}
          className={`group flex items-center gap-2 px-5 py-2.5 rounded-full border ${theme.borderCard} hover:${theme.borderHover} bg-white/[0.015] hover:bg-white/[0.045] transition-all duration-300 shadow-sm cursor-pointer`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${theme.text} animate-pulse`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 group-hover:text-white/80 transition-colors">
            Browse Full Library
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      <AnimatePresence>
        {showHistory && localHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-3.5 select-none mt-2 overflow-hidden"
          >
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-white/30" />
              <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Recently Played</h3>
            </div>
            <div
              className="flex overflow-x-auto gap-4 pb-2.5 scrollbar-none snap-x snap-mandatory"
              style={CAROUSEL_MASK_STYLE}
            >
              {localHistory.slice(0, 10).map((song) => (
                <div
                  key={`hist-card-${song.id}`}
                  onClick={() => onAddToQueue?.(song)}
                  className="group relative flex flex-col gap-2.5 w-28 shrink-0 snap-start cursor-pointer"
                  title={`Re-play ${song.title}`}
                >
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-md border border-white/5 bg-white/5">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
                        <Plus className="w-4.5 h-4.5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="text-left w-full">
                    <h4 className="text-xs font-semibold text-white/80 truncate leading-tight tracking-wide group-hover:text-white transition-colors">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-white/40 truncate mt-1 leading-none font-medium">{song.artist}</p>
                  </div>
                </div>
              ))}
              <div className={CAROUSEL_END_SPACER_CLASS} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
