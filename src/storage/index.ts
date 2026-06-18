import { ProjectStorage } from './types';
import { electronStorage } from './electron';
import { isFsaSupported, webFsaStorage, webReadonlyStorage } from './web';

export type { ProjectStorage, StorageOpenResult, StorageCapabilities } from './types';

/** 実行環境に応じたストレージ実装を返す */
export const getStorage = (): ProjectStorage => {
  if (window.api) return electronStorage;
  if (isFsaSupported()) return webFsaStorage;
  return webReadonlyStorage;
};
