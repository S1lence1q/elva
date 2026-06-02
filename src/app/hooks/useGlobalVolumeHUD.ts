import { useEffect, useRef, useState } from 'react';

export function useGlobalVolumeHUD() {
  const [globalVolume, setGlobalVolume] = useState<number>(() => {
    const saved = localStorage.getItem('elva_player_volume');
    return saved !== null ? parseInt(saved, 10) : 70;
  });
  const [showGlobalVolumeHUD, setShowGlobalVolumeHUD] = useState(false);
  const globalVolumeHUDTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleGlobalVolumeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ volume: number }>;
      const newVol = customEvent.detail.volume;
      setGlobalVolume(newVol);

      if (globalVolumeHUDTimeoutRef.current) {
        clearTimeout(globalVolumeHUDTimeoutRef.current);
      }
      setShowGlobalVolumeHUD(true);
      globalVolumeHUDTimeoutRef.current = setTimeout(() => {
        setShowGlobalVolumeHUD(false);
      }, 1500);
    };

    window.addEventListener('elva-volume-change', handleGlobalVolumeChange);
    return () => {
      window.removeEventListener('elva-volume-change', handleGlobalVolumeChange);
      if (globalVolumeHUDTimeoutRef.current) {
        clearTimeout(globalVolumeHUDTimeoutRef.current);
      }
    };
  }, []);

  return { globalVolume, showGlobalVolumeHUD };
}
