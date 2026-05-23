export type AccentColor = 'emerald' | 'sand' | 'wine' | 'navy';

export interface ThemeColors {
  name: string;
  text: string;           // e.g. text-emerald-400
  textLight: string;      // e.g. text-emerald-300
  textHover: string;      // e.g. hover:text-emerald-400
  textHoverLight: string; // e.g. group-hover:text-emerald-300
  bg: string;             // e.g. bg-emerald-500/10
  bgFade: string;         // e.g. bg-emerald-500/5
  bgHover: string;        // e.g. hover:bg-emerald-500/15
  bgActive: string;       // e.g. bg-emerald-500/[0.03]
  border: string;         // e.g. border-emerald-500/20
  borderLight: string;    // e.g. border-emerald-500/10
  borderCard: string;     // e.g. border-emerald-500/15
  borderHover: string;    // e.g. hover:border-emerald-500/30
  borderActive: string;   // e.g. border-emerald-500/30
  borderAccent: string;   // e.g. border-emerald-500/25
  borderT: string;        // e.g. border-t-emerald-400
  fromGradient: string;   // e.g. from-emerald-500/[0.03]
  fromGradientHover: string; // e.g. hover:from-emerald-500/[0.05]
  glowText: string;       // e.g. bg-gradient-to-br from-white via-emerald-200/90 to-teal-100/70
  welcomeFrom: string;    // e.g. from-emerald-600/20
  welcomeVia: string;     // e.g. via-teal-500/15
  welcomeTo: string;      // e.g. to-green-600/15
  glowFrom: string;       // e.g. from-emerald-600/35
  glowVia: string;        // e.g. via-teal-500/20
  glowTo: string;         // e.g. to-green-600/25
  badgeText: string;      // e.g. text-emerald-300
  badgeBorder: string;    // e.g. border-emerald-500/20
  badgeBg: string;        // e.g. bg-emerald-500/10
}

