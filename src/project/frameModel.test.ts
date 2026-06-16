import { describe, it, expect } from 'vitest';
import { deriveFrameModel } from './frameModel';
import type { Psd, Layer } from 'ag-psd';

const fakeCanvas = () => ({}) as unknown as HTMLCanvasElement;
const leaf = (over: Partial<Layer> = {}): Layer => ({ name: 'l', canvas: fakeCanvas(), ...over } as Layer);
const group = (children: Layer[], over: Partial<Layer> = {}): Layer => ({ name: 'g', children, ...over } as Layer);
const psd = (children: Layer[]): Psd => ({ width: 100, height: 80, children } as Psd);

describe('deriveFrameModel', () => {
  it('フラットPSD（レガシー）: 背景1 + 単独レイヤーN', () => {
    const m = deriveFrameModel(psd([leaf(), leaf(), leaf()]));
    expect(m.background.length).toBe(1);
    expect(m.units.length).toBe(2); // children.length - 1
    expect(m.units[0].layers.length).toBe(1);
    expect(m.width).toBe(100);
    expect(m.height).toBe(80);
  });
  it('グループは1ユニットに合成（子3枚）', () => {
    const m = deriveFrameModel(psd([leaf(), group([leaf(), leaf(), leaf()])]));
    expect(m.units.length).toBe(1);
    expect(m.units[0].layers.length).toBe(3);
  });
  it('単独とグループの混在: 順序どおり各1ユニット', () => {
    const m = deriveFrameModel(psd([leaf(), leaf(), group([leaf(), leaf()])]));
    expect(m.units.length).toBe(2);
    expect(m.units[0].layers.length).toBe(1);
    expect(m.units[1].layers.length).toBe(2);
  });
  it('最上位の hidden レイヤーもフレーム枠は維持（後方互換: レガシーは hidden も1フレーム）', () => {
    const m = deriveFrameModel(psd([leaf(), leaf({ hidden: true }), leaf()]));
    expect(m.units.length).toBe(2); // children.length - 1（hidden も数える）
    expect(m.units[0].layers.length).toBe(1); // hidden 最上位も描画される
  });
  it('グループ内の hidden leaf は合成から除外される', () => {
    const m = deriveFrameModel(psd([leaf(), group([leaf(), leaf({ hidden: true }), leaf()])]));
    expect(m.units.length).toBe(1);
    expect(m.units[0].layers.length).toBe(2); // 3枚中 hidden 1枚を除外
  });
  it('入れ子グループは再帰展開', () => {
    const m = deriveFrameModel(psd([leaf(), group([leaf(), group([leaf(), leaf()])])]));
    expect(m.units.length).toBe(1);
    expect(m.units[0].layers.length).toBe(3);
  });
  it('blendMode がマップされる', () => {
    const m = deriveFrameModel(psd([leaf(), leaf({ blendMode: 'multiply' })]));
    expect(m.units[0].layers[0].blendMode).toBe('multiply');
  });
  it('opacity は 0..1 をそのまま・範囲外はクランプ（ag-psd は常に 0..1）', () => {
    expect(deriveFrameModel(psd([leaf(), leaf({ opacity: 0.5 })])).units[0].layers[0].opacity).toBeCloseTo(0.5, 3);
    expect(deriveFrameModel(psd([leaf(), leaf({ opacity: 1.5 })])).units[0].layers[0].opacity).toBe(1);
    expect(deriveFrameModel(psd([leaf(), leaf({ opacity: -0.2 })])).units[0].layers[0].opacity).toBe(0);
  });
  it('clipping フラグを保持', () => {
    const m = deriveFrameModel(psd([leaf(), leaf({ clipping: true })]));
    expect(m.units[0].layers[0].clipping).toBe(true);
  });
  it('children 無しは空モデル', () => {
    const m = deriveFrameModel({ width: 10, height: 10 } as Psd);
    expect(m.background.length).toBe(0);
    expect(m.units.length).toBe(0);
  });
  it('背景がグループなら leaf 展開', () => {
    const m = deriveFrameModel(psd([group([leaf(), leaf()]), leaf()]));
    expect(m.background.length).toBe(2);
    expect(m.units.length).toBe(1);
  });
  it('canvas 無しの単独レイヤーもフレーム枠は維持（layers は空）', () => {
    const noCanvas = { name: 'l' } as Layer; // canvas 無し
    const m = deriveFrameModel(psd([leaf(), noCanvas, leaf()]));
    expect(m.units.length).toBe(2); // フレーム数は children.length - 1 を保つ
    expect(m.units[0].layers.length).toBe(0); // 描画時にスキップされる
  });
});
