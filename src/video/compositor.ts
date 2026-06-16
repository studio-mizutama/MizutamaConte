import type { FrameSize } from 'project/types';
import type { ActiveCutState } from 'project/frameState';
import { layerDrawRect } from 'video/geometry';
import { getFrameModel } from 'project/frameModel';
import { drawModel } from 'psd/composite';

/**
 * frame の描画状態 + frameModel を OffscreenCanvas に合成する。
 * Preview の入れ子 opacity（外=黒地 / 内=白地@divOpacity / 絵@canvasOpacity）を忠実に再現:
 *   1) out を黒で塗る（外側 div の #000）
 *   2) frameBuffer に「背景 + active ユニット」を平坦化（ブレンド/clipping を白地から隔離）
 *   3) scratch に「白地(rect) + frameBuffer@canvasOpacity(rect)」を作る（内側 div = 紙 + 絵）
 *   4) scratch を divOpacity で out へ合成
 *
 * out / scratch は frameSize 寸、frameBuffer / unitScratch は doc 寸。
 * いずれも呼び出し側で 1 度だけ確保して使い回す（GC 抑制）。
 *
 * 背景=白の既存フラットPSDでは、白 scratch + (白背景+絵)@canvasOpacity が
 * 旧実装の 白 + 絵@canvasOpacity と数学的に恒等になる（後方互換）。
 */
export const compositeFrame = (
  state: ActiveCutState | null,
  cuts: Cut[],
  frame: FrameSize,
  out: OffscreenCanvas,
  scratch: OffscreenCanvas,
  frameBuffer: OffscreenCanvas,
  unitScratch: OffscreenCanvas,
): void => {
  const ctx = out.getContext('2d');
  if (!ctx) return;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, frame.width, frame.height);
  if (!state) return;

  const cut = cuts[state.cutIndex];
  if (!cut.picture) return;
  const model = getFrameModel(cut.picture);
  if (!model.width || !model.height) return;

  // frameBuffer/unitScratch は doc（model）寸でなければならない（レイヤー canvas は doc 寸＝
  // 作品フレームの 1.25 倍やクロップで frame より大きい）。呼び出し側がフレーム寸で確保していても
  // ここで doc 寸へ合わせる＝関数が自分のバッファ幾何を所有する（カット毎の doc 差にも自動対応）。
  if (frameBuffer.width !== model.width || frameBuffer.height !== model.height) {
    frameBuffer.width = model.width;
    frameBuffer.height = model.height;
  }
  if (unitScratch.width !== model.width || unitScratch.height !== model.height) {
    unitScratch.width = model.width;
    unitScratch.height = model.height;
  }

  // frameBuffer: 背景 + active ユニットを平坦化（カメラ非適用）
  const fctx = frameBuffer.getContext('2d');
  if (!fctx) return;
  fctx.globalAlpha = 1;
  fctx.globalCompositeOperation = 'source-over';
  fctx.clearRect(0, 0, frameBuffer.width, frameBuffer.height);
  drawModel(fctx, model, unitScratch, state.unitIndex);

  // カメラ rect は doc 寸（= 従来のレイヤー canvas 寸）で計算
  const rect = layerDrawRect(model.width, model.height, frame.width, frame.height, state.scale, state.posX, state.posY);

  const gctx = scratch.getContext('2d');
  if (!gctx) return;
  gctx.globalAlpha = 1;
  gctx.globalCompositeOperation = 'source-over';
  gctx.clearRect(0, 0, frame.width, frame.height);
  gctx.fillStyle = '#fff';
  gctx.fillRect(rect.dx, rect.dy, rect.dw, rect.dh);
  gctx.globalAlpha = state.canvasOpacity;
  gctx.drawImage(frameBuffer, rect.dx, rect.dy, rect.dw, rect.dh);
  gctx.globalAlpha = 1;

  ctx.globalAlpha = state.divOpacity;
  ctx.drawImage(scratch, 0, 0);
  ctx.globalAlpha = 1;
};
