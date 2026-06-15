import { createGlobalStyle } from 'styled-components';
import { PAGE_CONTENT_WIDTH, PAGE_CONTENT_HEIGHT } from 'print/constants';

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
    @page { size: A4 portrait; margin: 12mm; }
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
    border-top: 1px solid #000;
    padding: 6px 0;
    font-size: 12px;
  }
  .print-colhead { font-weight: bold; }
  .print-cut { break-inside: avoid; }

  .print-page {
    box-sizing: border-box;
    min-height: ${PAGE_CONTENT_HEIGHT}px;
    display: flex;
    flex-direction: column;
    break-after: page;
  }
  .print-page:last-child { break-after: auto; }

  .print-footer { margin-top: auto; text-align: right; font-size: 11px; padding-top: 6px; }
  .print-time-sum { opacity: 0.6; }

  .print-col-action,
  .print-col-dialogue { white-space: pre-wrap; word-break: break-word; }

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
