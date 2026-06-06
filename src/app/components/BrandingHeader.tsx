import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { strings, hasCustomProfileName, DEFAULT_PROFILE_NAME } from '../constants/strings';

interface BrandingHeaderProps {
  accentColor: AccentColor;
  hasSeenTour: boolean;
  tourType: 'landing' | 'player' | null;
  startTour: () => void;
  isFirstVisit: boolean;
  hasSelectedArtist: boolean;
}

const accentLineFade = 'via-[color:var(--elva-accent-glow)]';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return strings.greeting.morning;
  if (hour >= 12 && hour < 17) return strings.greeting.afternoon;
  if (hour >= 17 && hour < 23) return strings.greeting.evening;
  return strings.greeting.lateNight;
}

export function BrandingHeader({
  accentColor,
  hasSeenTour,
  tourType,
  startTour,
  isFirstVisit,
  hasSelectedArtist,
}: BrandingHeaderProps) {
  const theme = ACCENT_THEMES[accentColor];

  const [profile, setProfile] = useState(() => ({
    username: localStorage.getItem('elva_profile_name') || DEFAULT_PROFILE_NAME,
  }));

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile({
        username: localStorage.getItem('elva_profile_name') || DEFAULT_PROFILE_NAME,
      });
    };
    window.addEventListener('elva-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('elva-profile-updated', handleProfileUpdate);
  }, []);

  const showGreeting = hasCustomProfileName(profile.username);
  const greeting = getTimeGreeting();
  const returning = hasSelectedArtist;

  const letterVariants = {
    initial: { opacity: 0, y: isFirstVisit ? 40 : 15, rotateX: isFirstVisit ? -90 : 0 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        delay: returning ? 0 : isFirstVisit ? 0.8 + i * 0.15 : 0.05 + i * 0.06,
        duration: returning ? 0.15 : isFirstVisit ? 0.8 : 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  const topLineVariants = {
    initial: { scaleX: 0 },
    animate: () => ({
      scaleX: 1,
      transition: {
        delay: returning ? 0 : isFirstVisit ? 1.6 : 0.2,
        duration: returning ? 0.15 : isFirstVisit ? 1.0 : 0.6,
        ease: 'easeOut',
      },
    }),
  };

  const bottomLineVariants = {
    initial: { scaleX: 0 },
    animate: () => ({
      scaleX: 1,
      transition: {
        delay: returning ? 0 : isFirstVisit ? 1.8 : 0.25,
        duration: returning ? 0.15 : isFirstVisit ? 1.0 : 0.6,
        ease: 'easeOut',
      },
    }),
  };

  const greetingVariants = {
    initial: { opacity: 0, y: 6 },
    animate: () => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: returning ? 0.05 : isFirstVisit ? 2.0 : 0.35,
        duration: returning ? 0.2 : isFirstVisit ? 0.6 : 0.45,
        ease: 'easeOut',
      },
    }),
  };

  const taglineVariants = {
    initial: { opacity: 0, y: 10 },
    animate: () => ({
      opacity: 0.3,
      y: 0,
      transition: {
        delay: returning ? 0.1 : isFirstVisit ? 2.2 : showGreeting ? 0.45 : 0.35,
        duration: returning ? 0.15 : isFirstVisit ? 0.8 : 0.5,
        ease: 'easeOut',
      },
    }),
  };

  const inviteVariants = {
    initial: { opacity: 0, y: 5 },
    animate: () => ({
      opacity: 0.25,
      y: 0,
      transition: {
        delay: returning ? 0.15 : isFirstVisit ? 2.7 : 0.55,
        duration: returning ? 0.15 : isFirstVisit ? 0.8 : 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="flex flex-col items-center gap-6 px-6 mb-8 shrink-0 w-full relative">
      <motion.div className="relative flex flex-col items-center">
        <motion.div
          variants={topLineVariants}
          initial="initial"
          animate="animate"
          className="relative w-24 h-px mb-8"
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${accentLineFade} to-transparent`} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>

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
                  textShadow: 'none',
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>

        <motion.div
          variants={bottomLineVariants}
          initial="initial"
          animate="animate"
          className="relative w-24 h-px mt-8"
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${accentLineFade} to-transparent opacity-60`} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
      </motion.div>

      {showGreeting && (
        <motion.p
          variants={greetingVariants}
          initial="initial"
          animate="animate"
          className="text-[13px] text-white/30 font-light tracking-wide -mt-2 select-none"
        >
          {greeting},{' '}
          <span className="text-white/50 font-normal">{profile.username}</span>
        </motion.p>
      )}

      <motion.p
        variants={taglineVariants}
        initial="initial"
        animate="animate"
        className={`elva-section-label tracking-[0.4em] font-light opacity-75 ${showGreeting ? '-mt-2' : '-mt-4'}`}
      >
        Listen Deeper
      </motion.p>

      {!hasSeenTour && tourType === null && (
        <motion.p
          variants={inviteVariants}
          initial="initial"
          animate="animate"
          whileHover={{ opacity: 0.65 }}
          className="mt-2 text-[11px] font-light text-white/50 tracking-[0.1em] transition-all duration-300 uppercase cursor-pointer"
        >
          New to Elva?{' '}
          <button
            onClick={startTour}
            className={`underline decoration-white/20 hover:decoration-current ${theme.textHover} ${theme.text} cursor-pointer transition-colors`}
          >
            Take a quick tour
          </button>
        </motion.p>
      )}
    </div>
  );
}
