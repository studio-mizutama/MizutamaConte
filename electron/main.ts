import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createMenu } from './menu';
import { openInPaintApp, findPaintApp } from './paint';
import { loadSettings, saveSettings, AppSettings } from './settings';
import { mt, resolveLocale, MenuLocale } from './i18n';
import { detect, isRepo, initRepo, status, commit, logLatest } from './git';

interface Bounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

interface ProjectPayload {
  dirPath: string;
  jsonFileName: string;
  jsonText: string;
  psds: { name: string; data: Buffer }[];
}

const infoPath = path.join(app.getPath('userData'), 'bounds-info.json');

const tryBoundsInfo = (width: number, height: number): Bounds => {
  try {
    return JSON.parse(fs.readFileSync(infoPath, 'utf8')) as unknown as Bounds;
  } catch (e) {
    return { width, height };
  }
};

const frame = process.platform === 'darwin';
const fullscreenable = process.platform === 'darwin';
const autoHideMenuBar = process.platform !== 'darwin';

let mainWindow: BrowserWindow | null = null;

/** 現在開いているプロジェクトフォルダ。storage:* 系の書き込み先 */
let currentProjectDir: string | null = null;

/** アプリ自身が書いたファイル（watch の自己反応を防ぐ） */
const recentOwnWrites = new Map<string, number>();
let watcher: fs.FSWatcher | null = null;

/** プロジェクトフォルダの PSD 変更を監視し、外部アプリでの編集をレンダラへ通知する */
const watchProjectDir = (dirPath: string) => {
  watcher?.close();
  let timer: NodeJS.Timeout | null = null;
  watcher = fs.watch(dirPath, (_event, fileName) => {
    if (!fileName || !fileName.toLowerCase().endsWith('.psd')) return;
    const wroteAt = recentOwnWrites.get(fileName);
    if (wroteAt && Date.now() - wroteAt < 3000) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => mainWindow?.webContents.send('project:files-changed'), 500);
  });
};

