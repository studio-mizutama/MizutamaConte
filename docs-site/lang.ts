import { Locale } from './content/manifest';

// ja/ko/en はそのまま BCP-47 の primary language subtag として妥当。
// locale 切替時に <html lang> を更新し、ko/en 表示でブラウザ（Chrome 等）の
// 「翻訳しますか？」提案が出ないようにする。docs はハッシュSPAで locale が
// localStorage 管理なので、HTML の lang 属性を JS から追従させる必要がある。
export const applyDocLang = (locale: Locale): void => {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
};
