import { motion, AnimatePresence } from 'motion/react';
import { SkipBack, Play, Pause, SkipForward, X } from 'lucide-react';

type SongPreview = {
  title: string;
  artist: string;
  artworkUrl: string;
};

type LandingMiniPlayerPillProps = {
  visible: boolean;
  song: SongPreview;
  isPlaying: boolean;
  onOpenPlayer: () => void;
  onStop: () => void;
};

export function LandingMiniPlayerPill({
  visible,
  song,
  isPlaying,
  onOpenPlayer,
  onStop,
}: LandingMiniPlayerPillProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[440px] max-w-[92vw] h-16 rounded-[20px] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] flex items-center justify-between px-4 select-none"
        >
          <div
            onClick={onOpenPlayer}
            className="flex items-center gap-3.5 cursor-pointer group min-w-0 flex-1"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden relative border border-white/5 shadow-md shrink-0">
              <img
                src={song.artworkUrl}
                alt={song.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white/95 truncate group-hover:text-emerald-400 transition-colors">
                {song.title}
              </span>
              <span className="text-[11px] text-white/50 truncate mt-0.5">{song.artist}</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 shrink-0 ml-3">
            <button
              onClick={() => window.dispatchEvent(new Event('elva-play-prev'))}
              className="text-white/50 hover:text-white/95 transition-colors cursor-pointer focus:outline-none"
              title="Previous track"
            >
              <SkipBack className="w-4.5 h-4.5 fill-white/10" />
            </button>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.dispatchEvent(new Event('elva-toggle-play'))}
              className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/8 flex items-center justify-center text-white cursor-pointer transition-colors focus:outline-none"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </motion.button>

            <button
              onClick={() => window.dispatchEvent(new Event('elva-play-next'))}
              className="text-white/50 hover:text-white/95 transition-colors cursor-pointer focus:outline-none"
              title="Next track"
            >
              <SkipForward className="w-4.5 h-4.5 fill-white/10" />
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            <button
              onClick={onStop}
              className="text-white/35 hover:text-rose-400 transition-colors cursor-pointer focus:outline-none"
              title="Stop & Clear"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
