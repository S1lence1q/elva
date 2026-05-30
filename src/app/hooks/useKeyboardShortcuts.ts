import { useEffect } from 'react';
import { shouldShowArtistCard } from '../utils/apiUtils';

interface KeyboardShortcutsParams {
  appState: 'landing' | 'processing' | 'ready';
  searchQuery: string;
  isSearching: boolean;
  searchResults: any[];
  selectedArtist: any;
  artistTracks: any[];
  verifiedArtist: any;
  loadingSongId: string | null;
  focusedResultIndex: number;
  setFocusedResultIndex: React.Dispatch<React.SetStateAction<number>>;
  handleSelectSong: (song: any) => void;
  handleViewArtistProfile: (artist: any) => void;
  showShortcutMap: boolean;
  setShowShortcutMap: React.Dispatch<React.SetStateAction<boolean>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useKeyboardShortcuts({
  appState,
  searchQuery,
  isSearching,
  searchResults,
  selectedArtist,
  artistTracks,
  verifiedArtist,
  loadingSongId,
  focusedResultIndex,
  setFocusedResultIndex,
  handleSelectSong,
  handleViewArtistProfile,
  showShortcutMap,
  setShowShortcutMap,
  showSettings,
  setShowSettings,
}: KeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isSearchActive = appState === 'landing' && searchQuery.trim() !== '' && !isSearching;

      if (isSearchActive && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || (e.key === 'Enter' && focusedResultIndex >= 0))) {
        e.preventDefault();

        const hasArtistCard = shouldShowArtistCard(searchQuery) && verifiedArtist && !selectedArtist;
        const totalItems = selectedArtist 
          ? artistTracks.length 
          : searchResults.length + (hasArtistCard ? 1 : 0);

        if (totalItems === 0) return;

        if (e.key === 'ArrowDown') {
          setFocusedResultIndex(prev => {
            if (prev < totalItems - 1) return prev + 1;
            return prev;
          });
        } else if (e.key === 'ArrowUp') {
          setFocusedResultIndex(prev => {
            if (prev > 0) return prev - 1;
            return -1;
          });
        } else if (e.key === 'Enter') {
          if (focusedResultIndex >= 0) {
            if (selectedArtist) {
              const track = artistTracks[focusedResultIndex];
              if (track && !loadingSongId) handleSelectSong(track);
            } else {
              if (hasArtistCard && focusedResultIndex === 0) {
                handleViewArtistProfile(verifiedArtist);
              } else {
                const songIndex = hasArtistCard ? focusedResultIndex - 1 : focusedResultIndex;
                const song = searchResults[songIndex];
                if (song && !loadingSongId) handleSelectSong(song);
              }
            }
          }
        }
        return;
      }

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutMap(prev => !prev);
      } else if (e.key === 'Escape' && showShortcutMap) {
        e.preventDefault();
        setShowShortcutMap(false);
      } else if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    showShortcutMap,
    showSettings,
    appState,
    searchQuery,
    isSearching,
    searchResults,
    selectedArtist,
    artistTracks,
    verifiedArtist,
    loadingSongId,
    focusedResultIndex,
    setFocusedResultIndex,
    handleSelectSong,
    handleViewArtistProfile,
    setShowShortcutMap,
    setShowSettings
  ]);
}
