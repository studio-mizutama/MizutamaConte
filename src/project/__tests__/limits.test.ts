import { describe, it, expect } from 'vitest';
import { MIN_FRAMES, MAX_TIMELINE_FRAMES, maxCutFrames, isValidCutFrames, clampTimelineEnd } from '../limits';

describe('limits', () => {
  it('MIN_FRAMES は 1（0コマ禁止）', () => {
    expect(MIN_FRAMES).toBe(1);
  });

  it('maxCutFrames は fps*3600（1時間相当・最低 MIN_FRAMES）', () => {
    expect(maxCutFrames(24)).toBe(24 * 3600);
    expect(maxCutFrames(0)).toBe(MIN_FRAMES);
    expect(maxCutFrames(NaN)).toBe(MIN_FRAMES);
    expect(maxCutFrames(-5)).toBe(MIN_FRAMES);
  });

  it('isValidCutFrames: 1〜上限の有限整数のみ true', () => {
    expect(isValidCutFrames(1, 24)).toBe(true);
    expect(isValidCutFrames(48, 24)).toBe(true);
    expect(isValidCutFrames(24 * 3600, 24)).toBe(true);
    expect(isValidCutFrames(0, 24)).toBe(false); // 0コマ禁止
    expect(isValidCutFrames(-5, 24)).toBe(false);
    expect(isValidCutFrames(9999999999, 24)).toBe(false); // 巨大値
    expect(isValidCutFrames(1.5, 24)).toBe(false); // 非整数
    expect(isValidCutFrames(Infinity, 24)).toBe(false);
    expect(isValidCutFrames(NaN, 24)).toBe(false);
  });

  it('clampTimelineEnd: 非有限/負/巨大を安全な範囲へ', () => {
    expect(clampTimelineEnd(100)).toBe(100);
    expect(clampTimelineEnd(0)).toBe(0);
    expect(clampTimelineEnd(NaN)).toBe(0);
    expect(clampTimelineEnd(Infinity)).toBe(0);
    expect(clampTimelineEnd(-5)).toBe(0);
    expect(clampTimelineEnd(9e12)).toBe(MAX_TIMELINE_FRAMES);
    expect(clampTimelineEnd(1.7)).toBe(1); // 整数化
  });
});
