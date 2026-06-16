import { useEffect, setGlobal } from 'reactn';
import { useHotkeys } from 'react-hotkeys-hook';
import { canUndo, canRedo, setHistoryListener } from 'history/undoManager';
import { useUndoRedoControls } from 'hooks/useUndoRedoControls';

/**
 * Undo/Redo を App レベルで 1 回だけマウントするフック。
 * - 操作の実体（doUndo/doRedo）は useUndoRedoControls に集約（UI ボタン等からも再利用可）
 * - ⌘Z/⌘⇧Z（Win は Ctrl+Y も）を登録。preventDefault で Electron ネイティブ undo の二重発火を防ぐ
 * - テキスト欄内の ⌘Z は react-hotkeys-hook 既定（フォーム要素では発火しない）によりブラウザ標準の文字 undo に委譲
 * - undo は setProject(prevSnapshot)。autosave がそのまま JSON 永続化する
 * - 再入ガードは applyingGuard（モジュールスコープ）で複数マウント間共有
 */
export const useUndoRedo = (): void => {
  const { doUndo, doRedo } = useUndoRedoControls();

  // canUndo/canRedo をグローバルへ同期する
  useEffect(() => {
    setHistoryListener(() => setGlobal({ canUndo: canUndo(), canRedo: canRedo() }));
    return () => setHistoryListener(null);
  }, []);

  // react-hotkeys-hook 3.x は 'mod' 非対応のため command/ctrl を明示（既存 ⌘S 実装と同じ流儀）
  useHotkeys(
    'command+z,ctrl+z',
    (event) => {
      event.preventDefault();
      void doUndo();
    },
    [],
  );
  useHotkeys(
    'command+shift+z,ctrl+shift+z,ctrl+y',
    (event) => {
      event.preventDefault();
      void doRedo();
    },
    [],
  );

  // doUndo/doRedo は live global state + 安定セッターのみ参照する state-free クロージャ。
  // deps を足して毎レンダー再購読しないこと（[] のままが正しい）。
  // Electron Edit メニュー（menu:undo / menu:redo）。Web では api 不在で no-op
  useEffect(() => {
    const api = window.api;
    if (!api) return;
    api.onUndoRequest(() => void doUndo());
    api.onRedoRequest(() => void doRedo());
    return () => {
      api.removeUndoRequest();
      api.removeRedoRequest();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
