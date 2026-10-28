import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout, SmartView, Status, ThemeMode } from '../types';

interface EditorState {
  open: boolean;
  taskId: string | null;
  defaultStatus: Status;
}

interface UIState {
  theme: ThemeMode;
  layout: Layout;
  view: SmartView;
  categoryId: string | null;
  search: string;
  sidebarOpen: boolean;
  editor: EditorState;

  setTheme: (theme: ThemeMode) => void;
  setLayout: (layout: Layout) => void;
  setView: (view: SmartView) => void;
  setCategory: (id: string | null) => void;
  setSearch: (search: string) => void;
  setSidebarOpen: (open: boolean) => void;
  openEditor: (taskId?: string | null, defaultStatus?: Status) => void;
  closeEditor: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      layout: 'board',
      view: 'all',
      categoryId: null,
      search: '',
      sidebarOpen: false,
      editor: { open: false, taskId: null, defaultStatus: 'todo' },

      setTheme: (theme) => set({ theme }),
      setLayout: (layout) => set({ layout }),
      setView: (view) => set({ view, categoryId: null, sidebarOpen: false }),
      setCategory: (categoryId) => set({ categoryId, view: 'all', sidebarOpen: false }),
      setSearch: (search) => set({ search }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      openEditor: (taskId = null, defaultStatus = 'todo') =>
        set({ editor: { open: true, taskId, defaultStatus } }),
      closeEditor: () => set((s) => ({ editor: { ...s.editor, open: false } })),
    }),
    {
      // Key is read by the pre-paint theme script in index.html.
      name: 'nova-ui',
      partialize: (s) => ({ theme: s.theme, layout: s.layout }),
    },
  ),
);
