import { useEffect } from 'react';

interface YouTubePlayerOptions {
  videoId: string | undefined;
  isYouTubeMode: boolean;
  isPlaying: boolean;
  isPlayingRef: React.MutableRefObject<boolean>;
  setPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  fadeVolume: (target: number, duration: number) => Promise<void>;
  faderRef: React.MutableRefObject<number>;
  handleNextSongRef: React.MutableRefObject<() => Promise<void>>;
  isTransitioningRef: React.MutableRefObject<boolean>;
  ytPlayerRef: React.MutableRefObject<any>;
  faderAnimationRef: React.MutableRefObject<number | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useYouTubePlayer({
  videoId,
  isYouTubeMode,
  isPlaying,
  isPlayingRef,
  setPlaying,
  setDuration,
  fadeVolume,
  faderRef,
  handleNextSongRef,
  isTransitioningRef,
  ytPlayerRef,
  faderAnimationRef,
  audioRef
}: YouTubePlayerOptions) {
  useEffect(() => {
    if (isYouTubeMode) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const createYTPlayer = () => {
        const container = document.getElementById('yt-player-container');
        if (!container) return;

        ytPlayerRef.current = new window.YT.Player('yt-player-container', {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            disablekb: 1,
          },
          events: {
            onReady: (e: any) => {
              // Start at 0 volume and fade in!
              faderRef.current = 0;
              e.target.setVolume(0);
              setDuration(e.target.getDuration());
              if (isPlayingRef.current) {
                e.target.playVideo();
                fadeVolume(1, 800);
              } else {
                e.target.pauseVideo();
              }
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                handleNextSongRef.current();
              } else if (e.data === window.YT.PlayerState.PLAYING) {
                setPlaying(true);
                isTransitioningRef.current = false;
                setDuration(e.target.getDuration());
                // Fade in if the fader is at 0 or low
                if (faderRef.current < 0.1) {
                  fadeVolume(1, 800);
                }
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                // Ignore pause event during initial load transition
                if (!isTransitioningRef.current) {
                  setPlaying(false);
                }
              }
            }
          }
        });
      };

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          createYTPlayer();
        };
      } else if (!ytPlayerRef.current) {
        createYTPlayer();
      }
    }

    return () => {
      // Cancel active fade animations to prevent animation frame leaks
      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
        faderAnimationRef.current = null;
      }

      // Destroy YouTube player instance to release memory completely
      if (ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.destroy === 'function') {
            ytPlayerRef.current.destroy();
          }
        } catch (e) {
          console.warn("Failed to destroy YT Player on song change/unmount:", e);
        }
        ytPlayerRef.current = null;
      }
    };
  }, [isYouTubeMode]);

  // Load new video when videoId changes
  useEffect(() => {
    if (isYouTubeMode && videoId) {
      isTransitioningRef.current = true;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        // Start at 0 volume and load track!
        faderRef.current = 0;
        try { ytPlayerRef.current.setVolume(0); } catch(e){}
        ytPlayerRef.current.loadVideoById(videoId);
        setPlaying(true);
        ytPlayerRef.current.playVideo();
      }
    }
  }, [videoId, isYouTubeMode]);
}
