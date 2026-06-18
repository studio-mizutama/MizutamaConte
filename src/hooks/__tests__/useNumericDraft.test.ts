import { describe, it, expect } from 'vitest';
import { resolveNumericCommit } from '../useNumericDraft';

// CameraWork 等で使う parse: trim して空文字・非数値は null（＝直前値へフォールバック）
const numberParse = (s: string): number | null => {
  const n = Number(s.trim());
  return s.trim() !== '' && Number.isFinite(n) ? n : null;
};

describe('resolveNumericCommit', () => {
  it('有効な数値は採用', () => {
    expect(resolveNumericCommit('1.5', numberParse)).toBe(1.5);
    expect(resolveNumericCommit('0', numberParse)).toBe(0);
    expect(resolveNumericCommit('-3', numberParse)).toBe(-3);
  });
  it('空文字は null（直前値へ復帰）', () => {
    expect(resolveNumericCommit('', numberParse)).toBeNull();
  });
  it('空白のみは null', () => {
    expect(resolveNumericCommit('   ', numberParse)).toBeNull();
  });
  it('非数値は null', () => {
    expect(resolveNumericCommit('abc', numberParse)).toBeNull();
    expect(resolveNumericCommit('１２３', numberParse)).toBeNull(); // 全角
  });
});
