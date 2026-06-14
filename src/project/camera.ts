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
