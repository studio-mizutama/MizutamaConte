import React from 'react';
import { App } from './App';
import { parseRoute, buildPath, allRoutes, LOCALES, Route } from './route';
import { PAGES, Locale } from './content/manifest';

const ORIGIN = 'https://studio-mizutama.github.io';
const PUBLIC_BASE = '/MizutamaConte/docs/';
const OG_IMAGE = `${ORIGIN}${PUBLIC_BASE}og.png`;
const SITE_NAME = 'Mizutama Conte';

// per-locale のサイト説明（doc ページはページ名を前置）。FAQ 同様、本格コピーは別途。
const SITE_DESC: Record<Locale, string> = {
  ja: 'カメラワーク付きのビデオコンテをプレビューできる絵コンテ制作・管理アプリ Mizutama Conte のドキュメント。',
  ko: '카메라 워크가 들어간 애니매틱을 미리 볼 수 있는 콘티 제작·관리 앱 Mizutama Conte 문서.',
  en: 'Documentation for Mizutama Conte — a storyboard app that previews animatics with camera work.',
};

const titleFor = (route: Route): string => {
  if (route.kind === 'doc') {
    const p = PAGES.find((x) => x.id === route.pageId)!;
    return `${p.title[route.locale]} — ${SITE_NAME}`;
  }
  return `${SITE_NAME} — 絵コンテ制作・管理アプリ`;
};

const descFor = (route: Route): string => {
  if (route.kind === 'doc') {
    const p = PAGES.find((x) => x.id === route.pageId)!;
    return `${p.title[route.locale]} | ${SITE_DESC[route.locale]}`;
  }
  return SITE_DESC[route.locale];
};

const publicUrl = (locale: Locale, pageId?: string): string => `${ORIGIN}${buildPath(PUBLIC_BASE, locale, pageId)}`;

type HeadElement = { type: string; props: Record<string, string> };

export async function prerender(data: { url: string }) {
  // react-dom/server はビルド時のプリレンダでしか使わない。動的 import で独立チャンクに
  // 切り出し、クライアント（main.tsx→App）の bundle に renderToString が混入しないようにする。
  const { renderToString } = await import('react-dom/server');
  // プラグインはアプリ相対 url（例 /ja/usage/）を渡すので base='/' で解釈する。
  const route = parseRoute(data.url, '/');
  // 公開HTMLのリンクは base 付き（/MizutamaConte/docs/...）にしたいので App には PUBLIC_BASE を渡す。
  const html = renderToString(<App route={route} base={PUBLIC_BASE} />);

  const pageId = route.kind === 'doc' ? (route.pageId as string) : undefined;
  const canonical = publicUrl(route.locale, pageId);
  const title = titleFor(route);
  const desc = descFor(route);

  const elements = new Set<HeadElement>();
  elements.add({ type: 'meta', props: { name: 'description', content: desc } });
  elements.add({ type: 'link', props: { rel: 'canonical', href: canonical } });
  // hreflang 相互リンク（ja/ko/en + x-default=ja）
  for (const l of LOCALES) {
    elements.add({ type: 'link', props: { rel: 'alternate', hreflang: l, href: publicUrl(l, pageId) } });
  }
  elements.add({ type: 'link', props: { rel: 'alternate', hreflang: 'x-default', href: publicUrl('ja', pageId) } });
  // OGP / Twitter（per-page）
  elements.add({ type: 'meta', props: { property: 'og:type', content: 'website' } });
  elements.add({ type: 'meta', props: { property: 'og:site_name', content: SITE_NAME } });
  elements.add({ type: 'meta', props: { property: 'og:title', content: title } });
  elements.add({ type: 'meta', props: { property: 'og:description', content: desc } });
  elements.add({ type: 'meta', props: { property: 'og:url', content: canonical } });
  elements.add({ type: 'meta', props: { property: 'og:image', content: OG_IMAGE } });
  elements.add({ type: 'meta', props: { name: 'twitter:card', content: 'summary' } });
  elements.add({ type: 'meta', props: { name: 'twitter:title', content: title } });
  elements.add({ type: 'meta', props: { name: 'twitter:description', content: desc } });
  elements.add({ type: 'meta', props: { name: 'twitter:image', content: OG_IMAGE } });

  // クロール用に全ルート（アプリ相対）を返す。プラグインは links のみから次ルートを発見する。
  const links = new Set<string>(allRoutes('/'));

  return { html, links, head: { lang: route.locale, title, elements } };
}
