import { createGlobalStyle } from 'styled-components';
import { PAGE_CONTENT_WIDTH, PAGE_BOX_HEIGHT, PAGE_MARGIN_PX } from 'print/constants';

/**
 * 印刷専用スタイル。.print-root は画面では画面外(left:-10000px)に置いて計測可能にし、
 * @media print で #root（対話UI）を隠して .print-root のみを A4 に出す。常に白地・黒文字。
 */
export const PrintStyle = createGlobalStyle`
  .print-root {
    position: fixed;
    left: -10000px;
    top: 0;
    width: ${PAGE_CONTENT_WIDTH}px;
    background: #fff;
    color: #000;
    font-family: sans-serif;
  }

  @media print {
    /* margin:0 でブラウザの「ヘッダーとフッター」（URL/日付/ページ番号）を抑止する。
       視覚マージンは .print-page の padding で内側に作る。 */
    @page { size: A4 portrait; margin: 0; }
    /* アプリは html/body/#root に overflow:hidden+height:100% を敷いており、これが効くと
       印刷が1ページ目でクリップされる。印刷時のみ解除して全ページ流す。 */
    html, body { overflow: visible !important; height: auto !important; }
    #root { display: none !important; }
    .print-root {
      position: static !important;
      left: auto !important;
      top: auto !important;
      width: auto !important;
    }
  }

  .print-title { font-size: 16px; font-weight: bold; padding: 4px 0; }

  .print-colhead,
  .print-cut {
    display: grid;
    grid-template-columns: 40px 288px 1fr 1fr 96px;
    gap: 8px;
    align-items: start;
    padding: 6px 0;
    font-size: 12px;
  }
  /* booktabs(LaTeX) 風の罫線: 見出し行の上下＝太線(2px)、カット間＝細線(1px)、
     ページ最下段カットの下＝太線(2px)。縦線は引かない。各行の下端 border で共有し二重線を防ぐ。 */
  .print-colhead { font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; }
  .print-block { break-inside: avoid; border-bottom: 1px solid #000; }
  .print-block-last { border-bottom: 2px solid #000; }

  .print-scene { font-weight: bold; font-size: 13px; padding: 6px 0 2px; }

  .print-page {
    box-sizing: border-box;
    min-height: ${PAGE_BOX_HEIGHT}px;
    /* @page margin:0 の代わりに視覚マージンを padding で内側に作る */
    padding: ${PAGE_MARGIN_PX}px;
    display: flex;
    flex-direction: column;
    break-after: page;
  }
  .print-page:last-child { break-after: auto; }

  .print-footer { margin-top: auto; text-align: right; font-size: 11px; padding-top: 6px; }
  .print-time-sum { opacity: 0.6; }

  .print-col-action { display: flex; flex-direction: column; gap: 2px; }
  .print-action-text { flex: 1 1 auto; white-space: pre-wrap; word-break: break-word; }
  .print-col-dialogue { white-space: pre-wrap; word-break: break-word; }

  .print-fade { display: flex; align-items: center; gap: 4px; }
  .print-fade svg { fill: #000; flex: 0 0 auto; }
  .print-fade-label { font-size: 10px; }

  .print-frame-in {
    position: absolute;
    border: 2px solid #2d9d3a;
    color: #2d9d3a;
    font-size: 10px;
    line-height: 1;
    padding: 1px;
    z-index: 2;
  }
  .print-frame-out {
    position: absolute;
    border: 2px solid #d7373f;
    color: #d7373f;
    font-size: 10px;
    line-height: 1;
    padding: 1px;
    z-index: 3;
  }
`;
