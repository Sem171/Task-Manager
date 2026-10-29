import type { Repeat } from '../types';

const DAY_MS = 24 * 60 * 60_000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Same day-of-month and time `months` later, clamped to the month's last day (Jan 31 → Feb 28). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}

/** The next occurrence after `date` at the same time of day. */
export function nextOccurrence(date: Date, repeat: Exclude<Repeat, 'none'>): Date {
  switch (repeat) {
    case 'daily':
      return addDays(date, 1);
    case 'weekdays': {
      let d = addDays(date, 1);
      while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
      return d;
    }
    case 'weekly':
      return addDays(date, 7);
    case 'monthly':
      return addMonths(date, 1);
  }
}

export function atTime(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Whole calendar days from `from` to `to` (negative when `to` is in the past). */
export function dayDiff(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const shortFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export function formatTime(date: Date): string {
  return timeFmt.format(date);
}

export function formatLongDate(date: Date): string {
  return longFmt.format(date);
}

/** Human, relative label for a due date: "Today 3:00 PM", "Tomorrow", "Fri", "Oct 30". */
export function formatDue(iso: string, now = new Date()): string {
  const due = new Date(iso);
  const diff = dayDiff(now, due);
  const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0;
  const time = hasTime ? ` · ${formatTime(due)}` : '';

  if (diff === 0) return `Today${time}`;
  if (diff === 1) return `Tomorrow${time}`;
  if (diff === -1) return `Yesterday${time}`;
  if (diff > 1 && diff < 7) return `${weekdayFmt.format(due)}${time}`;
  return shortFmt.format(due) + time;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
