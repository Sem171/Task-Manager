import { closestCorners, DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import type { Category, Status, Task } from '../../types';
import { STATUS_META, STATUS_ORDER } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';
import { SortableTaskCard, TaskCardView } from '../task/TaskCard';
import { COLUMN_PREFIX, useTaskDnd } from './useTaskDnd';

interface Props {
  tasks: Task[];
  categories: Map<string, Category>;
  now: Date;
}

export function Board({ tasks, categories, now }: Props) {
  const { activeId, sensors, handlers } = useTaskDnd();

  const columns = useMemo(() => {
    const map: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  const active = activeId ? tasks.find((t) => t.id === activeId) : undefined;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} {...handlers}>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-thin md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {STATUS_ORDER.map((status) => (
          <Column key={status} status={status} tasks={columns[status]} categories={categories} now={now} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {active ? (
          <TaskCardView
            task={active}
            category={active.categoryId ? categories.get(active.categoryId) : undefined}
            now={now}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  tasks,
  categories,
  now,
}: {
  status: Status;
  tasks: Task[];
  categories: Map<string, Category>;
  now: Date;
}) {
  const openEditor = useUIStore((s) => s.openEditor);
  const { setNodeRef, isOver } = useDroppable({ id: COLUMN_PREFIX + status });
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <section
      aria-label={STATUS_META[status].label}
      className="flex w-[85vw] max-w-sm shrink-0 snap-start flex-col sm:w-80 md:w-auto md:max-w-none"
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={cn('size-2 rounded-full', STATUS_META[status].dot)} />
        <h2 className="text-sm font-semibold tracking-tight">{STATUS_META[status].label}</h2>
        <span className="font-mono text-xs text-zinc-400 tabular-nums">{tasks.length}</span>
        <button
          onClick={() => openEditor(null, status)}
          aria-label={`Add task to ${STATUS_META[status].label}`}
          className="ml-auto rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-200"
        >
          <Plus className="size-4" />
        </button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-40 flex-1 flex-col gap-2.5 rounded-2xl p-1.5 transition-colors duration-200',
          isOver ? 'bg-violet-500/[0.06] ring-1 ring-violet-500/20' : 'bg-zinc-100/60 dark:bg-white/[0.02]',
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <SortableTaskCard
                  task={task}
                  category={task.categoryId ? categories.get(task.categoryId) : undefined}
                  now={now}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {tasks.length === 0 && (
          <button
            onClick={() => openEditor(null, status)}
            className="grid flex-1 place-items-center rounded-xl border border-dashed border-zinc-300/80 py-10 text-xs text-zinc-400 transition hover:border-violet-400 hover:text-violet-500 dark:border-white/10"
          >
            {status === 'done' ? 'Drop finished work here' : 'Drop a task here, or click to add'}
          </button>
        )}
      </div>
    </section>
  );
}
