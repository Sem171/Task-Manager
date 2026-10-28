import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/** Pill-style segmented control with a sliding highlight. */
export function Segmented<T extends string>({ value, options, onChange, size = 'md', className }: Props<T>) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex rounded-xl bg-zinc-100 p-0.5 dark:bg-white/5',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-[10px] font-medium whitespace-nowrap transition-colors',
              size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5',
              active
                ? 'text-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[10px] bg-white shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-700/80 dark:ring-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
