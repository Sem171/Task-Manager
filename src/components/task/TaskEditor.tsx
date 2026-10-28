import { AnimatePresence, motion } from 'motion/react';
import { Bell, CalendarDays, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { Priority, ReminderOffset, Status, Subtask, TaskDraft } from '../../types';
import {
  CATEGORY_COLOR_META,
  PRIORITY_META,
  PRIORITY_ORDER,
  REMINDER_META,
  STATUS_META,
  STATUS_ORDER,
} from '../../lib/constants';
import { addDays, atTime, fromInputValue, startOfDay, toInputValue } from '../../lib/date';
import { cn, uid } from '../../lib/utils';
import { useTaskStore } from '../../store/taskStore';
import { toast } from '../../store/toastStore';
import { useUIStore } from '../../store/uiStore';
import { Checkbox } from '../ui/Checkbox';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';

const EMPTY: TaskDraft = {
  title: '',
  notes: '',
  status: 'todo',
  priority: 'medium',
  categoryId: null,
  due: null,
  reminder: 'none',
  subtasks: [],
};

const DUE_PRESETS: { label: string; get: () => Date }[] = [
  { label: 'Today', get: () => atTime(new Date(), 17) },
  { label: 'Tomorrow', get: () => atTime(addDays(startOfDay(new Date()), 1), 9) },
  { label: 'Next week', get: () => atTime(addDays(startOfDay(new Date()), 7), 9) },
];

export function TaskEditor() {
  const { open, taskId, defaultStatus } = useUIStore((s) => s.editor);
  const closeEditor = useUIStore((s) => s.closeEditor);
  const categoryFilter = useUIStore((s) => s.categoryId);
  const task = useTaskStore((s) => (taskId ? s.tasks.find((t) => t.id === taskId) : undefined));
  const categories = useTaskStore((s) => s.categories);
  const { addTask, updateTask, deleteTask, restoreTask } = useTaskStore.getState();

  const [draft, setDraft] = useState<TaskDraft>(EMPTY);
  const [newSubtask, setNewSubtask] = useState('');

  // Reset the form each time the editor opens.
  useEffect(() => {
    if (!open) return;
    setNewSubtask('');
    setDraft(
      task
        ? {
            title: task.title,
            notes: task.notes,
            status: task.status,
            priority: task.priority,
            categoryId: task.categoryId,
            due: task.due,
            reminder: task.reminder,
            subtasks: task.subtasks,
          }
        : { ...EMPTY, status: defaultStatus, categoryId: categoryFilter },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const canSave = draft.title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const pending = newSubtask.trim();
    const final: TaskDraft = pending
      ? { ...draft, subtasks: [...draft.subtasks, { id: uid(), title: pending, done: false }] }
      : draft;
    if (task) updateTask(task.id, { ...final, title: final.title.trim() });
    else {
      addTask(final);
      toast({ title: 'Task created', description: final.title.trim(), tone: 'success' });
    }
    closeEditor();
  };

  const remove = () => {
    if (!task) return;
    const removed = deleteTask(task.id);
    closeEditor();
    if (removed) {
      toast({
        title: 'Task deleted',
        description: removed.task.title,
        actions: [{ label: 'Undo', onClick: () => restoreTask(removed.task, removed.index) }],
        duration: 6000,
      });
    }
  };

  const addSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    set('subtasks', [...draft.subtasks, { id: uid(), title, done: false }]);
    setNewSubtask('');
  };

  const updateSubtask = (id: string, patch: Partial<Subtask>) =>
    set('subtasks', draft.subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <Modal open={open} onClose={closeEditor} label={task ? 'Edit task' : 'New task'}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
        }}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{task ? 'Edit task' : 'New task'}</span>
          <button
            type="button"
            onClick={closeEditor}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 pt-2 pb-6">
          <div>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="What needs to be done?"
              aria-label="Title"
              className="w-full bg-transparent text-xl font-semibold tracking-tight placeholder:text-zinc-300 focus:outline-none dark:placeholder:text-zinc-600"
            />
            <textarea
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Add notes…"
              aria-label="Notes"
              rows={2}
              className="mt-2 w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-600 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-300 dark:placeholder:text-zinc-600"
            />
          </div>

          <div>
            <span className="label">Status</span>
            <Segmented<Status>
              className="w-full"
              value={draft.status}
              onChange={(v) => set('status', v)}
              options={STATUS_ORDER.map((s) => ({
                value: s,
                label: (
                  <>
                    <span className={cn('size-1.5 rounded-full', STATUS_META[s].dot)} />
                    {STATUS_META[s].label}
                  </>
                ),
              }))}
            />
          </div>

          <div>
            <span className="label">Priority</span>
            <Segmented<Priority>
              className="w-full"
              value={draft.priority}
              onChange={(v) => set('priority', v)}
              options={[...PRIORITY_ORDER].reverse().map((p) => ({
                value: p,
                label: (
                  <>
                    <span className={cn('size-1.5 rounded-full', PRIORITY_META[p].dot)} />
                    {PRIORITY_META[p].label}
                  </>
                ),
              }))}
            />
          </div>

          <div>
            <span className="label">Category</span>
            <div className="flex flex-wrap gap-1.5">
              <CategoryPill active={draft.categoryId === null} onClick={() => set('categoryId', null)}>
                None
              </CategoryPill>
              {categories.map((c) => (
                <CategoryPill key={c.id} active={draft.categoryId === c.id} onClick={() => set('categoryId', c.id)}>
                  <span className={cn('size-1.5 rounded-full', CATEGORY_COLOR_META[c.color].dot)} />
                  {c.name}
                </CategoryPill>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="due">
                <CalendarDays className="mr-1 inline size-3 -translate-y-px" />
                Deadline
              </label>
              <input
                id="due"
                type="datetime-local"
                value={toInputValue(draft.due)}
                onChange={(e) => set('due', fromInputValue(e.target.value))}
                className="field font-mono text-[13px]"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {DUE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => set('due', p.get().toISOString())}
                    className="rounded-md px-2 py-0.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                  >
                    {p.label}
                  </button>
                ))}
                {draft.due && (
                  <button
                    type="button"
                    onClick={() => set('due', null)}
                    className="rounded-md px-2 py-0.5 text-[11px] font-medium text-rose-500 transition hover:bg-rose-500/10"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="reminder">
                <Bell className="mr-1 inline size-3 -translate-y-px" />
                Reminder
              </label>
              <select
                id="reminder"
                value={draft.reminder}
                disabled={!draft.due}
                onChange={(e) => set('reminder', e.target.value as ReminderOffset)}
                className="field disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(Object.keys(REMINDER_META) as ReminderOffset[]).map((r) => (
                  <option key={r} value={r}>
                    {REMINDER_META[r].label}
                  </option>
                ))}
              </select>
              {!draft.due && <p className="mt-2 text-[11px] text-zinc-400">Set a deadline to enable reminders.</p>}
            </div>
          </div>

          <div>
            <span className="label">
              Subtasks
              {draft.subtasks.length > 0 && (
                <span className="ml-1.5 font-mono normal-case">
                  {draft.subtasks.filter((s) => s.done).length}/{draft.subtasks.length}
                </span>
              )}
            </span>
            <ul className="space-y-1">
              <AnimatePresence initial={false}>
                {draft.subtasks.map((s) => (
                  <motion.li
                    key={s.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center gap-2.5 rounded-lg px-1 py-1"
                  >
                    <Checkbox
                      size="sm"
                      checked={s.done}
                      onChange={() => updateSubtask(s.id, { done: !s.done })}
                      label={s.title}
                    />
                    <input
                      value={s.title}
                      onChange={(e) => updateSubtask(s.id, { title: e.target.value })}
                      aria-label="Subtask title"
                      className={cn(
                        'min-w-0 flex-1 bg-transparent text-sm focus:outline-none',
                        s.done && 'text-zinc-400 line-through',
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => set('subtasks', draft.subtasks.filter((x) => x.id !== s.id))}
                      aria-label="Remove subtask"
                      className="rounded p-0.5 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:text-rose-500 focus:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="mt-1 flex items-center gap-2.5 px-1">
              <Plus className="size-4 text-zinc-400" />
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add subtask"
                aria-label="New subtask"
                className="min-w-0 flex-1 bg-transparent py-1 text-sm placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-100 px-6 py-4 dark:border-white/5">
          {task && (
            <button
              type="button"
              onClick={remove}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          )}
          <span className="ml-auto hidden items-center gap-1 text-[11px] text-zinc-400 sm:flex">
            <kbd className="kbd">Ctrl</kbd>
            <kbd className="kbd">↵</kbd>
            to save
          </span>
          <button
            type="button"
            onClick={closeEditor}
            className="ml-auto rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 sm:ml-2 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 transition',
        active
          ? 'bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white'
          : 'text-zinc-600 ring-zinc-200 hover:ring-zinc-300 dark:text-zinc-300 dark:ring-white/10 dark:hover:ring-white/20',
      )}
    >
      {children}
    </button>
  );
}
