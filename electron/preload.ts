import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings } from './settings';

contextBridge.exposeInMainWorld('api', {
  loadPlatform: (): Promise<void | string> =>
    ipcRenderer
      .invoke('load-platform')
      .then((result) => result)
      .catch((err) => console.log(err)),

  // フォルダ選択ダイアログ → プロジェクト読み込み
  openProject: () => ipcRenderer.invoke('project:open'),
  // ダイアログなしで指定パスを読み込み（開発・回帰テスト用）
  readProject: (dirPath: string) => ipcRenderer.invoke('project:read', dirPath),
  // メニューの File > Open からの読み込み要求
  onOpenProjectRequest: (listener: () => void) => ipcRenderer.on('menu:open-project', listener),
  removeOpenProjectRequest: () => ipcRenderer.removeAllListeners('menu:open-project'),
  // メニューの File > New からの新規作成要求
  onNewProjectRequest: (listener: () => void) => ipcRenderer.on('menu:new-project', listener),
  removeNewProjectRequest: () => ipcRenderer.removeAllListeners('menu:new-project'),

  // メニューの Preferences からの設定ダイアログ表示要求
  onOpenSettingsRequest: (listener: () => void) => ipcRenderer.on('menu:open-settings', listener),
  removeOpenSettingsRequest: () => ipcRenderer.removeAllListeners('menu:open-settings'),

  // 新規プロジェクトフォルダ作成・保存
  createProject: (defaultName: string) => ipcRenderer.invoke('project:create', defaultName),
  writeFile: (name: string, data: string | Uint8Array) => ipcRenderer.invoke('storage:write-file', name, data),
  deleteFile: (name: string) => ipcRenderer.invoke('storage:delete-file', name),
  fileExists: (name: string) => ipcRenderer.invoke('storage:exists', name),

  // 外部ペイントアプリで PSD を開く / 外部編集の検知
  openInPaint: (psdName: string) => ipcRenderer.invoke('paint:open', psdName),
  // アプリ全体設定（settings.json）の読み書き / ペイントアプリ検出・選択
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings),
  detectPaintApp: () => ipcRenderer.invoke('settings:detect-paint'),
  selectPaintAppPath: () => ipcRenderer.invoke('dialog:select-file'),
  // 言語・テーマ変更を main に反映（ネイティブテーマ + メニュー再構築）
  applyAppSettings: (language: 'ja' | 'ko' | 'en', theme: 'light' | 'dark' | 'system') =>
    ipcRenderer.invoke('app:apply-settings', language, theme),
  onProjectFilesChanged: (listener: () => void) => ipcRenderer.on('project:files-changed', listener),
  removeProjectFilesChanged: () => ipcRenderer.removeAllListeners('project:files-changed'),

  contextMenu: () => ipcRenderer.send('show-context-menu'),

  close: async () => ipcRenderer.invoke('close'),
  minimize: async () => ipcRenderer.invoke('minimize'),
  maximize: async () => ipcRenderer.invoke('maximize'),
  restore: async () => ipcRenderer.invoke('restore'),

  resized: (listener: () => Promise<void>) => ipcRenderer.on('resized', listener),
  removeResized: () => ipcRenderer.removeAllListeners('resized'),

  maximized: (listener: () => Promise<void>) => ipcRenderer.on('maximized', listener),
  removeMaximized: () => ipcRenderer.removeAllListeners('maximized'),

  unMaximized: (listener: () => Promise<void>) => ipcRenderer.on('unMaximized', listener),
  removeUnMaximized: () => ipcRenderer.removeAllListeners('unMaximized'),

  getFocus: (listener: () => Promise<void>) => ipcRenderer.on('get-focus', listener),
  removeGetFocus: () => ipcRenderer.removeAllListeners('get-focus'),

  getBlur: (listener: () => Promise<void>) => ipcRenderer.on('get-blur', listener),
  removeGetBlur: () => ipcRenderer.removeAllListeners('get-blur'),
});
