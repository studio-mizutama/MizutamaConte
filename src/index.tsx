import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import App from 'App';
import { emptyProject } from 'project/load';
import { loadAppSettings } from 'settings/appSettings';
import { Locale, ColorScheme } from 'i18n/types';

const DEFAULT_LOCALE: Locale = 'ja';
const DEFAULT_COLOR_SCHEME: ColorScheme = 'system';

const isLocale = (v: unknown): v is Locale => v === 'ja' || v === 'ko' || v === 'en';
const isColorScheme = (v: unknown): v is ColorScheme => v === 'light' || v === 'dark' || v === 'system';

// 永続設定（言語・テーマ）をロードしてからグローバル状態を seed し描画する。
// こうすることで初回ペイントから正しい言語・テーマで描画され、ちらつきを防ぐ。
const boot = async (): Promise<void> => {
  let locale: Locale = DEFAULT_LOCALE;
  let colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME;
  try {
    const s = await loadAppSettings();
    if (isLocale(s.language)) locale = s.language;
    if (isColorScheme(s.theme)) colorScheme = s.theme;
  } catch {
    // 設定読込失敗時は既定値で続行
  }
  document.documentElement.lang = locale;

  setGlobal({
    mode: 'Edit',
    editorMode: 'edit',
    cut: {},
    project: emptyProject(),
    psdCache: {},
    globalFileName: '',
    isLoading: false,
    saveState: 'idle',
    currentCutIndex: 0,
    selectedCutIndex: 0,
    newProjectOpen: false,
    settingsOpen: false,
    locale,
    colorScheme,
    gitDetect: undefined,
  });

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root'),
  );

  // git 導入状況を起動時 1 回だけ検出してグローバルへ。初回ペイントはブロックしない。
  // Web（api 不在）では発火せず gitDetect は undefined のまま。
  window.api?.git
    ?.detect()
    .then((result) => setGlobal({ gitDetect: result }))
    .catch(() => {
      // 検出失敗時は undefined のまま（git 機能は無効表示にフォールバック）
    });
};

boot();
