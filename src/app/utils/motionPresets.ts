import type { Transition } from 'motion/react';

/** Calm, premium easing — no overshoot or bounce */
export const EASE_OUT_SMOOTH: Transition['ease'] = [0.25, 0.1, 0.25, 1];

export const DURATION_FAST = 0.22;
export const DURATION_PANEL = 0.28;

export const panelEnter = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: DURATION_PANEL, ease: EASE_OUT_SMOOTH },
};

export const panelEnterFromSide = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: { duration: DURATION_PANEL, ease: EASE_OUT_SMOOTH },
};

export const listItemEnter = (index: number) => ({
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: DURATION_FAST,
    ease: EASE_OUT_SMOOTH,
    delay: Math.min(index * 0.018, 0.14),
  },
});

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION_FAST, ease: EASE_OUT_SMOOTH },
};
