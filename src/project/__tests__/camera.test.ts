import { describe, expect, it } from 'vitest';
import { coverCamera, applyShiftSnap, cameraRanges, posBound, clampNum } from '../camera';

describe('coverCamera', () => {
  it('同アスペクト(1.25倍キャンバス)は scale=1.25 の静止カメラ', () => {
    const cam = coverCamera({ width: 2400, height: 1350 }, { width: 1920, height: 1080 });
    expect(cam.scale!.in).toBeCloseTo(1.25, 5);
    expect(cam.scale!.out).toBeCloseTo(1.25, 5);
    expect(cam.position).toEqual({ in: { x: 0, y: 0 }, out: { x: 0, y: 0 } });
  });
  it('横長キャンバスは高さ基準(min)で cover する', () => {
    // canvas 3000x1350, frame 1920x1080 -> w比1.5625, h比1.25 -> min=1.25
    const cam = coverCamera({ width: 3000, height: 1350 }, { width: 1920, height: 1080 });
    expect(cam.scale!.in).toBeCloseTo(1.25, 5);
  });
  it('縦長キャンバスは幅基準(min)で cover する', () => {
    // canvas 1920x2160 -> w比1.0, h比2.0 -> min=1.0
    const cam = coverCamera({ width: 1920, height: 2160 }, { width: 1920, height: 1080 });
    expect(cam.scale!.in).toBeCloseTo(1.0, 5);
  });
});

describe('applyShiftSnap', () => {
  it('shift 無しは素通し', () => {
    expect(applyShiftSnap(30, -10, false)).toEqual({ dw: 30, dh: -10 });
  });
  it('shift 有り(aspect 未指定)は絶対値の小さい方を 0 にする', () => {
    expect(applyShiftSnap(30, -10, true)).toEqual({ dw: 30, dh: 0 });
    expect(applyShiftSnap(-5, 40, true)).toEqual({ dw: 0, dh: 40 });
  });
  it('shift 有り(aspect 指定): 対角ドラッグはアスペクト比保持にスナップ', () => {
    // aspect=2 の対角線 (dh=dw/2) ちょうどのドラッグはそのまま保持
    expect(applyShiftSnap(100, 50, true, 2)).toEqual({ dw: 100, dh: 50 });
  });
  it('shift 有り(aspect 指定): ほぼ横なら横、ほぼ縦なら縦にスナップ', () => {
    expect(applyShiftSnap(100, 5, true, 2)).toEqual({ dw: 100, dh: 0 });
    expect(applyShiftSnap(5, 100, true, 2)).toEqual({ dw: 0, dh: 100 });
  });
});

describe('cameraRanges', () => {
  it('scaleMax は min(canvas/frame) 比、ratio は各軸比、scaleMin は 1（ネイティブ床）', () => {
    const r = cameraRanges({ width: 2400, height: 1350 }, { width: 1920, height: 1080 });
    expect(r.ratioW).toBeCloseTo(1.25, 5);
    expect(r.ratioH).toBeCloseTo(1.25, 5);
    expect(r.scaleMax).toBeCloseTo(1.25, 5);
    expect(r.scaleMin).toBe(1);
  });
  it('canvas==frame(ネイティブ)は scaleMin==scaleMax==1 で可動域ゼロ', () => {
    const r = cameraRanges({ width: 1920, height: 1080 }, { width: 1920, height: 1080 });
    expect(r.scaleMin).toBe(1);
    expect(r.scaleMax).toBe(1);
  });
});

describe('posBound', () => {
  it('|pos| 許容範囲は ratio - scale（負は 0 でクランプ）', () => {
    expect(posBound(1.25, 1)).toBeCloseTo(0.25, 5);
    expect(posBound(1.25, 1.25)).toBeCloseTo(0, 5);
    expect(posBound(1.25, 2)).toBe(0);
  });
});

describe('clampNum', () => {
  it('範囲内に収める', () => {
    expect(clampNum(5, 0, 10)).toBe(5);
    expect(clampNum(-3, 0, 10)).toBe(0);
    expect(clampNum(99, 0, 10)).toBe(10);
  });
});
