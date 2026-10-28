import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface Props {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Circular, animated completion toggle. */
export function Checkbox({ checked, onChange, label, size = 'md', className }: Props) {
  const dim = size === 'sm' ? 'size-4' : 'size-5';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'group/check relative grid shrink-0 place-items-center rounded-full border transition-colors duration-200',
        dim,
        checked
          ? 'border-transparent bg-gradient-to-br from-violet-500 to-cyan-500'
          : 'border-zinc-300 hover:border-violet-400 dark:border-zinc-600 dark:hover:border-violet-400',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className={size === 'sm' ? 'size-2.5' : 'size-3'} fill="none">
        <motion.path
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </button>
  );
}
