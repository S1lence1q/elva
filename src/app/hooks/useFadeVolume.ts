import { useRef, useCallback } from 'react';

interface FadeVolumeOptions {
  volumeRef: React.MutableRefObject<number>;
  ytPlayerRef: React.MutableRefObject<any>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  videoId?: string;
}

export function useFadeVolume({
  volumeRef,
  ytPlayerRef,
  audioRef,
  videoId
}: FadeVolumeOptions) {
  const faderRef = useRef(1); // multiplier 0 to 1
  const faderAnimationRef = useRef<number | null>(null);
  const fadeResolveRef = useRef<(() => void) | null>(null);
  const isFadingOutRef = useRef(false);

  const fadeVolume = useCallback((target: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
        faderAnimationRef.current = null;
      }

      if (fadeResolveRef.current) {
        fadeResolveRef.current();
      }
      fadeResolveRef.current = resolve;

      const startValue = faderRef.current;
      const startTime = performance.now();

      const run = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out quad for fading in, ease-in quad for fading out
        const isFadingIn = target > startValue;
        const ease = isFadingIn 
          ? progress * (2 - progress) // Ease-out
          : progress * progress;       // Ease-in
        faderRef.current = startValue + (target - startValue) * ease;

        // Apply faded volume to active player
        const activeVol = Math.round(volumeRef.current * faderRef.current);
        if (videoId && ytPlayerRef.current && ytPlayerRef.current.setVolume) {
          try {
            ytPlayerRef.current.setVolume(activeVol);
          } catch (e) {}
        }
        if (audioRef.current) {
          audioRef.current.volume = activeVol / 100;
        }

        if (progress < 1) {
          faderAnimationRef.current = requestAnimationFrame(run);
        } else {
          faderRef.current = target;
          faderAnimationRef.current = null;
          fadeResolveRef.current = null;
          resolve();
        }
      };

      faderAnimationRef.current = requestAnimationFrame(run);
    });
  }, [videoId, volumeRef, ytPlayerRef, audioRef]);

  return {
    fadeVolume,
    faderRef,
    faderAnimationRef,
    fadeResolveRef,
    isFadingOutRef
  };
}
