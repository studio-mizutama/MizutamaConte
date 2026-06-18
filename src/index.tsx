import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import App from 'App';
import { ErrorBoundary } from 'ErrorBoundary';
import { emptyProject } from 'project/load';
import { loadAppSettings } from 'settings/appSettings';
import { Locale, ColorScheme } from 'i18n/types';

const DEFAULT_LOCALE: Locale = 'ja';
const DEFAULT_COLOR_SCHEME: ColorScheme = 'system';

// 迷子のファイル/フォルダ ドロップでブラウザが既定でそのファイルを開く（ナビゲートする）のを防ぐ安全網。
// ドロップゾーン自身の React onDrop は引き続き発火する（ここはブラウザ既定動作だけを止める）。
// 将来のウインドウ全体ドロップ受付を妨げないよう、純粋に preventDefault のみ行う。
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

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
    printRequested: false,
    videoExportRequested: false,
    canUndo: false,
    canRedo: false,
    loadError: null,
  });

  // 開発時の検証用: 不正プロジェクト読込のエラーダイアログを手動で起こす（Web の smoke 用。本番では無効）
  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__setLoadError = (msg: string) => setGlobal({ loadError: msg });
  }

  // Provider 構築自体が失敗した時の最後の砦（Provider 外なので react-spectrum/i18n は使えない）。
  // boot で解決済みの locale を使い単一言語で表示する。通常の描画 throw は Provider 内の ErrorBoundary が拾う。
  const rootError =
    locale === 'en'
      ? { msg: 'Something went wrong.', btn: 'Reload' }
      : locale === 'ko'
        ? { msg: '문제가 발생했습니다.', btn: '새로고침' }
        : { msg: '問題が発生しました。', btn: '再読込' };

  ReactDOM.render(
    <React.StrictMode>
      <ErrorBoundary
        fallback={() => (
          <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
            <p>{rootError.msg}</p>
            <button onClick={() => window.location.reload()}>{rootError.btn}</button>
          </div>
        )}
      >
        <App />
      </ErrorBoundary>
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
