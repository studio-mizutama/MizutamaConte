import { EffectContext } from 'history/types';
import { parsePsdBytes } from 'psd/parse';

export interface FileSwap {
  /** live を「pre / 復帰済み」側にする（undo 方向） */
  toUndo: (ctx: EffectContext) => Promise<void>;
  /** live を「post / 適用済み」側にする（redo 方向） */
  toRedo: (ctx: EffectContext) => Promise<void>;
}

/** 復元した live ファイルを再読込してキャッシュ更新（loader と同一ルート） */
const refreshCache = async (ctx: EffectContext, name: string): Promise<void> => {
  const bytes = await ctx.storage.readFile(name);
  ctx.setPsdCache({ ...ctx.getPsdCache(), [name]: parsePsdBytes(bytes) });
};

const removeFromCache = (ctx: EffectContext, name: string): void => {
  const cache = { ...ctx.getPsdCache() };
  delete cache[name];
  ctx.setPsdCache(cache);
};

/**
 * 上書き型（addLayer/resize/merge合成A/split base）。
 * forward 完了時点で post=live・pre=trash(initialTrashToken)。
 * undo/redo は live を trash へ退避しつつ非アクティブ版を live へ戻すスワップ。
 */
export const makeOverwriteSwap = (name: string, initialTrashToken: string): FileSwap => {
  let trashToken = initialTrashToken; // 現在 trash にある非アクティブ版のトークン
  let postIsLive = true;
  return {
    toUndo: async (ctx) => {
      if (!postIsLive) return;
      const postToken = await ctx.storage.trashFile(name);
      await ctx.storage.restoreFile(trashToken, name);
      trashToken = postToken;
      postIsLive = false;
      await refreshCache(ctx, name);
    },
    toRedo: async (ctx) => {
      if (postIsLive) return;
      const preToken = await ctx.storage.trashFile(name);
      await ctx.storage.restoreFile(trashToken, name);
      trashToken = preToken;
      postIsLive = true;
      await refreshCache(ctx, name);
    },
  };
};

/**
 * 削除型（deleteCut/merge空白B）。forward でファイルは trash 済み（live 不在）。
 * undo=復帰 / redo=再 trash。
 */
export const makeDeleteSwap = (name: string, initialTrashToken: string): FileSwap => {
  let trashToken: string | null = initialTrashToken; // null = live に存在
  return {
    toUndo: async (ctx) => {
      if (trashToken === null) return;
      await ctx.storage.restoreFile(trashToken, name);
      trashToken = null;
      await refreshCache(ctx, name);
    },
    toRedo: async (ctx) => {
      if (trashToken !== null) return;
      trashToken = await ctx.storage.trashFile(name);
      removeFromCache(ctx, name);
    },
  };
};

/**
 * 生成型（split の切り出しファイル）。forward で新規作成済み（live 存在）。
 * undo=trash 退避して除去 / redo=復帰。
 */
export const makeCreateSwap = (name: string): FileSwap => {
  let trashToken: string | null = null; // null = live に存在
  return {
    toUndo: async (ctx) => {
      if (trashToken !== null) return;
      trashToken = await ctx.storage.trashFile(name);
      removeFromCache(ctx, name);
    },
    toRedo: async (ctx) => {
      if (trashToken === null) return;
      await ctx.storage.restoreFile(trashToken, name);
      trashToken = null;
      await refreshCache(ctx, name);
    },
  };
};

/** 複数ファイルにまたがる操作（merge=上書き+削除, split=上書き+生成）の swap をまとめる */
export const composeSwaps = (
  swaps: FileSwap[],
): { diskRevert: (ctx: EffectContext) => Promise<void>; diskReapply: (ctx: EffectContext) => Promise<void> } => ({
  diskRevert: async (ctx) => {
    for (const s of swaps) await s.toUndo(ctx);
  },
  diskReapply: async (ctx) => {
    for (const s of swaps) await s.toRedo(ctx);
  },
});
