import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Heart, ListMusic, Plus, Play, Trash2, Edit2, Check, Award, Clock, X, Music, History, Sparkles, ChevronLeft, Search } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { getPrimaryArtist } from '../utils/stringUtils';
import { showMiniHUD } from '../utils/hudUtils';
import { executeSearchAPI, getHandPickedImage } from '../utils/apiUtils';
import { SongRowOptions } from './SongRowOptions';

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
  onSelectArtist?: (artist: VerifiedArtist | null) => void;
  onPlayNext?: (song: SearchResult) => void;
}

const PLAYLIST_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-600',
];

const PRESET_GRADIENTS = [
  'from-amber-400 via-rose-500 to-indigo-600',
  'from-emerald-400 via-cyan-500 to-blue-600',
  'from-slate-800 via-neutral-900 to-zinc-700',
  'from-pink-400 via-purple-500 to-indigo-500',
  'from-teal-400 via-slate-500 to-amber-200'
];

const ACTIVE_TAB_STYLES: Record<AccentColor, { border: string; glow: string; text: string }> = {
  emerald: {
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]',
    text: 'text-emerald-300',
  },
  sand: {
    border: 'border-amber-500/20',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
    text: 'text-amber-200',
  },
  wine: {
    border: 'border-rose-500/20',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.08)]',
    text: 'text-rose-300',
  },
  navy: {
    border: 'border-indigo-500/20',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.08)]',
    text: 'text-slate-300',
  },
};

const ArtistAvatar = ({ name, fallbackThumbnail }: { name: string; fallbackThumbnail: string }) => {
  const handPicked = getHandPickedImage(name);
  const [imgUrl, setImgUrl] = useState(handPicked || fallbackThumbnail);

  useEffect(() => {
    if (handPicked) {
      setImgUrl(handPicked);
      return;
    }
    let active = true;
    const fetchRealImg = async () => {
      try {
        const cached = localStorage.getItem(`elva_artist_img_${name.toLowerCase()}`);
        if (cached) {
          setImgUrl(cached);
          return;
        }
        
        const res = await fetch(`https://corsproxy.io/?https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}`);
        if (res.ok) {
          const data = await res.json();
          const artist = (data.data || []).find((a: any) => a.name.toLowerCase() === name.toLowerCase()) || data.data?.[0];
          if (artist && active && (artist.picture_medium || artist.picture_big)) {
            const url = artist.picture_medium || artist.picture_big;
            setImgUrl(url);
            localStorage.setItem(`elva_artist_img_${name.toLowerCase()}`, url);
          }
        }
      } catch (e) {
        // Safe silent fallback
      }
    };
    
    // Listen to loaded event from other components
    const handleLoaded = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.name.toLowerCase() === name.toLowerCase()) {
        setImgUrl(customEvent.detail.url);
      }
    };
    
    fetchRealImg();
    window.addEventListener('elva-artist-image-loaded', handleLoaded);
    return () => {
      active = false;
      window.removeEventListener('elva-artist-image-loaded', handleLoaded);
    };
  }, [name, fallbackThumbnail]);

  return <img src={imgUrl} alt={name} className="w-full h-full object-cover rounded-full scale-105 group-hover:scale-110 transition-transform duration-500" />;
};

