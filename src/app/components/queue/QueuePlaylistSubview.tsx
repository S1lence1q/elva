import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import type { Playlist, SearchResult } from './types';
import { QueueSongRow } from './QueueSongRow';

interface QueuePlaylistSubviewProps {
  playlist: Playlist;
  onPlayAll: () => void;
  onPlaySong: (song: SearchResult) => void;
  onAddToQueue?: (e: React.MouseEvent, song: SearchResult) => void;
}

export function QueuePlaylistSubview({
  playlist,
  onPlayAll,
  onPlaySong,
  onAddToQueue,
}: QueuePlaylistSubviewProps) {
  const tracks = playlist.tracks || [];

  return (
    <motion.div
      key="playlist-detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 text-left"
    >
      <div className="relative w-full h-44 overflow-hidden select-none shrink-0 bg-[#0c0c0f] border-b border-white/5 flex flex-col justify-end p-6">
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${playlist.color}`} />
        <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/30">Playlist</span>
        <h2
          className="text-2xl font-normal text-white mt-1 leading-tight truncate"
          style={{ fontFamily: '"Kaobe", serif' }}
        >
          {playlist.name}
        </h2>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={onPlayAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-white/95 rounded-full text-[10px] font-bold uppercase transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-black ml-0.5" />
            <span>Play All</span>
          </button>
          <span className="text-xs text-white/40">{tracks.length} songs</span>
        </div>
      </div>

      <div className="space-y-2 px-5">
        {tracks.map((track, idx) => (
          <QueueSongRow
            key={`plist-track-${track.id}-${idx}`}
            song={track}
            onPlay={() => onPlaySong(track)}
            onAddToQueue={onAddToQueue}
          />
        ))}
        {tracks.length === 0 && (
          <div className="py-12 text-center text-white/30 select-none">
            <p className="text-xs font-medium">This playlist is empty</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
