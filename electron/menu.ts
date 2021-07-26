import { app, Menu, dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import { Cut } from './@types/cut';
import { win } from './main';

export const createMenu = () => {
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
            openFile();
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
};

const openFile = () => {
  const filePaths = dialog.showOpenDialogSync({ properties: ['openDirectory'] });
  if (!filePaths) return;
  const files = fs.readdirSync(filePaths[0]);
  const psdFiles = files.filter((file) => file.indexOf('.psd') !== -1);
  //console.log(psdFiles);
  const jsonFile = files.filter((file) => file.indexOf('.json') !== -1)![0];

  const buffurs: Buffer[] = psdFiles.map((file) => fs.readFileSync(filePaths[0] + '/' + file));

  const conteString = fs.readFileSync(filePaths![0] + '/' + jsonFile, 'utf8');

  const conteObject: Cut[] = JSON.parse(conteString);
  ipcMain.removeHandler('load-psd');
  ipcMain.removeHandler('load-json');
  ipcMain.removeHandler('load-file-name');

  ipcMain.handle('load-psd', () => buffurs);
  ipcMain.handle('load-json', () => conteObject);
  ipcMain.handle('load-file-name', () => jsonFile);
  win.reload();
};
