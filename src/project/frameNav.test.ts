import { describe, it, expect } from 'vitest';
import { clampFrame } from './frameNav';

describe('clampFrame', () => {
  it('下限 0 にクランプ（負を 0 に）', () => {
    expect(clampFrame(-1, 100)).toBe(0);
    expect(clampFrame(-50, 100)).toBe(0);
  });
  it('上限 timeTotal-1 にクランプ', () => {
    expect(clampFrame(100, 100)).toBe(99);
    expect(clampFrame(150, 100)).toBe(99);
  });
  it('範囲内はそのまま', () => {
    expect(clampFrame(50, 100)).toBe(50);
    expect(clampFrame(0, 100)).toBe(0);
    expect(clampFrame(99, 100)).toBe(99);
  });
  it('timeTotal が 0/負なら 0', () => {
    expect(clampFrame(5, 0)).toBe(0);
    expect(clampFrame(5, -3)).toBe(0);
  });
});
