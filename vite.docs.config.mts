import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkgVersion = JSON.parse(readFileSync('./package.json', 'utf8')).version as string;
const buildSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

export default defineConfig(({ command }) => ({
  root: 'docs-site',
  base: command === 'build' ? '/MizutamaConte/docs/' : '/',
  plugins: [react(), tsconfigPaths()],
  define: { __APP_VERSION__: JSON.stringify(pkgVersion), __BUILD_SHA__: JSON.stringify(buildSha) },
  build: { outDir: '../build/docs', emptyOutDir: true },
}));
