import 'reactn';
import { ProjectFile, PsdCache, AppSettings } from '../project/types';
import { Locale, ColorScheme } from '../i18n/types';
import { EditorMode } from '../hooks/editorMode';
import { GitDetect, GitLogEntry } from '../git/types';

declare module 'reactn/default' {
  export interface State {
    mode: string;
    /** 編集モード（相互排他）。既定 'edit'＝テキスト常時編集可・クリックで CUT 選択 */
    editorMode: EditorMode | undefined;
    cut: Cut;
    project: ProjectFile;
    psdCache: PsdCache;
    globalFileName: string;
    isLoading: boolean;
    saveState: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
    /** Preview で再生中のカット index（Dialogue パネルが参照） */
    currentCutIndex: number;
    /** Edit で選択中のカット index（Transition/CameraWork パネルが参照・編集） */
    selectedCutIndex: number;
    /** 新規プロジェクトダイアログの開閉（メニュー/ハンバーガーから開く） */
    newProjectOpen: boolean;
    /** 設定ダイアログの開閉（Header の歯車から開く） */
    settingsOpen: boolean;
    /** UI 言語（i18n）。設定ダイアログで切替・settings.json に永続化 */
    locale: Locale;
    /** テーマ。'system' は OS 設定に追従（react-spectrum Provider colorScheme を駆動） */
    colorScheme: ColorScheme;
    /** 起動時 1 回検出した git/git-lfs 導入状況。Web（api 不在）では undefined のまま */
    gitDetect: GitDetect | undefined;
    /** 印刷要求フラグ。usePrint で立て、PrintHost が計測→ページ割り→window.print() を駆動 */
    printRequested: boolean;
  }
}

declare global {
  interface Window {
    api: Sandbox;
    // File System Access API (Chromium 系のみ)
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
  }
  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  }
  // Electron main から受け取るプロジェクト一式
  export interface ProjectPayload {
    dirPath: string;
    jsonFileName: string;
    jsonText: string;
    psds: { name: string; data: Uint8Array<ArrayBuffer> }[];
  }
  export interface Cut {
    picture?: Psd;
    /** プロジェクトフォルダ相対の PSD ファイル名（外部アプリ起動に使用） */
    psdName?: string;
    cameraWork?: CameraWork;
    action?: Action;
    dialogue?: string;
    time?: number;
  }

  export interface Action {
    fadeIn?: 'None' | 'White In' | 'Black In' | 'Cross';
    fadeInDuration?: number;
    fadeOut?: 'None' | 'White Out' | 'Black Out' | 'Cross';
    fadeOutDuration?: number;
    text?: string;
  }

  export interface CameraWork {
    position?: { in: { x: number; y: number }; out: { x: number; y: number } };
    scale?: { in: number; out: number };
  }
}

export interface Sandbox {
  loadPlatform: () => Promise<void | string>;

  openProject: () => Promise<ProjectPayload | null>;
  readProject: (dirPath: string) => Promise<ProjectPayload | null>;
  onOpenProjectRequest: (listener: () => void) => void;
  removeOpenProjectRequest: () => void;
  onNewProjectRequest: (listener: () => void) => void;
  removeNewProjectRequest: () => void;
  onOpenSettingsRequest: (listener: () => void) => void;
  removeOpenSettingsRequest: () => void;
  onPrintRequest: (listener: () => void) => void;
  removePrintRequest: () => void;

  createProject: (defaultName: string) => Promise<{ name: string } | null>;
  writeFile: (name: string, data: string | Uint8Array) => Promise<void>;
  deleteFile: (name: string) => Promise<void>;
  renameFile: (from: string, to: string) => Promise<void>;
  fileExists: (name: string) => Promise<boolean>;

  openInPaint: (psdName: string) => Promise<{ ok: boolean; app?: string; error?: string }>;
  loadSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  applyAppSettings: (language: 'ja' | 'ko' | 'en', theme: 'light' | 'dark' | 'system') => Promise<void>;
  detectPaintApp: () => Promise<{ kind: 'mac-app' | 'exe'; path: string } | null>;
  selectPaintAppPath: () => Promise<string | null>;
  onProjectFilesChanged: (listener: () => void) => void;
  removeProjectFilesChanged: () => void;

  contextMenu: () => void;

  close: () => Promise<void>;
  restore: () => Promise<void>;
  maximize: () => Promise<void>;
  minimize: () => Promise<void>;

  resized: (listener: () => Promise<void>) => Electron.IpcRenderer;
  removeResized: () => Electron.IpcRenderer;

  maximized: (listener: () => Promise<void>) => Electron.IpcRenderer;
  removeMaximized: () => Electron.IpcRenderer;

  unMaximized: (listener: () => Promise<void>) => Electron.IpcRenderer;
  removeUnMaximized: () => Electron.IpcRenderer;

  getFocus: (listener: () => Promise<void>) => Electron.IpcRenderer;
  removeGetFocus: () => Electron.IpcRenderer;

  getBlur: (listener: () => Promise<void>) => Electron.IpcRenderer;
  removeGetBlur: () => Electron.IpcRenderer;

  git?: {
    detect(): Promise<GitDetect>;
    isRepo(): Promise<boolean>;
    init(): Promise<void>;
    status(): Promise<{ dirty: boolean }>;
    commit(message: string): Promise<void>;
    logLatest(): Promise<GitLogEntry | null>;
  };
}
