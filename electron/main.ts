import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { createMenu } from './menu';
import { openInPaintApp } from './paint';

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

  ipcMain.handle('project:create', async (_event, defaultName: string) => {
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'New Project',
      defaultPath: defaultName,
      buttonLabel: 'Create',
      properties: ['createDirectory'],
    });
    if (result.canceled || !result.filePath) return null;
    fs.mkdirSync(result.filePath, { recursive: true });
    currentProjectDir = result.filePath;
    return { name: path.basename(result.filePath) };
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
