import { describe, expect, it } from 'vitest';
import { cameraFrames } from '../cameraFrame';

describe('cameraFrames', () => {
  it('cameraWork が無ければ空オブジェクト', () => {
    expect(cameraFrames({ frameW: 200, frameH: 100, displayW: 250, displayH: 125 })).toEqual({});
    expect(
      cameraFrames({ frameW: 200, frameH: 100, displayW: 250, displayH: 125, cameraWork: {} }),
    ).toEqual({});
  });
  it('scale=1・position=0 のとき IN 枠はフレーム実寸でキャンバス中央', () => {
    const r = cameraFrames({
      frameW: 200,
      frameH: 100,
      displayW: 250,
      displayH: 125,
      cameraWork: { scale: { in: 1, out: 0.5 }, position: { in: { x: 0, y: 0 }, out: { x: 0, y: 0 } } },
    });
    expect(r.in).toEqual({ width: 200, height: 100, left: 25, top: 12.5 });
  });
  it('scale<1 で枠が縮み中央寄り（OUT 枠）', () => {
    const r = cameraFrames({
      frameW: 200,
      frameH: 100,
      displayW: 250,
      displayH: 125,
      cameraWork: { scale: { in: 1, out: 0.5 }, position: { in: { x: 0, y: 0 }, out: { x: 0, y: 0 } } },
    });
    expect(r.out).toEqual({ width: 100, height: 50, left: 75, top: 37.5 });
  });
  it('position が枠位置をずらす', () => {
    const r = cameraFrames({
      frameW: 200,
      frameH: 100,
      displayW: 250,
      displayH: 125,
      cameraWork: { scale: { in: 1, out: 1 }, position: { in: { x: 0.1, y: 0.2 }, out: { x: 0, y: 0 } } },
    });
    // left = (250 - 200*(1-0.1))/2 = (250-180)/2 = 35, top = (125 - 100*(1-0.2))/2 = (125-80)/2 = 22.5
    expect(r.in).toEqual({ width: 200, height: 100, left: 35, top: 22.5 });
  });
});
