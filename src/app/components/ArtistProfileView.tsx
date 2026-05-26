import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Plus, Music } from 'lucide-react';
import { SearchResult, VerifiedArtist } from '../types';
import { ThemeColors } from './themeUtils';

interface ArtistProfileViewProps {
  selectedArtist: VerifiedArtist;
  artistColors: {
    accent: string;
    glow: string;
    bgGlow: string;
    solidGlow: string;
    gradient: string;
    rgbaGlow: string;
  } | null;
  artistTracks: SearchResult[];
  isLoadingArtist: boolean;
  focusedResultIndex: number;
  loadingSongId: string | null;
  handleSelectSong: (track: SearchResult) => void;
  handleAddToQueue: (track: SearchResult) => void;
  setSelectedArtist: (artist: VerifiedArtist | null) => void;
  setArtistTracks: (tracks: SearchResult[]) => void;
  theme: ThemeColors;
}

export const ArtistProfileView: React.FC<ArtistProfileViewProps> = ({
  selectedArtist,
  artistColors,
  artistTracks,
  isLoadingArtist,
  focusedResultIndex,
  loadingSongId,
  handleSelectSong,
  handleAddToQueue,
  setSelectedArtist,
  setArtistTracks,
  theme
}) => {
  return (
    <motion.div
      key="immersive-artist-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl px-4 flex flex-col h-[calc(100vh-80px)] overflow-y-auto scrollbar-none z-10"
    >
      {/* Navigation bar above the layout */}
      <div className="flex items-center justify-between w-full pb-3 border-b border-white/5 shrink-0 px-2 select-none">
        <button
          onClick={() => {
            setSelectedArtist(null);
            setArtistTracks([]);
          }}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-all cursor-pointer group/back text-xs font-semibold py-1 px-3 rounded-full hover:bg-white/5 -ml-3"
          title="Back to search results"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover/back:-translate-x-0.5 transition-transform" />
          <span>Back to Search</span>
        </button>
        <div 
          className="text-lg tracking-[0.2em] uppercase font-light text-white select-none cursor-pointer hover:opacity-85 transition-opacity -mr-2"
          style={{ fontFamily: '"Kaobe", serif' }}
          onClick={() => {
            setSelectedArtist(null);
            setArtistTracks([]);
          }}
        >
          Elva
        </div>
      </div>

      {/* Immersive Widescreen Artist Hero Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.01] backdrop-blur-2xl shadow-2xl py-4 px-6 md:py-5 md:px-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 shrink-0 mt-4">
        {/* Ambient dynamic theme glow behind/inside the banner */}
        {artistColors && (
          <div 
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[75px] opacity-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${artistColors.solidGlow} 0%, rgba(255,255,255,0) 70%)`
            }}
          />
        )}
        
        {/* Giant circular avatar with high-end border */}
        <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl transition-transform duration-500 hover:scale-105 shrink-0 z-10">
          <img src={selectedArtist.thumbnail} alt={selectedArtist.name} className="w-full h-full object-cover scale-105" />
        </div>
        
        {/* Hero Info Text (aligned bottom-left on desktop) */}
        <div className="flex flex-col text-center md:text-left relative z-10">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="flex items-center gap-1 text-[9px] font-bold text-white/50 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              ✦ Verified Artist
            </span>
          </div>
          
          <h2 
            className="text-5xl md:text-7xl lg:text-8xl font-normal text-white mt-3 md:mt-4 tracking-wide leading-none"
            style={{ fontFamily: '"Kaobe", serif' }}
          >
            {selectedArtist.name}
          </h2>
          
          <p className="text-[10px] md:text-xs text-white/40 font-bold tracking-[0.25em] uppercase mt-3 md:mt-4">
            {selectedArtist.name.toLowerCase().includes('kesi') || selectedArtist.name.toLowerCase().includes('kundo')
              ? 'DANISH RAPPER • DK'
              : (() => {
                  const countryText = selectedArtist.country ? selectedArtist.country.toUpperCase() : 'DK';
                  const tags = (selectedArtist.tags || []).slice(0, 2).map(t => t.toUpperCase());
                  if (tags.length === 0) tags.push('ARTIST');
                  return `${tags.join(' • ')} • ${countryText}`;
                })()
            }
          </p>
        </div>
      </div>

      {/* Single Column Discography (Full Width & Premium Center-aligned) */}
      <div className="flex flex-col gap-6 mt-6 pb-24 w-full max-w-4xl mx-auto">
        
        {/* COLUMN 1: Discography Section */}
        <div className="w-full flex flex-col relative">

          <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0 z-10 relative">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Official Releases</span>
            <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-md">
              {artistTracks.length} tracks
            </span>
          </div>
          
          {/* Spacious track list flowing naturally */}
          <div className="w-full space-y-2 mt-4 z-10 relative">
            {isLoadingArtist ? (
              /* Pulsing skeleton list */
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-white/[0.02] bg-white/[0.01] animate-pulse">
                    <div className="w-4 h-4 bg-white/5 rounded shrink-0" />
                    <div className="w-10 h-10 bg-white/5 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-1/3 h-3 bg-white/10 rounded" />
                      <div className="w-1/4 h-2 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : artistTracks.length === 0 ? (
              <div className="py-16 text-center text-white/30">
                <Music className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">No songs found</p>
                <p className="text-[10px] text-white/20 mt-1">Please try searching directly or another artist.</p>
              </div>
            ) : (
              <div className="space-y-0 flex flex-col bg-transparent">
                {artistTracks.map((track, index) => {
                  const isFocused = focusedResultIndex === index;
                  const trackNumber = String(index + 1).padStart(2, '0');
                  return (
                    <motion.div
                      key={`artist-track-${track.id}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, ease: "easeOut" }}
                      className={`group w-full flex items-center gap-4 py-3.5 px-2 border-b border-white/5 last:border-b-0 bg-transparent transition-colors duration-200 hover:bg-white/[0.02] cursor-pointer ${
                        loadingSongId === track.id
                          ? 'bg-white/[0.03]'
                          : isFocused
                          ? 'bg-white/[0.04]'
                          : ''
                      }`}
                      onClick={() => {
                        if (!loadingSongId) handleSelectSong(track);
                      }}
                    >
                      <span className="text-[10px] font-mono text-white/25 group-hover:text-white/45 transition-colors shrink-0 w-6 text-right">
                        {trackNumber}
                      </span>

                      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5 shadow-md">
                        <img 
                          src={track.thumbnail} 
                          alt={track.title} 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`;
                          }}
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {loadingSongId === track.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                              className={`w-4 h-4 rounded-full border border-white/20 ${theme.borderT}`}
                            />
                          ) : (
                            <Play className="w-4 h-4 text-white fill-white scale-90" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2.5">
                          <h3 className={`text-sm md:text-base font-semibold truncate transition-colors duration-300 ${
                            loadingSongId === track.id ? `${theme.text}` : 'text-white/90 group-hover:text-white tracking-tight'
                          }`}>
                            {track.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToQueue(track);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded cursor-pointer shrink-0"
                            title="Add to queue"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-white/40 truncate mt-0.5 font-light">
                          {track.artist}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
