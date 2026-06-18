import type { FrameModel, FrameUnit, DrawLayer } from 'project/frameModel';

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
interface ScratchCanvas {
  width: number;
  height: number;
  getContext(id: '2d'): Ctx2D | null;
}

const reset = (ctx: Ctx2D): void => {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
};

const drawDirect = (ctx: Ctx2D, l: DrawLayer): void => {
  ctx.globalAlpha = l.opacity;
  ctx.globalCompositeOperation = l.blendMode;
  ctx.drawImage(l.canvas, 0, 0);
};

const drawUnit = (ctx: Ctx2D, unit: FrameUnit, scratch: ScratchCanvas): void => {
  if (unit.layers.length === 0) return;
  // 単独レイヤー: 直接描画（layer の blend/opacity が実効値）
  if (unit.layers.length === 1) {
    drawDirect(ctx, unit.layers[0]);
    reset(ctx);
    return;
  }
  // 複数レイヤー: scratch で分離合成（clipping=source-atop）してから unit の blend/opacity で ctx へ
  const sctx = scratch.getContext('2d');
  if (!sctx) return;
  reset(sctx);
  sctx.clearRect(0, 0, scratch.width, scratch.height);
  for (const l of unit.layers) {
    sctx.globalAlpha = l.opacity;
    sctx.globalCompositeOperation = l.clipping ? 'source-atop' : l.blendMode;
    sctx.drawImage(l.canvas, 0, 0);
  }
  reset(sctx);
  ctx.globalAlpha = unit.opacity;
  ctx.globalCompositeOperation = unit.blendMode;
  ctx.drawImage(scratch as unknown as CanvasImageSource, 0, 0);
  reset(ctx);
};

/**
 * ctx（doc 寸・透明）へ「背景 → 指定ユニット」を合成する。
 * unitIndex に number を渡すとそのユニット1個（Preview/動画）、'all' で全ユニット重ね（Editor/印刷）。
 * scratch は複数レイヤーユニットの分離合成に使う再利用バッファ（doc 寸）。
 */
export const drawModel = (
  ctx: Ctx2D,
  model: FrameModel,
  scratch: ScratchCanvas,
  unitIndex: number | 'all',
): void => {
  reset(ctx);
  for (const bg of model.background) drawDirect(ctx, bg);
  reset(ctx);
  const units = unitIndex === 'all' ? model.units : model.units[unitIndex] ? [model.units[unitIndex]] : [];
  for (const u of units) drawUnit(ctx, u, scratch);
  reset(ctx);
};
