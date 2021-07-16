import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('api', {
  loadPlatform: (): Promise<void | string> =>
    ipcRenderer
      .invoke('load-platform')
      .then((result) => result)
      .catch((err) => console.log(err)),
  loadKeyV: (): Promise<string> => ipcRenderer.invoke('load-key-v'),
});
