import { useGlobal } from 'reactn';
import { en, TranslationKey } from './catalogs/en';
import { ja } from './catalogs/ja';
import { ko } from './catalogs/ko';
import { Locale } from './types';

const catalogs: Record<Locale, Record<TranslationKey, string>> = { en, ja, ko };

export type TranslateParams = Record<string, string | number>;

/** ロケールとキーから文字列を引く。{name} を params で展開。未定義キーは en → key の順でフォールバック。 */
export const translate = (locale: Locale, key: TranslationKey, params?: TranslateParams): string => {
  const template = catalogs[locale]?.[key] ?? en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`,
  );
};

/** コンポーネント内で現在ロケールに従って翻訳する関数を返すフック。 */
export const useT = (): ((key: TranslationKey, params?: TranslateParams) => string) => {
  const locale = useGlobal('locale')[0];
  return (key: TranslationKey, params?: TranslateParams) => translate(locale, key, params);
};

export * from './types';
export type { TranslationKey };
