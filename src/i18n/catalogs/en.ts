/** 英語カタログ。これがキーの正本（TranslationKey はこの object から導出）。
 *  値中の {name} はパラメータ展開、\n は改行。
 *  全大文字タイトル(CUT/PICTURE/ACTION/DIALOGUE/TIME/IN/OUT/SCENE)や技術トークン
 *  (SD/HD/FHD/2K/4K, 4:3, fps, 数値)・ブランド名は意図的に t() を通さずハードコードのまま。 */
export const en = {
  // 共通
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.loading.heading': 'Now Loading...',
  'common.loading.ariaLabel': 'Loading…',

  // ヘッダー
  'header.tab.edit': 'Edit',
  'header.tab.preview': 'Preview',
  'header.save.readOnly': 'Read-only',
  'header.save.dirty': 'Unsaved',
  'header.save.saving': 'Saving…',
  'header.save.saved': 'Saved',
  'header.save.error': '⚠ Save error',
  'header.menu.ariaLabel': 'Menu',
  'header.menu.new': 'New',
  'header.menu.open': 'Open',
  'header.share.ariaLabel': 'Share',
  'header.settings.ariaLabel': 'Settings',
  'header.share.pdf': 'Print Storyboard',
  'header.share.video': 'Export Video',

  // ヘッダーメニュー（ウインドウ上部メニューバー / ハンバーガー用）
  'header.menu.file': 'File',
  'header.menu.edit': 'Edit',
  'header.menu.help': 'Help',
  'header.menu.documentation': 'Documentation',
  'header.menu.about': 'About Mizutama Conte',

  // 絵コンテ本体（シーン帯・行挿入・行追加）
  'conte.scene.expand': 'Expand scene',
  'conte.scene.collapse': 'Collapse scene',
  'conte.scene.titleAriaLabel': 'Scene {n} title',
  'conte.scene.untitledPlaceholder': '(Untitled scene)',
  'conte.scene.removeBreak': 'Remove scene break',
  'conte.newCut': 'New CUT',

  // カット行
  'cutRow.resizeAria': 'Resize cut {n}',
  'cutRow.splitAria': 'Split last layer of cut {n}',
  'cutRow.splitTooltip': 'Split last layer into a new CUT',
  'cutRow.openHint': 'Double-click {name} to open in paint app',
  'cutRow.launchFailed': 'Could not launch paint app: {error}',
  'cutRow.webEditHint': 'Edit {name} in your local paint app.\nReopen the project after saving to apply changes.',
  // CUT 列下部のアイコンクラスタ（per-cut 操作）
  'cutRow.insertTooltip': 'Insert CUT below',
  'cutRow.insertAria': 'Insert a CUT below cut {n}',
  'cutRow.addLayerTooltip': 'New Layer',
  'cutRow.addLayerAria': 'Add a layer to cut {n}',
  'cutRow.deleteTooltip': 'Delete CUT',
  'cutRow.deleteAria': 'Delete cut {n}',
  'cutRow.deleteConfirm.title': 'Delete CUT',
  'cutRow.deleteConfirm.body': 'Delete CUT {n}?',
  'cutRow.deleteConfirm.confirm': 'Delete',
  'cutRow.deleteConfirm.cancel': 'Cancel',
  'cutRow.mergeTooltip': 'Merge with CUT below',
  'cutRow.mergeAria': 'Merge cut {n} with next',
  'cutRow.sceneBreakTooltip': 'Toggle scene break',
  'cutRow.sceneBreakAria': 'Toggle scene break at cut {n}',

  // カメラワーク（Scale/Pos/In/Out トークンは英語固定。スワップ動作の語のみ翻訳）
  'cameraWork.swapScale': 'Swap Scale In/Out',
  'cameraWork.swapPosX': 'Swap Pos X In/Out',
  'cameraWork.swapPosY': 'Swap Pos Y In/Out',

  // パネル見出し（DIALOGUE 列タイトルとは別物）
  'panels.transition': 'Transition',
  'panels.cameraWork': 'Camera Work',
  'panels.outline': 'Outline',
  'panels.duration': 'Duration',
  'panels.dialogue': 'Dialogue',

  // ツール（モードトグル。ショートカット V/C/R。CUT/SCENE は英語固定）
  // 'toolGroup.edit' はタブの "Edit" と被らないよう表示ラベルは "Select" にする
  'toolGroup.edit': 'Select (V)',
  'toolGroup.resize': 'Resize (C)',
  'toolGroup.reorder': 'Reorder (R)',
  'toolGroup.undo': 'Undo',
  'toolGroup.redo': 'Redo',

  // トランジション（Picker の key='None'|'White In'... は保存データなので英語固定。表示のみ翻訳）
  'transition.fadeIn': 'Fade In',
  'transition.fadeOut': 'Fade Out',
  'transition.duration': 'Duration',
  'transition.fade.none': 'None',
  'transition.fade.whiteIn': 'White In',
  'transition.fade.blackIn': 'Black In',
  'transition.fade.whiteOut': 'White Out',
  'transition.fade.blackOut': 'Black Out',
  'transition.fade.cross': 'Cross',

  // Duration パネル（Cut/fps トークンは英語固定。'duration'・単位のみ翻訳）
  'duration.label': 'Cut{cut} duration · {sec}s @ {fps}fps',
  'duration.ariaLabel': 'Duration',

  // 設定ダイアログ
  'settings.title': 'Settings',
  'settings.section.appearance': 'Appearance',
  'settings.language.label': 'Language',
  'settings.theme.label': 'Theme',
  'settings.theme.system': 'System',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.section.project': 'Project',
  'settings.project.resolutionAspect': 'Resolution: {resolution} / Aspect ratio: {aspect}',
  'settings.project.frameFps': 'Frame: {width} × {height} / fps: {fps}',
  'settings.project.note': '* Resolution and aspect ratio are set when creating a project (they cannot be changed for an existing project).',
  'settings.section.paintApp': 'Paint app',
  'settings.paintApp.modeLabel': 'Launch method',
  'settings.paintApp.mode.auto': 'Auto (detect installed)',
  'settings.paintApp.mode.custom': 'Manual',
  'settings.paintApp.pathLabel': 'App path',
  'settings.paintApp.browse': 'Browse…',
  'settings.paintApp.detect': 'Detect installed',
  'settings.paintApp.noneDetected': 'None (opens with the OS default app)',

  // 新規プロジェクトダイアログ（fps ラベルは英語固定）
  'newProject.title': 'New Project',
  'newProject.titleLabel': 'Title',
  'newProject.resolutionLabel': 'Resolution',
  'newProject.aspectLabel': 'Aspect ratio',
  'newProject.create': 'Create',
  // バージョン管理 (git)（"git"/"LFS" などのトークンは英語固定）
  'git.enableLabel': 'Enable version control (git)',
  'git.help.ariaLabel': 'git setup help',
  'git.help.uninstalled.heading': 'git / git-lfs not found',
  'git.help.uninstalled.body': 'Install git and git-lfs, then restart the app to enable version control.',
  'git.help.copy': 'Copy',
  'git.help.copied': 'Copied',
  'git.help.restartNote': '* Restart the app after installing.',
  'git.snapshot.heading': 'Version control',
  'git.snapshot.lastSnapshot': 'Last snapshot: {time}',
  'git.snapshot.never': 'No snapshots yet',
  'git.snapshot.dirty': 'Changes pending ●',
  'git.snapshot.clean': 'No changes',
  'git.snapshot.messageLabel': 'Message (optional)',
  'git.snapshot.messagePlaceholder': 'snapshot {time}',
  'git.snapshot.create': 'Create snapshot',
  'git.snapshot.creating': 'Creating…',
  'git.snapshot.done': 'Snapshot created',
  'git.snapshot.cliNote': '* View history and restore from the CLI (git log / git restore).',
  'git.init.start': 'Start version control',
  'git.init.starting': 'Initializing…',
  'git.init.notRepo': 'This project is not under version control yet.',
  // 動画書き出し
  'videoExport.title': 'Export Video',
  'videoExport.quality.label': 'Quality',
  'videoExport.quality.high': 'High',
  'videoExport.quality.medium': 'Medium',
  'videoExport.start': 'Export',
  'videoExport.encoding': 'Exporting video…',
  'videoExport.frameCount': '{frame} / {total} frames',
  'videoExport.error': 'Export failed. This environment may not support H.264 video encoding.',

  // About ダイアログ
  'about.tab.about': 'About',
  'about.tab.licenses': 'Licenses',
  'about.licenses.empty': 'License notices are not bundled in this build.',
  'about.close': 'Close',

  // 空状態（プロジェクト未オープン）
  'empty.title': 'No project open',
  'empty.body': 'Create a new storyboard or open an existing one.',
} as const;

export type TranslationKey = keyof typeof en;
