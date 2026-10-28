import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Category, CategoryColor, Status, Task, TaskDraft } from '../types';
import { uid } from '../lib/utils';
import { defaultCategories, LEGACY_SAMPLE_TITLES } from './seed';

interface TaskState {
  tasks: Task[];
  categories: Category[];

  addTask: (draft: Partial<TaskDraft> & { title: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => { task: Task; index: number } | null;
  restoreTask: (task: Task, index: number) => void;
  toggleComplete: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  /** Reorder: place `activeId` where `overId` currently sits. */
  reorder: (activeId: string, overId: string) => void;
  /** Move a task into another column, optionally next to `overId`. */
  moveToStatus: (id: string, status: Status, overId?: string) => void;
  snoozeReminder: (id: string, minutes: number) => void;
  markReminderFired: (id: string) => void;

  addCategory: (name: string, color: CategoryColor) => Category;
  deleteCategory: (id: string) => void;
}

const now = () => new Date().toISOString();

/** Keeps completedAt in sync with status, and re-arms reminders when timing changes. */
function applyPatch(task: Task, patch: Partial<Task>): Task {
  const next = { ...task, ...patch };
  if (patch.status && patch.status !== task.status) {
    next.completedAt = patch.status === 'done' ? now() : null;
  }
  if (('due' in patch && patch.due !== task.due) || ('reminder' in patch && patch.reminder !== task.reminder)) {
    next.reminderFiredAt = null;
    next.snoozedUntil = null;
  }
  return next;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: defaultCategories(),

      addTask: (draft) => {
        const task: Task = {
          id: uid(),
          notes: '',
          status: 'todo',
          priority: 'medium',
          categoryId: null,
          due: null,
          reminder: 'none',
          alarm: null,
          subtasks: [],
          ...draft,
          title: draft.title.trim(),
          reminderFiredAt: null,
          snoozedUntil: null,
          createdAt: now(),
          completedAt: draft.status === 'done' ? now() : null,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? applyPatch(t, patch) : t)) })),

      deleteTask: (id) => {
        const index = get().tasks.findIndex((t) => t.id === id);
        if (index < 0) return null;
        const task = get().tasks[index];
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
        return { task, index };
      },

      restoreTask: (task, index) =>
        set((s) => {
          const tasks = [...s.tasks];
          tasks.splice(Math.min(index, tasks.length), 0, task);
          return { tasks };
        }),

      toggleComplete: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? applyPatch(t, { status: t.status === 'done' ? 'todo' : 'done' }) : t,
          ),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st)) }
              : t,
          ),
        })),

      reorder: (activeId, overId) =>
        set((s) => {
          const from = s.tasks.findIndex((t) => t.id === activeId);
          const to = s.tasks.findIndex((t) => t.id === overId);
          if (from < 0 || to < 0 || from === to) return s;
          const tasks = [...s.tasks];
          const [moved] = tasks.splice(from, 1);
          tasks.splice(to, 0, moved);
          return { tasks };
        }),

      moveToStatus: (id, status, overId) =>
        set((s) => {
          const from = s.tasks.findIndex((t) => t.id === id);
          if (from < 0) return s;
          const tasks = [...s.tasks];
          const [moved] = tasks.splice(from, 1);
          const updated = applyPatch(moved, { status });
          const to = overId ? tasks.findIndex((t) => t.id === overId) : -1;
          if (to >= 0) tasks.splice(to, 0, updated);
          else tasks.push(updated);
          return { tasks };
        }),

      snoozeReminder: (id, minutes) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, reminderFiredAt: null, snoozedUntil: new Date(Date.now() + minutes * 60_000).toISOString() }
              : t,
          ),
        })),

      markReminderFired: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, reminderFiredAt: now() } : t)) })),

      addCategory: (name, color) => {
        const category: Category = { id: uid(), name: name.trim(), color };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          tasks: s.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)),
        })),
    }),
    {
      name: 'nova-tasks',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        const state = persisted as Pick<TaskState, 'tasks' | 'categories'>;
        // v1 seeded sample tasks on first launch; drop them for existing users.
        if (version < 2) state.tasks = state.tasks.filter((t) => !LEGACY_SAMPLE_TITLES.has(t.title));
        // v3 added alarm ringtones.
        if (version < 3) state.tasks = state.tasks.map((t) => ({ ...t, alarm: t.alarm ?? null }));
        return state as TaskState;
      },
      partialize: (s) => ({ tasks: s.tasks, categories: s.categories }),
    },
  ),
);
