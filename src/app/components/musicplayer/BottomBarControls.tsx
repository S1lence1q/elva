import { motion } from 'motion/react';
import { List, Plus, Settings } from 'lucide-react';
import { AccentColor, ACCENT_THEMES } from '../themeUtils';

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  videoId: string;
}

interface BottomBarControlsProps {
  showQueue: boolean;
  setShowQueue: (show: boolean) => void;
  focusSearchInQueue: boolean;
  setFocusSearchInQueue: (focus: boolean) => void;
  accentColor: AccentColor;
  queue: QueueItem[];
  showSettingsButton: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  isUserIdle: boolean;
  zenMode: boolean;
  showLyrics: boolean;
  isLargeScreen: boolean;
}

const accentBgs: Record<AccentColor, string> = {
  emerald: 'bg-emerald-500',
  sand: 'bg-amber-500',
  wine: 'bg-rose-500',
  navy: 'bg-slate-500'
};

export function BottomBarControls({
  showQueue,
  setShowQueue,
  focusSearchInQueue,
  setFocusSearchInQueue,
  accentColor,
  queue,
  showSettingsButton,
  showSettings,
  setShowSettings,
  isUserIdle,
  zenMode,
  showLyrics,
  isLargeScreen
}: BottomBarControlsProps) {
  const theme = ACCENT_THEMES[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, x: 0 }}
      animate={{ 
        opacity: isUserIdle && zenMode ? 0 : 1,
        x: showLyrics && isLargeScreen ? -284 : 0
      }}
      transition={{ 
        opacity: { duration: 0.7 },
        x: { type: 'spring', stiffness: 180, damping: 25 }
      }}
      className={`mt-8 flex items-center justify-center gap-3 ${isUserIdle && zenMode ? 'pointer-events-none' : ''}`}
    >
      <div className="flex items-center rounded-full bg-black/35 border border-white/12 overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
        <button
          id="add-music-button"
          onClick={() => {
            if (showQueue && focusSearchInQueue) {
              setShowQueue(false);
            } else {
              setFocusSearchInQueue(true);
              setShowQueue(true);
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 transition-all cursor-pointer ${
            showQueue && focusSearchInQueue
              ? `bg-white/[0.08] ${theme.textLight}`
              : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
          }`}
        >
          <Plus className={`w-4 h-4 transition-colors ${showQueue && focusSearchInQueue ? theme.text : 'text-white/40'}`} />
          <span className="text-sm font-medium tracking-wide">Add Music</span>
        </button>

        <div className="h-5 w-[1px] bg-white/10 shrink-0" />

        <button
          id="queue-button"
          onClick={() => {
            if (showQueue && !focusSearchInQueue) {
              setShowQueue(false);
            } else {
              setFocusSearchInQueue(false);
              setShowQueue(true);
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 transition-all cursor-pointer relative ${
            showQueue && !focusSearchInQueue
              ? `bg-white/[0.08] ${theme.textLight}`
              : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
          }`}
        >
          <List className={`w-4 h-4 transition-colors ${showQueue && !focusSearchInQueue ? theme.text : 'text-white/40'}`} />
          <span className="text-sm font-medium tracking-wide">Queue</span>
          {queue.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all leading-none ${
              showQueue && !focusSearchInQueue
                ? `${accentBgs[accentColor]} text-white`
                : 'bg-white/10 text-white/60'
            }`}>
              {queue.length}
            </span>
          )}
        </button>
      </div>

      {showSettingsButton && (
        <button
          id="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/30 hover:bg-black/45 border border-white/12 hover:border-white/25 transition-all group"
        >
          <Settings className="w-4 h-4 text-white/60 group-hover:text-white/85 transition-colors" />
          <span className="text-sm text-white/85 group-hover:text-white transition-colors">Settings</span>
        </button>
      )}
    </motion.div>
  );
}
