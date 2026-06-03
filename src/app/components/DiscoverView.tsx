import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, Compass, Flame, Heart, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { SearchResult } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { Playlist } from './PlaylistDetailsView';
import { SongRowOptions } from './SongRowOptions';
import { fetchAppleMusicChart } from '../utils/chartFeeds';

import topHitsDenmark from '../../top_hits_denmark.png';
import topHitsGlobal from '../../top_hits_global.png';

interface DiscoverViewProps {
  onSelectSong: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  onPlayPlaylist: (tracks: SearchResult[], label?: string) => void;
  onPlayNext?: (song: SearchResult) => void;
  accentColor: AccentColor;
  favorites: SearchResult[];
  onToggleFavorite: (song: SearchResult) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onSelectSong,
  onAddToQueue,
  onPlayPlaylist,
  onPlayNext,
  accentColor,
  favorites,
  onToggleFavorite,
  onSelectPlaylist
}) => {
  const theme = ACCENT_THEMES[accentColor];

  const [dkHits, setDkHits] = useState<SearchResult[]>([]);
  const [globalHits, setGlobalHits] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dkError, setDkError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [dkFromCache, setDkFromCache] = useState(false);
  const [globalFromCache, setGlobalFromCache] = useState(false);

  const loadCharts = useCallback(async () => {
    setIsLoading(true);
    const [dk, global] = await Promise.all([
      fetchAppleMusicChart('dk'),
      fetchAppleMusicChart('us'),
    ]);
    setDkHits(dk.tracks);
    setGlobalHits(global.tracks);
    setDkError(dk.error ?? (dk.tracks.length === 0 ? 'Chart unavailable' : null));
    setGlobalError(global.error ?? (global.tracks.length === 0 ? 'Chart unavailable' : null));
    setDkFromCache(dk.fromCache);
    setGlobalFromCache(global.fromCache);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadCharts();
  }, [loadCharts]);

  const handlePlayChart = (e: React.MouseEvent, name: string, tracks: SearchResult[]) => {
    e.stopPropagation();
    if (tracks.length === 0) return;
    onPlayPlaylist(tracks, name);
  };

  const isFavorite = (songId: string) => favorites.some((fav) => fav.id === songId);

  const playlistsConfig: Playlist[] = [
    {
      id: 'dk_hits',
      name: 'Top Hits: Denmark',
      description: 'The most popular tracks in Denmark right now (Apple Music).',
      tracks: dkHits,
      thumbnail: topHitsDenmark,
      accent: 'wine',
    },
    {
      id: 'global_hits',
      name: 'Top Hits: Global',
      description: 'The biggest tracks from charts around the world (Apple Music).',
      tracks: globalHits,
      thumbnail: topHitsGlobal,
      accent: 'navy',
    },
  ];

  const trendingList = dkHits.slice(0, 4);
  const dailyPicks = globalHits.slice(0, 4);

  const ChartLoadError = ({
    message,
    onRetry,
  }: {
    message: string;
    onRetry: () => void;
  }) => (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col gap-4 h-[190px] justify-center">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-white/80 font-medium">Chart could not load</p>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-[898px] relative z-10 flex flex-col gap-10 px-6 pt-4 pb-24"
    >
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Compass className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">
              Featured Charts
            </h3>
          </div>
          {!isLoading && (dkFromCache || globalFromCache) && (
            <span className="text-[9px] uppercase tracking-wider text-white/35">Cached chart data</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-white/[0.07] p-7 bg-[#0e0f14]/94 h-[190px] flex flex-col justify-between animate-pulse shadow-[0_12px_36px_rgba(0,0,0,0.55)]"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-[60%]" />
                  <div className="h-3 bg-white/5 rounded w-[85%]" />
                </div>
              </div>
            ))
          ) : (
            <>
              {dkHits.length > 0 ? (
                <ChartCard
                  chart={playlistsConfig[0]}
                  idx={0}
                  onSelectPlaylist={onSelectPlaylist}
                  onPlayChart={handlePlayChart}
                />
              ) : (
                <ChartLoadError message={dkError ?? 'Unknown error'} onRetry={() => void loadCharts()} />
              )}

              {globalHits.length > 0 ? (
                <ChartCard
                  chart={playlistsConfig[1]}
                  idx={1}
                  onSelectPlaylist={onSelectPlaylist}
                  onPlayChart={handlePlayChart}
                />
              ) : (
                <ChartLoadError
                  message={globalError ?? 'Unknown error'}
                  onRetry={() => void loadCharts()}
                />
              )}
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Trending Now</h3>
          </div>
          <div className="space-y-3.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#13141b]/20 border border-white/[0.04] h-[74px] animate-pulse"
                />
              ))
            ) : trendingList.length > 0 ? (
              trendingList.map((song, idx) => (
                <SongRow
                  key={song.id}
                  song={song}
                  idx={idx}
                  direction="left"
                  onSelectSong={onSelectSong}
                  onPlayNext={onPlayNext}
                  onAddToQueue={onAddToQueue}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={isFavorite(song.id)}
                />
              ))
            ) : (
              <p className="text-xs text-white/35 py-6 text-center">Chart data unavailable</p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/55">Daily Picks</h3>
          </div>
          <div className="space-y-3.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#13141b]/20 border border-white/[0.04] h-[74px] animate-pulse"
                />
              ))
            ) : dailyPicks.length > 0 ? (
              dailyPicks.map((song, idx) => (
                <SongRow
                  key={song.id}
                  song={song}
                  idx={idx}
                  direction="right"
                  onSelectSong={onSelectSong}
                  onPlayNext={onPlayNext}
                  onAddToQueue={onAddToQueue}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={isFavorite(song.id)}
                />
              ))
            ) : (
              <p className="text-xs text-white/35 py-6 text-center">Chart data unavailable</p>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

function ChartCard({
  chart,
  idx,
  onSelectPlaylist,
  onPlayChart,
}: {
  chart: Playlist;
  idx: number;
  onSelectPlaylist: (playlist: Playlist) => void;
  onPlayChart: (e: React.MouseEvent, name: string, tracks: SearchResult[]) => void;
}) {
  return (
    <motion.div
      key={chart.id}
      onClick={() => onSelectPlaylist(chart)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1, ease: 'easeOut' }}
      whileHover={{
        y: -6,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: '#121319',
      }}
      className="relative rounded-3xl border border-white/[0.07] p-7 flex items-center justify-between bg-[#0e0f14]/94 h-[190px] group transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.55)] select-none cursor-pointer text-left overflow-hidden gap-6"
    >
      <div className="flex flex-col justify-between h-full flex-1 min-w-0">
        <div className="space-y-2">
          <span
            className={`text-[10px] font-bold tracking-[0.35em] uppercase ${
              chart.id === 'dk_hits' ? 'text-rose-400' : 'text-indigo-400'
            }`}
          >
            Live Chart
          </span>
          <p className="text-sm font-normal text-white/70 leading-relaxed line-clamp-3 pr-2">
            {chart.description}
          </p>
        </div>
        <div className="flex items-center gap-3.5 relative z-10">
          <button
            type="button"
            onClick={(e) => onPlayChart(e, chart.name, chart.tracks)}
            className="p-3 rounded-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 group-hover:scale-105 shadow-xl transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </button>
          <span className="text-[9px] font-semibold text-white/30 uppercase tracking-widest">
            {chart.tracks.length} tracks
          </span>
        </div>
      </div>
      <div className="w-[126px] h-[126px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl relative select-none shrink-0 group-hover:border-white/20 transition-all duration-500 bg-neutral-950 flex items-center justify-center">
        <img
          src={chart.thumbnail}
          alt={chart.name}
          className="w-full h-full object-cover scale-102 group-hover:scale-105 transition-transform duration-700"
        />
        <div
          className={`absolute bottom-0 left-0 right-0 py-2.5 text-center z-20 ${
            chart.id === 'dk_hits'
              ? 'bg-[#881337] text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border-t border-rose-950'
              : 'bg-[#1e1b4b] text-indigo-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] border-t border-indigo-950'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.16em] leading-none select-none block">
            {chart.id === 'dk_hits' ? 'TOP HITS DK' : 'TOP HITS GLOBAL'}
          </span>
        </div>
        {chart.tracks.length > 0 && (
          <div className="absolute w-[52px] h-[52px] rounded-lg overflow-hidden border border-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.85)] z-10 rotate-[-4deg] group-hover:rotate-[2deg] group-hover:scale-105 transition-all duration-500 bg-neutral-900 -translate-y-3">
            <img src={chart.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SongRow({
  song,
  idx,
  direction,
  onSelectSong,
  onPlayNext,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
}: {
  song: SearchResult;
  idx: number;
  direction: 'left' | 'right';
  onSelectSong: (song: SearchResult) => void;
  onPlayNext?: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  onToggleFavorite: (song: SearchResult) => void;
  isFavorite: boolean;
}) {
  return (
    <motion.div
      onClick={() => onSelectSong(song)}
      initial={{ opacity: 0, x: direction === 'left' ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.08 }}
      className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#13141b]/35 hover:bg-[#181a23]/60 border border-white/[0.04] hover:border-white/[0.09] transition-all duration-300 shadow-sm cursor-pointer"
    >
      <div className="flex items-center gap-4 text-left min-w-0">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-md shrink-0 bg-neutral-900 border border-white/5">
          {song.thumbnail ? (
            <img
              src={song.thumbnail}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-white/5" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="text-[15px] font-semibold text-white/95 leading-snug truncate group-hover:text-white transition-colors">
            {song.title}
          </h4>
          <p className="text-[13px] text-white/60 mt-1 truncate">{song.artist}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity select-none">
        <SongRowOptions track={song} onPlayNext={onPlayNext} onAddToQueue={onAddToQueue} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(song);
          }}
          className="p-2.5 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-red-500' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
}
