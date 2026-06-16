import { useGlobal, getGlobal, setGlobal } from 'reactn';
import { useProject } from 'hooks/useProject';
import { getStorage } from 'storage';
import { EffectContext } from 'history/types';
import { popUndo, popRedo } from 'history/undoManager';
import { isApplying, setApplying } from 'hooks/applyingGuard';

const clampIndex = (i: number, len: number): number => Math.max(0, Math.min(i, Math.max(0, len - 1)));

/** 実行時のディスク副作用コンテキスト。live psdCache を読む（クロージャの stale を避ける） */
const effectContext = (): EffectContext => ({
  storage: getStorage(),
  getPsdCache: () => getGlobal().psdCache,
  setPsdCache: (cache) => setGlobal({ psdCache: cache }),
});

export interface UndoRedoControls {
  doUndo: () => Promise<void>;
  doRedo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Undo/Redo の実体（doUndo/doRedo）と可否フラグを提供するフック。
 * - ホットキー登録・Electron メニュー IPC は持たず、UI ボタン等からも再利用できる純粋な操作集約
 * - 再入ガードは applyingGuard（モジュールスコープ）で複数マウント間共有
 */
export const useUndoRedoControls = (): UndoRedoControls => {
  const { setProject } = useProject();
  const setSelectedCutIndex = useGlobal('selectedCutIndex')[1];
  const canUndo = useGlobal('canUndo')[0];
  const canRedo = useGlobal('canRedo')[0];

  const doUndo = async (): Promise<void> => {
    // Undo/Redo は Edit/Preview の両タブで有効（Preview のセリフ/尺編集も履歴記録済み）
    if (isApplying()) return;
    const txn = popUndo();
    if (!txn) return;
    setApplying(true);
    try {
      await txn.diskRevert?.(effectContext());
      await setProject(txn.prevProject);
      setSelectedCutIndex(clampIndex(txn.prevSelectedCutIndex, txn.prevProject.cuts.length));
    } catch (err) {
      console.error('Undo に失敗しました', err);
    } finally {
      setApplying(false);
    }
  };

  const doRedo = async (): Promise<void> => {
    // Undo/Redo は Edit/Preview の両タブで有効（Preview のセリフ/尺編集も履歴記録済み）
    if (isApplying()) return;
    const txn = popRedo();
    if (!txn) return;
    setApplying(true);
    try {
      await txn.diskReapply?.(effectContext());
      await setProject(txn.nextProject);
      setSelectedCutIndex(clampIndex(txn.nextSelectedCutIndex, txn.nextProject.cuts.length));
    } catch (err) {
      console.error('Redo に失敗しました', err);
    } finally {
      setApplying(false);
    }
  };

  return { doUndo, doRedo, canUndo: Boolean(canUndo), canRedo: Boolean(canRedo) };
};
