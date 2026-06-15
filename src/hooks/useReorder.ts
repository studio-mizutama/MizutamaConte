import { ProjectFile, PsdCache } from 'project/types';
import { planReorderRename, remapPsdCache, RenameOp } from 'project/reorder';
import { ProjectStorage } from 'storage/types';

/** applyReorderWith に注入する依存。テストではフェイク storage + spy を渡す */
export interface ReorderDeps {
  storage: Pick<ProjectStorage, 'renameFile' | 'capabilities'>;
  psdCache: PsdCache;
  setProject: (project: ProjectFile) => void | Promise<void>;
  setPsdCache: (cache: PsdCache) => void | Promise<void>;
  /** 失敗時のユーザー通知（renderer では alert を注入する） */
  notifyError: (err: unknown) => void;
}

/** フェーズ A の一時名（決定的・復旧可能）。i は renames のインデックス */
const tempName = (i: number): string => `__reorder_${i}.psd`;

/**
 * 並べ替え後の project を受け取り、PSD を 2 フェーズ rename・JSON-last・逆順ロールバックで適用する。
 * Shared Contract C-4 の手順を storage 注入可能な形で実装した中核。
 * - renames 空 → setProject のみ
 * - フェーズ A: 各 from → __reorder_<i>.psd
 * - フェーズ B: 各 __reorder_<i>.psd → 最終名
 * - 全成功後に初めて psdCache 張替 → setProject（autosave が JSON 永続化）
 * - 途中失敗 → 完了済み rename を逆順 best-effort で戻し JSON は触らず notifyError
 */
export const applyReorderWith = async (deps: ReorderDeps, reordered: ProjectFile): Promise<void> => {
  const { storage, psdCache, setProject, setPsdCache, notifyError } = deps;
  const { renames, cuts } = planReorderRename(reordered);

  // write 不可（Web readonly 等）または rename 不要 → JSON 更新だけ
  if (!storage.capabilities.write || renames.length === 0) {
    await setProject(reordered);
    return;
  }

  // 完了済み rename を (from→to) の形で積み、失敗時に逆順(to→from)で戻す
  const done: RenameOp[] = [];
  try {
    // フェーズ A: 全対象を一時名へ（衝突を物理排除）
    for (let i = 0; i < renames.length; i += 1) {
      const op = { from: renames[i].from, to: tempName(i) };
      await storage.renameFile(op.from, op.to);
      done.push(op);
    }
    // フェーズ B: 一時名 → 最終名
    for (let i = 0; i < renames.length; i += 1) {
      const op = { from: tempName(i), to: renames[i].to };
      await storage.renameFile(op.from, op.to);
      done.push(op);
    }
  } catch (err) {
    // 完了済みを逆順で best-effort ロールバック（JSON は無変更）
    for (let i = done.length - 1; i >= 0; i -= 1) {
      try {
        await storage.renameFile(done[i].to, done[i].from);
      } catch {
        // ロールバック失敗は握りつぶす（best-effort）
      }
    }
    notifyError(err);
    return;
  }

  // 全 rename 成功 → 初めて psdCache 張替 → setProject（dirty 化で autosave が JSON 永続化）
  await setPsdCache(remapPsdCache(psdCache, renames));
  await setProject({ ...reordered, cuts });
};
