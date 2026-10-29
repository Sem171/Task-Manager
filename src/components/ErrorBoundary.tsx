import { Component, type ReactNode } from 'react';

/** Without this, a render error unmounts the whole tree and leaves a blank white window. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Nova crashed while rendering', error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <div className="surface w-full max-w-md space-y-3 p-6 text-center">
          <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Your tasks are saved. Reloading usually fixes this.</p>
          <pre className="max-h-32 overflow-auto rounded-lg bg-zinc-100 p-2 text-left font-mono text-[11px] whitespace-pre-wrap text-rose-600 dark:bg-white/5 dark:text-rose-400">
            {error.message}
          </pre>
          <button
            onClick={() => location.reload()}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
