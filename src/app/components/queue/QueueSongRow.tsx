import { Play, Plus } from 'lucide-react';
import type { SearchResult } from './types';
import { SongRowOptions } from '../SongRowOptions';

interface QueueSongRowProps {
  song: SearchResult;
  onPlay: () => void;
  onAddToQueue?: (e: React.MouseEvent, song: SearchResult) => void;
  onPlayNext?: (song: SearchResult) => void;
  onToggleFavorite?: (song: SearchResult) => void;
  isFavorite?: boolean;
  rowKey?: string;
}

/** Standard vertical song row used across queue subviews. */
export function QueueSongRow({
  song,
  onPlay,
  onAddToQueue,
  onPlayNext,
  onToggleFavorite,
  isFavorite = false,
  rowKey,
}: QueueSongRowProps) {
  return (
    <div
      key={rowKey}
      onClick={onPlay}
      className="group w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] border-0 transition-colors duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-3.5 truncate mr-3 flex-1">
        <div
          className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-white/5 cursor-pointer group/thumb transition-transform duration-200 active:scale-95"
          onClick={(e) => {
            if (onAddToQueue) {
              e.stopPropagation();
              onAddToQueue(e, song);
            }
          }}
          title="Add to queue"
        >
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {/* Play icon when hovering the row, hidden when hovering thumbnail specifically */}
            <Play className="w-4 h-4 text-white fill-white group-hover/thumb:hidden" />
            
            {/* Plus icon when hovering the thumbnail specifically */}
            <div className="hidden group-hover/thumb:flex p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="text-left truncate">
          <h4 className="text-sm font-semibold text-white/95 truncate tracking-wide leading-snug">{song.title}</h4>
          <p className="text-xs text-white/50 truncate mt-1 leading-none">{song.artist}</p>
        </div>
      </div>
      {onAddToQueue && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <SongRowOptions
            track={song}
            onPlayNext={onPlayNext}
            onAddToQueue={(track) => onAddToQueue(null as any, track)}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        </div>
      )}
    </div>
  );
}
