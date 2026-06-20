import React, { useState } from 'react';
import { Locale } from './content/manifest';
import { buildPath, appUrl } from './route';
import { SiteHeader, NAV } from './SiteHeader';
import { Lightbox, ZoomMedia } from './Lightbox';
import Camera from '@spectrum-icons/workflow/Camera';
import LockClosed from '@spectrum-icons/workflow/LockClosed';
import Draw from '@spectrum-icons/workflow/Draw';
import studioLogo from './assets/studio-logo.svg';

// 3本柱のアイコン（Spectrum・全ロケール共通。ネイティブ絵文字は使わない方針）
const PILLAR_ICONS = [Camera, LockClosed, Draw];

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
const Shot: React.FC<{ file: string; label: string; video?: boolean; onOpen?: (m: ZoomMedia) => void }> = ({ file, label, video, onOpen }) => {
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
  // クリックでライトボックスを開く（ネイティブ解像度の拡大表示）。
  return (
    <div className="shot zoomable" onClick={() => onOpen?.({ src, isVideo, label })}>
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
  heroShot: string;
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
  heroShot: '編集タブでスクロール → プレビュー再生 の収録',
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
    p: '地上波・衛星・配信、または全国規模の劇場で公開する商業作品には、商用ライセンスが必要です。具体的な手続きはこれから整備していくところです。該当しそうな場合は、まずお問い合わせください。個別にご相談のうえ、署名版ビルドや、現場に合わせたカスタマイズ等をご提供いたします。',
    link: 'お問い合わせ',
  },
  ctaH: 'さっそく、作ってみる。',
  ctaSub: 'インストール不要。ブラウザでそのまま試せます。',
};

const EN: Copy = {
  hero: {
    h1a: 'Bring',
    em: 'camera work',
    h1b: ' to your storyboards.',
    sub: 'Draw your storyboard, then play it back as an animatic — a storyboard you can watch as video. Add pans and zooms, see them in place, and export to PDF or video.',
    cta1: 'Use it free',
    cta2: 'Download',
    t1: 'Runs locally — no server',
    t2: 'Draw in paint software you already know',
    t3: 'Free to start',
  },
  heroShot: 'Scrolling the Edit tab, then preview playback',
  pillarsH: 'Check camera moves and editing effects on the spot.',
  pillars: [
    { h: 'Preview with camera work', p: 'Play back the timing and camera moves on the spot to see how they read.' },
    { h: 'Runs locally', p: 'Every file stays on your own machine. No account, no login.' },
    { h: 'Draw in paint software you already know', p: 'CLIP STUDIO PAINT, Photoshop, Affinity Photo, GIMP, Krita. Keep drawing in the tools you already use.' },
  ],
  feats: [
    {
      h: 'Native PSD editing',
      p: 'Double-click a cut and the actual .psd opens in your paint software. Save it, and Mizutama Conte reloads it automatically and updates the preview. No proprietary format at all.',
      li: ['Downstream stages — layout, key animation, backgrounds — can use it straight away as a rough', 'Files sit plainly in a folder'],
      shot: 'Edit the PSD in paint software → auto-reload',
    },
    {
      h: 'Real resolutions and aspect ratios',
      p: 'Supports SD / HD / FHD / 2K / 4K and 4:3 / 16:9 / 1.85:1 / 2.39:1. Widen or stretch the canvas and camera work (pans and zooms) is inserted automatically.',
      li: ['Shift-drag to snap to vertical, horizontal, or ratio', 'A default camera move is generated from the resize direction'],
      shot: 'Crop → camera work generated automatically',
    },
    {
      h: 'Stopwatch input',
      p: 'Enter durations efficiently with a stopwatch.',
      li: ['Start and stop each row with Space', 'Manual entry works too'],
      shot: 'Measure duration with the stopwatch',
    },
    {
      h: 'A storyboard skeleton from your script',
      p: 'Import a script written in Markdown and get from script to storyboard faster.',
      li: ['Headings split scenes, horizontal rules split cuts, automatically', 'Dialogue and action are read in separately'],
      shot: 'Script (.md) → cuts split out',
    },
    {
      h: 'On paper, in PDF, or as video',
      p: 'Print the storyboard sheet or export it to PDF. Render video at native resolution.',
      li: ['Print A4 studio-style storyboard sheets', 'Export video at native resolution and fps'],
      shot: 'PDF / MP4 export',
    },
  ],
  audH: 'No feature limits. The full app, for everyone.',
  audLead: 'The free public version has no feature limits whatsoever.',
  audIndie: {
    h: 'Indie and personal',
    free: 'Free — every feature',
    p: 'Doujin work (including paid distribution), self-produced films, festivals, single-theater screenings, personal and monetized channels, student projects, and education. Free to use, always.',
  },
  audPro: {
    h: 'Studio and commercial production',
    p: 'Commercial work shown on terrestrial, satellite, or streaming broadcast, or in nationwide theatrical release, needs a commercial license. The specific process is still being put in place. If this might apply to you, please reach out first. After talking it through individually, we can provide a signed build, customization tailored to your production, and the like.',
    link: 'Contact',
  },
  ctaH: 'Go ahead — start making one.',
  ctaSub: 'No install needed. Try it right in your browser.',
};

