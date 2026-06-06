export type AccentColor = 'emerald' | 'sand' | 'wine' | 'navy';

/** Swatch colors for settings picker — matches --elva-accent per theme */
export const ACCENT_SWATCH: Record<AccentColor, { core: string; glow: string }> = {
  emerald: { core: '#5dbe9a', glow: 'rgba(93, 190, 154, 0.4)' },
  sand: { core: '#d9b67a', glow: 'rgba(217, 182, 122, 0.4)' },
  wine: { core: '#c97b8f', glow: 'rgba(201, 123, 143, 0.4)' },
  navy: { core: '#7ba3d4', glow: 'rgba(123, 163, 212, 0.4)' },
};

export interface ThemeColors {
  name: string;
  text: string;
  textLight: string;
  textHover: string;
  textHoverLight: string;
  bg: string;
  bgFade: string;
  bgHover: string;
  bgActive: string;
  border: string;
  borderLight: string;
  borderCard: string;
  borderHover: string;
  borderActive: string;
  borderAccent: string;
  borderT: string;
  fromGradient: string;
  fromGradientHover: string;
  glowText: string;
  welcomeFrom: string;
  welcomeVia: string;
  welcomeTo: string;
  glowFrom: string;
  glowVia: string;
  glowTo: string;
  badgeText: string;
  badgeBorder: string;
  badgeBg: string;
}

const sharedGlowText = 'bg-gradient-to-br from-white via-zinc-100 to-zinc-400/90';

export const ACCENT_THEMES: Record<AccentColor, ThemeColors> = {
  emerald: {
    name: 'Nordic Solitude (Sage)',
    text: 'text-elva-accent',
    textLight: 'text-elva-accent-muted',
    textHover: 'hover:text-elva-accent',
    textHoverLight: 'group-hover:text-elva-accent',
    bg: 'bg-elva-accent-soft',
    bgFade: 'bg-elva-accent-softer',
    bgHover: 'hover:bg-elva-accent-soft',
    bgActive: 'bg-elva-accent-softer',
    border: 'border-elva-accent',
    borderLight: 'border-elva-accent',
    borderCard: 'border-elva-accent',
    borderHover: 'hover:border-elva-accent',
    borderActive: 'border-elva-accent',
    borderAccent: 'border-elva-accent',
    borderT: 'border-t-[color:var(--elva-accent-border)]',
    fromGradient: 'from-transparent',
    fromGradientHover: 'hover:from-transparent',
    glowText: sharedGlowText,
    welcomeFrom: 'from-[#6d8578]/25',
    welcomeVia: 'via-[#5a6e62]/12',
    welcomeTo: 'to-transparent',
    glowFrom: 'from-[#6d8578]/8',
    glowVia: 'via-neutral-950/12',
    glowTo: 'to-neutral-950/18',
    badgeText: 'text-elva-accent-muted',
    badgeBorder: 'border-elva-accent',
    badgeBg: 'bg-elva-accent-softer',
  },
  sand: {
    name: 'Late Night Coffee (Linen)',
    text: 'text-elva-accent',
    textLight: 'text-elva-accent-muted',
    textHover: 'hover:text-elva-accent',
    textHoverLight: 'group-hover:text-elva-accent',
    bg: 'bg-elva-accent-soft',
    bgFade: 'bg-elva-accent-softer',
    bgHover: 'hover:bg-elva-accent-soft',
    bgActive: 'bg-elva-accent-softer',
    border: 'border-elva-accent',
    borderLight: 'border-elva-accent',
    borderCard: 'border-elva-accent',
    borderHover: 'hover:border-elva-accent',
    borderActive: 'border-elva-accent',
    borderAccent: 'border-elva-accent',
    borderT: 'border-t-[color:var(--elva-accent-border)]',
    fromGradient: 'from-transparent',
    fromGradientHover: 'hover:from-transparent',
    glowText: sharedGlowText,
    welcomeFrom: 'from-[#9a8a6e]/25',
    welcomeVia: 'via-[#7d7058]/12',
    welcomeTo: 'to-transparent',
    glowFrom: 'from-[#9a8a6e]/8',
    glowVia: 'via-neutral-950/12',
    glowTo: 'to-neutral-950/18',
    badgeText: 'text-elva-accent-muted',
    badgeBorder: 'border-elva-accent',
    badgeBg: 'bg-elva-accent-softer',
  },
  wine: {
    name: 'Acoustic Warmth (Burgundy)',
    text: 'text-elva-accent',
    textLight: 'text-elva-accent-muted',
    textHover: 'hover:text-elva-accent',
    textHoverLight: 'group-hover:text-elva-accent',
    bg: 'bg-elva-accent-soft',
    bgFade: 'bg-elva-accent-softer',
    bgHover: 'hover:bg-elva-accent-soft',
    bgActive: 'bg-elva-accent-softer',
    border: 'border-elva-accent',
    borderLight: 'border-elva-accent',
    borderCard: 'border-elva-accent',
    borderHover: 'hover:border-elva-accent',
    borderActive: 'border-elva-accent',
    borderAccent: 'border-elva-accent',
    borderT: 'border-t-[color:var(--elva-accent-border)]',
    fromGradient: 'from-transparent',
    fromGradientHover: 'hover:from-transparent',
    glowText: sharedGlowText,
    welcomeFrom: 'from-[#8a6d74]/25',
    welcomeVia: 'via-[#6f565c]/12',
    welcomeTo: 'to-transparent',
    glowFrom: 'from-[#8a6d74]/8',
    glowVia: 'via-neutral-950/12',
    glowTo: 'to-neutral-950/18',
    badgeText: 'text-elva-accent-muted',
    badgeBorder: 'border-elva-accent',
    badgeBg: 'bg-elva-accent-softer',
  },
  navy: {
    name: 'Deep Focus (Slate)',
    text: 'text-elva-accent',
    textLight: 'text-elva-accent-muted',
    textHover: 'hover:text-elva-accent',
    textHoverLight: 'group-hover:text-elva-accent',
    bg: 'bg-elva-accent-soft',
    bgFade: 'bg-elva-accent-softer',
    bgHover: 'hover:bg-elva-accent-soft',
    bgActive: 'bg-elva-accent-softer',
    border: 'border-elva-accent',
    borderLight: 'border-elva-accent',
    borderCard: 'border-elva-accent',
    borderHover: 'hover:border-elva-accent',
    borderActive: 'border-elva-accent',
    borderAccent: 'border-elva-accent',
    borderT: 'border-t-[color:var(--elva-accent-border)]',
    fromGradient: 'from-transparent',
    fromGradientHover: 'hover:from-transparent',
    glowText: sharedGlowText,
    welcomeFrom: 'from-[#6d7d92]/25',
    welcomeVia: 'via-[#566678]/12',
    welcomeTo: 'to-transparent',
    glowFrom: 'from-[#6d7d92]/8',
    glowVia: 'via-neutral-950/12',
    glowTo: 'to-neutral-950/18',
    badgeText: 'text-elva-accent-muted',
    badgeBorder: 'border-elva-accent',
    badgeBg: 'bg-elva-accent-softer',
  },
};
