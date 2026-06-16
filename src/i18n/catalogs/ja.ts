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
  'header.menu.reload': '再読み込み',
  'header.share.ariaLabel': '共有',
  'header.settings.ariaLabel': '設定',
  'header.share.pdf': '絵コンテ印刷',
  'header.share.video': '動画エクスポート',

  // ヘッダーメニュー（ウインドウ上部メニューバー / ハンバーガー用）
  'header.menu.file': 'ファイル',
  'header.menu.edit': '編集',
  'header.menu.help': 'ヘルプ',
  'header.menu.documentation': 'ドキュメント',
  'header.menu.about': 'Mizutama Conte について',

  // 絵コンテ本体
  'conte.scene.expand': 'シーンを展開',
  'conte.scene.collapse': 'シーンを折りたたむ',
  'conte.scene.titleAriaLabel': 'シーン{n} のタイトル',
  'conte.scene.untitledPlaceholder': '（無題シーン）',
  'conte.scene.removeBreak': 'シーン区切りを解除',
  'conte.newCut': 'CUT を追加',

  // カット行
  'cutRow.resizeAria': 'CUT {n} をリサイズ',
  'cutRow.splitAria': 'CUT {n} の最終レイヤーを分離',
  'cutRow.splitTooltip': '最終レイヤーを別 CUT に分離',
  'cutRow.openHint': '{name} をダブルクリックでペイントアプリで開く',
  'cutRow.launchFailed': 'ペイントアプリを起動できませんでした: {error}',
  'cutRow.webEditHint': '{name} をローカルのペイントアプリで編集してください。\n保存後にプロジェクトを開き直すと反映されます。',
  // CUT 列下部のアイコンクラスタ（per-cut 操作）
  'cutRow.insertTooltip': '下にCUTを追加',
  'cutRow.insertAria': 'CUT {n} の下に CUT を挿入',
  'cutRow.addLayerTooltip': '新規レイヤー',
  'cutRow.addLayerAria': 'CUT {n} にレイヤーを追加',
  'cutRow.deleteTooltip': 'CUT を削除',
  'cutRow.deleteAria': 'CUT {n} を削除',
  'cutRow.deleteConfirm.title': 'CUT を削除',
  'cutRow.deleteConfirm.body': 'CUT {n} を削除しますか？',
  'cutRow.deleteConfirm.confirm': '削除',
  'cutRow.deleteConfirm.cancel': 'キャンセル',
  'cutRow.mergeTooltip': '下の CUT と結合',
  'cutRow.mergeAria': 'CUT {n} を下と結合',
  'cutRow.sceneBreakTooltip': 'シーン区切りを追加',
  'cutRow.sceneBreakAria': 'CUT {n} のシーン区切りを切り替え',

  // カメラワーク
  'cameraWork.swapScale': 'Scale を In/Out 入替',
  'cameraWork.swapPosX': 'Pos X を In/Out 入替',
  'cameraWork.swapPosY': 'Pos Y を In/Out 入替',

  // パネル見出し
  'panels.transition': 'トランジション',
  'panels.cameraWork': 'カメラワーク',
  'panels.outline': 'アウトライン',
  'panels.duration': 'デュレーション',
  'panels.dialogue': 'セリフ',

  // ツール（タブの「編集」と被らないよう既定ツールのラベルは「選択」にする）
  'toolGroup.edit': '選択 (V)',
  'toolGroup.resize': 'リサイズ (C)',
  'toolGroup.reorder': '並べ替え (R)',
  'toolGroup.undo': '元に戻す',
  'toolGroup.redo': 'やり直す',

  // トランジション（全ロケール英語固定。パネル見出しは別キー panels.* で日本語のまま）
  'transition.fadeIn': 'Fade In',
  'transition.fadeOut': 'Fade Out',
  'transition.duration': 'Duration',
  'transition.fade.none': 'None',
  'transition.fade.whiteIn': 'White In',
  'transition.fade.blackIn': 'Black In',
  'transition.fade.whiteOut': 'White Out',
  'transition.fade.blackOut': 'Black Out',
  'transition.fade.cross': 'Cross',

  // Duration パネル
  'duration.label': 'Cut{cut} 尺 · {sec}秒 @ {fps}fps',
  'duration.ariaLabel': 'デュレーション',

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
  // バージョン管理 (git)
  'git.enableLabel': 'バージョン管理 (git) を有効にする',
  'git.help.ariaLabel': 'git セットアップのヘルプ',
  'git.help.uninstalled.heading': 'git / git-lfs が見つかりません',
  'git.help.uninstalled.body': 'git と git-lfs をインストールし、アプリを再起動するとバージョン管理が使えます。',
  'git.help.copy': 'コピー',
  'git.help.copied': 'コピーしました',
  'git.help.restartNote': '※ インストール後はアプリを再起動してください。',
  'git.snapshot.heading': 'バージョン管理',
  'git.snapshot.lastSnapshot': '前回スナップショット: {time}',
  'git.snapshot.never': 'スナップショットはまだありません',
  'git.snapshot.dirty': '変更あり ●',
  'git.snapshot.clean': '変更なし',
  'git.snapshot.messageLabel': 'メッセージ（任意）',
  'git.snapshot.messagePlaceholder': 'snapshot {time}',
  'git.snapshot.create': 'スナップショットを作成',
  'git.snapshot.creating': '作成中…',
  'git.snapshot.done': 'スナップショットを作成しました',
  'git.snapshot.cliNote': '※ 履歴の閲覧・復元は CLI（git log / git restore）で行います。',
  'git.init.start': 'git 管理を開始',
  'git.init.starting': '初期化中…',
  'git.init.notRepo': 'このプロジェクトはまだバージョン管理されていません。',
  // 動画書き出し
  'videoExport.title': '動画を書き出す',
  'videoExport.quality.label': '品質',
  'videoExport.quality.high': '高',
  'videoExport.quality.medium': '中',
  'videoExport.start': '書き出し',
  'videoExport.encoding': '動画を書き出し中…',
  'videoExport.frameCount': 'フレーム {frame} / {total}',
  'videoExport.error': '書き出しに失敗しました。この環境は動画エンコード（H.264）に未対応の可能性があります。',

  // About ダイアログ
  'about.tab.about': '概要',
  'about.tab.licenses': 'ライセンス',
  'about.licenses.empty': 'このビルドにはライセンス表記が同梱されていません。',
  'about.close': '閉じる',

  // 空状態（プロジェクト未オープン）
  'empty.title': 'プロジェクトが開かれていません',
  'empty.body': '新規に絵コンテを作成するか、既存ファイルを開いてください。',
  'empty.drop': 'またはフォルダをここにドラッグ＆ドロップ',
};
