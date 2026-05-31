import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SearchResult, VerifiedArtist } from '../types';
import { getPrimaryArtist } from '../utils/stringUtils';
import {
  shouldShowArtistCard,
  getArtistName,
  getHandPickedImage,
  executeSearchAPI,
  resolveTopicChannelId,
  fetchAllChannelUploads,
  fetchWithTimeout,
  fetchVideoDetails
} from '../utils/apiUtils';

const SHORTCUT_ARTISTS: VerifiedArtist[] = [
  {
    name: 'KESI',
    thumbnail: 'https://cdn-images.dzcdn.net/images/artist/50656cb54b66a32d095c3e0532c9dc32/250x250-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  },
  {
    name: 'Kundo',
    thumbnail: 'https://cdn-images.dzcdn.net/images/cover/2bbca104b7dd8d14bed865e4cebf3c79/500x500-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  },
  {
    name: 'Lamin',
    thumbnail: 'https://cdn-images.dzcdn.net/images/artist/7375da7e864a9cf0bdd6add7578df724/250x250-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  },
  {
    name: 'Artigeardit',
    thumbnail: 'https://cdn-images.dzcdn.net/images/artist/54920f6d4791b6923f008effd0b3b2ef/250x250-000000-80-0-0.jpg',
    disambiguation: 'Danish Rapper • DK',
    country: 'DK',
    tags: ['Hip-Hop', 'Rap', 'DK']
  }
];

interface SearchLogicOptions {
  setAppState: (state: 'landing' | 'processing' | 'ready') => void;
  setSongData: (data: any) => void;
  setColorsSongData: (data: any) => void;
  setQueue: React.Dispatch<React.SetStateAction<SearchResult[]>>;
  saveRecentlyPlayed: (song: SearchResult) => void;
  handleSelectSong: (song: SearchResult) => void;
  appState: 'landing' | 'processing' | 'ready';
  songData: any;
  tourType: 'landing' | 'player' | null;
  tourStep: number;
  setTourStep: (step: number) => void;
}

export function useSearchLogic({
  setAppState,
  setSongData,
  setColorsSongData,
  setQueue,
  saveRecentlyPlayed,
  handleSelectSong,
  appState,
  songData,
  tourType,
  tourStep,
  setTourStep
}: SearchLogicOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedArtist, setSelectedArtist] = useState<VerifiedArtist | null>(null);
  const [verifiedArtist, setVerifiedArtist] = useState<VerifiedArtist | null>(null);
  const [resolvedVideoIds, setResolvedVideoIds] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('elva_resolved_video_ids');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [isVerifyingArtist, setIsVerifyingArtist] = useState(false);
  const [artistTracks, setArtistTracks] = useState<SearchResult[]>([]);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [recentArtists, setRecentArtists] = useState<VerifiedArtist[]>(() => {
    try {
      const stored = localStorage.getItem('elva_recent_artists');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a: any) => {
            const handPicked = getHandPickedImage(a.name);
            return handPicked ? { ...a, thumbnail: handPicked } : a;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load recent artists from localStorage:', e);
    }
    return SHORTCUT_ARTISTS;
  });

  const [focusedResultIndex, setFocusedResultIndex] = useState<number>(-1);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);

  // Reset focus when searching or changing view
  useEffect(() => {
    setFocusedResultIndex(-1);
  }, [searchQuery, searchResults, selectedArtist]);

  // Reset selected artist only if search query is completely empty
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSelectedArtist(null);
      setArtistTracks([]);
      setVerifiedArtist(null);
      setIsVerifyingArtist(false);
      setLastSearchedQuery('');
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Verify artist via MusicBrainz API in background to enrich metadata
  useEffect(() => {
    let active = true;
    
    const verifyArtist = async () => {
      if (!shouldShowArtistCard(lastSearchedQuery) || searchResults.length === 0) {
        setVerifiedArtist(null);
        return;
      }
      
      const candidate = getArtistName(lastSearchedQuery, searchResults);
      if (!candidate) {
        setVerifiedArtist(null);
        return;
      }

      const handPicked = getHandPickedImage(candidate.name);
      setVerifiedArtist({
        name: candidate.name,
        thumbnail: handPicked || candidate.thumbnail,
        channelId: candidate.channelId,
        isTopic: candidate.isTopic
      });

      setIsVerifyingArtist(true);
      try {
        const queryVal = candidate.name.trim();

        try {
          if (handPicked) {
            localStorage.setItem(`elva_artist_img_${queryVal.toLowerCase()}`, handPicked);
          } else {
            const deezerRes = await fetchWithTimeout(
              `https://corsproxy.io/?https://api.deezer.com/search/artist?q=${encodeURIComponent(queryVal)}`,
              { timeout: 2500 }
            );
            if (deezerRes.ok) {
              const deezerData = await deezerRes.json();
              const deezerArtist = (deezerData.data || []).find((a: any) => 
                a.name.toLowerCase() === queryVal.toLowerCase()
              ) || deezerData.data?.[0];
              
              if (deezerArtist && active && (deezerArtist.picture_big || deezerArtist.picture_medium)) {
                const imgUrl = deezerArtist.picture_big || deezerArtist.picture_medium;
                localStorage.setItem(`elva_artist_img_${queryVal.toLowerCase()}`, imgUrl);
                setVerifiedArtist(prev => prev ? {
                  ...prev,
                  thumbnail: imgUrl
                } : null);
              }
            }
          }
        } catch (de) {
          console.warn('Deezer artist image fetch failed:', de);
        }

        const response = await fetchWithTimeout(
          `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(queryVal)}&fmt=json`,
          {
            headers: {
              'User-Agent': 'ElvaMusicApp/1.0 ( contact@elva.fm )'
            },
            timeout: 2500
          }
        );
        
        if (!response.ok) {
          throw new Error(`MusicBrainz HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        if (!active) return;
        
        const artists = data.artists || [];
        const queryLower = queryVal.toLowerCase();
        
        const matchedArtist = artists.find((artist: any) => {
          const nameLower = (artist.name || '').toLowerCase();
          const score = artist.score || 0;
          return score >= 85 && (nameLower === queryLower || nameLower.includes(queryLower) || queryLower.includes(nameLower));
        });
        
        if (matchedArtist && active) {
          const tagsList = (matchedArtist.tags || [])
            .filter((t: any) => (t.count || 0) > 0)
            .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
            .map((t: any) => t.name)
            .slice(0, 3);
            
          setVerifiedArtist(prev => prev ? {
            ...prev,
            disambiguation: matchedArtist.disambiguation || undefined,
            country: matchedArtist.country || undefined,
            tags: tagsList.length > 0 ? tagsList : undefined
          } : null);
        }
      } catch (error) {
        console.warn('Background MusicBrainz metadata enrichment failed:', error);
      } finally {
        if (active) {
          setIsVerifyingArtist(false);
        }
      }
    };
    
    verifyArtist();
    
    return () => {
      active = false;
    };
  }, [searchResults, lastSearchedQuery]);

  const handleViewArtistProfile = async (artist: VerifiedArtist) => {
    const isPlaceholderOrEmpty = (url?: string) => {
      if (!url) return true;
      return url.includes('unsplash.com') || url === '';
    };

    const nameLower = artist.name.trim().toLowerCase();
    const handPickedUrl = getHandPickedImage(artist.name);
    let cachedDeezerImg = handPickedUrl || localStorage.getItem(`elva_artist_img_${nameLower}`);

    // Fetch Deezer image in background if not cached
    if (!cachedDeezerImg) {
      try {
        const deezerRes = await fetchWithTimeout(
          `https://corsproxy.io/?https://api.deezer.com/search/artist?q=${encodeURIComponent(artist.name.trim())}`,
          {},
          2500
        );
        if (deezerRes.ok) {
          const deezerData = await deezerRes.json();
          const deezerArtist = (deezerData.data || []).find((a: any) =>
            a.name.toLowerCase() === nameLower
          ) || deezerData.data?.[0];
          if (deezerArtist && (deezerArtist.picture_big || deezerArtist.picture_medium)) {
            cachedDeezerImg = deezerArtist.picture_big || deezerArtist.picture_medium;
            localStorage.setItem(`elva_artist_img_${nameLower}`, cachedDeezerImg!);
            window.dispatchEvent(new CustomEvent('elva-artist-image-loaded', { detail: { name: artist.name, url: cachedDeezerImg } }));
          }
        }
      } catch (de) {
        console.warn('Deezer image fetch failed:', de);
      }
    }

    // Show artist immediately with skeleton tracks
    const initialArtist = {
      ...artist,
      thumbnail: handPickedUrl || (isPlaceholderOrEmpty(artist.thumbnail) ? (cachedDeezerImg || artist.thumbnail) : artist.thumbnail)
    };
    setSelectedArtist(initialArtist);
    setArtistTracks([]);
    setIsLoadingArtist(true);

    // Save to recent artists
    setRecentArtists(prev => {
      const filtered = prev.filter(a => a.name.toLowerCase() !== nameLower);
      const updated = [initialArtist, ...filtered].slice(0, 4);
      try { localStorage.setItem('elva_recent_artists', JSON.stringify(updated)); } catch {}
      return updated;
    });

    try {
      // ── Step 1: Find the official channel (Topic → VEVO → official name match) ──
      // We already have a channelId if this artist came from a search result.
      // But even then, we try to upgrade it to the Topic channel for cleaner results.
      let resolvedChannelId = artist.channelId;
      let resolvedType: 'topic' | 'vevo' | 'official' | 'provided' = resolvedChannelId ? 'provided' : 'provided';

      const topicResult = await resolveTopicChannelId(artist.name);

      if (topicResult) {
        // Topic/VEVO channel takes priority — always cleaner than a generic channel
        resolvedChannelId = topicResult.channelId;
        resolvedType = topicResult.type;
      }

      // Update artist state with resolved channelId and isTopic flag
      const isTopic = resolvedType === 'topic';
      if (resolvedChannelId && resolvedChannelId !== artist.channelId) {
        const updatedArtist = { ...initialArtist, channelId: resolvedChannelId, isTopic };
        setSelectedArtist(updatedArtist);
        setRecentArtists(prev => {
          const filtered = prev.filter(a => a.name.toLowerCase() !== nameLower);
          const hp = getHandPickedImage(artist.name);
          const updated = [{ ...updatedArtist, thumbnail: hp || updatedArtist.thumbnail }, ...filtered].slice(0, 4);
          try { localStorage.setItem('elva_recent_artists', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }

      // ── Step 2: Fetch complete discography from the official channel ──
      let tracks: SearchResult[] = [];

      if (resolvedChannelId) {
        tracks = await fetchAllChannelUploads(resolvedChannelId, 150);
      }

      // ── Step 3: Strict fallback if no official channel found or uploads empty ──
      // Only include tracks where the uploader channel title EXACTLY matches the artist name.
      // No loose matching, no name-in-title heuristics.
      if (tracks.length === 0) {
        const [raw1, raw2] = await Promise.all([
          executeSearchAPI(artist.name, 50),
          executeSearchAPI(`${artist.name} - Topic`, 10)
        ]);
        const seenIds = new Set<string>();
        for (const track of [...raw1, ...raw2]) {
          if (!track.id || seenIds.has(track.id)) continue;
          seenIds.add(track.id);
          const uploaderLower = (track.artist || '').trim().toLowerCase();
          // Exact match only: channel must be the artist, their Topic channel, or their VEVO
          const isExactArtist = uploaderLower === nameLower;
          const isTopicChannel = uploaderLower === `${nameLower} - topic`;
          const isVevo = uploaderLower === `${nameLower}vevo`;
          if (isExactArtist || isTopicChannel || isVevo) {
            tracks.push(track);
          }
        }
      }

      // ── Step 4: Deduplicate by videoId ──
      const seen = new Set<string>();
      tracks = tracks.filter(t => {
        if (!t.videoId || seen.has(t.videoId)) return false;
        seen.add(t.videoId);
        return true;
      });

      setArtistTracks(tracks);

      // ── Step 5: Background MusicBrainz metadata enrichment ──
      try {
        const mbRes = await fetchWithTimeout(
          `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist.name)}&fmt=json`,
          { headers: { 'User-Agent': 'ElvaMusicApp/1.0 ( contact@elva.fm )' } },
          2500
        );
        if (mbRes.ok) {
          const mbData = await mbRes.json();
          const matchedArtist = (mbData.artists || []).find((a: any) => {
            const nLower = (a.name || '').toLowerCase();
            return (a.score || 0) >= 85 && (nLower === nameLower || nLower.includes(nameLower) || nameLower.includes(nLower));
          });
          if (matchedArtist) {
            const tagsList = (matchedArtist.tags || [])
              .filter((t: any) => (t.count || 0) > 0)
              .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
              .map((t: any) => t.name)
              .slice(0, 3);
            setSelectedArtist(prev => prev ? {
              ...prev,
              disambiguation: matchedArtist.disambiguation || undefined,
              country: matchedArtist.country || undefined,
              tags: tagsList.length > 0 ? tagsList : undefined
            } : null);
          }
        }
      } catch (mbErr) {
        console.warn('MusicBrainz enrichment failed:', mbErr);
      }

    } catch (error) {
      console.error('Failed to load artist profile:', error);
      toast.error(`Could not fetch releases for ${artist.name}`);
    } finally {
      setIsLoadingArtist(false);
    }
  };

  const handleViewArtistByName = async (artistName: string, channelId?: string) => {
    const primaryArtistName = getPrimaryArtist(artistName);
    const nameTrimmed = primaryArtistName.trim();
    if (!nameTrimmed || nameTrimmed === 'Unknown Artist' || nameTrimmed === 'Web Stream') {
      toast.error('Invalid artist');
      return;
    }

    if (verifiedArtist && verifiedArtist.name.toLowerCase() === nameTrimmed.toLowerCase()) {
      handleViewArtistProfile(verifiedArtist);
      return;
    }
    const foundInRecent = recentArtists.find(a => a.name.toLowerCase() === nameTrimmed.toLowerCase());
    if (foundInRecent) {
      handleViewArtistProfile(foundInRecent);
      return;
    }

    const handPicked = getHandPickedImage(nameTrimmed);
    const tempArtist: VerifiedArtist = {
      name: nameTrimmed,
      thumbnail: handPicked || songData?.artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtdXNpYyUyMGJhY2tncm91bmR8ZW58MHx8fDE3Nzg5Nzk5NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      channelId: channelId,
    };

    handleViewArtistProfile(tempArtist);
  };

  const handleSearch = async (overrideQuery?: string) => {
    const query = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!query.trim()) return;

    setSelectedArtist(null);
    setArtistTracks([]);
    setVerifiedArtist(null);

    setIsSearching(true);
    const results = await executeSearchAPI(query);
    setIsSearching(false);

    if (results.length > 0) {
      setSearchResults(results);
      setLastSearchedQuery(query);
    } else {
      toast.error('Search failed', { 
        description: 'Could not fetch results from YouTube. Try using an API key or pasting a link directly.' 
      });
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setAppState('processing');

    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = ytMatch ? ytMatch[1] : null;

    let targetSong: SearchResult;

    if (videoId) {
      const details = await fetchVideoDetails(videoId);
      targetSong = {
        id: videoId,
        title: details.title,
        artist: details.artist,
        thumbnail: details.artworkUrl,
        videoId: videoId
      };
    } else {
      const title = url.split('/').pop()?.split('?')[0] || 'Streaming Song';
      targetSong = {
        id: url,
        title: decodeURIComponent(title),
        artist: 'Web Stream',
        thumbnail: 'https://images.unsplash.com/photo-1676068368612-1c8b3e2afed0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJ1bSUyMGNvdmVyJTIwbXVzaWMlMjBhYnN0cmFjdCUyMGFydCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3ODk2NjA3OHww&ixlib=rb-4.1.0&q=80&w=1080',
        videoId: ''
      };
    }

    setSongData({
      title: targetSong.title,
      artist: targetSong.artist,
      artworkUrl: targetSong.thumbnail,
      audioUrl: targetSong.videoId ? `https://www.youtube.com/watch?v=${targetSong.id}` : url,
      videoId: targetSong.videoId || undefined,
      channelId: targetSong.channelId
    });

    setQueue(prevQueue => {
      if (prevQueue.some(item => item.id === targetSong.id)) {
        return prevQueue;
      }
      return [...prevQueue, targetSong];
    });

    setAppState('ready');
  };

  return {
    searchQuery,
    setSearchQuery,
    lastSearchedQuery,
    setLastSearchedQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    selectedArtist,
    setSelectedArtist,
    verifiedArtist,
    setVerifiedArtist,
    isVerifyingArtist,
    artistTracks,
    setArtistTracks,
    isLoadingArtist,
    recentArtists,
    setRecentArtists,
    focusedResultIndex,
    setFocusedResultIndex,
    loadingSongId,
    setLoadingSongId,
    resolvedVideoIds,
    handleViewArtistProfile,
    handleViewArtistByName,
    handleSearch,
    handleUrlSubmit
  };
}
