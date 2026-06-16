import { FrameSize, ProjectCut, ProjectFile } from './types';
import { newId } from './load';
import { cutCanvas, deriveScenes } from './scene';
import { defaultCameraForResize } from './camera';
import { normalizeSceneMarkers } from './reorder';

/** index 位置のカットへ patch を適用した新しいプロジェクトを返す */
export const updateCutAt = (project: ProjectFile, index: number, patch: Partial<ProjectCut>): ProjectFile => ({
  ...project,
  cuts: project.cuts.map((cut, i) => (i === index ? { ...cut, ...patch } : cut)),
});

/** 台詞は行単位で持つ。現状の編集 UI はカット先頭行を対象にする */
export const updateDialogueAt = (project: ProjectFile, index: number, dialogue: string): ProjectFile => ({
  ...project,
  cuts: project.cuts.map((cut, i) =>
    i === index
      ? { ...cut, rows: cut.rows.map((row, r) => (r === 0 ? { ...row, dialogue } : row)) }
      : cut,
  ),
});

/** 既存 PSD ファイル名の最大番号 +1 を採番する（欠番は埋めない） */
export const nextPsdName = (project: ProjectFile): string => {
  const numbers = project.cuts
    .map((cut) => cut.psd)
    .filter((name): name is string => !!name)
    .map((name) => Number.parseInt(name.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `c${String(next).padStart(3, '0')}.psd`;
};

/** 末尾に新しいカット（1行）を追加する */
export const appendCut = (
  project: ProjectFile,
  psdName: string,
  canvas: FrameSize,
  defaultTime: number,
): ProjectFile => ({
  ...project,
  cuts: [
    ...project.cuts,
    {
      id: newId(),
      psd: psdName,
      time: defaultTime,
      rows: [{ id: newId(), layer: '1', dialogue: '', canvas: { ...canvas } }],
    },
  ],
});

/** 指定カットへ新規レイヤー行を追加する。キャンバスは CUT 既存と同一（不変条件を維持） */
export const appendLayer = (project: ProjectFile, cutIndex: number): ProjectFile => ({
  ...project,
  cuts: project.cuts.map((cut, i) => {
    if (i !== cutIndex) return cut;
    const canvas = cutCanvas(cut);
    return {
      ...cut,
      rows: [...cut.rows, { id: newId(), layer: String(cut.rows.length + 1), dialogue: '', canvas: { ...canvas } }],
    };
  }),
});

/** sceneStart マーカーを設定/解除する。undefined を渡すと解除 */
export const setSceneStart = (
  project: ProjectFile,
  cutIndex: number,
  sceneStart: { title?: string } | undefined,
): ProjectFile => ({
  ...project,
  cuts: project.cuts.map((cut, i) => {
    if (i !== cutIndex) return cut;
    const next: ProjectCut = { ...cut };
    if (sceneStart === undefined) delete next.sceneStart;
    else next.sceneStart = sceneStart;
    return next;
  }),
});

/** シーンタイトルを更新する（マーカーが無ければ付与する） */
export const setSceneTitle = (project: ProjectFile, cutIndex: number, title: string): ProjectFile =>
  setSceneStart(project, cutIndex, { title });

/** 末尾に新カットを追加し、新シーンの開始としてマークする */
export const appendSceneCut = (
  project: ProjectFile,
  psdName: string,
  canvas: FrameSize,
  defaultTime: number,
  title?: string,
): ProjectFile => {
  const appended = appendCut(project, psdName, canvas, defaultTime);
  return setSceneStart(appended, appended.cuts.length - 1, { title });
};

/** 隣接する index と index+1 のカットを1つに統合する（下CUTのレイヤーを上CUTへ連結） */
export const mergeCuts = (project: ProjectFile, index: number): ProjectFile => {
  const a = project.cuts[index];
  const b = project.cuts[index + 1];
  if (!a || !b) return project;
  const merged: ProjectCut = {
    ...a,
    time: (a.time ?? 0) + (b.time ?? 0),
    // 連結された行は CUT-level の dialogue を汚さないようクリアする（DIALOGUE は上CUTを採用）
    rows: [...a.rows, ...b.rows.map((row) => ({ ...row, dialogue: '' }))],
  };
  return {
    ...project,
    cuts: [...project.cuts.slice(0, index), merged, ...project.cuts.slice(index + 2)],
  };
};

/** 結合(index と index+1)で孤立する下CUTの PSD 名を返す。
 *  結合後にどのカットからも参照されない場合のみ返し、それ以外（参照あり・上CUTと同名・存在しない）は null。
 *  ※ mergePsd は下CUTの内容を上CUTへコピー済みなので、ここで返る PSD の削除は内容を失わない掃除になる。 */
export const orphanedPsdAfterMerge = (project: ProjectFile, index: number): string | null => {
  const a = project.cuts[index];
  const b = project.cuts[index + 1];
  if (!a || !b || !b.psd) return null;
  // ファイル名比較は大文字小文字を無視する（Mac/Windows は大小無視 FS のため、
  // 別カットが同じ PSD を別表記で参照していても削除しない＝破壊的操作を保守的に倒す）
  const target = b.psd.toLowerCase();
  if (a.psd?.toLowerCase() === target) return null;
  const merged = mergeCuts(project, index);
  return merged.cuts.some((cut) => cut.psd?.toLowerCase() === target) ? null : b.psd;
};

/** 複数レイヤーCUTの最終レイヤーを、直後の新規単層CUTとして切り出す（New Layer の逆操作） */
export const splitLastLayer = (
  project: ProjectFile,
  cutIndex: number,
  newPsdName: string,
  defaultTime: number,
): ProjectFile => {
  const cut = project.cuts[cutIndex];
  if (!cut || cut.rows.length < 2) return project;
  const lastRow = cut.rows[cut.rows.length - 1];
  const remaining: ProjectCut = { ...cut, rows: cut.rows.slice(0, -1) };
  const newCut: ProjectCut = {
    id: newId(),
    psd: newPsdName,
    time: defaultTime,
    // 新CUTは元CUTと同じ canvas（lastRow.canvas）なので cameraWork も引き継ぐ。
    // 引き継がないと拡大 canvas なのにカメラ無し＝IN/OUT 非表示・Preview で静止してしまう。
    cameraWork: cut.cameraWork,
    rows: [{ id: newId(), layer: '1', dialogue: '', canvas: { ...lastRow.canvas } }],
  };
  return {
    ...project,
    cuts: [...project.cuts.slice(0, cutIndex), remaining, newCut, ...project.cuts.slice(cutIndex + 1)],
  };
};

/** index の直後に新規CUT（1行・単層）をスプライス挿入する。
 *  sceneStart は付けない＝挿入位置のシーンに合流する。不変。 */
export const insertCutAfter = (
  project: ProjectFile,
  index: number,
  psdName: string,
  size: FrameSize,
  time: number,
): ProjectFile => {
  const newCut: ProjectCut = {
    id: newId(),
    psd: psdName,
    time,
    rows: [{ id: newId(), layer: '1', dialogue: '', canvas: { ...size } }],
  };
  return {
    ...project,
    cuts: [...project.cuts.slice(0, index + 1), newCut, ...project.cuts.slice(index + 1)],
  };
};

/** index のCUTを削除し、sceneStart マーカーを再正規化する（deriveScenes が round-trip する）。
 *  cuts.length<=1 のときは削除不可（最後の1CUTは残す）。不変。
 *
 *  正規化方針（reorder.ts と共有）: 削除前に各 cut の所属シーン ID を deriveScenes で求め、
 *  対象を除いた残存列の実効シーン ID を作り、normalizeSceneMarkers で境界マーカーを再付与する。
 *  これにより「シーン先頭CUTを消すと次CUTがタイトルを継承」「index0 は暗黙化」が成立する。 */
export const deleteCutAt = (project: ProjectFile, index: number): ProjectFile => {
  const cuts = project.cuts;
  if (cuts.length <= 1 || index < 0 || index >= cuts.length) return project;
  // 削除前の各 cut index → 所属シーン ID、シーン ID → タイトルを作る
  const scenes = deriveScenes(cuts);
  const sceneIdByIndex: number[] = new Array(cuts.length);
  const titleBySceneId: (string | undefined)[] = scenes.map((scene) => scene.title);
  scenes.forEach((scene, sceneId) => {
    scene.cutIndices.forEach((idx) => {
      sceneIdByIndex[idx] = sceneId;
    });
  });
  // 対象を除いた残存列と、その実効シーン ID 列を作る
  const remainingCuts: ProjectCut[] = [];
  const effectiveSceneIds: number[] = [];
  cuts.forEach((cut, i) => {
    if (i === index) return;
    remainingCuts.push(cut);
    effectiveSceneIds.push(sceneIdByIndex[i]);
  });
  return {
    ...project,
    cuts: normalizeSceneMarkers(remainingCuts, effectiveSceneIds, titleBySceneId),
  };
};

/** カットのキャンバスを新サイズへ。全レイヤーを同値にし(不変条件)、拡大時のみ cover カメラを自動付与する。
 *  native（フレーム以下）に戻したときは cameraWork を消す（IN/OUT 非表示・CameraWork パネルをグレーアウト）。 */
export const resizeCutCanvas = (
  project: ProjectFile,
  cutIndex: number,
  size: FrameSize,
  frame: FrameSize,
): ProjectFile => {
  const isNative = size.width <= frame.width && size.height <= frame.height;
  return {
    ...project,
    cuts: project.cuts.map((cut, i) =>
      i === cutIndex
        ? {
            ...cut,
            rows: cut.rows.map((row) => ({ ...row, canvas: { ...size } })),
            cameraWork: isNative ? undefined : defaultCameraForResize(size, frame),
          }
        : cut,
    ),
  };
};

// ---- v0.9: fade / Cross ペア同期 ----
// Action は @types/global.d.ts の `declare global` で定義された ambient 型（import 不要）
export type FadeSide = 'in' | 'out';
export type FadeType = NonNullable<Action['fadeIn']> | NonNullable<Action['fadeOut']>;

const FADE_DEFAULT = 12;
const clampDur = (v: number, max: number): number => Math.max(0, Math.min(v, max));
const sideFields = (side: FadeSide) =>
  side === 'in'
    ? { type: 'fadeIn' as const, dur: 'fadeInDuration' as const }
    : { type: 'fadeOut' as const, dur: 'fadeOutDuration' as const };
const partnerOf = (index: number, side: FadeSide): { idx: number; side: FadeSide } =>
  side === 'out' ? { idx: index + 1, side: 'in' } : { idx: index - 1, side: 'out' };

const applyActionPatches = (
  project: ProjectFile,
  patches: Array<{ idx: number; action: Partial<Action> }>,
): ProjectFile => {
  const byIdx = new Map<number, Partial<Action>>();
  for (const p of patches) byIdx.set(p.idx, { ...byIdx.get(p.idx), ...p.action });
  return {
    ...project,
    cuts: project.cuts.map((c, i) => {
      const patch = byIdx.get(i);
      return patch ? { ...c, action: { ...c.action, ...patch } } : c;
    }),
  };
};

/** 片側の fade 種別を設定。Cross は相方も同期。種別選択時 duration 既定12（cut尺clamp）。 */
export const setFadeType = (
  project: ProjectFile,
  index: number,
  side: FadeSide,
  type: FadeType | undefined,
): ProjectFile => {
  const cut = project.cuts[index];
  if (!cut) return project;
  const f = sideFields(side);
  const prevType = cut.action?.[f.type];
  const partner = partnerOf(index, side);
  const partnerCut = project.cuts[partner.idx];

  if (type === 'Cross') {
    if (!partnerCut) return project;
    const cap = Math.min(cut.time ?? 0, partnerCut.time ?? 0);
    const dur = clampDur((cut.action?.[f.dur] as number) || FADE_DEFAULT, cap);
    const pf = sideFields(partner.side);
    return applyActionPatches(project, [
      { idx: index, action: { [f.type]: 'Cross', [f.dur]: dur } as Partial<Action> },
      { idx: partner.idx, action: { [pf.type]: 'Cross', [pf.dur]: dur } as Partial<Action> },
    ]);
  }

  const patches: Array<{ idx: number; action: Partial<Action> }> = [];
  if (type === undefined) {
    patches.push({ idx: index, action: { [f.type]: undefined } as Partial<Action> });
  } else {
    const dur = clampDur((cut.action?.[f.dur] as number) || FADE_DEFAULT, cut.time ?? 0);
    patches.push({ idx: index, action: { [f.type]: type, [f.dur]: dur } as Partial<Action> });
  }
  if (prevType === 'Cross' && partnerCut) {
    const pf = sideFields(partner.side);
    if (partnerCut.action?.[pf.type] === 'Cross') {
      patches.push({ idx: partner.idx, action: { [pf.type]: undefined } as Partial<Action> });
    }
  }
  return applyActionPatches(project, patches);
};

/** 片側の duration を設定。その側が Cross なら相方も追従。両尺 min で clamp。 */
export const setFadeDuration = (
  project: ProjectFile,
  index: number,
  side: FadeSide,
  duration: number,
): ProjectFile => {
  const cut = project.cuts[index];
  if (!cut) return project;
  const f = sideFields(side);
  if (cut.action?.[f.type] === 'Cross') {
    const partner = partnerOf(index, side);
    const partnerCut = project.cuts[partner.idx];
    if (partnerCut) {
      const dur = clampDur(duration, Math.min(cut.time ?? 0, partnerCut.time ?? 0));
      const pf = sideFields(partner.side);
      return applyActionPatches(project, [
        { idx: index, action: { [f.dur]: dur } as Partial<Action> },
        { idx: partner.idx, action: { [pf.dur]: dur } as Partial<Action> },
      ]);
    }
  }
  return applyActionPatches(project, [
    { idx: index, action: { [f.dur]: clampDur(duration, cut.time ?? 0) } as Partial<Action> },
  ]);
};
