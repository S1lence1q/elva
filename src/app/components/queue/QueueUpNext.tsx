import { motion, AnimatePresence } from 'motion/react';
import { Music, Play, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { AccentColor } from '../themeUtils';
import { ACCENT_THEMES } from '../themeUtils';
import type { QueueItem } from './types';
import { listItemEnter } from '../../utils/motionPresets';

interface QueueUpNextProps {
  items: QueueItem[];
  displayItems: QueueItem[];
  currentSongId?: string;
  songData?: { title: string; artist: string; videoId?: string };
  accentColor: AccentColor;
  activeDragIndex: number | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClearQueue?: () => void;
  onShuffleQueue?: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export function QueueUpNext({
  items,
  displayItems,
  currentSongId,
  songData,
  accentColor,
  activeDragIndex,
  onSelect,
  onRemove,
  onClearQueue,
  onShuffleQueue,
  onDragStart,
  onDragOver,
  onDragEnd,
}: QueueUpNextProps) {
  const theme = ACCENT_THEMES[accentColor];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between select-none">
        <h3 className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Up Next</h3>
        {items.length > 0 && (
          <div className="flex items-center gap-3">
            {onShuffleQueue && (
              <>
                <button
                  onClick={onShuffleQueue}
                  className="text-[9px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                >
                  Shuffle Queue
                </button>
                <span className="text-white/10 text-[9px] font-light">|</span>
              </>
            )}
            <button
              onClick={() => {
                if (onClearQueue) {
                  onClearQueue();
                } else {
                  items.forEach((it) => onRemove(it.id));
                  toast.info('Queue cleared');
                }
              }}
              className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
            >
              Clear Queue
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="queue-empty-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3.5 p-4.5 rounded-2xl border border-white/[0.08] bg-[#0a0b10]/40 select-none text-left min-h-[88px] shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl border border-white/[0.08] bg-[#1a1b24]/40 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-white/20 animate-pulse" />
              </div>
              <div className="truncate">
                <h4 className="text-sm font-semibold text-white/50 tracking-wide leading-tight">Your queue is empty</h4>
                <p className="text-[10px] text-white/25 mt-1.5 leading-snug font-medium truncate max-w-[240px]">
                  Add tracks from likes or playlists below
                </p>
              </div>
            </motion.div>
          ) : (
            displayItems.map((item, index) => {
              const isCurrent =
                (item.videoId && item.videoId === currentSongId) ||
                (songData &&
                  item.title.toLowerCase() === songData.title.toLowerCase() &&
                  item.artist.toLowerCase() === songData.artist.toLowerCase());
              const isDraggingItem = index === activeDragIndex;

              return (
                <motion.div
                  key={`queue-item-${item.id}`}
                  layout
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragEnd={onDragEnd}
                  {...listItemEnter(index)}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelect(item.id)}
                  className={`group w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-grab active:cursor-grabbing ${
                    isDraggingItem ? 'opacity-30 border-dashed border-white/20 bg-white/5 scale-[0.98]' : ''
                  } ${
                    isCurrent
                      ? `bg-white/[0.06] border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${theme.border} shadow-[0_0_12px_var(--theme-primary-fade)]`
                      : 'bg-[#0a0b10]/45 border-white/[0.04] hover:border-white/10 hover:bg-[#13141b]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-3 flex-1">
                    <div className="text-white/20 group-hover:text-white/40 transition-colors shrink-0">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/8 bg-white/5 z-10">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
                        }}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-[2.5px] pb-1.5 z-10">
                          <div className="eq-bar-1 w-[3px] rounded-full bg-white" style={{ height: '3px' }} />
                          <div className="eq-bar-2 w-[3px] rounded-full bg-white" style={{ height: '8px' }} />
                          <div className="eq-bar-3 w-[3px] rounded-full bg-white" style={{ height: '5px' }} />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      )}
                    </div>
                    <div className="text-left truncate">
                      <h4
                        className={`text-sm font-semibold truncate tracking-wide leading-tight transition-colors ${
                          isCurrent ? theme.text : 'text-white/85 group-hover:text-white'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-white/40 truncate mt-1 leading-none font-medium">{item.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                      toast.info('Removed from queue');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-xl transition-all shrink-0 cursor-pointer text-white/45 hover:text-white/70"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
