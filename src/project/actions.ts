import { FrameSize, ProjectCut, ProjectFile } from './types';
import { newId } from './load';
import { cutCanvas } from './scene';
import { coverCamera } from './camera';

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
          cameraWork: coverCamera(size, frame),
        }
      : cut,
  ),
});
