import React, { useState } from 'react';
import { Locale } from './content/manifest';
import { SiteHeader, NAV } from './SiteHeader';
import Camera from '@spectrum-icons/workflow/Camera';
import LockClosed from '@spectrum-icons/workflow/LockClosed';
import Draw from '@spectrum-icons/workflow/Draw';
import studioLogo from './assets/studio-logo.svg';

// 3本柱のアイコン（Spectrum・全ロケール共通。ネイティブ絵文字は使わない方針）
const PILLAR_ICONS = [Camera, LockClosed, Draw];

/* 配信時 base=/MizutamaConte/docs/。Web版アプリは親 /MizutamaConte/ に居る。 */
const APP_URL = '../';
const REPO_URL = 'https://github.com/studio-mizutama/MizutamaConte';

// 問い合わせ先（収集bot対策：アドレスは user / domain に分割保持し、静的HTML・DOM に
// mailto: と素アドレスを残さない。クリック時にだけ組み立ててメーラーを起動。件名のみ・本文テンプレ無し）。
const CONTACT_USER = 'conte';
const CONTACT_DOMAIN = 'studio-mizutama.net';
const openContact = (): void => {
  const subject = '[Mizutama Conte] 商用ライセンスのお問い合わせ';
  window.location.href = `mailto:${CONTACT_USER}@${CONTACT_DOMAIN}?subject=${encodeURIComponent(subject)}`;
};

/* 画像/動画の枠。public/shots/<file> を参照し、無ければラベル＋ファイル名のプレースホルダ。
   ＝ユーザーがそのファイル名で shots/ に置けば自動で表示される。 */
const Shot: React.FC<{ file: string; label: string; video?: boolean }> = ({ file, label, video }) => {
  const [err, setErr] = useState(false);
  const src = `${import.meta.env.BASE_URL}shots/${file}`;
  // 拡張子で動画/画像を自動判定（video を明示指定した場合はそれを優先）。
  // png ↔ mp4 をファイル名だけで切り替えられ、行ごとに on/off 不要。
  const isVideo = video ?? /\.(mp4|webm|mov|m4v|ogg)$/i.test(file);
  if (err) {
    return (
      <div className="shot ph">
        <span>{label}</span>
        <code className="ph-file">public/shots/{file}</code>
      </div>
    );
  }
  return (
    <div className="shot">
      {isVideo
        ? <video src={src} autoPlay loop muted playsInline onError={() => setErr(true)} />
        : <img src={src} alt={label} onError={() => setErr(true)} />}
    </div>
  );
};

// 各機能行のスクショ・ファイル名（全ロケール共通）。ユーザーは public/shots/ にこの名前で置く。
const FEAT_FILES = ['feat-psd.mp4', 'feat-camera.mp4', 'feat-stopwatch.mp4', 'feat-script.png', 'feat-export.png'];

type Copy = {
  hero: { h1a: string; em: string; h1b: string; sub: string; cta1: string; cta2: string; t1: string; t2: string; t3: string };
  pillarsH: string;
  pillars: { h: string; p: string }[];
  feats: { h: string; p: string; li: string[]; shot: string }[];
  audH: string; audLead: string;
  audIndie: { h: string; free: string; p: string }; audPro: { h: string; p: string; link: string };
  ctaH: string; ctaSub: string;
};

const JA: Copy = {
  hero: {
    h1a: '絵コンテに、',
    em: 'カメラワーク',
    h1b: 'を。',
    sub: '絵コンテを書いて、そのままビデオコンテに。パン・ズーム付きの絵コンテを、その場で再生して、PDF や動画に。',
    cta1: '無料で使う',
    cta2: 'ダウンロード',
    t1: 'ローカル完結・サーバー不使用',
    t2: '使い慣れたペイントソフトで',
    t3: '無料で始められる',
  },
  pillarsH: 'カメラ・編集効果をその場で確認。',
  pillars: [
    { h: 'カメラワーク付きプレビュー', p: 'タイミングとカメラの動きを、その場で再生して確かめられます。' },
    { h: 'ローカル完結', p: 'ファイルは全部あなたのマシンの中。アカウントもログインも不要。' },
    {
      h: '使い慣れたペイントソフトで',
      p: 'CLIP STUDIO PAINT・Photoshop・Affinity Photo・GIMP・Krita。描くのは使い慣れた道具のまま。',
    },
  ],
  feats: [
    {
      h: 'ネイティブPSD編集',
      p: 'カットをダブルクリックすると、実際の .psd があなたのペイントソフトで開きます。保存すれば自動で読み込み直してプレビューに反映。独自フォーマットは一切なし。',
      li: ['後工程（レイアウト・原画・背景美術）がそのまま下書きにできる', 'ファイルはフォルダにそのまま並ぶ'],
      shot: 'PSD をペイントソフトで編集 → 自動再読込',
    },
    {
      h: '本番の解像度・アスペクト比',
      p: 'SD / HD / FHD /2K / 4K 、 4:3 / 16:9 / ビスタ / シネスコに対応。キャンバスを広げる・伸ばすと、カメラワーク（パン・ズーム）を自動挿入。',
      li: ['Shift ドラッグで縦・横・比率にスナップ', 'リサイズの向きから既定カメラを自動生成'],
      shot: 'クロップ → カメラワーク自動生成',
    },
    {
      h: 'ストップウォッチ入力',
      p: 'ストップウォッチで効率的にデュレーションを入力。',
      li: ['行ごとに Space で開始・停止', '手入力も可能'],
      shot: 'ストップウォッチで尺を計測',
    },
    {
      h: '脚本から、コンテの骨組みを',
      p: 'Markdown で書いた脚本のインポートに対応。脚本から絵コンテ作成を効率的に。',
      li: ['見出しでシーン、水平線でカットを自動分割', 'セリフ・アクションを分けて読み込み'],
      shot: '脚本(.md) → 割られたカット',
    },
    {
      h: '紙でも、PDFでも、動画でも',
      p: '絵コンテ用紙は印刷・PDF書き出しが可能。動画はネイティブ解像度で。',
      li: ['A4 スタジオ書式の絵コンテ印刷', 'ネイティブ解像度・fps の 動画書き出し'],
      shot: 'PDF / MP4 書き出し',
    },
  ],
  audH: '機能制限なし。フル機能を全員に。',
  audLead: '無料公開版に機能制限は一切ありません。',
  audIndie: {
    h: 'インディー・個人',
    free: '無料・全機能',
    p: '同人（有償頒布も）・自主制作・映画祭・単館上映・個人/収益化チャンネル・学生制作・教育。ずっと無料で使えます。',
  },
  audPro: {
    h: 'スタジオ・商業制作',
    p: '地上波・衛星・配信、または全国規模の劇場で公開する商業作品には、商用ライセンスが必要です。料金や手続きはこれから整備していくところです。該当しそうな場合は、まずお問い合わせください。個別にご相談のうえ、ライセンスや署名版ビルドをご用意します。',
    link: 'お問い合わせ',
  },
  ctaH: 'さっそく、作ってみる。',
  ctaSub: 'インストール不要。ブラウザでそのまま試せます。',
};

