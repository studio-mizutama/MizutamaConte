import { app, Menu, MenuItemConstructorOptions, ipcMain, BrowserWindow } from 'electron';

export const createMenu = (win: BrowserWindow) => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Mizutama Conte',
      submenu: [
        {
          label: 'about',
        },
        {
          label: 'Quit Mizutama Conte',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open..',
          accelerator: 'CmdOrCtrl+O',
          // フォルダ選択と読み込みはレンダラ起点（project:open）で行う
          click: () => win.webContents.send('menu:open-project'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => win.reload(),
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  if (process.platform !== 'darwin') {
    ipcMain.removeAllListeners('show-context-menu');
    ipcMain.on('show-context-menu', () => menu.popup());
  }
};
