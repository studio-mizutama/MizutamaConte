export type Locale = 'ja' | 'ko' | 'en';
export type DocPage = {
  id: string;
  order: number;
  group: Record<Locale, string>;
  title: Record<Locale, string>;
  /** md ではなくコンポーネントで描画するページ（例: shortcuts） */
  component?: 'shortcuts';
};

const G = {
  start: { ja: 'はじめに', ko: '시작하기', en: 'Getting Started' },
  guide: { ja: '使い方', ko: '사용법', en: 'Guide' },
  ref: { ja: 'リファレンス', ko: '레퍼런스', en: 'Reference' },
  support: { ja: 'サポート', ko: '지원', en: 'Support' },
};

export const PAGES: DocPage[] = [
  { id: 'overview', order: 1, group: G.start, title: { ja: 'はじめに', ko: '소개', en: 'Overview' } },
  { id: 'download', order: 2, group: G.start, title: { ja: 'ダウンロード', ko: '다운로드', en: 'Download' } },
  { id: 'usage', order: 3, group: G.guide, title: { ja: '使い方の基本', ko: '기본 사용법', en: 'Basic Usage' } },
  { id: 'script-syntax', order: 4, group: G.ref, title: { ja: '脚本インポート記法', ko: '스크립트 가져오기 문법', en: 'Script Import Syntax' } },
  { id: 'shortcuts', order: 5, group: G.ref, component: 'shortcuts', title: { ja: 'ショートカット', ko: '단축키', en: 'Shortcuts' } },
  { id: 'faq', order: 6, group: G.support, title: { ja: 'よくある質問', ko: '자주 묻는 질문', en: 'FAQ' } },
];

// raw md を一括取り込み（キー例: './ja/overview.md'）
const RAW = import.meta.glob('./*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const md = (locale: Locale, id: string): string =>
  RAW[`./${locale}/${id}.md`] ?? RAW[`./ja/${id}.md`] ?? '';
