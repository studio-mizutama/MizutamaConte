import { describe, expect, it } from 'vitest';
import { videoBitrate, evenFrameSize } from '../quality';

describe('videoBitrate', () => {
  it('1080p24 高 = w*h*fps*0.15', () => {
    expect(videoBitrate({ width: 1920, height: 1080 }, 24, 'high')).toBe(Math.round(1920 * 1080 * 24 * 0.15));
  });
  it('1080p24 中 = 高の半分(0.075)', () => {
    expect(videoBitrate({ width: 1920, height: 1080 }, 24, 'medium')).toBe(Math.round(1920 * 1080 * 24 * 0.075));
  });
  it('極小フレームは下限 2Mbps にクランプ', () => {
    expect(videoBitrate({ width: 320, height: 180 }, 24, 'medium')).toBe(2_000_000);
  });
  it('4K@24fps 高は上限未満なので素の値（クランプされない）', () => {
    // 3840*2160*24*0.15 = 29,859,840 < 60,000,000
    expect(videoBitrate({ width: 3840, height: 2160 }, 24, 'high')).toBe(Math.round(3840 * 2160 * 24 * 0.15));
  });
  it('超高負荷(4K@60fps 高)は上限 60Mbps にクランプ', () => {
    // 3840*2160*60*0.15 = 74,649,600 > 60,000,000 → クランプ
    expect(videoBitrate({ width: 3840, height: 2160 }, 60, 'high')).toBe(60_000_000);
  });
});

describe('evenFrameSize', () => {
  it('奇数の幅・高さを偶数へ切り下げる（yuv420p 要件）', () => {
    expect(evenFrameSize({ width: 1921, height: 1081 })).toEqual({ width: 1920, height: 1080 });
  });
  it('偶数はそのまま', () => {
    expect(evenFrameSize({ width: 1920, height: 1080 })).toEqual({ width: 1920, height: 1080 });
  });
});
