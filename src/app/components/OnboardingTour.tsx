import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

interface OnboardingTourProps {
  tourType: 'landing' | 'player' | null;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  borderRadius: string;
}

export const tourSteps: TourStep[] = [
  {
    targetId: 'search-input',
    title: 'Search & Stream',
    description: 'Search for any song, artist, or paste a YouTube link here to stream music instantly. Click "Next" to preview the gorgeous player!',
    position: 'bottom',
    borderRadius: '24px',
  },
  {
    targetId: 'music-controls',
    title: 'Playback & Controls',
    description: 'Play, pause, skip, or drag the timeline to seek. Click the album cover to play/pause, or use Space, Arrow keys, and "M" to mute. Press ⌘, (or Ctrl+,) to open Settings anytime!',
    position: 'top',
    borderRadius: '24px',
  },
  {
    targetId: 'queue-button',
    title: 'Queue & Utilities',
    description: 'Manage your playback queue, add music locally, or customize settings. Click "Queue" to see the redesigned centered glassmorphic queue modal!',
    position: 'top',
    borderRadius: '24px',
  },
];

export function OnboardingTour({
  tourType,
  currentStep,
  onNext,
  onBack,
  onSkip,
}: OnboardingTourProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const activeSteps = tourSteps;
  const activeStep = activeSteps[currentStep];

  // Resize / scroll / layout listener to dynamically follow targeted elements
  useEffect(() => {
    if (!tourType || !activeStep) {
      setRect(null);
      setIsMounted(false);
      return;
    }

    const updateRect = () => {
      const element = document.getElementById(activeStep.targetId);
      if (element) {
        setRect(element.getBoundingClientRect());
        setIsMounted(true);
      } else {
        setRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    // Dynamic interval polling to immediately catch transitions/mounts
    const interval = setInterval(updateRect, 200);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      clearInterval(interval);
    };
  }, [currentStep, tourType, activeStep]);

  // Tooltip positioning system with viewport boundary constraints
  useEffect(() => {
    if (!tourType || !activeStep) return;

    const tooltipWidth = 380;
    const tooltipHeight = 260; // accurate height to prevent bottom clipping
    const margin = 20;

    if (!rect) {
      setTooltipPos({
        left: window.innerWidth / 2 - tooltipWidth / 2,
        top: window.innerHeight / 2 - tooltipHeight / 2 - 20,
      });
      return;
    }

    let left = 0;
    let top = 0;

    switch (activeStep.position) {
      case 'bottom':
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        top = rect.bottom + margin;
        break;
      case 'top':
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        top = rect.top - tooltipHeight - margin;
        break;
      case 'left':
        left = rect.left - tooltipWidth - margin;
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        left = rect.right + margin;
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      default:
        left = window.innerWidth / 2 - tooltipWidth / 2;
        top = window.innerHeight / 2 - tooltipHeight / 2;
    }

    // Viewport boundary check to prevent text cut-off on small screens
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));
    top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));

    setTooltipPos({ left, top });
  }, [rect, currentStep, tourType, activeStep]);

  if (!tourType || !activeStep) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* SVG-based Spotlight Overlay - perfect under zoom, zero GPU/flicker artifacts */}
      <AnimatePresence>
        {rect && (
          <motion.svg 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 w-full h-full pointer-events-none z-[90]"
          >
            <defs>
              <mask id="spotlight-mask">
                {/* White covers everything (keeps backdrop visible) */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Black cutout (creates the clear hole) */}
                <motion.rect
                  initial={!isMounted ? {
                    x: rect.left - 6,
                    y: rect.top - 6,
                    width: rect.width + 12,
                    height: rect.height + 12,
                    rx: parseInt(activeStep.borderRadius) || 24,
                    ry: parseInt(activeStep.borderRadius) || 24,
                  } : false}
                  animate={{
                    x: rect.left - 6,
                    y: rect.top - 6,
                    width: rect.width + 12,
                    height: rect.height + 12,
                    rx: parseInt(activeStep.borderRadius) || 24,
                    ry: parseInt(activeStep.borderRadius) || 24,
                  }}
                  transition={{ type: 'spring', stiffness: 130, damping: 20 }}
                  fill="black"
                />
              </mask>
            </defs>
            
            {/* The semi-transparent dark backdrop */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(5, 5, 5, 0.76)"
              mask="url(#spotlight-mask)"
            />

            {/* Glow border ring around the spotlight hole */}
            <motion.rect
              initial={!isMounted ? {
                x: rect.left - 6,
                y: rect.top - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                rx: parseInt(activeStep.borderRadius) || 24,
                ry: parseInt(activeStep.borderRadius) || 24,
              } : false}
              animate={{
                x: rect.left - 6,
                y: rect.top - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                rx: parseInt(activeStep.borderRadius) || 24,
                ry: parseInt(activeStep.borderRadius) || 24,
              }}
              transition={{ type: 'spring', stiffness: 130, damping: 20 }}
              fill="none"
              stroke="rgba(16, 185, 129, 0.3)"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.35))'
              }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Screen-wide transparent click-catcher during the tour */}
      <div className="absolute inset-0 bg-black/5 pointer-events-auto z-40" />

      {/* Glassmorphic Tooltip Card - Positioned in style, animated locally in framer motion to prevent layout jumps */}
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: 0.94, 
          y: 12,
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
        }}
        transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        style={{
          left: tooltipPos.left,
          top: tooltipPos.top,
          position: 'fixed'
        }}
        className="fixed w-[380px] z-[110] pointer-events-auto select-none rounded-[28px] border border-emerald-500/10 bg-[#121214]/65 backdrop-blur-3xl shadow-[0_30px_70px_rgba(0,0,0,0.7)] p-6 overflow-hidden flex flex-col"
      >
        {/* Decorative subtle emerald radial glow in corner */}
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none animate-pulse" />

        {/* Top Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-[10px] text-emerald-400/80 uppercase tracking-[0.2em] font-medium">Guide • Step {currentStep + 1} of {activeSteps.length}</span>
          </div>
          <button
            onClick={onSkip}
            className="p-1 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
            title="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Area */}
        <h3 className="text-[17px] font-medium tracking-tight text-white/95 mb-1.5 leading-snug">{activeStep.title}</h3>
        <p className="text-[13px] font-light text-white/55 leading-relaxed mb-6">{activeStep.description}</p>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-auto">
          <button
            onClick={onSkip}
            className="text-xs font-light text-white/30 hover:text-white/50 transition-all cursor-pointer"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center justify-center text-white/60 hover:text-white"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onNext}
              className="bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-95 border border-emerald-500/20 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{currentStep === activeSteps.length - 1 ? 'Finish' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
