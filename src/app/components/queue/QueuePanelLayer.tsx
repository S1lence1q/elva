import { motion } from 'motion/react';
import { queuePanelLayerClass, searchPhaseMotion } from '../../utils/motionPresets';

type QueuePanelLayerProps = {
  layerKey: string;
  children: React.ReactNode;
  className?: string;
};

/** Animated full-size queue content layer (absolute, no layout stack during crossfade). */
export function QueuePanelLayer({ layerKey, children, className = '' }: QueuePanelLayerProps) {
  return (
    <motion.div
      key={layerKey}
      {...searchPhaseMotion}
      className={`${queuePanelLayerClass} ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
