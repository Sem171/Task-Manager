import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import type { Category, Task } from '../../types';
import { SortableTaskRow, TaskRowView } from '../task/TaskRow';
import { useTaskDnd } from './useTaskDnd';

interface Props {
  tasks: Task[];
  categories: Map<string, Category>;
  now: Date;
}

/** Flat list; open tasks first, completed tasks in a quieter section below. */
export function ListView({ tasks, categories, now }: Props) {
  const { activeId, sensors, handlers } = useTaskDnd();
  const open = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks]);
  const active = activeId ? tasks.find((t) => t.id === activeId) : undefined;
  const cat = (t: Task) => (t.categoryId ? categories.get(t.categoryId) : undefined);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} {...handlers}>
      <div className="surface p-2">
        <Group tasks={open} cat={cat} now={now} />
        {done.length > 0 && (
          <>
            <p className="px-3 pt-4 pb-2 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
              Completed · {done.length}
            </p>
            <Group tasks={done} cat={cat} now={now} />
          </>
        )}
      </div>
      <DragOverlay>{active ? <TaskRowView task={active} category={cat(active)} now={now} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}

function Group({ tasks, cat, now }: { tasks: Task[]; cat: (t: Task) => Category | undefined; now: Date }) {
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <SortableTaskRow task={task} category={cat(task)} now={now} />
          </motion.div>
        ))}
      </AnimatePresence>
    </SortableContext>
  );
}
