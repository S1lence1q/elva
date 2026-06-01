import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useFadeVolume } from './useFadeVolume';
import { useAudioPlayer } from './useAudioPlayer';
import { useYouTubePlayer } from './useYouTubePlayer';
import { initAudioAnalyzer, suspendGlobalAudioContext } from '../utils/audioAnalyzer';
import type { PlaybackSongData, PlaybackQueueItem } from '../types/playback';

interface UsePlaybackCoreOptions {
  songData: PlaybackSongData;
  queue: PlaybackQueueItem[];
  onSelectFromQueue?: (id: string) => void;
  onPlayingStateChange?: (playing: boolean) => void;
}

export function usePlaybackCore({
  songData,
  queue,
  onSelectFromQueue,
  onPlayingStateChange,
}: UsePlaybackCoreOptions) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('elva_player_volume');
    return saved !== null ? parseInt(saved, 10) : 70;
  });
  const [preMuteVolume, setPreMuteVolume] = useState<number>(() => {
    const saved = localStorage.getItem('elva_player_premute_volume');
    return saved !== null ? parseInt(saved, 10) : 70;
  });

  useEffect(() => {
    localStorage.setItem('elva_player_volume', String(volume));
    if (volume > 0) {
      localStorage.setItem('elva_player_premute_volume', String(volume));
    }
  }, [volume]);

  useEffect(() => {
    onPlayingStateChange?.(isPlaying);
  }, [isPlaying, onPlayingStateChange]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<YT.Player | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const lastToggleTimeRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const setPlaying = useCallback((value: boolean) => {
    isPlayingRef.current = value;
    setIsPlaying(value);
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const handleNextSongRef = useRef<() => Promise<void>>(async () => {});
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const { fadeVolume, faderRef, faderAnimationRef, fadeResolveRef, isFadingOutRef } = useFadeVolume({
    volumeRef,
    ytPlayerRef,
    audioRef,
    videoId: songData.videoId,
  });

  const isTogglingPlayPauseRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const initAnalyzer = useCallback(() => {
    if (!audioRef.current) return;
    initAudioAnalyzer(audioRef.current, audioSourceRef, analyserRef, audioContextRef);
  }, []);

  const fadeVolumeRef = useRef(fadeVolume);
  const initAnalyzerRef = useRef(initAnalyzer);
  useEffect(() => {
    fadeVolumeRef.current = fadeVolume;
  }, [fadeVolume]);
  useEffect(() => {
    initAnalyzerRef.current = initAnalyzer;
  }, [initAnalyzer]);

  const isYouTubeMode = !!songData.videoId;

  const handleNextSong = useCallback(async () => {
    const dur = durationRef.current;
    const time = currentTimeRef.current;
    const nearEnd = dur > 0 && time >= dur - 0.8;
    const shouldFade = isPlaying && !nearEnd;

    if (queue.length === 0) {
      if (shouldFade) {
        await fadeVolume(0, 400);
      }
      setPlaying(false);
      setCurrentTime(0);
      if (songData.videoId && ytPlayerRef.current?.seekTo) {
        try {
          ytPlayerRef.current.seekTo(0, true);
          ytPlayerRef.current.pauseVideo();
        } catch {
          /* ignore */
        }
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
      }
      faderRef.current = 1;
      const activeVol = volumeRef.current;
      if (songData.videoId && ytPlayerRef.current?.setVolume) {
        try {
          ytPlayerRef.current.setVolume(activeVol);
        } catch {
          /* ignore */
        }
      }
      if (audioRef.current) {
        audioRef.current.volume = activeVol / 100;
      }
      toast.info('Queue is empty', {
        description: 'Add more songs to keep the music playing!',
      });
      return;
    }

    if (shouldFade) {
      await fadeVolume(0, 400);
    }
    const currentIndex = queue.findIndex((item) => {
      if (songData.videoId && item.videoId === songData.videoId) return true;
      return item.title === songData.title && item.artist === songData.artist;
    });
    const nextIndex = currentIndex === -1 || currentIndex >= queue.length - 1 ? 0 : currentIndex + 1;
    const nextSong = queue[nextIndex];
    if (nextSong && onSelectFromQueue) {
      onSelectFromQueue(nextSong.id);
    }
  }, [isPlaying, queue, songData.videoId, songData.title, songData.artist, fadeVolume, setPlaying, onSelectFromQueue, faderRef, volumeRef]);

  useEffect(() => {
    handleNextSongRef.current = handleNextSong;
  }, [handleNextSong]);

  useAudioPlayer({
    audioUrl: songData.audioUrl,
    isYouTubeMode,
    isPlaying,
    setPlaying,
    setDuration,
    fadeVolume,
    faderRef,
    handleNextSong: () => {
      void handleNextSong();
    },
    initAudioAnalyzer: initAnalyzer,
    audioRef,
    isTransitioningRef,
    audioContextRef,
  });

  useYouTubePlayer({
    videoId: songData.videoId,
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
    audioRef,
  });

  const skipTime = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      setCurrentTime(newTime);
      if (songData.videoId && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(newTime, true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    },
    [duration, currentTime, songData.videoId]
  );

  const seekToAbsoluteTime = useCallback(
    (time: number) => {
      const newTime = Math.max(0, Math.min(duration || 9999, time));
      setCurrentTime(newTime);
      if (songData.videoId && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(newTime, true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    },
    [duration, songData.videoId]
  );

  const handleSliderChange = useCallback(
    (value: number[]) => {
      const newTime = value[0];
      setCurrentTime(newTime);
      if (songData.videoId && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(newTime, true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    },
    [songData.videoId]
  );

  const togglePlayPause = useCallback(async () => {
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 250) {
      return;
    }
    lastToggleTimeRef.current = now;
    isTogglingPlayPauseRef.current = true;

    try {
      const nextPlaying = !isPlaying;
      if (currentTime >= duration && duration > 0) {
        setCurrentTime(0);
        if (songData.videoId && ytPlayerRef.current) ytPlayerRef.current.seekTo(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
      }

      if (nextPlaying) {
        setPlaying(true);
        faderRef.current = 0;
        if (songData.videoId && ytPlayerRef.current?.setVolume) {
          try {
            ytPlayerRef.current.setVolume(0);
          } catch {
            /* ignore */
          }
        }
        if (audioRef.current) {
          audioRef.current.volume = 0;
        }

        if (songData.videoId && ytPlayerRef.current?.playVideo) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
            /* ignore */
          }
        } else if (audioRef.current) {
          initAnalyzer();
          if (audioContextRef.current?.state === 'suspended') {
            void audioContextRef.current.resume();
          }
          audioRef.current.play().catch(console.error);
        }

        await fadeVolume(1, 400);
      } else {
        isFadingOutRef.current = true;
        setPlaying(false);

        await fadeVolume(0, 300);

        if (!isPlayingRef.current) {
          if (songData.videoId && ytPlayerRef.current?.pauseVideo) {
            try {
              ytPlayerRef.current.pauseVideo();
            } catch {
              /* ignore */
            }
          } else if (audioRef.current) {
            audioRef.current.pause();
          }
        }
        isFadingOutRef.current = false;
      }
    } finally {
      isTogglingPlayPauseRef.current = false;
    }
  }, [
    isPlaying,
    currentTime,
    duration,
    songData.videoId,
    setPlaying,
    fadeVolume,
    initAnalyzer,
    faderRef,
    isFadingOutRef,
  ]);

  const handlePreviousSong = useCallback(async () => {
    const shouldFade = isPlaying;
    const time = currentTimeRef.current;

    if (queue.length === 0) {
      if (shouldFade) {
        await fadeVolume(0, 400);
      }
      skipTime(-time);
      if (shouldFade) {
        await fadeVolume(1, 400);
      }
      return;
    }
    if (time > 3) {
      if (shouldFade) {
        await fadeVolume(0, 400);
      }
      skipTime(-time);
      if (shouldFade) {
        await fadeVolume(1, 400);
      }
      return;
    }

    if (shouldFade) {
      await fadeVolume(0, 400);
    }
    const currentIndex = queue.findIndex((item) => {
      if (songData.videoId && item.videoId === songData.videoId) return true;
      return item.title === songData.title && item.artist === songData.artist;
    });
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    const prevSong = queue[prevIndex];
    if (prevSong && onSelectFromQueue) {
      onSelectFromQueue(prevSong.id);
    }
  }, [isPlaying, queue, songData.videoId, songData.title, songData.artist, fadeVolume, skipTime, onSelectFromQueue]);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVol = value[0];
      setVolume(newVol);

      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
        faderAnimationRef.current = null;
      }
      if (fadeResolveRef.current) {
        fadeResolveRef.current();
        fadeResolveRef.current = null;
      }
      faderRef.current = 1;

      if (songData.videoId && ytPlayerRef.current?.setVolume) {
        ytPlayerRef.current.setVolume(newVol);
      }
      if (audioRef.current) {
        audioRef.current.volume = newVol / 100;
      }

      window.dispatchEvent(new CustomEvent('elva-volume-change', { detail: { volume: newVol } }));
    },
    [songData.videoId, faderAnimationRef, fadeResolveRef, faderRef]
  );

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const waveformData = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const pattern = Math.sin(i * 0.3) * 0.4 + Math.random() * 0.3 + 0.3;
      return Math.min(1, Math.max(0.15, pattern));
    });
  }, []);

  // Sync isPlaying to underlying players — only when isPlaying/video changes (not every progress tick)
  useEffect(() => {
    if (isTogglingPlayPauseRef.current || isTransitioningRef.current || isFadingOutRef.current) {
      return;
    }

    if (songData.videoId && ytPlayerRef.current?.playVideo) {
      if (isPlaying) {
        faderRef.current = 0;
        try {
          ytPlayerRef.current.setVolume(0);
        } catch {
          /* ignore */
        }
        ytPlayerRef.current.playVideo();
        void fadeVolumeRef.current(1, 400);
      } else {
        ytPlayerRef.current.pauseVideo();
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        faderRef.current = 0;
        audioRef.current.volume = 0;
        initAnalyzerRef.current();
        if (audioContextRef.current?.state === 'suspended') {
          void audioContextRef.current.resume();
        }
        audioRef.current
          .play()
          .then(() => {
            void fadeVolumeRef.current(1, 400);
          })
          .catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, songData.videoId]);

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: songData.title,
      artist: songData.artist,
      artwork: songData.artworkUrl
        ? [{ src: songData.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlayingRef.current) {
        void togglePlayPause();
      }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlayingRef.current) {
        void togglePlayPause();
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      void handlePreviousSong();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      void handleNextSongRef.current();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        handleSliderChange([details.seekTime]);
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [songData.title, songData.artist, songData.artworkUrl, isPlaying, songData.videoId, togglePlayPause, handlePreviousSong, handleSliderChange]);

  // Progress timer — 250ms UI updates (50ms caused excessive re-renders)
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        if (songData.videoId && ytPlayerRef.current?.getCurrentTime) {
          setCurrentTime(ytPlayerRef.current.getCurrentTime());
          const dur = ytPlayerRef.current.getDuration();
          if (dur > 0) setDuration(dur);
        } else if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 250);
    } else if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, songData.videoId]);

  // Global playback events (mini player on landing)
  useEffect(() => {
    const handleTogglePlayEvent = () => {
      void togglePlayPause();
    };
    const handleNextSongEvent = () => {
      void handleNextSong();
    };
    const handlePrevSongEvent = () => {
      void handlePreviousSong();
    };

    window.addEventListener('elva-toggle-play', handleTogglePlayEvent);
    window.addEventListener('elva-play-next', handleNextSongEvent);
    window.addEventListener('elva-play-prev', handlePrevSongEvent);

    return () => {
      window.removeEventListener('elva-toggle-play', handleTogglePlayEvent);
      window.removeEventListener('elva-play-next', handleNextSongEvent);
      window.removeEventListener('elva-play-prev', handlePrevSongEvent);
    };
  }, [togglePlayPause, handleNextSong, handlePreviousSong]);

  // Teardown
  useEffect(() => {
    return () => {
      if (faderAnimationRef.current) {
        cancelAnimationFrame(faderAnimationRef.current);
      }
      if (fadeResolveRef.current) {
        fadeResolveRef.current();
        fadeResolveRef.current = null;
      }
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }

      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch {
          /* ignore */
        }
        audioSourceRef.current = null;
      }

      suspendGlobalAudioContext();
    };
  }, [faderAnimationRef, fadeResolveRef]);

  return {
    isPlaying,
    isPlayingRef,
    currentTime,
    duration,
    setDuration,
    volume,
    preMuteVolume,
    setPreMuteVolume,
    audioRef,
    fadeVolume,
    togglePlayPause,
    handleNextSong,
    handlePreviousSong,
    handleSliderChange,
    handleVolumeChange,
    skipTime,
    seekToAbsoluteTime,
    formatTime,
    waveformData,
    setPlaying,
  };
}

// Minimal YT.Player typing for refs
declare namespace YT {
  interface Player {
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    setVolume(volume: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    loadVideoById(videoId: string): void;
    destroy(): void;
  }
}
