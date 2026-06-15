import { describe, it, expect, vi } from 'vitest';
import { ProjectFile } from 'project/types';
import { EffectContext } from 'history/types';
import { planRenamesBetween, makeReorderEffect } from 'history/reorderEffect';

const cut = (id: string, psd: string) => ({ id, psd, rows: [{ id: `${id}r`, layer: '1', canvas: { width: 10, height: 10 } }] });
const proj = (cuts: ReturnType<typeof cut>[]): ProjectFile => ({
  version: 2,
  title: 't',
  settings: { aspect: '16:9', resolution: 'FHD', frame: { width: 1920, height: 1080 }, fps: 24 },
  cuts,
});

describe('planRenamesBetween', () => {
  it('同 id の psd 名が異なる cut だけ from→to を返す', () => {
    const from = proj([cut('a', 'c1.psd'), cut('b', 'c2.psd')]);
    const to = proj([cut('b', 'c1.psd'), cut('a', 'c2.psd')]);
    expect(planRenamesBetween(from, to)).toEqual([
      { from: 'c2.psd', to: 'c1.psd' }, // id=b
      { from: 'c1.psd', to: 'c2.psd' }, // id=a
    ]);
  });

  it('名前が同じなら rename 不要', () => {
    const same = proj([cut('a', 'c1.psd'), cut('b', 'c2.psd')]);
    expect(planRenamesBetween(same, same)).toEqual([]);
  });
});

describe('makeReorderEffect', () => {
  it('write 可なら 2 フェーズ rename を実行し psdCache を remap する', async () => {
    const from = proj([cut('a', 'c1.psd'), cut('b', 'c2.psd')]);
    const to = proj([cut('b', 'c1.psd'), cut('a', 'c2.psd')]);
    const renamed: string[] = [];
    let cache: Record<string, unknown> = { 'c1.psd': { id: 'a' }, 'c2.psd': { id: 'b' } };
    const ctx = {
      storage: {
        capabilities: { write: true },
        renameFile: vi.fn(async (f: string, t: string) => {
          renamed.push(`${f}->${t}`);
        }),
      },
      getPsdCache: () => cache as never,
      setPsdCache: (c: never) => {
        cache = c;
      },
    } as unknown as EffectContext;

    await makeReorderEffect(from, to)(ctx);

    expect(renamed.length).toBe(4); // 2 フェーズ（一時名経由）
    expect((cache['c1.psd'] as { id: string }).id).toBe('b');
    expect((cache['c2.psd'] as { id: string }).id).toBe('a');
  });

  it('write 不可なら何もしない', async () => {
    const from = proj([cut('a', 'c1.psd'), cut('b', 'c2.psd')]);
    const to = proj([cut('b', 'c1.psd'), cut('a', 'c2.psd')]);
    const renameFile = vi.fn();
    const ctx = {
      storage: { capabilities: { write: false }, renameFile },
      getPsdCache: () => ({}),
      setPsdCache: () => undefined,
    } as unknown as EffectContext;
    await makeReorderEffect(from, to)(ctx);
    expect(renameFile).not.toHaveBeenCalled();
  });
});
