import { ProjectFile } from './types';

export const serializeProject = (project: ProjectFile): string => JSON.stringify(project, null, 2);

// ---- 保存状態のセッション内管理 ----

/** 最後にディスクへ書いた（または読み込んだ）内容。これと一致する間は保存不要 */
let lastPersisted = '';

export const setLastPersisted = (text: string): void => {
  lastPersisted = text;
};
export const getLastPersisted = (): string => lastPersisted;

/** v1 プロジェクトを開いた場合、初回保存時に元 JSON を退避する */
interface PendingBackup {
  name: string;
  text: string;
}
let pendingBackup: PendingBackup | null = null;

export const setPendingV1Backup = (backup: PendingBackup | null): void => {
  pendingBackup = backup;
};
export const takePendingV1Backup = (): PendingBackup | null => {
  const backup = pendingBackup;
  pendingBackup = null;
  return backup;
};

/** "WithYou.json" → "WithYou.v1.bak"（.json を避け、再読込で誤検出されない拡張子にする） */
export const v1BackupName = (jsonFileName: string): string => jsonFileName.replace(/\.json$/i, '') + '.v1.bak';
