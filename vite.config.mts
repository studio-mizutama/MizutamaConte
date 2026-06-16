import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// ビルド時にバージョン（package.json）と短縮 SHA（git）を注入する（AboutDialog 用）
const pkgVersion = JSON.parse(readFileSync('./package.json', 'utf8')).version as string;
const buildSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

export default defineConfig(({ command }) => ({
  plugins: [react(), tsconfigPaths()],
  define: {
    __APP_VERSION__: JSON.stringify(pkgVersion),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  // 本番ビルド（gh-pages）はサブパス配信、開発（dev:web）はルート配信
  base: command === 'build' ? '/MizutamaConte/' : '/',
}));
