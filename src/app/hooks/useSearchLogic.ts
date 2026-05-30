import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SearchResult, VerifiedArtist } from '../types';
import { getPrimaryArtist } from '../utils/stringUtils';
import {
  shouldShowArtistCard,
  getArtistName,
  getHandPickedImage,
  executeSearchAPI,
  executeChannelUploadsAPI,
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

    const nameLower = artist.name.toLowerCase();
    const handPickedUrl = getHandPickedImage(artist.name);
    let cachedDeezerImg = handPickedUrl || localStorage.getItem(`elva_artist_img_${nameLower}`);
    
    if (!cachedDeezerImg && !handPickedUrl) {
      try {
        const deezerRes = await fetchWithTimeout(
          `https://corsproxy.io/?https://api.deezer.com/search/artist?q=${encodeURIComponent(artist.name.trim())}`,
          { timeout: 2500 }
        );
        if (deezerRes.ok) {
          const deezerData = await deezerRes.json();
          const deezerArtist = (deezerData.data || []).find((a: any) => 
            a.name.toLowerCase() === artist.name.toLowerCase().trim()
          ) || deezerData.data?.[0];
          if (deezerArtist && (deezerArtist.picture_big || deezerArtist.picture_medium)) {
            cachedDeezerImg = deezerArtist.picture_big || deezerArtist.picture_medium;
            localStorage.setItem(`elva_artist_img_${nameLower}`, cachedDeezerImg);
            window.dispatchEvent(new CustomEvent('elva-artist-image-loaded', { detail: { name: artist.name, url: cachedDeezerImg } }));
          }
        }
      } catch (de) {
        console.warn('Deezer artist image fetch in handleViewArtistProfile failed:', de);
      }
    }

    const initialArtist = {
      ...artist,
      thumbnail: handPickedUrl || (isPlaceholderOrEmpty(artist.thumbnail) ? (cachedDeezerImg || artist.thumbnail) : artist.thumbnail)
    };
    
    setSelectedArtist(initialArtist);
    
    setRecentArtists(prev => {
      const filtered = prev.filter(a => a.name.toLowerCase() !== initialArtist.name.toLowerCase());
      const updated = [initialArtist, ...filtered].slice(0, 4);
      try {
        localStorage.setItem('elva_recent_artists', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save recent artists to localStorage:', e);
      }
      return updated;
    });
    
    const matchingResults = searchResults.filter(track => {
      const trackArtistLower = (track.artist || '').toLowerCase();
      const trackTitleLower = (track.title || '').toLowerCase();
      
      let artistMatches = trackArtistLower.includes(nameLower) || nameLower.includes(trackArtistLower);
      if (!artistMatches && trackTitleLower.includes(nameLower)) {
        const isCamilo = trackArtistLower.includes('camilo');
        const isExactTitleMatchDiffArtist = trackTitleLower.trim() === nameLower;
        if (!isCamilo && !isExactTitleMatchDiffArtist) {
          artistMatches = true;
        }
      }
      return artistMatches;
    });

    if (matchingResults.length > 0) {
      setArtistTracks(matchingResults);
    } else {
      setArtistTracks([]);
    }
    
    setIsLoadingArtist(true);
    
    try {
      let resolvedChannelId = initialArtist.channelId;
      let resolvedAvatar = handPickedUrl || (isPlaceholderOrEmpty(artist.thumbnail)
        ? (cachedDeezerImg || initialArtist.thumbnail || artist.thumbnail)
        : artist.thumbnail);
      let resolvedIsTopic = initialArtist.isTopic || false;

      if (!resolvedChannelId) {
        const searchCandidates = await executeSearchAPI(`${initialArtist.name} topic`, 5);
        if (searchCandidates.length > 0) {
          const candidate = getArtistName(initialArtist.name, searchCandidates);
          if (candidate) {
            resolvedChannelId = candidate.channelId;
            resolvedIsTopic = candidate.isTopic || false;
            if (!handPickedUrl && isPlaceholderOrEmpty(resolvedAvatar)) {
              resolvedAvatar = cachedDeezerImg || candidate.thumbnail;
            }
          } else {
            const match = searchCandidates.find(t => t.artist.toLowerCase().includes(nameLower));
            if (match) {
              resolvedChannelId = match.channelId;
              if (!handPickedUrl && isPlaceholderOrEmpty(resolvedAvatar)) {
                resolvedAvatar = cachedDeezerImg || match.thumbnail;
              }
            } else {
              resolvedChannelId = searchCandidates[0].channelId;
              if (!handPickedUrl && isPlaceholderOrEmpty(resolvedAvatar)) {
                resolvedAvatar = cachedDeezerImg || searchCandidates[0].thumbnail;
              }
            }
          }
        }
      }

      let rawTracks: SearchResult[] = [];

      if (resolvedChannelId) {
        try {
          rawTracks = await executeChannelUploadsAPI(resolvedChannelId, 50);
        } catch (e) {
          console.warn("Failed to fetch from channel uploads, trying fallback search:", e);
        }
      }

      if (rawTracks.length === 0) {
        const searchResults1 = await executeSearchAPI(artist.name, 50);
        const searchResults2 = await executeSearchAPI(`${artist.name} topic`, 50);
        
        const seenIds = new Set<string>();
        const combined: SearchResult[] = [];
        for (const track of [...searchResults1, ...searchResults2]) {
          if (track && track.id && !seenIds.has(track.id)) {
            seenIds.add(track.id);
            const uploaderLower = track.artist.toLowerCase();
            const titleLower = track.title.toLowerCase();
            
            if (artist.name.toLowerCase() === 'kesi') {
              const foreignBlock = ['camilo', 'shawn mendes', 'nviiri', 'baadae', 'nepal', 'alphajiri', 'skiza', 'folks'];
              if (foreignBlock.some(word => titleLower.includes(word) || uploaderLower.includes(word))) {
                continue;
              }
            }

            if (uploaderLower.includes(nameLower) || nameLower.includes(uploaderLower)) {
              combined.push(track);
            }
          }
        }
        rawTracks = combined;
      }

      const cleaned = rawTracks.map(track => {
        const cleanArtist = track.artist
          .replace(/\s*-\s*Topic$/i, '')
          .replace(/\s*VEVO$/i, '')
          .replace(/\s*Official\s*$/i, '')
          .trim();
          
        const cleanTitle = track.title
          .replace(/\s*\((Official Audio|Audio|Official Video|Video|Lyrics|Lyric Video)\)$/i, '')
          .replace(/\s*\[(Official Audio|Audio|Official Video|Video|Lyrics|Lyric Video)\]$/i, '')
          .trim();
          
        return {
          ...track,
          artist: cleanArtist,
          title: cleanTitle
        };
      });

      setArtistTracks(cleaned);

      if (resolvedChannelId && (resolvedChannelId !== artist.channelId || resolvedAvatar !== artist.thumbnail)) {
        const hp = getHandPickedImage(artist.name);
        const updated = {
          ...artist,
          channelId: resolvedChannelId,
          thumbnail: hp || resolvedAvatar,
          isTopic: resolvedIsTopic
        };
        setSelectedArtist(updated);
        
        setRecentArtists(prev => {
          const filtered = prev.filter(a => a.name.toLowerCase() !== artist.name.toLowerCase());
          const updatedList = [updated, ...filtered].slice(0, 4);
          const cleanedList = updatedList.map(a => {
            const hpImg = getHandPickedImage(a.name);
            return hpImg ? { ...a, thumbnail: hpImg } : a;
          });
          try {
            localStorage.setItem('elva_recent_artists', JSON.stringify(cleanedList));
          } catch (e) {}
          return cleanedList;
        });
      }

      try {
        const mbRes = await fetchWithTimeout(
          `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist.name)}&fmt=json`,
          {
            headers: { 'User-Agent': 'ElvaMusicApp/1.0 ( contact@elva.fm )' },
            timeout: 2500
          }
        );
        if (mbRes.ok) {
          const mbData = await mbRes.json();
          const artists = mbData.artists || [];
          const matchedArtist = artists.find((a: any) => {
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
        console.warn("Background MB enrichment failed during profile navigation:", mbErr);
      }

    } catch (error) {
      console.error('Failed to load artist profile tracks:', error);
      toast.error(`Could not fetch official releases for ${artist.name}`);
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
