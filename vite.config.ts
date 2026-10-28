import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode single` inlines all JS/CSS into one index.html that opens straight from disk.
// `--mode desktop` uses relative asset paths so Electron can load the build over file://.
const OUT_DIRS: Record<string, string> = { single: 'dist-single', desktop: 'dist-desktop' };

export default defineConfig(({ mode }) => ({
  base: mode === 'desktop' ? './' : '/',
  plugins: [react(), tailwindcss(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: OUT_DIRS[mode] ? { outDir: OUT_DIRS[mode] } : undefined,
}));
