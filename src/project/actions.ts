import { FrameSize, ProjectCut, ProjectFile } from './types';
import { newId } from './load';
import { cutCanvas } from './scene';
import { defaultCameraForResize } from './camera';

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
  if (b.psd === a.psd) return null;
  const merged = mergeCuts(project, index);
  return merged.cuts.some((cut) => cut.psd === b.psd) ? null : b.psd;
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
    rows: [{ id: newId(), layer: '1', dialogue: '', canvas: { ...lastRow.canvas } }],
  };
  return {
    ...project,
    cuts: [...project.cuts.slice(0, cutIndex), remaining, newCut, ...project.cuts.slice(cutIndex + 1)],
  };
};

/** カットのキャンバスを新サイズへ。全レイヤーを同値にし(不変条件)、cover カメラを自動付与する */
export const resizeCutCanvas = (
  project: ProjectFile,
  cutIndex: number,
  size: FrameSize,
  frame: FrameSize,
): ProjectFile => ({
  ...project,
  cuts: project.cuts.map((cut, i) =>
    i === cutIndex
      ? {
          ...cut,
          rows: cut.rows.map((row) => ({ ...row, canvas: { ...size } })),
          cameraWork: defaultCameraForResize(size, frame),
        }
      : cut,
  ),
});
