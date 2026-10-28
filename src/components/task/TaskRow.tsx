import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { memo } from 'react';
import type { Category, Task } from '../../types';
import { STATUS_META } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { Checkbox } from '../ui/Checkbox';
import { CategoryChip, DueChip, PriorityChip, ReminderIcon, SubtaskProgress } from './TaskMeta';

interface Props {
  task: Task;
  category?: Category;
  now: Date;
  overlay?: boolean;
}

export const TaskRowView = memo(function TaskRowView({ task, category, now, overlay }: Props) {
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const done = task.status === 'done';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2.5 transition-colors dark:bg-zinc-900',
        'hover:border-zinc-200 dark:hover:border-white/10',
        overlay && 'border-violet-300 shadow-2xl shadow-violet-500/10 dark:border-violet-500/40',
      )}
    >
      <GripVertical className="size-4 shrink-0 text-zinc-300 opacity-0 transition group-hover:opacity-100 dark:text-zinc-600" />
      <Checkbox checked={done} onChange={() => toggleComplete(task.id)} label={done ? 'Mark as not done' : 'Mark as done'} />
      <p
        className={cn(
          'min-w-0 flex-1 truncate text-sm font-medium',
          done && 'text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600',
        )}
      >
        {task.title}
      </p>
      <div className="hidden items-center gap-1.5 sm:flex">
        <SubtaskProgress task={task} />
        <ReminderIcon task={task} />
        {category && <CategoryChip category={category} />}
        {!done && <PriorityChip priority={task.priority} />}
      </div>
      <DueChip task={task} now={now} />
      <span
        title={STATUS_META[task.status].label}
        className={cn('hidden size-2 shrink-0 rounded-full md:block', STATUS_META[task.status].dot)}
      />
    </div>
  );
});

export function SortableTaskRow(props: Omit<Props, 'overlay'>) {
  const openEditor = useUIStore((s) => s.openEditor);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id });

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
      <TaskRowView {...props} />
    </div>
  );
}
