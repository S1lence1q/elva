import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Heart, ListMusic, BarChart2, Plus, Play, Trash2, Edit2, Check, Award, Clock } from 'lucide-react';
import { SearchResult } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { toast } from 'sonner';

interface Playlist {
  id: string;
  name: string;
  color: string;
  tracks: SearchResult[];
}

interface PlayCountRecord {
  [songId: string]: {
    title: string;
    artist: string;
    count: number;
    lastPlayed: number;
  };
}

interface ProfileHubViewProps {
  favorites: SearchResult[];
  onToggleFavorite: (song: SearchResult) => void;
  onSelectSong: (song: SearchResult) => void;
  onAddToQueue: (song: SearchResult) => void;
  accentColor: AccentColor;
}

const PLAYLIST_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
];

const AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=120&h=120&fit=crop&crop=face',
];

const ACTIVE_TAB_STYLES: Record<AccentColor, { border: string; glow: string; text: string }> = {
  emerald: {
    border: 'border-emerald-500/25',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.12)]',
    text: 'text-emerald-300',
  },
  sand: {
    border: 'border-amber-500/25',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.12)]',
    text: 'text-amber-200',
  },
  wine: {
    border: 'border-rose-500/25',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.12)]',
    text: 'text-rose-300',
  },
  navy: {
    border: 'border-indigo-500/25',
    glow: 'shadow-[0_0_15px_rgba(99,102,241,0.12)]',
    text: 'text-slate-300',
  },
};

