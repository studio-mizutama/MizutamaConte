import { FrameSize, ProjectCut } from './types';

/** シーングループ（描画用）。CUT 番号は配列 index 由来の通し連番を維持する */
export interface SceneGroup {
  /** 1 始まりのシーン番号 */
  sceneNumber: number;
  /** シーン見出しのタイトル（未設定可） */
  title?: string;
  /** このシーンが始まる cuts の index */
  startIndex: number;
  /** このシーンに属する cuts の index 一覧 */
  cutIndices: number[];
}

/** CUT の代表キャンバス。複数レイヤー時も全 rows 同値の不変条件があるため先頭行を正とする */
export const cutCanvas = (cut: ProjectCut): FrameSize =>
  cut.rows?.[0]?.canvas ?? { width: 0, height: 0 };

export const sameCanvas = (a: FrameSize, b: FrameSize): boolean =>
  a.width === b.width && a.height === b.height;

/** 隣接 CUT を 1 つに結合できるか（キャンバス一致が条件） */
export const canMerge = (a: ProjectCut, b: ProjectCut): boolean =>
  sameCanvas(cutCanvas(a), cutCanvas(b));

/** sceneStart マーカーからシーングループを算出する。先頭カットは常にシーン開始扱い */
export const deriveScenes = (cuts: ProjectCut[]): SceneGroup[] => {
  const scenes: SceneGroup[] = [];
  cuts.forEach((cut, index) => {
    const isStart = index === 0 || !!cut.sceneStart;
    if (isStart) {
      scenes.push({
        sceneNumber: scenes.length + 1,
        title: cut.sceneStart?.title,
        startIndex: index,
        cutIndices: [index],
      });
    } else {
      scenes[scenes.length - 1].cutIndices.push(index);
    }
  });
  return scenes;
};