export const ProfileHubView: React.FC<ProfileHubViewProps> = ({
  favorites,
  onToggleFavorite,
  onSelectSong,
  onAddToQueue,
  accentColor,
  onSelectArtist,
  onPlayNext,
}) => {
  const theme = ACCENT_THEMES[accentColor];
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'playlists'>(() => {
    const stored = sessionStorage.getItem('elva_hub_active_tab') || 'overview';
    sessionStorage.removeItem('elva_hub_active_tab');
    return stored as any;
  });

  useEffect(() => {
    const handleScrollToHub = () => {
      setActiveTab('playlists');
    };
    window.addEventListener('elva-scroll-to-hub', handleScrollToHub);
    return () => window.removeEventListener('elva-scroll-to-hub', handleScrollToHub);
  }, []);

  // Profile States
  const [username, setUsername] = useState(() => {
    const stored = localStorage.getItem('elva_profile_name') || 'Music Lover';
    return stored.slice(0, 20);
  });
  const [avatar, setAvatar] = useState(() => {
    const stored = localStorage.getItem('elva_profile_avatar');
    if (stored && (stored.startsWith('from-') || stored === 'initials')) {
      return stored;
    }
    return 'initials';
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [tempAvatar, setTempAvatar] = useState(avatar);

  // Recently Played State
  const [recentlyPlayed, setRecentlyPlayed] = useState<SearchResult[]>(() => {
    try {
      const stored = localStorage.getItem('elva_recently_played');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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

  // Detailed Playlist Tab Local States
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [inlineQuery, setInlineQuery] = useState('');
  const [inlineResults, setInlineResults] = useState<SearchResult[]>([]);
  const [isSearchingInline, setIsSearchingInline] = useState(false);

  // Statistics State
  const [playCounts, setPlayCounts] = useState<PlayCountRecord>(() => {
    try {
      const stored = localStorage.getItem('elva_play_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedCounts = localStorage.getItem('elva_play_counts');
        if (storedCounts) setPlayCounts(JSON.parse(storedCounts));
        const storedRecents = localStorage.getItem('elva_recently_played');
        if (storedRecents) setRecentlyPlayed(JSON.parse(storedRecents));
        const storedPlaylists = localStorage.getItem('elva_playlists');
        if (storedPlaylists) setPlaylists(JSON.parse(storedPlaylists));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('elva-stats-updated', handleStorageChange);
    window.addEventListener('elva-playlists-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('elva-stats-updated', handleStorageChange);
      window.removeEventListener('elva-playlists-updated', handleStorageChange);
    };
  }, []);

  // Save profile modifications
  const handleSaveProfile = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      const limited = trimmed.slice(0, 20);
      setUsername(limited);
      setAvatar(tempAvatar);
      localStorage.setItem('elva_profile_name', limited);
      localStorage.setItem('elva_profile_avatar', tempAvatar);
      setIsCustomizing(false);
      showMiniHUD('Profile updated');
    }
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
    showMiniHUD('Playlist created');
    window.dispatchEvent(new CustomEvent('elva-playlists-updated'));
  };

  // Delete Playlist
  const handleDeletePlaylist = (id: string, name: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    localStorage.setItem('elva_playlists', JSON.stringify(updated));
    showMiniHUD('Playlist deleted', 'info');
    window.dispatchEvent(new CustomEvent('elva-playlists-updated'));
  };

  // Play entire playlist
  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) {
      showMiniHUD('Playlist is empty', 'error');
      return;
    }
    onSelectSong(playlist.tracks[0]);
    playlist.tracks.slice(1).forEach((t) => onAddToQueue(t));
    showMiniHUD('Playing playlist');
  };

  // Inline Search & Track Addition Helper Methods
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

  const handleAddTrackToPlaylist = (playlistId: string, track: SearchResult) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        if (p.tracks.some(t => t.id === track.id)) {
          showMiniHUD('Song already in playlist', 'info');
          return p;
        }
        return {
          ...p,
          tracks: [...p.tracks, track]
        };
      }
      return p;
    });
    
    setPlaylists(updated);
    localStorage.setItem('elva_playlists', JSON.stringify(updated));
    showMiniHUD('Added to playlist!');
    window.dispatchEvent(new CustomEvent('elva-playlists-updated'));
    setInlineQuery('');
    setInlineResults([]);
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string, trackTitle: string) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          tracks: p.tracks.filter(t => t.id !== trackId)
        };
      }
      return p;
    });
    
    setPlaylists(updated);
    localStorage.setItem('elva_playlists', JSON.stringify(updated));
    showMiniHUD('Removed track', 'info');
    window.dispatchEvent(new CustomEvent('elva-playlists-updated'));
  };

  // Redesigned Music Hub calculations
  const totalPlayCount = React.useMemo(() => {
    return Object.values(playCounts).reduce((acc, item) => acc + item.count, 0);
  }, [playCounts]);

  const uniqueSongsCount = React.useMemo(() => {
    return Object.keys(playCounts).length;
  }, [playCounts]);

  const totalListeningMinutes = React.useMemo(() => {
    return totalPlayCount * 3;
  }, [totalPlayCount]);

  const artistBubbles = React.useMemo(() => {
    if (recentlyPlayed.length === 0) return [];
    const seen = new Set<string>();
    const bubbles: { name: string; channelId?: string; thumbnail: string }[] = [];
    
    recentlyPlayed.forEach((song) => {
      const primaryArtist = getPrimaryArtist(song.artist);
      const artistName = primaryArtist.trim();
      if (!artistName) return;
      const key = artistName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        bubbles.push({
          name: artistName,
          channelId: song.channelId,
          thumbnail: song.thumbnail
        });
      }
    });
    return bubbles.slice(0, 8);
  }, [recentlyPlayed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-[898px] relative z-10 flex flex-col gap-8 px-6 pt-4 pb-24 cursor-default"
    >
      {/* 1. HIGH-FOCUS GLASSMORPHIC TABS SWITCHER (Always on top) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md w-full shrink-0 select-none">
        {[
          { id: 'overview', label: 'Overview', icon: Sparkles },
          { id: 'favorites', label: 'Favorites', icon: Heart },
          { id: 'playlists', label: 'Playlists', icon: ListMusic },
        ].map((sub) => {
          const isSubActive = activeTab === sub.id;
          const SubIcon = sub.icon;
          const activeStyle = ACTIVE_TAB_STYLES[accentColor] || ACTIVE_TAB_STYLES.emerald;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveTab(sub.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                isSubActive
                  ? `bg-[#09090c]/85 border ${activeStyle.border} ${activeStyle.text} ${activeStyle.glow} shadow-black/40`
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.01] border border-transparent'
              }`}
            >
              <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? theme.text : 'text-current'}`} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. ACTIVE TAB CONTAINER */}
      <div className="flex-1 min-h-[350px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: OVERVIEW (CURATED DASHBOARD) */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              {/* A. ULTRA-SLIM TYPOGRAPHICAL PROFILE HEADER (Overview-Only) */}
              <div className="rounded-3xl border border-white/5 bg-[#0f0f12]/35 backdrop-blur-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
                <div className={`absolute -top-12 -left-12 w-28 h-28 rounded-full ${theme.bgFade} blur-2xl opacity-20`} />

                {/* Left Side: Avatar & Username */}
                <div className="flex items-center gap-5 relative z-10 shrink-0 select-none">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 border border-white/15 bg-gradient-to-tr shadow-lg bg-[#0f0f12] group-hover:border-white/30 transition-all duration-300">
                      {avatar === 'initials' ? (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-white/[0.04] to-white/[0.12] backdrop-blur-md relative overflow-hidden">
                          <span className="text-xl font-extrabold text-white tracking-tighter">
                            {username.trim() ? username.trim().charAt(0).toUpperCase() : 'M'}
                          </span>
                        </div>
                      ) : (
                        <div className={`w-full h-full rounded-full bg-gradient-to-tr ${avatar}`} />
                      )}
                    </div>
                    {/* Soft pulsing halo */}
                    <div className="absolute inset-0 rounded-full bg-white/5 -z-10 blur-md group-hover:bg-white/10 transition-all duration-300" />
                  </div>

                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-white/30">Music Curator</span>
                    <div className="flex items-center gap-2.5">
                      <h2 
                        className="text-2xl font-normal text-white/95 tracking-wide leading-tight truncate max-w-[180px] md:max-w-[240px]" 
                        style={{ fontFamily: '"Kaobe", serif' }}
                        title={username}
                      >
                        {username}
                      </h2>
                      <button
                        onClick={() => {
                          setTempName(username);
                          setTempAvatar(avatar);
                          setIsCustomizing(true);
                        }}
                        className="p-1.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-all duration-300 cursor-pointer"
                        title="Customize Profile Space"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Sleek typographic Metric Pillars */}
                <div className="flex items-center gap-6 relative z-10 shrink-0 md:border-l md:border-white/5 md:pl-8 py-1">
                  <div className="text-center group min-w-[70px]">
                    <p className="text-xl font-medium text-white tracking-tight leading-none">{totalListeningMinutes}m</p>
                    <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mt-1.5">Minutes</p>
                  </div>

                  <div className="h-6 w-px bg-white/5" />

                  <div className="text-center group min-w-[70px]">
                    <p className="text-xl font-medium text-white tracking-tight leading-none">{uniqueSongsCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mt-1.5">Songs</p>
                  </div>

                  <div className="h-6 w-px bg-white/5" />

                  <div className="text-center group min-w-[70px]">
                    <p className="text-xl font-medium text-white tracking-tight leading-none">{totalPlayCount}</p>
                    <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mt-1.5">Plays</p>
                  </div>
                </div>
              </div>

              {/* B. HORIZONTAL "VINYL FLIP" CAROUSEL (Recently Played) */}
              <div className="rounded-3xl border border-white/[0.05] bg-white/[0.01] p-6 flex flex-col gap-5 shadow-xl w-full">
                <div className="flex items-center gap-2 select-none">
                  <History className="w-4 h-4 text-white/30" />
                  <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Recently Played</h3>
                </div>

                {recentlyPlayed.length > 0 ? (
                  <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-none snap-x snap-mandatory">
                    {recentlyPlayed.map((song) => (
                      <div 
                        key={song.id} 
                        onClick={() => onSelectSong(song)}
                        className="group flex flex-col gap-3 w-36 shrink-0 snap-start select-none cursor-pointer"
                        title={`Play ${song.title}`}
                      >
                        {/* Artwork square with hover-scale & play glass overlay */}
                        <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-white/5">
                          <img 
                            src={song.thumbnail} 
                            alt={song.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="p-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:scale-110 transition-transform shadow-lg">
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Typography underneath cover art */}
                        <div className="text-left w-full">
                          <h4 className="text-sm font-semibold text-white/90 truncate leading-tight tracking-wide" title={song.title}>
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-white/45 truncate mt-1 font-medium leading-none">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.04] bg-white/[0.005] p-8 text-center flex flex-col items-center justify-center select-none">
                    <Music className="w-6 h-6 text-white/15 mb-2" />
                    <p className="text-white/40 text-[10px] font-semibold">No recent songs</p>
                    <p className="text-white/20 text-[9px] mt-1 font-light max-w-[160px]">
                      Start playing some tracks to fill your recents history.
                    </p>
                  </div>
                )}
              </div>

              {/* C. Recently Played Artists Carousel */}
              <div className="rounded-3xl border border-white/[0.05] bg-white/[0.01] p-5 flex flex-col gap-4 shadow-xl w-full">
                <div className="flex items-center justify-between select-none">
                  <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Recently Played Artists</h3>
                </div>

                {artistBubbles.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-5 justify-start">
                    {artistBubbles.map((artist, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (onSelectArtist) {
                            onSelectArtist({
                              name: artist.name,
                              thumbnail: artist.thumbnail || '',
                              channelId: artist.channelId,
                              isTopic: true
                            });
                          }
                        }}
                        className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                        title={`Explore ${artist.name}`}
                      >
                        <div className="relative w-16 h-16 rounded-full overflow-hidden p-0.5 border border-white/10 hover:border-white/30 group-hover:scale-105 transition-all duration-300 shadow-md">
                          <ArtistAvatar name={artist.name} fallbackThumbnail={artist.thumbnail || ''} />
                        </div>

                        <span className="text-[10px] text-white/50 group-hover:text-white transition-colors font-semibold text-center truncate max-w-[80px] w-full">
                          {artist.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.04] bg-white/[0.005] p-6 text-center flex flex-col items-center justify-center select-none">
                    <p className="text-white/40 text-xs font-semibold">No artists resolved yet</p>
                    <p className="text-white/20 text-[10px] mt-1 font-light max-w-[220px]">
                      Your recently played artists will pop up here.
                    </p>
                  </div>
                )}
              </div>

              {/* D. Bottom Showcase: Playlists Horizontal Strip */}
              <div className="rounded-3xl border border-white/[0.05] bg-white/[0.01] p-5 flex flex-col gap-4 shadow-xl w-full">
                <div className="flex items-center justify-between select-none">
                  <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Custom Playlists</h3>
                  <button
                    onClick={() => setActiveTab('playlists')}
                    className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white font-bold transition-all"
                  >
                    View All
                  </button>
                </div>

                {playlists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {playlists.slice(0, 3).map((playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => {
                          setActiveTab('playlists');
                          setSelectedPlaylistId(playlist.id);
                        }}
                        className="group relative rounded-2xl border border-white/[0.05] bg-[#0f0f12]/30 hover:bg-[#0f0f12]/60 p-4.5 flex flex-col justify-between h-[120px] shadow-lg overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.98]"
                      >
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${playlist.color}`} />

                        <div className="space-y-0.5 relative z-10 text-left">
                          <h4 className="text-sm font-semibold text-white/95 truncate leading-tight">{playlist.name}</h4>
                          <p className="text-[9px] font-light text-white/40 tracking-wider uppercase">
                            {playlist.tracks.length} songs
                          </p>
                        </div>

                        <div className="flex justify-end items-center relative z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPlaylist(playlist);
                            }}
                            className="p-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/5 hover:scale-105 transition-all cursor-pointer"
                            title="Play playlist"
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.04] bg-white/[0.005] p-6 text-center flex flex-col items-center justify-center select-none">
                    <p className="text-white/40 text-xs font-semibold">No playlists created yet</p>
                    <p className="text-white/20 text-[10px] mt-1 font-light max-w-[220px]">
                      Go to the Playlists tab to create and manage collections.
                    </p>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: FAVORITES (LARGE WIDE GLASS BANNERS) */}
          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header inside Favorites Tab (Slides up to top) */}
              <div className="flex items-center justify-between select-none">
                <h2 
                  className="text-2xl font-normal text-white/95 tracking-wide leading-none" 
                  style={{ fontFamily: '"Kaobe", serif' }}
                >
                  Your Favorite Library
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                  {favorites.length} {favorites.length === 1 ? 'Song' : 'Songs'}
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
                      className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-md w-full"
                    >
                      {/* Left: 64px Artwork + Stepped-up large visual typography */}
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

                      {/* Right: Tactile larger action triggers */}
                      <div className="flex items-center gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity select-none">
                        <SongRowOptions
                          track={song}
                          onPlayNext={onPlayNext}
                          onAddToQueue={onAddToQueue}
                        />
                        <button
                          onClick={() => onToggleFavorite(song)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-red-400 hover:text-white cursor-pointer transition-all hover:scale-105"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/5 bg-[#0f0f12]/15 p-16 text-center flex flex-col items-center justify-center select-none">
                  <Heart className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm font-medium">No favorite songs yet</p>
                  <p className="text-white/30 text-xs mt-1.5 font-light max-w-[280px]">
                    Use the heart icon during playback or in search results to save your favorites.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: PLAYLISTS (SPACIOUS COLLECTIONS GRID) */}
          {activeTab === 'playlists' && (
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
                        <span>Back to Playlists</span>
                      </button>

                      {/* Header Card */}
                      <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.06] bg-[#0f0f12]/35 backdrop-blur-2xl shadow-2xl py-5 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
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
                            onClick={() => handlePlayPlaylist(playlist)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-white/95 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md"
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Play All</span>
                          </button>
                          <button
                            onClick={() => {
                              handleDeletePlaylist(playlist.id, playlist.name);
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
                                className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.015] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/10 backdrop-blur-md transition-all duration-300 shadow-sm w-full"
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
                                      handleRemoveTrackFromPlaylist(playlist.id, song.id, song.title);
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
                          <div className="rounded-3xl border border-white/5 bg-[#0f0f12]/15 p-12 text-center flex flex-col items-center justify-center select-none">
                            <Music className="w-8 h-8 text-white/25 mb-3 animate-pulse" />
                            <p className="text-white/50 text-sm font-semibold">This playlist is empty</p>
                            <p className="text-white/30 text-xs mt-1.5 font-light max-w-[280px]">
                              Use the search engine below to find and add tracks directly into this collection!
                            </p>
                          </div>
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
                              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/[0.015] border border-white/[0.06] text-white/90 placeholder-white/20 text-sm focus:outline-none focus:border-white/15 focus:bg-white/[0.03] transition-all backdrop-blur-xl"
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
                                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] hover:bg-white/[0.025] border border-white/[0.04] backdrop-blur-md transition-all duration-300 group"
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
                                    onClick={() => handleAddTrackToPlaylist(playlist.id, result)}
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
                      Your Playlist Collections
                    </h2>
                    <button
                      onClick={() => setIsCreatingPlaylist((prev) => !prev)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/25 text-xs font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New</span>
                    </button>
                  </div>

                  {/* Create Playlist Form (Inline Glass Card) */}
                  <AnimatePresence>
                    {isCreatingPlaylist && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 overflow-hidden text-left"
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
                              className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/25 font-light"
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
                              onClick={handleCreatePlaylist}
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
                          className="group relative rounded-3xl border border-white/[0.05] bg-[#0f0f12]/35 hover:bg-[#0f0f12]/60 p-6.5 flex flex-col justify-between h-[160px] shadow-lg overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-black/60 cursor-pointer active:scale-[0.99]"
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
                                handleDeletePlaylist(playlist.id, playlist.name);
                              }}
                              className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100 duration-300"
                              title="Delete playlist"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayPlaylist(playlist);
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
                    <div className="rounded-3xl border border-white/5 bg-[#0f0f12]/15 p-16 text-center flex flex-col items-center justify-center select-none">
                      <ListMusic className="w-8 h-8 text-white/20 mb-3" />
                      <p className="text-white/50 text-sm font-medium">No playlists yet</p>
                      <p className="text-white/30 text-xs mt-1.5 font-light max-w-[280px]">
                        Click on "Create New" to start your first collection, and add songs along the way.
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 3. PREMIUM GLASSMORPHIC PROFILE CUSTOMIZER MODAL */}
      <AnimatePresence>
        {isCustomizing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomizing(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-[#09090c]/90 border border-white/10 backdrop-blur-2xl rounded-3xl p-7 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 flex flex-col gap-6 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-white/90">Customize Space</h3>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Avatar */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Avatar Aurora Glow</span>
                <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  {/* Monogram Selector */}
                  <button
                    onClick={() => setTempAvatar('initials')}
                    className={`w-9 h-9 rounded-full overflow-hidden border transition-all ${
                      tempAvatar === 'initials'
                        ? 'border-white scale-110 shadow-lg bg-white/20'
                        : 'border-white/10 bg-white/5 opacity-50 hover:opacity-100'
                    } cursor-pointer flex items-center justify-center`}
                    title="Monogram Initials"
                  >
                    <span className="text-[11px] font-extrabold text-white">
                      {tempName.trim() ? tempName.trim().charAt(0).toUpperCase() : 'M'}
                    </span>
                  </button>

                  {/* Gradient Presets */}
                  {PRESET_GRADIENTS.map((grad, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTempAvatar(grad)}
                      className={`w-9 h-9 rounded-full overflow-hidden border transition-all ${
                        tempAvatar === grad
                          ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                          : 'border-white/10 opacity-50 hover:opacity-100'
                      } cursor-pointer bg-gradient-to-tr ${grad}`}
                      title={`Aurora preset ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Edit Username */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Curator Name</span>
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  maxLength={20}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 transition-all font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-1 select-none">
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 rounded-2xl text-xs text-black bg-white hover:bg-white/90 transition-all cursor-pointer font-extrabold uppercase tracking-wider shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
