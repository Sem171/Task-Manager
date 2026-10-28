import { useEffect, useRef } from 'react';
import { isTypingTarget } from '../lib/utils';

type Handler = (e: KeyboardEvent) => void;

/**
 * Global shortcuts. Keys are matched case-insensitively; prefix with "mod+"
 * for Ctrl/⌘. Plain keys are ignored while the user is typing.
 */
export function useHotkeys(bindings: Record<string, Handler>) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = (mod ? 'mod+' : '') + e.key.toLowerCase();
      const handler = ref.current[key];
      if (!handler) return;
      if (!mod && (isTypingTarget(e.target) || e.altKey)) return;
      e.preventDefault();
      handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
