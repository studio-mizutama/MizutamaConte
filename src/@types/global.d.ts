import 'reactn';

declare module 'reactn/default' {
  export interface State {
    mode: string;
  }
}

declare global {
  interface Window {
    api: Sandbox;
  }
}

export interface Sandbox {
  loadPlatform: () => Promise<void | string>;
}
