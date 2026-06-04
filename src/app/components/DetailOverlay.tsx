import { motion } from 'motion/react';

interface DetailOverlayProps {
  children: React.ReactNode;
}

/** Unified fullscreen detail layer (artist, playlist, etc.) */
export function DetailOverlay({ children }: DetailOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-30 elva-overlay flex flex-col items-stretch pt-8 pb-12 px-4 sm:px-8 min-h-0"
    >
      <div className="flex flex-1 flex-col min-h-0 w-full max-w-5xl mx-auto">
        {children}
      </div>
    </motion.div>
  );
}
