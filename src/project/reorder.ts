import type { ProjectFile, ProjectCut } from './types';
import { deriveScenes } from './scene';
import type { ProjectStorage } from 'storage/types';

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

/** cut から sceneStart キーを除去した新オブジェクトを返す（不変・キーごと削除） */
export const stripSceneStart = (cut: ProjectCut): ProjectCut => {
  const { sceneStart: _omit, ...rest } = cut;
  return rest;
};

/**
 * 「並び順は確定済みの cuts」と「各位置の実効シーン ID」「シーン ID→タイトル」から
 * sceneStart マーカーを再正規化する（純粋・不変）。reorderCut / deleteCutAt で共有。
 *
 * 規則:
 * - index0 は常に暗黙の Scene 1（マーカー除去）。
 * - 直前 cut と実効シーン ID が変わる位置のみ境界マーカー sceneStart:{title} を付与
 *   （title が undefined でも境界マーカーとして機能する）。
 * - 同一シーン内の cut（境界でない位置）からはマーカーを除去（重複境界を作らない）。
 */
export const normalizeSceneMarkers = (
  cuts: readonly ProjectCut[],
  effectiveSceneIds: readonly number[],
  titleBySceneId: readonly (string | undefined)[],
): ProjectCut[] =>
  cuts.map((cut, p) => {
    if (p === 0) return stripSceneStart(cut); // 暗黙の Scene 1
    if (effectiveSceneIds[p] !== effectiveSceneIds[p - 1]) {
      return { ...stripSceneStart(cut), sceneStart: { title: titleBySceneId[effectiveSceneIds[p]] } };
    }
    return stripSceneStart(cut);
  });

/**
 * 個別 CUT を from→to へ移動し、sceneStart マーカーを再正規化する（純粋・不変）。
 *
 * セマンティクス＝「ドロップ先シーンに合流」: 移動した CUT は落とした位置のシーンの一員になる。
 * 元シーンは先頭 CUT が抜けても次 CUT が見出しを引き継ぎ消えない。index0 は常に暗黙の Scene 1。
 * 結果は必ず deriveScenes で round-trip する（各シーンの連続ブロックを正しく表すマーカー配置）。
 *
 * cut オブジェクトではなく「元インデックス」を動かし、各新位置の実効シーンを決めてから
 * 境界（シーンが切り替わる位置）にだけ sceneStart マーカーを付与する。
 */
export const reorderCut = (project: ProjectFile, from: number, to: number): ProjectFile => {
  const cuts = project.cuts;
  if (from === to || from < 0 || from >= cuts.length || to < 0 || to >= cuts.length) {
    // 範囲外/同値はマーカー不変でコピーのみ
    return { ...project, cuts: [...cuts] };
  }
  // 元の各 cut index → 所属シーンの order、および scene order → title を作る
  const scenes = deriveScenes(cuts);
  const sceneIdByIndex: number[] = new Array(cuts.length);
  const titleBySceneId: (string | undefined)[] = scenes.map((scene) => scene.title);
  scenes.forEach((scene, sceneId) => {
    scene.cutIndices.forEach((idx) => {
      sceneIdByIndex[idx] = sceneId;
    });
  });
  // 「新しい表示順での元インデックス配列」を得る（cut オブジェクトでなくインデックスを動かす）
  const order = moveItem([...cuts.keys()], from, to);
  // 各新位置 p の実効シーン ID を決める
  const eff: number[] = new Array(order.length);
  order.forEach((origIndex, p) => {
    if (origIndex !== from) {
      // 動かしていない cut は元のシーンを維持
      eff[p] = sceneIdByIndex[origIndex];
    } else if (p > 0) {
      // 動かした cut は直前 cut のシーンに合流
      eff[p] = eff[p - 1];
    } else {
      // 先頭に置いたら後続（新 Scene 1）に合流。要素 1 個なら自身の元シーン
      eff[p] = order.length > 1 ? sceneIdByIndex[order[1]] : sceneIdByIndex[from];
    }
  });
  // 結果 cuts を組み立て、境界にのみマーカーを付与（共有ヘルパに委譲）
  const orderedCuts = order.map((origIndex) => cuts[origIndex]);
  return { ...project, cuts: normalizeSceneMarkers(orderedCuts, eff, titleBySceneId) };
};

/**
 * シーン（連続 CUT ブロック）単位で移動。deriveScenes で境界を取得しブロックごと差し替え、
 * 移動後に sceneStart マーカーを再正規化する（純粋・不変）。
 *
 * 正規化ルール:
 * - 各ブロックの先頭 cut（k===0）のみがシーン境界を担う。内部 cut（k>0）の sceneStart は除去。
 * - 先頭ブロック（order===0）: title があれば sceneStart:{title} を維持、無題なら除去（暗黙の Scene 1）。
 * - 非先頭ブロック（order>0）: 必ず sceneStart:{title} を付与（title が undefined でも境界マーカーになる）。
 */
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
  // 各シーンを { title, block } に分解（title=meta を保持） → 移動 → 平坦化＋マーカー再正規化
  const sceneBlocks = scenes.map((scene) => ({
    title: scene.title,
    block: scene.cutIndices.map((i) => project.cuts[i]),
  }));
  const movedBlocks = moveItem(sceneBlocks, fromScene, toScene);
  const cuts = movedBlocks.flatMap(({ title, block }, order) =>
    block.map((cut, k) => {
      // 内部 cut は常に境界を持たない
      if (k > 0) return stripSceneStart(cut);
      // 先頭 cut: 先頭ブロックは title 有無で出し分け、非先頭ブロックは必ずマーカー付与
      if (order === 0) {
        if (title === undefined) return stripSceneStart(cut);
        return { ...stripSceneStart(cut), sceneStart: { title } };
      }
      return { ...stripSceneStart(cut), sceneStart: { title } };
    }),
  );
  return { ...project, cuts };
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

/**
 * 2 フェーズ rename（衝突回避）。失敗時は完了分を逆順 best-effort で戻してから throw。
 * reorder forward / undo の両方で共有する。
 */
export const applyRenamesTwoPhase = async (
  storage: Pick<ProjectStorage, 'renameFile'>,
  renames: RenameOp[],
  tempPrefix = '__reorder_',
): Promise<void> => {
  const done: RenameOp[] = [];
  try {
    for (let i = 0; i < renames.length; i += 1) {
      const op = { from: renames[i].from, to: `${tempPrefix}${i}.psd` };
      await storage.renameFile(op.from, op.to);
      done.push(op);
    }
    for (let i = 0; i < renames.length; i += 1) {
      const op = { from: `${tempPrefix}${i}.psd`, to: renames[i].to };
      await storage.renameFile(op.from, op.to);
      done.push(op);
    }
  } catch (err) {
    for (let i = done.length - 1; i >= 0; i -= 1) {
      try {
        await storage.renameFile(done[i].to, done[i].from);
      } catch {
        // best-effort
      }
    }
    throw err;
  }
};
