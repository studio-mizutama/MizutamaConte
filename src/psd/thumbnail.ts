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
