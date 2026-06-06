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
  onPlayNext?: (song: SearchResult) => void;
  onToggleFavorite?: (song: SearchResult) => void;
  favorites?: SearchResult[];
}

export function QueueArtistSubview({
  artist,
  tracks,
  accentColor,
  onPlaySong,
  onAddToQueue,
  onPlayNext,
  onToggleFavorite,
  favorites = [],
}: QueueArtistSubviewProps) {
  const theme = ACCENT_THEMES[accentColor];

  return (
    <div className="space-y-6 text-left">
      <div className="relative w-full rounded-3xl overflow-hidden bg-white/[0.04] py-6 px-6 flex items-center gap-5 shrink-0">
        <div className="relative w-24 h-24 rounded-full overflow-hidden transition-transform duration-500 hover:scale-105 shrink-0 z-10 bg-neutral-900">
          <img src={artist.thumbnail} alt={artist.name} className="w-full h-full object-cover scale-105" />
        </div>
        <div className="flex flex-col text-left relative z-10 min-w-0 flex-1">
          <span
            className={`inline-flex w-fit self-start items-center gap-1 text-[9px] font-bold ${theme.text} bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider shrink-0`}
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
        {tracks.map((track) => {
          const isFav = favorites.some((fav) => fav.id === track.id);
          return (
            <QueueSongRow
              key={`artist-track-${track.id}`}
              song={track}
              onPlay={() => onPlaySong(track)}
              onAddToQueue={onAddToQueue}
              onPlayNext={onPlayNext}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFav}
            />
          );
        })}
      </div>
    </div>
  );
}
