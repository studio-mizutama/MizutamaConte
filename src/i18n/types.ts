/** 対応言語。全大文字タイトル（CUT/PICTURE/ACTION/DIALOGUE/TIME 等）は
 *  どの言語でも英語表記のまま固定し、それ以外をローカライズする。 */
export type Locale = 'ja' | 'ko' | 'en';

export const LOCALES: Locale[] = ['ja', 'ko', 'en'];

/** react-spectrum の Provider に渡す BCP-47 ロケールタグ */
export const localeTag = (locale: Locale): string => {
  switch (locale) {
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    default:
      return 'en-US';
  }
};

/** 言語名は自言語表記（endonym）で全ロケール共通に表示する */
export const LANGUAGE_LABELS: Record<Locale, string> = {
  ja: '日本語',
  ko: '한국어',
  en: 'English',
};

/** テーマ。'system' は OS の prefers-color-scheme に追従（react-spectrum 既定挙動）。 */
export type ColorScheme = 'light' | 'dark' | 'system';
