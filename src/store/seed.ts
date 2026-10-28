import type { Category, Task } from '../types';
import { addDays, atTime, startOfDay } from '../lib/date';
import { uid } from '../lib/utils';

/** Starter content shown on first launch so the dashboard isn't empty. */
export function createSeed(): { tasks: Task[]; categories: Category[] } {
  const today = startOfDay(new Date());
  const iso = (days: number, h: number, m = 0) => atTime(addDays(today, days), h, m).toISOString();

  const categories: Category[] = [
    { id: 'cat-work', name: 'Work', color: 'violet' },
    { id: 'cat-personal', name: 'Personal', color: 'emerald' },
    { id: 'cat-learning', name: 'Learning', color: 'sky' },
    { id: 'cat-health', name: 'Health', color: 'rose' },
  ];

  const base = {
    notes: '',
    reminderFiredAt: null,
    snoozedUntil: null,
    subtasks: [],
    completedAt: null,
    createdAt: addDays(today, -3).toISOString(),
  };

  const tasks: Task[] = [
    {
      ...base,
      id: uid(),
      title: 'Finalize Q4 roadmap deck',
      notes: 'Tighten the narrative around platform bets. Share with leadership before the sync.',
      status: 'in_progress',
      priority: 'urgent',
      categoryId: 'cat-work',
      due: iso(0, 17),
      reminder: '1h',
      subtasks: [
        { id: uid(), title: 'Draft vision slide', done: true },
        { id: uid(), title: 'Add metrics appendix', done: true },
        { id: uid(), title: 'Review with design', done: false },
      ],
    },
    {
      ...base,
      id: uid(),
      title: 'Review pull requests',
      status: 'todo',
      priority: 'high',
      categoryId: 'cat-work',
      due: iso(0, 14, 30),
      reminder: '15m',
    },
    {
      ...base,
      id: uid(),
      title: 'Book dentist appointment',
      status: 'todo',
      priority: 'medium',
      categoryId: 'cat-health',
      due: iso(-1, 10),
      reminder: 'none',
    },
    {
      ...base,
      id: uid(),
      title: 'Read “Designing Data-Intensive Applications” ch. 5',
      status: 'todo',
      priority: 'low',
      categoryId: 'cat-learning',
      due: iso(3, 20),
      reminder: 'at',
    },
    {
      ...base,
      id: uid(),
      title: 'Plan weekend hike',
      notes: 'Check trail conditions and weather.',
      status: 'todo',
      priority: 'low',
      categoryId: 'cat-personal',
      due: iso(2, 18),
      reminder: '1d',
      subtasks: [
        { id: uid(), title: 'Pick a trail', done: false },
        { id: uid(), title: 'Pack gear', done: false },
      ],
    },
    {
      ...base,
      id: uid(),
      title: 'Prototype onboarding flow',
      status: 'in_progress',
      priority: 'high',
      categoryId: 'cat-work',
      due: iso(1, 12),
      reminder: '1h',
    },
    {
      ...base,
      id: uid(),
      title: 'Morning run — 5k',
      status: 'done',
      priority: 'medium',
      categoryId: 'cat-health',
      due: iso(0, 7),
      reminder: 'none',
      completedAt: iso(0, 7, 40),
    },
    {
      ...base,
      id: uid(),
      title: 'Ship design tokens v2',
      status: 'done',
      priority: 'high',
      categoryId: 'cat-work',
      due: iso(-2, 17),
      reminder: 'none',
      completedAt: iso(-2, 16),
    },
    {
      ...base,
      id: uid(),
      title: 'Renew passport',
      status: 'done',
      priority: 'medium',
      categoryId: 'cat-personal',
      due: null,
      reminder: 'none',
      completedAt: iso(-4, 11),
    },
  ];

  return { tasks, categories };
}
