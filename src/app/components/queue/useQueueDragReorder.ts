import { useState, useEffect } from 'react';
import type { QueueItem } from './types';

export function useQueueDragReorder(
  items: QueueItem[],
  onReorder?: (newIds: string[]) => void
) {
  const [localItems, setLocalItems] = useState<QueueItem[]>(items);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const displayItems = activeDragIndex !== null ? localItems : items;

  useEffect(() => {
    if (activeDragIndex === null) {
      setLocalItems(items);
    }
  }, [items, activeDragIndex]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setActiveDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (activeDragIndex === null || activeDragIndex === index) return;

    const newItems = [...localItems];
    const draggedItem = newItems[activeDragIndex];
    newItems.splice(activeDragIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setActiveDragIndex(index);
    setLocalItems(newItems);
  };

  const handleDragEnd = () => {
    if (activeDragIndex !== null && onReorder) {
      onReorder(localItems.map((item) => item.id));
    }
    setActiveDragIndex(null);
  };

  return {
    displayItems,
    activeDragIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
