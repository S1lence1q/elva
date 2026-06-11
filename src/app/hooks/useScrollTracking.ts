import { useState, useEffect, useRef } from 'react';

export function useScrollTracking(
  activeTab: 'search' | 'discover' | 'myhub',
  navMode: 'tabs' | 'scroll',
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollVelocity, setScrollVelocity] = useState(0);

  // For scroll mode
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());

  // For tabs mode LERPing
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const targetVelocity = useRef(0);
  const lastTab = useRef(activeTab);
  const rafRef = useRef<number | null>(null);

  // Set target progress based on active tab (tabs mode only)
  useEffect(() => {
    if (navMode === 'tabs') {
      if (activeTab === 'search') targetProgress.current = 0;
      else if (activeTab === 'discover') targetProgress.current = 0.5;
      else if (activeTab === 'myhub') targetProgress.current = 1.0;

      // Trigger velocity spike when changing tabs for fluid background animation
      if (activeTab !== lastTab.current) {
        targetVelocity.current = 0.8;
        lastTab.current = activeTab;
      }
    }
  }, [activeTab, navMode]);

  // HandleScroll is called on the container scroll event in scroll mode
  const handleScroll = () => {
    if (navMode !== 'scroll') return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    if (scrollHeight <= 0) return;

    const progress = scrollTop / scrollHeight;
    setScrollProgress(progress);
    currentProgress.current = progress; // sync currentProgress

    const now = Date.now();
    let timeDiff = now - lastScrollTime.current;
    
    if (timeDiff > 100) {
      timeDiff = 16;
    }

    const distDiff = Math.abs(scrollTop - lastScrollTop.current);
    const rawVelocity = distDiff / Math.max(1, timeDiff);

    // Limit maximum instantaneous target velocity
    targetVelocity.current = Math.min(1.2, rawVelocity);

    lastScrollTop.current = scrollTop;
    lastScrollTime.current = now;
  };

  useEffect(() => {
    let active = true;

    const animate = () => {
      if (!active) return;

      if (navMode === 'tabs') {
        // Smoothly interpolate scrollProgress to targetProgress
        const progressDiff = targetProgress.current - currentProgress.current;
        if (Math.abs(progressDiff) > 0.0001) {
          currentProgress.current += progressDiff * 0.08;
        } else {
          currentProgress.current = targetProgress.current;
        }
        setScrollProgress(currentProgress.current);
      }

      // Decaying velocity spike
      targetVelocity.current *= 0.92;
      if (targetVelocity.current < 0.001) {
        targetVelocity.current = 0;
      }

      setScrollVelocity((prev) => {
        if (targetVelocity.current === 0 && prev === 0) {
          return 0;
        }
        const diff = targetVelocity.current - prev;
        if (Math.abs(diff) < 0.001) {
          return targetVelocity.current;
        }
        return prev + diff * 0.06;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [navMode]);

  return {
    scrollProgress,
    scrollVelocity,
    handleScroll,
    setScrollProgress
  };
}
