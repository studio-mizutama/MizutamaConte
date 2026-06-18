import { Psd } from 'ag-psd';

export type AspectKey = '4:3' | '16:9' | '1.85:1' | '2.39:1';
export type ResolutionKey = 'SD' | 'HD' | 'FHD' | '2K' | '4K';

export interface FrameSize {
  width: number;
  height: number;
}

export interface ProjectSettings {
  aspect: AspectKey;
  resolution: ResolutionKey;
  /** aspect × resolution から導出した値のキャッシュ（JSONを自己記述的にするため明記） */
  frame: FrameSize;
  fps: number;
}

/** 1行 = PSD の1レイヤー（children[1..] に順序対応） */
export interface CutRow {
  id: string;
  /** PSD レイヤー名。読み込みは順序でマップし、名前は表示用 */
  layer: string;
  dialogue?: string;
  /** キャンバス実寸（px）。PSD と不一致の場合は PSD 実寸を正とする */
  canvas: FrameSize;
}

export interface ProjectCut {
  id: string;
  /** このカットで新シーンが始まる。先頭カットは未設定でも暗黙の Scene 1 */
  sceneStart?: { title?: string };
  /** プロジェクトフォルダ相対の PSD ファイル名 */
  psd?: string;
  /** カット尺（フレーム数） */
  time?: number;
  action?: Action;
  cameraWork?: CameraWork;
  rows: CutRow[];
}

/** 保存される JSON 全体（スキーマ v2） */
export interface ProjectFile {
  version: 2;
  title: string;
  settings: ProjectSettings;
  cuts: ProjectCut[];
}

/** パース済み PSD のキャッシュ（ファイル名 → Psd）。JSON へはシリアライズしない */
export type PsdCache = Record<string, Psd>;

/** v1 スキーマ（旧形式）: Cut の配列そのもの */
export interface CutV1 {
  cameraWork?: CameraWork;
  action?: Action;
  dialogue?: string;
  time?: number;
}

/** アプリ全体設定（settings.json）。プロジェクトではなくアプリ単位。
 *  NOTE: main 側の同型 `electron/settings.ts` の AppSettings と構造を一致させること（意図的な二重定義）。 */
export interface AppSettings {
  paintApp?: {
    mode?: 'auto' | 'custom';
    customPath?: string;
  };
  /** UI 言語。未設定時は 'ja'（日本語ファースト） */
  language?: 'ja' | 'ko' | 'en';
  /** テーマ。'system' は OS 設定に追従。未設定時は 'system' */
  theme?: 'light' | 'dark' | 'system';
  /** 最近開いたプロジェクト（新しい順・cap 10・id で dedupe） */
  recentProjects?: RecentProject[];
}

export interface RecentProject {
  /** 安定キー（Electron=絶対パス / Web=生成 id） */
  id: string;
  /** 表示名（フォルダ名） */
  name: string;
  /** Electron の絶対パス（Web は undefined） */
  path?: string;
  /** 最終オープン時刻（epoch ms） */
  timestamp: number;
}
