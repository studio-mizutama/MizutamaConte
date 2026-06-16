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

const unitUrlCache = new WeakMap<Psd, (string | undefined)[]>();
/** 背景 + 指定フレームユニット1個（グループ/ブレンド/clipping 適用）を合成した dataURL。
 *  Editor/印刷は「1ユニット=1フレーム」を別サムネイルとして並べる（フィルムストリップ）。
 *  全ユニットを重畳しない（重畳は仕様外）。Psd 同一性＋unitIndex でキャッシュ（再パースで自動失効）。 */
export const frameUnitToDataURL = (psd: Psd | undefined, unitIndex: number): string | undefined => {
  if (!psd) return undefined;
  let arr = unitUrlCache.get(psd);
  if (!arr) {
    arr = [];
    unitUrlCache.set(psd, arr);
  }
  if (arr[unitIndex] !== undefined) return arr[unitIndex];
  const model = getFrameModel(psd);
  const canvas = document.createElement('canvas');
  canvas.width = model.width;
  canvas.height = model.height;
  const ctx = canvas.getContext('2d');
  const scratch = document.createElement('canvas');
  scratch.width = model.width;
  scratch.height = model.height;
  if (ctx) drawModel(ctx, model, scratch, unitIndex);
  const url = canvas.toDataURL('image/png', 0.4);
  arr[unitIndex] = url;
  return url;
};
