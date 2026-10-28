import { create } from 'zustand';
import { uid } from '../lib/utils';

export type ToastTone = 'default' | 'success' | 'reminder';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  actions?: ToastAction[];
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id' | 'tone' | 'duration'> & Partial<Pick<Toast, 'tone' | 'duration'>>) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = uid();
    const full: Toast = { tone: 'default', duration: 4500, ...toast, id };
    set((s) => ({ toasts: [...s.toasts.slice(-3), full] }));
    window.setTimeout(() => get().dismiss(id), full.duration);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (...args: Parameters<ToastState['push']>) => useToastStore.getState().push(...args);
