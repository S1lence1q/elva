import { motion } from 'motion/react';
import type { AccentColor } from '../themeUtils';
import { ACCENT_THEMES } from '../themeUtils';
import type { SearchResult, VerifiedArtist } from './types';
import { QueueSongRow } from './QueueSongRow';

interface QueueArtistSubviewProps {
  artist: VerifiedArtist;
  tracks: SearchResult[];
  accentColor: AccentColor;
  onPlaySong: (song: SearchResult) => void;
  onAddToQueue?: (e: React.MouseEvent, song: SearchResult) => void;
}

export function QueueArtistSubview({
  artist,
  tracks,
  accentColor,
  onPlaySong,
  onAddToQueue,
}: QueueArtistSubviewProps) {
  const theme = ACCENT_THEMES[accentColor];

  return (
    <motion.div
      key="artist-profile"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 text-left"
    >
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#121214]/85 via-[#0d0d0f]/50 to-black/30 backdrop-blur-2xl shadow-xl py-6 px-6 flex items-center gap-5 shrink-0">
        <div
          className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[45px] opacity-35 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--theme-primary) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl transition-transform duration-500 hover:scale-105 shrink-0 z-10 bg-neutral-900">
          <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover scale-105" />
        </div>
        <div className="flex flex-col text-left relative z-10 min-w-0 flex-1">
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-bold ${theme.text} bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider`}
          >
            ✦ Verified Artist
          </span>
          <h2
            className="text-3xl font-normal text-white mt-2 tracking-wide leading-none truncate"
            style={{ fontFamily: '"Kaobe", serif' }}
          >
            {artist.name}
          </h2>
          <p className="text-[9px] text-white/40 font-bold tracking-[0.15em] uppercase mt-2.5">
            Official Releases
          </p>
        </div>
      </div>

      <div className="space-y-2 px-5">
        {tracks.map((track) => (
          <QueueSongRow
            key={`artist-track-${track.id}`}
            song={track}
            onPlay={() => onPlaySong(track)}
            onAddToQueue={onAddToQueue}
          />
        ))}
      </div>
    </motion.div>
  );
}
