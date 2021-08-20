import 'reactn';

declare module 'reactn/default' {
  export interface State {
    mode: string;
    tool: Set<string> | undefined;
    cut: Cut;
    globalCuts: Cut[];
    globalPsds: Psd[];
    globalFileName: string;
  }
}

declare global {
  interface Window {
    api: Sandbox;
  }
  export interface Cut {
    picture?: Psd;
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
  loadPSD: () => Promise<BufferLike[] | ArrayBuffer[]>;
  removePSD: () => Electron.IpcRenderer;

  loadJSON: () => Promise<Cut[]>;
  removeJSON: () => Electron.IpcRenderer;

  loadFileName: () => Promise<string>;
  removeFileName: () => Electron.IpcRenderer;

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
