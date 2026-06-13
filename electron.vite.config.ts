import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      lib: {
        entry: 'electron/main.ts',
      },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
      lib: {
        entry: 'electron/preload.ts',
      },
    },
  },
  renderer: {
    root: '.',
    plugins: [react(), tsconfigPaths()],
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: 'index.html',
      },
    },
  },
});
