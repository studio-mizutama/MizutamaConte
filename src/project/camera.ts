import { FrameSize } from './types';

/**
 * キャンバスリサイズ時の自動カメラワーク（cover フィット・静止）。
 * scale = min(canvas.w/frame.w, canvas.h/frame.h) で画面を作画で埋める（黒帯なし）。
 * はみ出す軸は後からパンを付ける余白になる。position は中央(0)。
 */
export const coverCamera = (canvas: FrameSize, frame: FrameSize): CameraWork => {
  const coverScale = Math.min(canvas.width / frame.width, canvas.height / frame.height);
  return {
    scale: { in: coverScale, out: coverScale },
    position: { in: { x: 0, y: 0 }, out: { x: 0, y: 0 } },
  };
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
