import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// ビルド時にバージョン（package.json）と短縮 SHA（git）を注入する（renderer の AboutDialog 用）
const pkgVersion = JSON.parse(readFileSync('./package.json', 'utf8')).version as string;
const buildSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

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
    define: {
      __APP_VERSION__: JSON.stringify(pkgVersion),
      __BUILD_SHA__: JSON.stringify(buildSha),
    },
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: 'index.html',
      },
    },
  },
});
