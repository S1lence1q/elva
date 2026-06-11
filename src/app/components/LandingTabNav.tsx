import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, Compass, User } from 'lucide-react';
import { AccentColor, ACCENT_THEMES, ACCENT_SWATCH } from './themeUtils';

const SECTIONS = [
  { id: 'search', label: 'Home', aria: 'Search and home' },
  { id: 'discover', label: 'Discover', aria: 'Discover charts' },
  { id: 'myhub', label: 'Hub', aria: 'My hub profile' },
] as const;

const SECTION_ICONS = {
  search: Home,
  discover: Compass,
  myhub: User,
} as const;

interface LandingTabNavProps {
  activeTab: 'search' | 'discover' | 'myhub';
  setActiveTab: (tab: 'search' | 'discover' | 'myhub') => void;
  accentColor: AccentColor;
  hasActiveSong?: boolean;
  navPosition?: 'bottom' | 'top' | 'right';
}

export function LandingTabNav({
  activeTab,
  setActiveTab,
  accentColor,
  hasActiveSong = false,
  navPosition = 'bottom',
}: LandingTabNavProps) {
  const themeAccent = ACCENT_THEMES[accentColor];
  const swatch = ACCENT_SWATCH[accentColor];

  const isBottom = navPosition === 'bottom';
  const isTop = navPosition === 'top';
  const isRight = navPosition === 'right';

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // A small timeout ensures the browser paints the initial unmounted state
    // (opacity 0, offset position) before starting the CSS transitions.
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  if (isRight) {
    return (
      <nav
        id="landing-tab-nav-right"
        key={navPosition}
        style={{
          position: 'fixed',
          right: '24px',
          top: '0px',
          bottom: '0px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          zIndex: 40,
          pointerEvents: 'none',
        }}
        aria-label="Landing sections"
      >
        <div
          className="relative flex flex-col items-center gap-3 pointer-events-auto"
          style={{
            position: 'relative',
            right: mounted ? '0px' : '-20px',
            transition: 'right 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 350ms ease 100ms',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {SECTIONS.map((section) => {
              const isActive = activeTab === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveTab(section.id)}
                  className="group relative flex items-center justify-center w-8 h-8 cursor-pointer elva-focus-ring rounded-full bg-transparent border-0 p-0 focus:outline-none"
                  aria-label={section.aria}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {/* Floating label to the left */}
                  <span
                    className={`absolute right-9 text-[10px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap pointer-events-none select-none transition-all duration-300 ${
                      isActive
                        ? 'opacity-100 translate-x-0 text-white/70'
                        : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-white/35 group-hover:text-white/60'
                    }`}
                  >
                    {section.label}
                  </span>

                  <div className="relative flex items-center justify-center w-3 h-3">
                    {isActive && (
                      <motion.div
                        layoutId={`landingNavDotGlow-${navPosition}`}
                        className="absolute -inset-1 rounded-full bg-[color:var(--elva-accent)]/20"
                        style={{
                          boxShadow: `0 0 12px ${swatch.core}40`,
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <motion.div
                      animate={{ scale: isActive ? 1.15 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      style={isActive ? { boxShadow: `0 0 6px ${swatch.core}` } : {}}
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-250 ${
                        isActive
                          ? 'bg-white'
                          : 'bg-white/20 group-hover:bg-white/40'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      id="landing-tab-nav-horizontal"
      key={navPosition}
      style={{
        position: 'fixed',
        left: '0px',
        right: '0px',
        bottom: isBottom ? (hasActiveSong ? '104px' : '24px') : 'auto',
        top: isTop ? '24px' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 40,
        pointerEvents: 'none',
        transition: 'bottom 600ms cubic-bezier(0.34, 1.56, 0.64, 1), top 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      aria-label="Landing tabs"
    >
      <div
        className="relative flex items-center p-1 rounded-full border border-white/[0.06] pointer-events-auto"
        style={{
          position: 'relative',
          bottom: isBottom ? (mounted ? '0px' : '-20px') : 'auto',
          top: isTop ? (mounted ? '0px' : '-20px') : 'auto',
          backgroundColor: mounted ? 'rgba(12, 13, 16, 0.45)' : 'rgba(12, 13, 16, 0)',
          borderColor: mounted ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0)',
          boxShadow: mounted
            ? '0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 12px 40px rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0)',
          backdropFilter: mounted ? 'blur(40px)' : 'blur(0px)',
          WebkitBackdropFilter: mounted ? 'blur(40px)' : 'blur(0px)',
          transition: 'background-color 450ms ease, border-color 450ms ease, box-shadow 450ms ease, backdrop-filter 450ms ease, -webkit-backdrop-filter 450ms ease, bottom 600ms cubic-bezier(0.34, 1.56, 0.64, 1), top 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 350ms ease 100ms',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {SECTIONS.map((section) => {
            const isActive = activeTab === section.id;
            const Icon = SECTION_ICONS[section.id];

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveTab(section.id)}
                className={`group relative z-10 px-4.5 py-2 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-250 cursor-pointer rounded-full focus:outline-none elva-focus-ring flex items-center gap-2 ${
                  isActive 
                    ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]' 
                    : 'text-white/25 hover:text-white/60'
                }`}
                aria-label={section.aria}
                aria-current={isActive ? 'true' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId={`landingActiveTabBubble-${navPosition}`}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[color:var(--elva-accent)]/[0.12] to-[color:var(--elva-accent-glow)]/[0.04] border border-[color:var(--elva-accent)]/20"
                    style={{
                      boxShadow: `0 0 22px ${swatch.core}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 transition-colors duration-250 ${isActive ? 'text-[color:var(--elva-accent)]' : 'text-white/20 group-hover:text-white/50'}`} />
                <span className="relative z-10">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
