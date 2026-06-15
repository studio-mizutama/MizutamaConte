import type { Layer } from 'ag-psd';
import type { FrameSize } from 'project/types';
import type { ActiveCutState } from 'project/frameState';
import { layerDrawRect } from 'video/geometry';

/**
 * frame の描画状態 + レイヤー canvas を OffscreenCanvas に合成する。
 * Preview の入れ子 opacity（外側=黒地 / 内側=白地@divOpacity / 絵@canvasOpacity）を忠実に再現:
 *   1) 出力を黒で塗る（外側 div の #000）
 *   2) scratch に「白地 + 絵@canvasOpacity」を作る（内側 div = 白地 + canvas）
 *   3) scratch を divOpacity で出力へ合成
 *
 * out / scratch は呼び出し側で 1 度だけ確保して使い回す（GC 抑制）。両方 frameSize と同サイズ。
 */
export const compositeFrame = (
  state: ActiveCutState | null,
  cuts: Cut[],
  frame: FrameSize,
  out: OffscreenCanvas,
  scratch: OffscreenCanvas,
): void => {
  const ctx = out.getContext('2d');
  if (!ctx) return;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, frame.width, frame.height);
  if (!state) return;

  const cut = cuts[state.cutIndex];
  const layer = cut.picture?.children?.[state.layerIndex] as Layer | undefined;
  const canvas = layer?.canvas;
  if (!canvas) return;

  const rect = layerDrawRect(canvas.width, canvas.height, frame.width, frame.height, state.scale, state.posX, state.posY);

  const gctx = scratch.getContext('2d');
  if (!gctx) return;
  // scratch をクリアしてから内側 div を作る
  gctx.globalAlpha = 1;
  gctx.clearRect(0, 0, frame.width, frame.height);
  gctx.fillStyle = '#fff';
  gctx.fillRect(rect.dx, rect.dy, rect.dw, rect.dh);
  gctx.globalAlpha = state.canvasOpacity;
  gctx.drawImage(canvas, rect.dx, rect.dy, rect.dw, rect.dh);

  ctx.globalAlpha = state.divOpacity;
  ctx.drawImage(scratch, 0, 0);
  ctx.globalAlpha = 1;
};
