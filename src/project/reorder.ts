import type { ProjectFile, ProjectCut } from './types';
import { deriveScenes } from './scene';

export interface RenameOp {
  from: string;
  to: string;
}

/** 新 0 始まり index → 目標 PSD 名（cut 番号＝ファイル番号で一致） */
export const targetPsdName = (index: number): string => `c${String(index + 1).padStart(3, '0')}.psd`;

/** 配列要素を from→to へ移動した新配列を返す（純粋・不変）。範囲外/同値はコピーのみ */
const moveItem = <T>(items: readonly T[], from: number, to: number): T[] => {
  const next = [...items];
  if (from === to || from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

/** cuts 配列を from→to へ移動（純粋・不変） */
export const reorderCut = (project: ProjectFile, from: number, to: number): ProjectFile => ({
  ...project,
  cuts: moveItem(project.cuts, from, to),
});

/** シーン（連続 CUT ブロック）単位で移動。deriveScenes で境界を取得しブロックごと差し替える（純粋・不変） */
export const reorderScene = (project: ProjectFile, fromScene: number, toScene: number): ProjectFile => {
  const scenes = deriveScenes(project.cuts);
  if (
    fromScene === toScene ||
    fromScene < 0 ||
    fromScene >= scenes.length ||
    toScene < 0 ||
    toScene >= scenes.length
  ) {
    return { ...project, cuts: [...project.cuts] };
  }
  // 各シーンを CUT ブロック（ProjectCut[]）に分解 → ブロック単位で移動 → 平坦化
  const blocks = scenes.map((scene) => scene.cutIndices.map((i) => project.cuts[i]));
  const movedBlocks = moveItem(blocks, fromScene, toScene);
  return { ...project, cuts: movedBlocks.flat() };
};

/**
 * 「既に並べ替え済み」の project を受け取り、psd を持つ各 cut の目標名を配列 index から計算する。
 * from !== to のものだけ renames に積む。cuts は psd 参照を新名に更新したもの（psd 無し cut はそのまま）。
 */
export const planReorderRename = (
  project: ProjectFile,
): { renames: RenameOp[]; cuts: ProjectCut[] } => {
  const renames: RenameOp[] = [];
  const cuts = project.cuts.map((cut, index) => {
    if (!cut.psd) return { ...cut };
    const to = targetPsdName(index);
    if (cut.psd !== to) renames.push({ from: cut.psd, to });
    return { ...cut, psd: to };
  });
  return { renames, cuts };
};

/** psdCache のキーを旧名→新名へ張り替える純粋関数。対象外キーはそのまま残す */
export const remapPsdCache = <T>(cache: Record<string, T>, renames: RenameOp[]): Record<string, T> => {
  const renamedFrom = new Set(renames.map((r) => r.from));
  const next: Record<string, T> = {};
  // rename 対象外のキーを先にコピー
  for (const [key, value] of Object.entries(cache)) {
    if (!renamedFrom.has(key)) next[key] = value;
  }
  // 旧名→新名へ張り替え（元 cache の値を新キーに移す）
  for (const { from, to } of renames) {
    if (from in cache) next[to] = cache[from];
  }
  return next;
};
