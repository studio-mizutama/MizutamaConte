export type Locale = 'ja' | 'ko' | 'en';
export type DocPage = { id: string; order: number; title: Record<Locale, string> };
export const PAGES: DocPage[] = [
  { id: 'overview', order: 1, title: { ja: 'はじめに', ko: '소개', en: 'Overview' } },
  { id: 'download', order: 2, title: { ja: 'ダウンロード', ko: '다운로드', en: 'Download' } },
  { id: 'usage', order: 3, title: { ja: '使い方の基本', ko: '기본 사용법', en: 'Basic Usage' } },
];
// raw md を一括取り込み（キー例: './ja/overview.md'）
const RAW = import.meta.glob('./*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const md = (locale: Locale, id: string): string =>
  RAW[`./${locale}/${id}.md`] ?? RAW[`./ja/${id}.md`] ?? '';
