import { loadAppSettings, saveAppSettings } from 'settings/appSettings';
import { upsertRecent, removeRecent } from 'project/recents';
import type { RecentProject } from 'project/types';
import { putHandle, deleteHandle, findHandleId } from 'storage/recentHandles';

const basename = (p: string): string => p.split(/[\\/]/).filter(Boolean).pop() ?? p;

/** 現在の最近リストを取得する。 */
export const loadRecents = async (): Promise<RecentProject[]> =>
  (await loadAppSettings()).recentProjects ?? [];

/** プロジェクトを開いた事実を最近リストへ記録する。
 *  Electron: 絶対パスを id に。Web: 既存 handle と同一なら id 再利用、無ければ新規発番して IndexedDB へ。
 *  読み取り専用 Web（handle 無し）は記録しない。 */
export const recordRecent = async (args: {
  electronPath: string | null;
  webHandle: FileSystemDirectoryHandle | null;
}): Promise<RecentProject[]> => {
  const prev = await loadRecents();
  let entry: RecentProject;
  if (args.electronPath) {
    entry = { id: args.electronPath, name: basename(args.electronPath), path: args.electronPath, timestamp: Date.now() };
  } else if (args.webHandle) {
    const existing = await findHandleId(args.webHandle);
    const id = existing ?? (crypto.randomUUID ? crypto.randomUUID() : `${args.webHandle.name}-${Date.now()}`);
    if (!existing) await putHandle(id, args.webHandle);
    entry = { id, name: args.webHandle.name, timestamp: Date.now() };
  } else {
    return prev;
  }
  const next = upsertRecent(prev, entry);
  const droppedWeb = prev.filter((r) => !r.path && !next.some((n) => n.id === r.id));
  for (const d of droppedWeb) await deleteHandle(d.id).catch(() => undefined);
  await saveAppSettings({ recentProjects: next });
  return next;
};

/** 失効エントリ等を除去する（Web は handle も削除）。 */
export const removeRecentEntry = async (id: string): Promise<RecentProject[]> => {
  const prev = await loadRecents();
  const target = prev.find((r) => r.id === id);
  const next = removeRecent(prev, id);
  if (target && !target.path) await deleteHandle(id).catch(() => undefined);
  await saveAppSettings({ recentProjects: next });
  return next;
};
