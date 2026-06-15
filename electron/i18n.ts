// main プロセス用の最小 i18n。renderer 側 (src/i18n) とは別プロセスで共有できないため
// メニュー・ネイティブダイアログのラベルのみを持つ独立カタログ（意図的な二重管理）。
import { loadSettings } from './settings';

export type MenuLocale = 'ja' | 'ko' | 'en';

type MenuStrings = {
  'menu.about': string;
  'menu.quit': string;
  'menu.preferences': string;
  'menu.file': string;
  'menu.new': string;
  'menu.open': string;
  'menu.view': string;
  'menu.reload': string;
  'menu.print': string;
  'dialog.create.title': string;
  'dialog.create.button': string;
  'dialog.selectPaintApp.title': string;
};

const catalogs: Record<MenuLocale, MenuStrings> = {
  ja: {
    'menu.about': 'Mizutama Conte について',
    'menu.quit': 'Mizutama Conte を終了',
    'menu.preferences': '設定…',
    'menu.file': 'ファイル',
    'menu.new': '新規',
    'menu.open': '開く…',
    'menu.view': '表示',
    'menu.reload': '再読み込み',
    'menu.print': 'PDF書き出し…',
    'dialog.create.title': '保存先フォルダを選択',
    'dialog.create.button': 'ここに作成',
    'dialog.selectPaintApp.title': 'お絵描きアプリを選択',
  },
  ko: {
    'menu.about': 'Mizutama Conte 정보',
    'menu.quit': 'Mizutama Conte 종료',
    'menu.preferences': '설정…',
    'menu.file': '파일',
    'menu.new': '새로 만들기',
    'menu.open': '열기…',
    'menu.view': '보기',
    'menu.reload': '새로고침',
    'menu.print': 'PDF로 내보내기…',
    'dialog.create.title': '저장할 폴더 선택',
    'dialog.create.button': '여기에 만들기',
    'dialog.selectPaintApp.title': '페인트 앱 선택',
  },
  en: {
    'menu.about': 'About Mizutama Conte',
    'menu.quit': 'Quit Mizutama Conte',
    'menu.preferences': 'Preferences…',
    'menu.file': 'File',
    'menu.new': 'New',
    'menu.open': 'Open…',
    'menu.view': 'View',
    'menu.reload': 'Reload',
    'menu.print': 'Export PDF…',
    'dialog.create.title': 'Select destination folder',
    'dialog.create.button': 'Create here',
    'dialog.selectPaintApp.title': 'Select paint app',
  },
};

const isMenuLocale = (v: unknown): v is MenuLocale => v === 'ja' || v === 'ko' || v === 'en';

/** settings.json の language を現在ロケールとして解決（未設定時は 'ja'）。 */
export const resolveLocale = (): MenuLocale => {
  try {
    const lang = loadSettings().language;
    if (isMenuLocale(lang)) return lang;
  } catch {
    // 読込失敗時は既定
  }
  return 'ja';
};

/** main プロセス用の翻訳関数。 */
export const mt = (locale: MenuLocale, key: keyof MenuStrings): string => catalogs[locale][key];
