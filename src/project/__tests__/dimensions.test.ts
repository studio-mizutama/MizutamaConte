import { describe, expect, it } from 'vitest';
import { deriveFrame, thumbnailScale, defaultCanvasSize, DEFAULT_SETTINGS } from '../dimensions';

describe('deriveFrame', () => {
  it('FHD 16:9 は 1920x1080', () => {
    expect(deriveFrame('FHD', '16:9')).toEqual({ width: 1920, height: 1080 });
  });
  it('SD 4:3 は 720x540', () => {
    expect(deriveFrame('SD', '4:3')).toEqual({ width: 720, height: 540 });
  });
  it('4K 16:9 は 3840x2160', () => {
    expect(deriveFrame('4K', '16:9')).toEqual({ width: 3840, height: 2160 });
  });
  it('FHD 2.39:1 (シネスコ) は高さが偶数', () => {
    const frame = deriveFrame('FHD', '2.39:1');
    expect(frame.width).toBe(1920);
    expect(frame.height % 2).toBe(0);
    expect(frame.height).toBe(804);
  });
  it('FHD 1.85:1 (ビスタ) は 1920x1038', () => {
    expect(deriveFrame('FHD', '1.85:1')).toEqual({ width: 1920, height: 1038 });
  });
});

describe('defaultCanvasSize', () => {
  it('FHD の既定キャンバスは 2400x1350（従来仕様と一致）', () => {
    expect(defaultCanvasSize({ width: 1920, height: 1080 })).toEqual({ width: 2400, height: 1350 });
  });
});

describe('thumbnailScale', () => {
  it('FHD では従来のハードコード値 0.12 と一致する', () => {
    expect(thumbnailScale({ width: 1920, height: 1080 })).toBeCloseTo(0.12, 10);
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('既定は FHD 16:9 24fps', () => {
    expect(DEFAULT_SETTINGS.frame).toEqual({ width: 1920, height: 1080 });
    expect(DEFAULT_SETTINGS.fps).toBe(24);
  });
});
