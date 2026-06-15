import { describe, it, expect, vi } from 'vitest';
import { applyReorderWith, ReorderDeps } from '../useReorder';
import { ProjectFile, ProjectCut } from '../../project/types';
import type { Psd } from 'ag-psd';

const cut = (id: string, psd: string): ProjectCut => ({
  id,
  psd,
  time: 24,
  rows: [{ id: id + 'r', layer: '1', dialogue: '', canvas: { width: 100, height: 100 } }],
});

const project = (cuts: ProjectCut[]): ProjectFile => ({
  version: 2,
  title: 'T',
  settings: { aspect: '16:9', resolution: 'FHD', frame: { width: 1920, height: 1080 }, fps: 24 },
  cuts,
});

// 最小の Psd スタブ（remap がキーを張り替えるだけなので中身は問わない）
const fakePsd = (tag: string): Psd => ({ width: 1, height: 1, children: [], __tag: tag } as unknown as Psd);

interface RenameCall {
  from: string;
  to: string;
}

/** renameFile 呼び出しを記録するフェイク storage。failOn に一致する to の rename を reject する */
const makeStorage = (failOn?: string) => {
  const calls: RenameCall[] = [];
  return {
    calls,
    storage: {
      capabilities: { write: true, openExternal: false },
      renameFile: vi.fn(async (from: string, to: string) => {
        calls.push({ from, to });
        if (failOn && to === failOn) throw new Error(`fail rename to ${to}`);
      }),
    },
  };
};

const makeDeps = (
  storage: { capabilities: { write: boolean; openExternal: boolean }; renameFile: (f: string, t: string) => Promise<void> },
  psdCache: Record<string, Psd>,
): {
  deps: ReorderDeps;
  setProject: ReturnType<typeof vi.fn>;
  setPsdCache: ReturnType<typeof vi.fn>;
  notifyError: ReturnType<typeof vi.fn>;
} => {
  const setProject = vi.fn();
  const setPsdCache = vi.fn();
  const notifyError = vi.fn();
  return {
    deps: { storage: storage as unknown as ReorderDeps['storage'], psdCache, setProject, setPsdCache, notifyError },
    setProject,
    setPsdCache,
    notifyError,
  };
};

describe('applyReorderWith', () => {
  it('renames が空のとき setProject のみ呼び、rename も psdCache 更新もしない', async () => {
    // c001/c002 は既に正しい位置 = 目標名と一致 → renames 空
    const reordered = project([cut('a', 'c001.psd'), cut('b', 'c002.psd')]);
    const { storage } = makeStorage();
    const { deps, setProject, setPsdCache, notifyError } = makeDeps(storage, {
      'c001.psd': fakePsd('a'),
      'c002.psd': fakePsd('b'),
    });

    await applyReorderWith(deps, reordered);

    expect(storage.renameFile).not.toHaveBeenCalled();
    expect(setPsdCache).not.toHaveBeenCalled();
    expect(notifyError).not.toHaveBeenCalled();
    expect(setProject).toHaveBeenCalledTimes(1);
    expect(setProject).toHaveBeenCalledWith(reordered);
  });

  it('2 フェーズ rename を「全 from→一時名」→「全一時名→最終名」の順で実行し、最後に psdCache 張替と setProject を呼ぶ', async () => {
    // c001 と c003 を入れ替えた状態を渡す → 両方が移動対象（c001↔c003 衝突ケース）
    const reordered = project([cut('c', 'c003.psd'), cut('b', 'c002.psd'), cut('a', 'c001.psd')]);
    const { storage, calls } = makeStorage();
    const { deps, setProject, setPsdCache, notifyError } = makeDeps(storage, {
      'c001.psd': fakePsd('a'),
      'c002.psd': fakePsd('b'),
      'c003.psd': fakePsd('c'),
    });

    await applyReorderWith(deps, reordered);

    expect(notifyError).not.toHaveBeenCalled();
    // フェーズ A: 元名 → __reorder_<i>.psd（全件）/ フェーズ B: __reorder_<i>.psd → 最終名（全件）
    const phaseA = calls.filter((c) => c.to.startsWith('__reorder_'));
    const phaseB = calls.filter((c) => c.from.startsWith('__reorder_'));
    expect(phaseA.length).toBe(2);
    expect(phaseB.length).toBe(2);
    // 全フェーズ A が全フェーズ B より前に走ること（一時名で衝突を物理排除）
    const lastA = calls.findIndex((c) => c === phaseA[phaseA.length - 1]);
    const firstB = calls.findIndex((c) => c === phaseB[0]);
    expect(lastA).toBeLessThan(firstB);
    // フェーズ B 完了後に初めて psdCache 張替 → setProject の順
    const psdOrder = setPsdCache.mock.invocationCallOrder[0];
    const projOrder = setProject.mock.invocationCallOrder[0];
    expect(psdOrder).toBeLessThan(projOrder);
    expect(setPsdCache).toHaveBeenCalledTimes(1);
    expect(setProject).toHaveBeenCalledTimes(1);
  });

  it('フェーズ B 失敗時は JSON(setProject/psdCache) を触らず、完了済み rename を逆順でロールバックして notifyError する', async () => {
    const reordered = project([cut('c', 'c003.psd'), cut('b', 'c002.psd'), cut('a', 'c001.psd')]);
    // 最終名 c001.psd への rename(フェーズ B の途中) を失敗させる
    const { storage, calls } = makeStorage('c001.psd');
    const { deps, setProject, setPsdCache, notifyError } = makeDeps(storage, {
      'c001.psd': fakePsd('a'),
      'c002.psd': fakePsd('b'),
      'c003.psd': fakePsd('c'),
    });

    await applyReorderWith(deps, reordered);

    // JSON は無変更
    expect(setProject).not.toHaveBeenCalled();
    expect(setPsdCache).not.toHaveBeenCalled();
    // 失敗通知
    expect(notifyError).toHaveBeenCalledTimes(1);
    // ロールバックが走った = 失敗時点までに記録された rename を逆順で戻すコールが追加されている
    // 失敗の rename 自体（throw した分）も calls に記録済みなので、最後のコール群は「逆方向(to→from)」になる
    const failIdx = calls.findIndex((c) => c.to === 'c001.psd');
    const rollback = calls.slice(failIdx + 1);
    expect(rollback.length).toBeGreaterThan(0);
    // ロールバックの各コールは完了済み(フェーズA)コールの to→from 反転＝一時名(__reorder_)を元名へ戻す向き
    expect(rollback.some((r) => r.from.startsWith('__reorder_'))).toBe(true);
  });

  it('write 不可 storage では rename をスキップし setProject のみ行う（Web readonly 等）', async () => {
    const reordered = project([cut('c', 'c003.psd'), cut('a', 'c001.psd')]);
    const { storage } = makeStorage();
    (storage.capabilities as { write: boolean }).write = false;
    const { deps, setProject, setPsdCache } = makeDeps(storage, {});

    await applyReorderWith(deps, reordered);

    expect(storage.renameFile).not.toHaveBeenCalled();
    expect(setPsdCache).not.toHaveBeenCalled();
    expect(setProject).toHaveBeenCalledWith(reordered);
  });
});
