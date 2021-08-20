import { app, Menu, dialog, ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { Cut } from './@types/cut';

export const createMenu = (win: BrowserWindow) => {
  const template = [
    {
      label: 'Mizutama Conte',
      submenu: [
        {
          label: 'about',
        },
        {
          label: 'Quit Mizutama Conte',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.exit(),
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open..',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openFile(win);
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            win.reload();
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  if (process.platform !== 'darwin') {
    ipcMain.on('show-context-menu', () => menu.popup());
  }
};

const openFile = (win: BrowserWindow) => {
  const filePaths = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
  if (!filePaths) return;
  const files = fs.readdirSync(filePaths[0]);
  const psdFiles = files.filter((file) => file.indexOf('.psd') !== -1);

  const jsonFile = files.filter((file) => file.indexOf('.json') !== -1)![0];

  const buffurs: Buffer[] = psdFiles.map((file) => fs.readFileSync(filePaths[0] + '/' + file));

  const conteString = fs.readFileSync(filePaths![0] + '/' + jsonFile, 'utf8');

  const conteObject: Cut[] = JSON.parse(conteString);

  ipcMain.handle('load-psd', () => buffurs);
  ipcMain.handle('load-json', () => conteObject);
  ipcMain.handle('load-file-name', () => jsonFile);
  win.reload();
};
