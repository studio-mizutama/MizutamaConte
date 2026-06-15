import { createTemplatePsd } from 'psd/template';
import { DiskEffect } from 'history/types';

/** CUT 生成の undo: 生成した PSD を削除し psdCache から除く */
export const makeCreatePsdRevert = (psdName: string): DiskEffect => async (ctx) => {
  if (ctx.storage.capabilities.write) {
    await ctx.storage.deleteFile(psdName).catch(() => undefined);
  }
  const cache = { ...ctx.getPsdCache() };
  delete cache[psdName];
  ctx.setPsdCache(cache);
};

/** CUT 生成の redo: 同名で空テンプレを再生成し psdCache へ戻す（テンプレは決定的） */
export const makeCreatePsdReapply = (psdName: string, width: number, height: number): DiskEffect => async (ctx) => {
  const { psd, buffer } = createTemplatePsd(width, height);
  if (ctx.storage.capabilities.write) {
    await ctx.storage.writeFile(psdName, buffer);
  }
  ctx.setPsdCache({ ...ctx.getPsdCache(), [psdName]: psd });
};
