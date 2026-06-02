import { motion, AnimatePresence } from 'motion/react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { AccentColor } from '../themeUtils';

const accentBgs400: Record<AccentColor, string> = {
  emerald: 'bg-emerald-400',
  sand: 'bg-amber-400',
  wine: 'bg-rose-400',
  navy: 'bg-slate-400',
};

type GlobalVolumeHUDProps = {
  visible: boolean;
  volume: number;
  accentColor: AccentColor;
};

export function GlobalVolumeHUD({ visible, volume, accentColor }: GlobalVolumeHUDProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed top-10 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-5 py-3 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] pointer-events-none"
        >
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-white/55" />
          ) : volume < 33 ? (
            <Volume className="w-4 h-4 text-white/80" />
          ) : volume < 66 ? (
            <Volume1 className="w-4 h-4 text-white/80" />
          ) : (
            <Volume2 className="w-4 h-4 text-white/80" />
          )}
          <div className="w-24 h-1.5 bg-white/15 rounded-full overflow-hidden relative">
            <motion.div
              className={`h-full ${accentBgs400[accentColor]} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${volume}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </div>
          <span className="text-xs font-semibold text-white/90 tabular-nums w-8 text-right">
            {volume}%
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
