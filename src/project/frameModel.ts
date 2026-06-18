import type { Psd, Layer } from 'ag-psd';
import { mapBlendMode, CanvasBlend } from 'psd/blendMode';

export interface DrawLayer {
  canvas: HTMLCanvasElement;
  blendMode: CanvasBlend;
  opacity: number; // 0..1
  clipping: boolean;
}
export interface FrameUnit {
  layers: DrawLayer[]; // 下→上。単独=1要素 / グループ=再帰展開
  blendMode: CanvasBlend; // グループ自体のブレンド（単独は source-over）
  opacity: number; // グループ自体の不透明度（単独は 1）
}
export interface FrameModel {
  width: number;
  height: number;
  background: DrawLayer[]; // children[0]（毎フレーム下地）
  units: FrameUnit[]; // children[1..] 再解釈。length = フリップブックのフレーム数
}

const isGroup = (l: Layer): boolean => Array.isArray(l.children);
// ag-psd の opacity は常に 0..1（reader が uint8/255 済み）。範囲外は安全側へクランプ。
const toOpacity = (o: number | undefined): number => (o == null ? 1 : Math.min(1, Math.max(0, o)));

const toDrawLayer = (l: Layer): DrawLayer => ({
  canvas: l.canvas as HTMLCanvasElement,
  blendMode: mapBlendMode(l.blendMode),
  opacity: toOpacity(l.opacity),
  clipping: !!l.clipping,
});

// グループ/レイヤーを leaf の DrawLayer 列へ再帰展開（hidden・canvas 無しはスキップ）
const flattenLeaves = (l: Layer): DrawLayer[] => {
  if (l.hidden) return [];
  if (isGroup(l)) return (l.children ?? []).flatMap(flattenLeaves);
  return l.canvas ? [toDrawLayer(l)] : [];
};

// 最上位 children[1..] の1要素 → 1フレームユニット。
// 後方互換: 最上位は hidden でも 1 フレーム枠を維持（レガシーは children.length-1 で hidden も
// 数え描画した）。canvas 有無にも依らず枠を作り、フレーム数（= children.length-1）を保つ。
// グループ内 leaf の hidden は flattenLeaves で除外する（新機能・互換影響なし）。
const toUnit = (l: Layer): FrameUnit => {
  if (isGroup(l)) {
    return { layers: (l.children ?? []).flatMap(flattenLeaves), blendMode: mapBlendMode(l.blendMode), opacity: toOpacity(l.opacity) };
  }
  return { layers: l.canvas ? [toDrawLayer(l)] : [], blendMode: 'source-over', opacity: 1 };
};

const toBackground = (l: Layer | undefined): DrawLayer[] => {
  if (!l || l.hidden) return [];
  if (isGroup(l)) return (l.children ?? []).flatMap(flattenLeaves);
  return l.canvas ? [toDrawLayer(l)] : [];
};

export const deriveFrameModel = (psd: Psd): FrameModel => {
  const children: Layer[] = psd.children ?? [];
  const background = toBackground(children[0]);
  const units = children.slice(1).map(toUnit);
  return { width: psd.width ?? 0, height: psd.height ?? 0, background, units };
};

const cache = new WeakMap<Psd, FrameModel>();
/** Psd 同一性でメモ化（再パース＝新 Psd で自動失効。thumbnail.ts と同じ戦略） */
export const getFrameModel = (psd: Psd): FrameModel => {
  const hit = cache.get(psd);
  if (hit) return hit;
  const m = deriveFrameModel(psd);
  cache.set(psd, m);
  return m;
};
