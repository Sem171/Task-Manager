import type { SmartView, Task } from '../types';
import { PRIORITY_META, REMINDER_META } from './constants';
import { addDays, dayDiff, isSameDay, startOfDay } from './date';

export interface TaskFilter {
  view: SmartView;
  categoryId: string | null;
  search: string;
}

export function isOverdue(task: Task, now = new Date()): boolean {
  return task.status !== 'done' && !!task.due && new Date(task.due) < now;
}

export function matchesView(task: Task, view: SmartView, now = new Date()): boolean {
  const due = task.due ? new Date(task.due) : null;
  switch (view) {
    case 'all':
      return true;
    case 'today':
      return !!due && isSameDay(due, now);
    case 'upcoming': {
      const tomorrow = addDays(startOfDay(now), 1);
      return task.status !== 'done' && !!due && due >= tomorrow && due < addDays(tomorrow, 7);
    }
    case 'overdue':
      return isOverdue(task, now);
    case 'completed':
      return task.status === 'done';
  }
}

export function filterTasks(tasks: Task[], { view, categoryId, search }: TaskFilter): Task[] {
  const now = new Date();
  const q = search.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      matchesView(t, view, now) &&
      (!categoryId || t.categoryId === categoryId) &&
      (!q || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)),
  );
}

/** When a task's reminder should fire, or null if it has none. */
export function reminderTime(task: Task): Date | null {
  const offset = REMINDER_META[task.reminder].offsetMs;
  if (offset === null || !task.due) return null;
  if (task.snoozedUntil) return new Date(task.snoozedUntil);
  return new Date(new Date(task.due).getTime() - offset);
}

/**
 * Ranks open tasks by urgency: priority weight plus pressure from the due date.
 * Used for the "Up next" suggestion.
 */
export function suggestNext(tasks: Task[], now = new Date()): Task | null {
  let best: Task | null = null;
  let bestScore = -Infinity;
  for (const t of tasks) {
    if (t.status === 'done') continue;
    let score = PRIORITY_META[t.priority].weight * 10;
    if (t.due) {
      const days = dayDiff(now, new Date(t.due));
      score += days < 0 ? 40 : Math.max(0, 30 - days * 6);
    }
    if (t.status === 'in_progress') score += 8;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

export interface Stats {
  total: number;
  done: number;
  inProgress: number;
  dueToday: number;
  overdue: number;
  completionRate: number;
  /** Completions for each of the last 7 days, oldest first. */
  week: { date: Date; count: number }[];
  streak: number;
}

export function computeStats(tasks: Task[], now = new Date()): Stats {
  const today = startOfDay(now);
  const week = Array.from({ length: 7 }, (_, i) => ({ date: addDays(today, i - 6), count: 0 }));
  let done = 0, inProgress = 0, dueToday = 0, overdue = 0;

  for (const t of tasks) {
    if (t.status === 'done') done++;
    if (t.status === 'in_progress') inProgress++;
    if (t.due && t.status !== 'done' && isSameDay(new Date(t.due), now)) dueToday++;
    if (isOverdue(t, now)) overdue++;
    if (t.completedAt) {
      const idx = 6 - dayDiff(new Date(t.completedAt), now);
      if (idx >= 0 && idx < 7) week[idx].count++;
    }
  }

  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    if (week[i].count > 0) streak++;
    else if (i !== 6) break; // today not finished yet is fine
  }

  return {
    total: tasks.length,
    done,
    inProgress,
    dueToday,
    overdue,
    completionRate: tasks.length ? done / tasks.length : 0,
    week,
    streak,
  };
}