const KO: Copy = {
  hero: {
    h1a: '콘티에 ',
    em: '카메라 워크',
    h1b: '를.',
    sub: '콘티를 그리면 그대로 애니매틱(영상으로 재생되는 콘티)으로. 팬·줌이 들어간 콘티를 그 자리에서 재생하고, PDF나 영상으로.',
    cta1: '무료로 사용하기',
    cta2: '다운로드',
    t1: '로컬에서 완결·서버 미사용',
    t2: '쓰던 페인트 앱 그대로',
    t3: '무료로 시작 가능',
  },
  heroShot: 'Edit 탭 스크롤, 그리고 프리뷰 재생',
  pillarsH: '카메라·편집 효과를 그 자리에서 확인.',
  pillars: [
    { h: '카메라 워크가 들어간 프리뷰', p: '타이밍과 카메라 움직임을 그 자리에서 재생해 확인할 수 있습니다.' },
    { h: '로컬에서 완결', p: '파일은 전부 사용자의 기기 안에. 계정도 로그인도 필요 없습니다.' },
    { h: '쓰던 페인트 앱 그대로', p: 'CLIP STUDIO PAINT·Photoshop·Affinity Photo·GIMP·Krita. 그림은 손에 익은 도구로 그대로.' },
  ],
  feats: [
    {
      h: '네이티브 PSD 편집',
      p: '컷을 더블클릭하면 실제 .psd가 쓰던 페인트 앱에서 열립니다. 저장하면 자동으로 다시 읽어들여 프리뷰에 반영. 독자 포맷은 일절 없습니다.',
      li: ['후공정(레이아웃·원화·배경미술)을 그대로 밑그림으로 쓸 수 있다', '파일은 폴더에 그대로 나열된다'],
      shot: 'PSD를 페인트 앱로 편집 → 자동 재읽기',
    },
    {
      h: '실제 제작용 해상도·화면비',
      p: 'SD / HD / FHD / 2K / 4K, 4:3 / 16:9 / 1.85:1 / 2.39:1을 지원. 캔버스를 넓히거나 늘리면 카메라 워크(팬·줌)를 자동 삽입.',
      li: ['Shift 드래그로 세로·가로·비율에 스냅', '리사이즈 방향에 맞춰 기본 카메라를 자동 생성'],
      shot: '크롭 → 카메라 워크 자동 생성',
    },
    {
      h: '스톱워치 입력',
      p: '스톱워치로 효율적으로 듀레이션을 입력.',
      li: ['행마다 Space로 시작·정지', '직접 입력도 가능'],
      shot: '스톱워치로 길이 측정',
    },
    {
      h: '각본에서 콘티의 뼈대를',
      p: 'Markdown으로 쓴 각본 임포트를 지원. 각본에서 콘티 작성을 효율적으로.',
      li: ['제목으로 신, 수평선으로 컷을 자동 분할', '대사·액션을 나눠서 읽어들임'],
      shot: '각본(.md) → 나뉜 컷',
    },
    {
      h: '종이로도, PDF로도, 영상으로도',
      p: '콘티 용지는 인쇄·PDF 내보내기가 가능. 영상은 네이티브 해상도로.',
      li: ['A4 스튜디오 서식의 콘티 인쇄', '네이티브 해상도·fps의 영상 내보내기'],
      shot: 'PDF / MP4 내보내기',
    },
  ],
  audH: '기능 제한 없음. 모든 기능을 모두에게.',
  audLead: '무료 공개판에 기능 제한은 일절 없습니다.',
  audIndie: {
    h: '인디·개인',
    free: '무료·전 기능',
    p: '동인(유상 배포 포함)·자주 제작·영화제·단관 상영·개인/수익화 채널·학생 제작·교육. 계속 무료로 쓸 수 있습니다.',
  },
  audPro: {
    h: '스튜디오·상업 제작',
    p: '지상파·위성·스트리밍, 또는 전국 규모의 극장에서 공개하는 상업 작품에는 상용 라이선스가 필요합니다. 구체적인 절차는 이제부터 정비해 나가는 단계입니다. 해당될 것 같다면 먼저 문의해 주세요. 개별적으로 상의한 뒤, 서명판 빌드나 제작 현장에 맞춘 커스터마이즈 등을 제공해 드립니다.',
    link: '문의하기',
  },
  ctaH: '지금 바로, 만들어 보세요.',
  ctaSub: '설치 불필요. 브라우저에서 바로 사용해 볼 수 있습니다.',
};

