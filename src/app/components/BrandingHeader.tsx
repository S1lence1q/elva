import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { STOREFRONT_COUNTRIES } from '../utils/chartFeeds';

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
  
  const [profile, setProfile] = useState(() => {
    return {
      username: localStorage.getItem('elva_profile_name') || 'Music Lover',
      avatar: localStorage.getItem('elva_profile_avatar') || 'initials',
      country: localStorage.getItem('elva_profile_country') || 'dk'
    };
  });

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      setIsVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 5500);
    };

    resetTimer();

    const handleProfileUpdate = () => {
      setProfile({
        username: localStorage.getItem('elva_profile_name') || 'Music Lover',
        avatar: localStorage.getItem('elva_profile_avatar') || 'initials',
        country: localStorage.getItem('elva_profile_country') || 'dk'
      });
      resetTimer();
    };

    window.addEventListener('elva-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('elva-profile-updated', handleProfileUpdate);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const COUNTRY_GREETINGS: Record<string, { morning: string; afternoon: string; evening: string; emoji: string }> = {
    dk: { morning: 'Godmorgen', afternoon: 'Goddag', evening: 'Godaften', emoji: '👋' },
    us: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', emoji: '👋' },
    gb: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', emoji: '👋' },
    ca: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', emoji: '👋' },
    au: { morning: 'G\'day', afternoon: 'Good afternoon', evening: 'Good evening', emoji: '👋' },
    se: { morning: 'God morgon', afternoon: 'God dag', evening: 'God kväll', emoji: '👋' },
    no: { morning: 'God morgen', afternoon: 'God dag', evening: 'God kveld', emoji: '👋' },
    de: { morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Abend', emoji: '👋' },
    fr: { morning: 'Bonjour', afternoon: 'Bonjour', evening: 'Bonsoir', emoji: '👋' },
    jp: { morning: 'おはようございます', afternoon: 'こんにちは', evening: 'こんばんは', emoji: '👋' }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const countryKey = profile.country || 'dk';
    const greetings = COUNTRY_GREETINGS[countryKey] || COUNTRY_GREETINGS.dk;
    
    if (hour >= 5 && hour < 12) return { text: greetings.morning, emoji: greetings.emoji };
    if (hour >= 12 && hour < 18) return { text: greetings.afternoon, emoji: greetings.emoji };
    return { text: greetings.evening, emoji: greetings.emoji };
  };

  const { text: greetingText, emoji: greetingEmoji } = getGreeting();
  const activeCountryData = STOREFRONT_COUNTRIES.find(c => c.code === profile.country) || { name: 'Denmark', flag: '🇩🇰' };

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
    <div className="flex flex-col items-center gap-6 px-6 mb-8 shrink-0 w-full relative">
      {/* Personalized Greeting Banner */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.92 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsVisible(false)}
            className="absolute -top-12 flex items-center gap-3 px-4 py-2 rounded-full border border-white/[0.06] bg-[#0c0d12]/70 backdrop-blur-xl shadow-xl hover:border-white/10 hover:bg-[#0c0d12]/90 transition-all duration-300 group shrink-0 cursor-pointer z-50"
          >
            {/* Miniature Avatar */}
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-gradient-to-tr shadow-sm bg-[#0f0f12] relative shrink-0">
              {profile.avatar === 'initials' ? (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-white/[0.04] to-white/[0.12] backdrop-blur-md relative overflow-hidden">
                  <span className="text-[9px] font-extrabold text-white tracking-tighter">
                    {profile.username.trim() ? profile.username.trim().charAt(0).toUpperCase() : 'M'}
                  </span>
                </div>
              ) : (
                <div className={`w-full h-full rounded-full bg-gradient-to-tr ${profile.avatar}`} />
              )}
            </div>
            
            <span className="text-[10px] font-medium tracking-wider text-white/80">
              {greetingText}, <span className="font-bold text-white">{profile.username}</span> {greetingEmoji}
            </span>

            <span 
              className="text-[10px] opacity-80 pl-2.5 border-l border-white/10 select-none cursor-default" 
              title={`Storefront: ${activeCountryData.name}`}
            >
              {activeCountryData.flag}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
        className="elva-section-label tracking-[0.4em] font-light opacity-75"
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
