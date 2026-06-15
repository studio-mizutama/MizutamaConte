import { describe, it, expect, vi } from 'vitest';
import { EffectContext } from 'history/types';
import { makeOverwriteSwap, makeDeleteSwap, makeCreateSwap, composeSwaps } from 'history/fileSwap';

// parse をバイト先頭→{tag} の単純写像にモック（PSD パース非依存でスワップ論理を検証）
vi.mock('psd/parse', () => ({ parsePsdBytes: (b: Uint8Array) => ({ tag: b[0] }) }));

const makeFake = () => {
  const files: Record<string, Uint8Array> = {};
  const trash: Record<string, Uint8Array> = {};
  let n = 0;
  let cache: Record<string, unknown> = {};
  const storage = {
    capabilities: { write: true },
    trashFile: vi.fn(async (name: string) => {
      const tok = `t${n++}`;
      trash[tok] = files[name];
      delete files[name];
      return tok;
    }),
    restoreFile: vi.fn(async (token: string, name: string) => {
      files[name] = trash[token];
      delete trash[token];
    }),
    readFile: vi.fn(async (name: string) => files[name]),
  };
  const ctx = {
    storage: storage as unknown as EffectContext['storage'],
    getPsdCache: () => cache as never,
    setPsdCache: (c: never) => {
      cache = c;
    },
  } as EffectContext;
  return { ctx, files, trash, getCache: () => cache as Record<string, unknown>, setCache: (c: Record<string, unknown>) => { cache = c; } };
};

describe('makeOverwriteSwap', () => {
  it('undo→pre, redo→post をバイト単位で往復し、キャッシュも追従する', async () => {
    const f = makeFake();
    // forward 済み状態を再現: pre(=[1]) は trash 'pre'、post(=[2]) が live
    f.trash['pre'] = new Uint8Array([1]);
    f.files['c1.psd'] = new Uint8Array([2]);
    f.setCache({ 'c1.psd': { tag: 2 } });
    const swap = makeOverwriteSwap('c1.psd', 'pre');

    await swap.toUndo(f.ctx);
    expect(f.files['c1.psd']).toEqual(new Uint8Array([1]));
    expect(f.getCache()['c1.psd']).toEqual({ tag: 1 });

    await swap.toRedo(f.ctx);
    expect(f.files['c1.psd']).toEqual(new Uint8Array([2]));
    expect(f.getCache()['c1.psd']).toEqual({ tag: 2 });

    // 二重 undo は冪等（状態が pre のままなら何もしない）
    await swap.toUndo(f.ctx);
    await swap.toUndo(f.ctx);
    expect(f.files['c1.psd']).toEqual(new Uint8Array([1]));
  });
});

describe('makeDeleteSwap', () => {
  it('undo で復帰、redo で再 trash', async () => {
    const f = makeFake();
    f.trash['pre'] = new Uint8Array([5]); // 削除済みファイルが trash にある
    f.setCache({});
    const swap = makeDeleteSwap('c2.psd', 'pre');

    await swap.toUndo(f.ctx);
    expect(f.files['c2.psd']).toEqual(new Uint8Array([5]));
    expect(f.getCache()['c2.psd']).toEqual({ tag: 5 });

    await swap.toRedo(f.ctx);
    expect(f.files['c2.psd']).toBeUndefined();
    expect(f.getCache()['c2.psd']).toBeUndefined();
  });
});

describe('makeCreateSwap', () => {
  it('undo で退避除去、redo で復帰', async () => {
    const f = makeFake();
    f.files['c3.psd'] = new Uint8Array([7]); // 生成直後（live）
    f.setCache({ 'c3.psd': { tag: 7 } });
    const swap = makeCreateSwap('c3.psd');

    await swap.toUndo(f.ctx);
    expect(f.files['c3.psd']).toBeUndefined();
    expect(f.getCache()['c3.psd']).toBeUndefined();

    await swap.toRedo(f.ctx);
    expect(f.files['c3.psd']).toEqual(new Uint8Array([7]));
    expect(f.getCache()['c3.psd']).toEqual({ tag: 7 });
  });
});

describe('composeSwaps', () => {
  it('diskRevert は全 swap の toUndo を実行（merge=上書きA+削除B）', async () => {
    const f = makeFake();
    f.trash['pa'] = new Uint8Array([1]);
    f.files['a.psd'] = new Uint8Array([2]); // A 上書き済み
    f.trash['pb'] = new Uint8Array([3]); // B 削除済み
    f.setCache({ 'a.psd': { tag: 2 } });
    const { diskRevert, diskReapply } = composeSwaps([makeOverwriteSwap('a.psd', 'pa'), makeDeleteSwap('b.psd', 'pb')]);

    await diskRevert(f.ctx);
    expect(f.files['a.psd']).toEqual(new Uint8Array([1]));
    expect(f.files['b.psd']).toEqual(new Uint8Array([3]));

    await diskReapply(f.ctx);
    expect(f.files['a.psd']).toEqual(new Uint8Array([2]));
    expect(f.files['b.psd']).toBeUndefined();
  });
});
