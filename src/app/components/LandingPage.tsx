import { motion, AnimatePresence } from 'motion/react';
import { VerifiedArtist, SearchResult } from '../types';
import { Playlist } from './PlaylistDetailsView';
import { AccentColor } from './themeUtils';
import { BrandingHeader } from './BrandingHeader';
import { SearchSection } from './SearchSection';
import { DiscoverView } from './DiscoverView';
import { ProfileHubView } from './ProfileHubView';
import { ArtistProfileView } from './ArtistProfileView';
import { PlaylistDetailsView } from './PlaylistDetailsView';

interface LandingPageProps {
  isIntroActive: boolean;
  scrollProgress: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  selectedArtist: VerifiedArtist | null;
  setSelectedArtist: React.Dispatch<React.SetStateAction<VerifiedArtist | null>>;
  selectedPlaylist: Playlist | null;
  setSelectedPlaylist: React.Dispatch<React.SetStateAction<Playlist | null>>;
  accentColor: AccentColor;
  theme: any;
  hasSeenTour: boolean;
  tourType: 'landing' | 'player' | null;
  startTour: () => void;
  isFirstVisit: boolean;
  hasSelectedArtistOnce: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lastSearchedQuery: string;
  isSearching: boolean;
  searchResults: SearchResult[];
  recentArtists: VerifiedArtist[];
  recentlyPlayed: SearchResult[];
  verifiedArtist: VerifiedArtist | null;
  focusedResultIndex: number;
  loadingSongId: string | null;
  artistColors: any;
  artistTracks: SearchResult[];
  isLoadingArtist: boolean;
  favorites: SearchResult[];
  handleSelectSong: (song: SearchResult) => void;
  handleAddToQueue: (song: SearchResult) => void;
  handlePlayNext: (song: SearchResult) => void;
  handleToggleFavorite: (song: SearchResult) => void;
  handleViewArtistProfile: (artist: VerifiedArtist) => void;
  handleViewArtistByName: (name: string, channelId?: string) => void;
  handleUrlSubmit: (url: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function LandingPage({
  isIntroActive,
  scrollProgress,
  scrollContainerRef,
  selectedArtist,
  setSelectedArtist,
  selectedPlaylist,
  setSelectedPlaylist,
  accentColor,
  theme,
  hasSeenTour,
  tourType,
  startTour,
  isFirstVisit,
  hasSelectedArtistOnce,
  searchQuery,
  setSearchQuery,
  lastSearchedQuery,
  isSearching,
  searchResults,
  recentArtists,
  recentlyPlayed,
  verifiedArtist,
  focusedResultIndex,
  loadingSongId,
  artistColors,
  artistTracks,
  isLoadingArtist,
  favorites,
  handleSelectSong,
  handleAddToQueue,
  handlePlayNext,
  handleToggleFavorite,
  handleViewArtistProfile,
  handleViewArtistByName,
  handleUrlSubmit,
  handleFileSelect
}: LandingPageProps) {
  return (
    <motion.div
      key="landing"
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-10 flex flex-col items-center px-0 w-full h-full justify-start"
    >
      {/* Animated gradient orbs during intro */}
      {isIntroActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.2, 0.3, 0], scale: [0.8, 1.25, 1.55, 2.1] }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute w-[950px] h-[950px] rounded-full blur-[140px] bg-gradient-to-tr from-indigo-950/20 via-blue-900/10 to-transparent pointer-events-none z-0"
        />
      )}

