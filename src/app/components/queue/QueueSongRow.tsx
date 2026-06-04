import { Play, Plus } from 'lucide-react';
import type { SearchResult } from './types';

interface QueueSongRowProps {
  song: SearchResult;
  onPlay: () => void;
  onAddToQueue?: (e: React.MouseEvent, song: SearchResult) => void;
  rowKey?: string;
}

/** Standard vertical song row used across queue subviews. */
export function QueueSongRow({ song, onPlay, onAddToQueue, rowKey }: QueueSongRowProps) {
  return (
    <div
      key={rowKey}
      onClick={onPlay}
      className="group w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] border-0 transition-colors duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-3.5 truncate mr-3 flex-1">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-white/5">
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
        <div className="text-left truncate">
          <h4 className="text-sm font-semibold text-white/95 truncate tracking-wide leading-snug">{song.title}</h4>
          <p className="text-xs text-white/50 truncate mt-1 leading-none">{song.artist}</p>
        </div>
      </div>
      {onAddToQueue && (
        <button
          onClick={(e) => onAddToQueue(e, song)}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white cursor-pointer hover:scale-105 active:scale-95 transition-all"
          title="Add to queue"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
