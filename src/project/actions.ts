import { FrameSize, ProjectCut, ProjectFile } from './types';
import { newId } from './load';

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
