import { motion } from 'motion/react';
import { ArrowUpRight, Flame, Sparkles, TriangleAlert, Sun, Loader } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import type { Category, Task } from '../../types';
import { formatLongDate, greeting } from '../../lib/date';
import { computeStats, suggestNext } from '../../lib/selectors';
import { cn } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';
import { ProgressRing } from '../ui/ProgressRing';
import { CategoryChip, DueChip, PriorityChip } from '../task/TaskMeta';

interface Props {
  tasks: Task[];
  categories: Map<string, Category>;
  now: Date;
}

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });

export function Dashboard({ tasks, categories, now }: Props) {
  const stats = useMemo(() => computeStats(tasks, now), [tasks, now]);
  const next = useMemo(() => suggestNext(tasks, now), [tasks, now]);
  const setView = useUIStore((s) => s.setView);
  const openEditor = useUIStore((s) => s.openEditor);
  const maxWeek = Math.max(1, ...stats.week.map((d) => d.count));
  const weekTotal = stats.week.reduce((n, d) => n + d.count, 0);

  const summary =
    stats.dueToday + stats.overdue === 0
      ? 'Your slate is clear for today.'
      : [
          stats.dueToday && `${stats.dueToday} ${stats.dueToday === 1 ? 'task' : 'tasks'} due today`,
          stats.overdue && `${stats.overdue} overdue`,
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <section aria-label="Overview" className="space-y-5">
      <div>
        <p className="font-mono text-xs tracking-wide text-zinc-400 uppercase">{formatLongDate(now)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {greeting(now)}.{' '}
          <span className="bg-gradient-to-r from-zinc-400 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-500 dark:to-zinc-400">
            {summary}
          </span>
        </h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card delay={0}>
          <div className="flex items-center gap-4">
            <ProgressRing value={stats.completionRate} size={96} stroke={8}>
              <div className="text-center">
                <p className="text-xl font-semibold tabular-nums">{Math.round(stats.completionRate * 100)}%</p>
              </div>
            </ProgressRing>
            <div>
              <p className="text-sm font-medium">Progress</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-mono tabular-nums">{stats.done}</span> of{' '}
                <span className="font-mono tabular-nums">{stats.total}</span> tasks complete
              </p>
              {stats.streak > 0 && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  <Flame className="size-3" />
                  {stats.streak}-day streak
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card delay={0.05}>
          <div className="grid h-full grid-cols-3 gap-2">
            <Metric icon={<Sun className="size-3.5" />} label="Today" value={stats.dueToday} onClick={() => setView('today')} />
            <Metric
              icon={<TriangleAlert className="size-3.5" />}
              label="Overdue"
              value={stats.overdue}
              tone={stats.overdue ? 'danger' : undefined}
              onClick={() => setView('overdue')}
            />
            <Metric icon={<Loader className="size-3.5" />} label="Active" value={stats.inProgress} />
          </div>
        </Card>

        <Card delay={0.1}>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">This week</p>
            <p className="font-mono text-xs text-zinc-400 tabular-nums">{weekTotal} done</p>
          </div>
          <div className="mt-3 flex h-16 items-end gap-1.5" role="img" aria-label={`${weekTotal} tasks completed in the last 7 days`}>
            {stats.week.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="relative flex h-12 w-full items-end overflow-hidden rounded-md bg-zinc-100 dark:bg-white/[0.04]">
                  <motion.div
                    className={cn(
                      'w-full rounded-md',
                      i === 6 ? 'bg-gradient-to-t from-violet-500 to-cyan-400' : 'bg-zinc-300 dark:bg-zinc-600',
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.count / maxWeek) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.15 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    title={`${d.count} completed`}
                  />
                </div>
                <span className={cn('text-[10px] text-zinc-400', i === 6 && 'font-semibold text-zinc-700 dark:text-zinc-200')}>
                  {dayFmt.format(d.date)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card delay={0.15} className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 blur-2xl" />
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-3.5 text-violet-500" />
            Up next
          </p>
          {next ? (
            <button onClick={() => openEditor(next.id)} className="group mt-2 block w-full text-left">
              <p className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {next.title}
                <ArrowUpRight className="ml-0.5 inline size-3.5 opacity-0 transition group-hover:opacity-100" />
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <PriorityChip priority={next.priority} />
                {next.categoryId && categories.get(next.categoryId) && (
                  <CategoryChip category={categories.get(next.categoryId)!} />
                )}
                <DueChip task={next} now={now} />
              </div>
            </button>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Nothing pending. Enjoy the calm.</p>
          )}
        </Card>
      </div>
    </section>
  );
}

function Card({ children, delay, className }: { children: ReactNode; delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn('surface p-4', className)}
    >
      {children}
    </motion.div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: 'danger';
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'flex flex-col justify-between rounded-xl p-2.5 text-left transition',
        onClick && 'hover:bg-zinc-100 dark:hover:bg-white/5',
      )}
    >
      <span
        className={cn(
          'flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400',
          tone === 'danger' && 'text-rose-600 dark:text-rose-400',
        )}
      >
        {icon}
        {label}
      </span>
      <span
        className={cn(
          'mt-3 text-3xl font-semibold tracking-tight tabular-nums',
          tone === 'danger' && 'text-rose-600 dark:text-rose-400',
        )}
      >
        {value}
      </span>
    </Tag>
  );
}
