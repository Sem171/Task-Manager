import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { addDays, atTime, formatTime, isSameDay, startOfDay } from '../../lib/date';
import { cn } from '../../lib/utils';

interface Props {
  id?: string;
  value: string | null;
  onChange: (iso: string | null) => void;
}

const ITEM_H = 36;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** Calendar + scroll-wheel time picker; replaces the native datetime-local popup. */
export function DateTimePicker({ id, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = value ? new Date(value) : null;
  // Time shown on the wheels before anything is picked.
  const shown = current ?? atTime(new Date(), 17);
  const [view, setView] = useState(() => monthStart(shown));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Capture phase so Escape closes the picker without also closing the modal.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const commit = (d: Date) => onChange(d.toISOString());

  const pickDay = (day: Date) => {
    commit(new Date(day.getFullYear(), day.getMonth(), day.getDate(), shown.getHours(), shown.getMinutes()));
  };

  const pickTime = (hours: number, minutes: number) => {
    const base = current ?? new Date();
    commit(new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes));
  };

  const hour12 = shown.getHours() % 12 || 12;
  const pm = shown.getHours() >= 12;
  const to24 = (h12: number, isPm: boolean) => (h12 % 12) + (isPm ? 12 : 0);

  const gridStart = addDays(view, -view.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setView(monthStart(shown));
          setOpen((o) => !o);
        }}
        className="field flex items-center justify-between gap-2 text-left font-mono text-[13px]"
      >
        <span className={cn(!current && 'text-zinc-400')}>
          {current ? `${dateFmt.format(current)} · ${formatTime(current)}` : 'Pick date & time'}
        </span>
        <CalendarDays className="size-4 shrink-0 opacity-50" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choose deadline"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            className="absolute top-full left-0 z-30 mt-2 flex origin-top-left flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white bg-linear-to-br from-violet-500/[0.07] via-transparent to-cyan-500/[0.07] shadow-2xl shadow-violet-950/10 sm:flex-row dark:border-white/10 dark:bg-zinc-900 dark:from-violet-500/[0.12] dark:to-cyan-500/[0.08] dark:shadow-black/50"
          >
            <div className="w-[264px] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="pl-1 text-sm font-semibold">{monthFmt.format(view)}</span>
                <div className="flex gap-0.5">
                  <IconButton label="Previous month" onClick={() => setView(addMonths(view, -1))}>
                    <ChevronLeft className="size-4" />
                  </IconButton>
                  <IconButton label="Next month" onClick={() => setView(addMonths(view, 1))}>
                    <ChevronRight className="size-4" />
                  </IconButton>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-[11px] font-medium text-zinc-400">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1">
                    {w}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((d) => {
                  const selected = current !== null && isSameDay(d, current);
                  const outside = d.getMonth() !== view.getMonth();
                  return (
                    <button
                      key={d.getTime()}
                      type="button"
                      onClick={() => pickDay(d)}
                      className={cn(
                        'h-8 rounded-lg text-[13px] tabular-nums transition-colors',
                        selected
                          ? 'bg-linear-to-br from-violet-500 to-fuchsia-500 font-semibold text-white shadow-md shadow-violet-500/30'
                          : 'hover:bg-linear-to-br hover:from-violet-500/10 hover:to-cyan-500/10',
                        !selected && outside && 'text-zinc-300 dark:text-zinc-600',
                        !selected && isSameDay(d, today) && 'font-semibold text-violet-600 dark:text-violet-400',
                      )}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView(monthStart(today));
                    pickDay(today);
                  }}
                  className="rounded-md px-2 py-1 text-violet-600 hover:bg-violet-500/10 dark:text-violet-400"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 border-t border-zinc-200 px-3 py-3 sm:border-t-0 sm:border-l dark:border-white/10">
              <Wheel
                label="Hour"
                items={HOURS}
                index={hour12 - 1}
                onChange={(i) => pickTime(to24(i + 1, pm), shown.getMinutes())}
              />
              <span className="pb-0.5 font-semibold text-zinc-400">:</span>
              <Wheel
                label="Minute"
                items={MINUTES}
                index={shown.getMinutes()}
                onChange={(i) => pickTime(shown.getHours(), i)}
              />
              <Wheel
                label="AM or PM"
                items={PERIODS}
                index={pm ? 1 : 0}
                onChange={(i) => pickTime(to24(hour12, i === 1), shown.getMinutes())}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface WheelProps {
  label: string;
  items: string[];
  index: number;
  onChange: (index: number) => void;
}

/** Snapping drum column: one mouse-wheel notch glides exactly one row. */
function Wheel({ label, items, index, onChange }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(index);
  const target = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const indexRef = useRef(index);
  indexRef.current = index;

  const glideTo = (i: number, behavior: ScrollBehavior = 'smooth') => {
    const el = ref.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    target.current = next;
    el.scrollTo({ top: next * ITEM_H, behavior });
  };

  // Jump into place on mount, glide when the value changes from outside.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (target.current === null && Math.round(el.scrollTop / ITEM_H) !== index) {
      glideTo(index, el.dataset.ready ? 'smooth' : 'instant');
    }
    el.dataset.ready = '1';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let settleTimer = 0;
    let acc = 0;

    const settle = () => {
      target.current = null;
      const i = Math.round(el.scrollTop / ITEM_H);
      if (i !== indexRef.current) onChangeRef.current(i);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setCenter(el.scrollTop / ITEM_H));
      // Fallback for engines without the scrollend event.
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 140);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Lines → pixels so mice and trackpads accumulate on the same scale.
      acc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(acc) < 30) return;
      const step = Math.sign(acc);
      acc = 0;
      const from = target.current ?? Math.round(el.scrollTop / ITEM_H);
      glideTo(from + step);
    };

    const onScrollEnd = () => {
      window.clearTimeout(settleTimer);
      settle();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScrollEnd);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScrollEnd);
      el.removeEventListener('wheel', onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative" style={{ height: ITEM_H * VISIBLE }}>
      <div
        className="pointer-events-none absolute inset-x-0 rounded-lg bg-linear-to-r from-violet-500/20 to-cyan-500/20 ring-1 ring-violet-500/30"
        style={{ top: PAD, height: ITEM_H }}
      />
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault();
          glideTo((target.current ?? index) + (e.key === 'ArrowDown' ? 1 : -1));
        }}
        className="wheel h-full w-12 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-lg focus-visible:outline-offset-0"
        // Gradient mask so rows fade in and out at the top and bottom edges.
        style={{
          paddingBlock: PAD,
          maskImage: 'linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)',
        }}
      >
        {items.map((item, i) => {
          const dist = Math.min(Math.abs(i - center), 2.5);
          return (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={i === index}
              tabIndex={-1}
              onClick={() => glideTo(i)}
              className={cn(
                'flex w-full snap-center items-center justify-center text-sm tabular-nums',
                i === index && 'font-semibold',
              )}
              style={{ height: ITEM_H, opacity: 1 - dist * 0.3, transform: `scale(${1 - dist * 0.06})` }}
            >
              <span
                className={cn(
                  i === index &&
                    'bg-linear-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-300 dark:to-cyan-300',
                )}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
    >
      {children}
    </button>
  );
}

function monthStart(d: Date): Date {
  const s = startOfDay(d);
  s.setDate(1);
  return s;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
