import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';
import type { Category, Task } from '../../types';
import { PRIORITY_META } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { Checkbox } from '../ui/Checkbox';
import { CategoryChip, DueChip, PriorityChip, ReminderIcon, SubtaskProgress } from './TaskMeta';

interface CardProps {
  task: Task;
  category?: Category;
  now: Date;
  overlay?: boolean;
}

/** Visual card, shared by the sortable item and the drag overlay. */
export const TaskCardView = memo(function TaskCardView({ task, category, now, overlay }: CardProps) {
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const done = task.status === 'done';
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-white p-3.5 transition-[box-shadow,border-color,transform] duration-200',
        'border-zinc-200/80 hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-950/[0.04]',
        'dark:border-white/[0.07] dark:bg-zinc-900 dark:hover:border-white/15 dark:hover:shadow-black/30',
        overlay && 'rotate-[1.5deg] cursor-grabbing border-violet-300 shadow-2xl shadow-violet-500/10 dark:border-violet-500/40',
      )}
    >
      <span className={cn('absolute inset-y-3 left-0 w-[3px] rounded-r-full opacity-80', PRIORITY_META[task.priority].dot)} />
      <div className="flex items-start gap-2.5">
        <Checkbox
          checked={done}
          onChange={() => toggleComplete(task.id)}
          label={done ? 'Mark as not done' : 'Mark as done'}
          className="mt-px"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[13.5px] leading-snug font-medium text-pretty transition-colors',
              done && 'text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600',
            )}
          >
            {task.title}
          </p>
          {task.notes && !done && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{task.notes}</p>
          )}
        </div>
      </div>

      {task.subtasks.length > 0 && !done && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-[width] duration-500"
            style={{ width: `${(subDone / task.subtasks.length) * 100}%` }}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {!done && <PriorityChip priority={task.priority} />}
        {category && <CategoryChip category={category} />}
        <DueChip task={task} now={now} />
        <SubtaskProgress task={task} />
        <span className="ml-auto">
          <ReminderIcon task={task} />
        </span>
      </div>
    </div>
  );
});

export function SortableTaskCard(props: Omit<CardProps, 'overlay'>) {
  const openEditor = useUIStore((s) => s.openEditor);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
    data: { status: props.task.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => openEditor(props.task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openEditor(props.task.id);
        else listeners?.onKeyDown?.(e);
      }}
      aria-label={props.task.title}
      className={cn(
        'cursor-grab touch-manipulation rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
        isDragging && 'opacity-30',
      )}
    >
      <TaskCardView {...props} />
    </div>
  );
}