export const ProfileHubView: React.FC<ProfileHubViewProps> = ({
  favorites,
  onToggleFavorite,
  onSelectSong,
  onAddToQueue,
  accentColor,
}) => {
  const theme = ACCENT_THEMES[accentColor];
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'playlists' | 'stats'>('profile');

  // Profile States
  const [username, setUsername] = useState(() => {
    const stored = localStorage.getItem('elva_profile_name') || 'Music Lover';
    return stored.slice(0, 20);
  });
  const [avatar, setAvatar] = useState(() => localStorage.getItem('elva_profile_avatar') || AVATARS[0]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(username);

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const stored = localStorage.getItem('elva_playlists');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Statistics State
  const [playCounts, setPlayCounts] = useState<PlayCountRecord>(() => {
    try {
      const stored = localStorage.getItem('elva_play_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [weeklyStats, setWeeklyStats] = useState<{ day: string; min: number }[]>(() => {
    try {
      const stored = localStorage.getItem('elva_weekly_time');
      if (stored) return JSON.parse(stored);
    } catch {}
    
    // Fallback/Initial values if empty
    return [
      { day: 'Mon', min: 12 },
      { day: 'Tue', min: 45 },
      { day: 'Wed', min: 25 },
      { day: 'Thu', min: 60 },
      { day: 'Fri', min: 85 },
      { day: 'Sat', min: 110 },
      { day: 'Sun', min: 50 },
    ];
  });

  useEffect(() => {
    // Keep weekly stats in sync with local storage if updated
    const handleStorageChange = () => {
      try {
        const storedCounts = localStorage.getItem('elva_play_counts');
        if (storedCounts) setPlayCounts(JSON.parse(storedCounts));
        const storedWeekly = localStorage.getItem('elva_weekly_time');
        if (storedWeekly) setWeeklyStats(JSON.parse(storedWeekly));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom trigger for immediate updates in single window context
    window.addEventListener('elva-stats-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('elva-stats-updated', handleStorageChange);
    };
  }, []);

  // Save profile name
  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      const limited = trimmed.slice(0, 20);
      setUsername(limited);
      localStorage.setItem('elva_profile_name', limited);
      setIsEditingName(false);
      toast.success('Profile name updated');
    }
  };

  // Save profile avatar
  const handleSelectAvatar = (url: string) => {
    setAvatar(url);
    localStorage.setItem('elva_profile_avatar', url);
    toast.success('Avatar updated');
  };

  // Create Playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      color: PLAYLIST_COLORS[selectedColorIndex],
      tracks: [],
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    localStorage.setItem('elva_playlists', JSON.stringify(updated));
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
    toast.success(`Playlist "${newPlaylistName}" created!`);
  };

  // Delete Playlist
  const handleDeletePlaylist = (id: string, name: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    localStorage.setItem('elva_playlists', JSON.stringify(updated));
    toast.info(`Playlist "${name}" was deleted`);
  };

  // Play entire playlist
  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) {
      toast.error('Playlist is empty', {
        description: 'Search for songs and add them from the queue or player.',
      });
      return;
    }
    onSelectSong(playlist.tracks[0]);
    playlist.tracks.slice(1).forEach((t) => onAddToQueue(t));
    toast.success(`Playing playlist: ${playlist.name}`);
  };

  // Derived listening vibe
  const musicPersonality = React.useMemo(() => {
    const counts = Object.values(playCounts);
    if (counts.length === 0) return 'Quiet Music Explorer';
    
    // Simple heuristic to detect favorite vibe
    let isRapEnthusiast = 0;
    let isAmbientDreamer = 0;
    let isPopLover = 0;

    counts.forEach((c) => {
      const art = c.artist.toLowerCase();
      if (['lamin', 'kesi', 'kundo', 'artig', 'rap', 'hip-hop'].some(w => art.includes(w))) {
        isRapEnthusiast += c.count;
      } else if (['lofi', 'satie', 'ambient', 'sleep', 'relax'].some(w => art.includes(w))) {
        isAmbientDreamer += c.count;
      } else {
        isPopLover += c.count;
      }
    });

    if (isRapEnthusiast >= isAmbientDreamer && isRapEnthusiast >= isPopLover) {
      return 'Danish Hiphop Enthusiast 🎤';
    }
    if (isAmbientDreamer >= isRapEnthusiast && isAmbientDreamer >= isPopLover) {
      return 'Atmospheric Sound Dreamer 🌌';
    }
    return 'Modern Pop & Vibe Explorer 🧭';
  }, [playCounts]);

  // Derived top tracks for Recharts/Stats
  const statsTopSongs = React.useMemo(() => {
    const counts = Object.entries(playCounts).map(([id, data]) => ({
      name: data.title.length > 20 ? `${data.title.substring(0, 18)}...` : data.title,
      Plays: data.count,
    }));
    return counts.sort((a, b) => b.Plays - a.Plays).slice(0, 4);
  }, [playCounts]);

  // Derived top genres
  const genrePieData = React.useMemo(() => {
    let rap = 10;
    let ambient = 5;
    let pop = 15;

    Object.values(playCounts).forEach((c) => {
      const art = c.artist.toLowerCase();
      if (['lamin', 'kesi', 'kundo', 'artig'].some(w => art.includes(w))) {
        rap += c.count * 3;
      } else if (['lofi', 'satie', 'ambient'].some(w => art.includes(w))) {
        ambient += c.count * 3;
      } else {
        pop += c.count * 2;
      }
    });

    return [
      { name: 'Hip-Hop/Rap', value: rap, color: '#f59e0b' },
      { name: 'Lo-Fi / Ambient', value: ambient, color: '#10b981' },
      { name: 'Pop & Electronica', value: pop, color: '#6366f1' },
    ];
  }, [playCounts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-[898px] relative z-10 flex flex-col gap-6 px-6 pb-24 overflow-y-auto flex-1 scrollbar-none cursor-default"
    >

      {/* Internal Subtabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md w-full shrink-0">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'favorites', label: 'Favorites', icon: Heart },
          { id: 'playlists', label: 'Playlists', icon: ListMusic },
          { id: 'stats', label: 'Statistics', icon: BarChart2 },
        ].map((sub) => {
          const isSubActive = activeTab === sub.id;
          const SubIcon = sub.icon;
          const activeStyle = ACTIVE_TAB_STYLES[accentColor];
          return (
            <button
              key={sub.id}
              onClick={() => setActiveTab(sub.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                isSubActive
                  ? `bg-[#09090c]/85 border ${activeStyle.border} ${activeStyle.text} ${activeStyle.glow} shadow-black/40`
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.01] border border-transparent'
              }`}
            >
              <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? theme.text : 'text-current'}`} />
              <span className="hidden sm:inline">{sub.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-[350px]">
        <AnimatePresence mode="wait">
          {/* PROFILE SUBTAB */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              <div className="rounded-3xl border border-white/10 bg-[#0f0f12]/80 backdrop-blur-xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl">
                <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full ${theme.bgFade} blur-3xl opacity-35`} />

                {/* Avatar area */}
                <div className="flex flex-col items-center gap-4 relative z-10 shrink-0">
                  <div className={`w-28 h-28 rounded-full overflow-hidden p-1 border border-white/15 bg-gradient-to-tr ${theme.borderT} shadow-xl`}>
                    <img src={avatar} alt="User avatar" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="flex gap-1.5 justify-center">
                    {AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectAvatar(av)}
                        className={`w-6 h-6 rounded-full overflow-hidden border border-white/10 hover:border-white/40 transition-all ${
                          avatar === av ? 'scale-110 border-white' : 'opacity-70 hover:opacity-100'
                        } cursor-pointer`}
                      >
                        <img src={av} alt="option" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile info details */}
                <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-4 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/30">Personal Hub</span>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            maxLength={20}
                            className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1 text-base focus:outline-none focus:border-white/30 font-medium"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl font-semibold text-white/95 tracking-tight truncate max-w-[220px] sm:max-w-[320px]" title={username}>
                            {username}
                          </h2>
                          <button
                            onClick={() => {
                              setTempName(username);
                              setIsEditingName(true);
                            }}
                            className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all cursor-pointer"
                            title="Edit name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                      <Award className={`w-4 h-4 ${theme.text}`} />
                      <div className="text-left">
                        <p className="text-[9px] uppercase tracking-wider text-white/30 leading-none">Listening Vibe</p>
                        <p className="text-xs font-semibold text-white/80 mt-1">{musicPersonality}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                      <Clock className={`w-4 h-4 ${theme.text}`} />
                      <div className="text-left">
                        <p className="text-[9px] uppercase tracking-wider text-white/30 leading-none">Listening Time</p>
                        <p className="text-xs font-semibold text-white/80 mt-1">
                          {Object.values(playCounts).reduce((acc, c) => acc + c.count * 3, 0)} min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* FAVORITES SUBTAB */}
          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/40">Your Favorite Songs ({favorites.length})</h3>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favorites.map((song, idx) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex items-center justify-between p-3 rounded-2xl bg-[#0f0f12]/50 hover:bg-[#0f0f12]/80 border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-lg"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0">
                          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                          <button
                            onClick={() => onSelectSong(song)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                          >
                            <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
                          </button>
                        </div>
                        <div className="max-w-[180px] sm:max-w-[200px]">
                          <h4 className="text-sm font-medium text-white/90 leading-snug truncate">{song.title}</h4>
                          <p className="text-[11px] text-white/40 mt-0.5 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onToggleFavorite(song)}
                          className="p-2 rounded-xl hover:bg-white/5 text-red-500 hover:text-white cursor-pointer transition-all"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/5 bg-[#0f0f12]/30 p-12 text-center flex flex-col items-center justify-center">
                  <Heart className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm font-medium">No favorite songs yet</p>
                  <p className="text-white/30 text-xs mt-1.5 font-light max-w-[280px]">Use the heart icon during playback or in search results to save your favorites.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* PLAYLISTS SUBTAB */}
          {activeTab === 'playlists' && (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.25em] font-semibold text-white/40">Your Playlists ({playlists.length})</h3>
                <button
                  onClick={() => setIsCreatingPlaylist((prev) => !prev)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/25 text-xs font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New</span>
                </button>
              </div>

              {/* Create Playlist Modal Form */}
              <AnimatePresence>
                {isCreatingPlaylist && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 overflow-hidden"
                  >
                    <div className="flex flex-col gap-4">
                      <h4 className="text-xs uppercase tracking-widest font-semibold text-white/70">Create new playlist</h4>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <input
                          type="text"
                          placeholder="Playlist name..."
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/20 font-light"
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

                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          onClick={() => setIsCreatingPlaylist(false)}
                          className="px-4 py-2 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer font-semibold uppercase"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreatePlaylist}
                          className={`px-4 py-2 rounded-xl text-xs text-black bg-white hover:bg-white/95 transition-all cursor-pointer font-bold uppercase`}
                        >
                          Save Playlist
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {playlists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="group relative rounded-3xl border border-white/[0.05] bg-[#0f0f12]/50 p-6 flex flex-col justify-between h-[150px] shadow-lg overflow-hidden"
                    >
                      {/* Gradient card top edge */}
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${playlist.color}`} />

                      <div className="space-y-1 relative z-10">
                        <h4 className="text-base font-semibold text-white/95 leading-none">{playlist.name}</h4>
                        <p className="text-[10px] font-light text-white/40 tracking-wider uppercase mt-1">
                          {playlist.tracks.length} songs
                        </p>
                      </div>

                      <div className="flex justify-between items-center relative z-10">
                        <button
                          onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                          className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePlayPlaylist(playlist)}
                          className={`p-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/10 hover:scale-105 transition-all cursor-pointer`}
                          title="Play playlist"
                        >
                          <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/5 bg-[#0f0f12]/30 p-12 text-center flex flex-col items-center justify-center">
                  <ListMusic className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm font-medium">No playlists yet</p>
                  <p className="text-white/30 text-xs mt-1.5 font-light max-w-[280px]">Click on "Create New" to start your first collection, and add songs along the way.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* STATISTICS SUBTAB */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Daily / Weekly listening curve */}
              <div className="rounded-3xl border border-white/10 bg-[#0f0f12]/50 p-6 shadow-2xl">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-6">Weekly Listening Activity (Minutes)</h4>
                
                <div className="w-full h-[180px] text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyStats} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="blueprintGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dc2626" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#581c87" stopOpacity={0.15} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.25)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.25)" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(15,15,18,0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '12px', 
                          color: '#fff',
                          backdropFilter: 'blur(16px)'
                        }} 
                      />
                      <Bar dataKey="min" fill="url(#blueprintGradient)" radius={[3, 3, 0, 0]} barSize={6} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grid: Top tracks & Genre breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Top tracks list */}
                <div className="rounded-3xl border border-white/10 bg-[#0f0f12]/50 p-6 shadow-2xl">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-6">Most Played Songs</h4>
                  
                  {statsTopSongs.length > 0 ? (
                    <div className="w-full h-[160px] text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsTopSongs} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} width={100} />
                          <Tooltip
                            contentStyle={{ 
                              background: 'rgba(15,15,18,0.85)', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              borderRadius: '12px', 
                              color: '#fff',
                              backdropFilter: 'blur(16px)'
                            }} 
                          />
                          <Bar dataKey="Plays" fill="var(--theme-secondary, #6366f1)" radius={[0, 4, 4, 0]} barSize={10} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[160px] flex items-center justify-center text-white/20 text-xs">
                      Play music to gather statistics
                    </div>
                  )}
                </div>

                {/* Genre breakdown Donut */}
                <div className="rounded-3xl border border-white/10 bg-[#0f0f12]/50 p-6 shadow-2xl flex flex-col justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">Top Listening Genres</h4>
                  
                  <div className="flex items-center justify-around h-[140px] relative">
                    <div className="w-[120px] h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genrePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={50}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {genrePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legends info */}
                    <div className="flex flex-col gap-2.5 text-[10px]">
                      {genrePieData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium text-white/60">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
