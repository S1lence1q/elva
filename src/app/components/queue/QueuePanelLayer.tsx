import { motion } from 'motion/react';
import { queuePanelLayerClass, EASE_PREMIUM } from '../../utils/motionPresets';

type QueuePanelLayerProps = {
  layerKey: string;
  children: React.ReactNode;
  className?: string;
  direction?: 'forward' | 'backward';
};

/** Animated full-size queue content layer (absolute, no layout stack during crossfade). */
export function QueuePanelLayer({ layerKey, children, className = '', direction = 'forward' }: QueuePanelLayerProps) {
  const variants = {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1,
      transition: { duration: 0.42, ease: EASE_PREMIUM }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.42, ease: EASE_PREMIUM }
    }
  };

  return (
    <motion.div
      key={layerKey}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={`${queuePanelLayerClass} ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
