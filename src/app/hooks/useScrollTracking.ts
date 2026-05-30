import { useState, useEffect, useRef } from 'react';

export function useScrollTracking(scrollContainerRef: React.RefObject<HTMLDivElement | null>) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const targetVelocity = useRef(0);
  const rafRef = useRef<number | null>(null);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    if (scrollHeight <= 0) return;

    const progress = scrollTop / scrollHeight;
    setScrollProgress(progress);

    const now = Date.now();
    let timeDiff = now - lastScrollTime.current;
    
    // If the last scroll event was more than 100ms ago, treat this as a fresh start to avoid time division anomalies
    if (timeDiff > 100) {
      timeDiff = 16;
    }

    const distDiff = Math.abs(scrollTop - lastScrollTop.current);
    const rawVelocity = distDiff / Math.max(1, timeDiff);

    // Limit maximum instantaneous target velocity to prevent erratic multiplier spikes
    targetVelocity.current = Math.min(1.2, rawVelocity);

    lastScrollTop.current = scrollTop;
    lastScrollTime.current = now;
  };

  useEffect(() => {
    let active = true;

    const updateVelocity = () => {
      if (!active) return;

      // Slow, steady physical decay representing viscosity/friction
      targetVelocity.current *= 0.92;
      if (targetVelocity.current < 0.001) {
        targetVelocity.current = 0;
      }

      // Butter-smooth linear interpolation towards target
      setScrollVelocity((prev) => {
        if (targetVelocity.current === 0 && prev === 0) {
          return 0;
        }
        const diff = targetVelocity.current - prev;
        if (Math.abs(diff) < 0.001) {
          return targetVelocity.current;
        }
        return prev + diff * 0.06; // Fine-tuned damping factor (0.06) for organic responsiveness
      });

      rafRef.current = requestAnimationFrame(updateVelocity);
    };

    rafRef.current = requestAnimationFrame(updateVelocity);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    scrollProgress,
    scrollVelocity,
    handleScroll,
    setScrollProgress
  };
}
