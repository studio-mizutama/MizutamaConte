import React, { useEffect, useState } from 'react';
import { PAGES, md, Locale, DocPage } from './content/manifest';
import { Markdown } from './Markdown';
import { Shortcuts } from './Shortcuts';
import { SiteHeader } from './SiteHeader';
import { applyDocLang } from './lang';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';

const currentHash = (): string => window.location.hash.replace(/^#\/?/, '') || PAGES[0].id;

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

export const DocsApp: React.FC = () => {
  const [locale, setLocale] = useState<Locale>(
    ((typeof localStorage !== 'undefined' && localStorage.getItem('docsLocale')) as Locale) || 'ja',
  );
  const [pageId, setPageId] = useState<string>(currentHash());
  // スマホ用: 目次（サイドバー）の開閉。デスクトップでは CSS で常時表示。
  const [tocOpen, setTocOpen] = useState(false);
  // 初回マウント時の locale と切替時の両方で <html lang> を追従させる。
  useEffect(() => { applyDocLang(locale); }, [locale]);
  useEffect(() => {
    const on = () => {
      setPageId(currentHash());
      setTocOpen(false); // ページ移動したら目次は畳む（スマホ）
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0];
  const setLoc = (l: Locale) => {
    setLocale(l);
    try { localStorage.setItem('docsLocale', l); } catch { /* ignore */ }
  };
  const groups = groupedPages();
  const tocLabel = { ja: '目次', ko: '목차', en: 'Contents' }[locale];

  return (
    <div>
      <SiteHeader locale={locale} setLocale={setLoc} />

      <div className="docs-layout">
        <button className="toc-toggle" aria-expanded={tocOpen} onClick={() => setTocOpen((v) => !v)}>
          <ShowMenu aria-hidden />{tocLabel}
        </button>
        <aside className={`docs-side${tocOpen ? ' open' : ''}`}>
          {groups.map((g) => (
            <div className="grp" key={g.group.en}>
              <div className="side-h">{g.group[locale]}</div>
              {g.pages.map((p) => (
                <a key={p.id} href={`#/${p.id}`} className={p.id === page.id ? 'on' : ''} onClick={() => setTocOpen(false)}>
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
