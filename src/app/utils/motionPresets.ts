import type { Transition, Variants } from 'motion/react';

/** Matches Landing / artist overlays — smooth deceleration, no bounce */
export const EASE_PREMIUM: Transition['ease'] = [0.16, 1, 0.3, 1];

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

/** Search panel phase swap (recents ↔ loading ↔ results) — transform only, no layout prop */
export const searchPhaseMotion = {
  initial: { opacity: 0, y: 16, filter: 'blur(10px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(8px)',
    transition: { duration: 0.34, ease: EASE_PREMIUM },
  },
};

export const searchStaggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.12,
    },
  },
};

export const searchStaggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.44, ease: EASE_PREMIUM },
  },
};

export const searchArtistCardItem: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.52, ease: EASE_PREMIUM },
  },
};

/** Full-bleed scroll layer inside queue panel — views crossfade without stacking height */
export const queuePanelLayerClass =
  'absolute inset-0 overflow-y-auto scrollbar-none p-5 pb-[120px] will-change-[opacity,transform,filter]';

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION_FAST, ease: EASE_OUT_SMOOTH },
};
