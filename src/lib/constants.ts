import type {
  CategoryColor,
  Priority,
  ReminderOffset,
  Repeat,
  RingtoneId,
  RingtoneMood,
  SmartView,
  Status,
} from '../types';

export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];

export const PRIORITY_META: Record<Priority, { label: string; weight: number; dot: string; chip: string }> = {
  urgent: {
    label: 'Urgent',
    weight: 4,
    dot: 'bg-rose-500',
    chip: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400',
  },
  high: {
    label: 'High',
    weight: 3,
    dot: 'bg-amber-500',
    chip: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400',
  },
  medium: {
    label: 'Medium',
    weight: 2,
    dot: 'bg-sky-500',
    chip: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400',
  },
  low: {
    label: 'Low',
    weight: 1,
    dot: 'bg-zinc-400',
    chip: 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400',
  },
};

export const STATUS_ORDER: Status[] = ['todo', 'in_progress', 'done'];

export const STATUS_META: Record<Status, { label: string; dot: string }> = {
  todo: { label: 'To do', dot: 'bg-zinc-400 dark:bg-zinc-500' },
  in_progress: { label: 'In progress', dot: 'bg-violet-500' },
  done: { label: 'Done', dot: 'bg-emerald-500' },
};

export const REMINDER_META: Record<ReminderOffset, { label: string; offsetMs: number | null }> = {
  none: { label: 'No reminder', offsetMs: null },
  at: { label: 'At due time', offsetMs: 0 },
  '15m': { label: '15 min before', offsetMs: 15 * 60_000 },
  '1h': { label: '1 hour before', offsetMs: 60 * 60_000 },
  '1d': { label: '1 day before', offsetMs: 24 * 60 * 60_000 },
};

export const REPEAT_META: Record<Repeat, { label: string }> = {
  none: { label: 'Does not repeat' },
  daily: { label: 'Every day' },
  weekdays: { label: 'Every weekday' },
  weekly: { label: 'Every week' },
  monthly: { label: 'Every month' },
};

export const CATEGORY_COLORS: CategoryColor[] = ['violet', 'sky', 'emerald', 'amber', 'rose', 'slate'];

export const CATEGORY_COLOR_META: Record<CategoryColor, { dot: string; chip: string }> = {
  violet: { dot: 'bg-violet-500', chip: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  sky: { dot: 'bg-sky-500', chip: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  emerald: { dot: 'bg-emerald-500', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  amber: { dot: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  rose: { dot: 'bg-rose-500', chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  slate: { dot: 'bg-slate-500', chip: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
};

export const SMART_VIEW_META: Record<SmartView, { label: string }> = {
  all: { label: 'All tasks' },
  today: { label: 'Today' },
  upcoming: { label: 'Upcoming' },
  overdue: { label: 'Overdue' },
  completed: { label: 'Completed' },
};

export const RINGTONE_MOODS: { mood: RingtoneMood; label: string }[] = [
  { mood: 'calm', label: 'Calm' },
  { mood: 'classic', label: 'Classic' },
  { mood: 'intense', label: 'Intense' },
];

export const RINGTONE_META: Record<RingtoneId, { label: string; mood: RingtoneMood; hint: string }> = {
  sweet: { label: 'Sweet', mood: 'calm', hint: 'Music-box melody' },
  soft: { label: 'Soft', mood: 'calm', hint: 'Warm, slow swell' },
  chime: { label: 'Chime', mood: 'calm', hint: 'Ringing bells' },
  classic: { label: 'Beep', mood: 'classic', hint: 'Bedside alarm clock' },
  digital: { label: 'Digital', mood: 'classic', hint: 'Wristwatch double beep' },
  retro: { label: 'Retro', mood: 'classic', hint: '8-bit arcade jingle' },
  hard: { label: 'Hard', mood: 'intense', hint: 'Harsh buzzer' },
  suspense: { label: 'Suspense', mood: 'intense', hint: 'Heartbeat and tension' },
  danger: { label: 'Danger', mood: 'intense', hint: 'Klaxon warning' },
  siren: { label: 'Siren', mood: 'intense', hint: 'Rising and falling wail' },
};
