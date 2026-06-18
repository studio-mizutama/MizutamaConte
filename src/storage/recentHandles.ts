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
  try {
    return await new Promise<T>((resolve, reject) => {
      const store = db.transaction(STORE, mode).objectStore(STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    // close() は保留中トランザクションの完了を待ってから閉じる（書き込みは中断されない）＝接続リーク防止
    db.close();
  }
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
  // カーソルで全エントリ(key+handle)を「同期的に」収集する。
  // onsuccess を async にして isSameEntry を await すると、その間に readonly トランザクションが
  // autocommit され、再開後の cursor.continue() が "transaction has finished" で失敗しうる（仕様違反）。
  // → トランザクション内では収集のみ、isSameEntry の比較はトランザクション外で行う。
  let entries: Array<{ id: string; stored: FileSystemDirectoryHandle }>;
  try {
    entries = await new Promise((resolve) => {
      const out: Array<{ id: string; stored: FileSystemDirectoryHandle }> = [];
      const cursorReq = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
      cursorReq.onerror = () => resolve(out);
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return resolve(out);
        out.push({ id: String(cursor.key), stored: cursor.value as FileSystemDirectoryHandle });
        cursor.continue();
      };
    });
  } finally {
    db.close();
  }
  for (const e of entries) {
    try {
      if (await handle.isSameEntry(e.stored)) return e.id;
    } catch {
      // isSameEntry 不能時はスキップ
    }
  }
  return null;
};
