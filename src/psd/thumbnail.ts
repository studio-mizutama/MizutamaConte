import type { Psd } from 'ag-psd';
import { getFrameModel } from 'project/frameModel';
import { drawModel } from 'psd/composite';

/** canvas → dataURL の変換結果を canvas オブジェクト同一性でキャッシュする。
 *  toDataURL は canvas→PNG エンコードで高コストなため、再レンダリング毎の再生成を防ぐ。
 *  PSD 再パースで canvas が新インスタンスになれば自動的にキャッシュミス→再生成される。 */
const cache = new WeakMap<HTMLCanvasElement, string>();

export const canvasToDataURL = (canvas: HTMLCanvasElement | undefined): string | undefined => {
  if (!canvas) return undefined;
  const cached = cache.get(canvas);
  if (cached !== undefined) return cached;
  const url = canvas.toDataURL('image/png', 0.4);
  cache.set(canvas, url);
  return url;
};

const modelUrlCache = new WeakMap<Psd, string>();
/** 背景 + 全フレームユニット（グループ/ブレンド/clipping 適用）を1枚に合成した dataURL。
 *  Editor/印刷の静止表示（全フレーム重畳）用。Psd 同一性でキャッシュ（再パースで自動失効）。 */
export const frameModelToDataURL = (psd: Psd | undefined): string | undefined => {
  if (!psd) return undefined;
  const cached = modelUrlCache.get(psd);
  if (cached !== undefined) return cached;
  const model = getFrameModel(psd);
  const canvas = document.createElement('canvas');
  canvas.width = model.width;
  canvas.height = model.height;
  const ctx = canvas.getContext('2d');
  const scratch = document.createElement('canvas');
  scratch.width = model.width;
  scratch.height = model.height;
  if (ctx) drawModel(ctx, model, scratch, 'all');
  const url = canvas.toDataURL('image/png', 0.4);
  modelUrlCache.set(psd, url);
  return url;
};
