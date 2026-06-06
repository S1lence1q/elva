import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

const SECTIONS = [
  { id: 'search', label: 'Home', aria: 'Search and home' },
  { id: 'discover', label: 'Discover', aria: 'Discover charts' },
  { id: 'myhub', label: 'Hub', aria: 'My hub profile' },
] as const;

const HINT_STORAGE_KEY = 'elva_landing_nav_labels_seen';
const HINT_DURATION_MS = 6500;

interface LandingSectionNavProps {
  scrollProgress: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  accentColor: AccentColor;
  isFirstVisit: boolean;
}

function getActiveIndex(scrollProgress: number): number {
  if (scrollProgress < 0.25) return 0;
  if (scrollProgress < 0.75) return 1;
  return 2;
}

export function LandingSectionNav({
  scrollProgress,
  scrollContainerRef,
  accentColor,
  isFirstVisit,
}: LandingSectionNavProps) {
  const navTheme = ACCENT_THEMES[accentColor];
  const activeIndex = useMemo(() => getActiveIndex(scrollProgress), [scrollProgress]);

  const [showSectionHints, setShowSectionHints] = useState(
    () => isFirstVisit && !localStorage.getItem(HINT_STORAGE_KEY),
  );

  useEffect(() => {
    if (!showSectionHints) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(HINT_STORAGE_KEY, '1');
      setShowSectionHints(false);
    }, HINT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showSectionHints]);

  const dismissHints = () => {
    if (!showSectionHints) return;
    localStorage.setItem(HINT_STORAGE_KEY, '1');
    setShowSectionHints(false);
  };

  return (
    <motion.nav
      id="landing-section-nav"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      aria-label="Landing sections"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 py-2"
    >
      {SECTIONS.map((section, index) => {
        const isActive = activeIndex === index;
        const showHintLabel = showSectionHints && isActive;

        const scrollToSection = () => {
          dismissHints();
          const container = scrollContainerRef.current;
          if (container) {
            container.scrollTo({
              top: index * container.clientHeight,
              behavior: 'smooth',
            });
          }
        };

        return (
          <button
            key={section.id}
            type="button"
            onClick={scrollToSection}
            className="group relative flex items-center justify-center w-8 h-8 cursor-pointer elva-focus-ring rounded-full bg-transparent border-0 p-0"
            aria-label={section.aria}
            aria-current={isActive ? 'true' : undefined}
          >
            <span
              className={`absolute right-9 text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap pointer-events-none select-none transition-all duration-200 ${
                showHintLabel
                  ? 'opacity-100 translate-x-0 text-white/50'
                  : 'opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-white/45 group-hover:text-white/65'
              }`}
            >
              {section.label}
            </span>

            <div className="relative flex items-center justify-center w-3 h-3">
              {isActive && (
                <motion.div
                  layoutId="landingNavDotGlow"
                  className={`absolute -inset-1.5 rounded-full ${navTheme.bg} opacity-30`}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.35 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`rounded-full transition-colors ${
                  isActive
                    ? 'w-2 h-2 bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.35)]'
                    : 'w-1.5 h-1.5 bg-white/25 group-hover:bg-white/50'
                }`}
              />
            </div>
          </button>
        );
      })}
    </motion.nav>
  );
}
