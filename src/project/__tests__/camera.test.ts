import { describe, expect, it } from 'vitest';
import { coverCamera, applyShiftSnap } from '../camera';

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
  it('shift 有りは絶対値の小さい方を 0 にする', () => {
    expect(applyShiftSnap(30, -10, true)).toEqual({ dw: 30, dh: 0 });
    expect(applyShiftSnap(-5, 40, true)).toEqual({ dw: 0, dh: 40 });
  });
});
