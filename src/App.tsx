import { AnimatePresence, motion } from 'motion/react';
import { SearchX } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Board } from './components/board/Board';
import { ListView } from './components/board/ListView';
import { Dashboard } from './components/dashboard/Dashboard';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TaskEditor } from './components/task/TaskEditor';
import { Toaster } from './components/ui/Toaster';
import { useHotkeys } from './hooks/useHotkeys';
import { useNow } from './hooks/useNow';
import { useReminders } from './hooks/useReminders';
import { useTheme } from './hooks/useTheme';
import { filterTasks } from './lib/selectors';
import { useTaskStore } from './store/taskStore';
import { useUIStore } from './store/uiStore';

export default function App() {
  useTheme();
  useReminders();
  const now = useNow();

  const tasks = useTaskStore((s) => s.tasks);
  const categories = useTaskStore((s) => s.categories);
  const view = useUIStore((s) => s.view);
  const categoryId = useUIStore((s) => s.categoryId);
  const search = useUIStore((s) => s.search);
  const layout = useUIStore((s) => s.layout);
  const editorOpen = useUIStore((s) => s.editor.open);

  const searchRef = useRef<HTMLInputElement>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const visible = useMemo(
    () => filterTasks(tasks, { view, categoryId, search }),
    // `now` keeps date-based views fresh as time passes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, view, categoryId, search, now],
  );

  useHotkeys({
    n: () => !editorOpen && useUIStore.getState().openEditor(),
    '/': () => searchRef.current?.focus(),
    'mod+k': () => quickAddRef.current?.focus(),
  });

  const contentKey = `${layout}-${view}-${categoryId}`;

  return (
    <div className="aurora flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <Dashboard tasks={tasks} categories={categoryMap} now={now} />
          <Header searchRef={searchRef} quickAddRef={quickAddRef} />

          <AnimatePresence mode="wait">
            <motion.div
              key={contentKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {search && visible.length === 0 ? (
                <div className="surface grid place-items-center gap-2 py-16 text-center">
                  <SearchX className="size-6 text-zinc-400" />
                  <p className="text-sm font-medium">No tasks match “{search}”</p>
                  <p className="text-xs text-zinc-500">Try a different keyword or clear the filter.</p>
                </div>
              ) : layout === 'board' ? (
                <Board tasks={visible} categories={categoryMap} now={now} />
              ) : (
                <ListView tasks={visible} categories={categoryMap} now={now} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <TaskEditor />
      <Toaster />
    </div>
  );
}