const COPY: Record<Locale, Copy> = { ja: JA, ko: KO, en: EN };

// locale/base は URL 由来（App が parseRoute して渡す）。
export const Landing: React.FC<{ locale: Locale; base: string }> = ({ locale, base }) => {
  const c = COPY[locale];
  const [zoom, setZoom] = useState<ZoomMedia | null>(null);
  // Web版アプリ（親 /MizutamaConte/）への絶対URL。base から導出（相対 '../' はページ深さで壊れる）。
  const APP_URL = appUrl(base);

  return (
    <div className="lp">
      <SiteHeader locale={locale} pageId={null} base={base} />

      {/* hero */}
      <header className="hero wrap">
        <h1>{c.hero.h1a}<br /><span className="em">{c.hero.em}</span>{c.hero.h1b}</h1>
        <p className="sub">{c.hero.sub}</p>
        <div className="cta">
          <a className="btn btn-primary" href={APP_URL} target="_blank" rel="noopener">{c.hero.cta1} ▸</a>
          <a className="btn btn-ghost" href={buildPath(base, locale, 'download')}>{c.hero.cta2}</a>
        </div>
        <div className="trust">
          <span className="it">{c.hero.t1}</span>
          <span className="it">{c.hero.t2}</span>
          <span className="it">{c.hero.t3}</span>
        </div>
        <div className="hero-stage">
          <Shot file="hero.mp4" video label={c.heroShot} onOpen={setZoom} />
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
              <div><Shot file={FEAT_FILES[i]} label={f.shot} onOpen={setZoom} /></div>
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
            <a className="btn btn-primary" href={APP_URL} target="_blank" rel="noopener">{c.hero.cta1} ▸</a>
            <a className="btn btn-ghost" href={buildPath(base, locale, 'download')}>{c.hero.cta2}</a>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="wrap">
          <span><img className="studio-mark" src={studioLogo} alt="Studio Mizutama" />© 2021–2026</span>
          <span>
            <a href={buildPath(base, locale, 'usage')}>{NAV[locale].usage}</a>&nbsp;·&nbsp;
            <a href={buildPath(base, locale, 'shortcuts')}>{NAV[locale].shortcuts}</a>&nbsp;·&nbsp;
            <a href={`${REPO_URL}/blob/master/LICENSING.md`}>License (BSL 1.1)</a>&nbsp;·&nbsp;
            <a href={REPO_URL}>GitHub</a>
          </span>
        </div>
      </footer>

      {zoom && <Lightbox media={zoom} locale={locale} onClose={() => setZoom(null)} />}
    </div>
  );
};
