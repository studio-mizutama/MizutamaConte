import { PAGES, Locale } from './content/manifest';

export const LOCALES: Locale[] = ['ja', 'ko', 'en'];
const PAGE_IDS = PAGES.map((p) => p.id);

export type RouteKind = 'home' | 'doc' | 'unknown';
export interface Route {
  locale: Locale;
  pageId: string | null;
  kind: RouteKind;
}

const isLocale = (s: string): s is Locale => (LOCALES as string[]).includes(s);

/**
 * base を剥がして pathname を解釈する純関数。
 * - クライアントは base=import.meta.env.BASE_URL（例 /MizutamaConte/docs/）で呼ぶ
 * - prerender はプラグインがアプリ相対 url（例 /ja/usage/）を渡すので base='/' で呼ぶ
 * 判定不能時は locale=ja・kind=unknown（リダイレクタが処理する想定）。
 */
export const parseRoute = (pathname: string, base: string): Route => {
  let rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '');
  rest = rest.replace(/^\/+/, '').replace(/\/+$/, ''); // 前後スラッシュ除去
  const seg = rest.split('/').filter(Boolean);
  if (seg.length === 0) return { locale: 'ja', pageId: null, kind: 'unknown' };
  if (!isLocale(seg[0])) return { locale: 'ja', pageId: null, kind: 'unknown' };
  const locale = seg[0];
  if (seg.length === 1) return { locale, pageId: null, kind: 'home' };
  const pageId = seg[1];
  if (!PAGE_IDS.includes(pageId)) return { locale: 'ja', pageId: null, kind: 'unknown' };
  return { locale, pageId, kind: 'doc' };
};

/** リンク生成の単一ソース。末尾スラッシュ付き（gh-pages のディレクトリ配信に合わせる）。 */
export const buildPath = (base: string, locale: Locale, pageId?: string): string =>
  pageId ? `${base}${locale}/${pageId}/` : `${base}${locale}/`;

/** 全ルート（locale home + 全 doc ページ）を base 付きで列挙。prerender links / sitemap 用。 */
export const allRoutes = (base: string): string[] => {
  const out: string[] = [];
  for (const l of LOCALES) {
    out.push(buildPath(base, l));
    for (const id of PAGE_IDS) out.push(buildPath(base, l, id));
  }
  return out;
};

/**
 * Web版アプリ（エディタ）の絶対URL。docs は base=/MizutamaConte/docs/ 配下に配信され、
 * アプリはその親 /MizutamaConte/ に居る。末尾の docs/ だけを剥がして導出する。
 * 相対 '../' だと nested クリーンURL（/docs/<loc>/<id>/）の深さで解決先がズレるため、
 * buildPath と同じく base 起点の絶対パスを単一ソースで生成する。
 * dev base '/' は docs/ を含まないのでそのまま '/' を返す。
 */
export const appUrl = (base: string): string => base.replace(/docs\/$/, '');

const BCP47: Record<Locale, string> = { ja: 'ja-JP', ko: 'ko-KR', en: 'en-US' };
export const bcp47 = (l: Locale): string => BCP47[l];
