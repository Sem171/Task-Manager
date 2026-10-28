import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';
import type { Status } from '../../types';
import { useTaskStore } from '../../store/taskStore';

export const COLUMN_PREFIX = 'column:';

/**
 * Drag-and-drop wiring shared by the board and list views. Cross-column moves
 * happen live in onDragOver; same-column reordering is committed on drop.
 */
export function useTaskDnd() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const statusOf = (id: string): Status | undefined => {
    if (id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length) as Status;
    return useTaskStore.getState().tasks.find((t) => t.id === id)?.status;
  };

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);
    const from = statusOf(id);
    const to = statusOf(overId);
    if (!from || !to || from === to) return;
    useTaskStore.getState().moveToStatus(id, to, overId.startsWith(COLUMN_PREFIX) ? undefined : overId);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);
    const to = statusOf(overId);
    const store = useTaskStore.getState();
    if (to && to !== statusOf(id)) {
      store.moveToStatus(id, to, overId.startsWith(COLUMN_PREFIX) ? undefined : overId);
    } else if (id !== overId && !overId.startsWith(COLUMN_PREFIX)) {
      store.reorder(id, overId);
    }
  };

  return {
    activeId,
    sensors,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: () => setActiveId(null) },
  };
}
