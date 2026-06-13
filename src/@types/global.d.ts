import 'reactn';
import { ProjectFile, PsdCache } from '../project/types';

declare module 'reactn/default' {
  export interface State {
    mode: string;
    tool: Set<string> | undefined;
    cut: Cut;
    project: ProjectFile;
    psdCache: PsdCache;
    globalFileName: string;
    isLoading: boolean;
    saveState: 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
    /** Preview で再生中のカット index（Dialogue パネルが参照） */
    currentCutIndex: number;
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

  createProject: (defaultName: string) => Promise<{ name: string } | null>;
  writeFile: (name: string, data: string | Uint8Array) => Promise<void>;
  fileExists: (name: string) => Promise<boolean>;

  openInPaint: (psdName: string) => Promise<{ ok: boolean; app?: string; error?: string }>;
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
}
