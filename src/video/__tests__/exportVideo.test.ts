import { describe, expect, it } from 'vitest';
import { totalFrames } from '../exportVideo';

describe('totalFrames', () => {
  it('全カットの time を合計する', () => {
    expect(totalFrames([{ time: 48 }, { time: 24 }, { time: 72 }])).toBe(144);
  });
  it('time 未設定は 0 扱い', () => {
    expect(totalFrames([{ time: 48 }, {}, { time: 24 }])).toBe(72);
  });
  it('空配列は 0', () => {
    expect(totalFrames([])).toBe(0);
  });
});
