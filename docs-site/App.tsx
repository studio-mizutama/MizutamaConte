import React, { useEffect } from 'react';
import { SSRProvider } from '@react-aria/ssr';
import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { Route, bcp47 } from './route';
import { Landing } from './Landing';
import { DocsApp } from './DocsApp';
import { PAGES } from './content/manifest';
import { applyDocLang } from './lang';
import './theme.css';

export interface AppProps {
  route: Route;
  base: string;
}

/**
 * server(renderToString) と client(hydrate) で共通の最上位。
 * - react-spectrum は SSRProvider でラップし locale を明示（SSR の ID 一致＝ハイドレーション不整合防止）。
 * - locale はもはや URL の純粋な関数。切替はフルナビゲーションなので <html lang> は SSR 由来で常に正しいが、
 *   防御的に client で applyDocLang を実行し、redirect カスケード/アプリが参照する localStorage を保存する。
 */
export const App: React.FC<AppProps> = ({ route, base }) => {
  useEffect(() => {
    applyDocLang(route.locale);
    try {
      localStorage.setItem('docsLocale', route.locale);
    } catch {
      /* ignore */
    }
  }, [route.locale]);

  const showHome = route.kind === 'home' || route.kind === 'unknown';
  const pageId = route.kind === 'doc' ? (route.pageId as string) : PAGES[0].id;

  return (
    <SSRProvider>
      <Provider theme={defaultTheme} locale={bcp47(route.locale)} colorScheme="light">
        {showHome ? (
          <Landing locale={route.locale} base={base} />
        ) : (
          <DocsApp locale={route.locale} pageId={pageId} base={base} />
        )}
      </Provider>
    </SSRProvider>
  );
};
