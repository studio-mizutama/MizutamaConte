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

  async deleteFile(name) {
    if (!dirHandle) return;
    try {
      await dirHandle.removeEntry(name);
    } catch {
      // 存在しない/削除不可は無視（掃除はベストエフォート）
    }
  },

  // FSA にネイティブ rename は無いので copy+delete で実装する（フォルダ内限定）。
  // 書込/削除は既存の writeFile/deleteFile を再利用する（DRY）。
  async renameFile(from, to) {
    if (!dirHandle) throw new Error('プロジェクトフォルダが開かれていません');
    const srcHandle = await dirHandle.getFileHandle(from);
    const bytes = new Uint8Array(await (await srcHandle.getFile()).arrayBuffer());
    await this.writeFile(to, bytes);
    await this.deleteFile(from);
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

  trashFile: async (name: string): Promise<string> => {
    if (!dirHandle) throw new Error('No directory handle');
    const token = `${crypto.randomUUID()}.psd`;
    const trashDir = await dirHandle.getDirectoryHandle('.trash', { create: true });
    const srcHandle = await dirHandle.getFileHandle(name);
    const bytes = new Uint8Array(await (await srcHandle.getFile()).arrayBuffer());
    const destHandle = await trashDir.getFileHandle(token, { create: true });
    const writable = await destHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
    await dirHandle.removeEntry(name);
    return token;
  },
  restoreFile: async (token: string, name: string): Promise<void> => {
    if (!dirHandle) throw new Error('No directory handle');
    const trashDir = await dirHandle.getDirectoryHandle('.trash', { create: true });
    const srcHandle = await trashDir.getFileHandle(token);
    const bytes = new Uint8Array(await (await srcHandle.getFile()).arrayBuffer());
    const destHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await destHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
    await trashDir.removeEntry(token);
  },
  readFile: async (name: string): Promise<Uint8Array> => {
    if (!dirHandle) throw new Error('No directory handle');
    const handle = await dirHandle.getFileHandle(name);
    return new Uint8Array(await (await handle.getFile()).arrayBuffer());
  },
  purgeTrash: async (): Promise<void> => {
    if (!dirHandle) return;
    try {
      await dirHandle.removeEntry('.trash', { recursive: true });
    } catch {
      // .trash が無い等は無視
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
  async deleteFile() {
    // 読み取り専用環境では何もしない
  },
  async renameFile() {
    // 読み取り専用環境では何もしない
  },
  async exists() {
    return false;
  },
  trashFile: async () => {
    throw new Error('trashFile is not supported in read-only mode');
  },
  restoreFile: async () => {
    throw new Error('restoreFile is not supported in read-only mode');
  },
  readFile: async () => {
    throw new Error('readFile is not supported in read-only mode');
  },
  purgeTrash: async () => {
    // read-only: trash は作られないので no-op
  },
};
