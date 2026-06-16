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
      a: ({ href, children }) => (
        <Link>
          <a href={href} target={href && href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
            {children}
          </a>
        </Link>
      ),
    }}
  >
    {source}
  </ReactMarkdown>
);
