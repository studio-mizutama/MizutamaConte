import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import * as fs from 'fs';

const info_path = path.join(app.getPath('userData'), 'bounds-info.json');

let bounds_info: { width: number; height: number; x?: number; y?: number };
try {
  bounds_info = JSON.parse(fs.readFileSync(info_path, 'utf8'));
} catch (e) {
  bounds_info = { width: 1200, height: 800 };
}

function createWindow() {
  const win = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: bounds_info.width,
    height: bounds_info.height,
    x: bounds_info.x,
    y: bounds_info.y,
    webPreferences: {
      // contextIsolation: false,
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
  win.on('close', () => {
    fs.writeFileSync(info_path, JSON.stringify(win.getBounds()));
  });
}

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
