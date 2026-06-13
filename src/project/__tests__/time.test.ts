import { describe, expect, it } from 'vitest';
import { frameToTimecode } from '../time';

describe('frameToTimecode (24fps)', () => {
  it('fps 以下はコマ数2桁', () => {
    expect(frameToTimecode(0, 24)).toBe('00');
    expect(frameToTimecode(12, 24)).toBe('12');
    expect(frameToTimecode(24, 24)).toBe('24');
  });
  it('fps 超は 秒:コマ', () => {
    expect(frameToTimecode(168, 24)).toBe('7:00');
    expect(frameToTimecode(30, 24)).toBe('1:06');
    expect(frameToTimecode(1476, 24)).toBe('61:12');
  });
  it('非整数フレーム（再生中の補間値）は丸める', () => {
    expect(frameToTimecode(47.6, 24)).toBe('2:00');
  });
});
