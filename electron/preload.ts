import { contextBridge, ipcRenderer } from 'electron';
import { Cut } from './@types/cut';

interface BufferLike {
  buffer: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
}

contextBridge.exposeInMainWorld('api', {
  loadPlatform: (): Promise<void | string> =>
    ipcRenderer
      .invoke('load-platform')
      .then((result) => result)
      .catch((err) => console.log(err)),
  loadPSD: (): Promise<BufferLike[] | ArrayBuffer[]> =>
    ipcRenderer
      .invoke('load-psd')
      .then((result) => result)
      .catch((err) => console.log(err)),
  removePSD: () => ipcRenderer.removeAllListeners('load-psd'),

  loadJSON: (): Promise<Cut[]> =>
    ipcRenderer
      .invoke('load-json')
      .then((result) => result)
      .catch((err) => console.log(err)),
  removeJSON: () => ipcRenderer.removeAllListeners('load-json'),

  loadFileName: (): Promise<string> =>
    ipcRenderer
      .invoke('load-file-name')
      .then((result) => result)
      .catch((err) => console.log(err)),
  removeFileName: () => ipcRenderer.removeAllListeners('load-file-name'),

  contextMenu: () => ipcRenderer.send('show-context-menu'),

  close: async () => ipcRenderer.invoke('close'),
  minimize: async () => ipcRenderer.invoke('minimize'),
  maximize: async () => ipcRenderer.invoke('maximize'),
  restore: async () => ipcRenderer.invoke('restore'),

  resized: (listener: () => Promise<void>) => ipcRenderer.on('resized', listener),
  removeResized: () => ipcRenderer.removeAllListeners('resized'),

  maximized: (listener: () => Promise<void>) => ipcRenderer.on('maximized', listener),
  removeMaximized: () => ipcRenderer.removeAllListeners('maximized'),

  unMaximized: (listener: () => Promise<void>) => ipcRenderer.on('unMaximized', listener),
  removeUnMaximized: () => ipcRenderer.removeAllListeners('unMaximized'),

  getFocus: (listener: () => Promise<void>) => ipcRenderer.on('get-focus', listener),
  removeGetFocus: () => ipcRenderer.removeAllListeners('get-focus'),

  getBlur: (listener: () => Promise<void>) => ipcRenderer.on('get-blur', listener),
  removeGetBlur: () => ipcRenderer.removeAllListeners('get-blur'),
});
