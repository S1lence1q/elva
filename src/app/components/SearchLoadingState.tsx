import { motion } from 'motion/react';
import { EASE_PREMIUM } from '../utils/motionPresets';

type SearchLoadingStateProps = {
  /** Tighter vertical padding for sidebar / queue */
  compact?: boolean;
};

export function SearchLoadingState({ compact = false }: SearchLoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${
        compact ? 'py-20' : 'py-24'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE_PREMIUM }}
        className="relative w-9 h-9"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-white/[0.08] border-t-white/70"
        />
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-1 rounded-full bg-white/[0.03]"
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: EASE_PREMIUM }}
        className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35"
      >
        Searching
      </motion.p>
    </div>
  );
}
