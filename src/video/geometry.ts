/** OffscreenCanvas 上にレイヤー canvas を描く際の座標・寸法 */
export interface DrawRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Preview の内側 div（CSS の width/height/bottom/right）を ratio=1 の canvas2d 座標へ移植する純関数。
 * Preview.tsx:240-258 の式を移植:
 *   width  = canvas.width / scale            （表示倍率 ratio=1）
 *   height = canvas.height / scale
 *   right(R)  = (canvas.width  - frameW * (scale - posX)) / 2  → dx = -R
 *   bottom(B) = (canvas.height - frameH * (scale - posY)) / 2  → dy = -B
 * （CSS の relative + bottom/right は要素を上・左へずらすため符号を反転して左上座標にする）
 */
export const layerDrawRect = (
  canvasW: number,
  canvasH: number,
  frameW: number,
  frameH: number,
  scale: number,
  posX: number,
  posY: number,
): DrawRect => {
  const dw = canvasW / scale;
  const dh = canvasH / scale;
  const dx = -(canvasW - frameW * (scale - posX)) / 2;
  const dy = -(canvasH - frameH * (scale - posY)) / 2;
  return { dx, dy, dw, dh };
};
