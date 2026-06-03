import type { AccentColor } from '../themeUtils';
import { ACCENT_THEMES } from '../themeUtils';
import type { SearchResult, VerifiedArtist } from './types';
import { QueueSongRow } from './QueueSongRow';
import { ARTIST_PROFILE_BADGE } from '../../constants/artistUi';

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
    <div className="space-y-6 text-left">
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0a0b10]/65 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.5)] py-6 px-6 flex items-center gap-5 shrink-0">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl transition-transform duration-500 hover:scale-105 shrink-0 z-10 bg-neutral-900">
          <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover scale-105" />
        </div>
        <div className="flex flex-col text-left relative z-10 min-w-0 flex-1">
          <span
            className={`inline-flex w-fit self-start items-center gap-1 text-[9px] font-bold ${theme.text} bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase tracking-wider shrink-0`}
          >
            ✦ {ARTIST_PROFILE_BADGE}
          </span>
          <h2
            className="text-3xl font-normal text-white mt-2 tracking-wide leading-none truncate"
            style={{ fontFamily: '"Kaobe", serif' }}
          >
            {artist.name}
          </h2>
          {tracks.length > 0 && (
            <p className="text-[9px] text-white/40 font-bold tracking-[0.15em] uppercase mt-2.5">
              {tracks.length} tracks
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {tracks.map((track) => (
          <QueueSongRow
            key={`artist-track-${track.id}`}
            song={track}
            onPlay={() => onPlaySong(track)}
            onAddToQueue={onAddToQueue}
          />
        ))}
      </div>
    </div>
  );
}
