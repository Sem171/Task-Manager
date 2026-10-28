import { Bell, CalendarClock, ListChecks } from 'lucide-react';
import type { Category, Priority, Task } from '../../types';
import { CATEGORY_COLOR_META, PRIORITY_META } from '../../lib/constants';
import { dayDiff, formatDue } from '../../lib/date';
import { isOverdue } from '../../lib/selectors';
import { cn } from '../../lib/utils';

const chip = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none';

export function PriorityChip({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={cn(chip, 'ring-1 ring-inset', meta.chip)}>
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export function CategoryChip({ category }: { category: Category }) {
  return <span className={cn(chip, CATEGORY_COLOR_META[category.color].chip)}>{category.name}</span>;
}

export function DueChip({ task, now }: { task: Task; now: Date }) {
  if (!task.due) return null;
  const overdue = isOverdue(task, now);
  const soon = !overdue && task.status !== 'done' && dayDiff(now, new Date(task.due)) === 0;
  return (
    <span
      className={cn(
        chip,
        'font-mono tabular-nums',
        overdue
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          : soon
            ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
            : 'text-zinc-500 dark:text-zinc-400',
      )}
    >
      <CalendarClock className="size-3" />
      {formatDue(task.due, now)}
    </span>
  );
}

export function SubtaskProgress({ task }: { task: Task }) {
  if (!task.subtasks.length) return null;
  const done = task.subtasks.filter((s) => s.done).length;
  return (
    <span className={cn(chip, 'font-mono text-zinc-500 tabular-nums dark:text-zinc-400')}>
      <ListChecks className="size-3" />
      {done}/{task.subtasks.length}
    </span>
  );
}

export function ReminderIcon({ task }: { task: Task }) {
  if (task.reminder === 'none' || !task.due || task.status === 'done') return null;
  return <Bell className="size-3 text-zinc-400" aria-label="Reminder set" />;
}
