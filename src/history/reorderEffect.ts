import { ProjectFile } from 'project/types';
import { RenameOp, remapPsdCache, applyRenamesTwoPhase } from 'project/reorder';
import { DiskEffect } from 'history/types';

/**
 * from プロジェクトの現在ファイル名 → to プロジェクトの目標ファイル名 を cut id で対応付けて算出する。
 * 並べ替えはファイル名が順序に追従するため、undo/redo はバイトを id 基準で動かせばよい。
 */
export const planRenamesBetween = (from: ProjectFile, to: ProjectFile): RenameOp[] => {
  const ops: RenameOp[] = [];
  for (const toCut of to.cuts) {
    const fromCut = from.cuts.find((c) => c.id === toCut.id);
    if (fromCut?.psd && toCut.psd && fromCut.psd !== toCut.psd) {
      ops.push({ from: fromCut.psd, to: toCut.psd });
    }
  }
  return ops;
};

/** 並べ替えの undo/redo 用ディスク副作用: from の状態から to の状態へファイルを動かす */
export const makeReorderEffect = (from: ProjectFile, to: ProjectFile): DiskEffect => async (ctx) => {
  const renames = planRenamesBetween(from, to);
  if (!ctx.storage.capabilities.write || renames.length === 0) return;
  await applyRenamesTwoPhase(ctx.storage, renames);
  ctx.setPsdCache(remapPsdCache(ctx.getPsdCache(), renames));
};
