import React from 'react';
import { useGlobal } from 'reactn';
import { readPsd } from 'ag-psd';
import { buildProject, sortPsdNames, LoadedPsd } from 'project/load';
import { useProject } from 'hooks/useProject';
import { serializeProject, setLastPersisted, setPendingV1Backup, v1BackupName } from 'project/save';
import { getStorage, StorageOpenResult } from 'storage';
import { openFromHandle } from 'storage/web';
import { clearHistory } from 'history/undoManager';

const { api } = window;

/** 外部編集の再読込用に Electron のフォルダパスを保持する。
 *  Header と Conte(EmptyState) で別々に useOpenFolder() を呼ぶため、
 *  ドロップで開いたフォルダパスも両者で共有できるようモジュール単位の単一 ref にする。 */
const sharedDirPathRef: React.MutableRefObject<string | null> = { current: null };

/**
 * プロジェクトフォルダを開く一連の処理（Web/Electron 共通）を集約したフック。
 * Header の Open / メニュー / 再読込 / D&D ドロップゾーンなど、複数の起点から再利用する。
 * - applyProject: 構築済みプロジェクトをグローバル状態へ反映し、履歴をクリアする
 * - loadFromPayload: フォルダ読み込み一式（PSD未パース）をパースして反映する
 * - loadFile: Web の <input webkitdirectory> 用ハンドラ
 * - openFolderFromPath: Electron の絶対パスから開く（D&D 用）
 * - openFolderFromHandle: Web FSA のディレクトリハンドルから開く（D&D 用）
 * - dirPathRef: Electron のフォルダパス（外部編集の再読込で参照）
 */
export interface UseOpenFolder {
  applyProject: (jsonText: string, psds: LoadedPsd[], jsonFileName: string) => void;
  loadFromPayload: (payload: StorageOpenResult | null) => Promise<void>;
  loadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openFolderFromPath: (dirPath: string) => Promise<void>;
  openFolderFromHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  dirPathRef: React.MutableRefObject<string | null>;
}

export const useOpenFolder = (): UseOpenFolder => {
  const { setProject } = useProject();
  const setPsdCache = useGlobal('psdCache')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const setIsLoading = useGlobal('isLoading')[1];

  // スピナーを描画させてから重い PSD パースに入るための1フレーム譲歩
  const yieldToPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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
  };

  // Web: <input webkitdirectory> からの読み込み
  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filelist = e.target.files;
    if (!filelist) return;
    const files = Array.from(filelist);
    const psdFiles = files.filter((file) => file.name.toLowerCase().endsWith('.psd'));
    const jsonFile = files.find((file) => file.name.toLowerCase().endsWith('.json'));
    if (!jsonFile) return;
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

    (async () => {
      try {
        await setIsLoading(true);
        await yieldToPaint();
        const jsonText = await readAsText(jsonFile);
        const psds: LoadedPsd[] = [];
        for (const file of sortedPsdFiles) {
          psds.push({ name: file.name, psd: readPsd(await readAsArrayBuffer(file)) });
        }
        applyProject(jsonText, psds, jsonFile.name);
      } catch (err) {
        alert(err);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // 外部編集の再読込用に Electron のフォルダパスを保持する（インスタンス間で共有）
  const dirPathRef = sharedDirPathRef;

  // フォルダから読み込んだ一式（PSD未パース）をパースして反映する（Web FSA/Electron 共通）
  const loadFromPayload = async (payload: StorageOpenResult | null) => {
    if (!payload) return;
    if (payload.dirPath) dirPathRef.current = payload.dirPath;
    try {
      await setIsLoading(true);
      await yieldToPaint();
      const psds: LoadedPsd[] = payload.psds.map(({ name, data }) => ({ name, psd: readPsd(data) }));
      applyProject(payload.jsonText, psds, payload.jsonFileName);
    } catch (err) {
      alert(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Electron: D&D でドロップされたフォルダの絶対パスから開く（Open と同一経路＝履歴クリア込み）
  const openFolderFromPath = async (dirPath: string) => {
    if (!api) return;
    loadFromPayload(await api.readProject(dirPath));
  };

  // Web FSA: D&D でドロップされたディレクトリハンドルから開く（Open と同一経路）
  const openFolderFromHandle = async (handle: FileSystemDirectoryHandle) => {
    loadFromPayload(await openFromHandle(handle));
  };

  return { applyProject, loadFromPayload, loadFile, openFolderFromPath, openFolderFromHandle, dirPathRef };
};
