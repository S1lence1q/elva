import React, { useEffect, useRef } from 'react';
import { LyricLine } from '../types';
import { ThemeColors } from './themeUtils';
import { Upload, Edit3 } from 'lucide-react';

interface LyricsPanelProps {
  showLyrics: boolean;
  lyrics: LyricLine[];
  isLoadingLyrics: boolean;
  isLyricsSynced: boolean;
  currentLyricIndex: number;
  seekToAbsoluteTime: (time: number) => void;
  setShowLyrics: (show: boolean) => void;
  theme: ThemeColors;
  isSideBySide?: boolean;
  onOpenUploadModal?: () => void;
  hasCustomLyrics?: boolean;
  enableCustomLyrics?: boolean;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({
  showLyrics,
  lyrics,
  isLoadingLyrics,
  isLyricsSynced,
  currentLyricIndex,
  seekToAbsoluteTime,
  setShowLyrics,
  theme,
  isSideBySide = false,
  onOpenUploadModal,
  hasCustomLyrics = false,
  enableCustomLyrics = false
}) => {
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const isInitialOpenRef = useRef(true);

  // Reset the initial open flag when lyrics panel is closed
  useEffect(() => {
    if (!showLyrics) {
      isInitialOpenRef.current = true;
    }
  }, [showLyrics]);

  // Auto-scroll to active lyric (instant on open, smooth during play)
  useEffect(() => {
    if (showLyrics && isLyricsSynced && activeLyricRef.current && lyricContainerRef.current) {
      if (isInitialOpenRef.current) {
        activeLyricRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'center',
        });
        isInitialOpenRef.current = false;
      } else {
        activeLyricRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentLyricIndex, showLyrics, isLyricsSynced]);

  return (
    <div
      className={`${
        isSideBySide 
          ? 'relative w-full h-full flex flex-col items-start py-4 bg-transparent border-0 shadow-none' 
          : 'absolute inset-0 w-full h-full rounded-[28px] overflow-hidden bg-black/60 backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex flex-col items-center py-10'
      } cursor-default ${
        !showLyrics ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
      style={isSideBySide ? {
        visibility: showLyrics ? 'visible' : 'hidden'
      } : {
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        visibility: showLyrics ? 'visible' : 'hidden'
      }}
      onClick={() => setShowLyrics(false)}
    >
      {/* Dynamic internal glow from current colors - hidden in side-by-side floating mode */}
      {!isSideBySide && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 10%, var(--theme-primary) 0%, transparent 60%), radial-gradient(circle at 50% 90%, var(--theme-secondary) 0%, transparent 60%)'
          }}
        />
      )}

      {/* Header with optional Unsynced badge */}
      <div className={`flex flex-col ${isSideBySide ? 'items-start mb-6' : 'items-center mb-5'} gap-1.5 relative z-10 w-full`}>
        <div className="flex items-center gap-2">
          <h3 className={`text-xs font-bold tracking-[0.25em] uppercase ${isSideBySide ? 'text-white/20' : 'text-white/40'}`}>Lyrics</h3>
          {onOpenUploadModal && enableCustomLyrics && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenUploadModal(); }}
              className="p-1 rounded-md bg-white/[0.03] border border-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
              title={hasCustomLyrics ? "Edit custom lyrics" : "Upload custom lyrics"}
            >
              {hasCustomLyrics ? <Edit3 className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
            </button>
          )}
        </div>
        {!isLyricsSynced && lyrics.length > 0 && (
          <span className="text-[9px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider font-medium">
            {hasCustomLyrics ? 'Custom Plain Lyrics' : 'Plain Lyrics'}
          </span>
        )}
        {isLyricsSynced && hasCustomLyrics && (
          <span className="text-[9px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider font-medium">
            Custom Synced Lyrics
          </span>
        )}
      </div>

      <div 
        ref={lyricContainerRef}
        className={`w-full flex-1 overflow-y-auto scrollbar-none relative z-10 flex flex-col ${
          isSideBySide ? 'items-start pl-2 pr-12' : 'items-center px-8'
        } pb-32`}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maskImage: isLyricsSynced 
            ? 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' 
            : 'none' 
        }}
      >
        {isLyricsSynced && <div className={isSideBySide ? "min-h-[25%]" : "min-h-[40%]"} />} {/* Spacer only for synced centering */}
        
        {isLoadingLyrics ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full w-full">
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
                  className={`w-full ${isSideBySide ? 'text-left py-3.5' : 'text-center py-4'} cursor-pointer transition-all duration-500 ease-out`}
                >
                  <p className={`tracking-tight select-none transition-all duration-500 origin-left ${
                    isSideBySide
                      ? `max-w-[75%] ${isActive
                        ? 'text-[19px] md:text-[22px] font-black text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.18)] opacity-100 scale-[1.3]'
                        : 'text-[19px] md:text-[22px] font-bold text-white/20 scale-100 hover:text-white/50'
                      }`
                      : isActive
                        ? 'text-2xl font-medium text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] scale-105 filter-none opacity-100'
                        : 'text-xl text-white/80 opacity-30 scale-100 blur-[1px] hover:opacity-60'
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
                  className={`w-full ${isSideBySide ? 'text-left py-2' : 'text-center py-2.5'} opacity-80 hover:opacity-100 transition-all duration-200`}
                >
                  <p className={`tracking-tight select-text ${
                    isSideBySide 
                      ? 'text-[20px] leading-relaxed text-white/90 font-semibold' 
                      : 'text-[19px] text-white/90 font-normal leading-relaxed'
                  }`}>
                    {line.text}
                  </p>
                </div>
              );
            }
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 w-full">
            <p className="text-white/50 text-lg font-medium tracking-wide">Lyrics not found</p>
            <p className="text-white/30 text-sm mt-2 font-light">Enjoy the rhythm and melody instead</p>
          </div>
        )}
        
        {isLyricsSynced && <div className={isSideBySide ? "min-h-[50%]" : "min-h-[60%]"} />}
      </div>
    </div>
  );
};
