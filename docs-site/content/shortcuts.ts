import { Locale } from './manifest';

// 実装監査(react-hotkeys-hook 登録 + Electron menu accelerator)から起こした単一ソース。
// 仕様変更時はここを更新（src/ToolGroup.tsx, src/Header.tsx, electron/menu.ts 等が出典）。
export type Localized = Record<Locale, string>;
export type Shortcut = { act: Localized; mac: string[]; win: string[]; note?: Localized };
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

const L = (ja: string, ko: string, en: string): Localized => ({ ja, ko, en });
const G = (ja: string, ko: string, en: string): Record<Locale, string> => ({ ja, ko, en });

export const SHORTCUTS: ScGroup[] = [
  {
    h: G('ファイル', '파일', 'File'),
    rows: [
      { act: L('新規プロジェクト', '새 프로젝트', 'New project'), mac: ['⌘', 'N'], win: ['Ctrl', 'N'] },
      { act: L('脚本から新規', '각본에서 새로 만들기', 'New from Script'), mac: ['⌘', '⇧', 'N'], win: ['Ctrl', 'Shift', 'N'] },
      { act: L('開く', '열기', 'Open'), mac: ['⌘', 'O'], win: ['Ctrl', 'O'] },
      { act: L('絵コンテ印刷', '콘티 인쇄', 'Print Storyboard'), mac: ['⌘', 'P'], win: ['Ctrl', 'P'] },
      { act: L('動画書き出し', '동영상 내보내기', 'Export Video'), mac: ['⌘', 'E'], win: ['Ctrl', 'E'] },
      { act: L('再読み込み', '새로고침', 'Reload'), mac: ['⌘', 'R'], win: ['Ctrl', 'R'] },
      { act: L('設定', '설정', 'Preferences'), mac: ['⌘', '.'], win: ['Ctrl', '.'] },
    ],
  },
  {
    h: G('編集', '편집', 'Edit'),
    rows: [
      { act: L('元に戻す', '실행 취소', 'Undo'), mac: ['⌘', 'Z'], win: ['Ctrl', 'Z'] },
      { act: L('やり直す', '다시 실행', 'Redo'), mac: ['⌘', '⇧', 'Z'], win: ['Ctrl', 'Shift', 'Z'] },
      {
        act: L('クロップ時に縦/横/比率スナップ', '크롭 시 세로/가로/비율 스냅', 'Snap to H / V / aspect while cropping'),
        mac: ['⇧', '＋ drag'],
        win: ['Shift', '＋ drag'],
      },
    ],
  },
  {
    h: G('タブ / ツール', '탭 / 도구', 'Tabs / Tools'),
    rows: [
      {
        act: L('編集タブ', '편집 탭', 'Edit Tab'),
        mac: ['E'],
        win: ['E'],
        note: L('または ⌘1', '또는 ⌘1', 'or ⌘1 / Ctrl 1'),
      },
      {
        act: L('プレビュータブ', '미리보기 탭', 'Preview Tab'),
        mac: ['P'],
        win: ['P'],
        note: L('または ⌘2', '또는 ⌘2', 'or ⌘2 / Ctrl 2'),
      },
      { act: L('選択ツール', '선택 도구', 'Selection tool'), mac: ['V'], win: ['V'] },
      { act: L('クロップ / リサイズ', '크롭 / 리사이즈', 'Crop / Resize tool'), mac: ['C'], win: ['C'] },
      { act: L('並べ替えツール', '재정렬 도구', 'Reorder tool'), mac: ['R'], win: ['R'] },
      { act: L('ストップウォッチ（尺計測）', '스톱워치(길이 측정)', 'Stopwatch (timing) tool'), mac: ['T'], win: ['T'] },
    ],
  },
  {
    h: G('プレビュー', '미리보기', 'Preview'),
    rows: [
      { act: L('再生 / 一時停止', '재생 / 일시정지', 'Play / Pause'), mac: ['Space'], win: ['Space'] },
      { act: L('コマ送り', '프레임 이동', 'Step frame'), mac: ['←', '→'], win: ['←', '→'] },
      { act: L('前 / 次のカット', '이전 / 다음 컷', 'Previous / Next cut'), mac: ['↑', '↓'], win: ['↑', '↓'] },
      { act: L('先頭へ', '처음으로', 'Rewind to start'), mac: ['⌘', '←'], win: ['Home'] },
      { act: L('末尾へ', '끝으로', 'Jump to end'), mac: ['⌘', '→'], win: ['End'] },
    ],
  },
  {
    h: G('ストップウォッチ', '스톱워치', 'Stopwatch'),
    rows: [
      { act: L('計測 開始 / 停止', '측정 시작 / 정지', 'Start / Stop timing'), mac: ['Space'], win: ['Space'] },
      { act: L('計測をキャンセル', '측정 취소', 'Cancel timing'), mac: ['Esc'], win: ['Esc'] },
    ],
  },
];
