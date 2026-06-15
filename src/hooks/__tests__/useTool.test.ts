import { describe, expect, it } from 'vitest';
import { resolveEditorMode } from '../useTool';

describe('resolveEditorMode', () => {
  it('有効なモードはそのまま返す', () => {
    expect(resolveEditorMode('edit')).toBe('edit');
    expect(resolveEditorMode('resize')).toBe('resize');
    expect(resolveEditorMode('reorderCut')).toBe('reorderCut');
    expect(resolveEditorMode('reorderScene')).toBe('reorderScene');
  });
  it('undefined は既定の edit にフォールバックする', () => {
    expect(resolveEditorMode(undefined)).toBe('edit');
  });
});
