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
  'menu.newFromScript': string;
  'menu.open': string;
  'menu.recentProjects': string;
  'menu.recentEmpty': string;
  'menu.view': string;
  'menu.edit': string;
  'menu.undo': string;
  'menu.redo': string;
  'menu.editTab': string;
  'menu.previewTab': string;
  'menu.reload': string;
  'menu.print': string;
  'menu.exportVideo': string;
  'menu.window': string;
  'menu.help': string;
  'menu.documentation': string;
  'menu.licenses': string;
  'dialog.create.title': string;
  'dialog.create.button': string;
  'dialog.selectPaintApp.title': string;
  'dialog.saveVideo.title': string;
  'dialog.openScript.title': string;
};

const catalogs: Record<MenuLocale, MenuStrings> = {
  ja: {
    'menu.about': 'Mizutama Conte について',
    'menu.quit': 'Mizutama Conte を終了',
    'menu.preferences': '設定…',
    'menu.file': 'ファイル',
    'menu.new': '新規',
    'menu.newFromScript': '脚本から新規…',
    'menu.open': '開く…',
    'menu.recentProjects': '最近開いたプロジェクト',
    'menu.recentEmpty': '（履歴なし）',
    'menu.view': '表示',
    'menu.edit': '編集',
    'menu.undo': '元に戻す',
    'menu.redo': 'やり直す',
    'menu.editTab': '編集タブ',
    'menu.previewTab': 'プレビュータブ',
    'menu.reload': '再読み込み',
    'menu.print': '絵コンテ印刷…',
    'menu.exportVideo': '動画書き出し…',
    'menu.window': 'ウインドウ',
    'menu.help': 'ヘルプ',
    'menu.documentation': 'ドキュメント',
    'menu.licenses': 'ライセンス',
    'dialog.create.title': '保存先フォルダを選択',
    'dialog.create.button': 'ここに作成',
    'dialog.selectPaintApp.title': 'お絵描きアプリを選択',
    'dialog.saveVideo.title': '動画の保存先',
    'dialog.openScript.title': '脚本ファイルを選択',
  },
  ko: {
    'menu.about': 'Mizutama Conte 정보',
    'menu.quit': 'Mizutama Conte 종료',
    'menu.preferences': '설정…',
    'menu.file': '파일',
    'menu.new': '새로 만들기',
    'menu.newFromScript': '각본에서 새로 만들기…',
    'menu.open': '열기…',
    'menu.recentProjects': '최근 프로젝트',
    'menu.recentEmpty': '(기록 없음)',
    'menu.view': '보기',
    'menu.edit': '편집',
    'menu.undo': '실행 취소',
    'menu.redo': '다시 실행',
    'menu.editTab': '편집 탭',
    'menu.previewTab': '미리보기 탭',
    'menu.reload': '새로고침',
    'menu.print': '콘티 인쇄…',
    'menu.exportVideo': '동영상 내보내기…',
    'menu.window': '창',
    'menu.help': '도움말',
    'menu.documentation': '문서',
    'menu.licenses': '라이선스',
    'dialog.create.title': '저장할 폴더 선택',
    'dialog.create.button': '여기에 만들기',
    'dialog.selectPaintApp.title': '페인트 앱 선택',
    'dialog.saveVideo.title': '동영상 저장 위치',
    'dialog.openScript.title': '각본 파일 선택',
  },
  en: {
    'menu.about': 'About Mizutama Conte',
    'menu.quit': 'Quit Mizutama Conte',
    'menu.preferences': 'Preferences…',
    'menu.file': 'File',
    'menu.new': 'New',
    'menu.newFromScript': 'New from Script…',
    'menu.open': 'Open…',
    'menu.recentProjects': 'Open Recent',
    'menu.recentEmpty': '(No recent projects)',
    'menu.view': 'View',
    'menu.edit': 'Edit',
    'menu.undo': 'Undo',
    'menu.redo': 'Redo',
    'menu.editTab': 'Edit Tab',
    'menu.previewTab': 'Preview Tab',
    'menu.reload': 'Reload',
    'menu.print': 'Print Storyboard…',
    'menu.exportVideo': 'Export Video…',
    'menu.window': 'Window',
    'menu.help': 'Help',
    'menu.documentation': 'Documentation',
    'menu.licenses': 'Licenses',
    'dialog.create.title': 'Select destination folder',
    'dialog.create.button': 'Create here',
    'dialog.selectPaintApp.title': 'Select paint app',
    'dialog.saveVideo.title': 'Save video',
    'dialog.openScript.title': 'Select script file',
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
