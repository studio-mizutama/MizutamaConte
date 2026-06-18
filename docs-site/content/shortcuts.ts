import { Locale } from './manifest';

// 実装監査(react-hotkeys-hook 登録 + Electron menu accelerator)から起こした単一ソース。
// 仕様変更時はここを更新（src/ToolGroup.tsx, src/Header.tsx, electron/menu.ts 等が出典）。
export type Bilingual = { ja: string; en: string };
export type Shortcut = { act: Bilingual; mac: string[]; win: string[]; note?: Bilingual };
export type ScGroup = { h: Record<Locale, string>; rows: Shortcut[] };

export const SC_INTRO: Record<Locale, string> = {
  ja: 'よく使う操作の一覧です。Mac は ⌘、Windows / Linux は Ctrl に読み替えてください。アプリのヘルプからこのページへ直接来られます。',
  ko: '자주 쓰는 조작 목록입니다. Mac은 ⌘, Windows / Linux는 Ctrl로 바꿔 읽으세요. 앱의 도움말에서 이 페이지로 바로 올 수 있습니다.',
  en: 'A list of common actions. On Mac use ⌘; on Windows / Linux use Ctrl. You can reach this page directly from the app’s Help menu.',
};
export const SC_COLS: Record<Locale, { act: string; mac: string; win: string }> = {
  ja: { act: '操作', mac: 'Mac', win: 'Windows / Linux' },
  ko: { act: '조작', mac: 'Mac', win: 'Windows / Linux' },
  en: { act: 'Action', mac: 'Mac', win: 'Windows / Linux' },
};

const G = (ja: string, ko: string, en: string): Record<Locale, string> => ({ ja, ko, en });

export const SHORTCUTS: ScGroup[] = [
  {
    h: G('ファイル', '파일', 'File'),
    rows: [
      { act: { ja: '新規プロジェクト', en: 'New project' }, mac: ['⌘', 'N'], win: ['Ctrl', 'N'] },
      { act: { ja: '脚本から新規', en: 'New from script' }, mac: ['⌘', '⇧', 'N'], win: ['Ctrl', 'Shift', 'N'] },
      { act: { ja: '開く', en: 'Open' }, mac: ['⌘', 'O'], win: ['Ctrl', 'O'] },
      { act: { ja: '印刷 / PDF', en: 'Print / PDF' }, mac: ['⌘', 'P'], win: ['Ctrl', 'P'] },
      { act: { ja: '動画書き出し', en: 'Export video' }, mac: ['⌘', 'E'], win: ['Ctrl', 'E'] },
      { act: { ja: '再読み込み', en: 'Reload project' }, mac: ['⌘', 'R'], win: ['Ctrl', 'R'] },
      { act: { ja: '設定', en: 'Preferences' }, mac: ['⌘', '.'], win: ['Ctrl', '.'] },
    ],
  },
  {
    h: G('編集', '편집', 'Edit'),
    rows: [
      { act: { ja: '元に戻す', en: 'Undo' }, mac: ['⌘', 'Z'], win: ['Ctrl', 'Z'] },
      { act: { ja: 'やり直す', en: 'Redo' }, mac: ['⌘', '⇧', 'Z'], win: ['Ctrl', 'Shift', 'Z'] },
      {
        act: { ja: 'クロップ時に縦/横/比率スナップ', en: 'Snap to H / V / aspect while cropping' },
        mac: ['⇧', '＋ drag'],
        win: ['Shift', '＋ drag'],
      },
    ],
  },
  {
    h: G('タブ / ツール', '탭 / 도구', 'Tabs / Tools'),
    rows: [
      {
        act: { ja: 'Edit タブ', en: 'Edit tab' },
        mac: ['E'],
        win: ['E'],
        note: { ja: 'または ⌘1', en: 'or ⌘1 / Ctrl 1' },
      },
      {
        act: { ja: 'Preview タブ', en: 'Preview tab' },
        mac: ['P'],
        win: ['P'],
        note: { ja: 'または ⌘2', en: 'or ⌘2 / Ctrl 2' },
      },
      { act: { ja: '選択ツール', en: 'Selection tool' }, mac: ['V'], win: ['V'] },
      { act: { ja: 'クロップ / リサイズ', en: 'Crop / Resize tool' }, mac: ['C'], win: ['C'] },
      { act: { ja: '並べ替えツール', en: 'Reorder tool' }, mac: ['R'], win: ['R'] },
      { act: { ja: 'ストップウォッチ（尺計測）', en: 'Stopwatch (timing) tool' }, mac: ['T'], win: ['T'] },
    ],
  },
  {
    h: G('プレビュー', '미리보기', 'Preview'),
    rows: [
      { act: { ja: '再生 / 一時停止', en: 'Play / Pause' }, mac: ['Space'], win: ['Space'] },
      { act: { ja: 'コマ送り', en: 'Step frame' }, mac: ['←', '→'], win: ['←', '→'] },
      { act: { ja: '前 / 次のカット', en: 'Previous / Next cut' }, mac: ['↑', '↓'], win: ['↑', '↓'] },
      { act: { ja: '先頭へ', en: 'Rewind to start' }, mac: ['⌘', '←'], win: ['Home'] },
      { act: { ja: '末尾へ', en: 'Jump to end' }, mac: ['⌘', '→'], win: ['End'] },
    ],
  },
  {
    h: G('ストップウォッチ', '스톱워치', 'Stopwatch'),
    rows: [
      { act: { ja: '計測 開始 / 停止', en: 'Start / Stop timing' }, mac: ['Space'], win: ['Space'] },
      { act: { ja: '計測をキャンセル', en: 'Cancel timing' }, mac: ['Esc'], win: ['Esc'] },
    ],
  },
];
