import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EffectContext } from 'history/types';
import { makeCreatePsdRevert, makeCreatePsdReapply } from 'history/effects';

vi.mock('psd/template', () => ({
  createTemplatePsd: (w: number, h: number) => ({
    psd: { width: w, height: h, marker: 'fake' },
    buffer: new Uint8Array([1, 2, 3]),
  }),
}));

const makeCtx = (cache: Record<string, unknown>, write = true) => {
  let current = { ...cache };
  const storage = {
    capabilities: { write },
    writeFile: vi.fn(async () => undefined),
    deleteFile: vi.fn(async () => undefined),
  };
  return {
    ctx: {
      storage: storage as unknown as EffectContext['storage'],
      getPsdCache: () => current as never,
      setPsdCache: (c: never) => {
        current = c;
      },
    } as EffectContext,
    storage,
    getCache: () => current,
  };
};

describe('create PSD effects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('revert は生成ファイルを削除しキャッシュから除く', async () => {
    const { ctx, storage, getCache } = makeCtx({ 'c2.psd': {}, 'c1.psd': {} });
    await makeCreatePsdRevert('c2.psd')(ctx);
    expect(storage.deleteFile).toHaveBeenCalledWith('c2.psd');
    expect(Object.keys(getCache())).toEqual(['c1.psd']);
  });

  it('revert は write 不可なら deleteFile を呼ばずキャッシュのみ更新', async () => {
    const { ctx, storage, getCache } = makeCtx({ 'c2.psd': {} }, false);
    await makeCreatePsdRevert('c2.psd')(ctx);
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(getCache()).toEqual({});
  });

  it('reapply はテンプレを書き戻しキャッシュへ追加', async () => {
    const { ctx, storage, getCache } = makeCtx({ 'c1.psd': {} });
    await makeCreatePsdReapply('c2.psd', 1920, 1080)(ctx);
    expect(storage.writeFile).toHaveBeenCalledWith('c2.psd', new Uint8Array([1, 2, 3]));
    expect(getCache()['c2.psd']).toEqual({ width: 1920, height: 1080, marker: 'fake' });
  });
});
