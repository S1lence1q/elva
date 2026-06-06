import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Play, Trash2, ListMusic, ChevronLeft, Search, Sparkles, Music, X } from 'lucide-react';
import { SearchResult } from '../../types';
import { AccentColor, ACCENT_THEMES } from '../themeUtils';
import { SongRowOptions } from '../SongRowOptions';
import { executeSearchAPI } from '../../utils/apiUtils';
import { showMiniHUD } from '../../utils/hudUtils';
import { ElvaEmptyState } from '../ElvaEmptyState';
import { strings } from '../../constants/strings';

interface Playlist {
  id: string;
  name: string;
  color: string;
  tracks: SearchResult[];
}

interface PlaylistsTabProps {
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;
  accentColor: AccentColor;
  onCreatePlaylist: (name: string, color: string) => void;
  onDeletePlaylist: (id: string, name: string) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onSelectSong: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  onPlayNext?: (song: SearchResult) => void;
  onAddTrackToPlaylist: (playlistId: string, track: SearchResult) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string, trackTitle: string) => void;
}

const PLAYLIST_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
];

export function PlaylistsTab({
  playlists,
  selectedPlaylistId,
  setSelectedPlaylistId,
  accentColor,
  onCreatePlaylist,
  onDeletePlaylist,
  onPlayPlaylist,
  onSelectSong,
  onAddToQueue,
  onPlayNext,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist
}: PlaylistsTabProps) {
  const theme = ACCENT_THEMES[accentColor];

  // Local States for creating playlist
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Local States for inline search in detailed view
  const [inlineQuery, setInlineQuery] = useState('');
  const [inlineResults, setInlineResults] = useState<SearchResult[]>([]);
  const [isSearchingInline, setIsSearchingInline] = useState(false);

  const handleInlineSearch = async (queryStr: string) => {
    if (!queryStr.trim()) {
      setInlineResults([]);
      return;
    }
    setIsSearchingInline(true);
    try {
      const results = await executeSearchAPI(queryStr, 8);
      setInlineResults(results);
    } catch (e) {
      console.error('Inline playlist search failed:', e);
      showMiniHUD('Failed to fetch search results', 'error');
    } finally {
      setIsSearchingInline(false);
    }
  };

  const submitCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName, PLAYLIST_COLORS[selectedColorIndex]);
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };

  return (
    <motion.div
      key="playlists"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {selectedPlaylistId ? (
        // Detailed subview
        (() => {
          const playlist = playlists.find(p => p.id === selectedPlaylistId);
          if (!playlist) {
            setSelectedPlaylistId(null);
            return null;
          }
          return (
            <div className="space-y-8 animate-in fade-in duration-300 text-left">
              {/* Back button */}
              <button
                onClick={() => {
                  setSelectedPlaylistId(null);
                  setInlineQuery('');
                  setInlineResults([]);
                }}
                className="flex items-center gap-1.5 text-white/50 hover:text-white transition-all cursor-pointer select-none text-xs font-semibold py-1 px-3 rounded-full hover:bg-white/5 -ml-3"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{strings.profileHub.backToPlaylists}</span>
              </button>

              {/* Header Card */}
              <div className="relative w-full rounded-3xl overflow-hidden elva-hub-card py-5 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className={`absolute -top-12 -left-12 w-28 h-28 rounded-full bg-gradient-to-tr ${playlist.color} blur-3xl opacity-20`} />
                
                <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${playlist.color} flex items-center justify-center shadow-lg border border-white/10 shrink-0`}>
                    <ListMusic className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left truncate">
                    <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-white/30">Playlist</span>
                    <h2 className="text-2xl font-bold text-white tracking-wide mt-1 truncate">{playlist.name}</h2>
                    <span className="text-[10px] text-white/40 mt-0.5 block tracking-wider uppercase font-semibold">
                      {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 shrink-0 select-none">
                  <button
                    onClick={() => onPlayPlaylist(playlist)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/95 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Play All</span>
                  </button>
                  <button
                    onClick={() => {
                      onDeletePlaylist(playlist.id, playlist.name);
                      setSelectedPlaylistId(null);
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all cursor-pointer"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Track List */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-white/45 font-bold uppercase tracking-wider pl-1">Songs in playlist</span>
                
                {playlist.tracks.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {playlist.tracks.map((song, idx) => (
                      <motion.div
                        key={`${playlist.id}-track-${song.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="group flex items-center justify-between p-3.5 rounded-2xl elva-hub-row border-0 w-full"
                      >
                        <div 
                          onClick={() => onSelectSong(song)}
                          className="flex items-center gap-4 truncate flex-1 mr-4 cursor-pointer"
                        >
                          <div className="relative w-13 h-13 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/5 bg-white/5">
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
                            <h4 className="text-[15px] font-semibold text-white/95 truncate tracking-wide leading-tight group-hover:text-white transition-colors">{song.title}</h4>
                            <p className="text-[13px] text-white/60 mt-1 truncate">{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity select-none">
                          <SongRowOptions
                            track={song}
                            onPlayNext={onPlayNext}
                            onAddToQueue={onAddToQueue}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveTrackFromPlaylist(playlist.id, song.id, song.title);
                            }}
                            className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-red-400 cursor-pointer transition-all hover:scale-105"
                            title="Delete from playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <ElvaEmptyState
                    icon={<Music className="w-7 h-7" />}
                    title={strings.empty.playlistEmptyTitle}
                    description={strings.empty.playlistEmptyDesc}
                  />
                )}
              </div>

              {/* Search and Add */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 select-none pl-1">
                  <Sparkles className="w-4 h-4 text-white/30 animate-pulse" />
                  <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Add tracks directly</h3>
                </div>

                <div className="flex gap-3 max-w-xl text-left">
                  <div className="relative group flex-1">
                    <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/50 transition-colors" />
                    <input
                      type="text"
                      value={inlineQuery}
                      onChange={(e) => setInlineQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleInlineSearch(inlineQuery);
                      }}
                      placeholder="Search songs to add..."
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl elva-input border border-white/[0.08] text-white/90 placeholder-white/20 text-sm focus:outline-none focus:border-white/20 focus:bg-[#13141b]/70 transition-all duration-300 backdrop-blur-xl"
                    />
                  </div>
                  <button
                    onClick={() => handleInlineSearch(inlineQuery)}
                    className="px-6 rounded-2xl bg-white hover:bg-white/90 text-black border border-transparent text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md select-none shrink-0"
                  >
                    Search
                  </button>
                </div>

                {/* Inline search results list */}
                <AnimatePresence>
                  {isSearchingInline && (
                    <div className="text-left py-6 text-white/45 text-xs flex items-center gap-2.5 select-none pl-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-3.5 h-3.5 border border-white/20 border-t-white/50 rounded-full"
                      />
                      <span>Searching YouTube...</span>
                    </div>
                  )}

                  {!isSearchingInline && inlineResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-none mt-2"
                    >
                      {inlineResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 rounded-2xl elva-hub-row border-0 group"
                        >
                          <div className="flex items-center gap-3 truncate mr-4 text-left">
                            <img
                              src={result.thumbnail}
                              alt={result.title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://img.youtube.com/vi/${result.videoId}/mqdefault.jpg`;
                              }}
                              className="w-10 h-10 object-cover rounded-lg shadow-md border border-white/5 shrink-0"
                            />
                            <div className="truncate">
                              <h5 className="text-xs font-semibold text-white/95 truncate tracking-wide leading-tight">{result.title}</h5>
                              <p className="text-[10px] text-white/40 truncate mt-0.5 font-medium">{result.artist}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onAddTrackToPlaylist(playlist.id, result);
                              setInlineQuery('');
                              setInlineResults([]);
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white text-white hover:text-black border border-white/5 transition-all cursor-pointer shrink-0 select-none shadow-sm"
                            title="Add to playlist"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })()
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between select-none">
            <h2 
              className="text-2xl font-normal text-white/95 tracking-wide leading-none" 
              style={{ fontFamily: '"Kaobe", serif' }}
            >
              {strings.profileHub.playlistsTitle}
            </h2>
            <button
              onClick={() => setIsCreatingPlaylist((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/25 text-xs font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{strings.profileHub.createNew}</span>
            </button>
          </div>

          {/* Create Playlist Form */}
          <AnimatePresence>
            {isCreatingPlaylist && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-3xl elva-hub-card p-5 overflow-hidden text-left"
              >
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs uppercase tracking-widest font-semibold text-white/70">Create new playlist</h4>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Playlist name..."
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className="flex-1 bg-[#050608]/85 border border-white/[0.08] focus:border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all duration-300 font-light backdrop-blur-xl"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      {PLAYLIST_COLORS.map((col, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColorIndex(idx)}
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${col} border-2 transition-all ${
                            selectedColorIndex === idx ? 'border-white scale-110' : 'border-transparent opacity-75'
                          } cursor-pointer`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end mt-2 select-none">
                    <button
                      onClick={() => setIsCreatingPlaylist(false)}
                      className="px-4 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer font-semibold uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitCreatePlaylist}
                      className="px-4 py-2 rounded-xl text-xs text-black bg-white hover:bg-white/95 transition-all cursor-pointer font-bold uppercase"
                    >
                      Save Playlist
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  className="group relative rounded-3xl elva-hub-card hover:bg-white/[0.05] p-6.5 flex flex-col justify-between h-[160px] overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.99]"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${playlist.color}`} />

                  <div className="space-y-1.5 relative z-10 text-left select-none">
                    <h4 className="text-lg font-bold text-white/95 leading-tight truncate tracking-wide">{playlist.name}</h4>
                    <p className="text-[11px] font-semibold text-white/40 tracking-wider uppercase">
                      {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center relative z-10 select-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlaylist(playlist.id, playlist.name);
                      }}
                      className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPlaylist(playlist);
                      }}
                      className="p-3.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/10 hover:scale-105 transition-all cursor-pointer shadow-md"
                      title="Play playlist"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ElvaEmptyState
              icon={<ListMusic className="w-8 h-8" />}
              title={strings.empty.noPlaylistsTitle}
              description={strings.empty.noPlaylistsDesc}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
