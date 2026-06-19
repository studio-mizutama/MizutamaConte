import React, { useState } from 'react';
import { PAGES, md, Locale, DocPage } from './content/manifest';
import { Markdown } from './Markdown';
import { Shortcuts } from './Shortcuts';
import { SiteHeader } from './SiteHeader';
import { buildPath } from './route';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';

// group.en をキーに、出現順(=order)でグループ化
const groupedPages = (): { group: Record<Locale, string>; pages: DocPage[] }[] => {
  const sorted = [...PAGES].sort((a, b) => a.order - b.order);
  const out: { group: Record<Locale, string>; pages: DocPage[] }[] = [];
  for (const p of sorted) {
    const last = out[out.length - 1];
    if (last && last.group.en === p.group.en) last.pages.push(p);
    else out.push({ group: p.group, pages: [p] });
  }
  return out;
};

// locale/pageId は URL 由来（App が parseRoute して渡す）。リンクは buildPath のクリーンURL。
export const DocsApp: React.FC<{ locale: Locale; pageId: string; base: string }> = ({ locale, pageId, base }) => {
  // スマホ用: 目次（サイドバー）の開閉。デスクトップでは CSS で常時表示。
  const [tocOpen, setTocOpen] = useState(false);
  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0];
  const groups = groupedPages();
  const tocLabel = { ja: '目次', ko: '목차', en: 'Contents' }[locale];

  return (
    <div>
      <SiteHeader locale={locale} pageId={page.id} base={base} />

      <div className="docs-layout">
        <button className="toc-toggle" aria-expanded={tocOpen} onClick={() => setTocOpen((v) => !v)}>
          <ShowMenu aria-hidden />{tocLabel}
        </button>
        <aside className={`docs-side${tocOpen ? ' open' : ''}`}>
          {groups.map((g) => (
            <div className="grp" key={g.group.en}>
              <div className="side-h">{g.group[locale]}</div>
              {g.pages.map((p) => (
                <a key={p.id} href={buildPath(base, locale, p.id)} className={p.id === page.id ? 'on' : ''}>
                  {p.title[locale]}
                </a>
              ))}
            </div>
          ))}
        </aside>

        <main className="docs-main">
          {page.component === 'shortcuts'
            ? <Shortcuts locale={locale} />
            : <Markdown source={md(locale, page.id)} />}
        </main>
      </div>
    </div>
  );
};
