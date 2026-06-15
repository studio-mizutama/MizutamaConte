import { TranslationKey } from './en';

/** 日本語カタログ。en と同じキー集合を満たす必要がある（型で強制）。 */
export const ja: Record<TranslationKey, string> = {
  // 共通
  'common.cancel': 'キャンセル',
  'common.save': '保存',
  'common.loading.heading': '読み込み中...',
  'common.loading.ariaLabel': '読み込み中…',

  // ヘッダー
  'header.tab.edit': '編集',
  'header.tab.preview': 'プレビュー',
  'header.save.readOnly': '読み取り専用',
  'header.save.dirty': '未保存',
  'header.save.saving': '保存中…',
  'header.save.saved': '保存済み',
  'header.save.error': '⚠ 保存エラー',
  'header.menu.ariaLabel': 'メニュー',
  'header.menu.new': '新規',
  'header.menu.open': '開く',

  // 絵コンテ本体
  'conte.scene.expand': 'シーンを展開',
  'conte.scene.collapse': 'シーンを折りたたむ',
  'conte.scene.titleAriaLabel': 'シーン{n} のタイトル',
  'conte.scene.untitledPlaceholder': '（無題シーン）',
  'conte.scene.removeBreak': 'シーン区切りを解除',
  'conte.gutterAria': 'CUT {n} にレイヤーを挿入',
  'conte.insertLayerAria': '新規レイヤーを挿入',
  'conte.newLayer': '新規レイヤー',
  'conte.newCut': 'CUT を追加',
  'conte.newScene': '新規シーン',
  'conte.merge': '上下の CUT を結合',
  'conte.mergeAria': 'CUT {n} を下と結合',

  // カット行
  'cutRow.resizeAria': 'CUT {n} をリサイズ',
  'cutRow.splitAria': 'CUT {n} の最終レイヤーを分離',
  'cutRow.splitTooltip': '最終レイヤーを別 CUT に分離',
  'cutRow.openHint': '{name} をダブルクリックでペイントアプリで開く',
  'cutRow.launchFailed': 'ペイントアプリを起動できませんでした: {error}',
  'cutRow.webEditHint': '{name} をローカルのペイントアプリで編集してください。\n保存後にプロジェクトを開き直すと反映されます。',

  // カメラワーク
  'cameraWork.swapScale': 'Scale を In/Out 入替',
  'cameraWork.swapPosX': 'Pos X を In/Out 入替',
  'cameraWork.swapPosY': 'Pos Y を In/Out 入替',

  // パネル見出し
  'panels.transition': 'トランジション',
  'panels.cameraWork': 'カメラワーク',
  'panels.outline': 'アウトライン',
  'panels.duration': '尺',
  'panels.dialogue': '台詞',

  // ツール
  'toolGroup.edit': '編集 (S)',
  'toolGroup.resize': 'リサイズ (C)',
  'toolGroup.reorderCut': 'CUT 並べ替え (R)',
  'toolGroup.reorderScene': 'SCENE 並べ替え (G)',

  // トランジション
  'transition.fadeIn': 'フェードイン',
  'transition.fadeOut': 'フェードアウト',
  'transition.duration': '尺',
  'transition.fade.none': 'なし',
  'transition.fade.whiteIn': 'ホワイトイン',
  'transition.fade.blackIn': 'ブラックイン',
  'transition.fade.whiteOut': 'ホワイトアウト',
  'transition.fade.blackOut': 'ブラックアウト',
  'transition.fade.cross': 'クロス',

  // Duration パネル
  'duration.label': 'Cut{cut} 尺 · {sec}秒 @ {fps}fps',
  'duration.ariaLabel': '尺',

  // 設定ダイアログ
  'settings.title': '設定',
  'settings.section.appearance': '表示',
  'settings.language.label': '言語',
  'settings.theme.label': 'テーマ',
  'settings.theme.system': 'システム',
  'settings.theme.light': 'ライト',
  'settings.theme.dark': 'ダーク',
  'settings.section.project': 'プロジェクト',
  'settings.project.resolutionAspect': '解像度: {resolution} ／ アスペクト比: {aspect}',
  'settings.project.frameFps': 'フレーム: {width} × {height} ／ fps: {fps}',
  'settings.project.note': '※ 解像度・アスペクト比は新規作成時に指定します（既存プロジェクトでは変更できません）',
  'settings.section.paintApp': 'お絵描きアプリ',
  'settings.paintApp.modeLabel': '起動方法',
  'settings.paintApp.mode.auto': '自動（インストール済みを検出）',
  'settings.paintApp.mode.custom': '手動指定',
  'settings.paintApp.pathLabel': 'アプリのパス',
  'settings.paintApp.browse': '参照…',
  'settings.paintApp.detect': 'インストール済みを検出',
  'settings.paintApp.noneDetected': 'なし（OS既定アプリで開きます）',

  // 新規プロジェクトダイアログ
  'newProject.title': '新規プロジェクト',
  'newProject.titleLabel': 'タイトル',
  'newProject.resolutionLabel': '解像度',
  'newProject.aspectLabel': 'アスペクト比',
  'newProject.create': '作成',
};
