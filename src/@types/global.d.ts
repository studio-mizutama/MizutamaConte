import 'reactn';

declare module 'reactn/default' {
  export interface State {
    mode: string;
    tool: Set<string> | undefined;
  }
}

declare global {
  interface Window {
    api: Sandbox;
  }
}

export interface Sandbox {
  loadPlatform: () => Promise<void | string>;
  loadPSD: () => Promise<BufferLike[] | ArrayBuffer[]>;
}
