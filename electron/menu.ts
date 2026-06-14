import { app, Menu, MenuItemConstructorOptions, ipcMain, BrowserWindow } from 'electron';
import { mt, resolveLocale, MenuLocale } from './i18n';

/** アプリケーションメニューを構築する。ラベルは locale（未指定時は settings から解決）でローカライズ。 */
export const createMenu = (win: BrowserWindow, locale: MenuLocale = resolveLocale()) => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Mizutama Conte',
      submenu: [
        {
          label: mt(locale, 'menu.about'),
          role: 'about',
        },
        {
          label: mt(locale, 'menu.preferences'),
          accelerator: 'CmdOrCtrl+.',
          // 設定ダイアログをレンダラ側で開く
          click: () => win.webContents.send('menu:open-settings'),
        },
        { type: 'separator' },
        {
          label: mt(locale, 'menu.quit'),
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: mt(locale, 'menu.file'),
      submenu: [
        {
          label: mt(locale, 'menu.new'),
          accelerator: 'CmdOrCtrl+N',
          // 新規プロジェクトダイアログをレンダラ側で開く
          click: () => win.webContents.send('menu:new-project'),
        },
        {
          label: mt(locale, 'menu.open'),
          accelerator: 'CmdOrCtrl+O',
          // フォルダ選択と読み込みはレンダラ起点（project:open）で行う
          click: () => win.webContents.send('menu:open-project'),
        },
      ],
    },
    {
      label: mt(locale, 'menu.view'),
      submenu: [
        {
          label: mt(locale, 'menu.reload'),
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
