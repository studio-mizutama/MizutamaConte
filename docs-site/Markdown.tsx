import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Heading, Link } from '@adobe/react-spectrum';

export const Markdown: React.FC<{ source: string }> = ({ source }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      h1: ({ children }) => <Heading level={1}>{children}</Heading>,
      h2: ({ children }) => <Heading level={2}>{children}</Heading>,
      h3: ({ children }) => <Heading level={3}>{children}</Heading>,
      a: ({ href, children }) => {
        // 本文中の旧ハッシュ内部リンク（#/usage 等）は、locale を含むクリーンURL構成では
        // 相対パス（../usage/）に変換する。現在ページ /<loc>/<id>/ からの相対なので
        // locale を知らなくても全言語で正しく解決する。外部リンクは別タブ。
        const isHash = href != null && href.startsWith('#/');
        const resolved = isHash ? `../${href.replace(/^#\/?/, '').replace(/\/+$/, '')}/` : href;
        const external = resolved != null && resolved.startsWith('http');
        return (
          <Link>
            <a href={resolved} target={external ? '_blank' : undefined} rel="noreferrer">
              {children}
            </a>
          </Link>
        );
      },
    }}
  >
    {source}
  </ReactMarkdown>
);