export const ACCENT_THEMES: Record<AccentColor, ThemeColors> = {
  emerald: {
    name: 'Nordic Solitude (Sage)',
    text: 'text-emerald-300/90',
    textLight: 'text-emerald-400/60',
    textHover: 'hover:text-emerald-300',
    textHoverLight: 'group-hover:text-emerald-300/70',
    bg: 'bg-emerald-950/20',
    bgFade: 'bg-emerald-950/10',
    bgHover: 'hover:bg-emerald-900/30',
    bgActive: 'bg-emerald-950/5',
    border: 'border-emerald-500/10',
    borderLight: 'border-emerald-500/5',
    borderCard: 'border-emerald-500/10',
    borderHover: 'hover:border-emerald-400/20',
    borderActive: 'border-emerald-400/20',
    borderAccent: 'border-emerald-500/15',
    borderT: 'border-t-emerald-300/40',
    fromGradient: 'from-emerald-950/10',
    fromGradientHover: 'hover:from-emerald-950/20',
    glowText: 'bg-gradient-to-br from-white via-zinc-100 to-zinc-400/90',
    welcomeFrom: 'from-emerald-600/35',
    welcomeVia: 'via-teal-500/20',
    welcomeTo: 'to-green-500/15',
    glowFrom: 'from-emerald-950/10',
    glowVia: 'via-neutral-950/15',
    glowTo: 'to-neutral-950/20',
    badgeText: 'text-emerald-300/80',
    badgeBorder: 'border-emerald-500/10',
    badgeBg: 'bg-emerald-500/[0.04]',
  },
  sand: {
    name: 'Late Night Coffee (Linen)',
    text: 'text-amber-200/90',
    textLight: 'text-amber-200/60',
    textHover: 'hover:text-amber-200',
    textHoverLight: 'group-hover:text-amber-200/70',
    bg: 'bg-amber-950/20',
    bgFade: 'bg-amber-950/10',
    bgHover: 'hover:bg-amber-900/30',
    bgActive: 'bg-amber-950/5',
    border: 'border-amber-500/10',
    borderLight: 'border-amber-500/5',
    borderCard: 'border-amber-500/10',
    borderHover: 'hover:border-amber-400/20',
    borderActive: 'border-amber-400/20',
    borderAccent: 'border-amber-500/15',
    borderT: 'border-t-amber-200/40',
    fromGradient: 'from-amber-950/10',
    fromGradientHover: 'hover:from-amber-950/20',
    glowText: 'bg-gradient-to-br from-white via-zinc-200 to-zinc-400/90',
    welcomeFrom: 'from-amber-600/35',
    welcomeVia: 'via-orange-500/20',
    welcomeTo: 'to-yellow-500/15',
    glowFrom: 'from-amber-950/10',
    glowVia: 'via-neutral-950/15',
    glowTo: 'to-neutral-950/20',
    badgeText: 'text-amber-200/80',
    badgeBorder: 'border-amber-500/10',
    badgeBg: 'bg-amber-500/[0.04]',
  },
  wine: {
    name: 'Acoustic Warmth (Burgundy)',
    text: 'text-rose-300/85',
    textLight: 'text-rose-300/60',
    textHover: 'hover:text-rose-300',
    textHoverLight: 'group-hover:text-rose-300/70',
    bg: 'bg-rose-950/20',
    bgFade: 'bg-rose-950/10',
    bgHover: 'hover:bg-rose-900/30',
    bgActive: 'bg-rose-950/5',
    border: 'border-rose-500/10',
    borderLight: 'border-rose-500/5',
    borderCard: 'border-rose-500/10',
    borderHover: 'hover:border-rose-400/20',
    borderActive: 'border-rose-400/20',
    borderAccent: 'border-rose-500/15',
    borderT: 'border-t-rose-300/40',
    fromGradient: 'from-rose-950/10',
    fromGradientHover: 'hover:from-rose-950/20',
    glowText: 'bg-gradient-to-br from-white via-zinc-200 to-zinc-400/90',
    welcomeFrom: 'from-rose-600/35',
    welcomeVia: 'via-pink-500/20',
    welcomeTo: 'to-red-500/15',
    glowFrom: 'from-rose-950/10',
    glowVia: 'via-neutral-950/15',
    glowTo: 'to-neutral-950/20',
    badgeText: 'text-rose-300/80',
    badgeBorder: 'border-rose-500/10',
    badgeBg: 'bg-rose-500/[0.04]',
  },
  navy: {
    name: 'Deep Focus (Slate)',
    text: 'text-slate-300/90',
    textLight: 'text-slate-400/60',
    textHover: 'hover:text-slate-350',
    textHoverLight: 'group-hover:text-slate-300/70',
    bg: 'bg-slate-900/25',
    bgFade: 'bg-slate-950/10',
    bgHover: 'hover:bg-slate-900/35',
    bgActive: 'bg-slate-950/5',
    border: 'border-slate-500/10',
    borderLight: 'border-slate-500/5',
    borderCard: 'border-slate-500/10',
    borderHover: 'hover:border-slate-400/20',
    borderActive: 'border-slate-400/20',
    borderAccent: 'border-slate-500/15',
    borderT: 'border-t-slate-300/40',
    fromGradient: 'from-slate-950/10',
    fromGradientHover: 'hover:from-slate-950/20',
    glowText: 'bg-gradient-to-br from-white via-zinc-200 to-zinc-400/90',
    welcomeFrom: 'from-blue-600/35',
    welcomeVia: 'via-indigo-500/20',
    welcomeTo: 'to-purple-500/15',
    glowFrom: 'from-slate-950/10',
    glowVia: 'via-neutral-950/15',
    glowTo: 'to-neutral-950/20',
    badgeText: 'text-slate-300/80',
    badgeBorder: 'border-slate-500/10',
    badgeBg: 'bg-slate-500/[0.04]',
  }
};
