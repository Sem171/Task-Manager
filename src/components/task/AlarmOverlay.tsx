import { AnimatePresence, motion } from 'motion/react';
import { AlarmClock, Check, Clock } from 'lucide-react';
import { useEffect } from 'react';
import type { RingtoneMood } from '../../types';
import { RINGTONE_META } from '../../lib/constants';
import { formatDue } from '../../lib/date';
import { cn } from '../../lib/utils';
import { useAlarmStore } from '../../store/alarmStore';
import { useTaskStore } from '../../store/taskStore';

const SNOOZE_MINUTES = 10;

const MOOD_STYLE: Record<RingtoneMood, { badge: string; ring: string; text: string }> = {
  calm: { badge: 'from-violet-500 to-cyan-500', ring: 'bg-violet-500/30', text: 'text-violet-600 dark:text-violet-400' },
  classic: { badge: 'from-amber-500 to-orange-500', ring: 'bg-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
  intense: { badge: 'from-rose-500 to-red-600', ring: 'bg-rose-500/30', text: 'text-rose-600 dark:text-rose-400' },
};

/** Full-screen card for the alarm at the head of the queue; its sound loops until dismissed. */
export function AlarmOverlay() {
  const alarm = useAlarmStore((s) => s.queue[0]);
  const waiting = useAlarmStore((s) => s.queue.length - 1);
  const dismiss = useAlarmStore((s) => s.dismiss);
  const task = useTaskStore((s) => (alarm ? s.tasks.find((t) => t.id === alarm.taskId) : undefined));

  // The task was deleted while ringing: nothing left to show.
  useEffect(() => {
    if (alarm && !task) dismiss(alarm.taskId);
  }, [alarm, task, dismiss]);

  useEffect(() => {
    if (!alarm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      dismiss(alarm.taskId);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [alarm, dismiss]);

  const meta = alarm ? RINGTONE_META[alarm.tone] : null;
  const style = meta ? MOOD_STYLE[meta.mood] : MOOD_STYLE.calm;

  const snooze = () => {
    if (!alarm) return;
    useTaskStore.getState().snoozeReminder(alarm.taskId, SNOOZE_MINUTES);
    dismiss(alarm.taskId);
  };

  const complete = () => {
    if (!alarm) return;
    useTaskStore.getState().updateTask(alarm.taskId, { status: 'done' });
    dismiss(alarm.taskId);
  };

  return (
    <AnimatePresence>
      {alarm && task && meta && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <motion.div
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-md dark:bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            key={alarm.taskId}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alarm-title"
            className="relative w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-zinc-900"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <div className="relative mx-auto grid size-20 place-items-center">
              {[0, 0.6].map((delay) => (
                <motion.span
                  key={delay}
                  className={cn('absolute inset-0 rounded-full', style.ring)}
                  animate={{ scale: [1, 1.8], opacity: [0.7, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeOut' }}
                />
              ))}
              <motion.span
                className={cn(
                  'relative grid size-20 place-items-center rounded-full bg-gradient-to-br text-white shadow-lg',
                  style.badge,
                )}
                animate={{ rotate: [0, -12, 12, -12, 12, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.6 }}
              >
                <AlarmClock className="size-9" />
              </motion.span>
            </div>

            <p className={cn('mt-6 text-[11px] font-medium tracking-wider uppercase', style.text)}>
              Alarm · {meta.label}
            </p>
            <h2 id="alarm-title" className="mt-1 text-xl font-semibold tracking-tight text-balance">
              {task.title}
            </h2>
            {task.due && (
              <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">Due {formatDue(task.due)}</p>
            )}

            <button
              autoFocus
              onClick={() => dismiss(alarm.taskId)}
              className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Stop alarm
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={snooze}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-100 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <Clock className="size-4" />
                Snooze {SNOOZE_MINUTES}m
              </button>
              <button
                onClick={complete}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
              >
                <Check className="size-4" />
                Mark done
              </button>
            </div>
            {waiting > 0 && (
              <p className="mt-4 text-[11px] text-zinc-400">
                {waiting} more {waiting === 1 ? 'alarm' : 'alarms'} waiting
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
