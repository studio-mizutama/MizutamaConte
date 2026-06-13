import { Psd } from 'ag-psd';
import { CutV1, FrameSize, ProjectCut, ProjectFile, PsdCache } from './types';
import { DEFAULT_SETTINGS, defaultCanvasSize } from './dimensions';

export interface LoadedPsd {
  name: string;
  psd: Psd;
}

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const emptyProject = (title = ''): ProjectFile => ({
  version: 2,
  title,
  settings: { ...DEFAULT_SETTINGS, frame: { ...DEFAULT_SETTINGS.frame } },
  cuts: [],
});

/** PSD ファイル名を数値考慮で安定ソートする（c001.psd, c002.psd, ...） */
export const sortPsdNames = (names: string[]): string[] =>
  [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

/**
 * v1 スキーマ（Cut の配列）を v2 へ移行する。
 * - 各カットへソート済み PSD ファイル名を index 対応で割り当てる
 * - dialogue はカット単位 → 先頭行へ移す（v1 は 1カット=1行）
 * - canvas 実寸は対応する PSD から取得し、なければ既定キャンバスにする
 */
export const migrateV1 = (
  cutsV1: CutV1[],
  psdMeta: { name: string; width: number; height: number }[],
  title = '',
): ProjectFile => {
  const settings = { ...DEFAULT_SETTINGS, frame: { ...DEFAULT_SETTINGS.frame } };
  const fallbackCanvas: FrameSize = defaultCanvasSize(settings.frame);
  const cuts: ProjectCut[] = cutsV1.map((cut, index) => {
    const psd = psdMeta[index];
    return {
      id: newId(),
      psd: psd?.name,
      time: cut.time,
      action: cut.action,
      cameraWork: cut.cameraWork,
      rows: [
        {
          id: newId(),
          layer: '1',
          dialogue: cut.dialogue,
          canvas: psd ? { width: psd.width, height: psd.height } : { ...fallbackCanvas },
        },
      ],
    };
  });
  return { version: 2, title, settings, cuts };
};

/**
 * 読み込んだ JSON テキストとパース済み PSD 群からプロジェクトを構築する。
 * - JSON が配列なら v1 と判定して移行する
 * - v2 はそのまま使い、各行の canvas を PSD 実寸で補正する
 */
export const buildProject = (
  jsonText: string,
  psds: LoadedPsd[],
  jsonFileName: string,
): { project: ProjectFile; cache: PsdCache; wasV1: boolean } => {
  const parsed: unknown = JSON.parse(jsonText);
  const cache: PsdCache = {};
  psds.forEach(({ name, psd }) => {
    cache[name] = psd;
  });
  const title = jsonFileName.replace(/\.json$/i, '');

  if (Array.isArray(parsed)) {
    const meta = psds.map(({ name, psd }) => ({ name, width: psd.width, height: psd.height }));
    return { project: migrateV1(parsed as CutV1[], meta, title), cache, wasV1: true };
  }

  const file = parsed as ProjectFile;
  if (file.version !== 2) {
    throw new Error(`Unsupported project version: ${String((parsed as { version?: unknown }).version)}`);
  }
  // PSD 実寸を正としてキャンバスサイズを補正
  const cuts = file.cuts.map((cut) => {
    const psd = cut.psd ? cache[cut.psd] : undefined;
    if (!psd) return cut;
    return cut; // ドキュメント実寸の補正は行単位リサイズ実装時 (Phase 5) に拡張
  });
  return { project: { ...file, cuts }, cache, wasV1: false };
};
