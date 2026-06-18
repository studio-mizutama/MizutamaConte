import { describe, expect, it } from 'vitest';
import { frameToTimecode, parseTimecode, msToFrames } from '../time';

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

describe('msToFrames', () => {
  it('0ms は 0', () => expect(msToFrames(0, 24)).toBe(0));
  it('1000ms @24fps は 24', () => expect(msToFrames(1000, 24)).toBe(24));
  it('500ms @24fps は 12', () => expect(msToFrames(500, 24)).toBe(12));
  it('4000ms @24fps は 96', () => expect(msToFrames(4000, 24)).toBe(96));
  it('83ms @24fps は四捨五入で 2', () => expect(msToFrames(83, 24)).toBe(2));
  it('41ms @24fps は四捨五入で 1', () => expect(msToFrames(41, 24)).toBe(1));
  it('1000ms @30fps は 30', () => expect(msToFrames(1000, 30)).toBe(30));
  it('負の経過は 0 にクランプ', () => expect(msToFrames(-100, 24)).toBe(0));
});

describe('防御ガード（不正値で崩壊しない）', () => {
  it('parseTimecode: 309桁の巨大入力（Number→Infinity）は null（解釈不能=直前値維持）', () => {
    expect(parseTimecode('9'.repeat(309), 24)).toBeNull();
  });
  it('frameToTimecode: NaN/Infinity は 00+00 へフォールバック', () => {
    expect(frameToTimecode(NaN, 24)).toBe('00+00');
    expect(frameToTimecode(Infinity, 24)).toBe('00+00');
  });
  it('frameToTimecode: fps<=0 を既定 24 で扱い NaN/Infinity を出さない', () => {
    expect(frameToTimecode(24, 0)).not.toContain('NaN');
    expect(frameToTimecode(24, 0)).not.toContain('Infinity');
    expect(frameToTimecode(24, 0)).toBe('01+00'); // 24fps 既定で 24コマ=1秒
  });
});
