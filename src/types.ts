export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in_progress' | 'done';
export type ReminderOffset = 'none' | 'at' | '15m' | '1h' | '1d';
export type ThemeMode = 'light' | 'dark' | 'system';
export type SmartView = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
export type Layout = 'board' | 'list';
export type CategoryColor = 'violet' | 'sky' | 'emerald' | 'amber' | 'rose' | 'slate';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: Status;
  priority: Priority;
  categoryId: string | null;
  /** ISO timestamp */
  due: string | null;
  reminder: ReminderOffset;
  reminderFiredAt: string | null;
  snoozedUntil: string | null;
  subtasks: Subtask[];
  createdAt: string;
  completedAt: string | null;
}

export type TaskDraft = Pick<
  Task,
  'title' | 'notes' | 'status' | 'priority' | 'categoryId' | 'due' | 'reminder' | 'subtasks'
>;
