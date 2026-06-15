import { useGlobal, getGlobal } from 'reactn';
import { ProjectFile, PsdCache } from 'project/types';
import { planReorderRename, remapPsdCache, reorderCut, reorderScene, applyRenamesTwoPhase } from 'project/reorder';
import { ProjectStorage } from 'storage/types';
import { useProject } from 'hooks/useProject';
import { getStorage } from 'storage';
import { record } from 'history/undoManager';
import { makeReorderEffect } from 'history/reorderEffect';

/** applyReorderWith に注入する依存。テストではフェイク storage + spy を渡す */
export interface ReorderDeps {
  storage: Pick<ProjectStorage, 'renameFile' | 'capabilities'>;
  psdCache: PsdCache;
  setProject: (project: ProjectFile) => unknown;
  setPsdCache: (cache: PsdCache) => unknown;
  /** 失敗時のユーザー通知（renderer では alert を注入する） */
  notifyError: (err: unknown) => void;
}

/**
 * 並べ替え後の project を受け取り、PSD を 2 フェーズ rename・JSON-last・逆順ロールバックで適用する。
 * Shared Contract C-4 の手順を storage 注入可能な形で実装した中核。
 * - renames 空 → setProject のみ
 * - 2 フェーズ rename は applyRenamesTwoPhase に委譲（reorder forward / undo で共有）
 * - 全成功後に初めて psdCache 張替 → setProject（autosave が JSON 永続化）
 * - 途中失敗 → applyRenamesTwoPhase が best-effort ロールバック後 throw し、ここで notifyError
 *
 * エラー通知の責務はこの関数（notifyError）に一本化している。rename 失敗は
 * ここで notifyError 済みなので resolve で返す（reject しない）。
 */
export const applyReorderWith = async (deps: ReorderDeps, reordered: ProjectFile): Promise<void> => {
  const { storage, psdCache, setProject, setPsdCache, notifyError } = deps;
  const { renames, cuts } = planReorderRename(reordered);

  // write 不可（Web readonly 等）または rename 不要 → JSON 更新だけ
  if (!storage.capabilities.write || renames.length === 0) {
    await setProject(reordered);
    return;
  }

  try {
    await applyRenamesTwoPhase(storage, renames);
  } catch (err) {
    notifyError(err);
    return;
  }

  // 全 rename 成功 → 初めて psdCache 張替 → setProject（dirty 化で autosave が JSON 永続化）
  await setPsdCache(remapPsdCache(psdCache, renames));
  await setProject({ ...reordered, cuts });
};

export interface ReorderActions {
  reorderCutAt: (from: number, to: number) => Promise<void>;
  reorderSceneAt: (fromScene: number, toScene: number) => Promise<void>;
}

/** 並べ替えオーケストレータ（Shared Contract C-4）。グローバル状態 + storage を applyReorderWith に注入する */
export const useReorder = (): ReorderActions => {
  const { project, setProject } = useProject();
  const [psdCache, setPsdCache] = useGlobal('psdCache');
  const selectedCutIndex = useGlobal('selectedCutIndex')[0];
  const storage = getStorage();

  const deps = (): ReorderDeps => ({
    storage,
    psdCache,
    setProject,
    setPsdCache,
    notifyError: (err) => alert(err),
  });

  /** 並べ替えを適用し、成功時のみ Transaction を記録する */
  const applyAndRecord = async (label: string, reordered: ProjectFile): Promise<void> => {
    const prev = project;
    const prevIdx = selectedCutIndex;
    await applyReorderWith(deps(), reordered);
    const next = getGlobal().project;
    if (next === prev) return; // 失敗/変化なしは記録しない
    record({
      label,
      prevProject: prev,
      nextProject: next,
      // 並べ替えは選択 CUT の index を動かさない（行が入れ替わっても選択位置は維持）ため prev/next とも同値
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      // undo は next→prev、redo は prev→next。id 基準でファイルのバイトを動かす（方向で from/to を反転）
      diskRevert: makeReorderEffect(next, prev),
      diskReapply: makeReorderEffect(prev, next),
    });
  };

  const reorderCutAt = (from: number, to: number): Promise<void> =>
    applyAndRecord('reorderCut', reorderCut(project, from, to));

  const reorderSceneAt = (fromScene: number, toScene: number): Promise<void> =>
    applyAndRecord('reorderScene', reorderScene(project, fromScene, toScene));

  return { reorderCutAt, reorderSceneAt };
};
