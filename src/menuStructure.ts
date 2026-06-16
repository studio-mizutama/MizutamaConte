// web ハンバーガーの単一ソース（Electron メニューと項目を揃える）
export type DocMenuItem = { key: string; labelKey: string };
export type DocMenuSection = { key: string; titleKey: string; items: DocMenuItem[] };
export const WEB_MENU: DocMenuSection[] = [
  {
    key: 'file',
    titleKey: 'header.menu.file',
    items: [
      { key: 'new', labelKey: 'header.menu.new' },
      { key: 'open', labelKey: 'header.menu.open' },
      { key: 'reload', labelKey: 'header.menu.reload' },
      { key: 'print', labelKey: 'header.share.pdf' },
      { key: 'video', labelKey: 'header.share.video' },
    ],
  },
  {
    key: 'edit',
    titleKey: 'header.menu.edit',
    items: [
      { key: 'undo', labelKey: 'toolGroup.undo' },
      { key: 'redo', labelKey: 'toolGroup.redo' },
    ],
  },
  {
    key: 'help',
    titleKey: 'header.menu.help',
    items: [
      { key: 'documentation', labelKey: 'header.menu.documentation' },
      { key: 'about', labelKey: 'header.menu.about' },
    ],
  },
];
