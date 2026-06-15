/** フォルダから読み込んだプロジェクト一式（PSD は未パースのバイナリ） */
export interface StorageOpenResult {
  /** Electron のみ: フォルダの絶対パス（外部編集の再読込に使用） */
  dirPath?: string;
  jsonFileName: string;
  jsonText: string;
  psds: { name: string; data: Uint8Array<ArrayBuffer> }[];
}

export interface StorageCapabilities {
  /** ファイル書き込み（保存・新規作成）が可能か */
  write: boolean;
  /** 外部アプリ起動が可能か（Electron のみ） */
  openExternal: boolean;
}

/**
 * プロジェクトフォルダへのアクセス抽象。
 * Electron は main プロセスの fs、Web は File System Access API で実装する。
 * 開いた（または作成した）フォルダを内部に保持し、以後の書き込み先とする。
 */
export interface ProjectStorage {
  readonly kind: 'electron' | 'web-fsa' | 'web-readonly';
  readonly capabilities: StorageCapabilities;
  /** フォルダ選択 → 読み込み。キャンセル時は null */
  openProject(): Promise<StorageOpenResult | null>;
  /** 新規プロジェクトフォルダ作成。実際に作成されたフォルダ名を返す。キャンセル時は null */
  createProject(defaultName: string): Promise<{ name: string } | null>;
  /** 現在のプロジェクトフォルダへ書き込む（atomic） */
  writeFile(name: string, data: string | Uint8Array): Promise<void>;
  /** 現在のプロジェクトフォルダからファイルを削除する（孤立 PSD の掃除）。存在しなければ無視 */
  deleteFile(name: string): Promise<void>;
  /** 現在のプロジェクトフォルダ内でファイル名を変更する（並べ替えの PSD リネーム）。
   *  Electron=fs.rename、Web FSA=copy+delete、web-readonly=no-op。いずれもフォルダ内に限定 */
  renameFile(from: string, to: string): Promise<void>;
  exists(name: string): Promise<boolean>;
  /** name を .trash/ へ rename 退避し、復元用トークン（trash 内ファイル名）を返す（undo 用） */
  trashFile(name: string): Promise<string>;
  /** trashFile が返したトークンの退避物を name へ戻す */
  restoreFile(token: string, name: string): Promise<void>;
  /** 指定ファイルの生バイトを読む（undo/redo 後のキャッシュ再構築用） */
  readFile(name: string): Promise<Uint8Array>;
  /** .trash/ を空にする（履歴破棄時） */
  purgeTrash(): Promise<void>;
}
