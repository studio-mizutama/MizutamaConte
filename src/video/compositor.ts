import type { FrameSize } from 'project/types';
import type { ActiveCutState } from 'project/frameState';
import { layerDrawRect } from 'video/geometry';
import { getFrameModel } from 'project/frameModel';
import { drawModel } from 'psd/composite';

/**
 * frame の描画状態（1件 or クロス重なりで複数）+ frameModel を OffscreenCanvas に合成する。
 * Preview の入れ子 opacity（外=黒地 / 内=白地@divOpacity / 絵@canvasOpacity）を忠実に再現:
 *   1) out を黒で塗る（外側 div の #000）
 *   2) scratch（内側 div = 紙）を白で塗る（最後発カットの rect）
 *   3) 各 state を下（先発）→上（後発）の順に frameBuffer 経由で scratch へ重ね描き
 *      （先発 canvasOpacity=1・後発=fadeIn ランプ → A*(1−t)+B*t の真クロスディゾルブ）
 *   4) scratch を最後発カットの divOpacity で out へ合成
 *
 * out / scratch は frameSize 寸、frameBuffer / unitScratch は doc 寸。
 * いずれも呼び出し側で 1 度だけ確保して使い回す（GC 抑制）。
 *
 * 単一 state では従来実装と数学的に恒等（白 scratch + 絵@canvasOpacity、out@divOpacity）＝後方互換。
 */
export const compositeFrame = (
  states: ActiveCutState[],
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
  if (states.length === 0) return;

  const gctx = scratch.getContext('2d');
  if (!gctx) return;
  gctx.globalAlpha = 1;
  gctx.globalCompositeOperation = 'source-over';
  gctx.clearRect(0, 0, frame.width, frame.height);

  // 白地（紙）は最後発（incoming）カットの rect に敷く。単独カットでは従来と完全一致。
  const last = states[states.length - 1];
  const lastCut = cuts[last.cutIndex];
  if (!lastCut.picture) return;
  const lastModel = getFrameModel(lastCut.picture);
  if (!lastModel.width || !lastModel.height) return;
  const paperRect = layerDrawRect(lastModel.width, lastModel.height, frame.width, frame.height, last.scale, last.posX, last.posY);
  gctx.fillStyle = '#fff';
  gctx.fillRect(paperRect.dx, paperRect.dy, paperRect.dw, paperRect.dh);

  // 各 state を下→上で重ね描き。frameBuffer/unitScratch は state ごとに doc 寸へ合わせて使い回す。
  for (const s of states) {
    const cut = cuts[s.cutIndex];
    if (!cut.picture) continue;
    const model = getFrameModel(cut.picture);
    if (!model.width || !model.height) continue;

    if (frameBuffer.width !== model.width || frameBuffer.height !== model.height) {
      frameBuffer.width = model.width;
      frameBuffer.height = model.height;
    }
    if (unitScratch.width !== model.width || unitScratch.height !== model.height) {
      unitScratch.width = model.width;
      unitScratch.height = model.height;
    }

    const fctx = frameBuffer.getContext('2d');
    if (!fctx) continue;
    fctx.globalAlpha = 1;
    fctx.globalCompositeOperation = 'source-over';
    fctx.clearRect(0, 0, frameBuffer.width, frameBuffer.height);
    drawModel(fctx, model, unitScratch, s.unitIndex);

    const rect = layerDrawRect(model.width, model.height, frame.width, frame.height, s.scale, s.posX, s.posY);
    gctx.globalAlpha = s.canvasOpacity;
    gctx.drawImage(frameBuffer, rect.dx, rect.dy, rect.dw, rect.dh);
  }
  gctx.globalAlpha = 1;

  ctx.globalAlpha = last.divOpacity;
  ctx.drawImage(scratch, 0, 0);
  ctx.globalAlpha = 1;
};
