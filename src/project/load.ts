import { Psd } from 'ag-psd';
import { AspectKey, CutRow, CutV1, FrameSize, ProjectCut, ProjectFile, ProjectSettings, PsdCache, ResolutionKey } from './types';
import { ASPECT_KEYS, DEFAULT_SETTINGS, defaultCanvasSize, deriveFrame, RESOLUTION_KEYS } from './dimensions';
import { MIN_FRAMES, maxCutFrames } from './limits';
import { normalizePsdLayers } from 'psd/normalize';

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
 * JSON テキストが Conte プロジェクトとして読み込める形か判定する（純粋関数）。
 * buildProject の受理条件と一致させる:
 * - v1: トップレベルが配列（Cut の配列）
 * - v2: version===2 のオブジェクトで cuts が配列
 * パース失敗・形不一致はすべて false（applyProject 前のガードに使う）。
 */
export const isValidProjectJson = (jsonText: string): boolean => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return false;
  }
  // v1: トップレベル配列
  if (Array.isArray(parsed)) return true;
  // v2: { version: 2, cuts: [...] }
  if (typeof parsed !== 'object' || parsed === null) return false;
  const file = parsed as { version?: unknown; cuts?: unknown };
  return file.version === 2 && Array.isArray(file.cuts);
};

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
  return normalizeProjectFile({ version: 2, title, settings, cuts });
};

const isPositiveSize = (s: unknown): s is FrameSize => {
  const f = s as FrameSize | undefined;
  return !!f && Number.isFinite(f.width) && Number.isFinite(f.height) && f.width > 0 && f.height > 0;
};

/** settings を必ず描画可能な形へ補完する（frame/fps/resolution/aspect の欠損・不正を既定で埋める）。 */
const normalizeSettings = (raw: unknown): ProjectSettings => {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<ProjectSettings>;
  const resolution: ResolutionKey = RESOLUTION_KEYS.includes(s.resolution as ResolutionKey)
    ? (s.resolution as ResolutionKey)
    : DEFAULT_SETTINGS.resolution;
  const aspect: AspectKey = ASPECT_KEYS.includes(s.aspect as AspectKey) ? (s.aspect as AspectKey) : DEFAULT_SETTINGS.aspect;
  const derived = deriveFrame(resolution, aspect);
  const frame = isPositiveSize(s.frame) ? s.frame : isPositiveSize(derived) ? derived : { ...DEFAULT_SETTINGS.frame };
  const fps = Number.isFinite(s.fps) && (s.fps as number) > 0 ? (s.fps as number) : DEFAULT_SETTINGS.fps;
  return { resolution, aspect, frame, fps };
};

/** cameraWork は scale/position の in/out（と x/y）が全て有限数で揃う時のみ採用。部分欠損は undefined（カメラ無し）。 */
const normalizeCameraWork = (cw: unknown): CameraWork | undefined => {
  const c = cw as CameraWork | undefined;
  const full =
    !!c?.scale &&
    Number.isFinite(c.scale.in) &&
    Number.isFinite(c.scale.out) &&
    !!c?.position?.in &&
    !!c?.position?.out &&
    Number.isFinite(c.position.in.x) &&
    Number.isFinite(c.position.in.y) &&
    Number.isFinite(c.position.out.x) &&
    Number.isFinite(c.position.out.y);
  return full ? c : undefined;
};

/** cut.time を正規化。未設定は据え置き（cutOffsets が ?? 0 で扱う）、present だが不正(非有限/0/負)は 1 秒、巨大は上限へ。 */
const normalizeCutTime = (rawTime: number | undefined, fps: number): number | undefined => {
  if (rawTime === undefined) return undefined;
  const t = Number(rawTime);
  return Number.isFinite(t) && t >= MIN_FRAMES ? Math.min(Math.floor(t), maxCutFrames(fps)) : fps;
};

/** cut を必ず描画可能な形へ補完する（rows/canvas/time/cameraWork）。 */
const normalizeCut = (cut: ProjectCut, settings: ProjectSettings): ProjectCut => {
  const fallbackCanvas = defaultCanvasSize(settings.frame);
  const rows: CutRow[] =
    Array.isArray(cut.rows) && cut.rows.length > 0
      ? cut.rows.map((r) => ({
          id: r?.id ?? newId(),
          layer: r?.layer ?? '1',
          dialogue: r?.dialogue,
          canvas: isPositiveSize(r?.canvas) ? r.canvas : { ...fallbackCanvas },
        }))
      : [{ id: newId(), layer: '1', dialogue: undefined, canvas: { ...fallbackCanvas } }];
  return {
    ...cut,
    rows,
    time: normalizeCutTime(cut.time, settings.fps),
    cameraWork: normalizeCameraWork(cut.cameraWork),
  };
};

/** v2 ProjectFile を必ず描画可能な形へ正規化する（壊れた/古い/手編集 JSON 対策）。 */
export const normalizeProjectFile = (file: ProjectFile): ProjectFile => {
  const settings = normalizeSettings(file.settings);
  const cuts = (Array.isArray(file.cuts) ? file.cuts : []).map((c) => normalizeCut(c, settings));
  return { version: 2, title: file.title ?? '', settings, cuts };
};

/**
 * 読み込んだ JSON テキストとパース済み PSD 群からプロジェクトを構築する。
 * - JSON が配列なら v1 と判定して移行する
 * - v2 は正規化（欠損・不正フィールドを既定で補完）してから返す＝壊れた JSON でも描画 throw しない
 */
export const buildProject = (
  jsonText: string,
  psds: LoadedPsd[],
  jsonFileName: string,
): { project: ProjectFile; cache: PsdCache; wasV1: boolean } => {
  const parsed: unknown = JSON.parse(jsonText);
  const cache: PsdCache = {};
  psds.forEach(({ name, psd }) => {
    // トリミングされた描画レイヤーをドキュメント全面へ正規化（クロップ表示の防止）
    cache[name] = normalizePsdLayers(psd);
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
  // 欠損・不正フィールドを既定で補完して必ず描画可能な ProjectFile を返す
  return { project: normalizeProjectFile(file), cache, wasV1: false };
};
