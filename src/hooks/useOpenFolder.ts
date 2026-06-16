import React from 'react';
import { useGlobal } from 'reactn';
import { readPsd } from 'ag-psd';
import { buildProject, sortPsdNames, isValidProjectJson, LoadedPsd } from 'project/load';
import { useProject } from 'hooks/useProject';
import { serializeProject, setLastPersisted, setPendingV1Backup, v1BackupName } from 'project/save';
import { getStorage, StorageOpenResult } from 'storage';
import { openFromHandle, getCurrentDirHandle } from 'storage/web';
import { clearHistory } from 'history/undoManager';
import { translate } from 'i18n';
import { recordRecent, removeRecentEntry } from 'storage/recentStore';
import { getHandle } from 'storage/recentHandles';

const { api } = window;

/** 外部編集の再読込用に Electron のフォルダパスを保持する。
 *  Header と Conte(EmptyState) で別々に useOpenFolder() を呼ぶため、
 *  ドロップで開いたフォルダパスも両者で共有できるようモジュール単位の単一 ref にする。 */
const sharedDirPathRef: React.MutableRefObject<string | null> = { current: null };

/** Electron 新規作成後など、レンダラ側からフォルダパスを直接セットする（再読込を有効化する）。
 *  Web は getCurrentDirHandle() がハンドルを保持するため不要。 */
export const setSharedDirPath = (dirPath: string | null): void => {
  sharedDirPathRef.current = dirPath;
};

/**
 * プロジェクトフォルダを開く一連の処理（Web/Electron 共通）を集約したフック。
 * Header の Open / メニュー / 再読込 / D&D ドロップゾーンなど、複数の起点から再利用する。
 * - applyProject: 構築済みプロジェクトをグローバル状態へ反映し、履歴をクリアする
 * - loadFromPayload: フォルダ読み込み一式（PSD未パース）を検証・パースして反映する
 * - loadFile: Web の <input webkitdirectory> 用ハンドラ
 * - openFolderFromPath: Electron の絶対パスから開く（D&D 用）
 * - openFolderFromHandle: Web FSA のディレクトリハンドルから開く（D&D 用）
 * - openFromPicker: ストレージの picker（File→Open）から開く
 * - reloadFromDirPath: Electron の保持パスを再読込する（外部編集/再読込メニュー用）
 * - reloadCurrentProject: 現在のプロジェクトを再読込する（Web=保持ハンドル / Electron=保持パス。再読込ショートカット/メニュー用）
 * - dirPathRef: Electron のフォルダパス（外部編集の再読込で参照）
 *
 * すべての開く経路は runOpen() に集約し、不正プロジェクト（読込/パース失敗・形不一致）を
 * try/catch + 形検証でガードして loadError を立てる。現状のプロジェクトは差し替えない。
 */
export interface UseOpenFolder {
  applyProject: (jsonText: string, psds: LoadedPsd[], jsonFileName: string) => void;
  loadFromPayload: (payload: StorageOpenResult | null) => Promise<void>;
  loadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openFolderFromPath: (dirPath: string) => Promise<void>;
  openFolderFromHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  openFromPicker: (read: Promise<StorageOpenResult | null>) => Promise<void>;
  reloadFromDirPath: (dirPath: string) => Promise<void>;
  reloadCurrentProject: () => Promise<void>;
  openRecent: (entry: { id: string; path?: string }) => Promise<void>;
  dirPathRef: React.MutableRefObject<string | null>;
}

