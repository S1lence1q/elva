import type { CSSProperties } from 'react';

/** Shared mask fade for horizontal carousels in the queue drawer. */
export const CAROUSEL_MASK_STYLE: CSSProperties = {
  maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
};

export const CAROUSEL_END_SPACER_CLASS = 'w-[15px] shrink-0 h-1';
