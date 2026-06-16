/** Web の「最近開いたプロジェクト」用 IndexedDB ハンドルストア。
 *  FileSystemDirectoryHandle を id キーで保存し、再オープン時に取り出して権限を再取得する。 */
const DB_NAME = 'mizutama';
const STORE = 'recentHandles';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
};

export const putHandle = (id: string, handle: FileSystemDirectoryHandle): Promise<void> =>
  tx<void>('readwrite', (s) => s.put(handle, id));

export const getHandle = (id: string): Promise<FileSystemDirectoryHandle | undefined> =>
  tx<FileSystemDirectoryHandle | undefined>('readonly', (s) => s.get(id));

export const deleteHandle = (id: string): Promise<void> =>
  tx<void>('readwrite', (s) => s.delete(id));

/** 既存ストア内の同一フォルダ handle を探し、その id を返す（dedupe 用）。無ければ null。 */
export const findHandleId = async (handle: FileSystemDirectoryHandle): Promise<string | null> => {
  const db = await openDb();
  return new Promise<string | null>((resolve) => {
    const store = db.transaction(STORE, 'readonly').objectStore(STORE);
    const cursorReq = store.openCursor();
    cursorReq.onerror = () => resolve(null);
    cursorReq.onsuccess = async () => {
      const cursor = cursorReq.result;
      if (!cursor) return resolve(null);
      try {
        const stored = cursor.value as FileSystemDirectoryHandle;
        if (await handle.isSameEntry(stored)) return resolve(String(cursor.key));
      } catch {
        // isSameEntry 不能時はスキップ
      }
      cursor.continue();
    };
  });
};
