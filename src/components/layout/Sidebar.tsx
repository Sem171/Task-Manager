import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  BellOff,
  CalendarRange,
  CircleCheck,
  Inbox,
  Monitor,
  Moon,
  Plus,
  Sun,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CategoryColor, SmartView, ThemeMode } from '../../types';
import { CATEGORY_COLOR_META, CATEGORY_COLORS, SMART_VIEW_META } from '../../lib/constants';
import { matchesView } from '../../lib/selectors';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../store/taskStore';
import { toast } from '../../store/toastStore';
import { useUIStore } from '../../store/uiStore';
import { Segmented } from '../ui/Segmented';

const VIEW_ICONS: Record<SmartView, LucideIcon> = {
  all: Inbox,
  today: Sun,
  upcoming: CalendarRange,
  overdue: TriangleAlert,
  completed: CircleCheck,
};

export function Sidebar() {
  const open = useUIStore((s) => s.sidebarOpen);
  const setOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-zinc-200/70 lg:block dark:border-white/[0.06]">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 border-r border-zinc-200 bg-zinc-50 shadow-2xl dark:border-white/10 dark:bg-zinc-950"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute top-4 right-3 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/5"
              >
                <X className="size-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent() {
  const tasks = useTaskStore((s) => s.tasks);
  const categories = useTaskStore((s) => s.categories);
  const { view, categoryId, theme, setView, setCategory, setTheme } = useUIStore();

  const viewCounts = useMemo(() => {
    const now = new Date();
    const counts = {} as Record<SmartView, number>;
    for (const v of Object.keys(SMART_VIEW_META) as SmartView[]) {
      counts[v] = tasks.filter((t) => matchesView(t, v, now) && (v === 'completed' || t.status !== 'done')).length;
    }
    return counts;
  }, [tasks]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (t.categoryId && t.status !== 'done') counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  return (
    <div className="flex h-full flex-col px-3 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/25">
          <svg viewBox="0 0 16 16" className="size-4 text-white" fill="none">
            <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] leading-none font-semibold tracking-tight">Nova</p>
          <p className="mt-1 text-[10px] tracking-[0.2em] text-zinc-400 uppercase">Tasks</p>
        </div>
      </div>

      <nav className="mt-8 space-y-0.5" aria-label="Smart views">
        {(Object.keys(SMART_VIEW_META) as SmartView[]).map((v) => (
          <NavItem
            key={v}
            icon={VIEW_ICONS[v]}
            label={SMART_VIEW_META[v].label}
            count={viewCounts[v]}
            active={view === v && !categoryId}
            danger={v === 'overdue' && viewCounts[v] > 0}
            onClick={() => setView(v)}
          />
        ))}
      </nav>

      <div className="mt-8">
        <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">Categories</p>
        <nav className="space-y-0.5" aria-label="Categories">
          {categories.map((c) => (
            <NavItem
              key={c.id}
              dot={CATEGORY_COLOR_META[c.color].dot}
              label={c.name}
              count={categoryCounts.get(c.id) ?? 0}
              active={categoryId === c.id}
              onClick={() => setCategory(categoryId === c.id ? null : c.id)}
            />
          ))}
        </nav>
        <AddCategory />
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <NotificationToggle />
        <Segmented<ThemeMode>
          size="sm"
          className="w-full"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: <Sun className="size-3.5" />, title: 'Light' },
            { value: 'dark', label: <Moon className="size-3.5" />, title: 'Dark' },
            { value: 'system', label: <Monitor className="size-3.5" />, title: 'System' },
          ]}
        />
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  dot,
  label,
  count,
  active,
  danger,
  onClick,
}: {
  icon?: LucideIcon;
  dot?: string;
  label: string;
  count: number;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
        active
          ? 'font-medium text-zinc-900 dark:text-white'
          : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100',
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-zinc-900/5 dark:bg-white/[0.07] dark:ring-white/5"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <span className="relative flex size-4 items-center justify-center">
        {Icon ? <Icon className="size-4" /> : <span className={cn('size-2 rounded-full', dot)} />}
      </span>
      <span className="relative flex-1 truncate text-left">{label}</span>
      {count > 0 && (
        <span
          className={cn(
            'relative font-mono text-[11px] tabular-nums',
            danger ? 'text-rose-500' : 'text-zinc-400',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function AddCategory() {
  const addCategory = useTaskStore((s) => s.addCategory);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<CategoryColor>('violet');

  const submit = () => {
    if (name.trim()) addCategory(name, color);
    setName('');
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <Plus className="size-4" />
        New category
      </button>
    );
  }

  return (
    <form
      className="mt-2 space-y-2 rounded-xl bg-white p-2 ring-1 ring-zinc-200 dark:bg-white/[0.03] dark:ring-white/10"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        onBlur={() => !name.trim() && setEditing(false)}
        placeholder="Category name"
        className="w-full bg-transparent px-1 text-sm focus:outline-none"
      />
      <div className="flex items-center gap-1.5 px-1">
        {CATEGORY_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColor(c)}
            aria-label={c}
            aria-pressed={color === c}
            className={cn(
              'size-4 rounded-full ring-offset-2 ring-offset-white transition dark:ring-offset-zinc-900',
              CATEGORY_COLOR_META[c].dot,
              color === c ? 'ring-2 ring-zinc-400' : 'opacity-60 hover:opacity-100',
            )}
          />
        ))}
        <button type="submit" className="ml-auto text-xs font-medium text-violet-600 dark:text-violet-400">
          Add
        </button>
      </div>
    </form>
  );
}

function NotificationToggle() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied');
  if (!supported) return null;

  const enabled = permission === 'granted';
  const request = async () => {
    if (enabled) {
      toast({ title: 'Notifications are on', description: 'Manage them in your browser site settings.' });
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    toast(
      result === 'granted'
        ? { title: 'Smart reminders enabled', description: 'You’ll get a desktop alert when tasks are due.', tone: 'success' }
        : { title: 'Notifications blocked', description: 'In-app reminders will still appear.' },
    );
  };

  return (
    <button
      onClick={request}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-zinc-500 transition hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-white/[0.04]"
    >
      {enabled ? <Bell className="size-4 text-violet-500" /> : <BellOff className="size-4" />}
      <span className="flex-1">{enabled ? 'Desktop reminders on' : 'Enable desktop reminders'}</span>
      <span className={cn('size-1.5 rounded-full', enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600')} />
    </button>
  );
}
