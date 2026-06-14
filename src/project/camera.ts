import { FrameSize } from './types';

/**
 * キャンバスリサイズ時の方向別デフォルトカメラワーク。
 * よく使う動きを初期値として入れ、手動調整をほぼ不要にする。
 * - 横のみ拡大: scale 固定(1)、左→右パン（in 左端 / out 右端）
 * - 縦のみ拡大: scale 固定(1)、下→上パン（in 下端 / out 上端、pos.y>0=下）
 * - 両方拡大: ズームイン（in=scaleMax で広く / out=1 でネイティブ、位置は中央0）
 * - 非拡大(native): 静止
 */
export const defaultCameraForResize = (canvas: FrameSize, frame: FrameSize): CameraWork => {
  const ratioW = canvas.width / frame.width;
  const ratioH = canvas.height / frame.height;
  const wEnlarged = ratioW > 1;
  const hEnlarged = ratioH > 1;

  if (wEnlarged && !hEnlarged) {
    const maxX = ratioW - 1; // posBound(ratioW, 1)
    return { scale: { in: 1, out: 1 }, position: { in: { x: -maxX, y: 0 }, out: { x: maxX, y: 0 } } };
  }
  if (hEnlarged && !wEnlarged) {
    const maxY = ratioH - 1; // posBound(ratioH, 1)
    return { scale: { in: 1, out: 1 }, position: { in: { x: 0, y: maxY }, out: { x: 0, y: -maxY } } };
  }
  if (wEnlarged && hEnlarged) {
    const scaleMax = Math.min(ratioW, ratioH);
    return { scale: { in: scaleMax, out: 1 }, position: { in: { x: 0, y: 0 }, out: { x: 0, y: 0 } } };
  }
  return { scale: { in: 1, out: 1 }, position: { in: { x: 0, y: 0 }, out: { x: 0, y: 0 } } };
};

/**
 * Shift スナップ: ドラッグ方向を「横のみ / 縦のみ / アスペクト比保持(斜め)」の
 * いずれか最も近いものに吸着する。
 * - aspect 未指定なら従来どおり横/縦の2方向（絶対値の小さい軸を 0 に）。
 * - aspect 指定時は3候補（横・縦・アスペクト対角）への射影のうち最近傍を選ぶ。
 *   aspect = width / height（キャンバスの現在比）。
 */
export const applyShiftSnap = (
  dw: number,
  dh: number,
  shift: boolean,
  aspect?: number,
): { dw: number; dh: number } => {
  if (!shift) return { dw, dh };
  if (aspect === undefined || !(aspect > 0)) {
    return Math.abs(dw) >= Math.abs(dh) ? { dw, dh: 0 } : { dw: 0, dh };
  }
  // アスペクト対角線 (方向ベクトル (aspect, 1)) への射影
  const t = (dw * aspect + dh) / (aspect * aspect + 1);
  const diagonal = { dw: t * aspect, dh: t };
  const candidates = [{ dw, dh: 0 }, { dw: 0, dh }, diagonal];
  const dist2 = (c: { dw: number; dh: number }) => (c.dw - dw) ** 2 + (c.dh - dh) ** 2;
  return candidates.reduce((best, c) => (dist2(c) < dist2(best) ? c : best), candidates[0]);
};

export interface CameraRanges {
  /** canvas.w / frame.w */
  ratioW: number;
  /** canvas.h / frame.h */
  ratioH: number;
  scaleMin: number;
  /** これ以上ズームアウトするとフレームがキャンバス外に出る上限 */
  scaleMax: number;
}

/** カメラワークの可動範囲（キャンバス外に出ないクランプ用）を導出する */
export const cameraRanges = (canvas: FrameSize, frame: FrameSize): CameraRanges => {
  const ratioW = canvas.width / frame.width;
  const ratioH = canvas.height / frame.height;
  const scaleMax = Math.min(ratioW, ratioH);
  // 捕捉領域はネイティブフレーム(scale=1)より小さくできない。
  // 絵コンテでは作画の無い領域を拡大表示しても意味がなく、クロップがネイティブ未満不可なのと同じ床。
  // canvas==frame のときは scaleMin==scaleMax==1 となり可動域は消える（=カメラワーク無効の判定にも使える）。
  const scaleMin = Math.min(1, scaleMax);
  return { ratioW, ratioH, scaleMin, scaleMax };
};

/** あるスケールでの position 許容範囲（±この値まで。負は 0 にクランプ） */
export const posBound = (ratio: number, scale: number): number => Math.max(0, ratio - scale);

export const clampNum = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);
