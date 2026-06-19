import React, { useState } from 'react';
import { Locale } from './content/manifest';
import { buildPath } from './route';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import Close from '@spectrum-icons/workflow/Close';
import logoUrl from './assets/logo.png';

/* 配信時 base=/MizutamaConte/docs/。Web版アプリは親 /MizutamaConte/ に居る。 */
const APP_URL = '../';

// ヘッダー／フッター共通のナビ用ラベル。用語は manifest.ts のページ・グループ名に揃える。
export const NAV: Record<Locale, { usage: string; shortcuts: string; download: string; try: string; menu: string }> = {
  ja: { usage: '使い方', shortcuts: 'ショートカット', download: 'ダウンロード', try: 'ブラウザで試す', menu: 'メニュー' },
  ko: { usage: '사용법', shortcuts: '단축키', download: '다운로드', try: '브라우저에서 사용해보기', menu: '메뉴' },
  en: { usage: 'Guide', shortcuts: 'Shortcuts', download: 'Download', try: 'Try in browser', menu: 'Menu' },
};

/* ランディングとドキュメントで完全に同一のヘッダー。
   ブランド（Mizutama Conte）クリックでその locale のホームへ。
   言語切替は「現在ページの同一 id・別 locale」への実リンク（= URL に locale を含む設計。
   クローラが全 locale を辿れる＋URL と表示が常に一致）。
   スマホ（≤820px）ではナビ一式をハンバーガーのドロップダウンに畳む。 */
export const SiteHeader: React.FC<{ locale: Locale; pageId: string | null; base: string }> = ({ locale, pageId, base }) => {
  const [open, setOpen] = useState(false);
  const n = NAV[locale];
  const close = () => setOpen(false);
  // 言語スイッチャの飛び先: doc ページなら同一 id の別 locale、home なら別 locale の home。
  const langHref = (l: Locale): string => (pageId ? buildPath(base, l, pageId) : buildPath(base, l));
  return (
    <>
      <nav className="lp-nav">
        <div className="wrap">
          <a className="lp-brand" href={buildPath(base, locale)} onClick={close}><img src={logoUrl} alt="Mizutama Conte" />Mizutama&nbsp;Conte</a>
          <button className="lp-burger" aria-label={n.menu} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <Close aria-hidden /> : <ShowMenu aria-hidden />}
          </button>
          <div className={`lp-navlinks${open ? ' open' : ''}`}>
            <a href={buildPath(base, locale, 'usage')} onClick={close}>{n.usage}</a>
            <a href={buildPath(base, locale, 'shortcuts')} onClick={close}>{n.shortcuts}</a>
            <a href={buildPath(base, locale, 'download')} onClick={close}>{n.download}</a>
            <span className="lp-lang">
              {(['ja', 'ko', 'en'] as Locale[]).map((l, i) => (
                <React.Fragment key={l}>
                  {i > 0 && ' · '}
                  <a href={langHref(l)} onClick={close}>
                    {l === locale ? <b>{l.toUpperCase()}</b> : l.toUpperCase()}
                  </a>
                </React.Fragment>
              ))}
            </span>
            <a className="btn btn-ghost btn-sm" href={APP_URL} onClick={close}>{n.try}</a>
          </div>
        </div>
      </nav>
      {/* スマホでドロップダウンを開いた時の背面。nav の外に置く＝backdrop-filter の
          containing block に閉じ込められず viewport 全面を覆える。外側タップで閉じる。 */}
      {open && <div className="lp-backdrop" onClick={close} aria-hidden />}
    </>
  );
};
