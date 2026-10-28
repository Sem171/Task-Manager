import { AnimatePresence, motion } from 'motion/react';
import { BellRing, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToastStore, type ToastTone } from '../../store/toastStore';

const ICONS: Record<ToastTone, typeof Info> = {
  default: Info,
  success: CircleCheck,
  reminder: BellRing,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3.5 shadow-xl shadow-zinc-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-black/40"
            >
              <span
                className={cn(
                  'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full',
                  t.tone === 'reminder' && 'bg-gradient-to-br from-violet-500 to-cyan-500 text-white',
                  t.tone === 'success' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  t.tone === 'default' && 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400',
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                {t.tone === 'reminder' && (
                  <p className="text-[10px] font-medium tracking-wider text-violet-600 uppercase dark:text-violet-400">
                    Reminder
                  </p>
                )}
                <p className="truncate text-sm font-medium">{t.title}</p>
                {t.description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.description}</p>}
                {t.actions && (
                  <div className="mt-2 flex gap-1.5">
                    {t.actions.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => {
                          a.onClick();
                          dismiss(t.id);
                        }}
                        className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-zinc-200"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
