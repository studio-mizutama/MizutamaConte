import { ProjectStorage } from './types';

const { api } = window;

/** Electron 実装: 実体は main プロセス（IPC storage:* / project:*） */
export const electronStorage: ProjectStorage = {
  kind: 'electron',
  capabilities: { write: true, openExternal: true },

  async openProject() {
    const payload = await api.openProject();
    if (!payload) return null;
    return {
      dirPath: payload.dirPath,
      jsonFileName: payload.jsonFileName,
      jsonText: payload.jsonText,
      psds: payload.psds,
    };
  },

  async createProject(defaultName: string) {
    return api.createProject(defaultName);
  },

  async writeFile(name, data) {
    await api.writeFile(name, data);
  },

  async deleteFile(name) {
    await api.deleteFile(name);
  },

  async renameFile(from, to) {
    await api.renameFile(from, to);
  },

  async exists(name) {
    return api.fileExists(name);
  },
};
