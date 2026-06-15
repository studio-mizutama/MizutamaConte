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

  // 絵コンテ本体（シーン帯・行挿入・行追加）
  'conte.scene.expand': 'Expand scene',
  'conte.scene.collapse': 'Collapse scene',
  'conte.scene.titleAriaLabel': 'Scene {n} title',
  'conte.scene.untitledPlaceholder': '(Untitled scene)',
  'conte.scene.removeBreak': 'Remove scene break',
  'conte.gutterAria': 'Insert layer into cut {n}',
  'conte.insertLayerAria': 'Insert new layer',
  'conte.newLayer': 'New Layer',
  'conte.newCut': 'New CUT',
  'conte.newScene': 'New Scene',
  'conte.merge': 'Merge adjacent CUTs',
  'conte.mergeAria': 'Merge cut {n} with next',

  // カット行
  'cutRow.resizeAria': 'Resize cut {n}',
  'cutRow.splitAria': 'Split last layer of cut {n}',
  'cutRow.splitTooltip': 'Split last layer into a new CUT',
  'cutRow.openHint': 'Double-click {name} to open in paint app',
  'cutRow.launchFailed': 'Could not launch paint app: {error}',
  'cutRow.webEditHint': 'Edit {name} in your local paint app.\nReopen the project after saving to apply changes.',

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

  // ツール（モードトグル。ショートカット S/C/R/G。CUT/SCENE は英語固定）
  'toolGroup.edit': 'Edit (S)',
  'toolGroup.resize': 'Resize (C)',
  'toolGroup.reorderCut': 'Reorder CUT (R)',
  'toolGroup.reorderScene': 'Reorder SCENE (G)',

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
} as const;

export type TranslationKey = keyof typeof en;