const COPY: Record<Locale, Copy> = { ja: JA, ko: JA, en: JA }; // ko/en は後で差し替え（暫定 ja フォールバック）

const getLocale = (): Locale =>
  ((typeof localStorage !== 'undefined' && (localStorage.getItem('docsLocale') as Locale)) || 'ja');

export const Landing: React.FC = () => {
  const [locale, setLocale] = useState<Locale>(getLocale());
  const c = COPY[locale];
  const setLoc = (l: Locale) => {
    setLocale(l);
    try { localStorage.setItem('docsLocale', l); } catch { /* ignore */ }
  };

  return (
    <div className="lp">
      <SiteHeader locale={locale} setLocale={setLoc} />

      {/* hero */}
      <header className="hero wrap">
        <h1>{c.hero.h1a}<br /><span className="em">{c.hero.em}</span>{c.hero.h1b}</h1>
        <p className="sub">{c.hero.sub}</p>
        <div className="cta">
          <a className="btn btn-primary" href={APP_URL}>{c.hero.cta1} ▸</a>
          <a className="btn btn-ghost" href="#/download">{c.hero.cta2}</a>
        </div>
        <div className="trust">
          <span className="it">{c.hero.t1}</span>
          <span className="it">{c.hero.t2}</span>
          <span className="it">{c.hero.t3}</span>
        </div>
        <div className="hero-stage">
          <Shot file="hero.mp4" video label="編集タブでスクロール → プレビュー再生 の収録" />
        </div>
      </header>

      {/* pillars */}
      <section className="sec">
        <div className="wrap">
          <h2>{c.pillarsH}</h2>
          <div className="pillars">
            {c.pillars.map((p, i) => (
              <div className="pillar" key={p.h}>
                <div className="ic">{React.createElement(PILLAR_ICONS[i], { 'aria-label': p.h })}</div>
                <h3>{p.h}</h3>
                <p>{p.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* feature rows */}
      {c.feats.map((f, i) => (
        <section className={`sec ${i % 2 ? 'alt' : ''}`} key={f.h}>
          <div className="wrap">
            <div className={`feat ${i % 2 ? 'rev' : ''}`}>
              <div className="ftext">
                <h3>{f.h}</h3>
                <p>{f.p}</p>
                <ul>{f.li.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <div><Shot file={FEAT_FILES[i]} label={f.shot} /></div>
            </div>
          </div>
        </section>
      ))}

      {/* audience */}
      <section className="sec">
        <div className="wrap">
          <h2>{c.audH}</h2>
          <p className="lead">{c.audLead}</p>
          <div className="aud">
            <div className="col">
              <h3>{c.audIndie.h}</h3>
              <div className="free">{c.audIndie.free}</div>
              <p style={{ color: 'var(--ink-2)', marginTop: 10 }}>{c.audIndie.p}</p>
            </div>
            <div className="col pro">
              <h3>{c.audPro.h}</h3>
              <p style={{ color: 'var(--ink-2)', marginTop: 10 }}>{c.audPro.p}</p>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={openContact}>{c.audPro.link}</button>
            </div>
          </div>
        </div>
      </section>

      {/* cta footer */}
      <section className="ctaf">
        <div className="wrap">
          <h2>{c.ctaH}</h2>
          <p className="lead">{c.ctaSub}</p>
          <div className="cta">
            <a className="btn btn-primary" href={APP_URL}>{c.hero.cta1} ▸</a>
            <a className="btn btn-ghost" href="#/download">{c.hero.cta2}</a>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="wrap">
          <span><img className="studio-mark" src={studioLogo} alt="Studio Mizutama" />© 2021–2026</span>
          <span>
            <a href="#/usage">{NAV[locale].usage}</a>&nbsp;·&nbsp;
            <a href="#/shortcuts">{NAV[locale].shortcuts}</a>&nbsp;·&nbsp;
            <a href={`${REPO_URL}/blob/develop/LICENSING.md`}>License (BSL 1.1)</a>&nbsp;·&nbsp;
            <a href={REPO_URL}>GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  );
};
