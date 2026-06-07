import { motion } from 'motion/react';
import { Play, Trash2, Heart } from 'lucide-react';
import { SearchResult } from '../../types';
import { SongRowOptions } from '../SongRowOptions';
import { ElvaEmptyState } from '../ElvaEmptyState';
import { strings } from '../../constants/strings';

interface FavoritesTabProps {
  favorites: SearchResult[];
  onSelectSong: (song: SearchResult) => void;
  onToggleFavorite: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  onPlayNext?: (song: SearchResult) => void;
}

export function FavoritesTab({
  favorites,
  onSelectSong,
  onToggleFavorite,
  onAddToQueue,
  onPlayNext
}: FavoritesTabProps) {
  return (
    <motion.div
      key="favorites"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header inside Favorites Tab */}
      <div className="flex items-center justify-between select-none">
        <h2 
          className="text-2xl font-normal text-white/95 tracking-wide leading-none" 
          style={{ fontFamily: '"Kaobe", serif' }}
        >
          {strings.profileHub.favoritesTitle}
        </h2>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
          {strings.profileHub.favoritesCount(favorites.length)}
        </span>
      </div>

      {favorites.length > 0 ? (
        <div className="flex flex-col gap-4.5">
          {favorites.map((song, idx) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="group flex items-center justify-between p-4 rounded-2xl elva-hub-row w-full"
            >
              {/* Left: Artwork + Title/Artist */}
              <div 
                onClick={() => onSelectSong(song)}
                className="flex items-center gap-4.5 truncate flex-1 mr-4 cursor-pointer"
              >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/5 bg-white/5">
                  <img 
                    src={song.thumbnail} 
                    alt={song.title} 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
                
                <div className="text-left truncate">
                  <h4 className="text-base font-semibold text-white/95 truncate tracking-wide leading-snug">
                    {song.title}
                  </h4>
                  <p className="text-sm text-white/50 truncate mt-1.5 font-medium leading-none">
                    {song.artist}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity select-none">
                <SongRowOptions
                  track={song}
                  onPlayNext={onPlayNext}
                  onAddToQueue={onAddToQueue}
                />
                <button
                  onClick={() => onToggleFavorite(song)}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] text-red-400 hover:text-white cursor-pointer transition-all hover:scale-105"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <ElvaEmptyState
          icon={<Heart className="w-8 h-8" />}
          title={strings.empty.favoritesTitle}
          description={strings.empty.favoritesDesc}
          action={{
            label: strings.empty.favoritesAction,
            onClick: () => window.dispatchEvent(new CustomEvent('elva-scroll-to-discover')),
          }}
        />
      )}
    </motion.div>
  );
}
