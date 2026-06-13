import { sortPsdNames } from 'project/load';
import { ProjectStorage, StorageOpenResult } from './types';

/** 開いている（または作成した）プロジェクトフォルダのハンドル */
let dirHandle: FileSystemDirectoryHandle | null = null;

export const isFsaSupported = (): boolean => typeof window.showDirectoryPicker === 'function';

/** Web 実装: File System Access API（Chromium 系のみ） */
export const webFsaStorage: ProjectStorage = {
  kind: 'web-fsa',
  capabilities: { write: true, openExternal: false },

  async openProject(): Promise<StorageOpenResult | null> {
    if (!window.showDirectoryPicker) return null;
    let handle: FileSystemDirectoryHandle;
    try {
      handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch {
      return null; // ユーザーキャンセル
    }
    const files = new Map<string, FileSystemFileHandle>();
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') files.set(entry.name, entry as FileSystemFileHandle);
    }
    const jsonFileName = [...files.keys()].find((name) => name.toLowerCase().endsWith('.json'));
    if (!jsonFileName) return null;
    const jsonText = await (await files.get(jsonFileName)!.getFile()).text();
    const psdNames = sortPsdNames([...files.keys()].filter((name) => name.toLowerCase().endsWith('.psd')));
    const psds: StorageOpenResult['psds'] = [];
    for (const name of psdNames) {
      const file = await files.get(name)!.getFile();
      psds.push({ name, data: new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer> });
    }
    dirHandle = handle;
    return { jsonFileName, jsonText, psds };
  },

  async createProject(defaultName: string) {
    if (!window.showDirectoryPicker) return null;
    let parent: FileSystemDirectoryHandle;
    try {
      parent = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch {
      return null;
    }
    dirHandle = await parent.getDirectoryHandle(defaultName, { create: true });
    return { name: defaultName };
  },

  async writeFile(name, data) {
    if (!dirHandle) throw new Error('プロジェクトフォルダが開かれていません');
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data as FileSystemWriteChunkType);
    await writable.close();
  },

  async exists(name) {
    if (!dirHandle) return false;
    try {
      await dirHandle.getFileHandle(name);
      return true;
    } catch {
      return false;
    }
  },
};

/** 非 Chromium フォールバック: webkitdirectory input による読み取り専用 */
export const webReadonlyStorage: ProjectStorage = {
  kind: 'web-readonly',
  capabilities: { write: false, openExternal: false },
  async openProject() {
    return null; // Header 側で <input webkitdirectory> にフォールバックする
  },
  async createProject() {
    return null;
  },
  async writeFile() {
    throw new Error('このブラウザでは保存できません');
  },
  async exists() {
    return false;
  },
};
