import { useEffect, useGlobal, getGlobal, setGlobal } from 'reactn';
import { useHotkeys } from 'react-hotkeys-hook';
import { useProject } from 'hooks/useProject';
import { getStorage } from 'storage';
import { EffectContext } from 'history/types';
import { popUndo, popRedo, canUndo, canRedo, setHistoryListener } from 'history/undoManager';

const clampIndex = (i: number, len: number): number => Math.max(0, Math.min(i, Math.max(0, len - 1)));

/** 実行時のディスク副作用コンテキスト。live psdCache を読む（クロージャの stale を避ける） */
const effectContext = (): EffectContext => ({
  storage: getStorage(),
  getPsdCache: () => getGlobal().psdCache,
  setPsdCache: (cache) => setGlobal({ psdCache: cache }),
});

/**
 * Undo/Redo を App レベルで 1 回だけマウントするフック。
 * - ⌘Z/⌘⇧Z（Win は Ctrl+Y も）を登録。preventDefault で Electron ネイティブ undo の二重発火を防ぐ
 * - テキスト欄内の ⌘Z は react-hotkeys-hook 既定（フォーム要素では発火しない）によりブラウザ標準の文字 undo に委譲
 * - undo は setProject(prevSnapshot)。autosave がそのまま JSON 永続化する
 */
export const useUndoRedo = (): void => {
  const { setProject } = useProject();
  const setSelectedCutIndex = useGlobal('selectedCutIndex')[1];

  // canUndo/canRedo をグローバルへ同期する
  useEffect(() => {
    setHistoryListener(() => setGlobal({ canUndo: canUndo(), canRedo: canRedo() }));
    return () => setHistoryListener(null);
  }, []);

  const doUndo = async (): Promise<void> => {
    const txn = popUndo();
    if (!txn) return;
    await txn.diskRevert?.(effectContext());
    await setProject(txn.prevProject);
    setSelectedCutIndex(clampIndex(txn.prevSelectedCutIndex, txn.prevProject.cuts.length));
  };

  const doRedo = async (): Promise<void> => {
    const txn = popRedo();
    if (!txn) return;
    await txn.diskReapply?.(effectContext());
    await setProject(txn.nextProject);
    setSelectedCutIndex(clampIndex(txn.nextSelectedCutIndex, txn.nextProject.cuts.length));
  };

  // react-hotkeys-hook 3.x は 'mod' 非対応のため command/ctrl を明示（既存 ⌘S 実装と同じ流儀）
  useHotkeys(
    'command+z,ctrl+z',
    (event) => {
      event.preventDefault();
      doUndo();
    },
    [],
  );
  useHotkeys(
    'command+shift+z,ctrl+shift+z,ctrl+y',
    (event) => {
      event.preventDefault();
      doRedo();
    },
    [],
  );
};
