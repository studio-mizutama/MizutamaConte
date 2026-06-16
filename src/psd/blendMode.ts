/**
 * PSD のブレンドモード名（ag-psd の `BlendMode` 文字列）を Canvas2D の
 * globalCompositeOperation へマップする。絵コンテ用途のため完全互換は目指さない:
 * 1:1 対応＝そのまま / canvas 非対応＝効果が近い近似 / 近似不能・不明＝source-over。
 */
export type CanvasBlend = GlobalCompositeOperation;

const MAP: Record<string, CanvasBlend> = {
  normal: 'source-over',
  dissolve: 'source-over', // ランダムディザは canvas で再現不可
  'pass through': 'source-over', // グループは分離合成で近似（composite.ts）
  darken: 'darken',
  multiply: 'multiply',
  'color burn': 'color-burn',
  'linear burn': 'multiply', // 近似
  'darker color': 'darken', // 近似
  lighten: 'lighten',
  screen: 'screen',
  'color dodge': 'color-dodge',
  'linear dodge': 'lighter', // = add（加算）
  'lighter color': 'lighten', // 近似
  overlay: 'overlay',
  'soft light': 'soft-light',
  'hard light': 'hard-light',
  'vivid light': 'hard-light', // 近似
  'linear light': 'hard-light', // 近似
  'pin light': 'hard-light', // 近似
  'hard mix': 'hard-light', // 近似
  difference: 'difference',
  exclusion: 'exclusion',
  subtract: 'difference', // 近似
  divide: 'color-dodge', // 近似
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
};

export const mapBlendMode = (psdName?: string): CanvasBlend => {
  if (!psdName) return 'source-over';
  return MAP[psdName] ?? 'source-over';
};
