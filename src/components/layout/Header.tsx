import { AnimatePresence, motion } from 'motion/react';
import { CalendarClock, Hash, LayoutGrid, List, Menu, Plus, Search, Sparkles, X } from 'lucide-react';
import { forwardRef, useMemo, useState, type ReactNode, type RefObject } from 'react';
import type { Layout } from '../../types';
import { CATEGORY_COLOR_META, PRIORITY_META, SMART_VIEW_META } from '../../lib/constants';
import { formatDue } from '../../lib/date';
import { parseQuickAdd } from '../../lib/parseQuickAdd';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store/taskStore';
import { toast } from '../../store/toastStore';
import { useUIStore } from '../../store/uiStore';
import { Segmented } from '../ui/Segmented';

interface Props {
  searchRef: RefObject<HTMLInputElement | null>;
  quickAddRef: RefObject<HTMLInputElement | null>;
}

export function Header({ searchRef, quickAddRef }: Props) {
  const view = useUIStore((s) => s.view);
  const categoryId = useUIStore((s) => s.categoryId);
  const layout = useUIStore((s) => s.layout);
  const search = useUIStore((s) => s.search);
  const { setLayout, setSearch, setSidebarOpen, openEditor } = useUIStore.getState();
  const category = useTaskStore((s) => s.categories.find((c) => c.id === categoryId));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="-ml-1.5 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200/60 lg:hidden dark:hover:bg-white/5"
        >
          <Menu className="size-5" />
        </button>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {category && <span className={cn('size-2.5 rounded-full', CATEGORY_COLOR_META[category.color].dot)} />}
          {category ? category.name : SMART_VIEW_META[view].label}
        </h2>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setSearch(''), e.currentTarget.blur())}
              placeholder="Search"
              aria-label="Search tasks"
              className="field h-9 w-48 pr-8 pl-9 transition-[width] focus:w-64"
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-700"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="kbd absolute top-1/2 right-2 -translate-y-1/2">/</kbd>
            )}
          </div>
          <Segmented<Layout>
            size="sm"
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'board', label: <LayoutGrid className="size-3.5" />, title: 'Board' },
              { value: 'list', label: <List className="size-3.5" />, title: 'List' },
            ]}
          />
          <button
            onClick={() => openEditor()}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New task</span>
            <kbd className="ml-1 hidden rounded bg-white/15 px-1 font-mono text-[10px] md:inline dark:bg-zinc-900/10">N</kbd>
          </button>
        </div>
      </div>

      <div className="relative sm:hidden">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks"
          className="field h-10 pl-9"
        />
      </div>

      <QuickAdd ref={quickAddRef} />
    </div>
  );
}

const QuickAdd = forwardRef<HTMLInputElement>(function QuickAdd(_props, ref) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const categories = useTaskStore((s) => s.categories);
  const addTask = useTaskStore((s) => s.addTask);
  const view = useUIStore((s) => s.view);
  const categoryFilter = useUIStore((s) => s.categoryId);

  const parsed = useMemo(() => parseQuickAdd(value), [value]);
  const matchedCategory = parsed.categoryTag
    ? categories.find((c) => c.name.toLowerCase() === parsed.categoryTag!.toLowerCase())
    : undefined;
  const hasHints = !!(parsed.due || parsed.priority || parsed.categoryTag);

  const submit = () => {
    if (!parsed.title) return;
    let due = parsed.due?.toISOString() ?? null;
    // Adding from "Today" without a date should land in today.
    if (!due && view === 'today') {
      const d = new Date();
      d.setHours(17, 0, 0, 0);
      due = d.toISOString();
    }
    addTask({
      title: parsed.title,
      priority: parsed.priority ?? 'medium',
      categoryId: matchedCategory?.id ?? categoryFilter,
      due,
      reminder: due ? '15m' : 'none',
      status: view === 'completed' ? 'done' : 'todo',
    });
    toast({ title: 'Task added', description: parsed.title, tone: 'success', duration: 2500 });
    setValue('');
  };

  return (
    <div
      className={cn(
        'surface relative overflow-hidden transition-shadow duration-300',
        focused && 'shadow-lg shadow-violet-500/[0.07] ring-4 ring-violet-500/10 dark:shadow-violet-500/5',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent opacity-0 transition-opacity',
          focused && 'opacity-100',
        )}
      />
      <div className="flex items-center gap-3 px-4">
        <Sparkles className={cn('size-4 shrink-0 transition-colors', focused ? 'text-violet-500' : 'text-zinc-400')} />
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') {
              setValue('');
              e.currentTarget.blur();
            }
          }}
          placeholder="Quick add — try “Ship release notes tomorrow 4pm !high #work”"
          aria-label="Quick add task"
          className="h-12 min-w-0 flex-1 bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
        />
        <span className="hidden shrink-0 items-center gap-1 sm:flex">
          <kbd className="kbd">Ctrl</kbd>
          <kbd className="kbd">K</kbd>
        </span>
      </div>
      <AnimatePresence initial={false}>
        {value && hasHints && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 px-4 py-2 text-[11px] dark:border-white/5">
              <span className="text-zinc-400">Detected</span>
              {parsed.due && (
                <Hint>
                  <CalendarClock className="size-3" />
                  {formatDue(parsed.due.toISOString())}
                </Hint>
              )}
              {parsed.priority && (
                <Hint>
                  <span className={cn('size-1.5 rounded-full', PRIORITY_META[parsed.priority].dot)} />
                  {PRIORITY_META[parsed.priority].label}
                </Hint>
              )}
              {parsed.categoryTag && (
                <Hint muted={!matchedCategory}>
                  <Hash className="size-3" />
                  {matchedCategory ? matchedCategory.name : `${parsed.categoryTag} (no match)`}
                </Hint>
              )}
              <span className="ml-auto text-zinc-400">↵ to add</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function Hint({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium',
        muted ? 'bg-zinc-100 text-zinc-400 dark:bg-white/5' : 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
      )}
    >
      {children}
    </span>
  );
}