      {/* Localized deep dark radial gradient vignette centered behind UI elements for razor-sharp readability */}
      {selectedArtist === null && selectedPlaylist === null && searchQuery.trim() === '' && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[880px] h-[520px] rounded-full pointer-events-none z-0 opacity-[0.04]" 
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.45) 45%, rgba(0,0,0,0) 80%)',
            filter: 'blur(35px)'
          }}
        />
      )}

      {/* Fixed Branding Tag */}
      {selectedArtist === null && selectedPlaylist === null && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: scrollProgress > 0.15 ? 1 : 0, 
            y: scrollProgress > 0.15 ? 0 : -10 
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed top-6 left-6 z-40 select-none"
          style={{ pointerEvents: scrollProgress > 0.15 ? 'auto' : 'none' }}
        >
          <button
            onClick={() => {
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }
            }}
            className="text-2xl font-normal tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60 hover:opacity-80 cursor-pointer transition-all focus:outline-none"
            style={{ fontFamily: '"Kaobe", serif' }}
          >
            Elva
          </button>
        </motion.div>
      )}

      {/* Floating Dot Navigator */}
      {selectedArtist === null && selectedPlaylist === null && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-40"
        >
          {[
            { id: 'search', label: 'Search & Home' },
            { id: 'discover', label: 'Discover Charts' },
            { id: 'myhub', label: 'My Hub Profile' }
          ].map((dot, index) => {
            let isActive = false;
            if (index === 0 && scrollProgress < 0.25) isActive = true;
            else if (index === 1 && scrollProgress >= 0.25 && scrollProgress < 0.75) isActive = true;
            else if (index === 2 && scrollProgress >= 0.75) isActive = true;

            const handleDotClick = () => {
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollTo({
                  top: index * container.clientHeight,
                  behavior: 'smooth'
                });
              }
            };

            return (
              <button
                key={dot.id}
                onClick={handleDotClick}
                className="group relative flex items-center justify-end cursor-pointer focus:outline-none bg-transparent border-none p-0"
                title={dot.label}
              >
                {/* Label Tooltip */}
                <span className="absolute right-8 text-[10px] font-semibold uppercase tracking-widest text-white/40 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/5 whitespace-nowrap pointer-events-none select-none">
                  {dot.label}
                </span>
                
                {/* Interactive Dot */}
                <div className="relative flex items-center justify-center w-6 h-6">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.25 : 1,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                      boxShadow: isActive 
                        ? `0 0 15px rgba(255, 255, 255, 0.6), 0 0 5px rgba(255, 255, 255, 0.3)`
                        : 'none'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-2 h-2 rounded-full border border-white/10 group-hover:bg-white/40 transition-colors"
                  />
                </div>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Immersive Widescreen Overlay Details Views */}
      <AnimatePresence>
        {selectedArtist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-30 flex flex-col items-center justify-center pt-8 pb-12"
          >
            <ArtistProfileView
              selectedArtist={selectedArtist}
              artistColors={artistColors}
              artistTracks={artistTracks}
              isLoadingArtist={isLoadingArtist}
              focusedResultIndex={focusedResultIndex}
              loadingSongId={loadingSongId}
              handleSelectSong={handleSelectSong}
              handleAddToQueue={handleAddToQueue}
              setSelectedArtist={setSelectedArtist}
              setArtistTracks={setArtistTracks}
              theme={theme}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onPlayNext={handlePlayNext}
            />
          </motion.div>
        )}

        {selectedPlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-30 bg-[#0a0a0c]/90 backdrop-blur-2xl flex flex-col items-center justify-center pt-8 pb-12"
          >
            <PlaylistDetailsView
              playlist={selectedPlaylist}
              onClose={() => setSelectedPlaylist(null)}
              loadingSongId={loadingSongId}
              handleSelectSong={handleSelectSong}
              handleAddToQueue={handleAddToQueue}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onPlayNext={handlePlayNext}
              accentColor={accentColor}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Stack Viewport Snap-Scrolling Container */}
      <motion.div
        ref={scrollContainerRef}
        animate={{
          opacity: (selectedArtist !== null || selectedPlaylist !== null) ? 0 : 1,
          scale: (selectedArtist !== null || selectedPlaylist !== null) ? 0.96 : 1,
          y: (selectedArtist !== null || selectedPlaylist !== null) ? -16 : 0,
          filter: (selectedArtist !== null || selectedPlaylist !== null) ? 'blur(4px)' : 'blur(0px)'
        }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-none flex flex-col relative z-10"
        style={{
          pointerEvents: (selectedArtist !== null || selectedPlaylist !== null) ? 'none' : 'auto'
        }}
      >
        {/* SECTION 1: Search & Home */}
        <section className="w-full h-full snap-start shrink-0 flex flex-col items-center justify-start relative px-0 pt-16 pb-24 overflow-y-auto scrollbar-none">
          <div className="w-full flex flex-col items-center overflow-hidden shrink-0">
            <div className="h-6 md:h-10 shrink-0 w-full" />
            <BrandingHeader
              accentColor={accentColor}
              hasSeenTour={hasSeenTour}
              tourType={tourType}
              startTour={startTour}
              isFirstVisit={isFirstVisit}
              hasSelectedArtist={hasSelectedArtistOnce}
            />
          </div>
          
          <div className="w-full flex flex-col items-center justify-start mt-6">
            <SearchSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              lastSearchedQuery={lastSearchedQuery}
              isSearching={isSearching}
              searchResults={searchResults}
              recentArtists={recentArtists}
              recentlyPlayed={recentlyPlayed}
              verifiedArtist={verifiedArtist}
              focusedResultIndex={focusedResultIndex}
              loadingSongId={loadingSongId}
              handleViewArtistProfile={handleViewArtistProfile}
              handleUrlSubmit={handleUrlSubmit}
              handleSearch={handleSearch}
              handleSelectSong={handleSelectSong}
              handleAddToQueue={handleAddToQueue}
              handlePlayNext={handlePlayNext}
              handleFileSelect={handleFileSelect}
              theme={theme}
              isFirstVisit={isFirstVisit}
              hasSelectedArtist={hasSelectedArtistOnce}
            />
          </div>
        </section>

        {/* SECTION 2: Discover */}
        <section className="w-full h-full snap-start shrink-0 flex flex-col items-center justify-start relative px-0 pt-16 pb-24 overflow-y-auto scrollbar-none">
          {/* Custom Section Header */}
          <div className="w-full max-w-[898px] px-6 mb-4 flex items-center justify-between shrink-0 select-none">
            <h2 className="text-2xl font-normal tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60" style={{ fontFamily: '"Kaobe", serif' }}>
              Discover
            </h2>
          </div>

          <DiscoverView
            onSelectSong={handleSelectSong}
            onAddToQueue={handleAddToQueue}
            onPlayNext={handlePlayNext}
            accentColor={accentColor}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPlaylist={setSelectedPlaylist}
          />
        </section>

        {/* SECTION 3: My Hub */}
        <section className="w-full h-full snap-start shrink-0 flex flex-col items-center justify-start relative px-0 pt-16 pb-24 overflow-y-auto scrollbar-none">
          {/* Custom Section Header */}
          <div className="w-full max-w-[898px] px-6 mb-4 flex items-center justify-between shrink-0 select-none">
            <h2 className="text-2xl font-normal tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60" style={{ fontFamily: '"Kaobe", serif' }}>
              My Hub
            </h2>
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Your Personal Vibe</span>
          </div>

          <ProfileHubView
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectSong={handleSelectSong}
            onAddToQueue={handleAddToQueue}
            accentColor={accentColor}
            onSelectArtist={handleViewArtistProfile}
            onPlayNext={handlePlayNext}
          />
        </section>
      </motion.div>

      {/* Subtle grid overlay for depth */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }} />
      </div>
    </motion.div>
  );
}