// プロジェクトフォルダ（PSD群 + JSON 1つ）を読み込む
const readProjectDir = (dirPath: string): ProjectPayload | null => {
  const files = fs.readdirSync(dirPath);
  const jsonFileName = files.find((file) => file.toLowerCase().endsWith('.json'));
  if (!jsonFileName) return null;
  const psdNames = files
    .filter((file) => file.toLowerCase().endsWith('.psd'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  currentProjectDir = dirPath;
  watchProjectDir(dirPath);
  // プロジェクトが開いたので File→Print を有効化（メニュー再構築）
  if (mainWindow) createMenu(mainWindow, resolveLocale(), true);
  return {
    dirPath,
    jsonFileName,
    jsonText: fs.readFileSync(path.join(dirPath, jsonFileName), 'utf8'),
    psds: psdNames.map((name) => ({ name, data: fs.readFileSync(path.join(dirPath, name)) })),
  };
};

// IPC ハンドラは起動時に一度だけ登録する
const registerIpcHandlers = () => {
  ipcMain.handle('load-platform', () => process.platform);

  ipcMain.handle('minimize', () => mainWindow?.minimize());
  ipcMain.handle('maximize', () => mainWindow?.maximize());
  ipcMain.handle('restore', () => mainWindow?.unmaximize());
  ipcMain.handle('close', () => mainWindow?.close());

  ipcMain.handle('project:open', async (): Promise<ProjectPayload | null> => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;
    return readProjectDir(result.filePaths[0]);
  });

  ipcMain.handle('project:read', (_event, dirPath: string) => readProjectDir(dirPath));

  ipcMain.handle('project:create', async (_event, name: string) => {
    if (!mainWindow) return null;
    // 名前はアプリ内ダイアログで決定済み。ネイティブでは保存先フォルダのみ選ぶ（名前の二重入力を避ける）
    const locale = resolveLocale();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: mt(locale, 'dialog.create.title'),
      buttonLabel: mt(locale, 'dialog.create.button'),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const safeName = name.replace(/[/\\:*?"<>|]/g, '_').trim() || 'NewConte';
    const projectDir = path.join(result.filePaths[0], safeName);
    fs.mkdirSync(projectDir, { recursive: true });
    currentProjectDir = projectDir;
    // 新規プロジェクト作成で File→Print を有効化
    if (mainWindow) createMenu(mainWindow, locale, true);
    return { name: safeName };
  });

  // atomic write (tmp + rename)。書き込み先は現在のプロジェクトフォルダ内に限定する
  ipcMain.handle('storage:write-file', (_event, name: string, data: string | Uint8Array) => {
    if (!currentProjectDir) throw new Error('No project directory');
    if (name.includes('/') || name.includes('\\') || name.includes('..')) throw new Error(`Invalid file name: ${name}`);
    const target = path.join(currentProjectDir, name);
    const tmp = target + '.tmp';
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
    recentOwnWrites.set(name, Date.now());
    fs.writeFileSync(tmp, buffer);
    fs.renameSync(tmp, target);
  });

  // 孤立 PSD の掃除。プロジェクトフォルダ内に限定し、存在しなければ無視する（ベストエフォート）
  ipcMain.handle('storage:delete-file', (_event, name: string) => {
    if (!currentProjectDir) return;
    if (name.includes('/') || name.includes('\\') || name.includes('..')) throw new Error(`Invalid file name: ${name}`);
    const target = path.join(currentProjectDir, name);
    try {
      fs.rmSync(target, { force: true });
    } catch {
      // 削除不可は無視
    }
  });

  // プロジェクトフォルダ内のファイル名変更（並べ替えの PSD リネーム）。
  // from/to の双方をパストラバーサル検証し、フォルダ内に限定する。
  // fs.renameSync は from 名でも watch イベントを発火するため、from/to 双方の自己 watch を抑止する。
  ipcMain.handle('storage:rename-file', (_event, from: string, to: string) => {
    if (!currentProjectDir) throw new Error('No project directory');
    if (from.includes('/') || from.includes('\\') || from.includes('..')) throw new Error(`Invalid file name: ${from}`);
    if (to.includes('/') || to.includes('\\') || to.includes('..')) throw new Error(`Invalid file name: ${to}`);
    recentOwnWrites.set(from, Date.now());
    recentOwnWrites.set(to, Date.now());
    fs.renameSync(path.join(currentProjectDir, from), path.join(currentProjectDir, to));
  });

  ipcMain.handle('paint:open', (_event, psdName: string) => {
    if (!currentProjectDir) return { ok: false, error: 'No project directory' };
    if (psdName.includes('/') || psdName.includes('\\') || psdName.includes('..')) {
      return { ok: false, error: 'Invalid file name' };
    }
    return openInPaintApp(path.join(currentProjectDir, psdName));
  });

  ipcMain.handle('storage:exists', (_event, name: string) => {
    if (!currentProjectDir) return false;
    return fs.existsSync(path.join(currentProjectDir, name));
  });

  ipcMain.handle('settings:load', () => loadSettings());

  ipcMain.handle('settings:save', (_event, settings: AppSettings) => saveSettings(settings));

  ipcMain.handle('settings:detect-paint', () => findPaintApp());

  // 言語・テーマ変更を main に反映: ネイティブテーマ切替 + メニュー再構築（ライブ更新）
  ipcMain.handle('app:apply-settings', (_event, language: MenuLocale, theme: 'light' | 'dark' | 'system') => {
    nativeTheme.themeSource = theme;
    if (mainWindow) createMenu(mainWindow, language, currentProjectDir !== null);
  });

  ipcMain.handle('dialog:select-file', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: mt(resolveLocale(), 'dialog.selectPaintApp.title'),
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // --- git バージョン管理（Electron 専用・上級者向けオプション） ---
  // detect は dir 不要。それ以外は既存 storage と同方針で currentProjectDir を使う。
  ipcMain.handle('git:detect', () => detect());

  ipcMain.handle('git:is-repo', () => {
    if (!currentProjectDir) return false;
    return isRepo(currentProjectDir);
  });

  ipcMain.handle('git:init', () => {
    if (!currentProjectDir) throw new Error('No project directory');
    return initRepo(currentProjectDir);
  });

  ipcMain.handle('git:status', () => {
    if (!currentProjectDir) throw new Error('No project directory');
    return status(currentProjectDir);
  });

  ipcMain.handle('git:commit', (_event, message: string) => {
    if (!currentProjectDir) throw new Error('No project directory');
    return commit(currentProjectDir, message);
  });

  ipcMain.handle('git:log-latest', () => {
    if (!currentProjectDir) throw new Error('No project directory');
    return logLatest(currentProjectDir);
  });
};

const createWindow = () => {
  const boundsInfo = tryBoundsInfo(1200, 800);
  const win = new BrowserWindow({
    titleBarStyle: 'hiddenInset',
    width: boundsInfo.width,
    height: boundsInfo.height,
    x: boundsInfo.x,
    y: boundsInfo.y,
    minWidth: 1024,
    minHeight: 768,
    frame,
    fullscreenable,
    autoHideMenuBar,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#252525' : '#FAFAFA',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });
  mainWindow = win;

  // electron-vite: dev 時はレンダラの dev サーバ URL が渡される
  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (rendererUrl) {
    win.loadURL(rendererUrl);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (process.platform !== 'darwin') {
    win.on('maximize', () => win.webContents.send('maximized'));
    win.on('unmaximize', () => win.webContents.send('unMaximized'));
    win.on('resized', () => {
      if (win.isMaximized()) return;
      win.webContents.send('resized');
    });
    win.on('focus', () => win.webContents.send('get-focus'));
    win.on('blur', () => win.webContents.send('get-blur'));
  }

  win.on('close', () => {
    fs.writeFileSync(infoPath, JSON.stringify(win.getBounds()));
  });
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
  createMenu(win);
};

app.whenReady().then(() => {
  // 永続テーマをネイティブにも反映（ウインドウchrome を起動時から一致させる）
  const savedTheme = loadSettings().theme;
  nativeTheme.themeSource = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'system';
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
