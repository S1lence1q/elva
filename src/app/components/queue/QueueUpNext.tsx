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
    <div className="space-y-3">
      <div className="flex items-center justify-between select-none">
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/35">Up Next</h3>
        {items.length > 0 && (
          <div className="flex items-center gap-3">
            {onShuffleQueue && (
              <>
                <button
                  onClick={onShuffleQueue}
                  className={`text-[9px] uppercase tracking-widest font-bold transition-colors cursor-pointer ${theme.text} ${theme.textHover}`}
                >
                  Shuffle
                </button>
                <span className="text-white/10 text-[9px]">|</span>
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
              className="text-[9px] uppercase tracking-widest text-white/30 hover:text-red-400 font-bold transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="queue-empty-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4 py-6 px-3 select-none text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-white/20" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/40">Queue is empty</h4>
                <p className="text-[11px] text-white/20 mt-0.5">Add tracks from below</p>
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
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => onSelect(item.id)}
                  className={`group relative w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-200 cursor-grab active:cursor-grabbing ${
                    isDraggingItem ? 'opacity-25 scale-[0.97]' : ''
                  } ${
                    isCurrent
                      ? 'bg-white/[0.05]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Left accent stripe for current song */}
                  {isCurrent && (
                    <div
                      className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${theme.borderT} bg-current`}
                      style={{ background: 'var(--theme-primary)' }}
                    />
                  )}

                  <div className="flex items-center gap-3 truncate mr-2 flex-1 min-w-0">
                    {/* Drag handle */}
                    <div className="text-white/15 group-hover:text-white/30 transition-colors shrink-0 cursor-grab">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-white/5">
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
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center gap-[2.5px] z-10">
                          <div className="eq-bar-1 w-[2.5px] rounded-full bg-white" style={{ height: '3px' }} />
                          <div className="eq-bar-2 w-[2.5px] rounded-full bg-white" style={{ height: '8px' }} />
                          <div className="eq-bar-3 w-[2.5px] rounded-full bg-white" style={{ height: '5px' }} />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="text-left truncate min-w-0">
                      <h4
                        className={`text-sm font-medium truncate leading-tight transition-colors ${
                          isCurrent ? 'text-white' : 'text-white/75 group-hover:text-white/95'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-white/35 truncate mt-0.5 font-normal">{item.artist}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                      toast.info('Removed from queue');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/8 rounded-lg transition-all shrink-0 cursor-pointer text-white/35 hover:text-white/65"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
