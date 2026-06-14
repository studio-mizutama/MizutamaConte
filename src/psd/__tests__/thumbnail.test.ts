import { describe, expect, it, vi } from 'vitest';
import { canvasToDataURL } from '../thumbnail';

describe('canvasToDataURL', () => {
  it('同一 canvas は2回目以降 toDataURL を再呼び出ししない', () => {
    const toDataURL = vi.fn(() => 'data:image/png;base64,AAA');
    const canvas = { toDataURL } as unknown as HTMLCanvasElement;
    expect(canvasToDataURL(canvas)).toBe('data:image/png;base64,AAA');
    expect(canvasToDataURL(canvas)).toBe('data:image/png;base64,AAA');
    expect(toDataURL).toHaveBeenCalledTimes(1);
  });

  it('異なる canvas は別々に変換する', () => {
    const a = { toDataURL: vi.fn(() => 'A') } as unknown as HTMLCanvasElement;
    const b = { toDataURL: vi.fn(() => 'B') } as unknown as HTMLCanvasElement;
    expect(canvasToDataURL(a)).toBe('A');
    expect(canvasToDataURL(b)).toBe('B');
  });

  it('undefined は undefined を返す', () => {
    expect(canvasToDataURL(undefined)).toBeUndefined();
  });
});
