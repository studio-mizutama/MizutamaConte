import { describe, expect, it } from 'vitest';
import { activeTool } from '../useTool';

describe('activeTool', () => {
  it('Crop / Text はそのまま返す', () => {
    expect(activeTool(new Set(['Crop']))).toBe('Crop');
    expect(activeTool(new Set(['Text']))).toBe('Text');
  });
  it('Select はそのまま返す', () => {
    expect(activeTool(new Set(['Select']))).toBe('Select');
  });
  it('未定義・空・未知の値は Select にフォールバックする', () => {
    expect(activeTool(undefined)).toBe('Select');
    expect(activeTool(new Set())).toBe('Select');
    expect(activeTool(new Set(['Bogus']))).toBe('Select');
  });
});
