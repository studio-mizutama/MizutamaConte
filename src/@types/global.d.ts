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
  loadJSON: () => Promise<Cut[]>;
  loadFileName: () => Promise<string>;
}
