import { describe, it, expect } from 'vitest';
import { parseRoute, buildPath, allRoutes, bcp47, LOCALES } from './route';
import { PAGES } from './content/manifest';

const B = '/MizutamaConte/docs/';

describe('parseRoute', () => {
  it('裸root(base のみ)は unknown→ja フォールバック', () => {
    expect(parseRoute(B, B)).toEqual({ locale: 'ja', pageId: null, kind: 'unknown' });
  });
  it('locale home', () => {
    expect(parseRoute(B + 'ko/', B)).toEqual({ locale: 'ko', pageId: null, kind: 'home' });
    expect(parseRoute(B + 'en', B)).toEqual({ locale: 'en', pageId: null, kind: 'home' });
  });
  it('doc ページ', () => {
    expect(parseRoute(B + 'ja/usage/', B)).toEqual({ locale: 'ja', pageId: 'usage', kind: 'doc' });
    expect(parseRoute(B + 'en/script-syntax', B)).toEqual({ locale: 'en', pageId: 'script-syntax', kind: 'doc' });
  });
  it('未知 locale は ja・未知 id は unknown', () => {
    expect(parseRoute(B + 'fr/usage', B)).toEqual({ locale: 'ja', pageId: null, kind: 'unknown' });
    expect(parseRoute(B + 'ja/nope', B)).toEqual({ locale: 'ja', pageId: null, kind: 'unknown' });
  });
  it('dev base "/" でも動く（prerender は base=/ で呼ぶ）', () => {
    expect(parseRoute('/ja/usage/', '/')).toEqual({ locale: 'ja', pageId: 'usage', kind: 'doc' });
    expect(parseRoute('/', '/')).toEqual({ locale: 'ja', pageId: null, kind: 'unknown' });
    expect(parseRoute('/en/', '/')).toEqual({ locale: 'en', pageId: null, kind: 'home' });
  });
});

describe('buildPath', () => {
  it('home / doc とも末尾スラッシュ', () => {
    expect(buildPath(B, 'ja')).toBe(B + 'ja/');
    expect(buildPath(B, 'ko', 'usage')).toBe(B + 'ko/usage/');
  });
  it('base=/ でアプリ相対パスを作れる', () => {
    expect(buildPath('/', 'en', 'shortcuts')).toBe('/en/shortcuts/');
  });
});

describe('allRoutes', () => {
  it('各 locale の home + 全 doc ページを base 付きで返す（件数=locale×(pages+1)）', () => {
    const r = allRoutes(B);
    expect(r).toContain(B + 'ja/');
    expect(r).toContain(B + 'en/shortcuts/');
    expect(r).toContain(B + 'ja/faq/');
    // ページ追加に追従（home 1 + 各 doc ページ）。重複・欠落は検出する。
    expect(r.length).toBe(LOCALES.length * (PAGES.length + 1));
  });
  it('base=/ でアプリ相対の全ルート', () => {
    expect(allRoutes('/')).toContain('/ja/usage/');
  });
});

describe('bcp47', () => {
  it('locale を BCP-47 に', () => {
    expect(bcp47('ja')).toBe('ja-JP');
    expect(bcp47('ko')).toBe('ko-KR');
    expect(bcp47('en')).toBe('en-US');
  });
});
