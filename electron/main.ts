import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import * as fs from 'fs';
import { createMenu } from './menu';

interface bounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

const info_path = path.join(app.getPath('userData'), 'bounds-info.json');

const tryBoundsInfo = (width: number, height: number): bounds => {
  try {
    return JSON.parse(fs.readFileSync(info_path, 'utf8')) as unknown as bounds;
  } catch (e) {
    return {
      width: width,
      height: height,
    };
  }
};

const bounds_info = tryBoundsInfo(1200, 800);

const frame = process.platform === 'darwin' ? true : false;
const fullscreenable = process.platform === 'darwin' ? true : false;
const autoHideMenuBar = process.platform === 'darwin' ? false : true;

const createWindow = () => {
  const win = new BrowserWindow({
    titleBarStyle: 'hiddenInset',
    width: bounds_info.width,
    height: bounds_info.height,
    x: bounds_info.x,
    y: bounds_info.y,
    minWidth: 1024,
    minHeight: 768,
    frame: frame,
    fullscreenable: fullscreenable,
    autoHideMenuBar: autoHideMenuBar,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#252525' : '#FAFAFA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3000/index.html');
  } else {
    // 'build/index.html'
    win.loadURL(`file://${__dirname}/../index.html`);
  }

  // Hot Reloading
  if (isDev) {
    // 'node_modules/.bin/electronPath'
    require('electron-reload')(__dirname, {
      electron: path.join(
        __dirname,
        '..',
        '..',
        'node_modules',
        '.bin',
        'electron' + (process.platform === 'win32' ? '.cmd' : ''),
      ),
      forceHardReset: true,
      hardResetMethod: 'exit',
    });
  }

  if (isDev) {
    win.webContents.openDevTools();
  }

  ipcMain.handle('load-platform', () => process.platform);

  ipcMain.handle('minimize', () => win.minimize());
  ipcMain.handle('maximize', () => win.maximize());
  ipcMain.handle('restore', () => win.unmaximize());
  ipcMain.handle('close', () => win.close());

  win.on('maximize', () => win.webContents.send('maximized'));
  win.on('unmaximize', () => win.webContents.send('unMaximized'));
  win.on('resized', () => {
    if (win.isMaximized()) return;
    win.webContents.send('resized');
  });
  win.on('focus', () => win.webContents.send('get-focus'));
  win.on('blur', () => win.webContents.send('get-blur'));

  win.on('close', () => {
    fs.writeFileSync(info_path, JSON.stringify(win.getBounds()));
  });
  createMenu(win);
};

app.whenReady().then(() => {
  // DevTools
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
