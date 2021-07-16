declare global {
  interface Window {
    api: Sandbox;
  }
}

export interface Sandbox {
  loadPlatform: () => Promise<void | string>;
}
