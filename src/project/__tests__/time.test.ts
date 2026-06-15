import { describe, expect, it } from 'vitest';
import { frameToTimecode, parseTimecode } from '../time';

describe('frameToTimecode (24fps)', () => {
  it('60秒未満は SS+FF（各2桁ゼロ詰め）', () => {
    expect(frameToTimecode(0, 24)).toBe('00+00');
    expect(frameToTimecode(12, 24)).toBe('00+12');
    expect(frameToTimecode(23, 24)).toBe('00+23');
    expect(frameToTimecode(168, 24)).toBe('07+00');
  });
  it('ちょうど fps 倍は秒へ繰り上がる（旧 value>fps バグの修正）', () => {
    expect(frameToTimecode(24, 24)).toBe('01+00');
  });
  it('60秒以上は MM:SS+FF', () => {
    expect(frameToTimecode(1440, 24)).toBe('01:00+00'); // 60秒
    expect(frameToTimecode(1620, 24)).toBe('01:07+12'); // 67.5秒
  });
  it('1時間以上は HH:MM:SS+FF', () => {
    expect(frameToTimecode(86400, 24)).toBe('01:00:00+00'); // 3600秒
  });
  it('非整数フレーム（再生中の補間値）は丸める', () => {
    expect(frameToTimecode(47.6, 24)).toBe('02+00');
  });
  it('コマ部は fps によらず常に2桁ゼロ詰め', () => {
    expect(frameToTimecode(9, 12)).toBe('00+09');
    expect(frameToTimecode(5, 30)).toBe('00+05');
  });
});

describe('parseTimecode (24fps)', () => {
  it('数字だけはコマ（生フレーム）として解釈', () => {
    expect(parseTimecode('168', 24)).toBe(168);
    expect(parseTimecode('0', 24)).toBe(0);
  });
  it('SS+FF', () => {
    expect(parseTimecode('45+12', 24)).toBe(45 * 24 + 12);
    expect(parseTimecode('5+3', 24)).toBe(5 * 24 + 3); // ゼロ詰めなしも受理
  });
  it('MM:SS+FF', () => {
    expect(parseTimecode('01:30+00', 24)).toBe(90 * 24);
  });
  it('HH:MM:SS+FF', () => {
    expect(parseTimecode('01:23:45+12', 24)).toBe((3600 + 23 * 60 + 45) * 24 + 12);
  });
  it('+ なしの MM:SS / HH:MM:SS はコマ0として寛容に受理', () => {
    expect(parseTimecode('01:30', 24)).toBe(90 * 24);
    expect(parseTimecode('01:00:00', 24)).toBe(3600 * 24);
  });
  it('解釈不能は null', () => {
    expect(parseTimecode('abc', 24)).toBeNull();
    expect(parseTimecode('1:2:3:4+5', 24)).toBeNull();
    expect(parseTimecode('+', 24)).toBeNull();
  });
  it('ラウンドトリップ: parse(format(n)) === n', () => {
    for (const n of [0, 23, 24, 25, 1439, 1440, 1620, 86399, 86400]) {
      expect(parseTimecode(frameToTimecode(n, 24), 24)).toBe(n);
    }
  });
});
