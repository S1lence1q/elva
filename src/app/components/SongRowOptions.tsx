import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Play, Plus, ListMusic, ChevronRight } from 'lucide-react';
import { SearchResult } from '../types';
import { showMiniHUD } from '../utils/hudUtils';

interface SongRowOptionsProps {
  track: SearchResult;
  onPlayNext?: (track: SearchResult) => void;
  onAddToQueue?: (track: SearchResult) => void;
}

export const SongRowOptions: React.FC<SongRowOptionsProps> = ({ track, onPlayNext, onAddToQueue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylistsSub, setShowPlaylistsSub] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load playlists from localStorage
  const loadPlaylists = () => {
    try {
      const stored = localStorage.getItem('elva_playlists');
      if (stored) {
        setPlaylists(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowPlaylistsSub(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleAddTrackToPlaylist = (playlistId: string, playlistName: string) => {
    try {
      const stored = localStorage.getItem('elva_playlists');
      const currentPlaylists = stored ? JSON.parse(stored) : [];
      const updated = currentPlaylists.map((p: any) => {
        if (p.id === playlistId) {
          // Don't add duplicates
          if (p.tracks.some((t: any) => t.id === track.id)) {
            showMiniHUD('Song already in playlist', 'info');
            return p;
          }
          return {
            ...p,
            tracks: [...p.tracks, track]
          };
        }
        return p;
      });

      localStorage.setItem('elva_playlists', JSON.stringify(updated));
      showMiniHUD(`Added to ${playlistName}`);
      window.dispatchEvent(new CustomEvent('elva-playlists-updated'));
    } catch (e) {
      showMiniHUD('Failed to add track', 'error');
    }
    setIsOpen(false);
    setShowPlaylistsSub(false);
  };

  return (
    <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all cursor-pointer"
        title="More options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-[#0b0b0e]/95 border border-white/10 backdrop-blur-2xl shadow-[0_15px_30px_rgba(0,0,0,0.6)] p-1.5 z-50 flex flex-col gap-0.5 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
          {!showPlaylistsSub ? (
            <>
              {onPlayNext && (
                <button
                  onClick={() => {
                    onPlayNext(track);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-white/50" />
                  <span>Play Next</span>
                </button>
              )}
              {onAddToQueue && (
                <button
                  onClick={() => {
                    onAddToQueue(track);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white/50" />
                  <span>Add to Queue</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (playlists.length === 0) {
                    showMiniHUD('No playlists created yet', 'info');
                  } else {
                    setShowPlaylistsSub(true);
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ListMusic className="w-3.5 h-3.5 text-white/50" />
                  <span>Add to Playlist</span>
                </div>
                <ChevronRight className="w-3 h-3 text-white/30" />
              </button>
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-white/30 font-bold border-b border-white/5 mb-1 flex justify-between items-center select-none">
                <span>Select Playlist</span>
                <button 
                  onClick={() => setShowPlaylistsSub(false)}
                  className="text-white/50 hover:text-white normal-case font-semibold text-[10px]"
                >
                  Back
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto scrollbar-none flex flex-col gap-0.5">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddTrackToPlaylist(playlist.id, playlist.name)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-left truncate"
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-tr ${playlist.color} shrink-0`} />
                    <span className="truncate">{playlist.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
