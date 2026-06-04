import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, ListMusic, Sliders } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';
import { AccentColor, ACCENT_THEMES } from './themeUtils';
import { getPrimaryArtist } from '../utils/stringUtils';
import { showMiniHUD } from '../utils/hudUtils';
import { ProfileHeader } from './profilehub/ProfileHeader';
import { OverviewTab } from './profilehub/OverviewTab';
import { FavoritesTab } from './profilehub/FavoritesTab';
import { PlaylistsTab } from './profilehub/PlaylistsTab';
import { ProfileCustomizerModal } from './profilehub/ProfileCustomizerModal';
import { AdvancedSettingsTab } from './profilehub/AdvancedSettingsTab';

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
  onPlayPlaylist: (tracks: SearchResult[], label?: string) => void;
  accentColor: AccentColor;
  onSelectArtist?: (artist: VerifiedArtist | null) => void;
  onPlayNext?: (song: SearchResult) => void;

  onAccentColorChange?: (color: AccentColor) => void;
  textureStyle: 'paper' | 'dots' | 'none';
  onTextureStyleChange?: (style: 'paper' | 'dots' | 'none') => void;
  backgroundStyle: 'default' | 'particles' | 'liquid' | 'mesh';
  onBackgroundStyleChange?: (style: 'default' | 'particles' | 'liquid' | 'mesh') => void;
  zenMode: boolean;
  onZenModeChange?: (zen: boolean) => void;
  showVolumeSlider: boolean;
  onShowVolumeSliderChange?: (show: boolean) => void;
  enable3DTilt: boolean;
  onEnable3DTiltChange?: (enable: boolean) => void;
  showSettingsButton: boolean;
  onShowSettingsButtonChange?: (show: boolean) => void;
  enableCustomLyrics: boolean;
  onEnableCustomLyricsChange?: (enable: boolean) => void;
}

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

export const ProfileHubView: React.FC<ProfileHubViewProps> = ({
  favorites,
  onToggleFavorite,
  onSelectSong,
  onAddToQueue,
  onPlayPlaylist,
  accentColor,
  onSelectArtist,
  onPlayNext,
  onAccentColorChange,
  textureStyle,
  onTextureStyleChange,
  backgroundStyle,
  onBackgroundStyleChange,
  zenMode,
  onZenModeChange,
  showVolumeSlider,
  onShowVolumeSliderChange,
  enable3DTilt,
  onEnable3DTiltChange,
  showSettingsButton,
  onShowSettingsButtonChange,
  enableCustomLyrics,
  onEnableCustomLyricsChange,
}) => {
  const theme = ACCENT_THEMES[accentColor];
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'playlists' | 'settings'>(() => {
    const stored = sessionStorage.getItem('elva_hub_active_tab') || 'overview';
    sessionStorage.removeItem('elva_hub_active_tab');
    return stored as any;
  });

  useEffect(() => {
    const handleScrollToHub = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetTab = customEvent.detail?.tab || 'playlists';
      setActiveTab(targetTab);
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

  // Detailed Playlist Tab Local State
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

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
  const handleCreatePlaylist = (name: string, color: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      color,
      tracks: [],
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    localStorage.setItem('elva_playlists', JSON.stringify(updated));
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
    onPlayPlaylist(playlist.tracks, playlist.name);
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
  const totalPlayCount = useMemo(() => {
    return Object.values(playCounts).reduce((acc, item) => acc + item.count, 0);
  }, [playCounts]);

  const uniqueSongsCount = useMemo(() => {
    return Object.keys(playCounts).length;
  }, [playCounts]);

  const totalListeningMinutes = useMemo(() => {
    return totalPlayCount * 3;
  }, [totalPlayCount]);

  const artistBubbles = useMemo(() => {
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
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl elva-glass-chrome w-full shrink-0 select-none">
        {[
          { id: 'overview', label: 'Overview', icon: Sparkles },
          { id: 'favorites', label: 'Favorites', icon: Heart },
          { id: 'playlists', label: 'Playlists', icon: ListMusic },
          { id: 'settings', label: 'Settings', icon: Sliders },
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
                  ? `elva-chip-active border ${activeStyle.border} ${activeStyle.text} ${activeStyle.glow} shadow-black/40`
                  : 'text-white/35 hover:text-white/70 hover:bg-[#13141b]/35 border border-transparent'
              }`}
            >
              <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? theme.text : 'text-current'}`} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Header (only rendered on Overview tab) */}
      {activeTab === 'overview' && (
        <ProfileHeader
          username={username}
          avatar={avatar}
          accentColor={accentColor}
          totalListeningMinutes={totalListeningMinutes}
          uniqueSongsCount={uniqueSongsCount}
          totalPlayCount={totalPlayCount}
          onEditProfile={() => {
            setTempName(username);
            setTempAvatar(avatar);
            setIsCustomizing(true);
          }}
        />
      )}

      {/* 2. ACTIVE TAB CONTAINER */}
      <div className="flex-1 min-h-[350px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab
              recentlyPlayed={recentlyPlayed}
              onSelectSong={onSelectSong}
              artistBubbles={artistBubbles}
              onSelectArtist={onSelectArtist}
              playlists={playlists}
              setActiveTab={setActiveTab}
              setSelectedPlaylistId={setSelectedPlaylistId}
              handlePlayPlaylist={handlePlayPlaylist}
              accentColor={accentColor}
            />
          )}

          {activeTab === 'favorites' && (
            <FavoritesTab
              favorites={favorites}
              onSelectSong={onSelectSong}
              onToggleFavorite={onToggleFavorite}
              onAddToQueue={onAddToQueue}
              onPlayNext={onPlayNext}
            />
          )}

          {activeTab === 'playlists' && (
            <PlaylistsTab
              playlists={playlists}
              selectedPlaylistId={selectedPlaylistId}
              setSelectedPlaylistId={setSelectedPlaylistId}
              accentColor={accentColor}
              onCreatePlaylist={handleCreatePlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onPlayPlaylist={handlePlayPlaylist}
              onSelectSong={onSelectSong}
              onAddToQueue={onAddToQueue}
              onPlayNext={onPlayNext}
              onAddTrackToPlaylist={handleAddTrackToPlaylist}
              onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
            />
          )}

          {activeTab === 'settings' && (
            <AdvancedSettingsTab
              accentColor={accentColor}
              onAccentColorChange={onAccentColorChange}
              textureStyle={textureStyle}
              onTextureStyleChange={onTextureStyleChange}
              backgroundStyle={backgroundStyle}
              onBackgroundStyleChange={onBackgroundStyleChange}
              zenMode={zenMode}
              onZenModeChange={onZenModeChange}
              showVolumeSlider={showVolumeSlider}
              onShowVolumeSliderChange={onShowVolumeSliderChange}
              enable3DTilt={enable3DTilt}
              onEnable3DTiltChange={onEnable3DTiltChange}
              showSettingsButton={showSettingsButton}
              onShowSettingsButtonChange={onShowSettingsButtonChange}
              enableCustomLyrics={enableCustomLyrics}
              onEnableCustomLyricsChange={onEnableCustomLyricsChange}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 3. PREMIUM GLASSMORPHIC PROFILE CUSTOMIZER MODAL */}
      {createPortal(
        <AnimatePresence>
          {isCustomizing && (
            <motion.div
              key="profile-customizer-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsCustomizing(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-default pointer-events-auto"
            >
              <ProfileCustomizerModal
                onClose={() => setIsCustomizing(false)}
                tempName={tempName}
                setTempName={setTempName}
                tempAvatar={tempAvatar}
                setTempAvatar={setTempAvatar}
                onSave={handleSaveProfile}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};
