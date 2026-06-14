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

/** Shift スナップ: 押下時は絶対値の小さい方のデルタを 0 にして軸固定する */
export const applyShiftSnap = (dw: number, dh: number, shift: boolean): { dw: number; dh: number } => {
  if (!shift) return { dw, dh };
  return Math.abs(dw) >= Math.abs(dh) ? { dw, dh: 0 } : { dw: 0, dh };
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
