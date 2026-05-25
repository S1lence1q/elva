import { useRef } from 'react';
import { motion } from 'motion/react';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

interface BrandingHeaderProps {
  accentColor: AccentColor;
  hasSeenTour: boolean;
  tourType: 'landing' | 'player' | null;
  startTour: () => void;
  isFirstVisit: boolean;
  hasSelectedArtist: boolean;
}

const viaAccent30: Record<AccentColor, string> = {
  emerald: 'via-emerald-500/10',
  sand: 'via-amber-500/10',
  wine: 'via-rose-500/10',
  navy: 'via-slate-500/10'
};

const viaAccent20: Record<AccentColor, string> = {
  emerald: 'via-emerald-500/5',
  sand: 'via-amber-500/5',
  wine: 'via-rose-500/5',
  navy: 'via-slate-500/5'
};

export function BrandingHeader({
  accentColor,
  hasSeenTour,
  tourType,
  startTour,
  isFirstVisit,
  hasSelectedArtist
}: BrandingHeaderProps) {
  const theme = ACCENT_THEMES[accentColor];

  // Animated gradient orbs stagger details
  const letterVariants = {
    initial: { opacity: 0, y: isFirstVisit ? 40 : 15, rotateX: isFirstVisit ? -90 : 0 },
    animate: (i: number) => {
      const returning = hasSelectedArtist;
      return {
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: {
          delay: returning ? 0 : (isFirstVisit ? 0.8 + i * 0.15 : 0.05 + i * 0.06),
          duration: returning ? 0.15 : (isFirstVisit ? 0.8 : 0.5),
          ease: [0.16, 1, 0.3, 1]
        }
      };
    }
  };

  const topLineVariants = {
    initial: { scaleX: 0 },
    animate: () => {
      const returning = hasSelectedArtist;
      return {
        scaleX: 1,
        transition: {
          delay: returning ? 0 : (isFirstVisit ? 1.6 : 0.2),
          duration: returning ? 0.15 : (isFirstVisit ? 1.0 : 0.6),
          ease: "easeOut"
        }
      };
    }
  };

  const bottomLineVariants = {
    initial: { scaleX: 0 },
    animate: () => {
      const returning = hasSelectedArtist;
      return {
        scaleX: 1,
        transition: {
          delay: returning ? 0 : (isFirstVisit ? 1.8 : 0.25),
          duration: returning ? 0.15 : (isFirstVisit ? 1.0 : 0.6),
          ease: "easeOut"
        }
      };
    }
  };

  const taglineVariants = {
    initial: { opacity: 0, y: 10 },
    animate: () => {
      const returning = hasSelectedArtist;
      return {
        opacity: 0.3,
        y: 0,
        transition: {
          delay: returning ? 0 : (isFirstVisit ? 2.2 : 0.3),
          duration: returning ? 0.15 : (isFirstVisit ? 0.8 : 0.5),
          ease: "easeOut"
        }
      };
    }
  };

  const inviteVariants = {
    initial: { opacity: 0, y: 5 },
    animate: () => {
      const returning = hasSelectedArtist;
      return {
        opacity: 0.25,
        y: 0,
        transition: {
          delay: returning ? 0 : (isFirstVisit ? 2.7 : 0.5),
          duration: returning ? 0.15 : (isFirstVisit ? 0.8 : 0.5),
          ease: "easeOut"
        }
      };
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 px-6 mb-8 shrink-0 w-full">
      {/* Refined Elva wordmark */}
      <motion.div className="relative flex flex-col items-center">
        {/* Subtle decorative lines with color */}
        <motion.div
          variants={topLineVariants}
          initial="initial"
          animate="animate"
          className="relative w-24 h-px mb-8"
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${viaAccent30[accentColor]} to-transparent`} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>

        {/* Main wordmark with colored gradient */}
        <div className="relative">
          <div className="flex items-center select-none pb-2">
            {['E', 'l', 'v', 'a'].map((letter, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                initial="initial"
                animate="animate"
                className={`text-8xl font-normal tracking-[0.06em] ${theme.glowText} bg-clip-text text-transparent px-[2px]`}
                style={{
                  fontFamily: '"Kaobe", serif',
                  textShadow: 'none'
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Logo wordmark area holds statically */}
        </div>

        {/* Bottom decorative line with color */}
        <motion.div
          variants={bottomLineVariants}
          initial="initial"
          animate="animate"
          className="relative w-24 h-px mt-8"
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${viaAccent20[accentColor]} to-transparent`} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
      </motion.div>

      {/* Tagline - more subtle */}
      <motion.p
        variants={taglineVariants}
        initial="initial"
        animate="animate"
        className="text-[10px] text-white/30 tracking-[0.4em] uppercase font-light"
      >
        Listen Deeper
      </motion.p>

      {/* Minimalist Inline Tour Invite */}
      {!hasSeenTour && tourType === null && (
        <motion.p
          variants={inviteVariants}
          initial="initial"
          animate="animate"
          whileHover={{ opacity: 0.65 }}
          className="mt-6 text-[10px] font-extralight text-white tracking-[0.15em] transition-all duration-300 uppercase cursor-pointer"
        >
          New to Elva?{' '}
          <button
            onClick={startTour}
            className={`underline decoration-white/20 hover:decoration-current ${theme.textHover} ${theme.text} cursor-pointer transition-colors`}
          >
            Take a 15s tour
          </button>
        </motion.p>
      )}
    </div>
  );
}
