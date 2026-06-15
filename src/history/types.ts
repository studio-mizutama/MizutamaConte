import { ProjectFile, PsdCache } from 'project/types';
import { ProjectStorage } from 'storage/types';

/** ディスク副作用の巻き戻し/やり直しが実行時に使うコンテキスト（live state を読む） */
export interface EffectContext {
  storage: ProjectStorage;
  getPsdCache: () => PsdCache;
  setPsdCache: (cache: PsdCache) => unknown;
}

/** ディスク副作用（PSD ファイルの削除/生成/リネーム + psdCache 同期）。純粋にテスト可能 */
export type DiskEffect = (ctx: EffectContext) => Promise<void>;

/** 1 ユーザー操作 = 1 トランザクション。project スナップショットを核に持つ */
export interface Transaction {
  label: string;
  /** 同一キーの連続記録は直前トランザクションへ合流する（テキスト連打の 1 ステップ化）。undefined は合流しない */
  coalesceKey?: string;
  prevProject: ProjectFile;
  nextProject: ProjectFile;
  prevSelectedCutIndex: number;
  nextSelectedCutIndex: number;
  /** undo 時のディスク副作用（無ければ project スナップショット復元のみで足りる） */
  diskRevert?: DiskEffect;
  /** redo 時のディスク副作用 */
  diskReapply?: DiskEffect;
}
