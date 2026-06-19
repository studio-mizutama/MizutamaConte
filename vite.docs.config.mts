import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

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
  plugins: [
    react(),
    tsconfigPaths(),
    // プリレンダリングは本番ビルド時のみ。dev は通常の CSR（main.tsx が pathname で描画）。
    // root '/' を起点に prerender.tsx が links=全ルートを返し、全 locale×ページの
    // 実HTML（<loc>/<id>/index.html）を生成する（additionalPrerenderRoutes 不要）。
    ...(command === 'build'
      ? [vitePrerenderPlugin({ renderTarget: '#root', prerenderScript: 'docs-site/prerender.tsx' })]
      : []),
  ],
  resolve: {
    alias: {
      // react-markdown→micromark の依存。exports の `browser` 条件で DOM 依存の
      // index.dom.js が選ばれると、Node で走る prerender が `document` 不在で落ちる。
      // DOM 非依存の index.js に固定（クライアント・prerender 双方で安全）。
      'decode-named-character-reference': resolvePath('node_modules/decode-named-character-reference/index.js'),
    },
  },
  define: { __APP_VERSION__: JSON.stringify(pkgVersion), __BUILD_SHA__: JSON.stringify(buildSha) },
  build: { outDir: '../build/docs', emptyOutDir: true },
}));
