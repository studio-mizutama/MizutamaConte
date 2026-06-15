import { describe, expect, it } from 'vitest';
import { frameState } from '../frameState';

// children[0] は白背景（捨てる）。children[1..] が描画レイヤー。
// NOTE: global.d.ts は Psd を import しておらず Cut.picture は実質 any 扱いのため、
//       Psd 型名を直接参照せず Cut['picture'] へキャストする（型解決に依存しない）。
const psd = (layerCount: number) =>
  ({ children: Array.from({ length: layerCount + 1 }, (_v, i) => ({ name: `L${i}` })) }) as unknown as Cut['picture'];

// 2カット: cut0=48f(2レイヤー), cut1=24f(1レイヤー)
const baseCuts = (): Cut[] => [
  {
    time: 48,
    picture: psd(2),
    cameraWork: { scale: { in: 2, out: 1 }, position: { in: { x: 0, y: 0 }, out: { x: 0, y: 0 } } },
    action: { fadeIn: 'Black In', fadeInDuration: 12 },
  },
  {
    time: 24,
    picture: psd(1),
    action: { fadeIn: 'White In', fadeInDuration: 12 },
  },
];

describe('frameState', () => {
  it('範囲外（総尺以上）は null', () => {
    expect(frameState(72, baseCuts())).toBeNull();
  });

  it('cut0 先頭フレームは cutIndex=0・layer=1・scale は in 寄り（local=1 補正）', () => {
    const s = frameState(0, baseCuts())!;
    expect(s.cutIndex).toBe(0);
    expect(s.layerIndex).toBe(1); // localRaw=0 → trunc(0/24)+1 = 1
    // local = (0 || 1) = 1 → scale = 2 - ((2-1)*1)/48 = 2 - 0.020833...
    expect(s.scale).toBeCloseTo(2 - 1 / 48, 6);
  });

  it('cut0 中盤(frame=24)は layer=2・scale 中間・フェード完了(opacity=1)', () => {
    const s = frameState(24, baseCuts())!;
    // localRaw=24, pictureShowDuration=48/2=24 → trunc(24/24)+1 = 2
    expect(s.layerIndex).toBe(2);
    // local=24 → scale = 2 - ((2-1)*24)/48 = 2 - 0.5 = 1.5
    expect(s.scale).toBeCloseTo(1.5, 6);
    // fadeInDuration=12, local=24 >= 12 → opacity=1
    expect(s.canvasOpacity).toBe(1);
    // Black In なので divOpacity も同じ ramp → 1
    expect(s.divOpacity).toBe(1);
  });

  it('Black In のフェード中(frame=6)は div も canvas も同じ opacity(=6/12)', () => {
    const s = frameState(6, baseCuts())!;
    expect(s.canvasOpacity).toBeCloseTo(0.5, 6); // 6/12
    expect(s.divOpacity).toBeCloseTo(0.5, 6); // Black なので div も ramp
  });

  it('White In のフェード中(cut1, frame=48+6=54)は canvas はフェード・div は 1', () => {
    const s = frameState(54, baseCuts())!;
    expect(s.cutIndex).toBe(1);
    // cut1 local = 54-48 = 6, fadeInDuration=12 → canvasOpacity = 6/12 = 0.5
    expect(s.canvasOpacity).toBeCloseTo(0.5, 6);
    // White In は非 Black → divOpacity = 1（白地が不透明のまま＝白からのフェード）
    expect(s.divOpacity).toBe(1);
  });

  it('cameraWork 無しのカットは scale=1・pos=0', () => {
    const s = frameState(50, baseCuts())!; // cut1 は cameraWork 無し
    expect(s.scale).toBe(1);
    expect(s.posX).toBe(0);
    expect(s.posY).toBe(0);
  });

  it('レイヤーが無い(pictureShowDuration=0)場合は layerIndex=1 にフォールバック', () => {
    const cuts: Cut[] = [{ time: 24, picture: { children: [{ name: 'bg' }] } as unknown as Cut['picture'] }];
    expect(frameState(10, cuts)!.layerIndex).toBe(1);
  });
});
