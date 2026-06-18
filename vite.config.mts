import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';
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
  plugins: [
    react(),
    tsconfigPaths(),
    // PWA は Web 版アプリ本体（/MizutamaConte/）のみ。Electron は electron.vite.config.ts を
    // 使い本プラグインを通らないので、SW 登録は web ビルドにだけ注入される。
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // 同一 gh-pages 配信で docs は /MizutamaConte/docs/ に同居する。Web 版 SW の
        // スコープ（/MizutamaConte/）は docs を配下に含むため、SPA フォールバックが
        // docs のナビゲーションを横取りしないよう除外する。
        navigateFallbackDenylist: [/\/docs\//],
      },
      manifest: {
        name: 'Mizutama Conte',
        short_name: 'Mizutama Conte',
        description: '絵コンテ制作・管理アプリ',
        lang: 'ja',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
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
