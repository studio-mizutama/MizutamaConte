import React, { useEffect, useState } from 'react';
import { Flex, View, Picker, Item, Heading, Text, Divider, Link } from '@adobe/react-spectrum';
import { PAGES, md, Locale } from './content/manifest';
import { Markdown } from './Markdown';

const currentHash = (): string => window.location.hash.replace(/^#\/?/, '') || PAGES[0].id;

export const DocsApp: React.FC = () => {
  const [locale, setLocale] = useState<Locale>(
    ((typeof localStorage !== 'undefined' && localStorage.getItem('docsLocale')) as Locale) || 'ja',
  );
  const [pageId, setPageId] = useState<string>(currentHash());
  useEffect(() => {
    const on = () => setPageId(currentHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0];
  const setLoc = (l: Locale) => {
    setLocale(l);
    try {
      localStorage.setItem('docsLocale', l);
    } catch {
      /* ignore */
    }
  };
  return (
    <Flex height="100vh">
      <View width="size-3600" backgroundColor="gray-75" padding="size-300" overflow="auto">
        <Heading level={3} marginTop="size-0">
          Mizutama Conte
        </Heading>
        <Text>{`v${__APP_VERSION__} | ${__BUILD_SHA__}`}</Text>
        <View marginTop="size-200" marginBottom="size-200">
          <Picker aria-label="Language" selectedKey={locale} onSelectionChange={(k) => setLoc(k as Locale)}>
            <Item key="ja">日本語</Item>
            <Item key="ko">한국어</Item>
            <Item key="en">English</Item>
          </Picker>
        </View>
        <Divider size="S" marginBottom="size-200" />
        <Flex direction="column" gap="size-100">
          {[...PAGES]
            .sort((a, b) => a.order - b.order)
            .map((p) => (
              <Link key={p.id} isQuiet>
                <a href={`#/${p.id}`} style={{ fontWeight: p.id === page.id ? 700 : 400 }}>
                  {p.title[locale]}
                </a>
              </Link>
            ))}
        </Flex>
      </View>
      <View flex padding="size-500" overflow="auto">
        <Markdown source={md(locale, page.id)} />
      </View>
    </Flex>
  );
};
