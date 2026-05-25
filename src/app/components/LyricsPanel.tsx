import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../types';
import { ThemeColors } from './themeUtils';

interface LyricsPanelProps {
  showLyrics: boolean;
  lyrics: LyricLine[];
  isLoadingLyrics: boolean;
  isLyricsSynced: boolean;
  currentLyricIndex: number;
  seekToAbsoluteTime: (time: number) => void;
  setShowLyrics: (show: boolean) => void;
  theme: ThemeColors;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  showLyrics,
  lyrics,
  isLoadingLyrics,
  isLyricsSynced,
  currentLyricIndex,
  seekToAbsoluteTime,
  setShowLyrics,
  theme
}) => {
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active lyric
  useEffect(() => {
    if (showLyrics && isLyricsSynced && activeLyricRef.current && lyricContainerRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLyricIndex, showLyrics, isLyricsSynced]);

  return (
    <div
      className={`absolute inset-0 w-full h-full rounded-[28px] overflow-hidden bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex flex-col items-center py-10 cursor-default ${
        !showLyrics ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        visibility: showLyrics ? 'visible' : 'hidden'
      }}
      onClick={() => setShowLyrics(false)}
    >
      {/* Dynamic internal glow from current colors */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 10%, var(--theme-primary) 0%, transparent 60%), radial-gradient(circle at 50% 90%, var(--theme-secondary) 0%, transparent 60%)'
        }}
      />

      {/* Header with optional Unsynced badge */}
      <div className="flex flex-col items-center gap-1.5 mb-5 relative z-10">
        <h3 className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase">Lyrics</h3>
        {!isLyricsSynced && lyrics.length > 0 && (
          <span className="text-[10px] text-white/40 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-medium">
            Plain Lyrics
          </span>
        )}
      </div>

      <div 
        ref={lyricContainerRef}
        className="w-full flex-1 overflow-y-auto scrollbar-none relative z-10 px-8 flex flex-col items-center pb-32"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maskImage: isLyricsSynced 
            ? 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' 
            : 'none' 
        }}
      >
        {isLyricsSynced && <div className="min-h-[40%]" />} {/* Spacer only for synced centering */}
        
        {isLoadingLyrics ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full">
            <div className={`w-6 h-6 border-2 border-white/20 ${theme.borderT} rounded-full animate-spin`} />
            <p className="text-white/40 text-sm tracking-widest uppercase">Fetching lyrics...</p>
          </div>
        ) : lyrics.length > 0 ? (
          lyrics.map((line, idx) => {
            if (isLyricsSynced) {
              const isActive = idx === currentLyricIndex;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeLyricRef : null}
                  onClick={(e) => { e.stopPropagation(); seekToAbsoluteTime(line.time); }}
                  className={`w-full text-center py-4 cursor-pointer transition-all duration-500 ease-out ${
                    isActive
                      ? 'opacity-100 scale-105 filter-none'
                      : 'opacity-30 scale-100 blur-[1px] hover:opacity-60'
                  }`}
                >
                  <p className={`font-medium tracking-tight ${
                    isActive ? 'text-2xl text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]' : 'text-xl text-white/80'
                  }`}>
                    {line.text}
                  </p>
                </div>
              );
            } else {
              // Static lyrics mode: fully visible, cleanly spaced scrollable lines
              return (
                <div
                  key={idx}
                  className="w-full text-center py-2.5 opacity-80 hover:opacity-100 transition-all duration-200"
                >
                  <p className="text-[19px] text-white/90 font-normal tracking-tight leading-relaxed select-text">
                    {line.text}
                  </p>
                </div>
              );
            }
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-white/50 text-lg font-medium tracking-wide">Lyrics not found</p>
            <p className="text-white/30 text-sm mt-2 font-light">Enjoy the rhythm and melody instead ♪</p>
          </div>
        )}
        
        {isLyricsSynced && <div className="min-h-[60%]" />}
      </div>
    </div>
  );
};