export const useOpenFolder = (): UseOpenFolder => {
  const { setProject } = useProject();
  const setPsdCache = useGlobal('psdCache')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const setIsLoading = useGlobal('isLoading')[1];
  const setLoadError = useGlobal('loadError')[1];
  const locale = useGlobal('locale')[0];

  // スピナーを描画させてから重い PSD パースに入るための1フレーム譲歩
  const yieldToPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  // 不正プロジェクト時のユーザー向けエラー本文を立てる（Header の AlertDialog が表示する）
  const raiseLoadError = () => setLoadError(translate(locale, 'error.openBody'));

  // 構築済みプロジェクトをグローバル状態へ反映する（Web/Electron 共通）
  const applyProject = (jsonText: string, psds: LoadedPsd[], jsonFileName: string) => {
    const { project: loaded, cache, wasV1 } = buildProject(jsonText, psds, jsonFileName);
    // 読み込み直後は「保存済み」扱い。v1 は初回保存時に元 JSON を退避する
    setLastPersisted(serializeProject(loaded));
    setPendingV1Backup(wasV1 ? { name: v1BackupName(jsonFileName), text: jsonText } : null);
    // fileName は最後に設定する（autoSave が古い project と新 fileName の組で誤発火しないように）
    setProject(loaded);
    setPsdCache(cache);
    setFileName(jsonFileName);
    // プロジェクト差し替え（Open/外部リロード）で履歴は無効化する
    clearHistory();
    getStorage().purgeTrash().catch(() => undefined);
    // 最近開いたプロジェクトへ記録（Electron=パス / Web=保持ハンドル。失敗は握りつぶす）
    void recordRecent({
      electronPath: api ? sharedDirPathRef.current : null,
      webHandle: api ? null : getCurrentDirHandle(),
    })
      .then((list) => {
        if (api) api.refreshRecent?.(list); // Electron ネイティブメニュー再構築（実体は別タスクで配線）
      })
      .catch(() => undefined);
  };

  // 全ての開く経路の中核。read 関数で生ペイロードを得て、検証→パース→反映する。
  // - read が null を返した場合はキャンセル/対象なし扱いで no-op（エラーにしない）
  // - read が throw（ENOTDIR/権限/IPC reject 等）、または JSON が不正な形なら loadError を立て、
  //   現状のプロジェクトは差し替えない（applyProject を呼ばない）
  const runOpen = async (read: () => Promise<StorageOpenResult | null>) => {
    try {
      await setIsLoading(true);
      await yieldToPaint();
      const payload = await read();
      if (!payload) return; // キャンセル/対象なし（picker キャンセルや読込前の no-op）
      if (sharedDirPathRef && payload.dirPath) sharedDirPathRef.current = payload.dirPath;
      // applyProject を呼ぶ前に JSON の形を検証する（不正なら現状維持でエラー表示）
      if (!isValidProjectJson(payload.jsonText)) {
        raiseLoadError();
        return;
      }
      const psds: LoadedPsd[] = payload.psds.map(({ name, data }) => ({ name, psd: readPsd(data) }));
      applyProject(payload.jsonText, psds, payload.jsonFileName);
    } catch {
      // 読込/パース失敗（不正フォルダ・破損 PSD・権限拒否など）。現状のプロジェクトは維持する
      raiseLoadError();
    } finally {
      setIsLoading(false);
    }
  };

  // Web: <input webkitdirectory> からの読み込み（runOpen と同じ検証/エラー経路に揃える）
  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filelist = e.target.files;
    if (!filelist) return;
    const files = Array.from(filelist);
    const psdFiles = files.filter((file) => file.name.toLowerCase().endsWith('.psd'));
    const jsonFile = files.find((file) => file.name.toLowerCase().endsWith('.json'));
    const sortedNames = sortPsdNames(psdFiles.map((file) => file.name));
    const sortedPsdFiles = sortedNames.map((name) => psdFiles.find((file) => file.name === name)!);

    const readAsArrayBuffer = (file: File) =>
      new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      });
    const readAsText = (file: File) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(file, 'utf8');
      });

    void runOpen(async () => {
      // JSON が無いフォルダは不正プロジェクト扱い（runOpen が検証段でエラー化）
      if (!jsonFile) throw new Error('No project JSON in selected folder');
      const jsonText = await readAsText(jsonFile);
      const psds: StorageOpenResult['psds'] = [];
      for (const file of sortedPsdFiles) {
        psds.push({ name: file.name, data: new Uint8Array(await readAsArrayBuffer(file)) as Uint8Array<ArrayBuffer> });
      }
      return { jsonFileName: jsonFile.name, jsonText, psds };
    });
  };

  // 外部編集の再読込用に Electron のフォルダパスを保持する（インスタンス間で共有）
  const dirPathRef = sharedDirPathRef;

  // フォルダから読み込んだ一式（PSD未パース）を検証・パースして反映する（Web FSA/Electron 共通）。
  // 既に読み込み済みのペイロードを渡す経路（picker の戻り等）向け。
  const loadFromPayload = async (payload: StorageOpenResult | null) => {
    await runOpen(async () => payload);
  };

  // Electron: D&D でドロップされたフォルダの絶対パスから開く（Open と同一経路＝履歴クリア込み）
  const openFolderFromPath = async (dirPath: string) => {
    if (!api) return;
    await runOpen(() => api.readProject(dirPath));
  };

  // Web FSA: D&D でドロップされたディレクトリハンドルから開く（Open と同一経路）
  const openFolderFromHandle = async (handle: FileSystemDirectoryHandle) => {
    await runOpen(() => openFromHandle(handle));
  };

  // picker（File→Open）の読み込み Promise を渡して開く。
  // picker キャンセルは read が null を返すので runOpen が no-op（エラーにしない）。
  const openFromPicker = async (read: Promise<StorageOpenResult | null>) => {
    await runOpen(() => read);
  };

  // Electron: 保持しているフォルダパスをディスクから再読込する（外部編集の自動再読込/再読込メニュー）。
  // フォルダが開いた後に削除/不正化していれば read が throw/null → runOpen がエラー化する。
  const reloadFromDirPath = async (dirPath: string) => {
    if (!api) return;
    await runOpen(() => api.readProject(dirPath));
  };

  // 現在開いているプロジェクトをディスクから再読込する（Web/Electron 共通・再読み込みショートカット/メニュー用）。
  // - Electron(api あり): 保持パス sharedDirPathRef.current を reloadFromDirPath で再読込（メニューと同一ヘルパ）。
  // - Web(api なし): 保持中の FSA ハンドルを openFolderFromHandle で再列挙して再読込。
  // いずれも Open と同じ runOpen 経路を通すので、検証・エラー化・履歴クリアが効く。
  // 保持パス/ハンドルが無ければ no-op（生ページ reload を避ける）。
  const reloadCurrentProject = async () => {
    if (api) {
      // Electron: 保持パスが無ければ no-op
      if (sharedDirPathRef.current) await reloadFromDirPath(sharedDirPathRef.current);
      return;
    }
    // Web FSA: 許可済みハンドルの再列挙は再プロンプトを出さない
    const handle = getCurrentDirHandle();
    if (!handle) return;
    await openFolderFromHandle(handle);
  };

  // 最近リストからの再オープン。Electron=パスで読込（消失時はエラー＋除去）。
  // Web=保持ハンドルを取り出し、クリックのユーザージェスチャ内で権限を再取得してから読込。
  const openRecent = async (entry: { id: string; path?: string }) => {
    if (api) {
      if (!entry.path) return;
      try {
        await runOpen(() => api.readProject(entry.path!));
      } catch {
        void removeRecentEntry(entry.id);
      }
      return;
    }
    // Web FSA
    const handle = await getHandle(entry.id);
    if (!handle) {
      void removeRecentEntry(entry.id); // handle 消失 → 除去
      return;
    }
    try {
      const queryable = handle as FileSystemDirectoryHandle & {
        queryPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>;
        requestPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState>;
      };
      // クリックのジェスチャ内で同期的に権限要求する
      let perm: PermissionState = 'prompt';
      if (queryable.queryPermission) perm = await queryable.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted' && queryable.requestPermission) {
        perm = await queryable.requestPermission({ mode: 'readwrite' });
      }
      if (perm !== 'granted') return; // 拒否はリスト保持のまま
      await openFolderFromHandle(handle);
    } catch {
      raiseLoadError();
    }
  };

  return {
    applyProject,
    loadFromPayload,
    loadFile,
    openFolderFromPath,
    openFolderFromHandle,
    openFromPicker,
    reloadFromDirPath,
    reloadCurrentProject,
    openRecent,
    dirPathRef,
  };
};
