import { useEffect } from 'react';

interface AudioPlayerOptions {
  audioUrl: string;
  isYouTubeMode: boolean;
  isPlaying: boolean;
  setPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  fadeVolume: (target: number, duration: number) => Promise<void>;
  faderRef: React.MutableRefObject<number>;
  handleNextSong: () => void;
  initAudioAnalyzer: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isTransitioningRef: React.MutableRefObject<boolean>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
}

export function useAudioPlayer({
  audioUrl,
  isYouTubeMode,
  isPlaying,
  setPlaying,
  setDuration,
  fadeVolume,
  faderRef,
  handleNextSong,
  initAudioAnalyzer,
  audioRef,
  isTransitioningRef,
  audioContextRef
}: AudioPlayerOptions) {
  useEffect(() => {
    if (!isYouTubeMode && audioUrl) {
      if (audioRef.current) {
        isTransitioningRef.current = true;
        audioRef.current.src = audioUrl;
        
        // Start at 0 volume and play, then fade in!
        faderRef.current = 0;
        audioRef.current.volume = 0;
        setPlaying(true);
        initAudioAnalyzer();
        
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        
        audioRef.current.play()
          .then(() => {
            isTransitioningRef.current = false;
            fadeVolume(1, 800);
          })
          .catch(console.error);
      }
    }

    return () => {
      // Pause local audio and clear source to release hardware audio decoders/buffers
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.load();
        } catch (e) {}
      }
    };
  }, [isYouTubeMode, audioUrl]);
}
